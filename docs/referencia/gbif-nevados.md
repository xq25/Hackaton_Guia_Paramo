# Contexto: API de GBIF para el PNN Los Nevados

Consultas hechas el **26 de noviembre de 2026**. Base: `https://api.gbif.org/v1` (JSON; las búsquedas usadas no pidieron API key).

## 0. Alcance de este archivo (leer primero)

- **No es el volcado crudo de la API.** La herramienta de consulta devuelve extractos, no el JSON completo.
- Incluye: metadatos del dataset, 100 de 1.974 taxones, 15 de 148.016 ocurrencias y los conteos por especie (solo los más frecuentes) de tres secciones.
- Para descargar todo lo demás, usar el script del **Anexo** (no se ha ejecutado contra la API real).
- Las secciones geográficas son recuadros aproximados, no límites oficiales.
- Un "registro" es una observación reportada, no un individuo.
- Uso previsto: guía turístico sin conexión, con interés en el recorrido Brisas–Valle de las Tumbas.

## 1. Endpoints

| # | Qué devuelve | URL |
|---|---|---|
| 1 | Metadatos del dataset de CARDER | `/dataset/4493273e-47df-487e-b285-f8e5062d2b14` |
| 2 | Taxones del inventario | `/species/search?datasetKey=4493273e-47df-487e-b285-f8e5062d2b14&limit=100` |
| 3 | Ocurrencias georreferenciadas | `/occurrence/search?country=CO&decimalLatitude=4.63,4.85&decimalLongitude=-75.56,-75.36` |

## 2. Endpoint 1: dataset

| Campo | Valor |
|---|---|
| Título | Biodiversidad Parque Nacional Natural Nevados |
| Tipo | CHECKLIST (lista de especies, sin ocurrencias) |
| Versión | 2.2 |
| Publicador | Corporación Autónoma Regional de Risaralda (CARDER) |
| Fecha de publicación | 2018-08-28 |
| DOI | 10.15472/r8t5xv |
| Licencia | CC BY-NC 4.0 (uso no comercial, con atribución) |
| Idioma | Español |
| Autores | Eduardo Londoño, Margarita María Roa Cubillos |
| Grupos | Aves, Mammalia, Plantae, Fungi |
| Área | Cordillera Central, 4°36′–4°57′N, 75°12′–75°30′O, 2.600–5.300 m s. n. m., unas 58.300 ha (Caldas, Risaralda, Quindío, Tolima) |
| Recuadro declarado | lat 4.633 a 4.85; lon −75.564 a −75.366 |
| Cobertura temporal | 1828-01-01 a 1985-12-01 |
| Fuentes | Revisión de literatura, colecciones del laboratorio de fauna UNIFEM-INDERENA y colectas de campo de 1985 (plan de manejo) |
| Método | Datos secundarios, sin protocolo de muestreo estandarizado |
| Validación de nombres | Catalogue of Life; aves corregidas con Avibase y SACC |

Cita: Londoño E, Roa Cubillos M M (2018). *Biodiversidad Parque Nacional Natural Nevados*, versión 2.2. CARDER. https://doi.org/10.15472/r8t5xv, vía GBIF.org.

Los datos personales de contacto se omitieron.

## 3. Endpoint 2: taxones del inventario

Total de la búsqueda: **1.974** entradas (la ficha del dataset indica cerca de 1.969 nombres).

| Rango | Cantidad |
|---|---|
| SPECIES | 879 |
| GENUS | 668 |
| FAMILY | 228 |
| ORDER | 102 |
| SUBSPECIES | 18 |
| CLASS | 16 |
| PHYLUM | 6 |
| VARIETY | 6 |
| KINGDOM | 3 |
| Sin rango en el conteo | 48 |

**Campos observados:** `key`, `scientificName`, `rank`, estado taxonómico (aceptado), `kingdom`, `phylum`, `class`, `order`, `family`, `genus`, `vernacularNames`, `threatStatuses`, `habitats`. Los tres últimos llegaron vacíos en los primeros 100.

Ejemplos de clave: *Steatornis caripensis* = 147445986; *Systellura longirostris* = 147445990.

### Primeros 100 taxones

`rank` es SPECIES salvo donde se indica (género).

| # | Nombre científico | Reino | Clase | Orden | Familia |
|---|---|---|---|---|---|
| 1 | Steatornis caripensis Humboldt, 1817 | Animalia | Aves | Caprimulgiformes | Steatornithidae |
| 2 | Systellura longirostris (Bonaparte, 1825) | Animalia | Aves | Caprimulgiformes | Caprimulgidae |
| 3 | Psoroma hypnorum (Vahl) Gray | Fungi | Lecanoromycetes | Peltigerales | Pannariaceae |
| 4 | Antrostomus carolinensis (J.F.Gmelin, 1789) | Animalia | Aves | Caprimulgiformes | Caprimulgidae |
| 5 | Lurocalis semitorquatus (Gmelin, 1789) | Animalia | Aves | Caprimulgiformes | Caprimulgidae |
| 6 | Uropsalis segmentata (Cassin, 1849) | Animalia | Aves | Caprimulgiformes | Caprimulgidae |
| 7 | Uropsalis lyra (Bonaparte, 1850) | Animalia | Aves | Caprimulgiformes | Caprimulgidae |
| 8 | Chordeiles minor (J.R.Forster, 1771) | Animalia | Aves | Caprimulgiformes | Caprimulgidae |
| 9 | Stereocaulon glareosum (Savicz) H.Magn. | Fungi | Lecanoromycetes | Lecanorales | Stereocaulaceae |
| 10 | Pharomachrus antisianus (Orbigny, 1837) | Animalia | Aves | Trogoniformes | Trogonidae |
| 11 | Pharomachrus auriceps (Gould, 1842) | Animalia | Aves | Trogoniformes | Trogonidae |
| 12 | Trogon collaris Vieillot, 1817 | Animalia | Aves | Trogoniformes | Trogonidae |
| 13 | Usnea Dill. ex Adans. (género) | Fungi | Lecanoromycetes | Lecanorales | Parmeliaceae |
| 14 | Trogon personatus Gould, 1842 | Animalia | Aves | Trogoniformes | Trogonidae |
| 15 | Piaya cayana (Linnaeus, 1766) | Animalia | Aves | Cuculiformes | Cuculidae |
| 16 | Coccyzus americanus (Linnaeus, 1758) | Animalia | Aves | Cuculiformes | Cuculidae |
| 17 | Coccyzus erythropthalmus (A.Wilson, 1811) | Animalia | Aves | Cuculiformes | Cuculidae |
| 18 | Teloschistes flavicans (Sw.) Norman | Fungi | Lecanoromycetes | Teloschistales | Teloschistaceae |
| 19 | Crotophaga ani Linnaeus, 1758 | Animalia | Aves | Cuculiformes | Cuculidae |
| 20 | Merganetta armata Gould, 1842 | Animalia | Aves | Anseriformes | Anatidae |
| 21 | Oxyura jamaicensis (Gmelin, 1789) | Animalia | Aves | Anseriformes | Anatidae |
| 22 | Anas flavirostris Vieillot, 1816 | Animalia | Aves | Anseriformes | Anatidae |
| 23 | Anas discors Linnaeus, 1766 | Animalia | Aves | Anseriformes | Anatidae |
| 24 | Xylaria Hill ex Schrank (género) | Fungi | Sordariomycetes | Xylariales | Xylariaceae |
| 25 | Tyto alba (Scopoli, 1769) | Animalia | Aves | Strigiformes | Tytonidae |
| 26 | Bubo virginianus (Gmelin, 1788) | Animalia | Aves | Strigiformes | Strigidae |
| 27 | Ganoderma applanatum (Pers.) Pat. | Fungi | Agaricomycetes | Polyporales | Ganodermataceae |
| 28 | Glaucidium jardinii (Bonaparte, 1855) | Animalia | Aves | Strigiformes | Strigidae |
| 29 | Phellinus Quél. (género) | Fungi | Agaricomycetes | Hymenochaetales | Hymenochaetaceae |
| 30 | Aegolius harrisii (Cassin, 1849) | Animalia | Aves | Strigiformes | Strigidae |
| 31 | Ciccaba albitarsis (Bonaparte, 1850) | Animalia | Aves | Strigiformes | Strigidae |
| 32 | Ciccaba virgata (Cassin, 1849) | Animalia | Aves | Strigiformes | Strigidae |
| 33 | Asio flammeus (Pontoppidan, 1763) | Animalia | Aves | Strigiformes | Strigidae |
| 34 | Flammula (Fr.) P.Kumm. (género) | Fungi | Agaricomycetes | Agaricales | Hymenogastraceae |
| 35 | Asio stygius (Wagler, 1832) | Animalia | Aves | Strigiformes | Strigidae |
| 36 | Cortinarius (Pers.) Gray (género) | Fungi | Agaricomycetes | Agaricales | Agaricaceae |
| 37 | Megascops albogularis (Cassin, 1849) | Animalia | Aves | Strigiformes | Strigidae |
| 38 | Megascops choliba (Vieillot, 1817) | Animalia | Aves | Strigiformes | Strigidae |
| 39 | Arrhenia Fr. (género) | Fungi | Agaricomycetes | Agaricales | Tricholomataceae |
| 40 | Omphalina Quél. (género) | Fungi | Agaricomycetes | Agaricales | Tricholomataceae |
| 41 | Geotrygon linearis (Prevost, 1843) | Animalia | Aves | Columbiformes | Columbidae |
| 42 | Geotrygon frenata (Tschudi, 1843) | Animalia | Aves | Columbiformes | Columbidae |
| 43 | Patagioenas fasciata (Say, 1823) | Animalia | Aves | Columbiformes | Columbidae |
| 44 | Pleurotus (Fr.) P.Kumm. (género) | Fungi | Agaricomycetes | Agaricales | Pleurotaceae |
| 45 | Patagioenas subvinacea (Lawrence, 1868) | Animalia | Aves | Columbiformes | Columbidae |
| 46 | Claravis mondetoura (Bonaparte, 1856) | Animalia | Aves | Columbiformes | Columbidae |
| 47 | Leptotila conoveri Bond & Meyer de Schauensee, 1943 | Animalia | Aves | Columbiformes | Columbidae |
| 48 | Leptotila verreauxi (Bonaparte, 1855) | Animalia | Aves | Columbiformes | Columbidae |
| 49 | Odontophorus hyperythrus Gould, 1858 | Animalia | Aves | Galliformes | Odontophoridae |
| 50 | Chamaepetes goudotii (Lesson, 1828) | Animalia | Aves | Galliformes | Cracidae |
| 51 | Penelope montagnii (Bonaparte, 1856) | Animalia | Aves | Galliformes | Cracidae |
| 52 | Aburria aburri (Lesson, 1828) | Animalia | Aves | Galliformes | Cracidae |
| 53 | Frullania Raddi (género) | Plantae | Jungermanniopsida | Porellales | Jubulaceae |
| 54 | Podiceps occipitalis Garnot, 1826 | Animalia | Aves | Podicipediformes | Podicipedidae |
| 55 | Mimus polyglottos (Linnaeus, 1758) | Animalia | Aves | Passeriformes | Mimidae |
| 56 | Metzgeria Raddi (género) | Plantae | Jungermanniopsida | Metzgeriales | Metzgeriaceae |
| 57 | Cinclus leucocephalus Tschudi, 1844 | Animalia | Aves | Passeriformes | Cinclidae |
| 58 | Riccardia Gray (género) | Plantae | Jungermanniopsida | Metzgeriales | Aneuraceae |
| 59 | Pachyramphus polychopterus (Vieillot, 1818) | Animalia | Aves | Passeriformes | Tityridae |
| 60 | Pachyramphus versicolor (Hartlaub, 1843) | Animalia | Aves | Passeriformes | Tityridae |
| 61 | Plagiochila (Dumort.) Dumort. (género) | Plantae | Jungermanniopsida | Jungermanniales | Plagiochilaceae |
| 62 | Drymophila caudata (P.L.Sclater, 1855) | Animalia | Aves | Passeriformes | Thamnophilidae |
| 63 | Lepicolea Dumort. (género) | Plantae | Jungermanniopsida | Jungermanniales | Lepicoleaceae |
| 64 | Scytalopus vicinior Zimmer, 1939 | Animalia | Aves | Passeriformes | Rhinocryptidae |
| 65 | Scytalopus latebricola Bangs, 1899 | Animalia | Aves | Passeriformes | Rhinocryptidae |
| 66 | Scytalopus unicolor Salvin, 1895 | Animalia | Aves | Passeriformes | Rhinocryptidae |
| 67 | Scytalopus femoralis (Tschudi, 1844) | Animalia | Aves | Passeriformes | Rhinocryptidae |
| 68 | Scytalopus magellanicus (Gmelin, 1789) | Animalia | Aves | Passeriformes | Rhinocryptidae |
| 69 | Acropternis orthonyx (Lafresnaye, 1843) | Animalia | Aves | Passeriformes | Rhinocryptidae |
| 70 | Porotrichum (Brid.) Hampe (género) | Plantae | Bryopsida | Leucodontales | Neckeraceae |
| 71 | Myornis senilis (Lafresnaye, 1840) | Animalia | Aves | Passeriformes | Rhinocryptidae |
| 72 | Catharus ustulatus (Nuttall, 1840) | Animalia | Aves | Passeriformes | Turdidae |
| 73 | Catharus minimus (Lafresnaye, 1848) | Animalia | Aves | Passeriformes | Turdidae |
| 74 | Catharus fuscescens (Stephens, 1817) | Animalia | Aves | Passeriformes | Turdidae |
| 75 | Myadestes ralloides (Orbigny, 1840) | Animalia | Aves | Passeriformes | Turdidae |
| 76 | Turdus serranus Tschudi, 1844 | Animalia | Aves | Passeriformes | Turdidae |
| 77 | Leptodontium (Müll.Hal.) Hampe ex Lindb. (género) | Plantae | Bryopsida | Pottiales | Pottiaceae |
| 78 | Turdus ignobilis P.L.Sclater, 1858 | Animalia | Aves | Passeriformes | Turdidae |
| 79 | Turdus fuscater Orbigny & Lafresnaye, 1837 | Animalia | Aves | Passeriformes | Turdidae |
| 80 | Troglodytes aedon Vieillot, 1809 | Animalia | Aves | Passeriformes | Troglodytidae |
| 81 | Troglodytes solstitialis P.L.Sclater, 1859 | Animalia | Aves | Passeriformes | Troglodytidae |
| 82 | Polytrichum Hedw. (género) | Plantae | Bryopsida | Polytrichales | Polytrichaceae |
| 83 | Cyphorhinus thoracicus Tschudi, 1844 | Animalia | Aves | Passeriformes | Troglodytidae |
| 84 | Cinnycerthia peruana (Cabanis, 1873) | Animalia | Aves | Passeriformes | Troglodytidae |
| 85 | Cinnycerthia unirufa (Lafresnaye, 1840) | Animalia | Aves | Passeriformes | Troglodytidae |
| 86 | Cistothorus platensis (Latham, 1790) | Animalia | Aves | Passeriformes | Troglodytidae |
| 87 | Prionodon Müll.Hal. (género) | Plantae | Bryopsida | Isobryales | Prionodontaceae |
| 88 | Henicorhina leucophrys (Tschudi, 1844) | Animalia | Aves | Passeriformes | Troglodytidae |
| 89 | Campylopus Brid. (género) | Plantae | Bryopsida | Dicranales | Dicranaceae |
| 90 | Arremon assimilis (Boissonneau, 1840) | Animalia | Aves | Passeriformes | Emberizidae |
| 91 | Arremon brunneinucha (Lafresnaye, 1839) | Animalia | Aves | Passeriformes | Emberizidae |
| 92 | Lepiota (Pers.) Gray (género) | Plantae (error: es un hongo) | Agaricomycetes | Agaricales | Agaricaceae |
| 93 | Zonotrichia capensis (P.L.Statius Müller, 1776) | Animalia | Aves | Passeriformes | Emberizidae |
| 94 | Atlapetes flaviceps Chapman, 1912 | Animalia | Aves | Passeriformes | Emberizidae |
| 95 | Atlapetes schistaceus (Boissonneau, 1840) | Animalia | Aves | Passeriformes | Emberizidae |
| 96 | Atlapetes gutturalis (Lafresnaye, 1843) | Animalia | Aves | Passeriformes | Emberizidae |
| 97 | Atlapetes pallidinucha (Boissonneau, 1840) | Animalia | Aves | Passeriformes | Emberizidae |
| 98 | Adelanthus rotundifolius Horik. | Plantae | Jungermanniopsida | Jungermanniales | Adelanthaceae |
| 99 | Chlorospingus flavopectus (Lafresnaye, 1840) | Animalia | Aves | Passeriformes | Emberizidae |
| 100 | Hirundo rustica Linnaeus, 1758 | Animalia | Aves | Passeriformes | Hirundinidae |

## 4. Endpoint 3: ocurrencias

Total en el recuadro original: **148.016**.

| Reino (`kingdomKey`) | Registros |
|---|---|
| Animalia (1) | 127.828 |
| Plantae (6) | 17.738 |
| Fungi (5) | 1.570 |
| Bacteria (3) | 717 |
| Chromista (4) | 119 |
| Protozoa (7) | 3 |
| Virus (8) | 3 |

(Los nombres de las claves son los de la taxonomía de GBIF; la respuesta solo trae el número.)

Advertencias del recuadro:
- Deja por fuera el sector norte: llega hasta 4.85 y el Nevado del Ruiz está cerca de 4.89 N.
- Incluye zonas que no son parque (p. ej., Salento) y plantas ornamentales.

**Campos observados:** identificador GBIF, `species`, `scientificName`, `kingdom`, `class`, `order`, `family`, `basisOfRecord` (observación humana), `decimalLatitude`, `decimalLongitude`, incertidumbre de coordenadas, `eventDate`, `locality`, observador, identificador y fecha de identificación, condición reproductiva, `iucnRedListCategory`, `datasetName`, `license`, `media` (fotos), alertas de calidad (`issues`). La altitud no apareció en los registros revisados.

### Muestra de 15 registros (iNaturalist, grado de investigación, CC BY-NC 4.0)

| # | Especie | Grupo | Lat | Lon | Fecha | Localidad | IUCN | Fotos |
|---|---|---|---|---|---|---|---|---|
| 1 | Kniphofia uvaria | Planta | 4.64014 | -75.48674 | 2026-01-02 | Salento | NE | 1 |
| 2 | Guzmania multiflora | Planta | 4.64014 | -75.48674 | 2026-01-02 | Salento | NE | 1 |
| 3 | Glossoloma ichthyoderma | Planta | 4.64014 | -75.48674 | 2026-01-02 | Salento | NE | 1 |
| 4 | Aglaiocercus kingii | Ave | 4.64014 | -75.48674 | 2026-01-02 | Salento | NE | 1 |
| 5 | Castilleja fissifolia | Planta | 4.643394 | -75.477617 | 2026-01-15 | Salento | NE | 1 |
| 6 | Tapirus pinchaque | Mamífero | 4.633725 | -75.472248 | 2026-01-17 | Colombia | EN | 1 |
| 7 | Andigena hypoglauca | Ave | 4.734218 | -75.451966 | 2026-01-21 | Pereira | LC | 2 |
| 8 | Andigena hypoglauca | Ave | 4.734233 | -75.451825 | 2026-01-17 | Pereira | LC | 1 |
| 9 | Persicaria nepalensis | Planta | 4.704689 | -75.538597 | 2026-01-07 | Pereira | NE | 1 |
| 10 | Coeligena lutetiae | Ave | 4.73499 | -75.452432 | 2026-01-21 | Pereira | LC | 1 |
| 11 | Epidendrum schistochilum | Planta | 4.642317 | -75.4769 | 2026-01-15 | Salento | NE | 2 |
| 12 | Tapirus pinchaque | Mamífero | 4.724426 | -75.542495 | 2026-01-20 | Colombia | EN | 3 |
| 13 | Mimus gilvus | Ave | 4.64217 | -75.482672 | 2026-01-09 | Salento | LC | 1 |
| 14 | Heterogomphus chevrolati | Insecto | 4.702205 | -75.520271 | 2026-01-20 | Santa Rosa de Cabal | NE | 1 |
| 15 | Epidendrum schistochilum | Planta | 4.642317 | -75.4769 | 2026-01-15 | Salento | NE | 1 |

Registros 6 y 12: incertidumbre elevada a unos 31 km para proteger la especie. No son puntos de avistamiento.

Detalle de los registros 1 (GBIF 5938250276) y 2 (GBIF 5938277012): observación iNaturalist, organismo silvestre, incertidumbre aproximada de 212 m en el 1, alertas "coordenada redondeada" e "ID de taxón no encontrado"; el 2 anota flores y botones.

## 5. Flora y fauna por sección

Formato: `Nombre científico (registros)`. Listas ordenadas de más a menos registros, cortadas en el límite pedido.

| Sección | Latitud | Longitud | Aves | Plantas | Mamíferos | Total |
|---|---|---|---|---|---|---|
| Norte: Brisas–Valle de las Tumbas | 4.87 a 4.95 | −75.39 a −75.31 | 25.701 | 2.263 | 88 | 28.256 |
| Centro: Laguna del Otún–Santa Isabel | 4.76 a 4.83 | −75.45 a −75.36 | 3.206 | 3.017 | 27 | no consultado |
| Suroccidente: Salento–Cocora alto | 4.63 a 4.70 | −75.50 a −75.42 | 40.377 | 1.660 | 104 | no consultado |

### 5.1 Norte

**Todos los grupos (60 más registrados):** Oxypogon stuebelii (2116); Geospizopsis unicolor (1871); Zonotrichia capensis (1512); Turdus fuscater (1432); Ochthoeca fumicolor (1343); Grallaria quitensis (1311); Leptasthenura andicola (1286); Cistothorus platensis (1015); Atlapetes pallidinucha (950); Cinclodes excelsior (886); Metallura williami (861); Catamenia inornata (762); Orochelidon murina (695); Geranoaetus melanoleucus (634); Asthenes fuliginosa (472); Diglossa humeralis (384); Asthenes flammulata (357); Scytalopus opacus (338); Oxyura ferruginea (315); Chalcostigma herrani (303); Catamenia homochroa (298); Anisognathus igniventris (279); Bolborhynchus ferrugineifrons (277); Vultur gryphus (257); Anas andium (249); Diglossa lafresnayii (249); Metallura tyrianthina (211); Spinus spinescens (206); Mecocerculus leucophrys (204); Aglaeactis cupripennis (202); Eriocnemis mosquera (176); Muscisaxicola alpinus (171); Espeletia hartwegiana (168); Myioborus ornatus (153); Pterophanes cyanopterus (144); Eriocnemis derbyi (133); Anisognathus lacrymosus (120); Conirostrum sitticolor (119); Plantago rigida (113); Coeligena lutetiae (106); Streptoprocne zonaris (106); Urothraupis stolzmanni (103); Ampelion rubrocristatus (102); Diglossa cyanea (99); Ramphomicron microrhynchum (85); Myiothlypis nigrocristata (83); Margarornis squamiger (78); Iridosornis rufivertex (77); Vanellus chilensis (76); Coragyps atratus (74); Hypericum laricifolium (72); Lafresnaya lafresnayi (63); Troglodytes solstitialis (63); Grallaria saturata (60); Mecocerculus stictopterus (59); Castilleja fissifolia (57); Catamenia analis (56); Patagioenas fasciata (55); Buthraupis montana (53); Sturnella magna (52).

**Plantas (25):** Espeletia hartwegiana (168); Plantago rigida (113); Hypericum laricifolium (72); Castilleja fissifolia (57); Gaultheria myrsinoides (39); Senecio niveoaureus (33); Senecio formosus (32); Linochilus rupestris (22); Disterigma empetrifolium (21); Huperzia crassa (19); Gentianella selaginifolia (17); Plantae sin identificar (15); Andreaea rupestris (14); Bryaceae (14); Diplostephium eriophorum (14); Myrrhidendron glaucescens (14); Oritrophium peruvianum (14); Pentacalia vernicosa (14); Campylopus fragilis (13); Campylopus pittieri (13); Breutelia integrifolia (12); Campylopus (12); Espeletia hartwegiana subsp. centroandina (12); Amphidium tortuosum (11); Dicranum frigidum (11).

**Mamíferos (20):** Sylvilagus (28); Puma concolor (17); Cryptotis (7); Sylvilagus andinus (7); Cuniculus taczanowskii (4); Nasua olivacea (4); Leopardus (3); Microryzomys altissimus (3); Reithrodontomys mexicanus (2); Cerdocyon thous (1); Coendou rufescens (1); Eptesicus (1); Eptesicus fuscus (1); Lasiurus frantzii (1); Mazama (1); Myotis keaysi (1); Nasuella olivacea (1); Neogale (1); Sylvilagus salentus (1); Tapirus pinchaque (1).

### 5.2 Centro

**Aves (25):** Geospizopsis unicolor (370); Catamenia inornata (208); Cinclodes excelsior (164); Orochelidon murina (150); Grallaria quitensis (120); Ochthoeca fumicolor (113); Leptasthenura andicola (109); Anas andium (106); Turdus fuscater (105); Cistothorus platensis (98); Geranoaetus melanoleucus (96); Zonotrichia capensis (95); Oxyura ferruginea (91); Oxypogon stuebelii (69); Fulica americana (65); Metallura williami (63); Asthenes flammulata (52); Vultur gryphus (47); Diglossa humeralis (42); Vanellus resplendens (42); Catamenia homochroa (34); Muscisaxicola alpinus (31); Asthenes fuliginosa (30); Bolborhynchus ferrugineifrons (29); Atlapetes pallidinucha (20).

**Plantas (25):** Hypochaeris sessiliflora (71); Gaultheria myrsinoides (70); Hieracium avilae (64); Agrostis tolucensis (62); Belloa longifolia (62); Eryngium humile (62); Lachemilla andina (60); Calamagrostis effusa (59); Baccharis tricuneata (57); Espeletia hartwegiana (57); Gamochaeta purpurea (57); Rumex acetosella (56); Sisyrinchium (56); Lachemilla (55); Lupinus microphyllus (51); Gnaphalium antennarioides (50); Calamagrostis recta (48); Calamagrostis planifolia (45); Conyza uliginosa (45); Gnaphalium lanuginosum (44); Carex pichinchensis (43); Baccharis genistelloides (42); Calamagrostis fibrovaginata (42); Erigeron ecuadoriensis (42); Festuca sublimis (42).

**Mamíferos (todos los devueltos):** Microryzomys altissimus (8); Sylvilagus andinus (4); Tapirus pinchaque (4); Sylvilagus (3); Nasua olivacea (2); Cervidae (1); Cryptotis (1); Felis catus (1); Leopardus (1); Odocoileus virginianus goudotii (1); Thomasomys (1).

### 5.3 Suroccidente

**Aves (25):** Coragyps atratus (1128); Zonotrichia capensis (1102); Turdus fuscater (1083); Colibri coruscans (860); Cyanocorax yncas (802); Falco sparverius (768); Vanellus chilensis (766); Zenaida auriculata (762); Coeligena torquata (725); Pyrrhomyias cinnamomeus (688); Myioborus ornatus (619); Heliangelus exortis (593); Synallaxis azarae (593); Momotus aequatorialis (591); Aglaiocercus kingii (581); Vultur gryphus (576); Mimus gilvus (546); Setophaga fusca (527); Colaptes rivolii (520); Myioborus miniatus (515); Chamaepetes goudotii (513); Cyanolyca armillata (493); Trogon personatus (477); Diglossa albilatera (451); Pygochelidon cyanoleuca (444).

**Plantas (25):** Ceroxylon alpinum (124); Ceroxylon quindiuense (29); Passiflora trinervia (27); Bocconia frutescens (19); Guzmania multiflora (18); Impatiens sodenii (15); Tillandsia tequendamae (15); Castilleja fissifolia (14); Epidendrum arachnoglossum (14); Salvia scutellarioides (14); Epidendrum fimbriatum (12); Xylobium leontoglossum (12); Columnea strigosa (11); Epidendrum schistochilum (11); Passiflora alnifolia (11); Aiouea dubia (10); Espeletia hartwegiana (10); Fuchsia sessilifolia (10); Passiflora flexipes (10); Potentilla indica (10); Bidens (9); Weinmannia pubescens (9); Castilleja arvensis (8); Chusquea lehmannii (8); Fuchsia boliviana (8).

**Mamíferos (20):** Sturnira erythromos (21); Thomasomys laniger (19); Anoura geoffroyi (14); Tapirus pinchaque (13); Nasua nasua (6); Sturnira bidens (5); Platyrrhinus dorsalis (3); Dasyprocta punctata (2); Peromyscus mexicanus (2); Sciurus granatensis (2); Caenolestes fuliginosus (1); Cervidae (1); Dasypus (1); Didelphis marsupialis (1); Eptesicus brasiliensis (1); Equus asinus (1); Equus caballus (1); Lagothrix lagothricha lagothricha (1); Mazama rufina (1); Microryzomys altissimus (1).

### 5.4 Nombres comunes orientativos

Añadidos por conocimiento general; **no vienen de la API** y hay que validarlos.

| Científico | Nombre común |
|---|---|
| Oxypogon stuebelii | Chivito de páramo |
| Geospizopsis unicolor | Semillero plomizo |
| Zonotrichia capensis | Copetón |
| Vultur gryphus | Cóndor andino |
| Coragyps atratus | Gallinazo |
| Espeletia hartwegiana | Frailejón |
| Plantago rigida | Cojín de páramo |
| Hypericum laricifolium | Chite |
| Calamagrostis effusa | Paja de páramo |
| Ceroxylon quindiuense | Palma de cera del Quindío |
| Tapirus pinchaque | Danta de páramo |
| Puma concolor | Puma |

## 6. Especies amenazadas

Recuadro amplio: lat 4.63 a 4.95, lon −75.56 a −75.30. Categoría según el campo `iucnRedListCategory` de GBIF.

**CR, en peligro crítico (146 registros):** Ceroxylon quindiuense (140); Atelopus quimbaya (3); Araucaria angustifolia (1); Colostethus latinasus (1); Epidendrum wolfii (1).

**EN, en peligro (597 registros):** Hapalopsittaca fuertesi (446); Tapirus pinchaque (49); Oreopanax ruizanus (23); Juglans neotropica (11); Riama columbiana (11); Ocotea umbrina (9); Plutarchia monantha (8); Spizaetus isidori (6); Magnolia gilbertoi (5); Gynoxys laurata (4); Masdevallia ignea (4); Plutarchia pubiflora (4); Magnolia hernandezii (3); Niceforonia adenobrachia (3); Tripodanthus belmirensis (2); Ampelocera albertiae (1); Ilex uniflora (1); Meliosma antioquiensis (1); Miconia apiculata (1); Oryctolagus cuniculus (1); Peperomia pachystachya (1); Pitavia punctata (1); Plutarchia minor (1); Sylvilagus brasiliensis (1).

**VU, vulnerable (6.965 registros):** Oxypogon stuebelii (2521); Vultur gryphus (1280); Penelope perspicax (1125); Sericossypha albocristata (699); Bolborhynchus ferrugineifrons (514); Grallaria alleni (473); Ognorhynchus icterotis (109); Grallaria milleri (54); Aiphanes lindeniana (21); Psychotria pisonioides (21); Geissanthus francoae (15); Myrrhidendron pennellii (13); Polylepis sericea (13); Cedrela montana (12); Ocotea pedicellata (9); Tephrophilus wetmorei (8); Tringa flavipes (8); Lupinus colombiensis (7); Euplassa duquei (5); Aphelandra porphyrocarpa (4); Brunellia occidentalis (4); Osornophryne percrassa (4); Anthocephala berlepschi (3); Cordia troyana (3); Meliosma cundinamarcensis (3); Mesamphiagrion rosseri (3); Pristimantis dorsopictus (3); Prumnopitys montana (3); Retrophyllum rospigliosii (3); Elaphoglossum yatesii (2); Miconia annulata (2); Miconia polyneura (2); Andinobates bombetes (1); Aniba perutilis (1); Calidris fuscicollis (1); Centrolene quindianum (1); Citronella silvatica (1); Clusia volubilis (1); Colostethus mertensi (1); Dysonia alipes (1); Geissanthus kalbreyeri (1); Glaucidium nubicola (1); Gynoxys hirsuta (1); Hypopyrrhus pyrohypogaster (1); Mazama rufina (1); Meliosma glossophylla (1); Niceforonia latens (1); Picrasma excelsa (1); Plutarchia rigida (1); Pristimantis racemus (1); Tremarctos ornatus (1).

Nota: consultar una categoría por llamada. La consulta combinada que se probó devolvió solo el resultado de CR.

## 7. Otras consultas útiles para un guía

| Necesidad | Parámetro o ruta | ¿Probado? |
|---|---|---|
| Conteo por especie | `facet=scientificName&facetLimit=N&limit=0` | Sí |
| Filtrar grupo | `kingdomKey=6` (plantas), `classKey=212` (aves), `classKey=359` (mamíferos) | Sí |
| Filtrar amenaza | `iucnRedListCategory=EN` | Sí |
| Nombres comunes | `/species/{key}/vernacularNames` | No |
| Descripciones | `/species/{key}/descriptions` | No |
| Temporada | `month=11` | No |
| Solo con foto | `mediaType=StillImage` | No |
| Polígono exacto | `geometry=POLYGON(...)` | No |
| Cercanía a un punto | `geoDistance=lat,lon,5km` | No |

No se encontró en las respuestas revisadas: senderos, horarios, tarifas, cierres, riesgo volcánico ni dificultad.

## Anexo: script para descargar todo

Requiere Python 3 e internet; no usa librerías externas. Guarda los JSON crudos en `datos_gbif/`.

```bash
python descargar_gbif.py              # dataset, taxones y especies por sección
python descargar_gbif.py --registros  # además, los registros de cada sección
```

```python
import json, sys, time, urllib.parse, urllib.request
from pathlib import Path

API = "https://api.gbif.org/v1"
DATASET = "4493273e-47df-487e-b285-f8e5062d2b14"
SALIDA = Path("datos_gbif")
SECCIONES = {
    "original": ("4.63,4.85", "-75.56,-75.36"),
    "norte": ("4.87,4.95", "-75.39,-75.31"),
    "centro": ("4.76,4.83", "-75.45,-75.36"),
    "suroccidente": ("4.63,4.70", "-75.50,-75.42"),
}


def pedir(ruta, **params):
    url = f"{API}/{ruta}"
    if params:
        url += "?" + urllib.parse.urlencode(params)
    for intento in range(3):
        try:
            with urllib.request.urlopen(url, timeout=60) as r:
                return json.load(r)
        except OSError:
            if intento == 2:
                raise
            time.sleep(5)


def paginar(ruta, tam, maximo=100000, **params):
    filas, inicio = [], 0
    while inicio < maximo:
        pagina = pedir(ruta, limit=tam, offset=inicio, **params)
        filas += pagina["results"]
        if pagina["endOfRecords"]:
            return filas
        inicio += tam
    print(f"Aviso: {ruta} se cortó en {len(filas)} filas")
    return filas


def guardar(nombre, datos):
    texto = json.dumps(datos, ensure_ascii=False, indent=2)
    (SALIDA / f"{nombre}.json").write_text(texto, encoding="utf-8")
    print("Guardado", nombre)


def main():
    SALIDA.mkdir(exist_ok=True)
    guardar("dataset", pedir(f"dataset/{DATASET}"))
    guardar("taxones", paginar("species/search", 500, datasetKey=DATASET))
    for nombre, (lat, lon) in SECCIONES.items():
        filtro = dict(country="CO", decimalLatitude=lat, decimalLongitude=lon)
        guardar(f"especies_{nombre}", pedir(
            "occurrence/search", limit=0, facet="scientificName",
            facetLimit=10000, **filtro))
        if "--registros" in sys.argv and nombre != "original":
            guardar(f"registros_{nombre}",
                    paginar("occurrence/search", 300, **filtro))


if __name__ == "__main__":
    main()
```

Si una sección supera 100.000 registros, la búsqueda no los entrega todos; para eso está la descarga masiva de GBIF (requiere cuenta).
