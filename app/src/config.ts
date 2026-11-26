/**
 * Configuración de la app. La inyecta C en crearAsistente (B) y en las pantallas.
 * Valores calibrados con el contenido real en B5 / D22 (punto S7) y ruta acordada en B4.
 */
import { AlcanceRestriccion, type ConfiguracionApp } from './dominio/modelo';

/** Paquete Android (app.json). La ruta del modelo depende de él. */
export const PAQUETE_ANDROID = 'co.uton.paramon';

export const CONFIG: ConfiguracionApp = {
  // Modelo local (docs/03-asistente.md §B4):
  //   adb shell mkdir -p /sdcard/Android/data/co.uton.paramon/files/modelos
  //   adb push modelo.gguf /sdcard/Android/data/co.uton.paramon/files/modelos/modelo.gguf
  rutaModelo: `/sdcard/Android/data/${PAQUETE_ANDROID}/files/modelos/modelo.gguf`,

  // Valores calibrados por Dev B sobre contenido.json real (B5 → D22, docs/03-asistente.md).
  umbralEvidencia: 3,
  maxFragmentos: 3,
  maxTokens: 200,
  timeoutModeloMs: 20000,

  // sha256 (hex) de la contraseña global del editor de guion. Demo: 'paramon2026'.
  pinAdministracion: '5788e24506f42cfac8058935f8339a29f533ec2a0cd3fae3ccc654af85649482',
  idioma: 'es',

  // Zona del páramo (D13): lógica presente, desactivada para pruebas y demo.
  geocercaActiva: false,
  alcanceRestriccion: AlcanceRestriccion.APP_COMPLETA,
  precisionMaximaM: 50,
  intervaloGpsMs: 30000,

  // sha256 (hex) del PIN del modo demo (Ajustes). Demo: '2468'.
  pinModoDemo: 'a1fb4e703a9ef1fa4936801721ff285a97ac85330856674412e054892afe6972',
};
