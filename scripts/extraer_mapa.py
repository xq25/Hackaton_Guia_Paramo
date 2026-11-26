"""Extrae el mapa base offline (.pmtiles) de la zona del recorrido desde una compilación diaria de Protomaps.

Uso (necesita internet):
    scripts/.venv/Scripts/python scripts/extraer_mapa.py                 (usa la compilación más reciente)
    scripts/.venv/Scripts/python scripts/extraer_mapa.py 20261126        (una fecha concreta)

Salidas:
    app/assets/mapa/zona.pmtiles      teselas vectoriales z0–15 del recuadro del recorrido
    app/assets/mapa/ruta.geojson      estaciones con posición conocida en OpenStreetMap (aproximadas)

Datos: © OpenStreetMap contributors (ODbL), compilación de Protomaps. Esta atribución debe verse en la app.
Lee solo los rangos de bytes necesarios (no descarga el planeta). Dueño: Dev A.
"""
from __future__ import annotations

import functools
import json
import sys
import urllib.request
from pathlib import Path

from pmtiles.reader import Reader
from pmtiles.tile import zxy_to_tileid
from pmtiles.writer import Writer

RAIZ = Path(__file__).resolve().parent.parent
SALIDA = RAIZ / "app" / "assets" / "mapa"
AGENTE = "paramON-prototipo/0.1 (guia de paramo offline; hackaton)"
BUILDS = "https://build-metadata.protomaps.dev/builds.json"

# Recuadro del recorrido Brisas → Valle de las Tumbas con margen (incluye el cráter Arenas)
OESTE, SUR, ESTE, NORTE = -75.42, 4.85, -75.28, 4.96
ZOOM_MAX = 15

# Posiciones tomadas de OpenStreetMap (Nominatim, 2026-11-26). Son aproximadas y NO reemplazan
# las coordenadas oficiales de UTON (Estacion.ubicacion sigue en null). Sin dato en OSM: aguacerales, lunares.
ESTACIONES_OSM = [
    {"estacionId": "brisas", "lat": 4.9335960, "lon": -75.3502095, "osm": "way/786352560",
     "nombreOsm": "Brisas - Parque de Los Nevados"},
    {"estacionId": "arenales", "lat": 4.9192957, "lon": -75.3547997, "osm": "node/8931612458",
     "nombreOsm": "Refugio Arenales"},
    {"estacionId": "valle_tumbas", "lat": 4.9111111, "lon": -75.3561551, "osm": "node/756614837",
     "nombreOsm": "Valle de las Tumbas"},
]
SIN_POSICION = ["aguacerales", "lunares"]
REFERENCIAS = [
    {"id": "crater_arenas", "nombre": "Volcán Nevado del Ruiz (cráter Arenas)", "lat": 4.8819399, "lon": -75.3178182,
     "osm": "node/1366302165"},
]


def url_compilacion(fecha: str | None) -> str:
    if not fecha:
        with urllib.request.urlopen(urllib.request.Request(BUILDS, headers={"User-Agent": AGENTE}), timeout=60) as r:
            fecha = json.load(r)[-1]["key"].removesuffix(".pmtiles")
    return f"https://build.protomaps.com/{fecha}.pmtiles"


def lector_remoto(url: str):
    peticiones = {"n": 0}

    @functools.lru_cache(maxsize=8192)
    def get_bytes(offset: int, length: int) -> bytes:
        peticiones["n"] += 1
        req = urllib.request.Request(url, headers={"User-Agent": AGENTE, "Range": f"bytes={offset}-{offset + length - 1}"})
        with urllib.request.urlopen(req, timeout=120) as r:
            return r.read()

    return get_bytes, peticiones


def lon2x(lon: float, z: int) -> int:
    return int((lon + 180.0) / 360.0 * (1 << z))


def lat2y(lat: float, z: int) -> int:
    import math
    rad = math.radians(lat)
    return int((1.0 - math.asinh(math.tan(rad)) / math.pi) / 2.0 * (1 << z))


def teselas() -> list[tuple[int, int, int]]:
    salida = []
    for z in range(ZOOM_MAX + 1):
        for x in range(lon2x(OESTE, z), lon2x(ESTE, z) + 1):
            for y in range(lat2y(NORTE, z), lat2y(SUR, z) + 1):
                salida.append((z, x, y))
    return sorted(salida, key=lambda t: zxy_to_tileid(*t))


def escribir_ruta() -> None:
    features = [
        {"type": "Feature", "geometry": {"type": "Point", "coordinates": [e["lon"], e["lat"]]},
         "properties": {"tipo": "estacion", "estacionId": e["estacionId"], "aproximada": True,
                        "fuente": f"OpenStreetMap {e['osm']} ({e['nombreOsm']})"}}
        for e in ESTACIONES_OSM
    ] + [
        {"type": "Feature", "geometry": {"type": "Point", "coordinates": [r["lon"], r["lat"]]},
         "properties": {"tipo": "referencia", "id": r["id"], "nombre": r["nombre"], "aproximada": True,
                        "fuente": f"OpenStreetMap {r['osm']}"}}
        for r in REFERENCIAS
    ]
    ruta = {
        "type": "FeatureCollection",
        "properties": {
            "atribucion": "© OpenStreetMap contributors",
            "nota": "Posiciones aproximadas tomadas de OpenStreetMap. No hay trazado del sendero todavía: "
                    "no dibujar una línea inventada entre estaciones.",
            "sinPosicion": SIN_POSICION,
        },
        "features": features,
    }
    (SALIDA / "ruta.geojson").write_text(json.dumps(ruta, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")


def main() -> int:
    sys.stdout.reconfigure(encoding="utf-8")
    url = url_compilacion(sys.argv[1] if len(sys.argv) > 1 else None)
    print(f"Fuente: {url}")
    get_bytes, peticiones = lector_remoto(url)
    lector = Reader(get_bytes)
    cabecera = lector.header()
    metadatos = lector.metadata()
    lista = teselas()
    print(f"{len(lista)} teselas candidatas (z0–{ZOOM_MAX})")

    SALIDA.mkdir(parents=True, exist_ok=True)
    destino = SALIDA / "zona.pmtiles"
    escritas = 0
    with destino.open("wb") as f:
        escritor = Writer(f)
        for z, x, y in lista:
            datos = lector.get(z, x, y)
            if datos:
                escritor.write_tile(zxy_to_tileid(z, x, y), datos)
                escritas += 1
        e7 = lambda v: int(v * 10_000_000)
        escritor.finalize(
            {
                "tile_type": cabecera["tile_type"],
                "tile_compression": cabecera["tile_compression"],
                "min_lon_e7": e7(OESTE), "min_lat_e7": e7(SUR), "max_lon_e7": e7(ESTE), "max_lat_e7": e7(NORTE),
                "center_zoom": 13, "center_lon_e7": e7(-75.352), "center_lat_e7": e7(4.92),
            },
            {**metadatos, "name": "paramON · recorrido Brisas–Valle de las Tumbas",
             "attribution": "© OpenStreetMap contributors · Protomaps", "fuente": url},
        )
    escribir_ruta()
    tamano = destino.stat().st_size / 1_048_576
    print(f"\nOK  {destino.relative_to(RAIZ)}: {escritas} teselas, {tamano:.1f} MB · {peticiones['n']} peticiones")
    print(f"OK  ruta.geojson: {len(ESTACIONES_OSM)} estaciones con posición; sin posición: {', '.join(SIN_POSICION)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
