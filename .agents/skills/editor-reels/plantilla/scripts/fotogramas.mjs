// Renderiza fotogramas sueltos de un reel para revisarlos sin renderizar el vídeo entero.
// Uso: node scripts/fotogramas.mjs reels/<reel>/edl.json <carpeta_salida> 1.0 6.2 12.5 ...
//          [--escala 0.5] [--comp Reel|ReelPro] [--zonas]
//   --comp   la composición: Reel (modo clásico, por defecto) o ReelPro (modo pro, con edl_pro.json)
//   --zonas  dibuja encima lo que tapa la interfaz de Instagram (solo ReelPro)
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const args = process.argv.slice(2);
const opcion = (nombre, defecto) => {
	const k = args.indexOf(nombre);
	return k >= 0 ? args.splice(k, 2)[1] : defecto;
};
const bandera = (nombre) => {
	const k = args.indexOf(nombre);
	if (k >= 0) args.splice(k, 1);
	return k >= 0;
};
const escala = parseFloat(opcion('--escala', '0.5'));
const comp = opcion('--comp', 'Reel');
const zonas = bandera('--zonas');
const [edl, salida, ...tiempos] = args;
fs.mkdirSync(salida, {recursive: true});

// Carpeta temporal propia. Remotion deja en la carpeta temporal del sistema una copia del proyecto por ejecución
// (~100 MB) y otra del vídeo base por cada fotograma, y en Windows no siempre las borra: en unas pocas sesiones
// llenan el disco. Aquí todo va a una carpeta nuestra, que se vacía tras cada fotograma y se borra al acabar.
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'editor-reels-'));
for (const k of ['TEMP', 'TMP', 'TMPDIR']) process.env[k] = tmp;
const borrar = (ruta) => {
	try {
		fs.rmSync(ruta, {recursive: true, force: true, maxRetries: 4, retryDelay: 150});
	} catch {
		// un archivo todavía en uso: se borra en la limpieza final
	}
};
const limpiar = (todo) => {
	for (const d of fs.readdirSync(tmp)) {
		if (todo || d.startsWith('remotion-v')) borrar(path.join(tmp, d)); // remotion-v…-assets…: la copia del vídeo de cada fotograma
	}
};

let fallo = null;
let navegador = null;
try {
	// se importan después de fijar la carpeta temporal
	const {bundle} = await import('@remotion/bundler');
	const {ensureBrowser, openBrowser, renderStill, selectComposition} = await import('@remotion/renderer');
	await ensureBrowser(); // descarga Chrome Headless Shell la primera vez (~110 MB)
	const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts'), publicDir: path.resolve('public')});
	const inputProps = zonas ? {edl, zonas: true} : {edl};
	navegador = await openBrowser('chrome'); // un solo navegador para todos los fotogramas: más rápido y se cierra bien
	const composition = await selectComposition({serveUrl, id: comp, inputProps, puppeteerInstance: navegador});
	for (const t of tiempos) {
		const frame = Math.max(0, Math.min(composition.durationInFrames - 1, Math.round(parseFloat(t) * composition.fps)));
		const output = path.join(salida, `f_${parseFloat(t).toFixed(2).padStart(6, '0')}.jpg`);
		for (let intento = 1; ; intento++) {
			try {
				await renderStill({composition, serveUrl, output, frame, inputProps, imageFormat: 'jpeg', jpegQuality: 88, scale: escala, puppeteerInstance: navegador});
				break;
			} catch (e) {
				// un corte de red al bajar la tipografía o un fotograma que tarda: se repite antes de rendirse
				if (intento >= 3) throw e;
				console.log(`reintento ${intento} en ${t}: ${String(e && e.message ? e.message : e).split('\n')[0]}`);
			}
		}
		limpiar(false);
		console.log('ok', t);
	}
} catch (e) {
	fallo = e;
} finally {
	try {
		if (navegador) await navegador.close({silent: true});
	} catch {
		// ya estaba cerrado
	}
	// en Windows los procesos tardan un momento en soltar sus archivos: se insiste unos segundos
	for (let k = 0; k < 12 && fs.existsSync(tmp); k++) {
		limpiar(true);
		borrar(tmp);
		if (fs.existsSync(tmp)) await new Promise((r) => setTimeout(r, 400));
	}
}
if (fallo) {
	console.error(fallo);
	process.exit(1);
}
process.exit(0);
