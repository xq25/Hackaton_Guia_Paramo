# Reto: Guía de páramo sin señal – Ficha técnica para participantes

## El problema

Los visitantes del Parque Nacional Natural Los Nevados llegan a las estaciones ecoturísticas con preguntas. El recorrido de referencia va desde Brisas hasta el Valle de las Tumbas, pasando por Aguacerales, Arenales y Lunares. En esos puntos no hay internet, señal celular ni red eléctrica que les permita hacer consultas en línea.

El parque es un ecosistema de páramo y alta montaña, y una estrella hídrica que abastece de agua a millones de personas del Eje Cafetero y del centro del país. Es muy sensible a la presencia humana, y en alta montaña una mala decisión del visitante tiene consecuencias reales para su seguridad.

La Unión Temporal Operación Nevados (UTON) opera el ecoturismo en el parque. Hoy la orientación y la interpretación ambiental dependen casi por completo de la charla de los guardaparques y orientadores, lo que genera tres límites:

* **Cobertura:** en temporada alta, el personal difícilmente puede atender todas las preguntas de los visitantes.
* **Continuidad:** fuera de la charla de inducción, el visitante no tiene a quién consultar sobre fauna, flora, conservación o seguridad.
* **Tecnología:** las apps en línea, los códigos QR con enlaces y los asistentes en la nube no funcionan en el territorio.

El asistente no busca reemplazar al guía ni al personal del parque. Busca apoyar su labor en cada estación con información revisada.

## El reto

**Pregunta orientadora:** ¿Cómo podríamos usar la inteligencia artificial para que cada visitante del PNN Los Nevados reciba orientación e interpretación ambiental confiable en las estaciones ecoturísticas, sin depender de internet, de señal celular ni de la red eléctrica?

En 6 horas, cada equipo debe diseñar y construir un prototipo funcional de un asistente de IA que:

1. **Funcione 100 % sin conexión**, con un modelo de lenguaje ejecutado localmente en el dispositivo entregado por la organización.
2. **Responda con el contenido validado por UTON**, tomado de los dos guiones entregados. Cada respuesta debe indicar el guion y la página que la respaldan.
3. **Reconozca sus límites:** si la respuesta no está respaldada por los guiones, estos se contradicen o se requiere información actual, debe decirlo y remitir al guía o al personal del parque. Nunca debe inventar indicaciones de seguridad.
4. **Pueda ser actualizado por el personal del parque** mediante fichas de contenido revisadas, sin modificar el código.
5. **Sea viable en una estación de alta montaña**, con un consumo de energía que permita alimentarlo de forma autónoma.
6. **Sirva a visitantes de distintas edades**, con lenguaje claro y una interfaz sencilla en español. La voz y la respuesta en inglés serán mejoras opcionales.

El prototipo es una demostración en el lugar de la jornada; no se instala en el parque durante la hackathon.

## Contenido mínimo de los guiones

**Aguacerales:** el agua del páramo, los frailejones y la conservación del ecosistema.

**Arenales:** las dunas, el viento, la memoria del esquí y el retroceso glaciar.

**Lunares (también llamado Valle Lunar):** las rocas, la gelifracción, la oxidación y la vegetación pionera.

**Valle de las Tumbas:** la memoria cultural del territorio, la fragilidad del paisaje y el respeto por las restricciones del recorrido.

Los documentos base son el Guion Ecoturístico UTON 2024 y el Guion turístico zona norte. Brisas sirve como introducción al recorrido. El asistente puede ofrecer primero una explicación breve y, si el visitante lo desea, ampliar la información. Los relatos culturales deben distinguirse de los hechos científicos; cuando los guiones difieran, la respuesta debe expresar esa incertidumbre.

## Dificultades técnicas a considerar

Armar un chatbot local básico no resuelve el reto. La dificultad está en que todas estas restricciones se cumplan a la vez, en un hardware limitado y con información en la que un error puede afectar la seguridad de una persona.

| **Dificultad** | **Por qué es difícil** | **Preguntas que el equipo debe resolver** |
| --- | --- | --- |
| Sin conexión | Modelo, búsqueda e interfaz deben funcionar localmente, sin servicios en la nube ni APIs externas. | ¿Qué componentes dependen hoy de internet y cómo los reemplazamos? |
| Hardware limitado | El dispositivo entregado tendrá recursos limitados; un modelo grande puede no caber o responder lentamente. | ¿Qué modelo y qué nivel de cuantización dan el mejor equilibrio entre calidad y velocidad? |
| Tiempo de respuesta | Un visitante en el páramo no espera un minuto por una respuesta; un modelo más pequeño responde rápido pero se equivoca más | ¿Cómo respondemos rápido sin perder precisión? |
| Respuestas inventadas | Los modelos de lenguaje tienden a responder con seguridad aunque no tengan la información; en alta montaña eso es peligroso | ¿Cómo obligamos al asistente a responder solo desde el contenido oficial y a decir "no sé" cuando corresponde? |
| Trazabilidad | El personal y el visitante deben saber de dónde sale cada respuesta | ¿Cómo mostramos el documento oficial que respalda cada respuesta? |
| Preguntas difíciles | Los visitantes preguntan fuera de tema, con errores o con premisas falsas (por ejemplo, si se pueden bañar en una laguna) | ¿Cómo detectamos y manejamos preguntas fuera de tema o engañosas? |
| Actualización del contenido | Las normas y recomendaciones cambian, y quien actualiza es personal del parque, no programadores | ¿Cómo carga el personal un documento nuevo en pocos minutos y sin tocar código? |
| Voz sin internet (opcional) | La interacción por voz puede ayudar a algunos visitantes, pero añade carga al dispositivo. | Si se incorpora, ¿cómo se ejecutará totalmente sin conexión? |
| Varios idiomas (opcional) | La información base está en español; una traducción automática puede cambiar su sentido. | Si se ofrece inglés, ¿cómo se verifica su fidelidad al contenido? |
| Energía y ambiente | Las estaciones no tienen red eléctrica y están en condiciones de frío, humedad y altitud | ¿Cuánto consume el prototipo y qué alimentación autónoma podría necesitar una estación? |
| Usuarios diversos | El asistente debe servir a niños, adultos y personas mayores, con o sin experiencia tecnológica | ¿Cómo es una interacción clara y sencilla para todos? |

| **Entregable** | **Descripción** |
| --- | --- |
| Prototipo funcional | Demostración sin conexión, con preguntas por estación, una sin respuesta en los guiones y otra sobre seguridad; el jurado verificará las fuentes y la abstención. |
| Código fuente | En repositorio o memoria USB, con instrucciones mínimas para ejecutarlo |
| Ficha de una página | Modelo y herramientas usados, consumo medido, costo estimado por estación, cómo se actualiza el contenido, y cómo se podría sostener y replicar la solución |
| Pitch | Presentación de 3 minutos ante el jurado |

## Reglas básicas

* Se permite usar modelos y librerías de código abierto; ningún componente puede depender de internet durante la demostración.
* Está prohibido usar el contenido oficial para fines distintos al reto.
* No se recogen datos personales de los visitantes.
