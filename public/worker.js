// Web Worker: jeden render = jedna nová instance OpenSCAD WASM.
// Emscripten callMain() spolehlivě funguje jen jednou na instanci, takže se
// kešuje jen zkompilovaný WebAssembly.Module a instance se tvoří pokaždé znovu.
import OpenSCAD from './vendor/openscad/openscad.js';

const wasmModule = WebAssembly.compileStreaming(
  fetch(new URL('./vendor/openscad/openscad.wasm', import.meta.url)),
);
const scadSource = fetch(new URL('./cable.scad', import.meta.url), { cache: 'no-cache' }).then((r) => r.text());

self.onmessage = async ({ data: { id, defs } }) => {
  const log = [];
  try {
    const [module, source] = await Promise.all([wasmModule, scadSource]);
    const inst = await OpenSCAD({
      noInitialRun: true,
      print: (s) => log.push(s),
      printErr: (s) => log.push(s),
      instantiateWasm(imports, receive) {
        WebAssembly.instantiate(module, imports).then((instance) => receive(instance, module));
        return {};
      },
    });
    inst.FS.writeFile('/cable.scad', source);
    const args = Object.entries(defs).map(
      ([k, v]) => `-D${k}=${typeof v === 'string' ? JSON.stringify(v) : v}`,
    );
    const rc = inst.callMain([
      '/cable.scad', '-o', '/out.stl', '--backend=manifold', '--export-format=binstl', ...args,
    ]);
    if (rc !== 0) throw new Error(`OpenSCAD skončil s kódem ${rc}`);
    const stl = inst.FS.readFile('/out.stl').buffer;
    self.postMessage({ id, stl, log }, [stl]);
  } catch (e) {
    self.postMessage({ id, error: String(e?.message ?? e), log });
  }
};
