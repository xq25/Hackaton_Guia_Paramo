"""Genera el catálogo semilla de especies (GBIF + fotos de iNaturalist) que va dentro del APK.

Uso (necesita internet; correr DESPUÉS de generar_contenido.py):
    scripts/.venv/Scripts/python scripts/generar_catalogo.py            (Windows)
    scripts/.venv/Scripts/python scripts/generar_catalogo.py --sin-fotos   (solo datos, sin descargar imágenes)

Salidas:
    app/assets/catalogo.json                       EspecieCatalogo[]
    app/assets/imagenes/especies/<slug>.webp       480 px (cuadrada)
    app/assets/imagenes/especies/<slug>_mini.webp  160 px
    app/assets/imagenes/indice.ts                  require() de cada imagen (React Native no acepta require dinámico)

Reglas (docs/02-datos-y-contenido.md): solo fotos CC0 / CC BY / CC BY-NC, con autor y enlace; no se guardan
coordenadas de ocurrencias; ~1 petición por segundo a iNaturalist. Dueño: Dev A.
"""
from __future__ import annotations

import io
import json
import re
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

import yaml
from PIL import Image, ImageOps

RAIZ = Path(__file__).resolve().parent.parent
ASSETS = RAIZ / "app" / "assets"
IMAGENES = ASSETS / "imagenes"
ESPECIES_DIR = IMAGENES / "especies"
GBIF = "https://api.gbif.org/v1"
INAT = "https://api.inaturalist.org/v1"
AGENTE = "paramON-prototipo/0.1 (guia de paramo offline; hackaton)"

# Recuadro del sector norte (Brisas–Valle de las Tumbas), ver docs/referencia/gbif-nevados.md §5
SECTOR_NORTE = {"country": "CO", "decimalLatitude": "4.87,4.95", "decimalLongitude": "-75.39,-75.31"}
GRUPOS = {"planta": {"kingdomKey": 6}, "ave": {"classKey": 212}, "mamifero": {"classKey": 359}}
TOP_POR_GRUPO = 25
LICENCIAS = {"cc0": "CC0", "cc-by": "CC BY", "cc-by-nc": "CC BY-NC"}
CATEGORIAS = {"CR", "EN", "VU", "NT", "LC", "NE"}

# Cartas del álbum (modelo.ts → COLECCIONABLES_ESPECIE.imagen) → especie del catálogo.
# Mantener igual a CIENTIFICO_CARTA en app/src/juego/progreso.ts.
CARTAS = {
    "frailejon": "Espeletia hartwegiana",
    "pajonal": "Paramochloa effusa",
    "coral_paramo": "Andicolea colombiana",
    "condor": "Vultur gryphus",
    "danta": "Tapirus pinchaque",
    "periquito": "Bolborhynchus ferrugineifrons",
}

_ultimo_inat = 0.0


def pedir(url: str, params: dict | None = None, intentos: int = 3) -> dict:
    global _ultimo_inat
    if params:
        url += "?" + urllib.parse.urlencode(params)
    if url.startswith(INAT):
        espera = 1.1 - (time.time() - _ultimo_inat)
        if espera > 0:
            time.sleep(espera)
        _ultimo_inat = time.time()
    for intento in range(intentos):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": AGENTE, "Accept": "application/json"})
            with urllib.request.urlopen(req, timeout=60) as r:
                return json.load(r)
        except OSError as e:
            if intento == intentos - 1:
                raise
            print(f"  reintento ({e})")
            time.sleep(3 * (intento + 1))
    return {}


def slug(nombre: str) -> str:
    return re.sub(r"[^a-z0-9]+", "_", nombre.lower()).strip("_")


# ───────────────────────────── GBIF ─────────────────────────────

def mas_registradas(grupo: str) -> list[tuple[int, int]]:
    """(speciesKey, registros) de las especies más registradas del grupo en el sector norte."""
    datos = pedir(f"{GBIF}/occurrence/search", {**SECTOR_NORTE, **GRUPOS[grupo], "limit": 0,
                                                "facet": "speciesKey", "facetLimit": TOP_POR_GRUPO})
    facetas = (datos.get("facets") or [{}])[0].get("counts", [])
    return [(int(f["name"]), int(f["count"])) for f in facetas]


def registros_en_sector(clave: int) -> int:
    return int(pedir(f"{GBIF}/occurrence/search", {**SECTOR_NORTE, "taxonKey": clave, "limit": 0}).get("count", 0))


def ficha_gbif(clave: int) -> dict:
    return pedir(f"{GBIF}/species/{clave}")


def buscar_clave(nombre: str) -> int | None:
    m = pedir(f"{GBIF}/species/match", {"name": nombre, "strict": "true"})
    if m.get("matchType") in ("EXACT", "FUZZY") and m.get("rank") in ("SPECIES", "SUBSPECIES") and m.get("usageKey"):
        return int(m.get("acceptedUsageKey") or m["usageKey"])
    return None


def categoria_uicn(clave: int) -> str | None:
    try:
        datos = pedir(f"{GBIF}/species/{clave}/iucnRedListCategory")
    except OSError:
        return None
    codigo = datos.get("code")
    return codigo if codigo in CATEGORIAS else None


def nombre_comun_gbif(clave: int) -> str | None:
    datos = pedir(f"{GBIF}/species/{clave}/vernacularNames", {"limit": 100})
    for v in datos.get("results", []):
        if v.get("language") in ("spa", "es") and v.get("vernacularName"):
            return v["vernacularName"].strip().capitalize()
    return None


# ───────────────────────────── iNaturalist ─────────────────────────────

def autor_de(atribucion: str) -> str:
    m = re.match(r"\(c\)\s*([^,]+)", atribucion or "")
    return m.group(1).strip() if m else (atribucion or "desconocido").split(",")[0].strip()


def foto_inat(nombre: str) -> dict | None:
    """Primera foto del taxón con licencia permitida: {url, autor, licencia, enlace}."""
    datos = pedir(f"{INAT}/taxa", {"q": nombre, "rank": "species,subspecies", "per_page": 5})
    taxon = next((t for t in datos.get("results", []) if t.get("name", "").lower() == nombre.lower()), None)
    if not taxon:
        return None
    candidatas = [taxon.get("default_photo")] if taxon.get("default_photo") else []
    if not candidatas or candidatas[0].get("license_code") not in LICENCIAS:
        detalle = pedir(f"{INAT}/taxa/{taxon['id']}").get("results", [{}])[0]
        candidatas += [tp.get("photo") for tp in detalle.get("taxon_photos", []) if tp.get("photo")]
    for foto in candidatas:
        if foto and foto.get("license_code") in LICENCIAS and foto.get("medium_url"):
            return {
                "url": foto["medium_url"],
                "autor": foto.get("attribution_name") or autor_de(foto.get("attribution", "")),
                "licencia": LICENCIAS[foto["license_code"]],
                "enlace": f"https://www.inaturalist.org/photos/{foto['id']}",
            }
    return None


def guardar_imagen(url: str, nombre_slug: str) -> None:
    req = urllib.request.Request(url, headers={"User-Agent": AGENTE})
    with urllib.request.urlopen(req, timeout=60) as r:
        original = Image.open(io.BytesIO(r.read())).convert("RGB")
    ESPECIES_DIR.mkdir(parents=True, exist_ok=True)
    for lado, sufijo, calidad in ((480, "", 72), (160, "_mini", 70)):
        ImageOps.fit(original, (lado, lado), Image.LANCZOS).save(
            ESPECIES_DIR / f"{nombre_slug}{sufijo}.webp", "WEBP", quality=calidad, method=6)


# ───────────────────────────── índice de imágenes ─────────────────────────────

def escribir_indice() -> int:
    """Genera imagenes/indice.ts con todas las imágenes empaquetadas + alias de las cartas del álbum."""
    entradas: dict[str, str] = {}
    for archivo in sorted(IMAGENES.rglob("*.webp")):
        ruta = archivo.relative_to(IMAGENES).as_posix()
        entradas[ruta] = ruta
    for carta, cientifico in CARTAS.items():
        for sufijo in ("", "_mini"):
            destino = f"especies/{slug(cientifico)}{sufijo}.webp"
            if destino in entradas:
                entradas[f"especies/{carta}{sufijo}.webp"] = destino
    lineas = [
        "// ARCHIVO GENERADO por scripts/generar_catalogo.py — no editar a mano.",
        "// React Native no acepta require() dinámico: aquí se mapea cada ruta a su imagen empaquetada.",
        "export const IMAGENES: Record<string, number> = {",
        *[f"  '{clave}': require('./{destino}')," for clave, destino in sorted(entradas.items())],
        "};",
        "",
    ]
    (IMAGENES / "indice.ts").write_text("\n".join(lineas), encoding="utf-8", newline="\n")
    return len(entradas)


# ───────────────────────────── principal ─────────────────────────────

def main() -> int:
    sys.stdout.reconfigure(encoding="utf-8")
    con_fotos = "--sin-fotos" not in sys.argv
    mapeo = yaml.safe_load((RAIZ / "contenido" / "mapeo.yaml").read_text(encoding="utf-8"))
    contenido = json.loads((ASSETS / "contenido.json").read_text(encoding="utf-8"))
    estaciones_de: dict[str, list[str]] = {}
    for e in contenido["estaciones"]:
        for cientifico in e["especies"]:
            estaciones_de.setdefault(cientifico, []).append(e["id"])

    # 1. Especies del guion (mapeo.yaml) + las más registradas por grupo en el sector norte
    especies: dict[int, dict] = {}
    for m in mapeo["especies"]:
        clave = buscar_clave(m["cientifico"])
        if clave is None:
            print(f"aviso: GBIF no reconoce '{m['cientifico']}'; se omite")
            continue
        especies[clave] = {"nombreCientifico": m["cientifico"], "nombreComun": m["comun"], "grupo": m["grupo"], "registros": None}
    for grupo in GRUPOS:
        for clave, registros in mas_registradas(grupo):
            especies.setdefault(clave, {"nombreCientifico": None, "nombreComun": None, "grupo": grupo, "registros": None})
            especies[clave]["registros"] = registros
    print(f"{len(especies)} especies a procesar")

    # 2. Ficha GBIF, categoría UICN, nombre común y foto
    catalogo = []
    for n, (clave, e) in enumerate(especies.items(), start=1):
        ficha = ficha_gbif(clave)
        cientifico = e["nombreCientifico"] or ficha.get("canonicalName") or ficha.get("scientificName", "")
        if ficha.get("rank") not in ("SPECIES", "SUBSPECIES") or not cientifico:
            continue
        registro = {
            "gbifKey": clave,
            "nombreCientifico": cientifico,
            "nombreComun": e["nombreComun"] or nombre_comun_gbif(clave),
            "grupo": e["grupo"],
            "estacionIds": estaciones_de.get(cientifico, []),
            "categoriaAmenaza": categoria_uicn(clave),
            "registrosSector": e["registros"] if e["registros"] is not None else registros_en_sector(clave),
            "foto": None,
            "credito": None,
        }
        if con_fotos:
            foto = foto_inat(cientifico)
            if foto:
                try:
                    guardar_imagen(foto["url"], slug(cientifico))
                    registro["foto"] = f"especies/{slug(cientifico)}.webp"
                    registro["credito"] = {"autor": foto["autor"], "licencia": foto["licencia"],
                                           "enlace": foto["enlace"], "fuente": "iNaturalist"}
                except OSError as ex:
                    print(f"aviso: no se pudo descargar la foto de {cientifico}: {ex}")
        catalogo.append(registro)
        estado = "foto" if registro["foto"] else "sin foto"
        print(f"  [{n:>3}/{len(especies)}] {cientifico:<34} {registro['categoriaAmenaza'] or '-':<3} {estado}")

    # Primero las del guion (con estación), luego por registros
    catalogo.sort(key=lambda r: (not r["estacionIds"], -(r["registrosSector"] or 0), r["nombreCientifico"]))
    with (ASSETS / "catalogo.json").open("w", encoding="utf-8", newline="\n") as f:
        json.dump(catalogo, f, ensure_ascii=False, indent=2)
        f.write("\n")
    total_indice = escribir_indice()
    con_foto = sum(1 for r in catalogo if r["foto"])
    faltan = [c for c, n in CARTAS.items() if not any(r["nombreCientifico"] == n and r["foto"] for r in catalogo)]
    print(f"\nOK  catalogo.json: {len(catalogo)} especies, {con_foto} con foto · indice.ts: {total_indice} imágenes")
    if faltan:
        print(f"aviso: cartas del álbum sin foto: {', '.join(faltan)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
