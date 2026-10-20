// Captura una página con el navegador de Remotion (Chrome Headless Shell) pudiendo antes pulsar un botón
// (rechazar el aviso de cookies) o quitar elementos que tapan la página. Lo llama captura.py.
//
//   node captura_cdp.mjs <chrome> <url> <salida.png> <ancho> <alto> [--clic "texto del botón"]…
//                        [--ocultar "selector css"]… [--espera 2500] [--bajar 600]
//
// Sin dependencias: usa fetch y WebSocket de Node (22 o superior) para hablar con el navegador.
import {spawn} from 'node:child_process';
import {mkdtempSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

const [chrome, url, salida, ancho, alto, ...resto] = process.argv.slice(2);
const clics = [];
const ocultar = [];
let espera = 2500;
let bajar = 0;
for (let k = 0; k < resto.length; k += 2) {
	if (resto[k] === '--clic') clics.push(resto[k + 1]);
	else if (resto[k] === '--ocultar') ocultar.push(resto[k + 1]);
	else if (resto[k] === '--espera') espera = Number(resto[k + 1]);
	else if (resto[k] === '--bajar') bajar = Number(resto[k + 1]);
}
if (typeof WebSocket === 'undefined') {
	console.error('Hace falta Node 22 o superior para pulsar botones antes de capturar.');
	process.exit(3);
}

const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const perfil = mkdtempSync(join(tmpdir(), 'editor-reels-captura-'));
const puerto = 9300 + Math.floor(Math.random() * 600);
const proc = spawn(
	chrome,
	['--headless', '--disable-gpu', '--hide-scrollbars', '--no-first-run', `--remote-debugging-port=${puerto}`, `--user-data-dir=${perfil}`, `--window-size=${ancho},${alto}`, 'about:blank'],
	{stdio: 'ignore'},
);
const cerrar = (codigo) => {
	try {
		proc.kill();
	} catch {}
	setTimeout(() => {
		try {
			rmSync(perfil, {recursive: true, force: true});
		} catch {}
		process.exit(codigo);
	}, 400);
};

try {
	let pagina;
	for (let n = 0; n < 60 && !pagina; n++) {
		await dormir(250);
		try {
			const lista = await (await fetch(`http://127.0.0.1:${puerto}/json/list`)).json();
			pagina = lista.find((x) => x.type === 'page');
		} catch {}
	}
	if (!pagina) throw new Error('el navegador no ha arrancado');
	const ws = new WebSocket(pagina.webSocketDebuggerUrl);
	await new Promise((ok, mal) => {
		ws.onopen = ok;
		ws.onerror = () => mal(new Error('no se pudo conectar con el navegador'));
	});
	let id = 0;
	const pendientes = new Map();
	const oyentes = new Map();
	ws.onmessage = (ev) => {
		const m = JSON.parse(ev.data);
		if (m.id && pendientes.has(m.id)) {
			const {ok, mal} = pendientes.get(m.id);
			pendientes.delete(m.id);
			m.error ? mal(new Error(m.error.message)) : ok(m.result);
		} else if (m.method && oyentes.has(m.method)) {
			oyentes.get(m.method)(m.params);
			oyentes.delete(m.method);
		}
	};
	const enviar = (method, params = {}) =>
		new Promise((ok, mal) => {
			pendientes.set(++id, {ok, mal});
			ws.send(JSON.stringify({id, method, params}));
		});
	const evaluar = async (expression) => (await enviar('Runtime.evaluate', {expression, returnByValue: true, awaitPromise: true})).result?.value;

	await enviar('Page.enable');
	await enviar('Emulation.setDeviceMetricsOverride', {width: Number(ancho), height: Number(alto), deviceScaleFactor: 2, mobile: false});
	const cargada = new Promise((ok) => oyentes.set('Page.loadEventFired', ok));
	await enviar('Page.navigate', {url});
	await Promise.race([cargada, dormir(25000)]);
	await dormir(espera);

	for (const texto of clics) {
		const pulsado = await evaluar(`(() => {
			const quiero = ${JSON.stringify(texto)}.trim().toLowerCase();
			const lim = (s) => (s || '').replace(/\\s+/g, ' ').trim().toLowerCase();
			const todos = [...document.querySelectorAll('button, [role="button"], a, input[type="button"], input[type="submit"]')];
			const visible = (e) => { const r = e.getBoundingClientRect(); return r.width > 4 && r.height > 4; };
			const el = todos.find((e) => visible(e) && lim(e.innerText || e.value || e.getAttribute('aria-label')) === quiero)
				|| todos.find((e) => visible(e) && lim(e.innerText || e.value || e.getAttribute('aria-label')).includes(quiero));
			if (!el) return false;
			el.click();
			return true;
		})()`);
		console.log(pulsado ? `Pulsado: «${texto}»` : `No encuentro un botón con el texto «${texto}»`);
		await dormir(2000);
	}
	for (const sel of ocultar) {
		// "fijos": las barras pegadas arriba o abajo de la ventana (avisos de cookies, de idioma, de "abre la app")
		const n =
			sel === 'fijos'
				? await evaluar(`(() => {
					let n = 0;
					for (const e of [...document.querySelectorAll('body *')]) {
						if (!e.isConnected) continue;
						const pos = getComputedStyle(e).position;
						if (pos !== 'fixed' && pos !== 'sticky') continue;
						const r = e.getBoundingClientRect();
						if (r.width > innerWidth * 0.5 && r.height > 8 && r.height < innerHeight * 0.5) { e.remove(); n++; }
					}
					return n;
				})()`)
				: await evaluar(`(() => { const e = [...document.querySelectorAll(${JSON.stringify(sel)})]; e.forEach((x) => x.remove()); return e.length; })()`);
		console.log(`Quitados ${n} elementos «${sel}»`);
	}
	await evaluar(`window.scrollTo(0, ${bajar})`);
	await dormir(700);
	const {data} = await enviar('Page.captureScreenshot', {format: 'png'});
	writeFileSync(salida, Buffer.from(data, 'base64'));
	ws.close();
	cerrar(0);
} catch (e) {
	console.error(String(e?.message || e));
	cerrar(2);
}
