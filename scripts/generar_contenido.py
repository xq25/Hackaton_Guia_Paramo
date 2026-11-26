"""Genera app/assets/contenido.json (PaqueteContenido) a partir de los guiones en Markdown.

Uso:
    scripts/.venv/Scripts/python scripts/generar_contenido.py      (Windows)
    scripts/.venv/bin/python scripts/generar_contenido.py          (macOS/Linux)

Entradas: contenido/mapeo.yaml + contenido/fuentes/*.md (+ contenido/fichas/*.json, opcional).
Salida:   app/assets/contenido.json. Sale con código 1 si la validación falla.
Dueño: Dev A. Ver docs/02-datos-y-contenido.md.
"""
from __future__ import annotations

import datetime as dt
import json
import re
import sys
import unicodedata
from dataclasses import dataclass, field
from pathlib import Path

import yaml

RAIZ = Path(__file__).resolve().parent.parent
CONTENIDO = RAIZ / "contenido"
SALIDA = RAIZ / "app" / "assets" / "contenido.json"

TEMAS = {"introduccion", "estacion", "glosario", "geologia", "glaciologia", "cultura",
         "biologia", "clima", "salud_altura", "buenas_practicas"}
NATURALEZAS = {"cientifico", "tradicion_oral", "dato_fechado", "seguridad", "norma"}
NIVELES = {"breve", "ampliado"}
PALABRAS_POR_FRAGMENTO = 130
TEMAS_CON_FECHA_AUTOMATICA = {"geologia", "glaciologia", "clima"}


# ───────────────────────────── utilidades ─────────────────────────────

def sin_tildes(texto: str) -> str:
    return "".join(c for c in unicodedata.normalize("NFD", texto) if unicodedata.category(c) != "Mn")


def normalizar(texto: str) -> str:
    return re.sub(r"\s+", " ", sin_tildes(texto).lower()).strip()


def limpiar_markdown(texto: str) -> str:
    texto = re.sub(r"\*{1,3}([^*]+?)\*{1,3}", r"\1", texto)
    texto = texto.replace("*", "")
    return re.sub(r"[ \t]+", " ", texto).strip()


def contar_palabras(texto: str) -> int:
    return len(texto.split())


def limpiar_encabezado(texto: str) -> str:
    return limpiar_markdown(texto).strip().rstrip(".:").strip()


# ───────────────────────────── lectura de bloques ─────────────────────────────

@dataclass
class Bloque:
    pagina: int
    encabezados: tuple[str, ...]          # del más general al más profundo
    tipo: str                             # parrafo | lista | tabla
    lineas: list[str] = field(default_factory=list)

    @property
    def crudo(self) -> str:
        return "\n".join(self.lineas)


RE_PAGINA = re.compile(r"<!--\s*Página\s+(\d+)\s*-->")
RE_ENCABEZADO = re.compile(r"^(#{1,6})\s+(.*)$")
RE_SUBTITULO = re.compile(r"^\*\*([^*]+?)\*\*:?\s*$")
RE_LISTA = re.compile(r"^\s*(?:[-*]|\d+\.)\s+")
RE_LEYENDA = re.compile(r"^\*(Tabla|Figura|Geoformas|Imagen)|tomad[oa] de", re.IGNORECASE)


def leer_bloques(ruta: Path) -> list[Bloque]:
    pagina = 0
    niveles: dict[int, str] = {}
    bloques: list[Bloque] = []
    actual: Bloque | None = None
    en_cita = False

    def cerrar():
        nonlocal actual
        if actual and actual.lineas:
            bloques.append(actual)
        actual = None

    def ruta_encabezados() -> tuple[str, ...]:
        return tuple(niveles[k] for k in sorted(niveles))

    for linea in ruta.read_text(encoding="utf-8").splitlines():
        texto = linea.rstrip()
        m = RE_PAGINA.search(texto)
        if m:
            cerrar()
            pagina = int(m.group(1))
            continue
        if not texto.strip():
            cerrar()
            en_cita = False
            continue
        if texto.lstrip().startswith(">"):        # Logos y transcripciones de figuras: no son guion
            cerrar()
            en_cita = True
            continue
        if en_cita:
            continue
        if re.fullmatch(r"\s*\d{1,3}\s*", texto):  # Números de página sueltos
            continue
        m = RE_ENCABEZADO.match(texto)
        if m:
            cerrar()
            nivel = len(m.group(1))
            niveles = {k: v for k, v in niveles.items() if k < nivel}
            niveles[nivel] = limpiar_encabezado(m.group(2))
            continue
        m = RE_SUBTITULO.match(texto.strip())
        if m:
            cerrar()
            niveles = {k: v for k, v in niveles.items() if k < 7}
            niveles[7] = limpiar_encabezado(m.group(1))
            continue
        if RE_LEYENDA.search(texto.strip()) and texto.strip().startswith("*"):
            continue
        tipo = "tabla" if texto.lstrip().startswith("|") else "lista" if RE_LISTA.match(texto) else "parrafo"
        if actual is None or (actual.tipo != tipo and not (actual.tipo == "lista" and texto.startswith(" "))):
            cerrar()
            actual = Bloque(pagina, ruta_encabezados(), tipo)
        actual.lineas.append(texto)
    cerrar()
    return unir_parrafos_partidos(bloques)


def unir_parrafos_partidos(bloques: list[Bloque]) -> list[Bloque]:
    """Une un párrafo que la marca de página cortó a la mitad (termina sin punto y sigue en minúscula)."""
    unidos: list[Bloque] = []
    for b in bloques:
        prev = unidos[-1] if unidos else None
        if (prev and prev.tipo == "parrafo" and b.tipo == "parrafo"
                and b.pagina == prev.pagina + 1
                and not re.search(r"[.!?:”\"»)]\s*$", prev.lineas[-1])
                and re.match(r"^[a-záéíóúñ(]", b.lineas[0].strip())):
            prev.lineas[-1] = prev.lineas[-1].rstrip() + " " + " ".join(l.strip() for l in b.lineas)
            continue
        unidos.append(b)
    return unidos


# ───────────────────────────── conversión de bloques a texto ─────────────────────────────

def filas_tabla(bloque: Bloque) -> list[list[str]]:
    filas = []
    for linea in bloque.lineas:
        celdas = [limpiar_markdown(c) for c in linea.strip().strip("|").split("|")]
        if all(re.fullmatch(r":?-{2,}:?", c.strip()) for c in celdas if c.strip()):
            continue
        filas.append(celdas)
    return filas


def texto_tabla(bloque: Bloque) -> str:
    filas = filas_tabla(bloque)
    if not filas:
        return ""
    cabecera, cuerpo = filas[0], filas[1:]
    if [normalizar(c) for c in cabecera[:2]] == ["caracteristica", "detalle"]:
        return "\n".join(f"{f[0]}: {f[1]}" for f in cuerpo if len(f) >= 2)
    return "\n".join("; ".join(f"{h}: {v}" for h, v in zip(cabecera, f)) for f in cuerpo)


def texto_bloque(bloque: Bloque) -> str:
    if bloque.tipo == "tabla":
        return texto_tabla(bloque)
    if bloque.tipo == "lista":
        items = []
        for linea in bloque.lineas:
            if RE_LISTA.match(linea):
                items.append(RE_LISTA.sub("", linea).strip())
            elif items:
                items[-1] += " " + linea.strip()
        return "\n".join("- " + limpiar_markdown(i) for i in items)
    return limpiar_markdown(" ".join(l.strip() for l in bloque.lineas))


def items_lista(bloque: Bloque) -> list[str]:
    return [l.lstrip("- ").strip() for l in texto_bloque(bloque).splitlines() if l.strip()]


def palabras_clave(crudo: str, extra: list[str]) -> list[str]:
    claves = [limpiar_markdown(m).strip(" .:,") for m in re.findall(r"\*\*([^*]{3,40}?)\*\*", crudo)]
    claves += re.findall(r"\*([A-Z][a-z]+ [a-z]{3,})\*", crudo)      # nombres científicos en cursiva
    claves += extra
    vistos, salida = set(), []
    for c in claves:
        clave = c.strip().lower()
        if clave and len(clave.split()) <= 4 and clave not in vistos:
            vistos.add(clave)
            salida.append(clave)
    return salida[:12]


def partir_texto(texto: str, maximo: int = PALABRAS_POR_FRAGMENTO) -> list[str]:
    """Parte un texto largo en trozos de ~maximo palabras: por líneas (listas, tablas) y luego por oraciones."""
    if contar_palabras(texto) <= maximo * 1.4:
        return [texto]
    piezas: list[str] = []
    for linea in texto.split("\n"):
        if contar_palabras(linea) > maximo:
            piezas += re.split(r"(?<=[.!?])\s+(?=[A-ZÁÉÍÓÚÑ¿¡\"“])", linea)
        else:
            piezas.append(linea)
    trozos, actual = [], ""
    for o in piezas:
        if actual and contar_palabras(actual) + contar_palabras(o) > maximo:
            trozos.append(actual.strip())
            actual = ""
        actual += ("\n" if actual and "\n" in texto else " ") + o
    if actual.strip():
        trozos.append(actual.strip())
    return trozos


# ───────────────────────────── reglas del mapeo ─────────────────────────────

class ErrorValidacion(Exception):
    pass


def regla_seccion(reglas: list[dict], guion: str, encabezados: tuple[str, ...]) -> dict | None:
    propias = [r for r in reglas if r["guion"] == guion]
    for encabezado in reversed(encabezados):
        for regla in propias:
            if re.search(regla["encabezado"], encabezado, re.IGNORECASE):
                return regla
    return None


def coincide(selector: dict, frag: dict) -> bool:
    return (frag["guionId"] == selector["guion"] and frag["pagina"] == selector["pagina"]
            and normalizar(selector["contiene"]) in normalizar(frag["texto"]))


def resolver(selector: dict, fragmentos: list[dict], todos: bool = False) -> list[str]:
    ids = [f["id"] for f in fragmentos if coincide(selector, f)]
    return ids if todos else ids[:1]


# ───────────────────────────── generación ─────────────────────────────

def generar(mapeo: dict) -> tuple[dict, list[str]]:
    avisos: list[str] = []
    estaciones = {e["id"]: e for e in mapeo["estaciones"]}
    fragmentos: list[dict] = []
    glosario: list[dict] = []
    datos_curiosos: dict[str, list[str]] = {e: [] for e in estaciones}
    nombres_tablas: dict[str, list[tuple[str, int]]] = {e: [] for e in estaciones}
    sin_regla: set[str] = set()

    for guion in mapeo["guiones"]:
        gid = guion["id"]
        bloques = leer_bloques(CONTENIDO / guion["archivo"])
        contador: dict[int, int] = {}

        def nuevo_id(pagina: int, sufijo: str = "") -> str:
            if sufijo:
                return f"{gid}-p{pagina}-{sufijo}"
            contador[pagina] = contador.get(pagina, 0) + 1
            return f"{gid}-p{pagina}-{contador[pagina]}"

        # Agrupar en secciones contiguas (misma página y mismos encabezados)
        secciones: list[list[Bloque]] = []
        for b in bloques:
            if secciones and secciones[-1][0].pagina == b.pagina and secciones[-1][0].encabezados == b.encabezados:
                secciones[-1].append(b)
            else:
                secciones.append([b])

        for seccion in secciones:
            primero = seccion[0]
            if not primero.encabezados:
                continue  # Portada antes del primer encabezado
            regla = regla_seccion(mapeo["secciones"], gid, primero.encabezados)
            if regla is None:
                sin_regla.add(f"{gid} p.{primero.pagina}: {' > '.join(primero.encabezados)}")
                continue
            if regla.get("omitir"):
                continue
            estacion = regla.get("estacion")
            base = {
                "guionId": gid, "estacionId": estacion, "tema": regla["tema"],
                "naturaleza": regla.get("naturaleza", "cientifico"), "nivel": regla.get("nivel", "breve"),
                "apto": regla.get("apto", True), "origen": "guion",
            }
            titulo = titulo_seccion(primero.encabezados, estacion, estaciones)
            extra = [estaciones[estacion]["nombre"].lower(), *[a.lower() for a in estaciones[estacion]["alias"]]] if estacion else []

            # Glosario: un término por párrafo
            if regla["tema"] == "glosario":
                for b in seccion:
                    m = re.match(r"^\*\*(.+?)\*\*\s*:?\s*(.*)$", b.crudo.strip(), re.DOTALL)
                    if b.tipo != "parrafo" or not m:
                        continue
                    termino = limpiar_markdown(m.group(1)).rstrip(":").strip()
                    definicion = limpiar_markdown(m.group(2).lstrip(": ").replace("\n", " "))
                    glosario.append({"termino": termino, "definicion": definicion, "guionId": gid, "pagina": b.pagina})
                    fragmentos.append({**base, "id": nuevo_id(b.pagina, f"g{len(glosario)}"), "pagina": b.pagina,
                                       "titulo": f"Glosario: {termino}", "texto": f"{termino}: {definicion}",
                                       "palabrasClave": [termino.lower()]})
                continue

            # Contenido normal, con "Datos curiosos:" aparte
            trozos: list[tuple[str, str]] = []   # (texto, crudo)
            i = 0
            while i < len(seccion):
                b = seccion[i]
                siguiente = seccion[i + 1] if i + 1 < len(seccion) else None
                texto = texto_bloque(b)
                if b.tipo == "parrafo" and normalizar(texto) == "datos curiosos:" and siguiente and siguiente.tipo == "lista":
                    for k, item in enumerate(items_lista(siguiente), start=1):
                        fid = nuevo_id(siguiente.pagina, f"dc{len(datos_curiosos[estacion]) + 1}") if estacion else nuevo_id(siguiente.pagina)
                        fragmentos.append({**base, "id": fid, "pagina": siguiente.pagina,
                                           "titulo": f"Dato curioso: {titulo}", "texto": item,
                                           "palabrasClave": palabras_clave(item, extra)})
                        if estacion:
                            datos_curiosos[estacion].append(fid)
                    i += 2
                    continue
                if b.tipo == "tabla" and estacion:
                    for fila in filas_tabla(b)[1:]:
                        if len(fila) >= 2 and re.match(r"^(fauna|plantas|pantas)", normalizar(fila[0])):
                            nombres_tablas[estacion].append((fila[1], b.pagina))
                if b.tipo == "parrafo" and texto.endswith(":") and siguiente and siguiente.tipo == "lista":
                    trozos.append((texto + "\n" + texto_bloque(siguiente), b.crudo + "\n" + siguiente.crudo))
                    i += 2
                    continue
                if texto:
                    trozos.append((texto, b.crudo))
                i += 1

            # Empaquetar trozos en fragmentos de ~PALABRAS_POR_FRAGMENTO palabras
            acumulado, crudo_acum = "", ""
            def emitir(texto: str, crudo: str):
                for parte in partir_texto(texto):
                    fragmentos.append({**base, "id": nuevo_id(primero.pagina), "pagina": primero.pagina,
                                       "titulo": titulo, "texto": parte,
                                       "palabrasClave": palabras_clave(crudo, extra)})
            for texto, crudo in trozos:
                if acumulado and contar_palabras(acumulado) + contar_palabras(texto) > PALABRAS_POR_FRAGMENTO:
                    emitir(acumulado, crudo_acum)
                    acumulado, crudo_acum = "", ""
                acumulado = (acumulado + "\n\n" + texto).strip()
                crudo_acum += "\n" + crudo
            if acumulado:
                emitir(acumulado, crudo_acum)

    if sin_regla:
        raise ErrorValidacion("Secciones sin regla en mapeo.yaml:\n  " + "\n  ".join(sorted(sin_regla)))

    aplicar_naturaleza(fragmentos, mapeo)
    especies = especies_por_estacion(nombres_tablas, mapeo["especies"], avisos)

    paquete = {
        "version": mapeo["version"],
        "generadoEn": dt.date.today().isoformat(),
        "guiones": [{k: g[k] for k in ("id", "titulo", "version", "totalPaginas", "fechaVersion")} for g in mapeo["guiones"]],
        "estaciones": [
            {**{k: e[k] for k in ("id", "nombre", "alias", "orden", "altitudMsnm", "ecosistema",
                                  "conceptoCentral", "icono", "preguntasSugeridas")},
             "imagen": f"estaciones/{e['id']}.webp",
             "datosCuriososIds": datos_curiosos[e["id"]],
             "especies": especies[e["id"]],
             "ubicacion": None, "radioDesbloqueoM": 80, "nfcTagIds": []}
            for e in sorted(mapeo["estaciones"], key=lambda e: e["orden"])
        ],
        "fragmentos": fragmentos,
        "glosario": glosario,
        "sinonimos": mapeo["sinonimos"],
        "diferencias": [
            {"id": d["id"], "tema": d["tema"], "nota": d["nota"],
             "fragmentoIds": [fid for s in d["fragmentos"] for fid in resolver(s, fragmentos, todos=True)]}
            for d in mapeo["diferencias"]
        ],
        "retos": [
            {"id": r["id"], "estacionId": r["estacion"], "pregunta": r["pregunta"], "opciones": r["opciones"],
             "indiceCorrecta": r["correcta"], "fragmentoId": (resolver(r["fragmento"], fragmentos) or [""])[0]}
            for r in mapeo["retos"]
        ],
    }
    return paquete, avisos


def titulo_seccion(encabezados: tuple[str, ...], estacion: str | None, estaciones: dict) -> str:
    profundo = re.sub(r"^\d+\.\s*", "", encabezados[-1])
    if estacion:
        nombre = estaciones[estacion]["nombre"]
        if normalizar(nombre) in normalizar(profundo) or len(encabezados) <= 2:
            return nombre
        return f"{nombre}: {profundo}"
    return profundo


def aplicar_naturaleza(fragmentos: list[dict], mapeo: dict) -> None:
    for f in fragmentos:
        if f["tema"] == "salud_altura":
            continue
        if f["tema"] in TEMAS_CON_FECHA_AUTOMATICA:
            # Ignora citas "(Autor et al., 2016)" / "Autor (2013)" y edades de carbono "2020 ± 30"
            sin_citas = re.sub(r"\([^()]*\d{4}[^()]*\)", "", f["texto"])
            anios = re.findall(r"\b(20[12]\d)\b(?!\s*±)", sin_citas)
            if anios:
                f["naturaleza"], f["fechaDato"] = "dato_fechado", max(anios)
        for regla in mapeo["naturaleza_por_texto"]:
            excluido = any(f["guionId"] == e["guion"] and f["pagina"] == e["pagina"] for e in regla.get("excepto", []))
            if not excluido and re.search(regla["patron"], f["texto"], re.IGNORECASE):
                f["naturaleza"] = regla["naturaleza"]
                f.pop("fechaDato", None)
                break
        for d in mapeo["datos_fechados"]:
            if coincide(d, f):
                f["naturaleza"], f["fechaDato"] = "dato_fechado", d["fecha"]


def especies_por_estacion(nombres: dict, especies: list[dict], avisos: list[str]) -> dict[str, list[str]]:
    indice = {}
    for e in especies:
        for alias in [e["comun"], *e["alias"]]:
            indice[normalizar(alias)] = e["cientifico"]
    salida = {}
    for estacion, celdas in nombres.items():
        lista: list[str] = []
        for celda, pagina in celdas:
            for nombre in re.split(r",|\by\b", re.sub(r"\(.*?\)", "", celda)):
                clave = normalizar(nombre).strip(" .“”\"'")
                if not clave:
                    continue
                candidatos = [clave, re.sub(r"es$", "", clave), re.sub(r"s$", "", clave)]
                cientifico = next((indice[c] for c in candidatos if c in indice), None)
                if cientifico:
                    if cientifico not in lista:
                        lista.append(cientifico)
                else:
                    avisos.append(f"Especie sin equivalencia en {estacion} (p. {pagina}): '{nombre.strip()}'")
        salida[estacion] = lista
    return salida


# ───────────────────────────── validación ─────────────────────────────

def validar(paquete: dict, mapeo: dict) -> list[str]:
    errores = []
    paginas = {g["id"]: g["totalPaginas"] for g in paquete["guiones"]}
    estaciones = {e["id"] for e in paquete["estaciones"]}
    ids = [f["id"] for f in paquete["fragmentos"]]
    repetidos = {i for i in ids if ids.count(i) > 1}
    if repetidos:
        errores.append(f"Ids de fragmento repetidos: {sorted(repetidos)}")
    for f in paquete["fragmentos"]:
        donde = f"Fragmento {f['id']}"
        if f["guionId"] not in paginas:
            errores.append(f"{donde}: guion desconocido '{f['guionId']}'")
        elif not 1 <= f["pagina"] <= paginas[f["guionId"]]:
            errores.append(f"{donde}: página {f['pagina']} fuera del guion")
        if f["tema"] not in TEMAS:
            errores.append(f"{donde}: tema inválido '{f['tema']}'")
        if f["naturaleza"] not in NATURALEZAS:
            errores.append(f"{donde}: naturaleza inválida '{f['naturaleza']}'")
        if f["nivel"] not in NIVELES:
            errores.append(f"{donde}: nivel inválido '{f['nivel']}'")
        if f["estacionId"] is not None and f["estacionId"] not in estaciones:
            errores.append(f"{donde}: estación desconocida '{f['estacionId']}'")
        if not f["texto"].strip() or not f["titulo"].strip():
            errores.append(f"{donde}: texto o título vacío")
        if f["tema"] == "salud_altura" and f["apto"]:
            errores.append(f"{donde}: contenido de salud marcado como apto para responder")
        if f["naturaleza"] == "dato_fechado" and not f.get("fechaDato"):
            errores.append(f"{donde}: dato fechado sin fechaDato")
    for d in paquete["diferencias"]:
        if len(d["fragmentoIds"]) < 2:
            errores.append(f"Diferencia '{d['id']}': resolvió {len(d['fragmentoIds'])} fragmentos (mínimo 2)")
    for r in paquete["retos"]:
        if not r["fragmentoId"]:
            errores.append(f"Reto '{r['id']}': el selector de fragmento no encontró nada")
        if r["estacionId"] not in estaciones:
            errores.append(f"Reto '{r['id']}': estación desconocida")
        if not 0 <= r["indiceCorrecta"] < len(r["opciones"]):
            errores.append(f"Reto '{r['id']}': indiceCorrecta fuera de rango")
    for s in mapeo.get("obligatorios", []):
        if not resolver(s, paquete["fragmentos"]):
            errores.append(f"Falta fragmento obligatorio: {s['guion']} p. {s['pagina']} con '{s['contiene']}'")
    return errores


def main() -> int:
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
    mapeo = yaml.safe_load((CONTENIDO / "mapeo.yaml").read_text(encoding="utf-8"))
    try:
        paquete, avisos = generar(mapeo)
    except ErrorValidacion as e:
        print(f"ERROR: {e}", file=sys.stderr)
        return 1
    errores = validar(paquete, mapeo)
    for a in avisos:
        print(f"aviso: {a}")
    if errores:
        print("\nERROR: el contenido no es válido:", file=sys.stderr)
        for e in errores:
            print(f"  - {e}", file=sys.stderr)
        return 1
    SALIDA.parent.mkdir(parents=True, exist_ok=True)
    with SALIDA.open("w", encoding="utf-8", newline="\n") as f:
        json.dump(paquete, f, ensure_ascii=False, indent=2)
        f.write("\n")
    frag = paquete["fragmentos"]
    por_tema: dict[str, int] = {}
    for x in frag:
        por_tema[x["tema"]] = por_tema.get(x["tema"], 0) + 1
    print(f"\nOK  {SALIDA.relative_to(RAIZ)}  versión {paquete['version']}")
    print(f"    {len(frag)} fragmentos ({sum(x['apto'] for x in frag)} aptos) · {len(paquete['glosario'])} términos · "
          f"{len(paquete['retos'])} retos · {len(paquete['diferencias'])} diferencias")
    print("    por tema: " + ", ".join(f"{k} {v}" for k, v in sorted(por_tema.items())))
    for e in paquete["estaciones"]:
        print(f"    {e['id']:<13} datos curiosos {len(e['datosCuriososIds']):>2} · especies {len(e['especies'])}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
