/** motorModelo.ts con una llama.rn simulada (nunca se carga la librería real en tests). */
import { crearMotorModelo, PARAMETROS_MODELO } from '../motorModelo';

const esperar = (ms: number) => new Promise(r => setTimeout(r, ms));
const PROMPT = { sistema: 'Instrucciones', usuario: 'Fragmentos y pregunta' };

/** Contexto falso con la forma que usa motorModelo.ts. */
function llamaFalsa(opciones: { tardaMs?: number; texto?: string; initFalla?: boolean } = {}) {
  const registro = {
    inits: [] as Record<string, unknown>[],
    completions: [] as Record<string, unknown>[],
    detenidas: 0,
    liberadas: 0,
    enCurso: 0,
    maxEnParalelo: 0,
  };
  const contexto = {
    async completion(params: Record<string, unknown>) {
      registro.completions.push(params);
      registro.enCurso++;
      registro.maxEnParalelo = Math.max(registro.maxEnParalelo, registro.enCurso);
      await esperar(opciones.tardaMs ?? 0);
      registro.enCurso--;
      const texto = opciones.texto ?? ' Respuesta del modelo. ';
      return { text: texto, content: texto };
    },
    async stopCompletion() { registro.detenidas++; },
    async release() { registro.liberadas++; },
  };
  const cargar = async () => ({
    initLlama: async (params: Record<string, unknown>) => {
      registro.inits.push(params);
      if (opciones.initFalla) throw new Error('no existe el archivo');
      return contexto;
    },
  });
  return { registro, motor: crearMotorModelo(cargar as never) };
}

test('carga el modelo de la ruta con contexto 2048 y quita "file://"', async () => {
  const { registro, motor } = llamaFalsa();
  expect(motor.estaListo()).toBe(false);
  await motor.cargar('file:///sdcard/modelos/modelo.gguf');
  expect(motor.estaListo()).toBe(true);
  expect(registro.inits[0]).toMatchObject({ model: '/sdcard/modelos/modelo.gguf', n_ctx: 2048 });
  await motor.cargar('/otra/ruta.gguf');
  expect(registro.inits).toHaveLength(1); // ya cargado: no recarga
});

test('genera con mensajes de sistema y usuario, maxTokens y temperatura baja', async () => {
  const { registro, motor } = llamaFalsa();
  await motor.cargar('/m.gguf');
  await expect(motor.generar(PROMPT, 160, 1000)).resolves.toBe('Respuesta del modelo.');
  expect(registro.completions[0]).toMatchObject({
    messages: [{ role: 'system', content: 'Instrucciones' }, { role: 'user', content: 'Fragmentos y pregunta' }],
    n_predict: 160,
    temperature: PARAMETROS_MODELO.temperatura,
    enable_thinking: false,
  });
});

test('si tarda más que el timeout: rechaza y detiene la generación en el celular', async () => {
  const { registro, motor } = llamaFalsa({ tardaMs: 300 });
  await motor.cargar('/m.gguf');
  await expect(motor.generar(PROMPT, 160, 30)).rejects.toThrow(/tardó/);
  expect(registro.detenidas).toBe(1);
});

test('generar sin cargar → error (el orquestador responde con el guion)', async () => {
  const { motor } = llamaFalsa();
  await expect(motor.generar(PROMPT, 160, 1000)).rejects.toThrow(/no está cargado/);
});

test('si el archivo no carga, sigue sin estar listo', async () => {
  const { motor } = llamaFalsa({ initFalla: true });
  await expect(motor.cargar('/no/existe.gguf')).rejects.toThrow();
  expect(motor.estaListo()).toBe(false);
});

test('una generación a la vez', async () => {
  const { registro, motor } = llamaFalsa({ tardaMs: 20 });
  await motor.cargar('/m.gguf');
  await Promise.all([motor.generar(PROMPT, 10, 1000), motor.generar(PROMPT, 10, 1000), motor.generar(PROMPT, 10, 1000)]);
  expect(registro.completions).toHaveLength(3);
  expect(registro.maxEnParalelo).toBe(1);
});

test('liberar suelta el contexto; se puede volver a cargar', async () => {
  const { registro, motor } = llamaFalsa();
  await motor.cargar('/m.gguf');
  await motor.liberar();
  expect(registro.liberadas).toBe(1);
  expect(motor.estaListo()).toBe(false);
  await motor.cargar('/m.gguf');
  expect(registro.inits).toHaveLength(2);
});
