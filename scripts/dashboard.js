// scripts/dashboard.js
// PANEL WEB LOCAL de QA B2C — checks estructurales + correos de pedido.
//
// Una sola superficie clickeable para correr el sistema post-liberación B2C sin
// memorizar comandos. Pensado para DEMO a testers/devs y para uso práctico diario.
//
// Arranca:  npm run dashboard     → abre http://127.0.0.1:4599
//
// DISEÑO / GUARDAS (decidido con el usuario, s18-s19):
//   • Ambiente seleccionable: QA (default) o Producción. Producción es SOLO para
//     monitoreo — checks de lectura + ruta autenticada. Las acciones que mutan datos
//     reales (crear-orden, pipeline de correos) están BLOQUEADAS en prod por un guard
//     en el servidor (PROD_BLOCKED), no solo en la UI → no se puede disparar por error.
//   • Headed/headless: toggle GLOBAL, arranca en HEADED (con ventana) para demos.
//   • UI simplificada (s19): dos tarjetas — "Checks estructurales" (Health/Contracts/
//     Suite anónima + botón "Revisar sitio" que corre todo) y "Correos de pedido"
//     (pipeline Capa 2 de un clic). Resultados = palomita por check + log colapsable.
//   • Correos: si hay App Password (GMAIL_IMAP_PASS) lista los correos por IMAP
//     (Modo B); si no, muestra link al inbox de Gmail (Modo A, verificación por agente).
//   • Seguridad: bind solo a 127.0.0.1; acciones en ALLOWLIST; inputs validados
//     (orden alfanumérica, estados de catálogo). NO ejecuta comandos arbitrarios.
//
// Sin dependencias externas para el server (http + child_process). imapflow se usa
// SOLO si hay credenciales (lazy require).

require('dotenv').config();
const http = require('http');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { URL } = require('url');

const ROOT = path.resolve(__dirname, '..');
const HOST = '127.0.0.1';
const PORT = Number(process.env.DASH_PORT || 4599);
// Ambientes seleccionables. QA es el default seguro; Producción solo se usa para
// MONITOREO (checks de lectura + ruta autenticada). El cambio de ambiente solo afecta
// a qué SITIO apuntan los checks de Playwright (B2C_BASE_URL); las acciones de
// Commercetools/IMAP (order-*, move-state, IMAP) son independientes del sitio.
const ENVS = {
  qa:   { label: 'QA',          base: 'https://qarotoplasmx.io' },
  prod: { label: 'Producción',  base: 'https://rotoplas.com.mx' },
};
const BASE_QA = ENVS.qa.base; // compat (conteo de health, etc.)
const envBase = (e) => (ENVS[e] ? ENVS[e].base : ENVS.qa.base);

// GUARD de seguridad: acciones que MUTAN datos reales vía el sitio (crean pedidos y
// disparan correos a clientes reales). PROHIBIDAS en producción — solo disponibles en QA.
// Este guard vive en el SERVIDOR (la barrera real); la UI además las deshabilita visualmente.
const PROD_BLOCKED = new Set(['crear-orden', 'capa2-auto']);

// ─── Configuración editable desde el panel (sección "Configuración") ─────────
// Permite a alguien no-técnico capturar las credenciales sin abrir el .env a mano.
// Solo se aceptan estas llaves (allowlist) → el endpoint NUNCA escribe llaves arbitrarias.
// El B2C_USER/B2C_PASS alimentan setup-auth-b2c.js (genera la sesión @auth).
const ENV_FIELDS = [
  { group: 'Sesión B2C (ruta autenticada)', items: [
    { key: 'B2C_USER', label: 'Usuario B2C', secret: false, hint: 'correo de la cuenta de pruebas' },
    { key: 'B2C_PASS', label: 'Contraseña B2C', secret: true },
  ]},
  { group: 'Correos de pedido (Gmail · Modo B)', items: [
    { key: 'GMAIL_IMAP_USER', label: 'Correo del buzón', secret: false, hint: 'p. ej. c.agarcia@rotoplas.com' },
    { key: 'GMAIL_IMAP_PASS', label: 'App Password (16 caracteres)', secret: true, hint: 'contraseña de aplicación de Gmail, NO la normal' },
  ]},
  // Commercetools: NO se captura en la UI. Sus 6 valores (CT_*) vienen del .env
  // (un API Client compartido en privado entre el equipo). dotenv los carga al
  // arrancar y saveEnv preserva esas líneas al guardar; ct-api.js las lee directo.
  { group: 'BrowserStack (mobile real · opcional)', items: [
    { key: 'BROWSERSTACK_USERNAME', label: 'Usuario', secret: false },
    { key: 'BROWSERSTACK_ACCESS_KEY', label: 'Access key', secret: true },
  ]},
  { group: 'API interna (scripts · opcional)', items: [
    { key: 'API_ENDPOINT', label: 'API endpoint', secret: false },
    { key: 'API_AUTH', label: 'API auth', secret: true },
    { key: 'API_COMPRA_RAPIDA', label: 'API compra rápida', secret: false },
    { key: 'API_EVIDENCE_ENDPOINT', label: 'API evidencias', secret: false },
  ]},
];
const ENV_ALLOW = new Set(ENV_FIELDS.flatMap((g) => g.items.map((i) => i.key)));

// Escribe los valores al .env (preservando lo demás) y actualiza process.env EN VIVO,
// para que tanto los procesos hijos (spawn) como IMAP vean los cambios sin reiniciar.
function saveEnv(values) {
  const file = path.join(ROOT, '.env');
  const set = {};
  Object.keys(values || {}).forEach((k) => {
    if (ENV_ALLOW.has(k) && values[k] != null && String(values[k]) !== '') set[k] = String(values[k]);
  });
  let lines = [];
  try { lines = fs.readFileSync(file, 'utf8').split(/\r?\n/); } catch (_) { lines = []; }
  const seen = {};
  lines = lines.map((line) => {
    const m = line.match(/^([A-Z0-9_]+)=/);
    if (m && Object.prototype.hasOwnProperty.call(set, m[1])) { seen[m[1]] = true; return m[1] + '=' + set[m[1]]; }
    return line;
  });
  Object.keys(set).forEach((k) => { if (!seen[k]) lines.push(k + '=' + set[k]); });
  fs.writeFileSync(file, lines.join('\n'));
  Object.keys(set).forEach((k) => { process.env[k] = set[k]; }); // efecto inmediato
  return Object.keys(set);
}

// Conteo dinámico de URLs de health (fuente única: _targets.js) → no se desfasa
// si agregan/quitan URLs. Si no se puede leer, queda 0 y la UI usa su fallback.
let HEALTH_COUNT = 0;
try { HEALTH_COUNT = require('../tests/_targets').HEALTH_URLS.length; } catch (_) { /* opcional */ }

// ─── Catálogos de estado (de ct-api.js) ─────────────────────────────────────
const ORDER_STATES    = ['Open', 'Confirmed', 'Complete', 'Cancelled'];
const SHIPMENT_STATES = ['Backorder', 'Delayed', 'Delivered', 'Partial', 'Pending', 'Ready', 'Shipped'];
const PAYMENT_STATES  = ['Paid', 'Pending', 'Failed'];

// value → { flag, label } para el dropdown de "mover estado" (prefijo evita choque Pending)
const STATE_MAP = {};
ORDER_STATES.forEach(s    => STATE_MAP[`order:${s}`]    = { flag: '--b2c-set-state',    state: s, label: `orderState · ${s}` });
SHIPMENT_STATES.forEach(s => STATE_MAP[`ship:${s}`]     = { flag: '--b2c-set-shipment', state: s, label: `shipmentState · ${s}` });
PAYMENT_STATES.forEach(s  => STATE_MAP[`pay:${s}`]      = { flag: '--b2c-set-payment',  state: s, label: `paymentState · ${s}` });

// ─── ALLOWLIST de acciones que abren proceso ────────────────────────────────
// usesBrowser: respeta el toggle headed/headless. needsOrder: requiere nº de orden.
const ACTIONS = {
  'crear-orden':    { kind: 'node', argv: ['scripts/crear-orden-b2c.js'], usesBrowser: true,  usesOrderOpts: true, label: 'Crear orden B2C' },
  'capa2-auto':     { kind: 'node', argv: ['scripts/capa2-run.js'],       usesBrowser: true,  label: 'Pipeline Capa 2 (auto)' },
  'health':         { kind: 'pw',   grep: ['--grep', '@health'],                              label: 'Health check (16 URLs + link-check)' },
  'content':        { kind: 'pw',   grep: ['--grep', '@content'],          usesBrowser: true, label: 'Contenido mínimo por URL' },
  // Check en capas (fusión Health+Content, decisión s24): el 200 es el paso rápido
  // interno; el render real (title+header) es la prueba que vale. Una sola fila en la
  // UI; el triage sigue separando ambiente (200 falla) vs render (200 ok, contenido no).
  'responde':       { kind: 'pw',   grep: ['--grep', '@health|@content'],  usesBrowser: true, label: 'Responden y renderizan' },
  'contracts':      { kind: 'pw',   grep: ['--grep', '@contract'],         usesBrowser: true, label: 'Contracts DOM' },
  'forms':          { kind: 'pw',   grep: ['--grep', '@forms'],           usesBrowser: true, label: 'Formularios' },
  'check-all':      { kind: 'pw',   grep: ['--grep-invert', '@capa2'],     usesBrowser: true, label: 'Revisar sitio (todos los checks)' },
  'check-imap':     { kind: 'node', argv: ['scripts/check-imap.js'],                           label: 'Verificar IMAP' },
  'gen-auth-b2c':   { kind: 'node', argv: ['setup-auth-b2c.js'],          usesBrowser: true,    label: 'Generar sesión B2C (login)' },
  'order-status':   { kind: 'node', argv: ['scripts/ct-api.js', '--b2c'],          needsOrder: true, label: 'Ver estado de orden' },
  'order-payments': { kind: 'node', argv: ['scripts/ct-api.js', '--b2c-payment'],  needsOrder: true, label: 'Ver pagos de orden' },
  'order-messages': { kind: 'node', argv: ['scripts/ct-api.js', '--b2c-messages'], needsOrder: true, label: 'Ver historial de orden' },
  'move-state':     { kind: 'node', argv: ['scripts/ct-api.js'], needsOrder: true, needsState: true, label: 'Mover estado de orden' },
  // Estructura crítica desglosada POR ÁREA (s23): corre subconjuntos por archivo de
  // spec en vez del @contract global → un pill por área. needsArea: valida la clave
  // contra AREAS y arma los paths de spec (nunca rutas arbitrarias).
  'area':           { kind: 'pw',   needsArea: true, usesBrowser: true, label: 'Estructura crítica por área' },
};

// ─── Áreas de "Estructura crítica" (desglose por archivo de spec) ───────────
// auth:true → la corrida necesita sesión B2C (rotoplas-auth-b2c.json); sin ella
// los specs @auth hacen skip → el panel lo pinta ámbar "omitido", no rojo.
const AREAS = {
  'cascaron':      { label: 'Cascarón global',   files: ['1-global-layout'] },
  'home':          { label: 'Home',              files: ['1-home'] },
  'pdp':           { label: 'Catálogo / PDP',    files: ['1-pdp'] },
  'servicios':     { label: 'Servicios',         files: ['1-servicios', '1-servicio-lavado'] },
  'dinero':        { label: 'Ruta del dinero',   files: ['2-cart-empty', '2-money-path'], auth: true },
  'cuenta':        { label: 'Mi cuenta',         files: ['2-customer'],                    auth: true },
  'institucional': { label: 'Institucional',     files: ['1-contacto', '1-faq', '1-distribuidores', '1-legales'] },
};
const areaSpecPath = (f) => `tests/${f}.contract.spec.js`;

const isOrder = (s) => typeof s === 'string' && /^[A-Za-z0-9]{5,24}$/.test(s);
const imapMode = () => (process.env.GMAIL_IMAP_USER && process.env.GMAIL_IMAP_PASS ? 'B' : 'A');

// Opciones válidas para "Crear orden" (allowlist → nunca env arbitrario).
const ORDER_TIPOS = ['fisico', 'servicio'];
const ORDER_PAGOS = ['credito', 'debito', 'transferencia', 'efectivo'];

// ─── Construye el comando para una acción ───────────────────────────────────
function buildCommand(action, { order, stateValue, headed, tipo, pago, area, env }) {
  const a = ACTIONS[action];
  if (!a) throw new Error(`acción no permitida: ${action}`);

  const target = env === 'prod' ? 'prod' : 'qa';
  // GUARD: nunca dejar correr una acción que muta datos reales contra producción.
  if (target === 'prod' && PROD_BLOCKED.has(action)) {
    throw new Error('bloqueada en PRODUCCIÓN: crearía pedidos y correos reales. Solo disponible en QA.');
  }
  const base = envBase(target);

  const penv = { ...process.env, B2C_BASE_URL: base, HEADED: a.usesBrowser && headed ? '1' : '0' };

  // Opciones de creación de orden (tipo de producto + método de pago). Validadas
  // contra allowlist → el script las recibe por env, imitando al usuario real.
  if (a.usesOrderOpts) {
    penv.CAPA2_TIPO = ORDER_TIPOS.includes(tipo) ? tipo : 'fisico';
    penv.CAPA2_PAGO = ORDER_PAGOS.includes(pago) ? pago : 'credito';
  }

  if (a.kind === 'node') {
    const argv = [...a.argv];
    if (a.needsOrder) {
      if (!isOrder(order)) throw new Error('número de orden inválido');
    }
    if (action === 'move-state') {
      const m = STATE_MAP[stateValue];
      if (!m) throw new Error('estado inválido');
      argv.push(m.flag, order, m.state);
    } else if (a.needsOrder) {
      argv.push(order);
    }
    return { cmd: 'node', args: argv, env: penv, base, shell: false, pretty: `node ${argv.join(' ')}` };
  }

  // Playwright. El reporter propio (dash-reporter) emite eventos @@DASH por test
  // → habilita la lista de pruebas EN VIVO del panel; `list` queda para el log técnico.
  const args = ['playwright', 'test', '--project=b2c-contracts',
    '--reporter=./scripts/dash-reporter.js,list'];
  // En shell:true, un '|' dentro del patrón de --grep sería un PIPE de shell y rompería
  // el comando (ej. "@health|@content"). Entrecomillamos los valores con metacaracteres
  // de shell; las flags (--grep) y rutas no los tienen → quedan igual.
  const q = (v) => (/[|&()<>^]/.test(v) ? `"${v}"` : v);
  if (a.needsArea) {
    const ar = AREAS[area];
    if (!ar) throw new Error('área inválida');
    // Filtro por archivo(s) de spec (positional) + solo @contract dentro de ellos.
    ar.files.forEach((f) => args.push(areaSpecPath(f)));
    args.push('--grep', '@contract');
  } else {
    a.grep.forEach((v) => args.push(q(v)));
  }
  if (a.usesBrowser && headed) args.push('--headed');
  return { cmd: 'npx', args, env: penv, base, shell: true, pretty: `npx ${args.join(' ')}` };
}

// ─── SSE: corre el comando y transmite su salida línea por línea ─────────────
function streamRun(req, res, params) {
  let built;
  try { built = buildCommand(params.action, params); }
  catch (e) { res.writeHead(400); res.end(`error: ${e.message}`); return; }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });
  const send = (event, data) => res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  send('meta', { pretty: built.pretty, headed: params.headed, base: built.base });

  const child = spawn(built.cmd, built.args, { cwd: ROOT, env: built.env, shell: built.shell });
  let buf = { out: '', err: '' };
  let tail = ''; // últimos KB de salida combinada → para parsear el resumen de Playwright
  const pump = (chunk, key) => {
    const s = chunk.toString();
    tail = (tail + s).slice(-6000);
    buf[key] += s;
    const lines = buf[key].split('\n');
    buf[key] = lines.pop();
    for (const line of lines) send('line', { stream: key, text: line });
  };
  child.stdout.on('data', (c) => pump(c, 'out'));
  child.stderr.on('data', (c) => pump(c, 'err'));
  child.on('close', (code) => {
    if (buf.out) send('line', { stream: 'out', text: buf.out });
    if (buf.err) send('line', { stream: 'err', text: buf.err });
    // Resumen de Playwright (si la corrida fue de tests) → distingue OK de "omitido".
    // Un run 100% skipped (ej. @capa2 en Modo A sin App Password) sale con code 0 pero
    // NO verificó nada → el cliente lo pinta ámbar "omitido", no verde engañoso.
    const n = (re) => { const m = tail.match(re); return m ? Number(m[1]) : 0; };
    const summary = { passed: n(/(\d+) passed/), failed: n(/(\d+) failed/), skipped: n(/(\d+) skipped/), flaky: n(/(\d+) flaky/) };
    send('done', { code, summary });
    res.end();
  });
  child.on('error', (e) => { send('line', { stream: 'err', text: `spawn error: ${e.message}` }); send('done', { code: 1 }); res.end(); });
  req.on('close', () => { try { child.kill(); } catch (_) {} });
}

// ─── IMAP: lista correos de ventasecom (solo Modo B) ────────────────────────
async function listEmails(order) {
  if (imapMode() !== 'B') return { mode: 'A' };
  let ImapFlow;
  try { ({ ImapFlow } = require('imapflow')); } catch { return { mode: 'B', error: 'falta imapflow (npm i imapflow)' }; }
  const client = new ImapFlow({
    host: 'imap.gmail.com', port: 993, secure: true,
    auth: { user: process.env.GMAIL_IMAP_USER, pass: process.env.GMAIL_IMAP_PASS }, logger: false,
  });
  const out = [];
  try {
    await client.connect();
    const lock = await client.getMailboxLock('INBOX');
    try {
      const since = new Date(Date.now() - 2 * 60 * 60 * 1000);
      const uids = await client.search({ from: 'ventasecom@rotoplas.com', since }, { uid: true });
      for (const uid of uids.reverse()) {
        const msg = await client.fetchOne(uid, { envelope: true, source: Boolean(order) }, { uid: true });
        if (!msg) continue;
        if (order) { const body = msg.source ? msg.source.toString('utf8') : ''; if (!body.includes(order)) continue; }
        out.push({ subject: msg.envelope?.subject || '', date: msg.envelope?.date });
        if (out.length >= 25) break;
      }
    } finally { lock.release(); }
  } catch (e) { return { mode: 'B', error: e.responseText || e.message }; }
  finally { await client.logout().catch(() => {}); }
  return { mode: 'B', emails: out };
}

// ─── HTTP server ─────────────────────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  const u = new URL(req.url, `http://${HOST}:${PORT}`);

  if (u.pathname === '/') { res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); res.end(PAGE); return; }

  if (u.pathname === '/config') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    // Valores actuales (para prefill). En localhost monousuario es aceptable enviarlos.
    const envValues = {};
    ENV_ALLOW.forEach((k) => { envValues[k] = process.env[k] || ''; });
    res.end(JSON.stringify({
      base: BASE_QA, imapMode: imapMode(), healthCount: HEALTH_COUNT,
      envs: Object.entries(ENVS).map(([k, v]) => ({ key: k, label: v.label, base: v.base })),
      prodBlocked: [...PROD_BLOCKED],
      envFields: ENV_FIELDS, envValues,
      areas: Object.entries(AREAS).map(([k, a]) => ({ key: k, label: a.label, files: a.files, auth: !!a.auth })),
      states: Object.entries(STATE_MAP).map(([v, m]) => ({ value: v, label: m.label })),
    }));
    return;
  }

  if (u.pathname === '/config/save' && req.method === 'POST') {
    let body = '';
    req.on('data', (c) => { body += c; if (body.length > 1e6) req.destroy(); }); // tope anti-abuso
    req.on('end', () => {
      let obj = {};
      try { obj = JSON.parse(body || '{}'); } catch (_) { res.writeHead(400); res.end('{"error":"JSON inválido"}'); return; }
      let saved = [];
      try { saved = saveEnv(obj); } catch (e) { res.writeHead(500); res.end(JSON.stringify({ error: e.message })); return; }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ saved, imapMode: imapMode() }));
    });
    return;
  }

  if (u.pathname === '/stream') {
    streamRun(req, res, {
      action: u.searchParams.get('action'),
      order: u.searchParams.get('order') || '',
      stateValue: u.searchParams.get('state') || '',
      headed: u.searchParams.get('headed') === '1',
      tipo: u.searchParams.get('tipo') || '',
      pago: u.searchParams.get('pago') || '',
      area: u.searchParams.get('area') || '',
      env: u.searchParams.get('env') || 'qa',
    });
    return;
  }

  if (u.pathname === '/emails') {
    const data = await listEmails(u.searchParams.get('order') || '');
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
    return;
  }

  res.writeHead(404); res.end('not found');
});

server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    console.error(`\n  ✗ El puerto ${PORT} ya está en uso. Quizá el panel ya está corriendo.`);
    console.error(`    Abre http://${HOST}:${PORT}  ·  o usa otro puerto:  DASH_PORT=4600 npm run dashboard\n`);
  } else {
    console.error(`\n  ✗ Error del server: ${e.message}\n`);
  }
  process.exit(1);
});

server.listen(PORT, HOST, () => {
  console.log(`\n  Panel QA B2C  →  http://${HOST}:${PORT}`);
  console.log(`  Ambiente: QA (${BASE_QA})  ·  IMAP: Modo ${imapMode()}\n`);
});

// ─── Página (HTML+CSS+JS inline) ─────────────────────────────────────────────
// NOTA: este string es un template literal. NO usar backticks ni ${} adentro
// (se interpolarían al cargar el módulo). El JS de cliente usa concatenación '+'.
const PAGE = `<!doctype html><html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Panel QA · Rotoplas B2C</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wght@600;700;800&family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&display=swap" rel="stylesheet">
<style>
 :root{
   --rot:#009FE3; --rotd:#0079b3; --rot2:#33b9ec;
   --bg:#eaf2f8; --panel:#ffffff; --line:#dce8f1; --line2:#eef4f9;
   --ink:#0a2942; --ink2:#2a4a64; --mut:#65809a;
   --ok:#0a9d57; --okbg:#e7f6ee; --okln:#bce6cd;
   --err:#d83232; --errbg:#fdecec; --errln:#f3c7c7;
   --warn:#b9770c; --warnbg:#fff6e7; --warnln:#f1dcae;
   --idle:#a8bccd;
   --sh:0 1px 2px rgba(10,41,66,.04), 0 8px 24px rgba(10,41,66,.06);
   --shp:0 10px 24px rgba(0,121,179,.28);
 }
 *{box-sizing:border-box}
 html,body{margin:0}
 body{
   font:15px/1.55 'IBM Plex Sans',-apple-system,Segoe UI,sans-serif;
   color:var(--ink); background:var(--bg);
   background-image:
     radial-gradient(900px 420px at 78% -160px, rgba(0,159,227,.16), transparent 62%),
     radial-gradient(700px 360px at 8% -120px, rgba(0,159,227,.08), transparent 60%),
     radial-gradient(circle at center, rgba(10,41,66,.045) 1px, transparent 1.4px);
   background-size:auto,auto,22px 22px;
   background-attachment:fixed;
   min-height:100vh;
   -webkit-font-smoothing:antialiased;
 }
 h1,h2{font-family:'Archivo',sans-serif;letter-spacing:-.01em;margin:0}

 /* Header */
 header{
   position:sticky;top:0;z-index:5;
   display:flex;align-items:center;gap:14px;padding:14px 26px;
   background:rgba(255,255,255,.78);backdrop-filter:blur(12px);
   border-bottom:1px solid var(--line);
 }
 .brand{display:flex;align-items:center;gap:11px}
 .mark{width:34px;height:34px;border-radius:10px;display:grid;place-items:center;color:#fff;
   background:linear-gradient(135deg,var(--rot),var(--rotd));box-shadow:var(--shp)}
 .mark svg{width:20px;height:20px}
 .brand .t{display:block;font-family:'Archivo',sans-serif;font-weight:700;font-size:16px;color:var(--ink);line-height:1.15}
 .brand .t b{color:var(--rotd)}
 .brand .s{display:block;margin-top:2px;font-size:11.5px;color:var(--mut);letter-spacing:.02em}
 .sp{flex:1}
 .chip{font-size:11.5px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;
   padding:5px 11px;border-radius:999px;background:#e3f1fb;color:var(--rotd);border:1px solid #cbe6f7;
   display:inline-flex;align-items:center;gap:7px}
 .chip .led{width:7px;height:7px;border-radius:50%;background:var(--rot);box-shadow:0 0 0 3px rgba(0,159,227,.18)}
 /* Selector de ambiente (QA / Producción) — luce como chip; rojo y pulsante en prod */
 .envsel{display:inline-flex;align-items:center;gap:7px;padding:4px 9px 4px 11px;border-radius:999px;
   background:#e3f1fb;border:1px solid #cbe6f7;transition:background .18s,border-color .18s}
 .envsel .led{width:7px;height:7px;border-radius:50%;background:var(--rot);box-shadow:0 0 0 3px rgba(0,159,227,.18);flex:none}
 .envsel select{font:600 11.5px 'IBM Plex Sans',sans-serif;letter-spacing:.04em;text-transform:uppercase;
   color:var(--rotd);background:transparent;border:0;cursor:pointer;outline:none}
 body.env-prod .envsel{background:var(--errbg);border-color:var(--errln)}
 body.env-prod .envsel .led{background:var(--err);box-shadow:0 0 0 3px rgba(216,50,50,.18);animation:pulse 1.2s infinite}
 body.env-prod .envsel select{color:var(--err)}
 /* Banner de advertencia de prod (flujo normal, bajo el header) */
 .prodwarn{display:flex;align-items:center;gap:9px;justify-content:center;padding:9px 26px;
   font-size:13px;font-weight:600;color:#7f1d1d;background:var(--errbg);border-bottom:1px solid var(--errln)}
 .prodwarn[hidden]{display:none}
 .prodwarn b{font-weight:800}
 /* Toggle */
 .toggle{display:flex;align-items:center;gap:10px;font-size:13px;color:var(--ink2);cursor:pointer;user-select:none;font-weight:500}
 .toggle input{position:absolute;opacity:0;pointer-events:none}
 .track{width:42px;height:24px;border-radius:999px;background:#c8d7e3;position:relative;transition:.2s;flex:none}
 .track::after{content:"";position:absolute;top:3px;left:3px;width:18px;height:18px;border-radius:50%;background:#fff;
   box-shadow:0 1px 3px rgba(0,0,0,.25);transition:.2s}
 .toggle input:checked + .track{background:linear-gradient(135deg,var(--rot),var(--rotd))}
 .toggle input:checked + .track::after{transform:translateX(18px)}
 .toggle input:focus-visible + .track{outline:2px solid var(--rot);outline-offset:2px}

 /* Scan line under header (visible while busy) */
 .scan{height:3px;position:sticky;top:63px;z-index:4;background:transparent;overflow:hidden}
 body.busy .scan{background:linear-gradient(90deg,transparent,rgba(0,159,227,.15),transparent)}
 .scan::before{content:"";position:absolute;inset:0;width:40%;
   background:linear-gradient(90deg,transparent,var(--rot),transparent);
   transform:translateX(-120%);opacity:0}
 body.busy .scan::before{opacity:1;animation:scan 1.1s ease-in-out infinite}
 @keyframes scan{0%{transform:translateX(-120%)}100%{transform:translateX(320%)}}

 /* Tira FIJA de estado en vivo (sticky bajo el header) — visible corras donde corras */
 .livebar{position:sticky;top:62px;z-index:6;display:flex;align-items:center;gap:13px;
   padding:9px 26px;background:rgba(255,255,255,.94);backdrop-filter:blur(12px);
   border-bottom:1px solid var(--line);box-shadow:0 6px 16px rgba(10,41,66,.06);
   animation:lbin .3s ease}
 @keyframes lbin{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}
 .livebar[hidden]{display:none}
 .livebar .lb-spin{width:16px;height:16px;flex:none;border-radius:50%;border:2.5px solid #bfe0f4;
   border-top-color:var(--rot);animation:spin .7s linear infinite}
 .livebar.is-ok .lb-spin,.livebar.is-err .lb-spin,.livebar.is-skip .lb-spin{animation:none;border:0;display:grid;place-items:center;font-weight:800;font-size:15px}
 .livebar.is-ok .lb-spin{color:var(--ok)} .livebar.is-err .lb-spin{color:var(--err)} .livebar.is-skip .lb-spin{color:var(--warn)}
 .livebar .lb-now{font-weight:600;font-size:13.5px;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:44vw}
 .livebar .lb-prog{font:600 12px 'IBM Plex Mono',monospace;color:var(--rotd);background:#e3f1fb;border:1px solid #cbe6f7;
   border-radius:999px;padding:2px 10px;white-space:nowrap;flex:none}
 .livebar .lb-counts{font:600 12px 'IBM Plex Mono',monospace;color:var(--mut);white-space:nowrap;flex:none}
 .livebar.is-ok .lb-counts{color:var(--ok)} .livebar.is-err .lb-counts{color:var(--err)} .livebar.is-skip .lb-counts{color:var(--warn)}
 .livebar .lb-jump{margin-left:auto;flex:none;font:600 12px 'IBM Plex Sans',sans-serif;color:var(--rotd);background:#fff;
   border:1px solid #bfe0f4;border-radius:8px;padding:5px 11px;cursor:pointer;transition:.14s;white-space:nowrap}
 .livebar .lb-jump:hover{background:var(--rot);color:#fff;border-color:var(--rot)}
 @media(max-width:560px){.livebar .lb-now{max-width:34vw}.livebar .lb-counts{display:none}}

 main{max-width:1080px;margin:0 auto;padding:28px 26px 56px}

 /* Hero */
 .hero{
   background:var(--panel);border:1px solid var(--line);border-radius:18px;box-shadow:var(--sh);
   padding:26px 28px;display:flex;align-items:center;gap:26px;position:relative;overflow:hidden;
   opacity:0;transform:translateY(10px);animation:rise .5s .04s ease forwards;
 }
 .hero::before{content:"";position:absolute;left:0;top:0;bottom:0;width:5px;background:var(--rot);transition:.3s}
 .hero.is-run::before{background:var(--rot)} .hero.is-ok::before{background:var(--ok)} .hero.is-err::before{background:var(--err)}
 .hero .htxt{flex:1;min-width:0}
 .hero h1{font-size:25px;font-weight:800;color:var(--ink);display:flex;align-items:center;gap:12px}
 .hero .hsub{margin:7px 0 0;color:var(--mut);font-size:14px}
 .statetag{font-family:'IBM Plex Mono',monospace;font-size:11px;font-weight:500;text-transform:uppercase;letter-spacing:.06em;
   padding:3px 9px;border-radius:7px;background:var(--line2);color:var(--mut);border:1px solid var(--line)}
 .hero.is-run .statetag{background:#e3f1fb;color:var(--rotd);border-color:#cbe6f7}
 .hero.is-ok .statetag{background:var(--okbg);color:var(--ok);border-color:var(--okln)}
 .hero.is-err .statetag{background:var(--errbg);color:var(--err);border-color:var(--errln)}
 .hero.is-skip::before{background:var(--warn)}
 .hero.is-skip .statetag{background:var(--warnbg);color:var(--warn);border-color:var(--warnln)}

 /* Buttons */
 .btn-primary{
   font:600 15px 'IBM Plex Sans',sans-serif;color:#fff;cursor:pointer;border:0;
   background:linear-gradient(135deg,var(--rot),var(--rotd));
   padding:14px 22px;border-radius:13px;box-shadow:var(--shp);
   display:inline-flex;align-items:center;gap:10px;white-space:nowrap;transition:transform .14s, box-shadow .14s, filter .14s;
 }
 .btn-primary:hover{transform:translateY(-2px);box-shadow:0 14px 30px rgba(0,121,179,.36)}
 .btn-primary:active{transform:translateY(0)}
 .btn-primary svg{width:16px;height:16px;fill:currentColor}
 .btn-primary.wide{width:100%;justify-content:center;padding:15px}

 .btn-secondary{
   font:600 15px 'IBM Plex Sans',sans-serif;color:var(--rot);cursor:pointer;border:2px solid var(--rot);
   background:transparent;padding:14px 22px;border-radius:13px;
   display:inline-flex;align-items:center;gap:10px;white-space:nowrap;transition:transform .14s, background .14s;
 }
 .btn-secondary:hover{background:rgba(0,158,227,.06);transform:translateY(-2px)}
 .btn-secondary:active{transform:translateY(0)}
 .btn-secondary svg{width:16px;height:16px;fill:currentColor}
 .btn-secondary.wide{width:100%;justify-content:center;padding:15px}

 hr.sep{border:0;border-top:1.5px solid var(--b);margin:18px 0 16px}

 /* Grid */
 .grid{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:18px}
 @media(max-width:820px){.grid{grid-template-columns:1fr}}

 .card{background:var(--panel);border:1px solid var(--line);border-radius:18px;box-shadow:var(--sh);
   padding:20px 22px;opacity:0;transform:translateY(10px);animation:rise .5s ease forwards}
 .card:nth-child(1){animation-delay:.12s} .card:nth-child(2){animation-delay:.18s}
 .card:nth-child(3){animation-delay:.24s} .card:nth-child(4){animation-delay:.3s}
 .card-h{display:flex;align-items:center;gap:12px;margin-bottom:3px}
 .cic{width:38px;height:38px;border-radius:11px;flex:none;display:grid;place-items:center;
   background:#e3f1fb;color:var(--rotd);border:1px solid #cbe6f7}
 .cic svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
 .card-h h2{font-size:16.5px;font-weight:700;color:var(--ink);flex:1}
 .card-sub{margin:0 0 16px;color:var(--mut);font-size:13.5px;line-height:1.5}

 /* Secciones colapsables */
 .card-h{cursor:pointer;user-select:none}
 .card-chev{flex:none;width:22px;height:22px;display:grid;place-items:center;border-radius:7px;color:var(--mut);transition:transform .22s, background .14s}
 .card-h:hover .card-chev{background:var(--line2);color:var(--rotd)}
 .card-chev svg{width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:2.4;stroke-linecap:round;stroke-linejoin:round}
 .card.collapsed .card-chev{transform:rotate(-90deg)}
 .card.collapsed{padding-bottom:20px}
 .card.collapsed > *:not(.card-h){display:none!important}
 .card.collapsed .card-h{margin-bottom:0}

 /* Historial reciente */
 .hist{list-style:none;margin:6px 0 0;padding:0;display:flex;flex-direction:column;gap:6px;max-height:320px;overflow:auto}
 .hist li{display:flex;align-items:center;gap:11px;padding:9px 12px;border:1px solid var(--line);border-radius:10px;background:#fbfdff}
 .hist .hdot{width:9px;height:9px;border-radius:50%;flex:none;background:var(--idle)}
 .hist li.is-ok .hdot{background:var(--ok)} .hist li.is-err .hdot{background:var(--err)} .hist li.is-skip .hdot{background:var(--warn)}
 .hist .hlbl{flex:1;min-width:0;font-weight:500;font-size:13.5px;color:var(--ink2)}
 .hist .hres{font:600 11.5px 'IBM Plex Mono',monospace;white-space:nowrap}
 .hist li.is-ok .hres{color:var(--ok)} .hist li.is-err .hres{color:var(--err)} .hist li.is-skip .hres{color:var(--warn)}
 .hist .htime{font:500 11px 'IBM Plex Mono',monospace;color:var(--mut);white-space:nowrap;min-width:42px;text-align:right}
 .hist.empty li{justify-content:center;color:var(--mut);font-style:italic;background:transparent;border-style:dashed}
 .pill .pt{font-size:10px;opacity:.7;margin-left:1px}

 /* Pill (palomita de estado) */
 .pill{font:500 12px 'IBM Plex Mono',monospace;letter-spacing:.02em;
   display:inline-flex;align-items:center;gap:7px;padding:5px 11px;border-radius:999px;
   background:var(--line2);color:var(--mut);border:1px solid var(--line);white-space:nowrap}
 .pill .d{width:8px;height:8px;border-radius:50%;background:var(--idle);flex:none}
 .pill.is-run{background:#e3f1fb;color:var(--rotd);border-color:#cbe6f7}
 .pill.is-run .d{background:var(--rot);animation:pulse 1s infinite}
 .pill.is-ok{background:var(--okbg);color:var(--ok);border-color:var(--okln);animation:pop .32s ease}
 .pill.is-ok .d{background:var(--ok)}
 .pill.is-err{background:var(--errbg);color:var(--err);border-color:var(--errln);animation:pop .32s ease}
 .pill.is-err .d{background:var(--err)}
 .pill.is-skip{background:var(--warnbg);color:var(--warn);border-color:var(--warnln);animation:pop .32s ease}
 .pill.is-skip .d{background:var(--warn)}
 @keyframes pulse{50%{opacity:.35}}
 @keyframes pop{0%{transform:scale(.8)}55%{transform:scale(1.08)}100%{transform:scale(1)}}

 /* Check rows */
 .checks{list-style:none;margin:0 0 4px;padding:0;display:flex;flex-direction:column;gap:9px}
 .checks li{display:flex;align-items:center;gap:12px;padding:11px 13px;border:1px solid var(--line);
   border-radius:12px;background:#fbfdff;transition:.14s}
 .checks li:hover{border-color:#bfe0f4;background:#f5fbff}
 .checks .nm{flex:1;font-weight:500;font-size:14px;color:var(--ink2)}
 .checks .nm small{display:block;font-weight:400;color:var(--mut);font-size:12px;margin-top:1px;font-family:'IBM Plex Mono',monospace}
 .btn-run{font:600 13px 'IBM Plex Sans',sans-serif;color:var(--rotd);cursor:pointer;
   background:#fff;border:1px solid #bfe0f4;padding:8px 13px;border-radius:9px;
   display:inline-flex;align-items:center;gap:7px;transition:.14s;white-space:nowrap}
 .btn-run:hover{background:var(--rot);color:#fff;border-color:var(--rot)}
 .btn-run svg{width:11px;height:11px;fill:currentColor}

 .runall{margin-top:14px}

 /* Encabezado "Estructura crítica" + rejilla COMPACTA de zonas (mosaicos) */
 .areahead{display:flex;align-items:center;gap:10px;margin:16px 0 8px;padding-top:14px;border-top:1px solid var(--line)}
 .areahead .nm{flex:1;font-weight:700;font-size:14.5px;color:var(--ink);display:flex;align-items:center;gap:9px}
 .areahead .btn-run{padding:6px 12px;font-size:12.5px}
 /* Mosaicos: 2 columnas densas. Cada zona = pill(estado) + nombre + (candado si @auth). */
 .zona-grid{display:grid;grid-template-columns:1fr 1fr;gap:7px}
 @media(max-width:560px){.zona-grid{grid-template-columns:1fr}}
 .zona{display:flex;align-items:center;gap:8px;text-align:left;padding:8px 10px;border:1px solid var(--line);
   border-radius:10px;background:#fbfdff;cursor:pointer;font:inherit;color:var(--ink2);transition:.13s}
 .zona:hover{border-color:#bfe0f4;background:#f5fbff;transform:translateY(-1px)}
 .zona:active{transform:none}
 .zona .znm{flex:1;font-weight:600;font-size:12.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
 .zona .lock{flex:none;font-size:10px;opacity:.55}
 .zona .pill{flex:none;padding:3px 7px;font-size:10.5px;gap:5px}
 .zona .pill .d{width:7px;height:7px}
 .zona.is-run{border-color:#cbe6f7}.zona.is-ok{border-color:var(--okln)}.zona.is-err{border-color:var(--errln)}.zona.is-skip{border-color:var(--warnln)}
 .zona-loading{grid-column:1/-1;color:var(--mut);font-style:italic;font-size:12.5px;padding:6px 2px}

 /* Bloque RESULTADO de orden creada (nº + acciones de consulta) */
 .ordbox{margin-top:14px;border:1px solid var(--okln);background:var(--okbg);border-radius:13px;padding:14px 16px;display:none}
 .ordbox.show{display:block;animation:rise .35s ease}
 .ordbox .ob-top{display:flex;align-items:center;gap:11px;flex-wrap:wrap}
 .ordbox .ob-lbl{font-size:12.5px;color:var(--ink2);font-weight:600}
 .ordbox .ob-num{font:700 16px 'IBM Plex Mono',monospace;color:var(--ink);background:#fff;border:1px solid var(--okln);
   border-radius:8px;padding:4px 11px;letter-spacing:.02em}
 .ordbox .ob-copy{font:600 12px 'IBM Plex Sans',sans-serif;color:var(--rotd);cursor:pointer;background:#fff;
   border:1px solid #bfe0f4;border-radius:8px;padding:5px 10px}
 .ordbox .ob-copy:hover{background:var(--rot);color:#fff;border-color:var(--rot)}
 .ordbox .ob-acts{display:flex;gap:8px;margin-top:11px;flex-wrap:wrap}
 .ordbox .ob-acts .btn-run{background:#fff}
 .ord-out{margin:11px 0 0;background:#07223a;color:#cfe3f2;border-radius:10px;border:1px solid #0d3550;
   padding:11px 13px;max-height:230px;overflow:auto;
   font:12px/1.6 'IBM Plex Mono',Menlo,Consolas,monospace;white-space:pre-wrap;word-break:break-word;display:none}
 .ord-out.show{display:block}
 .ord-out .e{color:#ff9d9d} .ord-out .ok{color:#73e6a8} .ord-out .info{color:#7fd1f5}

 /* Tira de ACTIVIDAD EN VIVO — traduce el log crudo a pasos humanos mientras corre */
 .live{margin-top:14px;border:1px solid var(--line);border-radius:13px;background:
   linear-gradient(180deg,#f6fbff,#fbfdff);padding:13px 15px;display:none}
 .live.show{display:block;animation:rise .35s ease}
 .live-now{display:flex;align-items:center;gap:11px}
 .live-spin{width:18px;height:18px;flex:none;border-radius:50%;border:2.5px solid #bfe0f4;
   border-top-color:var(--rot);animation:spin .7s linear infinite}
 .live.is-ok .live-spin,.live.is-err .live-spin,.live.is-skip .live-spin{animation:none;border:0;display:grid;place-items:center;font-weight:800}
 .live.is-ok .live-spin{color:var(--ok)} .live.is-err .live-spin{color:var(--err)} .live.is-skip .live-spin{color:var(--warn)}
 .live-txt{font-weight:600;font-size:14px;color:var(--ink)}
 .live-txt small{display:block;font-weight:400;font-size:12px;color:var(--mut);margin-top:1px}
 .live-steps{list-style:none;margin:12px 0 0;padding:0;display:flex;flex-direction:column;gap:6px}
 .live-steps li{display:flex;align-items:center;gap:9px;font-size:12.5px;color:var(--mut);opacity:.55;transition:.2s}
 .live-steps li.done{opacity:1;color:var(--ink2)} .live-steps li.active{opacity:1;color:var(--rotd);font-weight:600}
 .live-steps .tick{width:16px;height:16px;flex:none;border-radius:50%;border:1.5px solid var(--line);
   display:grid;place-items:center;font-size:10px;color:transparent}
 .live-steps li.done .tick{background:var(--ok);border-color:var(--ok);color:#fff}
 .live-steps li.active .tick{border-color:var(--rot);color:var(--rot)}
 @keyframes spin{to{transform:rotate(360deg)}}

 /* Cronómetro en la cabecera de la tira en vivo */
 .live-time{margin-left:auto;font:600 12px 'IBM Plex Mono',monospace;color:var(--mut);
   background:var(--line2);border:1px solid var(--line);border-radius:7px;padding:3px 9px;white-space:nowrap}
 .live.is-ok .live-time{color:var(--ok);background:var(--okbg);border-color:var(--okln)}
 .live.is-err .live-time{color:var(--err);background:var(--errbg);border-color:var(--errln)}
 .live.is-skip .live-time{color:var(--warn);background:var(--warnbg);border-color:var(--warnln)}

 /* Barra de progreso i/N (modo lista de tests) */
 .lp{display:flex;align-items:center;gap:10px;margin-top:12px}
 .lp-track{flex:1;height:8px;border-radius:999px;background:#e1edf6;overflow:hidden;border:1px solid var(--line)}
 .lp-bar{height:100%;width:0;border-radius:999px;background:linear-gradient(90deg,var(--rot),var(--rotd));transition:width .35s ease}
 .live.is-ok .lp-bar{background:linear-gradient(90deg,#1fc878,var(--ok))}
 .live.is-err .lp-bar{background:linear-gradient(90deg,#f06a6a,var(--err))}
 .lp-num{font:600 12px 'IBM Plex Mono',monospace;color:var(--ink2);white-space:nowrap;min-width:46px;text-align:right}

 /* Semáforo de conteos en vivo */
 .lcounts{display:flex;gap:7px;margin-top:10px;flex-wrap:wrap}
 .lc{font:600 11.5px 'IBM Plex Mono',monospace;padding:3px 9px;border-radius:999px;
   border:1px solid var(--line);background:var(--line2);color:var(--mut);transition:.2s}
 .lc.on.lc-ok{background:var(--okbg);color:var(--ok);border-color:var(--okln)}
 .lc.on.lc-fail{background:var(--errbg);color:var(--err);border-color:var(--errln)}
 .lc.on.lc-skip{background:var(--warnbg);color:var(--warn);border-color:var(--warnln)}

 /* Lista de pruebas que se va pintando en vivo */
 .tlist{list-style:none;margin:12px 0 0;padding:0;display:flex;flex-direction:column;gap:5px;max-height:300px;overflow:auto}
 .trow{display:flex;align-items:flex-start;gap:10px;padding:8px 11px;border:1px solid var(--line);
   border-radius:10px;background:#fbfdff;animation:rowin .28s ease}
 @keyframes rowin{from{opacity:0;transform:translateY(-3px)}to{opacity:1;transform:none}}
 .trow .tdot{width:9px;height:9px;border-radius:50%;flex:none;margin-top:5px;background:var(--idle)}
 .trow.is-ok .tdot{background:var(--ok)} .trow.is-fail .tdot{background:var(--err)} .trow.is-skip .tdot{background:var(--warn)}
 .trow.is-known .tdot{background:var(--rot)} .trow.is-fixed .tdot{background:var(--warn)} .trow.is-flaky .tdot{background:var(--warn)}
 .trow .tt{flex:1;min-width:0;font-size:13px;color:var(--ink2);line-height:1.4}
 .trow .tt .ts{display:block;font-size:11px;color:var(--mut);font-weight:600;margin-bottom:1px}
 .trow.is-fail .tt{color:var(--err)}
 .trow .tms{font:500 11px 'IBM Plex Mono',monospace;color:var(--mut);white-space:nowrap;margin-top:2px}
 .trow.has-err{cursor:pointer}
 /* Explicación AMIGABLE del resultado — visible siempre en la fila, sin abrir nada.
    Color por tipo: rojo=roto real · azul=bug conocido (informativo) · ámbar=bug arreglado */
 .trow .treason{display:block;margin-top:4px;font-size:12.5px;line-height:1.5;font-weight:500;color:var(--mut)}
 .trow.is-fail .treason{color:#9a2222}
 .trow.is-known .treason{color:var(--ink2)}
 .trow.is-fixed .treason{color:var(--warn)}
 .trow.is-flaky .treason{color:var(--warn)}
 .trow .treason::after{color:var(--mut);font-weight:700;font-family:'IBM Plex Sans',sans-serif}
 .trow.has-err .treason::after{content:" · ver detalle técnico ▾"}
 .trow.open.has-err .treason::after{content:" · ocultar detalle ▴"}
 /* Detalle técnico CRUDO — solo al expandir (para devs) */
 .trow .terr{display:none;flex-basis:100%;margin:8px 0 1px;padding:9px 11px;border-radius:8px;
   background:var(--errbg);border:1px solid var(--errln)}
 .trow.open .terr{display:block}
 .terr-lbl{font:700 10.5px 'IBM Plex Sans',sans-serif;text-transform:uppercase;letter-spacing:.05em;color:#7f1d1d;margin-bottom:5px}
 .terr-raw{font:12px/1.5 'IBM Plex Mono',Menlo,Consolas,monospace;color:#9a2222;white-space:pre-wrap;word-break:break-word}

 /* Panel de TRIAGE — explica un rojo en lenguaje humano (bug vs cambio de selector) */
 .triage{margin-top:12px;border-radius:11px;padding:12px 14px;font-size:13px;
   border:1px solid var(--errln);background:var(--errbg)}
 .live.is-skip .triage{border-color:var(--warnln);background:var(--warnbg)}
 .triage .row{display:flex;gap:8px;margin-top:6px;line-height:1.5}
 .triage .row:first-child{margin-top:0}
 .triage .k{flex:none;font-weight:700;color:var(--ink2);width:104px}
 .triage .v{color:var(--ink2)}
 .triage .v b{color:var(--ink)}
 .triage .fail{font-family:'IBM Plex Mono',monospace;font-size:12px;color:var(--err)}

 /* Mini-explicador "cómo leer un rojo" */
 .leer{margin-top:12px;font-size:12.5px;color:var(--mut)}
 .leer>summary{cursor:pointer;font-weight:600;color:var(--rotd);list-style:none;display:inline-flex;align-items:center;gap:6px}
 .leer>summary::-webkit-details-marker{display:none}
 .leer>summary::before{content:"?";display:grid;place-items:center;width:16px;height:16px;border-radius:50%;
   background:#e3f1fb;color:var(--rotd);font-size:11px;font-weight:800;border:1px solid #cbe6f7}
 .leer[open]>summary{margin-bottom:8px}
 .leer ol{margin:0;padding-left:18px;line-height:1.6}
 .leer code{background:var(--line2);border:1px solid var(--line);border-radius:5px;padding:1px 5px;font-size:11.5px}

 /* Detalle / log */
 .detalle{margin-top:14px;font:500 12.5px 'IBM Plex Sans',sans-serif;color:var(--mut);cursor:pointer;
   background:none;border:0;padding:4px 0;display:inline-flex;align-items:center;gap:6px}
 .detalle:hover{color:var(--rotd)}
 .detalle .ar{transition:transform .2s;display:inline-block}
 .detalle.open .ar{transform:rotate(180deg)}
 .log{margin:10px 0 0;background:#07223a;color:#cfe3f2;border-radius:12px;border:1px solid #0d3550;
   padding:13px 15px;max-height:260px;overflow:auto;
   font:12.5px/1.65 'IBM Plex Mono',Menlo,Consolas,monospace;white-space:pre-wrap;word-break:break-word}
 .log .e{color:#ff9d9d} .log .ok{color:#73e6a8} .log .info{color:#7fd1f5} .log .cmd{color:#ffd58a}
 .log:empty{display:none}

 .imapnote{margin:14px 0 0;font-size:12.5px;color:var(--mut);display:flex;align-items:flex-start;gap:8px;
   background:var(--line2);border:1px solid var(--line);border-radius:10px;padding:10px 12px}
 .imapnote a{color:var(--rotd);font-weight:600;text-decoration:none}
 .imapnote a:hover{text-decoration:underline}

 /* Campos de "Crear orden" */
 .fields{display:flex;flex-direction:column;gap:11px;margin:2px 0 15px}
 .field{display:flex;flex-direction:column;gap:5px}
 .field label{font-size:12.5px;font-weight:600;color:var(--ink2);letter-spacing:.01em}
 .field select{font:500 14px 'IBM Plex Sans',sans-serif;color:var(--ink);background:#fbfdff;
   border:1px solid var(--line);border-radius:10px;padding:10px 12px;cursor:pointer;transition:.14s;
   appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2365809a' stroke-width='2.5' stroke-linecap='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
   background-repeat:no-repeat;background-position:right 12px center;padding-right:34px}
 .field select:hover{border-color:#bfe0f4} .field select:focus{outline:2px solid var(--rot);outline-offset:1px;border-color:var(--rot)}
 .field .hint{font-size:11.5px;color:var(--mut);font-family:'IBM Plex Mono',monospace}

 /* Lista de correos */
 .emails{list-style:none;margin:12px 0 0;padding:0;display:flex;flex-direction:column;gap:7px}
 .emails li{display:flex;gap:10px;align-items:baseline;padding:9px 12px;border:1px solid var(--line);
   border-radius:10px;background:#fbfdff;font-size:13px}
 .emails li .su{flex:1;color:var(--ink2);font-weight:500}
 .emails li .dt{color:var(--mut);font-size:11.5px;font-family:'IBM Plex Mono',monospace;white-space:nowrap}
 .emails.empty li{color:var(--mut);justify-content:center;font-style:italic}

 .foot{max-width:1080px;margin:18px auto 0;padding:0 26px;color:var(--mut);font-size:12px;text-align:center}
 .foot b{color:var(--ink2)}

 /* Sección de configuración (credenciales) */
 .cfg-show{display:inline-flex;align-items:center;gap:7px;font-size:12.5px;color:var(--ink2);cursor:pointer;margin:0 0 12px;user-select:none}
 .cfg-group{border:1px solid var(--line);border-radius:12px;padding:13px 15px;margin-bottom:11px;background:#fbfdff}
 .cfg-group>h3{font:700 13px 'IBM Plex Sans',sans-serif;color:var(--ink);margin:0 0 10px;display:flex;align-items:center;gap:8px}
 .cfg-group>h3 .gp{font:600 10px 'IBM Plex Mono',monospace;text-transform:uppercase;letter-spacing:.04em;padding:2px 7px;border-radius:999px;border:1px solid var(--line);color:var(--mut);background:#fff}
 .cfg-group>h3 .gp.ok{color:var(--ok);border-color:var(--okln);background:var(--okbg)}
 .cfg-field{display:flex;flex-direction:column;gap:4px;margin-bottom:10px}
 .cfg-field:last-child{margin-bottom:0}
 .cfg-field label{font-size:12px;font-weight:600;color:var(--ink2)}
 .cfg-field input{font:500 13.5px 'IBM Plex Sans',sans-serif;color:var(--ink);background:#fff;border:1px solid var(--line);
   border-radius:9px;padding:9px 11px;outline:none;transition:.14s}
 .cfg-field input:hover{border-color:#bfe0f4}
 .cfg-field input:focus{border-color:var(--rot);outline:2px solid var(--rot);outline-offset:1px}
 .cfg-field .hint{font-size:11px;color:var(--mut);font-family:'IBM Plex Mono',monospace}
 .cfg-actions{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-top:6px}

 @keyframes rise{to{opacity:1;transform:translateY(0)}}
 @media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}

 button:focus-visible{outline:2px solid var(--rot);outline-offset:2px}
 button[disabled]{opacity:.5;cursor:not-allowed;pointer-events:none}

 .src{display:block;font-size:11px;color:var(--mut);font-weight:400;margin-top:3px;font-family:'IBM Plex Mono',monospace}
 .errsum{background:#fef2f2;border:1px solid #fecaca;border-radius:9px;padding:10px 13px;margin-top:12px;font-size:13px;color:#991b1b;line-height:1.5}
 .errsum b{color:#7f1d1d}
 .lastrun{font-size:11px;color:var(--mut);margin-left:18px;white-space:nowrap}
</style></head><body>

<header>
 <div class="brand">
  <span class="mark"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3c4 4.5 6 7.5 6 10.5A6 6 0 0 1 6 13.5C6 10.5 8 7.5 12 3z"/></svg></span>
  <span><span class="t">Panel QA · <b>Rotoplas B2C</b></span><span class="s">checks post-liberación · correos de pedido</span></span>
 </div>
 <span class="sp"></span>
 <label class="envsel" id="envWrap"><span class="led"></span>
  <select id="env" aria-label="Ambiente">
   <option value="qa">Entorno QA</option>
   <option value="prod">PRODUCCIÓN</option>
  </select>
 </label>
 <label class="toggle"><input type="checkbox" id="headed" checked><span class="track"></span>Ver navegador</label>
</header>
<div class="scan"></div>
<div class="prodwarn" id="prodwarn" hidden>
 <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/></svg>
 <span>Apuntando a <b>PRODUCCIÓN</b> — solo monitoreo de lectura. Crear orden y pipeline de correos están deshabilitados.</span>
</div>
<div class="livebar" id="livebar" hidden>
 <span class="lb-spin"></span>
 <span class="lb-now" id="lbNow">Trabajando…</span>
 <span class="lb-prog" id="lbProg" style="display:none">0/0</span>
 <span class="lb-counts" id="lbCounts" style="display:none">✓0 ✘0 –0</span>
 <button class="lb-jump" id="lbJump" type="button">ver detalle ↓</button>
</div>

<main>
 <section class="hero" id="hero">
  <div class="htxt">
   <h1><span id="heroTitle">Listo para revisar</span> <span class="statetag" id="heroTag">en espera</span></h1>
    <p class="hsub" id="heroSub">Corre una revisión completa del sitio tras una liberación, o prueba un check puntual abajo.</p>
  </div>
  <button class="btn-primary" data-action="check-all" data-st="hero" data-log="log-checks" data-live="live-checks" id="btnAll">
   <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg> Revisar sitio
  </button>
 </section>

 <div class="grid">
  <section class="card collapsed" id="cardConfig" style="grid-column:1/-1">
   <div class="card-h" data-toggle="cardConfig">
    <span class="cic"><svg viewBox="0 0 24 24"><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg></span>
    <h2>Configuración (credenciales)</h2>
    <span class="pill" id="st-config"><span class="d"></span>sin configurar</span>
    <span class="card-chev"><svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg></span>
   </div>
   <p class="card-sub">Captura aquí las credenciales para que el panel funcione en esta máquina. Se guardan <b>solo localmente</b> en el archivo <code>.env</code> — nunca se suben a GitHub. Llena al menos la <b>Sesión B2C</b> (para la ruta autenticada) y, si quieres verificar correos, el <b>Gmail / App Password</b>.</p>
   <label class="cfg-show"><input type="checkbox" id="cfgShow"> Mostrar credenciales</label>
   <div id="cfgGroups"><div class="zona-loading">Cargando campos…</div></div>
   <div class="cfg-actions">
    <button class="btn-primary" id="btnSaveCfg"><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M17 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7l-4-4zm-5 16a3 3 0 1 1 0-6 3 3 0 0 1 0 6zm3-10H5V5h10v4z"/></svg> Guardar configuración</button>
    <button class="btn-run" data-action="check-imap" data-st="st-imaptest" data-log="log-config" data-live="live-config"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>Probar correos</button>
    <span class="pill" id="st-imaptest"><span class="d"></span>—</span>
   </div>
   <button class="btn-secondary wide" data-action="gen-auth-b2c" data-st="st-genauth" data-log="log-config" data-live="live-config" style="margin-top:11px">
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 1 3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></svg> Generar sesión B2C (login una vez)
   </button>
   <span class="pill" id="st-genauth"><span class="d"></span>—</span>
   <div class="live" id="live-config" data-flow=""></div>
   <button class="detalle" data-target="log-config">ver detalle técnico <span class="ar">▾</span></button>
   <pre class="log" id="log-config"></pre>
  </section>
  <section class="card collapsed" id="cardChecks">
   <div class="card-h" data-toggle="cardChecks">
    <span class="cic"><svg viewBox="0 0 24 24"><path d="M3 12h4l2.5 7 4-15 2.5 8H21"/></svg></span>
    <h2>Checks estructurales</h2>
    <span class="pill" id="st-checks"><span class="d"></span>sin correr</span>
    <span class="card-chev"><svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg></span>
   </div>
   <p class="card-sub">¿Sigue en pie lo crítico del sitio? Detecta elementos, links o secciones que se rompen tras un deploy.</p>
    <div class="areahead">
     <span class="nm">Respuesta y formularios</span>
    </div>
    <div class="zona-grid">
     <button class="zona" id="z-responde" data-action="responde" data-st="st-responde" data-log="log-checks" data-live="live-checks" title="¿Responden y renderizan? — 16 URLs responden 200 y pintan contenido">
      <span class="pill" id="st-responde"><span class="d"></span> —</span>
      <span class="znm">¿Responden y renderizan?</span>
     </button>
     <button class="zona" data-action="forms" data-st="st-forms" data-log="log-checks" data-live="live-checks" title="Formularios — login · registro · recuperar · seguimiento">
      <span class="pill" id="st-forms"><span class="d"></span> —</span>
      <span class="znm">Formularios</span>
     </button>
    </div>
    <div class="areahead">
     <span class="nm">Estructura crítica <span class="pill" id="st-contracts"><span class="d"></span>—</span></span>
     <button class="btn-run" data-action="contracts" data-st="st-contracts" data-log="log-checks" data-live="live-checks"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>Correr todas</button>
    </div>
    <div class="zona-grid" id="areaList"><div class="zona-loading">Cargando zonas…</div></div>
    <div class="live" id="live-checks" data-flow="checks"></div>
    <div class="errsum" id="errsum" style="display:none"></div>
   <button class="detalle" data-target="log-checks">ver detalle técnico <span class="ar">▾</span></button>
   <pre class="log" id="log-checks"></pre>
  </section>

  <section class="card collapsed" id="cardCorreos">
   <div class="card-h" data-toggle="cardCorreos">
    <span class="cic"><svg viewBox="0 0 24 24"><path d="M3 6h18v12H3z"/><path d="M3 7l9 6 9-6"/></svg></span>
    <h2>Correos transaccionales</h2>
    <span class="pill" id="st-correos"><span class="d"></span>sin correr</span>
    <span class="card-chev"><svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg></span>
   </div>
   <p class="card-sub">Crea una orden de prueba, avanza sus estados y verifica que los correos de <b>ventasecom@rotoplas.com</b> lleguen al buzón. También puedes consultar los correos recientes sin crear una orden nueva.</p>
   <button class="btn-primary wide" data-action="capa2-auto" data-st="st-correos" data-log="log-correos" data-live="live-correos">
    <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg> Probar flujo de correos
   </button>
   <div class="live" id="live-correos" data-flow="capa2"></div>
   <button class="detalle" data-target="log-correos">ver detalle técnico <span class="ar">▾</span></button>
   <pre class="log" id="log-correos"></pre>
   <hr class="sep">
   <p class="card-sub" style="margin-top:0">Lee los correos recientes que <b>ventasecom@rotoplas.com</b> envió al buzón de pruebas (últimas 2 horas).</p>
   <button class="btn-secondary wide" id="btnInbox">
    <svg viewBox="0 0 24 24"><path d="M4 4h16v16H4z"/><path d="M4 8l8 5 8-5"/></svg> Ver correos recientes
   </button>
   <p class="imapnote" id="imapnote">Cargando configuración…</p>
   <ul class="emails" id="emails"></ul>
  </section>

  <section class="card collapsed" id="cardOrden">
   <div class="card-h" data-toggle="cardOrden">
    <span class="cic"><svg viewBox="0 0 24 24"><path d="M6 2h9l5 5v15H6z"/><path d="M9 13h6M9 17h6M9 9h2"/></svg></span>
    <h2>Crear orden</h2>
    <span class="pill" id="st-orden"><span class="d"></span>sin correr</span>
    <span class="card-chev"><svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg></span>
   </div>
   <p class="card-sub">Crea una orden de prueba recorriendo el sitio como un usuario real (carrito → checkout → pago). Sin mover estados ni correos.</p>
   <div class="fields">
    <div class="field">
     <label for="selTipo">Tipo de pedido</label>
     <select id="selTipo">
      <option value="fisico">Producto físico (Base para tinaco)</option>
      <option value="servicio">Servicio de lavado (wizard)</option>
     </select>
    </div>
    <div class="field">
     <label for="selPago">Método de pago</label>
     <select id="selPago">
      <option value="credito">Tarjeta de crédito (Visa 4242)</option>
      <option value="debito">Tarjeta de débito (Visa 4111)</option>
      <option value="transferencia">Transferencia / SPEI</option>
      <option value="efectivo">Pago en efectivo</option>
     </select>
     <span class="hint" id="pagoHint"></span>
    </div>
   </div>
   <button class="btn-primary wide" data-action="crear-orden" data-st="st-orden" data-log="log-orden" data-live="live-orden" data-opts="1">
    <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg> Crear orden
   </button>
   <div class="live" id="live-orden" data-flow="orden"></div>
   <div class="ordbox" id="ordBox">
    <div class="ob-top">
     <span class="ob-lbl">Orden creada:</span>
     <span class="ob-num" id="ordNum">—</span>
     <button class="ob-copy" id="ordCopy" type="button">copiar</button>
    </div>
    <div class="ob-acts">
     <button class="btn-run" data-ord-action="order-status"   id="ordStatus"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>Ver estado</button>
     <button class="btn-run" data-ord-action="order-payments" id="ordPay"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>Ver pagos</button>
     <button class="btn-run" data-ord-action="order-messages" id="ordMsg"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>Ver historial</button>
    </div>
    <pre class="ord-out" id="ordOut"></pre>
   </div>
   <button class="detalle" data-target="log-orden">ver detalle técnico <span class="ar">▾</span></button>
   <pre class="log" id="log-orden"></pre>
  </section>

  <section class="card collapsed" id="cardHist">
   <div class="card-h" data-toggle="cardHist">
    <span class="cic"><svg viewBox="0 0 24 24"><path d="M12 8v4l3 2"/><path d="M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0z"/></svg></span>
    <h2>Historial reciente</h2>
    <span class="pill" id="st-hist"><span class="d"></span>—</span>
    <span class="card-chev"><svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg></span>
   </div>
   <p class="card-sub">Las últimas revisiones que corriste en este navegador. Sirve para ver si algo que ayer estaba en pie hoy se rompió. No se envía a ningún lado (solo localStorage).</p>
   <ul class="hist empty" id="histList"><li>Aún no hay corridas registradas.</li></ul>
   <button class="detalle" id="histClear" style="margin-top:10px">borrar historial</button>
  </section>
 </div>
</main>
<p class="foot"><span id="lastRun" class="lastrun"></span></p>

<script>
var $=function(s){return document.querySelector(s);};
var byId=function(id){return document.getElementById(id);};
var running=false;
var ENV='qa';                 // ambiente activo (qa|prod) — se manda en cada corrida
var PROD_BLOCKED=['crear-orden','capa2-auto']; // se sobrescribe desde /config
// Cambia el ambiente activo: pinta la advertencia y deshabilita lo que muta datos en prod.
function applyEnv(v){
 ENV=(v==='prod')?'prod':'qa';
 document.body.classList.toggle('env-prod',ENV==='prod');
 var w=byId('prodwarn'); if(w){if(ENV==='prod')w.removeAttribute('hidden');else w.setAttribute('hidden','');}
 // Deshabilitar en prod los botones de acciones bloqueadas (guard real está en el server).
 var blocked=(ENV==='prod');
 PROD_BLOCKED.forEach(function(act){
  var btns=document.querySelectorAll('[data-action="'+act+'"]');
  for(var i=0;i<btns.length;i++){
   btns[i].disabled=blocked;
   btns[i].title=blocked?'Deshabilitado en producción — crearía datos reales':'';
  }
 });
}
var HERO={
  idle:{title:'Listo para revisar',tag:'en espera',sub:'Corre una revisión completa del sitio tras una liberación, o prueba un check puntual abajo.'},
  run :{title:'Revisando el sitio…',tag:'corriendo',sub:'Health · Contenido · Estructura · Suite anónima. Mantén esta pestaña abierta.'},
 ok  :{title:'Todo en pie',tag:'ok',sub:'La estructura crítica respondió correctamente. Ningún elemento load-bearing se rompió.'},
  skip:{title:'Revisión omitida',tag:'omitido',sub:'La corrida no verificó nada (todo quedó en "skipped"). Revisa el detalle técnico.'},
 err :{title:'Algo se rompió',tag:'revisar',sub:'Un check falló. Abre el detalle técnico de "Checks estructurales" para ver qué fue.'}
};

function setHero(state){
 var h=byId('hero'); h.classList.remove('is-run','is-ok','is-err','is-skip');
 if(state&&state!=='idle')h.classList.add('is-'+state);
 var d=HERO[state]||HERO.idle;
 byId('heroTitle').textContent=d.title; byId('heroTag').textContent=d.tag; byId('heroSub').textContent=d.sub;
}
function setPill(el,state){
 if(!el)return;
 el.classList.remove('is-run','is-ok','is-err','is-skip');
 var txt={run:'corriendo…',ok:'OK',err:'revisar',skip:'omitido',idle:'—'}[state]||'—';
 if(state)el.classList.add('is-'+state);
 var dot=el.querySelector('.d'); el.textContent=''; if(dot)el.appendChild(dot); else{dot=document.createElement('span');dot.className='d';el.appendChild(dot);}
 el.appendChild(document.createTextNode(' '+txt));
 // Espejar el estado al mosaico de zona contenedor (borde de color) si lo hay.
 var z=el.closest&&el.closest('.zona');
 if(z){z.classList.remove('is-run','is-ok','is-err','is-skip'); if(state&&state!=='idle')z.classList.add('is-'+state);}
}
function setBusy(b){
 running=b; document.body.classList.toggle('busy',b);
 var btns=document.querySelectorAll('[data-action],#btnInbox');
 for(var i=0;i<btns.length;i++)btns[i].disabled=b;
 // Al re-habilitar (fin de corrida), respetar el bloqueo de producción.
 if(!b&&ENV==='prod')PROD_BLOCKED.forEach(function(act){
  var x=document.querySelectorAll('[data-action="'+act+'"]'); for(var i=0;i<x.length;i++)x[i].disabled=true;
 });
}
function logLine(logEl,text,cls){
 var d=document.createElement('div'); d.className=cls||''; d.textContent=text; logEl.appendChild(d); logEl.scrollTop=logEl.scrollHeight;
}
function classify(t){
 if(/^✓|PASS|passed|✔|exitosa|VERIFICADO|\\bOK\\b/i.test(t))return'ok';
 if(/error|fail|✗|✘|rechaz|inválid|FALL/i.test(t))return'e';
 if(/^CAPA2_ORDER=|orden creada|→|▶|Running|tests/i.test(t))return'info';
 return'';
}

// ─── ACTIVIDAD EN VIVO ───────────────────────────────────────────────────────
// Traduce las líneas crudas del log a pasos humanos con checklist que se va
// llenando. Cada "flow" define pasos ordenados (regex → etiqueta amigable).
var FLOWS={
 orden:[
  // Anclados a FRASES INEQUÍVOCAS de cada log line (no a subcadenas del arranque:
  // "creando orden tipo: servicio" NO debe disparar "Procesando el pago"). s21.
  {re:/tecleando usuario|login: teclea/i,                         t:'Tecleando usuario y contraseña'},
  {re:/sesi[oó]n iniciada|sesi[oó]n .* activa/i,                  t:'Sesión iniciada'},
  {re:/agregad[oa] al carrito|cotizaci[oó]n generada|wizard abierto/i, t:'Producto en el carrito'},
  {re:/iniciar compra/i,                                          t:'Entrando al checkout'},
  {re:/direcci[oó]n usada|paso 1:/i,                              t:'Dirección confirmada'},
  {re:/informaci[oó]n confirmada|paso 2:/i,                       t:'Datos confirmados'},
  // OJO: NO incluir "método de pago:" — esa línea se imprime al ELEGIR el método,
  // antes del pago real, y encendía este paso de más (avance-en-falso, s21).
  {re:/procesando pago|capturada|generar pedido \\(/i,            t:'Procesando el pago'},
  {re:/✓ orden creada|orden creada:/i,                            t:'¡Orden creada!'}
 ],
  capa2:[
    {re:/tecleando usuario|login: teclea/i,                          t:'Iniciando sesión (usuario y contraseña)'},
    {re:/sesi[oó]n iniciada|sesi[oó]n .* activa|wizard abierto|agregad[oa] al carrito|cotizaci[oó]n generada/i, t:'Creando orden de prueba'},
    {re:/procesando pago|orden creada|CAPA2_ORDER=/i,               t:'Pago procesado'},
    {re:/confirmed|confirmado/i,                                    t:'Estado: confirmado'},
    {re:/shipped|en camino/i,                                       t:'Estado: en camino'},
    {re:/correo|email|verific|@capa2|skipped|passed/i,             t:'Verificando correos'}
  ]
};
// Frases amigables para la línea "ahora" (cuando ningún paso aplica).
function ahoraTexto(text){
 var t=text.replace(/^\\[[^\\]]+\\]\\s*/,'').replace(/\\s+/g,' ').trim();
 if(/^\\$ /.test(t))return''; // no mostrar el eco del comando
 if(/Running \\d+ test/i.test(t))return'Arrancando las pruebas…';
 if(/\\bpassed\\b/i.test(t)&&/\\bskipped\\b/i.test(t))return'Pruebas finalizadas';
 if(/^✓|^\\s*ok\\b/i.test(t))return'Verificación OK';
 if(t.length>90)t=t.slice(0,90)+'…';
 return t;
}
// Cronómetro de la corrida (mm:ss) — arranca con la tira y se detiene al terminar.
function fmtClock(ms){var s=Math.floor(ms/1000);return Math.floor(s/60)+':'+('0'+(s%60)).slice(-2);}
function timerStart(liveEl){
 if(!liveEl)return; liveEl._t0=Date.now();
 var el=liveEl.querySelector('[data-time]'); if(!el)return;
 liveEl._timer=setInterval(function(){el.textContent=fmtClock(Date.now()-liveEl._t0);},500);
}
function timerStop(liveEl){
 if(!liveEl)return; if(liveEl._timer){clearInterval(liveEl._timer);liveEl._timer=null;}
 var el=liveEl.querySelector('[data-time]'); if(el&&liveEl._t0)el.textContent=fmtClock(Date.now()-liveEl._t0);
}

// ─── Tira FIJA de estado (sticky bajo el header) ─────────────────────────────
// Espeja el panel en vivo activo para que el estado SIEMPRE se vea, sin importar
// hasta dónde scrolleaste. window._activeLive apunta al <div class="live"> en curso.
var _lbHideT=null;
function showLivebar(){var b=byId('livebar'); if(!b)return; if(_lbHideT){clearTimeout(_lbHideT);_lbHideT=null;} b.className='livebar'; b.removeAttribute('hidden');}
function hideLivebar(){var b=byId('livebar'); if(b){b.setAttribute('hidden','');}}
function syncLivebar(liveEl){
 var b=byId('livebar'); if(!b||b.hasAttribute('hidden')||!liveEl)return;
 var nowEl=liveEl.querySelector('[data-now]');
 var now=nowEl&&nowEl.childNodes[0]?nowEl.childNodes[0].nodeValue:'';
 byId('lbNow').textContent=now||'Trabajando…';
 var pr=byId('lbProg'), ct=byId('lbCounts');
 if(liveEl._mode==='tests'){
  pr.style.display=''; pr.textContent=(liveEl._done||0)+'/'+(liveEl._total||'?');
  ct.style.display=''; ct.textContent='✓'+greenCount(liveEl)+' ✘'+(liveEl._fail||0)+' –'+(liveEl._skip||0);
 }else{ pr.style.display='none'; ct.style.display='none'; }
}
byId('lbJump').addEventListener('click',function(){
 var l=window._activeLive; var card=l&&l.closest?l.closest('.card'):null;
 if(card&&card.classList.contains('collapsed'))toggleCard(card,false);
 (l||byId('livebar')).scrollIntoView({behavior:'smooth',block:'center'});
});

function liveStart(liveEl){
 if(!liveEl)return;
 window._activeLive=liveEl; showLivebar(); syncLivebar(liveEl);
 var flow=liveEl.getAttribute('data-flow');
 liveEl.className='live show is-run'; liveEl._flow=flow; liveEl._idx=-1; liveEl._n=0;
 // Modo LISTA DE TESTS (checks Playwright): progreso i/N + semáforo + fila por test
 // con el motivo del fallo inline. Lo alimenta el reporter @@DASH (dashEvent).
 if(flow==='checks'){
  liveEl._mode='tests'; liveEl._total=0; liveEl._done=0; liveEl._ok=0; liveEl._fail=0; liveEl._skip=0; liveEl._fails=[];
  liveEl.innerHTML=
   '<div class="live-now"><span class="live-spin"></span>'
   +'<span class="live-txt" data-now>Arrancando las pruebas…<small data-sub></small></span>'
   +'<span class="live-time" data-time>0:00</span></div>'
   +'<div class="lp"><div class="lp-track"><div class="lp-bar" data-bar></div></div><span class="lp-num" data-num>0/0</span></div>'
   +'<div class="lcounts"><span class="lc lc-ok" data-cok>✓ 0 en pie</span><span class="lc lc-fail" data-cfail>✘ 0 rotos</span><span class="lc lc-skip" data-cskip>– 0 omitidos</span></div>'
   +'<ul class="tlist" data-tlist></ul>';
  timerStart(liveEl); return;
 }
 // Modo CHECKLIST (crear-orden / correos): pasos humanos que se van palomeando.
 liveEl._mode='steps';
 var steps=FLOWS[flow];
 var html='<div class="live-now"><span class="live-spin"></span><span class="live-txt" data-now>Arrancando…<small data-sub></small></span><span class="live-time" data-time>0:00</span></div>';
 if(steps){
  html+='<ul class="live-steps">';
  for(var i=0;i<steps.length;i++)html+='<li data-step="'+i+'"><span class="tick">✓</span>'+steps[i].t+'</li>';
  html+='</ul>';
 }
 liveEl.innerHTML=html;
 timerStart(liveEl);
}

// ─── MODO LISTA DE TESTS — alimentado por eventos @@DASH del reporter ─────────
function humanTitle(o){
 var s=(o.suite||'').replace(/@\\w+\\s*/g,'').trim();
 var t=(o.title||'').trim();
 return {suite:s,title:t};
}
function setNow(liveEl,main,sub){
 var nowEl=liveEl.querySelector('[data-now]'); if(!nowEl)return;
 nowEl.childNodes[0].nodeValue=main;
 var subEl=liveEl.querySelector('[data-sub]'); if(subEl)subEl.textContent=sub||'';
}
function updProg(liveEl){
 var total=liveEl._total||0, done=liveEl._done||0;
 var bar=liveEl.querySelector('[data-bar]'), num=liveEl.querySelector('[data-num]');
 if(bar)bar.style.width=(total?Math.round(done/total*100):0)+'%';
 if(num)num.textContent=done+'/'+(total||'?');
 var cok=liveEl.querySelector('[data-cok]'),cf=liveEl.querySelector('[data-cfail]'),cs=liveEl.querySelector('[data-cskip]');
 var g=greenCount(liveEl);
 if(cok){cok.textContent='✓ '+g+' en pie'; cok.className='lc lc-ok'+(g?' on':'');}
 if(cf){cf.textContent='✘ '+(liveEl._fail||0)+' rotos'; cf.className='lc lc-fail'+(liveEl._fail?' on':'');}
 if(cs){cs.textContent='– '+(liveEl._skip||0)+' omitidos'; cs.className='lc lc-skip'+(liveEl._skip?' on':'');}
}
// Traduce el error CRUDO de Playwright a una frase humana (qué pasó + por qué importa).
// El detalle técnico exacto sigue disponible al expandir la fila — esto es la portada.
function friendlyError(o){
 var e=String(o.error||'');
 var T=function(re){return re.test(e);};
 if(o.status==='timedOut'||T(/Test timeout|Timed out.*test\\b/i))
  return'La prueba tardó demasiado y se canceló. El sitio pudo no cargar a tiempo (o un elemento nunca apareció).';
 if(T(/unexpected.*pass|expected to fail/i))
  return'¡Buena noticia! Un bug conocido parece arreglado: la prueba que debía fallar pasó. Toca cerrar el ticket en el inventario.';
 if(T(/toBe\\(200\\)|Expected:\\s*200|response.*[45]\\d\\d|ERR_|ECONNREFUSED|net::/i))
  return'La URL no respondió 200. Suele ser un deploy a medias o infraestructura caída — no el sitio roto por dentro. Reintenta; si persiste, avisa a dev/infra.';
 if(T(/Ha ocurrido un error/i))
  return'La página mostró el mensaje "Ha ocurrido un error" en vez del contenido.';
 if(T(/toBeGreaterThan|Expected:\\s*>\\s*0|Received:\\s*0|toHaveCount/i))
  return'Se esperaba al menos un elemento y no apareció ninguno (contador en 0). Lo más probable: esa sección no se renderizó.';
 if(T(/toBeVisible|to be visible|not visible/i))
  return'Un elemento esperado nunca se hizo visible. Pudo no renderizarse o haber cambiado de lugar.';
 if(T(/toBeEnabled|to be enabled|disabled/i))
  return'Un botón o campo siguió deshabilitado cuando debía habilitarse.';
 if(T(/toBeAttached|waiting for.*locator|getByRole|getByText|getByLabel|locator\\(/i))
  return'No se encontró un elemento clave en la página (no apareció en el DOM). Si el equipo cambió el markup a propósito, hay que actualizar el contract.';
 if(T(/toContainText|toHaveText|toHaveTitle|expected substring|to contain/i))
  return'El texto esperado no coincidió con lo que mostró la página.';
 if(T(/toHaveURL|expected url/i))
  return'La navegación terminó en una URL distinta a la esperada.';
 return'Una verificación no se cumplió. Abre el detalle técnico para ver el assert exacto.';
}
// Veredicto REAL de un test (no el status crudo). Distingue el caso clave:
// un baseline (expected==='failed') que falla NO es un roto — es un bug conocido
// confirmado; si PASA, el bug se arregló. Esto es lo que hace "atinado" al panel.
function classifyOutcome(o){
 if(o.status==='skipped')return'skip';
 if(o.expected==='failed') return o.status==='passed' ? 'fixed' : 'known';
 return o.status==='passed' ? 'ok' : 'fail';
}
// Frase humana por fila según el tipo de resultado.
function rowReason(st,o){
 if(st==='fail')  return friendlyError(o);
 if(st==='known') return'Bug conocido confirmado: el problema sigue presente, tal como se esperaba. NO es una regresión nueva — la suite lo vigila para avisarte el día que se arregle.';
 if(st==='fixed') return'¡Un bug conocido se arregló! Esta prueba debía fallar y ahora pasa. Toca cerrar el ticket en el inventario y quitarle el marcado de "bug conocido".';
 if(st==='flaky') return'Falló al primer intento y pasó al reintentar (flaky). Suele ser timing o hidratación de Qwik bajo carga, no una regresión — pero si se repite seguido, conviene endurecer el selector.';
 return'';
}
// Pinta el contenido de una fila (idempotente → se puede repintar en un reintento).
function fillRow(li,st,o){
 li.className='trow is-'+st; li.innerHTML='';
 var h=humanTitle(o);
 var dot=document.createElement('span'); dot.className='tdot'; li.appendChild(dot);
 var tt=document.createElement('span'); tt.className='tt';
 if(h.suite){var sp=document.createElement('span'); sp.className='ts'; sp.textContent=h.suite; tt.appendChild(sp);}
 tt.appendChild(document.createTextNode(h.title));
 var reason=rowReason(st,o);
 if(reason){var rs=document.createElement('span'); rs.className='treason'; rs.textContent=reason; tt.appendChild(rs);}
 li.appendChild(tt);
 var ms=document.createElement('span'); ms.className='tms'; ms.textContent=o.ms?fmtMs(o.ms):''; li.appendChild(ms);
 // Detalle técnico crudo cuando hubo un error capturado (roto real, baseline o flaky).
 if(o.error&&(st==='fail'||st==='known'||st==='flaky')){
  li.classList.add('has-err');
  var err=document.createElement('div'); err.className='terr';
  var lbl=document.createElement('div'); lbl.className='terr-lbl'; lbl.textContent='Detalle técnico (Playwright)'; err.appendChild(lbl);
  var raw=document.createElement('div'); raw.className='terr-raw'; raw.textContent=o.error; err.appendChild(raw);
  li.appendChild(err);
 }
}
// Crea la fila, le cuelga el toggle de detalle (una sola vez) y la inserta.
function makeRow(liveEl,st,o){
 var li=document.createElement('li');
 li.addEventListener('click',function(){ if(li.classList.contains('has-err'))li.classList.toggle('open'); });
 fillRow(li,st,o);
 var L=liveEl.querySelector('[data-tlist]'); if(L){L.appendChild(li); L.scrollTop=L.scrollHeight;}
 return li;
}
function fmtMs(ms){return ms>=1000?(ms/1000).toFixed(1)+'s':ms+'ms';}
// Enruta un evento estructurado del reporter (@@DASH) a la lista en vivo.
function dashEvent(liveEl,o){
 if(!liveEl||liveEl._mode!=='tests')return;
 if(o.ev==='start'){liveEl._total=o.total||0; updProg(liveEl); syncLivebar(liveEl); return;}
 if(o.ev==='begin'){var h=humanTitle(o); setNow(liveEl,'Probando: '+(h.title||h.suite),h.suite); syncLivebar(liveEl); return;}
 if(o.ev==='end'){
  // Clave única por test → detectar reintentos (retries:2 del proyecto). Cada intento
  // emite un evento 'end'; sin dedup, un flaky se pinta 2 veces (rojo + verde) e infla todo.
  var key=(o.suite||'')+' >>> '+(o.title||'');
  liveEl._rows=liveEl._rows||{};
  var prev=liveEl._rows[key];
  var st=classifyOutcome(o);
  if(prev){
   // Reintento del MISMO test. Si un intento previo falló y este pasó → FLAKY
   // (se recuperó al reintentar), no un roto. Conservar el error del intento fallido.
   if(prev.st==='fail'&&st==='ok')st='flaky';
   var dispO={suite:o.suite,title:o.title,ms:o.ms,expected:o.expected,status:o.status,outcome:o.outcome,error:o.error||(prev.o&&prev.o.error)||''};
   countDec(liveEl,prev.st);
   fillRow(prev.li,st,dispO);
   prev.st=st; prev.o=dispO;
  }else{
   liveEl._done++; // contar cada test UNA vez (en su primer intento)
   var li=makeRow(liveEl,st,o);
   prev=liveEl._rows[key]={li:li,st:st,o:o};
  }
  countInc(liveEl,st);
  updProg(liveEl); syncLivebar(liveEl);
 }
}
// Contadores por tipo (buckets _ok/_fail/_skip/_known/_fixed/_flaky). "En pie" (verde)
// = todo lo que para Playwright cuenta como éxito: ok + bug conocido + arreglado + flaky.
function countInc(liveEl,st){ liveEl['_'+st]=(liveEl['_'+st]||0)+1; }
function countDec(liveEl,st){ liveEl['_'+st]=Math.max(0,(liveEl['_'+st]||0)-1); }
function greenCount(liveEl){ return (liveEl._ok||0)+(liveEl._known||0)+(liveEl._fixed||0)+(liveEl._flaky||0); }
function liveLine(liveEl,text){
 if(!liveEl||!liveEl.classList.contains('show'))return;
 if(liveEl._mode==='tests')return; // modo lista: lo maneja dashEvent, no las líneas crudas
 var now=ahoraTexto(text);
 var flow=liveEl._flow, steps=FLOWS[flow];
 // Avanzar el checklist (solo hacia adelante).
 if(steps){
  for(var i=steps.length-1;i>liveEl._idx;i--){
   if(steps[i].re.test(text)){
    var lis=liveEl.querySelectorAll('.live-steps li');
    for(var k=0;k<lis.length;k++){lis[k].classList.remove('active'); if(k<i)lis[k].classList.add('done'); else lis[k].classList.remove('done');}
    if(lis[i])lis[i].classList.add('active');
    liveEl._idx=i; if(!now)now=steps[i].t; break;
   }
  }
 }
 // Contador de verificaciones OK (funciona con o sin checklist).
 if(/^\s*✓|✓\s+\d+|\bok\b/i.test(text))liveEl._n++;
 var nowEl=liveEl.querySelector('[data-now]'), subEl=liveEl.querySelector('[data-sub]');
 if(nowEl&&now){nowEl.childNodes[0].nodeValue=now;}
 if(subEl&&!steps&&liveEl._n>0)subEl.textContent=liveEl._n+' verificación(es) OK';
 syncLivebar(liveEl);
}
function liveDone(liveEl,state,msg){
 if(!liveEl||!liveEl.classList.contains('show'))return;
 liveEl.classList.remove('is-run','is-ok','is-err','is-skip'); liveEl.classList.add('is-'+state);
 var spin=liveEl.querySelector('.live-spin');
 if(spin)spin.textContent={ok:'✓',err:'✗',skip:'!'}[state]||'';
 var nowEl=liveEl.querySelector('[data-now]');
 if(nowEl)nowEl.childNodes[0].nodeValue=msg||{ok:'Listo',err:'Falló',skip:'Omitido'}[state];
 if(state==='ok'){var lis=liveEl.querySelectorAll('.live-steps li'); for(var k=0;k<lis.length;k++){lis[k].classList.remove('active'); lis[k].classList.add('done');}}
 // Resumen en la sub-línea (modo lista de tests).
 if(liveEl._mode==='tests'){
  var subEl=liveEl.querySelector('[data-sub]');
  if(subEl){
   var txt=greenCount(liveEl)+' en pie · '+(liveEl._fail||0)+' rotos · '+(liveEl._skip||0)+' omitidos';
   if(liveEl._flaky)txt+=' · '+liveEl._flaky+' flaky';
   if(liveEl._known)txt+=' · '+liveEl._known+' bug(s) conocido(s) vigilado(s)';
   if(liveEl._fixed)txt+=' · ¡'+liveEl._fixed+' bug(s) arreglado(s)!';
   subEl.textContent=txt;
  }
 }
 // Estado final en la tira fija → se mantiene un momento y se oculta sola.
 var b=byId('livebar');
 if(b&&!b.hasAttribute('hidden')){
  b.className='livebar is-'+state;
  syncLivebar(liveEl);
  var spin=b.querySelector('.lb-spin'); if(spin)spin.textContent={ok:'✓',err:'✗',skip:'!'}[state]||'';
  byId('lbNow').textContent=msg||{ok:'Listo',err:'Falló',skip:'Omitido'}[state];
  if(_lbHideT)clearTimeout(_lbHideT);
  _lbHideT=setTimeout(hideLivebar,4000);
 }
}

// ─── TRIAGE ───────────────────────────────────────────────────────────────
// La pregunta del QA: si un check falla, ¿es BUG/regresión o solo cambió un
// selector? La respuesta vive en QUÉ CAPA falló (diagnóstico por capas):
//   · Health rojo → ambiente (URL no responde) — NO es el sitio roto por dentro.
//   · Contenido rojo (200 pero sin title/header) → render roto REAL, no selector.
//   · Estructura roja → un elemento crítico no apareció. Como los selectores son
//     estables por diseño (rol/texto/href, nunca hashes), lo más probable es
//     REGRESIÓN; si fue un cambio intencional, se actualiza el contract (1 línea).
// Esto traduce el error crudo a una causa probable + qué hacer.
function triage(action, log){
 var fails=[]; var re=/[✘✗×]\\s+\\d+\\s+.*?›\\s*([^\\n]+)/g, m;
 while((m=re.exec(log)))fails.push(m[1].replace(/\\(\\d+(\\.\\d+)?(ms|s)\\)\\s*$/,'').trim());
 var causa, pista, clase='regresion';
 if(action==='health'||/expected.*200|toBe\\(200\\)|net::ERR|ECONNREFUSED|response.*(4\\d\\d|5\\d\\d)/i.test(log)){
  causa='Ambiente: una URL no respondió 200.'; clase='ambiente';
   pista='Suele ser un deploy a medias o infra caída, NO el sitio roto por dentro. Reintenta; si persiste, avisa a dev/infra.';
 }else if(action==='content'||/@content/i.test(log)){
  causa='La página dio 200 pero no renderizó contenido (faltó title o header).'; clase='render';
   pista='Es un render roto REAL — title/header son lo más estable que hay, no un selector. Revisa la hidratación (Qwik) de esa URL.';
 }else if(/Timed out.*(toBeVisible|toBeAttached|toBeEnabled)|waiting for|getByRole|getByText|locator\\(/i.test(log)){
  causa='Un elemento crítico esperado no apareció.'; clase='regresion';
   pista='Los selectores son estables por diseño (rol/texto/href, nunca hashes) → lo más probable es REGRESIÓN real. Si el equipo cambió el texto/markup A PROPÓSITO, actualiza el contract y haz commit (el git log queda como historial de lo que el sitio prometía).';
 }else if(/unexpected.*pass|expected to fail|fixme/i.test(log)){
  causa='Un bug conocido cambió de estado.'; clase='baseline';
   pista='Si un test marcado como "bug conocido" PASÓ, el bug se arregló → ciérralo en el inventario. Si empeoró, el assert distinto lo delata.';
 }else{
  causa='Falló una verificación.'; clase='otro';
   pista='Abre el detalle técnico para ver el error exacto del runner.';
 }
 return {fails:fails, causa:causa, pista:pista, clase:clase};
}
function liveTriage(liveEl,t,skipped,why){
 if(!liveEl)return;
 var box=document.createElement('div'); box.className='triage';
 var html='';
 if(skipped){
  html+='<div class="row"><span class="k">Qué pasó</span><span class="v">La corrida no verificó nada (<b>'+skipped+' omitido(s)</b>, 0 verificados).</span></div>';
  var por=(why==='auth')
   ? 'Esta área necesita sesión B2C (<code>rotoplas-auth-b2c.json</code>). Sin sesión sus tests <b>@auth</b> se omiten — no es un fallo del sitio. Genera la sesión con <code>node setup-auth-b2c.js</code> y reintenta.'
   : 'Probablemente faltó el App Password de Gmail (Modo A) o no había nada que correr. <b>El verde NO significaría "OK"</b> → por eso es ámbar.';
  html+='<div class="row"><span class="k">Por qué</span><span class="v">'+por+'</span></div>';
 }else{
  if(t.fails.length)html+='<div class="row"><span class="k">Qué falló</span><span class="v fail">'+t.fails.slice(0,3).join('<br>')+'</span></div>';
  html+='<div class="row"><span class="k">Causa probable</span><span class="v"><b>'+t.causa+'</b></span></div>';
  html+='<div class="row"><span class="k">Qué hacer</span><span class="v">'+t.pista+'</span></div>';
 }
 box.innerHTML=html; liveEl.appendChild(box);
}

// Decide el estado final a partir del código de salida + resumen de Playwright.
function veredicto(d){
 var s=d.summary||{};
 if(d.code!==0||s.failed>0)return'err';
 if(s.passed===0&&s.skipped>0)return'skip';
 return'ok';
}
// Mensaje final amigable para la tira en vivo.
function veredictoMsg(flow,state,d){
 if(state==='skip')return'Se omitió: nada verificado (sin App Password / nada que correr)';
  if(state==='err')return'Algo falló — mira el detalle técnico';
 if(flow==='orden'||flow==='capa2')return'¡Listo! Flujo completado como un usuario real';
 if(flow==='checks')return'Todo en pie';
}

function run(btn){
 if(running)return;
 var action=btn.getAttribute('data-action');
 var stEl=byId(btn.getAttribute('data-st'));
 var logEl=byId(btn.getAttribute('data-log'));
 var liveEl=byId(btn.getAttribute('data-live'));
 var isAll=(action==='check-all');
 // Auto-expandir la tarjeta objetivo → nunca disparar un check cuyo resultado quede oculto.
 var liveCard=liveEl&&liveEl.closest?liveEl.closest('.card'):null;
 // Expandir SOLO visualmente (sin persistir) → al recargar, la tarjeta vuelve a su
 // estado colapsado por defecto. Persistir aquí haría que correr "fije" la tarjeta abierta.
 if(liveCard&&liveCard.classList.contains('collapsed'))liveCard.classList.remove('collapsed');
 setBusy(true);
 if(isAll){setHero('run'); setPill(byId('st-checks'),'run');}
 else setPill(stEl,'run');
 if(logEl)logEl.textContent='';
 liveStart(liveEl);
 var runLog=''; // acumula la salida de ESTA corrida → insumo del triage
 var capturedOrder=''; // nº de orden si la corrida la crea (crear-orden)
 var headed=byId('headed').checked?'1':'0';
 var qs='/stream?action='+encodeURIComponent(action)+'&headed='+headed+'&env='+encodeURIComponent(ENV);
 if(btn.getAttribute('data-opts')){
  qs+='&tipo='+encodeURIComponent(byId('selTipo').value)+'&pago='+encodeURIComponent(byId('selPago').value);
 }
 var area=btn.getAttribute('data-area');
 if(area)qs+='&area='+encodeURIComponent(area);
 var es=new EventSource(qs);
 es.addEventListener('meta',function(e){var d=JSON.parse(e.data); if(logEl)logLine(logEl,'$ '+d.pretty+(d.headed?'   (con ventana)':'   (sin ventana)'),'cmd');});
 es.addEventListener('line',function(e){
  var d=JSON.parse(e.data); if(d.text===''){return;}
  if(d.text.indexOf('@@DASH ')===0){ // evento estructurado del reporter → lista en vivo
   try{dashEvent(liveEl,JSON.parse(d.text.slice(7)));}catch(_){}
   return; // no ensucia el log técnico ni el triage
  }
  runLog+=d.text+'\\n'; if(logEl)logLine(logEl,d.text, d.stream==='err'?'e':classify(d.text)); liveLine(liveEl,d.text);
  // Captura el nº de orden cuando la corrida la crea (stdout CAPA2_ORDER= o stderr "orden creada: X").
  var mo=d.text.match(/CAPA2_ORDER=([A-Za-z0-9]{5,24})/)||d.text.match(/orden creada:\\s*([A-Za-z0-9]{5,24})/i);
  if(mo)capturedOrder=mo[1];
 });
  es.addEventListener('done',function(e){
   var d=JSON.parse(e.data); timerStop(liveEl); var state=veredicto(d);
   if(isAll){setHero(state); setPill(byId('st-checks'),state);}
   else setPill(stEl,state);
   liveDone(liveEl,state,veredictoMsg(liveEl?liveEl.getAttribute('data-flow'):'',state,d));
   // Triage explicativo cuando NO es verde: por qué falló / se omitió + qué hacer.
   if(state==='err'){
    var tr=triage(action,runLog);
    // En modo lista de tests, listar SOLO los rotos reales (no baseline ni flaky recuperados),
    // tomados de las filas deduplicadas → título real, sin duplicados por reintento.
    if(liveEl&&liveEl._mode==='tests'&&liveEl._rows){
     var rf=Object.keys(liveEl._rows).map(function(k){return liveEl._rows[k];}).filter(function(r){return r.st==='fail';});
     if(rf.length)tr.fails=rf.slice(0,4).map(function(r){var h=humanTitle(r.o);return (h.suite?h.suite+' › ':'')+h.title;});
    }
    liveTriage(liveEl,tr,0);
   }
   else if(state==='skip')liveTriage(liveEl,null,(d.summary&&d.summary.skipped)||1,area?'auth':'');
   // Resumen inline de errores (sin abrir el log)
   if(action==='check-all'){
    var sum=byId('errsum');
    if(state==='ok'){sum.style.display='none';sum.textContent='';}
    else{
     var txt=d.summary?('Fallos: '+d.summary.failed+' · Pasaron: '+d.summary.passed):'';
     if(state==='err')txt='✗ Hubo fallos. Abre el detalle técnico para ver cuáles.';
     else if(state==='skip')txt='⚠ Todo quedó omitido — sin verificaciones reales.';
     sum.textContent=txt; sum.style.display='block';
    }
   }
   // Orden creada → mostrar el bloque de resultado con acciones de consulta.
   if(action==='crear-orden'&&capturedOrder&&state!=='err')showOrder(capturedOrder);
   // Timestamp de última corrida + registro en el historial (localStorage)
   byId('lastRun').textContent=' · Última: '+new Date().toLocaleTimeString('es-MX',{hour:'2-digit',minute:'2-digit'});
   var stId=btn.getAttribute('data-st');
   var histLabel=area?('Estructura: '+(AREA_LABELS[area]||area)):(ACT_LABEL[action]||action);
   recordRun(action,state,d.summary,{stId:stId,label:histLabel});
   es.close(); setBusy(false);
  });
 es.onerror=function(){
  timerStop(liveEl);
  if(isAll){setHero('err'); setPill(byId('st-checks'),'err');} else setPill(stEl,'err');
  liveDone(liveEl,'err','Se cortó la conexión con el panel');
   liveTriage(liveEl,{fails:[],causa:'Se cortó la conexión con el panel (SSE).',pista:'¿El servidor del panel sigue activo? Revisa la terminal donde ejecutaste npm run dashboard.',clase:'otro'},0);
  es.close(); setBusy(false);
 };
}

// Wire botones de acción
var actBtns=document.querySelectorAll('[data-action]');
for(var i=0;i<actBtns.length;i++){actBtns[i].addEventListener('click',function(){run(this);});}

// Detalle toggles
var dets=document.querySelectorAll('.detalle');
for(var j=0;j<dets.length;j++){
 dets[j].addEventListener('click',function(){
  var t=byId(this.getAttribute('data-target'));
  if(this.classList.contains('open')){this.classList.remove('open'); t.style.display='none';}
  else{this.classList.add('open'); t.style.display='block';}
 });
}
// logs ocultos hasta abrir
['log-checks','log-correos','log-orden','log-config'].forEach(function(id){var e=byId(id); if(e)e.style.display='none';});

// ─── Secciones colapsables (estado recordado en el navegador) ────────────────
var COLLAPSE_KEY='dashCollapseV1';
function loadCollapse(){try{return JSON.parse(localStorage.getItem(COLLAPSE_KEY))||{};}catch(_){return{};}}
function saveCollapse(m){try{localStorage.setItem(COLLAPSE_KEY,JSON.stringify(m));}catch(_){}}
function toggleCard(card,collapsed){
 if(!card)return;
 if(collapsed===undefined)collapsed=!card.classList.contains('collapsed');
 card.classList.toggle('collapsed',collapsed);
 var m=loadCollapse(); m[card.id]=collapsed; saveCollapse(m);
}
(function initCollapse(){
 var saved=loadCollapse(), heads=document.querySelectorAll('.card-h[data-toggle]');
 for(var i=0;i<heads.length;i++){(function(h){
  var id=h.getAttribute('data-toggle'), card=byId(id);
  if(saved.hasOwnProperty(id))card.classList.toggle('collapsed',!!saved[id]);
  h.addEventListener('click',function(){toggleCard(card);});
 })(heads[i]);}
})();

// ─── Historial de corridas (localStorage) ────────────────────────────────────
var HIST_KEY='dashHistoryV1', LAST_KEY='dashLastV1', HIST_MAX=15;
var ACT_LABEL={'check-all':'Revisar sitio','responde':'Responden y renderizan','health':'Health','content':'Contenido mínimo','forms':'Formularios','contracts':'Estructura crítica','capa2-auto':'Correos de pedido','crear-orden':'Crear orden','order-status':'estado','order-payments':'pagos','order-messages':'historial'};
var AREA_LABELS={}; // key→label, poblado desde /config
function loadHist(){try{return JSON.parse(localStorage.getItem(HIST_KEY))||[];}catch(_){return[];}}
function saveHist(a){try{localStorage.setItem(HIST_KEY,JSON.stringify(a.slice(0,HIST_MAX)));}catch(_){}}
function lastByPill(){try{return JSON.parse(localStorage.getItem(LAST_KEY))||{};}catch(_){return{};}}
function fmtTime(ts){return new Date(ts).toLocaleTimeString('es-MX',{hour:'2-digit',minute:'2-digit'});}
function resWord(e){
 if(e.state==='ok')return e.ok!=null?('✓ '+e.ok+' en pie'):'✓ OK';
 if(e.state==='err')return e.fail!=null?('✘ '+e.fail+' rotos'):'✘ falló';
 if(e.state==='skip')return '– omitido';
 return e.state||'';
}
function recordRun(action,state,summary,opts){
 opts=opts||{};
 var e={ts:Date.now(),action:action,label:opts.label||ACT_LABEL[action]||action,state:state};
 if(summary){e.ok=summary.passed;e.fail=summary.failed;e.skip=summary.skipped;}
 var a=loadHist(); a.unshift(e); saveHist(a); renderHist();
 // El "último estado" se indexa por el PILL (data-st) → cada área restaura el suyo.
 var stId=opts.stId; if(!stId)return;
 var last=lastByPill(); last[stId]={state:state,ts:e.ts}; try{localStorage.setItem(LAST_KEY,JSON.stringify(last));}catch(_){}
}
function renderHist(){
 var list=byId('histList'); if(!list)return;
 var a=loadHist();
 if(!a.length){list.className='hist empty';list.innerHTML='<li>Aún no hay corridas registradas.</li>';setPill(byId('st-hist'),null);return;}
 list.className='hist'; list.innerHTML='';
 for(var i=0;i<a.length;i++){
  var e=a[i], st=e.state||'idle';
  var li=document.createElement('li'); li.className='is-'+st;
  var dot=document.createElement('span');dot.className='hdot';li.appendChild(dot);
  var lbl=document.createElement('span');lbl.className='hlbl';lbl.textContent=e.label;li.appendChild(lbl);
  var res=document.createElement('span');res.className='hres';res.textContent=resWord(e);li.appendChild(res);
  var tm=document.createElement('span');tm.className='htime';tm.textContent=fmtTime(e.ts);li.appendChild(tm);
  list.appendChild(li);
 }
 setPill(byId('st-hist'),a[0].state); // pill = resultado más reciente
}
function restorePills(){
 var last=lastByPill();
 for(var stId in last){ if(!last.hasOwnProperty(stId))continue;
  // El check-all guarda su estado bajo stId 'hero', pero el hero NO es un pill:
  // restaurarlo con setHero (setPill borraría el contenido de la sección).
  if(stId==='hero'){ setHero(last[stId].state); continue; }
  var pill=byId(stId); if(!pill)continue;
  setPill(pill,last[stId].state);
  pill.title='Última corrida: '+new Date(last[stId].ts).toLocaleString('es-MX');
 }
}
byId('histClear').addEventListener('click',function(){try{localStorage.removeItem(HIST_KEY);localStorage.removeItem(LAST_KEY);}catch(_){} renderHist(); });
renderHist(); restorePills();

// Hint del método de pago (servicio solo tarjeta; efectivo < $5k)
function syncPagoHint(){
 var tipo=byId('selTipo').value, pago=byId('selPago').value, h=byId('pagoHint');
 var msg='';
 if(tipo==='servicio'&&pago!=='credito'&&pago!=='debito')msg='El servicio solo admite tarjeta → se usará crédito.';
 else if(pago==='efectivo')msg='Efectivo disponible para montos < $5,000.';
 else if(pago==='transferencia')msg='Genera el pedido con instrucciones SPEI (no requiere tarjeta).';
 h.textContent=msg;
}
byId('selTipo').addEventListener('change',syncPagoHint);
byId('selPago').addEventListener('change',syncPagoHint);
syncPagoHint();

// ─── Info de la orden creada (nº + consultas de estado/pagos/historial) ──────
// Las acciones order-status/payments/messages ya existían en el server; aquí se
// cablean por primera vez a la UI, usando el nº capturado de la corrida crear-orden.
var ORDER_KEY='dashLastOrderV1';
function showOrder(num,expand){
 if(!num)return;
 byId('ordNum').textContent=num;
 var box=byId('ordBox'); box.classList.add('show'); box.setAttribute('data-order',num);
 var out=byId('ordOut'); out.className='ord-out'; out.textContent='';
 try{localStorage.setItem(ORDER_KEY,num);}catch(_){}
 if(expand){var card=box.closest('.card'); if(card&&card.classList.contains('collapsed'))toggleCard(card,false);}
}
function orderQuery(action){
 if(running)return;
 var num=byId('ordBox').getAttribute('data-order'); if(!num)return;
 var out=byId('ordOut'); out.classList.add('show'); out.textContent='';
 setBusy(true); logLine(out,'› consultando '+ (ACT_LABEL[action]||action) +' de '+num+'…','info');
 var es=new EventSource('/stream?action='+encodeURIComponent(action)+'&order='+encodeURIComponent(num));
 es.addEventListener('line',function(e){var d=JSON.parse(e.data); if(d.text==='')return; logLine(out,d.text,d.stream==='err'?'e':classify(d.text));});
 es.addEventListener('done',function(){es.close();setBusy(false);});
 es.onerror=function(){logLine(out,'Se cortó la conexión con el panel.','e');es.close();setBusy(false);};
}
[['ordStatus','order-status'],['ordPay','order-payments'],['ordMsg','order-messages']].forEach(function(p){
 byId(p[0]).addEventListener('click',function(){orderQuery(p[1]);});
});
byId('ordCopy').addEventListener('click',function(){
 var num=byId('ordBox').getAttribute('data-order')||''; if(!num)return;
 if(navigator.clipboard)navigator.clipboard.writeText(num);
 var b=this; b.textContent='copiado'; setTimeout(function(){b.textContent='copiar';},1200);
});
(function(){try{var n=localStorage.getItem(ORDER_KEY); if(n)showOrder(n,false);}catch(_){}})();

// ─── Desglose "por área" de Estructura crítica (filas dinámicas desde /config) ─
function buildAreas(areas){
 var list=byId('areaList'); if(!list)return; list.innerHTML='';
 areas.forEach(function(a){
  AREA_LABELS[a.key]=a.label; var stId='st-area-'+a.key;
  // Cada zona es un MOSAICO clickeable (button → setBusy lo deshabilita) con su pill.
  var b=document.createElement('button'); b.className='zona';
  b.setAttribute('data-action','area'); b.setAttribute('data-area',a.key);
  b.setAttribute('data-st',stId); b.setAttribute('data-log','log-checks'); b.setAttribute('data-live','live-checks');
  b.title=a.label+(a.auth?' · requiere sesión':'')+' — '+a.files.join(' · ');
  var pill=document.createElement('span'); pill.className='pill'; pill.id=stId;
  var dot=document.createElement('span'); dot.className='d'; pill.appendChild(dot); pill.appendChild(document.createTextNode(' —'));
  b.appendChild(pill);
  var nm=document.createElement('span'); nm.className='znm'; nm.textContent=a.label; b.appendChild(nm);
  if(a.auth){var lk=document.createElement('span'); lk.className='lock'; lk.textContent='🔒'; b.appendChild(lk);}
  b.addEventListener('click',function(){run(this);});
  list.appendChild(b);
 });
 restorePills(); // ahora que los pills por zona existen en el DOM
}

// Revisar correos (lee el inbox; Modo B lista por IMAP, Modo A muestra link)
byId('btnInbox').addEventListener('click',function(){
 if(running)return;
 var pill=byId('st-correos'), list=byId('emails');
 setBusy(true); setPill(pill,'run'); list.className='emails'; list.innerHTML='';
 fetch('/emails').then(function(r){return r.json();}).then(function(d){
  if(d.mode==='A'){
   setPill(pill,'skip');
    list.className='emails empty'; list.innerHTML='<li>Modo A: abre el buzón de ventasecom para revisarlos a mano.</li>';
  }else if(d.error){
   setPill(pill,'err'); list.className='emails empty'; list.innerHTML='<li>'+d.error+'</li>';
  }else if(d.emails&&d.emails.length){
   setPill(pill,'ok');
   d.emails.forEach(function(m){
    var li=document.createElement('li');
    var su=document.createElement('span'); su.className='su'; su.textContent=m.subject||'(sin asunto)';
    var dt=document.createElement('span'); dt.className='dt'; dt.textContent=m.date?new Date(m.date).toLocaleString('es-MX'):'';
    li.appendChild(su); li.appendChild(dt); list.appendChild(li);
   });
  }else{
   setPill(pill,'skip'); list.className='emails empty'; list.innerHTML='<li>Sin correos de ventasecom en las últimas 2 horas.</li>';
  }
  setBusy(false);
 }).catch(function(){setPill(pill,'err'); setBusy(false);});
});

// Selector de ambiente → aplica advertencia + bloqueo al cambiar.
byId('env').addEventListener('change',function(){applyEnv(this.value);});

// ─── Sección de configuración (credenciales) ────────────────────────────────
function buildConfig(groups,values){
 var host=byId('cfgGroups'); if(!host)return; host.innerHTML='';
 groups.forEach(function(g){
  var box=document.createElement('div'); box.className='cfg-group';
  var h=document.createElement('h3'); h.appendChild(document.createTextNode(g.group));
  var gp=document.createElement('span'); gp.className='gp'; h.appendChild(gp); box.appendChild(h);
  g.items.forEach(function(it){
   var f=document.createElement('div'); f.className='cfg-field';
   var lb=document.createElement('label'); lb.textContent=it.label; f.appendChild(lb);
   var inp=document.createElement('input');
   inp.type=it.secret?'password':'text';
   inp.value=(values&&values[it.key])||'';
   inp.setAttribute('data-key',it.key);
   inp.setAttribute('data-secret',it.secret?'1':'0');
   inp.autocomplete='off'; inp.spellcheck=false;
   f.appendChild(inp);
   if(it.hint){var hn=document.createElement('span'); hn.className='hint'; hn.textContent=it.hint; f.appendChild(hn);}
   box.appendChild(f);
  });
  host.appendChild(box);
 });
 cfgStatus();
}
function cfgStatus(){
 var host=byId('cfgGroups'); if(!host)return;
 var groups=host.querySelectorAll('.cfg-group');
 for(var j=0;j<groups.length;j++){
  var gi=groups[j].querySelectorAll('input[data-key]'), all=true, any=false;
  for(var k=0;k<gi.length;k++){ if(gi[k].value.trim())any=true; else all=false; }
  var gp=groups[j].querySelector('.gp');
  if(gp){gp.textContent=all?'completo':(any?'incompleto':'vacío'); gp.className='gp'+(all?' ok':'');}
 }
 var byKey={}; var inputs=host.querySelectorAll('input[data-key]');
 for(var i=0;i<inputs.length;i++)byKey[inputs[i].getAttribute('data-key')]=inputs[i].value.trim();
 var ok=byKey['B2C_USER']&&byKey['B2C_PASS'];
 var p=byId('st-config');
 if(p){ p.classList.remove('is-ok','is-run','is-err','is-skip'); if(ok)p.classList.add('is-ok');
  var d=p.querySelector('.d'); p.textContent=''; if(d)p.appendChild(d);
  p.appendChild(document.createTextNode(' '+(ok?'configurado':'sin configurar'))); }
}
function setImapNote(mode){
 var n=byId('imapnote'); if(!n)return;
 if(mode==='B')n.innerHTML='<b style="color:var(--ok)">Modo B</b> · los correos se leen por IMAP. "Ver correos" lista los recientes de ventasecom.';
 else n.innerHTML='<span><b style="color:var(--warn)">Modo A</b> · sin App Password: el correo se confirma a mano en <a target="_blank" href="https://mail.google.com/mail/u/0/#search/from%3Aventasecom%40rotoplas.com">el buzón de ventasecom ↗</a>.</span>';
}
// Mostrar/ocultar credenciales (campos secretos)
byId('cfgShow').addEventListener('change',function(){
 var show=this.checked, ins=byId('cfgGroups').querySelectorAll('input[data-secret="1"]');
 for(var i=0;i<ins.length;i++)ins[i].type=show?'text':'password';
});
// Recalcular estado al teclear (delegación → funciona aunque los campos se rendericen después)
byId('cfgGroups').addEventListener('input',cfgStatus);
// Guardar configuración → POST /config/save (escribe .env + efecto inmediato en el server)
byId('btnSaveCfg').addEventListener('click',function(){
 var btn=this, orig=btn.innerHTML, ins=byId('cfgGroups').querySelectorAll('input[data-key]'), payload={};
 for(var i=0;i<ins.length;i++){var v=ins[i].value.trim(); if(v)payload[ins[i].getAttribute('data-key')]=v;}
 btn.disabled=true; btn.textContent='Guardando…';
 fetch('/config/save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
  .then(function(r){return r.json();}).then(function(res){
   cfgStatus(); if(res&&res.imapMode)setImapNote(res.imapMode);
   btn.textContent='Guardado ✓ ('+((res&&res.saved&&res.saved.length)||0)+' campos)';
   setTimeout(function(){btn.disabled=false; btn.innerHTML=orig;},1700);
  }).catch(function(){btn.textContent='Error al guardar'; setTimeout(function(){btn.disabled=false; btn.innerHTML=orig;},1700);});
});

// Config (IMAP note + conteo dinámico + ambientes + credenciales)
fetch('/config').then(function(r){return r.json();}).then(function(c){
 if(c.prodBlocked&&c.prodBlocked.length)PROD_BLOCKED=c.prodBlocked;
 applyEnv(byId('env').value); // estado inicial coherente (por si el navegador recordó la selección)
 if(c.envFields)buildConfig(c.envFields,c.envValues||{});
 if(c.healthCount){var zr=byId('z-responde'); if(zr)zr.title='¿Responden y renderizan? — '+c.healthCount+' URLs responden 200 y pintan contenido';}
 if(c.areas&&c.areas.length)buildAreas(c.areas);
 var n=byId('imapnote');
 if(c.imapMode==='B'){
  n.innerHTML='<b style="color:var(--ok)">Modo B</b> · los correos se leen por IMAP. "Ver correos" lista los recientes de ventasecom.';
 }else{
  n.innerHTML='<span><b style="color:var(--warn)">Modo A</b> · sin App Password: el correo se confirma a mano en <a target="_blank" href="https://mail.google.com/mail/u/0/#search/from%3Aventasecom%40rotoplas.com">el buzón de ventasecom ↗</a>.</span>';
 }
}).catch(function(){byId('imapnote').textContent='No se pudo leer la configuración del panel.';});
</script>
</body></html>`;
