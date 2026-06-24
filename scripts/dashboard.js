// scripts/dashboard.js
// PANEL WEB LOCAL de QA B2C — monitoreo por ÁREA del sitio + datos de prueba.
//
// REDISEÑO 2026-06-19 (ver ../diseno-dashboard.md): un solo eje organizador —
// POR ÁREA del sitio. Una sola página scrolleable, sin pestañas. Secciones por
// NATURALEZA de la acción: Monitorear (lectura) · Mutar (datos de prueba, cercado
// QA-only) · Investigar (drawer) · Configurar (modal).
//
// Arranca:  npm run dashboard     → abre http://127.0.0.1:4599
//
// DISEÑO / GUARDAS (decididos con el usuario):
//   • Ambiente seleccionable: QA (default) o Producción. Producción es SOLO para
//     monitoreo de lectura. Las acciones que MUTAN datos reales (crear-orden,
//     pipeline de correos, mover estado, compra/login E2E) están BLOQUEADAS en prod
//     por un guard en el SERVIDOR (PROD_BLOCKED), no solo en la UI.
//   • "Ver navegador": toggle GLOBAL, default HEADLESS (decisión #19 del rediseño).
//   • Mapa por área (7×4): Responde · Estructura · Flujo · Móvil. "Revisar sitio"
//     corre TODAS las áreas en LECTURA (Responde+Estructura) y enciende cada celda.
//     El Flujo mutante se dispara aparte, con candado 🔒.
//   • Correos: si hay App Password (GMAIL_IMAP_PASS) lista por IMAP (Modo B); si no,
//     muestra checklist + link al inbox de ventasecom (Modo A, confirmación a ojo).
//   • Seguridad: bind solo a 127.0.0.1; acciones en ALLOWLIST; inputs validados.
//     NO ejecuta comandos arbitrarios.
//
// Sin dependencias externas para el server (http + child_process). imapflow se usa
// SOLO si hay credenciales (lazy require).

require('dotenv').config();
const http = require('http');
const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const { URL } = require('url');

const ROOT = path.resolve(__dirname, '..');
const HOST = '127.0.0.1';
const PORT = Number(process.env.DASH_PORT || 4599);

// Ambientes seleccionables. QA es el default seguro; Producción solo para MONITOREO.
const ENVS = {
  qa:   { label: 'QA',          base: 'https://qarotoplasmx.io' },
  prod: { label: 'Producción',  base: 'https://rotoplas.com.mx' },
};
const BASE_QA = ENVS.qa.base;
const envBase = (e) => (ENVS[e] ? ENVS[e].base : ENVS.qa.base);

// GUARD: acciones que MUTAN datos reales (crean pedidos, mueven estados, mandan
// correos a clientes reales). PROHIBIDAS en producción — solo disponibles en QA.
const PROD_BLOCKED = new Set(['crear-orden', 'capa2-auto', 'purchase', 'login-check', 'move-state']);

// ─── Configuración editable desde el modal de Ajustes ────────────────────────
// Recortado (rediseño §11) a lo que ESTE panel usa: Sesión B2C + Gmail App Password.
// BrowserStack y la API interna salieron (no se usan aquí). saveEnv preserva el
// resto del .env (CT_*, etc.) intacto.
const ENV_FIELDS = [
  { group: 'Sesión B2C (ruta autenticada)', items: [
    { key: 'B2C_USER', label: 'Usuario B2C', secret: false, hint: 'correo de la cuenta de pruebas' },
    { key: 'B2C_PASS', label: 'Contraseña B2C', secret: true },
  ]},
  { group: 'Correos de pedido (Gmail · Modo B)', items: [
    { key: 'GMAIL_IMAP_USER', label: 'Correo del buzón', secret: false, hint: 'p. ej. c.agarcia@rotoplas.com' },
    { key: 'GMAIL_IMAP_PASS', label: 'App Password (16 caracteres)', secret: true, hint: 'contraseña de aplicación de Gmail, NO la normal' },
  ]},
];
const ENV_ALLOW = new Set(ENV_FIELDS.flatMap((g) => g.items.map((i) => i.key)));

// Escribe valores al .env (preservando lo demás) y actualiza process.env EN VIVO.
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
  Object.keys(set).forEach((k) => { process.env[k] = set[k]; });
  return Object.keys(set);
}

// ─── Datos de _targets (fuente única) — conteo de health por área ────────────
let HEALTH_URLS = [];
try { HEALTH_URLS = require('../tests/_targets').HEALTH_URLS || []; } catch (_) { /* opcional */ }
const HEALTH_COUNT = HEALTH_URLS.length;
function respondeCount(areaKey) { return HEALTH_URLS.filter((u) => u.area === areaKey).length; }

// ─── Catálogos de estado (de ct-api.js) ──────────────────────────────────────
const ORDER_STATES    = ['Open', 'Confirmed', 'Complete', 'Cancelled'];
const SHIPMENT_STATES = ['Backorder', 'Delayed', 'Delivered', 'Partial', 'Pending', 'Ready', 'Shipped'];
const PAYMENT_STATES  = ['Paid', 'Pending', 'Failed'];
const STATE_MAP = {};
ORDER_STATES.forEach(s    => STATE_MAP[`order:${s}`] = { flag: '--b2c-set-state',    state: s, label: `orderState · ${s}` });
SHIPMENT_STATES.forEach(s => STATE_MAP[`ship:${s}`]  = { flag: '--b2c-set-shipment', state: s, label: `shipmentState · ${s}` });
PAYMENT_STATES.forEach(s  => STATE_MAP[`pay:${s}`]   = { flag: '--b2c-set-payment',  state: s, label: `paymentState · ${s}` });

// ─── MAPA POR ÁREA (corazón del panel) ───────────────────────────────────────
// Cada área se mide en 4 dimensiones. Las claves COINCIDEN con el campo `area` de
// HEALTH_URLS (_targets.js) para el slicing de "Responde".
//   responde : ¿tiene URLs propias en HEALTH_URLS? (cascarón no → "—")
//   files    : specs @contract de su "Estructura"
//   flujo    : acción mutante de su "Flujo" (null = ⏳ pendiente)
//   lock     : true → área con flujo mutante (candado 🔒)
//   auth     : la corrida necesita sesión B2C (si falta → skip ámbar, no rojo)
//   movil    : patrón --grep de los tests @mobile del área en `5-mobile` (null = ⏳ parqueado)
const AREAS = {
  cascaron:      { label: 'Header y Footer',         desc: 'El cascarón global: header, nav, buscador y footer + sus enlaces en toda página', lock: false, responde: false, files: ['1-global-layout'], flujo: 'header-flujo', flujoLabel: 'Buscador → resultados (SRP)', movil: 'Cascarón en 375', movilLabel: 'Footer global 375px · sin overflow' },
  home:          { label: 'Home',                    desc: 'La portada: carrusel, categorías y el selector "¿qué necesitas solucionar?"', lock: false, responde: true,  files: ['1-home'], flujo: 'home-flujo', flujoLabel: 'Selector de soluciones → categoría', movil: 'Home: header|Hamburguesa abre', movilLabel: 'Header + hamburguesa abre menú · sin overflow' },
  pdp:           { label: 'Catálogo / PDP',          desc: 'Catálogo y ficha de producto: listados, galería, acordeones y compra por CP', lock: false, responde: true,  files: ['1-pdp', '1-catalog'], flujo: 'pdp-flujo', flujoLabel: 'Galería · acordeones · compra por CP', movil: 'PDP en 375px|Catálogo en 375px', movilLabel: 'PDP + catálogo a 375px · sin overflow' },
  servicios:     { label: 'Servicios',               desc: 'Servicio de lavado de tinaco: landing y cotización del wizard', lock: false, responde: true,  files: ['1-servicios', '1-servicio-lavado'], flujo: 'servicios-flujo', flujoLabel: 'Cotización → carrito', movil: 'Servicios en 375', movilLabel: 'Landing 375px · sin overflow' },
  institucional: { label: 'Institucional / Contenido', desc: 'Contacto, FAQ, distribuidores, legales + contenido editorial: Nosotros, Blog, Recursos', lock: false, responde: true,  files: ['1-contacto', '1-faq', '1-distribuidores', '1-legales', '1-contenido'], flujo: 'institucional-flujo', flujoLabel: 'Contacto valida submit', movil: 'Institucional en 375', movilLabel: 'Contacto 375px · sin overflow' },
  compra:        { label: 'Compra (carrito → pago)', desc: 'La ruta del dinero: carrito → checkout → pago + post-venta (seguimiento anónimo). Genera orden real, QA-only', lock: true,  responde: true,  files: ['2-cart-empty', '2-money-path', '2-seguimiento'], auth: true, flujo: 'purchase',    flujoLabel: 'Compra E2E → nº de orden', movil: 'Compra en 375', movilLabel: 'Carrito 375px · sin overflow' },
  cuenta:        { label: 'Mi cuenta',               desc: 'Acceso y área de cliente: login, registro y /customer (datos, pedidos, direcciones)', lock: true,  responde: true,  files: ['2-customer', '2-pci-baseline', '1-forms'], auth: true, flujo: 'login-check', flujoLabel: 'Login → sesión', movil: 'Mi cuenta en 375', movilLabel: 'Customer 375px @auth · sin overflow' },
};
const AREA_ORDER = ['cascaron', 'home', 'pdp', 'servicios', 'institucional', 'compra', 'cuenta'];
const areaSpecPath = (f) => `tests/${f}.contract.spec.js`;

// ─── ALLOWLIST de acciones que abren proceso ─────────────────────────────────
const ACTIONS = {
  'crear-orden':    { kind: 'node', argv: ['scripts/crear-orden-b2c.js'], usesBrowser: true, usesOrderOpts: true, label: 'Crear orden B2C' },
  'capa2-auto':     { kind: 'node', argv: ['scripts/capa2-run.js'],       usesBrowser: true, label: 'Pipeline Capa 2 (auto)' },
  // Lectura por área (Responde = 200 + render, recortado por DASH_AREA).
  'area-responde':  { kind: 'pw', grep: ['--grep', '@health|@content'], usesBrowser: true, needsArea: true, label: 'Responde (200 + render) por área' },
  // Estructura por área (DOM contracts de los specs del área).
  'area':           { kind: 'pw', needsArea: true, usesBrowser: true, label: 'Estructura crítica por área' },
  // Móvil 375px por área (tests @mobile de `5-mobile`, recortados por el patrón AREAS[area].movil).
  'area-movil':     { kind: 'pw', needsArea: true, usesBrowser: true, label: 'Móvil 375px por área' },
  // Flujos mutantes (efecto real) — QA-only.
  'purchase':       { kind: 'pw', grep: ['--grep', '@purchase'], usesBrowser: true, label: 'Compra E2E → nº de orden (QA)' },
  'login-check':    { kind: 'pw', grep: ['--grep', '@login'],    usesBrowser: true, label: 'Login → sesión (QA)' },
  'forms-email':    { kind: 'pw', grep: ['--grep', '@email'],    usesBrowser: true, label: 'Forms + correo (forgot reset)' },
  // Calidad transversal (site-wide): excepciones JS no capturadas + 404/catchall.
  'xcut':           { kind: 'pw', grep: ['--grep', '@xcut'],     usesBrowser: true, label: 'Errores y enlaces (transversal)' },
  // Calidad transversal · Performance: Lighthouse / Core Web Vitals (Home, PDP). Lento (~1 min).
  'perf':           { kind: 'pw', grep: ['--grep', '@perf'],     usesBrowser: true, label: 'Performance (Lighthouse)' },
  // Calidad transversal · Centinelas de bloqueos externos (vigilan que sigan rotos;
  // se ponen verdes solos al arreglarse). Ver 9-centinelas.
  'bloqueos':       { kind: 'pw', grep: ['--grep', '@bloqueo'],  usesBrowser: true, label: 'Bloqueos externos (centinelas)' },
  // Flujo N1 de Catálogo/PDP (lectura, no muta): galería · acordeones · compra por CP.
  'pdp-flujo':      { kind: 'pw', grep: ['--grep', '@flujo'],    usesBrowser: true, label: 'Catálogo/PDP a fondo (N1)' },
  // Flujos de área (lectura, no mutan) — tags POR ÁREA (sin substring "@flujo" para no mezclar).
  'header-flujo':        { kind: 'pw', grep: ['--grep', '@flheader'], usesBrowser: true, label: 'Header — buscador → SRP' },
  'home-flujo':          { kind: 'pw', grep: ['--grep', '@flhome'],   usesBrowser: true, label: 'Home — selector de soluciones' },
  'institucional-flujo': { kind: 'pw', grep: ['--grep', '@flinst'],   usesBrowser: true, label: 'Institucional — contacto valida' },
  'servicios-flujo':     { kind: 'pw', grep: ['--grep', '@flserv'],   usesBrowser: true, label: 'Servicios — cotización → carrito' },
  // Lectura global (atajo): todo lo no-mutante. La acción maestra del panel
  // secuencia por celda; esta queda como respaldo de "una sola corrida".
  'check-all':      { kind: 'pw', grep: ['--grep-invert', '@capa2|@smoke|@perf'], usesBrowser: true, label: 'Revisar sitio (lectura)' },
  // Utilidades.
  'check-imap':     { kind: 'node', argv: ['scripts/check-imap.js'], label: 'Verificar IMAP' },
  'gen-auth-b2c':   { kind: 'node', argv: ['setup-auth-b2c.js'], usesBrowser: true, label: 'Generar sesión B2C (login)' },
  'order-status':   { kind: 'node', argv: ['scripts/ct-api.js', '--b2c'],          needsOrder: true, label: 'Ver estado de orden' },
  'order-payments': { kind: 'node', argv: ['scripts/ct-api.js', '--b2c-payment'],  needsOrder: true, label: 'Ver pagos de orden' },
  'order-messages': { kind: 'node', argv: ['scripts/ct-api.js', '--b2c-messages'], needsOrder: true, label: 'Ver historial de orden' },
  'move-state':     { kind: 'node', argv: ['scripts/ct-api.js'], needsOrder: true, needsState: true, label: 'Mover estado de orden' },
  // Auto-actualización del panel: git pull → npm install (dos pasos).
  'self-update':    { kind: 'update', label: 'Actualizar panel' },
};

const isOrder = (s) => typeof s === 'string' && /^[A-Za-z0-9]{5,24}$/.test(s);
const imapMode = () => (process.env.GMAIL_IMAP_USER && process.env.GMAIL_IMAP_PASS ? 'B' : 'A');
const ORDER_TIPOS = ['fisico', 'servicio'];
const ORDER_PAGOS = ['credito', 'debito', 'transferencia', 'efectivo'];

// ─── Construye el comando para una acción ────────────────────────────────────
function buildCommand(action, { order, stateValue, headed, tipo, pago, area, env }) {
  const a = ACTIONS[action];
  if (!a) throw new Error(`acción no permitida: ${action}`);

  const target = env === 'prod' ? 'prod' : 'qa';
  if (target === 'prod' && PROD_BLOCKED.has(action)) {
    throw new Error('bloqueada en PRODUCCIÓN: muta datos reales. Solo disponible en QA.');
  }
  const base = envBase(target);
  const penv = { ...process.env, B2C_BASE_URL: base, HEADED: a.usesBrowser && headed ? '1' : '0' };

  if (a.usesOrderOpts) {
    penv.CAPA2_TIPO = ORDER_TIPOS.includes(tipo) ? tipo : 'fisico';
    penv.CAPA2_PAGO = ORDER_PAGOS.includes(pago) ? pago : 'credito';
  }
  // El área se valida SIEMPRE contra AREAS (nunca rutas arbitrarias).
  if (a.needsArea) {
    if (!AREAS[area]) throw new Error('área inválida');
    penv.DASH_AREA = area; // los specs @health/@content filtran HEALTH_URLS por esto
  }

  if (a.kind === 'node') {
    const argv = [...a.argv];
    if (a.needsOrder && !isOrder(order)) throw new Error('número de orden inválido');
    if (action === 'move-state') {
      const m = STATE_MAP[stateValue];
      if (!m) throw new Error('estado inválido');
      argv.push(m.flag, order, m.state);
    } else if (a.needsOrder) {
      argv.push(order);
    }
    return { cmd: 'node', args: argv, env: penv, base, shell: false, pretty: `node ${argv.join(' ')}` };
  }

  if (a.kind === 'update') {
    // Dos pasos secuenciales: git pull para bajar cambios, npm install para instalar.
    // El segundo solo se ejecuta si el primero sale con código 0.
    return {
      chain: [
        { cmd: 'git', args: ['pull'], label: 'Paso 1/2: Bajando última versión (git pull)…' },
        { cmd: 'npm', args: ['install'], label: 'Paso 2/2: Instalando dependencias (npm install)…' },
      ],
      env: penv, base, shell: false,
      pretty: 'git pull → npm install  (auto-actualización)',
    };
  }

  // Playwright. Reporter propio (@@DASH) para la lista en vivo + `list` para el log.
  // DASH_EVIDENCE activa el hook afterEach de _helpers → captura organizada en
  // evidencias/panel/<area>/. Solo en corridas del panel (CLI no paga el costo).
  penv.DASH_EVIDENCE = '1';
  const args = ['playwright', 'test', '--project=b2c-contracts',
    '--reporter=./scripts/dash-reporter.js,list'];
  // Cita el valor si tiene metacaracteres de shell O espacios (shell:true parte por espacios).
  const q = (v) => (/[|&()<>^ ]/.test(v) ? `"${v}"` : v);
  if (action === 'area') {
    // Estructura: filtra por archivo(s) del área + solo @contract dentro de ellos.
    AREAS[area].files.forEach((f) => args.push(areaSpecPath(f)));
    args.push('--grep', '@contract');
  } else if (action === 'area-movil') {
    // Móvil: corre SOLO el spec 5-mobile, recortado a los tests del área por título.
    const pat = AREAS[area].movil;
    if (!pat) throw new Error('área sin cobertura móvil');
    args.push(areaSpecPath('5-mobile'));
    args.push('--grep', q(pat));
  } else if (action === 'area-responde') {
    // Responde: @health|@content; el filtrado por área lo hace DASH_AREA en el spec.
    a.grep.forEach((v) => args.push(q(v)));
  } else {
    a.grep.forEach((v) => args.push(q(v)));
  }
  if (a.usesBrowser && headed) args.push('--headed');
  return { cmd: 'npx', args, env: penv, base, shell: true, pretty: `npx ${args.join(' ')}` };
}

// ─── SSE: corre el comando y transmite su salida línea por línea ──────────────
// Soporta `built.chain`: array de {cmd, args, label} que se ejecutan en secuencia;
// cada paso solo arranca si el anterior terminó con código 0.
function streamRun(req, res, params) {
  let built;
  try { built = buildCommand(params.action, params); }
  catch (e) { res.writeHead(400); res.end(`error: ${e.message}`); return; }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive',
  });
  const send = (event, data) => res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  send('meta', { pretty: built.pretty, headed: params.headed, base: built.base });

  // Si hay chain, ejecutar pasos secuenciales.
  if (built.chain && built.chain.length) {
    let stepIdx = 0;
    let tail = '';
    let firstCode = 0;
    function runStep() {
      const step = built.chain[stepIdx];
      if (!step) {
        // Todos los pasos terminaron.
        const summary = { passed: firstCode === 0 ? 1 : 0, failed: firstCode !== 0 ? 1 : 0, skipped: 0 };
        send('done', { code: firstCode, summary });
        res.end();
        return;
      }
      send('line', { stream: 'out', text: step.label });
      const child = spawn(step.cmd, step.args, { cwd: ROOT, env: built.env, shell: built.shell || false });
      let buf = { out: '', err: '' };
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
        if (code !== 0) {
          // Falló este paso: no seguir.
          if (firstCode === 0) firstCode = code;
          const summary = { passed: 0, failed: 1, skipped: 0 };
          send('done', { code: firstCode, summary });
          res.end();
          return;
        }
        stepIdx++;
        runStep();
      });
      child.on('error', (e) => {
        send('line', { stream: 'err', text: `error al ejecutar: ${e.message}` });
        if (firstCode === 0) firstCode = 1;
        const summary = { passed: 0, failed: 1, skipped: 0 };
        send('done', { code: firstCode, summary });
        res.end();
      });
      req.on('close', () => { try { child.kill(); } catch (_) {} });
    }
    runStep();
    return;
  }

  const child = spawn(built.cmd, built.args, { cwd: ROOT, env: built.env, shell: built.shell });
  let buf = { out: '', err: '' };
  let tail = '';
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
    const n = (re) => { const m = tail.match(re); return m ? Number(m[1]) : 0; };
    const summary = { passed: n(/(\d+) passed/), failed: n(/(\d+) failed/), skipped: n(/(\d+) skipped/), flaky: n(/(\d+) flaky/) };
    send('done', { code, summary });
    res.end();
  });
  child.on('error', (e) => { send('line', { stream: 'err', text: `spawn error: ${e.message}` }); send('done', { code: 1 }); res.end(); });
  req.on('close', () => { try { child.kill(); } catch (_) {} });
}

// ─── IMAP: lista correos de ventasecom (solo Modo B) ─────────────────────────
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

// ─── Prerequisitos (tira semáforo) ───────────────────────────────────────────
function siteReachable(base) {
  // "Alcanzable" = DNS + TCP + TLS responden. Cualquier statusCode (incluso 4xx/5xx
  // transitorio del sitio) cuenta como alcanzable; solo un error de conexión/timeout
  // lo marca caído. GET (no HEAD) porque algunos edges rechazan HEAD con un 403/405
  // que daría falso-rojo. UA de navegador para no toparse con bloqueos de bots.
  return new Promise((resolve) => {
    let lib, u;
    try { u = new URL(base); } catch { return resolve(false); }
    lib = u.protocol === 'http:' ? require('http') : require('https');
    const r = lib.request({ method: 'GET', host: u.hostname, path: '/', timeout: 7000,
      headers: { 'User-Agent': 'Mozilla/5.0 (panel-qa healthcheck)' } }, (resp) => {
      resolve(resp.statusCode > 0); resp.resume();
    });
    r.on('error', () => resolve(false));
    r.on('timeout', () => { r.destroy(); resolve(false); });
    r.end();
  });
}
async function prereq(env) {
  const base = envBase(env === 'prod' ? 'prod' : 'qa');
  const authB2c = fs.existsSync(path.join(ROOT, 'rotoplas-auth-b2c.json'));
  const ct = !!(process.env.CT_CLIENT_ID && process.env.CT_CLIENT_SECRET && process.env.CT_PROJECT_KEY);
  const site = await siteReachable(base);
  return { authB2c, imap: imapMode() === 'B', ct, site, base };
}

// ─── Evidencias (galería de la última revisión del panel) ────────────────────
// Scope: SOLO evidencias/panel/<area>/ (lo que captura el hook de _helpers), NO el
// evidencias/ plano (capturas manuales de sesiones). Así la galería = última corrida.
const EVID_DIR = path.join(ROOT, 'evidencias');
const EVID_PANEL = path.join(EVID_DIR, 'panel');
function listEvidencias() {
  const out = [];
  try {
    const areas = fs.readdirSync(EVID_PANEL, { withFileTypes: true }).filter((d) => d.isDirectory());
    for (const a of areas) {
      const adir = path.join(EVID_PANEL, a.name);
      for (const f of fs.readdirSync(adir)) {
        if (!/\.(png|jpe?g)$/i.test(f)) continue;
        out.push({ area: a.name, name: f, rel: a.name + '/' + f, mtime: fs.statSync(path.join(adir, f)).mtimeMs });
      }
    }
  } catch (_) { /* aún sin evidencias */ }
  return out.sort((a, b) => b.mtime - a.mtime).slice(0, 120);
}

// ─── HTTP server ──────────────────────────────────────────────────────────────
// BOOT_ID identifica ESTA instancia del server. El cliente lo escucha por SSE
// (/live): si cambia, es que el server reinició (nuevo código) → recarga sola la
// página. Así editar dashboard.js o pulsar Actualizar/Reiniciar refresca el panel
// sin tocar la terminal ni F5 a mano.
const BOOT_ID = String(Date.now());

const server = http.createServer(async (req, res) => {
  const u = new URL(req.url, `http://${HOST}:${PORT}`);

  if (u.pathname === '/') { res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); res.end(PAGE); return; }

  // Live-reload: SSE que emite el BOOT_ID y un latido. Al reiniciar el server la
  // conexión cae, el navegador reconecta, recibe un BOOT_ID distinto y recarga.
  if (u.pathname === '/live') {
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
    res.write('retry: 1000\n');
    res.write(`data: ${BOOT_ID}\n\n`);
    const hb = setInterval(() => { try { res.write(': hb\n\n'); } catch (_) { /* cerrado */ } }, 20000);
    req.on('close', () => clearInterval(hb));
    return;
  }

  // Reinicio controlado: re-lanza el mismo proceso (detached) y sale. El relevo
  // reintenta el bind hasta que se libera el puerto (ver handler EADDRINUSE).
  if (u.pathname === '/restart' && req.method === 'POST') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end('{"ok":true}');
    console.log('\n  ↻ Reiniciando el panel…\n');
    setTimeout(() => {
      try {
        const child = spawn(process.execPath, process.argv.slice(1),
          { cwd: process.cwd(), env: { ...process.env, DASH_CHILD: '1' }, detached: true, stdio: 'inherit' });
        child.unref();
      } catch (e) { console.error(`  ✗ No se pudo relanzar: ${e.message}`); }
      server.close(() => process.exit(0));
      setTimeout(() => process.exit(0), 1200);
    }, 200);
    return;
  }

  if (u.pathname === '/config') {
    const envValues = {};
    ENV_ALLOW.forEach((k) => { envValues[k] = process.env[k] || ''; });
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      base: BASE_QA, imapMode: imapMode(), healthCount: HEALTH_COUNT,
      envs: Object.entries(ENVS).map(([k, v]) => ({ key: k, label: v.label, base: v.base })),
      prodBlocked: [...PROD_BLOCKED],
      envFields: ENV_FIELDS, envValues,
      areas: AREA_ORDER.map((k) => ({
        key: k, label: AREAS[k].label, desc: AREAS[k].desc || null, lock: !!AREAS[k].lock, auth: !!AREAS[k].auth,
        responde: !!AREAS[k].responde, respondeCount: respondeCount(k),
        // URLs que cubre la dimensión "Responde" del área (nombre + ruta) → el panel
        // las lista en el detalle colapsable, para saber QUÉ se prueba antes de correr.
        respondeUrls: HEALTH_URLS.filter((u) => u.area === k).map((u) => {
          let p = u.url; try { p = new URL(u.url).pathname; } catch (_) { /* deja la url */ }
          return { nombre: u.nombre, path: p };
        }),
        files: AREAS[k].files, flujo: AREAS[k].flujo || null, flujoLabel: AREAS[k].flujoLabel || null,
        movil: AREAS[k].movil || null, movilLabel: AREAS[k].movilLabel || null,
      })),
      states: Object.entries(STATE_MAP).map(([v, m]) => ({ value: v, label: m.label })),
    }));
    return;
  }

  if (u.pathname === '/config/save' && req.method === 'POST') {
    let body = '';
    req.on('data', (c) => { body += c; if (body.length > 1e6) req.destroy(); });
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

  if (u.pathname === '/prereq') {
    const data = await prereq(u.searchParams.get('env') || 'qa');
    res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(data)); return;
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
    res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(data)); return;
  }

  if (u.pathname === '/evidencias') {
    res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ files: listEvidencias() })); return;
  }
  if (u.pathname.startsWith('/evidencia/')) {
    // Sirve un PNG de evidencias/panel/<area>/<file> (anti path-traversal: cada
    // segmento pasa por basename → no se puede escapar de EVID_PANEL).
    const rel = decodeURIComponent(u.pathname.slice('/evidencia/'.length));
    const parts = rel.split('/').map((p) => path.basename(p)).filter(Boolean);
    const fp = path.join(EVID_PANEL, ...parts);
    if (!fp.startsWith(EVID_PANEL) || !fs.existsSync(fp) || fs.statSync(fp).isDirectory()) { res.writeHead(404); res.end('not found'); return; }
    const type = /\.png$/i.test(fp) ? 'image/png' : 'image/jpeg';
    res.writeHead(200, { 'Content-Type': type }); fs.createReadStream(fp).pipe(res); return;
  }
  if (u.pathname === '/report') {
    const rep = path.join(ROOT, 'playwright-report', 'index.html');
    if (!fs.existsSync(rep)) { res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' }); res.end('<p>Aún no hay reporte HTML. Corre una verificación primero.</p>'); return; }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); fs.createReadStream(rep).pipe(res); return;
  }

  res.writeHead(404); res.end('not found');
});

// Libera el puerto matando a quien lo retenga (una instancia ANTERIOR del panel,
// típicamente un proceso zombie de una corrida pasada). Windows: netstat + taskkill;
// POSIX: lsof + kill. Es seguro: en este punto aún no escuchamos, así que el dueño
// del puerto es SIEMPRE otro proceso, nunca nosotros.
function freePort(port) {
  return new Promise((resolve) => {
    const done = () => setTimeout(resolve, 500);
    if (process.platform === 'win32') {
      exec('netstat -ano', (err, out) => {
        if (err) return resolve();
        const pids = new Set();
        (out || '').split('\n').forEach((line) => {
          const m = line.match(/:(\d+)\s+\S+\s+LISTENING\s+(\d+)/i);
          if (m && m[1] === String(port)) pids.add(m[2]);
        });
        if (!pids.size) return resolve();
        let n = pids.size;
        pids.forEach((pid) => exec(`taskkill /F /PID ${pid}`, () => { if (--n === 0) done(); }));
      });
    } else {
      exec(`lsof -ti tcp:${port}`, (err, out) => {
        const pids = (out || '').trim().split('\n').filter(Boolean);
        if (!pids.length) return resolve();
        exec(`kill -9 ${pids.join(' ')}`, done);
      });
    }
  });
}

// Arranque "siempre gana": si el puerto está ocupado, reemplaza la instancia vieja
// (la mata y vuelve a enlazar) en vez de rendirse. Así `npm run dashboard` siempre
// te da el panel ACTUAL, nunca el viejo. El reintento de bind cubre el handoff de
// /restart, donde el proceso saliente suelta el puerto en unos ms.
let takeoverTried = false, bindTries = 0;
server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    if (!takeoverTried) {
      takeoverTried = true;
      console.log(`\n  ↻ El puerto ${PORT} estaba ocupado por una instancia anterior — reemplazándola…\n`);
      freePort(PORT).then(() => server.listen(PORT, HOST));
      return;
    }
    if (bindTries < 15) { bindTries++; setTimeout(() => server.listen(PORT, HOST), 400); return; }
    console.error(`\n  ✗ El puerto ${PORT} sigue ocupado y no se pudo liberar.`);
    console.error(`    Usa otro puerto:  DASH_PORT=4600 npm run dashboard\n`);
    process.exit(1);
  }
  console.error(`\n  ✗ Error del server: ${e.message}\n`);
  process.exit(1);
});

server.listen(PORT, HOST, () => {
  console.log(`\n  Panel QA B2C  →  http://${HOST}:${PORT}`);
  console.log(`  Ambiente: QA (${BASE_QA})  ·  IMAP: Modo ${imapMode()}\n`);
  // Abre el navegador en el PRIMER arranque (no en reinicios: la pestaña ya abierta
  // se recarga sola por live-reload). Opt-out con DASH_NO_OPEN=1.
  if (!process.env.DASH_CHILD && !process.env.DASH_NO_OPEN) {
    const url = `http://${HOST}:${PORT}`;
    const [cmd, args] = process.platform === 'win32' ? ['cmd', ['/c', 'start', '', url]]
      : process.platform === 'darwin' ? ['open', [url]] : ['xdg-open', [url]];
    try { spawn(cmd, args, { detached: true, stdio: 'ignore' }).unref(); } catch (_) { /* sin navegador: no pasa nada */ }
  }
});

// ─── Página (HTML+CSS+JS inline) ─────────────────────────────────────────────
// NOTA: template literal. NO usar backticks ni ${} adentro (se interpolarían al
// cargar el módulo). El JS de cliente usa concatenación '+'. Los backslash de
// regex van DOBLES (\\d, \\b…) → la cadena resultante lleva uno solo.
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
   --pend:#7a6fb0; --pendbg:#f1eefb; --pendln:#ddd4f2;
   --idle:#a8bccd;
   --sh:0 1px 2px rgba(10,41,66,.04), 0 8px 24px rgba(10,41,66,.06);
   --shp:0 10px 24px rgba(0,121,179,.28);
 }
 *{box-sizing:border-box}
 html,body{margin:0}
 body{font:15px/1.55 'IBM Plex Sans',-apple-system,Segoe UI,sans-serif;color:var(--ink);background:var(--bg);
   background-image:radial-gradient(900px 420px at 78% -160px,rgba(0,159,227,.16),transparent 62%),
     radial-gradient(700px 360px at 8% -120px,rgba(0,159,227,.08),transparent 60%),
     radial-gradient(circle at center,rgba(10,41,66,.045) 1px,transparent 1.4px);
   background-size:auto,auto,22px 22px;background-attachment:fixed;min-height:100vh;-webkit-font-smoothing:antialiased}
 h1,h2,h3{font-family:'Archivo',sans-serif;letter-spacing:-.01em;margin:0}

 /* Barra superior */
 header{position:sticky;top:0;z-index:20;display:flex;align-items:center;gap:14px;padding:13px 26px;
   background:rgba(255,255,255,.82);backdrop-filter:blur(12px);border-bottom:1px solid var(--line)}
 .brand{display:flex;align-items:center;gap:11px}
 .mark{width:34px;height:34px;border-radius:10px;display:grid;place-items:center;color:#fff;
   background:linear-gradient(135deg,var(--rot),var(--rotd));box-shadow:var(--shp)}
 .mark svg{width:20px;height:20px}
 .brand .t{display:block;font-family:'Archivo',sans-serif;font-weight:700;font-size:16px;color:var(--ink);line-height:1.15}
 .brand .t b{color:var(--rotd)}
 .brand .s{display:block;margin-top:2px;font-size:11.5px;color:var(--mut);letter-spacing:.02em}
 .sp{flex:1}
 .envsel{display:inline-flex;align-items:center;gap:7px;padding:4px 9px 4px 11px;border-radius:999px;
   background:#e3f1fb;border:1px solid #cbe6f7;transition:background .18s,border-color .18s}
 .envsel .led{width:7px;height:7px;border-radius:50%;background:var(--rot);box-shadow:0 0 0 3px rgba(0,159,227,.18);flex:none}
 .envsel select{font:600 11.5px 'IBM Plex Sans',sans-serif;letter-spacing:.04em;text-transform:uppercase;
   color:var(--rotd);background:transparent;border:0;cursor:pointer;outline:none}
 body.env-prod .envsel{background:var(--errbg);border-color:var(--errln)}
 body.env-prod .envsel .led{background:var(--err);box-shadow:0 0 0 3px rgba(216,50,50,.18);animation:pulse 1.2s infinite}
 body.env-prod .envsel select{color:var(--err)}
 .toggle{display:flex;align-items:center;gap:9px;font-size:12.5px;color:var(--ink2);cursor:pointer;user-select:none;font-weight:500}
 .toggle input{position:absolute;opacity:0;pointer-events:none}
 .track{width:40px;height:23px;border-radius:999px;background:#c8d7e3;position:relative;transition:.2s;flex:none}
 .track::after{content:"";position:absolute;top:3px;left:3px;width:17px;height:17px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.25);transition:.2s}
 .toggle input:checked + .track{background:linear-gradient(135deg,var(--rot),var(--rotd))}
 .toggle input:checked + .track::after{transform:translateX(17px)}
 .iconbtn{width:36px;height:36px;border-radius:10px;border:1px solid var(--line);background:#fff;color:var(--ink2);
   display:grid;place-items:center;cursor:pointer;transition:.14s}
 .iconbtn:hover{border-color:#bfe0f4;color:var(--rotd);background:#f5fbff}
 .iconbtn svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
 .iconbtn.spin svg{animation:spin .7s linear infinite}

 .prodwarn{display:flex;align-items:center;gap:9px;justify-content:center;padding:9px 26px;font-size:13px;font-weight:600;
   color:#7f1d1d;background:var(--errbg);border-bottom:1px solid var(--errln)}
 .prodwarn[hidden]{display:none}
 .prodwarn b{font-weight:800}

 /* Tira de prerequisitos (semáforo) */
 .prereq{display:flex;flex-wrap:wrap;gap:8px;align-items:center;justify-content:center;padding:9px 26px;
   background:rgba(255,255,255,.6);border-bottom:1px solid var(--line)}
 .pq{display:inline-flex;align-items:center;gap:7px;font-size:12px;font-weight:500;color:var(--ink2);
   padding:4px 11px;border-radius:999px;background:#fff;border:1px solid var(--line)}
 .pq .d{width:8px;height:8px;border-radius:50%;background:var(--idle);flex:none}
 .pq.ok .d{background:var(--ok)} .pq.bad .d{background:var(--err)} .pq.warn .d{background:var(--warn)}
 .pq.bad{border-color:var(--errln);background:var(--errbg);color:#7f1d1d}
 .pq.warn{border-color:var(--warnln);background:var(--warnbg);color:var(--warn)}
 .pq.ok{border-color:var(--okln)}
 .pq button{margin-left:3px;font:600 11px 'IBM Plex Sans',sans-serif;color:var(--rotd);background:transparent;border:0;cursor:pointer;text-decoration:underline}

 /* Livebar sticky */
 .livebar{position:sticky;top:60px;z-index:18;display:flex;align-items:center;gap:13px;padding:9px 26px;
   background:rgba(255,255,255,.95);backdrop-filter:blur(12px);border-bottom:1px solid var(--line);box-shadow:0 6px 16px rgba(10,41,66,.06);animation:lbin .3s ease}
 @keyframes lbin{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}
 .livebar[hidden]{display:none}
 .livebar .lb-spin{width:16px;height:16px;flex:none;border-radius:50%;border:2.5px solid #bfe0f4;border-top-color:var(--rot);animation:spin .7s linear infinite}
 .livebar.is-ok .lb-spin,.livebar.is-err .lb-spin,.livebar.is-skip .lb-spin{animation:none;border:0;display:grid;place-items:center;font-weight:800;font-size:15px}
 .livebar.is-ok .lb-spin{color:var(--ok)} .livebar.is-err .lb-spin{color:var(--err)} .livebar.is-skip .lb-spin{color:var(--warn)}
 .livebar .lb-now{font-weight:600;font-size:13.5px;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:40vw}
 .livebar .lb-prog{font:600 12px 'IBM Plex Mono',monospace;color:var(--rotd);background:#e3f1fb;border:1px solid #cbe6f7;border-radius:999px;padding:2px 10px;white-space:nowrap;flex:none}
 .livebar .lb-counts{font:600 12px 'IBM Plex Mono',monospace;color:var(--mut);white-space:nowrap;flex:none}
 .livebar.is-ok .lb-counts{color:var(--ok)} .livebar.is-err .lb-counts{color:var(--err)} .livebar.is-skip .lb-counts{color:var(--warn)}
 .livebar .lb-jump{margin-left:auto;flex:none;font:600 12px 'IBM Plex Sans',sans-serif;color:var(--rotd);background:#fff;border:1px solid #bfe0f4;border-radius:8px;padding:5px 11px;cursor:pointer;transition:.14s;white-space:nowrap}
 .livebar .lb-jump:hover{background:var(--rot);color:#fff;border-color:var(--rot)}
 .livebar .lb-cancel{flex:none;font:600 12px 'IBM Plex Sans',sans-serif;color:var(--err);background:#fff;border:1px solid #f0c2c2;border-radius:8px;padding:5px 11px;cursor:pointer;transition:.14s;white-space:nowrap}
 .livebar .lb-cancel:hover{background:var(--err);color:#fff;border-color:var(--err)}

 main{max-width:1140px;margin:0 auto;padding:24px 26px 60px}
 /* Cada sección es una TARJETA propia → colapsada se ve como una fila-tarjeta limpia
    (no texto pelón). Conserva la identidad de las tarjetas de Salud/Cobertura. */
 section.block{margin-top:14px;background:var(--panel);border:1px solid var(--line);border-radius:16px;box-shadow:var(--sh);padding:0 18px;overflow:hidden;
   opacity:0;transform:translateY(8px);animation:rise .45s ease forwards}
 section.block:nth-of-type(1){animation-delay:.04s}
 .block-h{display:flex;align-items:center;gap:13px;padding:16px 0;margin:0;cursor:pointer;user-select:none}
 .block .cic{width:38px;height:38px;border-radius:11px;flex:none;display:grid;place-items:center;background:#e3f1fb;color:var(--rotd);border:1px solid #cbe6f7;transition:.16s}
 .block .cic svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
 .block-h:hover .cic{background:var(--rot);color:#fff;border-color:var(--rot)}
 .block-h h2{font-size:16.5px;font-weight:700;color:var(--ink)}
 .block-h .hint{font-size:12.5px;color:var(--mut);font-weight:500;flex:1}
 .block-chev{flex:none;width:26px;height:26px;display:grid;place-items:center;border-radius:8px;color:var(--mut);transition:transform .22s,background .14s}
 .block-h:hover .block-chev{background:var(--line2);color:var(--rotd)}
 .block-chev svg{width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:2.4;stroke-linecap:round;stroke-linejoin:round}
 .block.collapsed .block-chev{transform:rotate(-90deg)}
 .block.collapsed > *:not(.block-h){display:none!important}
 .block:not(.collapsed){padding-bottom:18px}

 /* Acción maestra */
 .master{background:var(--panel);border:1px solid var(--line);border-radius:18px;box-shadow:var(--sh);padding:22px 24px;
   display:flex;align-items:center;gap:22px;position:relative;overflow:hidden}
 .master::before{content:"";position:absolute;left:0;top:0;bottom:0;width:5px;background:var(--rot);transition:.3s}
 .master.is-ok::before{background:var(--ok)} .master.is-err::before{background:var(--err)} .master.is-skip::before{background:var(--warn)}
 .master .mtxt{flex:1;min-width:0}
 .master h1{font-size:22px;font-weight:800;color:var(--ink);display:flex;align-items:center;gap:11px}
 .master .msub{margin:6px 0 0;color:var(--mut);font-size:13.5px}
 .statetag{font-family:'IBM Plex Mono',monospace;font-size:11px;font-weight:500;text-transform:uppercase;letter-spacing:.06em;
   padding:3px 9px;border-radius:7px;background:var(--line2);color:var(--mut);border:1px solid var(--line)}
 .master.is-ok .statetag{background:var(--okbg);color:var(--ok);border-color:var(--okln)}
 .master.is-err .statetag{background:var(--errbg);color:var(--err);border-color:var(--errln)}
 .master.is-skip .statetag{background:var(--warnbg);color:var(--warn);border-color:var(--warnln)}
 .master.is-run .statetag{background:#e3f1fb;color:var(--rotd);border-color:#cbe6f7}

 .btn-primary{font:600 15px 'IBM Plex Sans',sans-serif;color:#fff;cursor:pointer;border:0;
   background:linear-gradient(135deg,var(--rot),var(--rotd));padding:13px 22px;border-radius:13px;box-shadow:var(--shp);
   display:inline-flex;align-items:center;gap:10px;white-space:nowrap;transition:transform .14s,box-shadow .14s}
 .btn-primary:hover{transform:translateY(-2px);box-shadow:0 14px 30px rgba(0,121,179,.36)}
 .btn-primary:active{transform:translateY(0)}
 .btn-primary svg{width:16px;height:16px;fill:currentColor}
 .btn-primary.wide{width:100%;justify-content:center;padding:14px}
 .btn-sec{font:600 13px 'IBM Plex Sans',sans-serif;color:var(--rotd);cursor:pointer;background:#fff;border:1px solid #bfe0f4;
   padding:9px 14px;border-radius:10px;display:inline-flex;align-items:center;gap:8px;transition:.14s;white-space:nowrap}
 .btn-sec:hover{background:var(--rot);color:#fff;border-color:var(--rot)}
 .btn-sec svg{width:13px;height:13px;fill:currentColor}
 button[disabled]{opacity:.5;cursor:not-allowed;pointer-events:none}
 button:focus-visible{outline:2px solid var(--rot);outline-offset:2px}

 /* Resumen global */
 .summary{display:flex;flex-wrap:wrap;gap:10px;margin-top:14px}
 .sumcard{flex:1;min-width:220px;background:var(--panel);border:1px solid var(--line);border-radius:14px;box-shadow:var(--sh);padding:14px 17px}
 .sumcard .lbl{font-size:11.5px;text-transform:uppercase;letter-spacing:.05em;color:var(--mut);font-weight:700}
 .sumcard .big{margin-top:6px;display:flex;align-items:baseline;gap:12px;flex-wrap:wrap}
 .sumcard .big b{font:800 22px 'Archivo',sans-serif;color:var(--ink)}
 .chiprow{display:inline-flex;gap:8px;flex-wrap:wrap}
 .sc{display:inline-flex;align-items:center;gap:6px;font:600 13px 'IBM Plex Mono',monospace}
 .sc .d{width:9px;height:9px;border-radius:50%}
 .sc.ok{color:var(--ok)} .sc.ok .d{background:var(--ok)}
 .sc.err{color:var(--err)} .sc.err .d{background:var(--err)}
 .sc.skip{color:var(--warn)} .sc.skip .d{background:var(--warn)}
 .sc.pend{color:var(--pend)} .sc.pend .d{background:var(--pend)}

 /* Mapa por área */
 .maprow{background:#fbfdff;border:1px solid var(--line);border-radius:12px;margin-bottom:7px;overflow:hidden;transition:border-color .14s}
 .maprow:hover{border-color:#cfe3f2}
 .maprow-h{display:flex;align-items:center;gap:9px;padding:9px 13px;cursor:pointer;user-select:none}
 .maprow-h .mchev{flex:none;width:18px;height:18px;color:var(--mut);transition:transform .18s}
 .maprow-h .mchev svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:2.4;stroke-linecap:round;stroke-linejoin:round}
 .maprow.collapsed .mchev{transform:rotate(-90deg)}
 .maprow:hover .mchev{color:var(--rotd)}
 .maprow-h .anmwrap{display:flex;flex-direction:column;gap:1px;min-width:0}
 .maprow-h .anm{font-weight:700;font-size:13.5px;color:var(--ink);display:flex;align-items:center;gap:7px}
 .maprow-h .adesc{font-weight:400;font-size:11px;color:var(--mut);line-height:1.2}
 .maprow-h .lock{font-size:11px;opacity:.6}
 .maprow-h .sp{flex:1}
 .maprow.collapsed .cells,.maprow.collapsed .area-detail{display:none}
 /* Detalle: QUÉ prueba cada dimensión (URLs, specs) — visible al expandir */
 .area-detail{padding:2px 13px 12px;display:flex;flex-direction:column;gap:7px}
 .adblock{background:#fff;border:1px solid var(--line);border-radius:9px;padding:8px 11px}
 .adblock .adh{font-size:10px;text-transform:uppercase;letter-spacing:.05em;font-weight:700;color:var(--rotd);margin-bottom:4px;display:flex;align-items:center;gap:6px}
 .adblock .adh .adtag{font-size:9.5px;color:var(--mut);background:var(--line2);border:1px solid var(--line);border-radius:999px;padding:1px 6px;font-weight:600;letter-spacing:0;text-transform:none}
 .adblock .adbody{font-size:12px;color:var(--ink2);line-height:1.45}
 .adurls{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:2px}
 .adurls li{display:flex;gap:8px;align-items:baseline;font-size:12px}
 .adurls .un{color:var(--ink);font-weight:600;min-width:120px}
 .adurls .up{font-family:'IBM Plex Mono',monospace;font-size:11px;color:var(--mut)}
 .adblock.muted{opacity:.62}
 .cells{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;padding:0 13px 11px}
 @media(max-width:720px){.cells{grid-template-columns:repeat(2,1fr)}}
 .cell{display:flex;flex-direction:column;gap:4px;align-items:flex-start;text-align:left;padding:7px 9px;border:1px solid var(--line);
   border-radius:9px;background:#fbfdff;cursor:pointer;font:inherit;color:var(--ink2);transition:.13s;min-height:50px}
 .cell:hover{border-color:#bfe0f4;background:#f5fbff;transform:translateY(-1px)}
 .cell[disabled]{cursor:default;opacity:1}
 .cell[disabled]:hover{transform:none;background:#fbfdff;border-color:var(--line)}
 .cell .cdim{font-size:10px;text-transform:uppercase;letter-spacing:.04em;color:var(--mut);font-weight:700}
 .cell .cval{font-size:11.5px;color:var(--ink2);font-weight:500;line-height:1.3}
 .cell.is-run{border-color:#cbe6f7} .cell.is-ok{border-color:var(--okln)} .cell.is-err{border-color:var(--errln)}
 .cell.is-skip{border-color:var(--warnln)} .cell.is-pend{border-color:var(--pendln);background:var(--pendbg)}
 .cell.is-na{background:var(--line2);cursor:default;opacity:.7}
 .cell.is-na:hover{transform:none}
 .cell.is-flujolock{background:#fff7ef;border-color:#f1dcae}

 /* Pill (estado de celda) */
 .pill{font:600 10.5px 'IBM Plex Mono',monospace;display:inline-flex;align-items:center;gap:5px;padding:2px 8px;border-radius:999px;
   background:var(--line2);color:var(--mut);border:1px solid var(--line);white-space:nowrap}
 .pill .d{width:6px;height:6px;border-radius:50%;background:var(--idle);flex:none}
 .pill.is-run{background:#e3f1fb;color:var(--rotd);border-color:#cbe6f7} .pill.is-run .d{background:var(--rot);animation:pulse 1s infinite}
 .pill.is-ok{background:var(--okbg);color:var(--ok);border-color:var(--okln);animation:pop .32s ease} .pill.is-ok .d{background:var(--ok)}
 .pill.is-err{background:var(--errbg);color:var(--err);border-color:var(--errln);animation:pop .32s ease} .pill.is-err .d{background:var(--err)}
 .pill.is-skip{background:var(--warnbg);color:var(--warn);border-color:var(--warnln);animation:pop .32s ease} .pill.is-skip .d{background:var(--warn)}
 .pill.is-pend{background:var(--pendbg);color:var(--pend);border-color:var(--pendln)} .pill.is-pend .d{background:var(--pend)}
 @keyframes pulse{50%{opacity:.35}} @keyframes pop{0%{transform:scale(.8)}55%{transform:scale(1.08)}100%{transform:scale(1)}}
 @keyframes spin{to{transform:rotate(360deg)}}

 .bugline{margin:4px 2px 0;font-size:12.5px;color:var(--ink2);display:flex;align-items:center;gap:8px;flex-wrap:wrap}
 .bugline .b{font-weight:700;color:var(--rotd)}
 .bugline a{color:var(--rotd);text-decoration:none;font-weight:600} .bugline a:hover{text-decoration:underline}

 /* Panel de ejecución en vivo (compartido) */
 .live{margin-top:12px;border:1px solid var(--line);border-radius:13px;background:linear-gradient(180deg,#f6fbff,#fbfdff);padding:13px 15px;display:none}
 .live.show{display:block;animation:rise .35s ease}
 .live-now{display:flex;align-items:center;gap:11px}
 .live-spin{width:18px;height:18px;flex:none;border-radius:50%;border:2.5px solid #bfe0f4;border-top-color:var(--rot);animation:spin .7s linear infinite}
 .live.is-ok .live-spin,.live.is-err .live-spin,.live.is-skip .live-spin{animation:none;border:0;display:grid;place-items:center;font-weight:800}
 .live.is-ok .live-spin{color:var(--ok)} .live.is-err .live-spin{color:var(--err)} .live.is-skip .live-spin{color:var(--warn)}
 .live-txt{font-weight:600;font-size:14px;color:var(--ink)}
 .live-txt small{display:block;font-weight:400;font-size:12px;color:var(--mut);margin-top:1px}
 .live-time{margin-left:auto;font:600 12px 'IBM Plex Mono',monospace;color:var(--mut);background:var(--line2);border:1px solid var(--line);border-radius:7px;padding:3px 9px;white-space:nowrap}
 .live.is-ok .live-time{color:var(--ok);background:var(--okbg);border-color:var(--okln)}
 .live.is-err .live-time{color:var(--err);background:var(--errbg);border-color:var(--errln)}
 .live.is-skip .live-time{color:var(--warn);background:var(--warnbg);border-color:var(--warnln)}
 .lp{display:flex;align-items:center;gap:10px;margin-top:12px}
 .lp-track{flex:1;height:8px;border-radius:999px;background:#e1edf6;overflow:hidden;border:1px solid var(--line)}
 .lp-bar{height:100%;width:0;border-radius:999px;background:linear-gradient(90deg,var(--rot),var(--rotd));transition:width .35s ease}
 .live.is-ok .lp-bar{background:linear-gradient(90deg,#1fc878,var(--ok))} .live.is-err .lp-bar{background:linear-gradient(90deg,#f06a6a,var(--err))}
 .lp-num{font:600 12px 'IBM Plex Mono',monospace;color:var(--ink2);white-space:nowrap;min-width:46px;text-align:right}
 .lcounts{display:flex;gap:7px;margin-top:10px;flex-wrap:wrap}
 .lc{font:600 11.5px 'IBM Plex Mono',monospace;padding:3px 9px;border-radius:999px;border:1px solid var(--line);background:var(--line2);color:var(--mut)}
 .lc.on.lc-ok{background:var(--okbg);color:var(--ok);border-color:var(--okln)}
 .lc.on.lc-fail{background:var(--errbg);color:var(--err);border-color:var(--errln)}
 .lc.on.lc-skip{background:var(--warnbg);color:var(--warn);border-color:var(--warnln)}
 .tlist{list-style:none;margin:12px 0 0;padding:0;display:flex;flex-direction:column;gap:5px;max-height:300px;overflow:auto}
 .trow{display:flex;align-items:flex-start;gap:10px;padding:8px 11px;border:1px solid var(--line);border-radius:10px;background:#fbfdff;animation:rowin .28s ease}
 @keyframes rowin{from{opacity:0;transform:translateY(-3px)}to{opacity:1;transform:none}}
 .trow .tdot{width:9px;height:9px;border-radius:50%;flex:none;margin-top:5px;background:var(--idle)}
 .trow.is-ok .tdot{background:var(--ok)} .trow.is-fail .tdot{background:var(--err)} .trow.is-skip .tdot{background:var(--warn)}
 .trow.is-known .tdot{background:var(--rot)} .trow.is-fixed .tdot{background:var(--warn)} .trow.is-flaky .tdot{background:var(--warn)}
 .trow .tt{flex:1;min-width:0;font-size:13px;color:var(--ink2);line-height:1.4}
 .trow .tt .ts{display:block;font-size:11px;color:var(--mut);font-weight:600;margin-bottom:1px}
 .trow.is-fail .tt{color:var(--err)}
 .trow .tms{font:500 11px 'IBM Plex Mono',monospace;color:var(--mut);white-space:nowrap;margin-top:2px}
 .trow.has-err{cursor:pointer}
 .trow .treason{display:block;margin-top:4px;font-size:12.5px;line-height:1.5;font-weight:500;color:var(--mut)}
 .trow.is-fail .treason{color:#9a2222} .trow.is-known .treason{color:var(--ink2)} .trow.is-fixed .treason{color:var(--warn)} .trow.is-flaky .treason{color:var(--warn)}
 .trow.has-err .treason::after{content:" · ver detalle técnico ▾";color:var(--mut);font-weight:700}
 .trow.open.has-err .treason::after{content:" · ocultar detalle ▴"}
 .trow .terr{display:none;flex-basis:100%;margin:8px 0 1px;padding:9px 11px;border-radius:8px;background:var(--errbg);border:1px solid var(--errln)}
 .trow.open .terr{display:block}
 .terr-lbl{font:700 10.5px 'IBM Plex Sans',sans-serif;text-transform:uppercase;letter-spacing:.05em;color:#7f1d1d;margin-bottom:5px}
 .terr-raw{font:12px/1.5 'IBM Plex Mono',Menlo,Consolas,monospace;color:#9a2222;white-space:pre-wrap;word-break:break-word}
 .triage{margin-top:12px;border-radius:11px;padding:12px 14px;font-size:13px;border:1px solid var(--errln);background:var(--errbg)}
 .live.is-skip .triage{border-color:var(--warnln);background:var(--warnbg)}
 .triage .row{display:flex;gap:8px;margin-top:6px;line-height:1.5} .triage .row:first-child{margin-top:0}
 .triage .k{flex:none;font-weight:700;color:var(--ink2);width:104px} .triage .v{color:var(--ink2)} .triage .v b{color:var(--ink)}
 .triage .fail{font-family:'IBM Plex Mono',monospace;font-size:12px;color:var(--err)}
 .triage code{background:#fff;border:1px solid var(--line);border-radius:5px;padding:1px 5px;font-size:11.5px}
 .live-steps{list-style:none;margin:12px 0 0;padding:0;display:flex;flex-direction:column;gap:6px}
 .live-steps li{display:flex;align-items:center;gap:9px;font-size:12.5px;color:var(--mut);opacity:.55;transition:.2s}
 .live-steps li.done{opacity:1;color:var(--ink2)} .live-steps li.active{opacity:1;color:var(--rotd);font-weight:600}
 .live-steps .tick{width:16px;height:16px;flex:none;border-radius:50%;border:1.5px solid var(--line);display:grid;place-items:center;font-size:10px;color:transparent}
 .live-steps li.done .tick{background:var(--ok);border-color:var(--ok);color:#fff} .live-steps li.active .tick{border-color:var(--rot);color:var(--rot)}
 .detalle{margin-top:12px;font:500 12.5px 'IBM Plex Sans',sans-serif;color:var(--mut);cursor:pointer;background:none;border:0;padding:4px 0;display:inline-flex;align-items:center;gap:6px}
 .detalle:hover{color:var(--rotd)} .detalle .ar{transition:transform .2s} .detalle.open .ar{transform:rotate(180deg)}
 .log{margin:10px 0 0;background:#07223a;color:#cfe3f2;border-radius:12px;border:1px solid #0d3550;padding:13px 15px;max-height:260px;overflow:auto;
   font:12.5px/1.65 'IBM Plex Mono',Menlo,Consolas,monospace;white-space:pre-wrap;word-break:break-word;display:none}
 .log .e{color:#ff9d9d} .log .ok{color:#73e6a8} .log .info{color:#7fd1f5} .log .cmd{color:#ffd58a}

 /* Galería de evidencias */
 .evid-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(158px,1fr));gap:10px}
 .evid-item{border:1px solid var(--line);border-radius:11px;overflow:hidden;background:#fbfdff;text-decoration:none;display:block;transition:.14s}
 .evid-item:hover{border-color:#bfe0f4;transform:translateY(-2px);box-shadow:var(--sh)}
 .evid-item img{width:100%;height:100px;object-fit:cover;object-position:top;display:block;background:#eef4f9}
 .evid-item.fail{border-color:var(--errln)}
 .evid-item .cap{padding:7px 9px;font-size:11px;color:var(--ink2);line-height:1.35}
 .evid-item .cap b{display:block;color:var(--rotd);font-size:9.5px;text-transform:uppercase;letter-spacing:.04em;margin-bottom:1px}
 .evid-item.fail .cap b{color:var(--err)}
 .evid-empty{color:var(--mut);font-style:italic;font-size:13px;padding:8px 2px}

 /* Calidad transversal */
 .xrow{display:flex;align-items:center;gap:12px;background:var(--panel);border:1px solid var(--line);border-radius:12px;box-shadow:var(--sh);padding:13px 16px;margin-bottom:9px}
 .xrow .xnm{flex:1} .xrow .xnm b{font-weight:700;color:var(--ink)} .xrow .xnm small{display:block;color:var(--mut);font-size:12px;margin-top:2px}

 /* Datos de prueba (cercado) */
 .fenced{border:1.5px dashed #f1c27a;border-radius:16px;background:linear-gradient(180deg,#fffaf2,#fff);padding:18px 20px;position:relative}
 .fenced .fence-lbl{position:absolute;top:-11px;left:16px;background:#fff7ea;border:1px solid #f1c27a;border-radius:999px;padding:2px 12px;font:700 11px 'IBM Plex Sans',sans-serif;color:#9a6a14;letter-spacing:.03em}
 body.env-prod .fenced{opacity:.55}
 .fields{display:flex;gap:11px;flex-wrap:wrap;margin:6px 0 13px}
 .field{display:flex;flex-direction:column;gap:5px;flex:1;min-width:200px}
 .field label{font-size:12.5px;font-weight:600;color:var(--ink2)}
 .field select,.field input{font:500 14px 'IBM Plex Sans',sans-serif;color:var(--ink);background:#fff;border:1px solid var(--line);border-radius:10px;padding:10px 12px;outline:none;transition:.14s}
 .field select{cursor:pointer;appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2365809a' stroke-width='2.5' stroke-linecap='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 12px center;padding-right:34px}
 .field select:focus,.field input:focus{border-color:var(--rot);outline:2px solid var(--rot);outline-offset:1px}
 .field .hint{font-size:11.5px;color:var(--mut);font-family:'IBM Plex Mono',monospace;min-height:14px}
 .ordbox{margin-top:14px;border:1px solid var(--okln);background:var(--okbg);border-radius:13px;padding:14px 16px;display:none}
 .ordbox.show{display:block;animation:rise .35s ease}
 .ob-top{display:flex;align-items:center;gap:11px;flex-wrap:wrap}
 .ob-lbl{font-size:12.5px;color:var(--ink2);font-weight:600}
 .ob-num{font:700 16px 'IBM Plex Mono',monospace;color:var(--ink);background:#fff;border:1px solid var(--okln);border-radius:8px;padding:4px 11px;letter-spacing:.02em}
 .ob-copy{font:600 12px 'IBM Plex Sans',sans-serif;color:var(--rotd);cursor:pointer;background:#fff;border:1px solid #bfe0f4;border-radius:8px;padding:5px 10px}
 .ob-copy:hover{background:var(--rot);color:#fff;border-color:var(--rot)}
 /* Línea de tiempo del pedido */
 .timeline{margin-top:14px;display:flex;flex-direction:column;gap:0}
 .tlstep{display:flex;gap:12px;align-items:flex-start;position:relative;padding-bottom:14px}
 .tlstep:not(:last-child)::before{content:"";position:absolute;left:10px;top:22px;bottom:0;width:2px;background:var(--line)}
 .tlstep.done:not(:last-child)::before{background:var(--ok)}
 .tlnode{width:22px;height:22px;border-radius:50%;flex:none;border:2px solid var(--line);background:#fff;display:grid;place-items:center;font-size:11px;color:transparent;z-index:1}
 .tlstep.done .tlnode{background:var(--ok);border-color:var(--ok);color:#fff} .tlstep.active .tlnode{border-color:var(--rot);color:var(--rot)}
 .tlstep.gate .tlnode{border-color:var(--mut)}
 .tlbody{flex:1;min-width:0}
 .tlbody .tlt{font-weight:700;font-size:13.5px;color:var(--ink);display:flex;align-items:center;gap:9px;flex-wrap:wrap}
 .tlbody .tlmail{font-size:12px;color:var(--mut);margin-top:2px} .tlbody .tlmail b{color:var(--ink2);font-weight:600}
 .tlbody .btn-sec{margin-top:7px;padding:6px 12px;font-size:12px}
 .tlbody .gatenote{font-size:11.5px;color:var(--warn);margin-top:4px}

 /* Historial */
 .hist{list-style:none;margin:6px 0 0;padding:0;display:flex;flex-direction:column;gap:6px;max-height:340px;overflow:auto}
 .hist li{display:flex;align-items:center;gap:11px;padding:9px 12px;border:1px solid var(--line);border-radius:10px;background:#fbfdff}
 .hist .hdot{width:9px;height:9px;border-radius:50%;flex:none;background:var(--idle)}
 .hist li.is-ok .hdot{background:var(--ok)} .hist li.is-err .hdot{background:var(--err)} .hist li.is-skip .hdot{background:var(--warn)}
 .hist .hlbl{flex:1;min-width:0;font-weight:500;font-size:13.5px;color:var(--ink2)}
 .hist .hres{font:600 11.5px 'IBM Plex Mono',monospace;white-space:nowrap}
 .hist li.is-ok .hres{color:var(--ok)} .hist li.is-err .hres{color:var(--err)} .hist li.is-skip .hres{color:var(--warn)}
 .hist .htime{font:500 11px 'IBM Plex Mono',monospace;color:var(--mut);white-space:nowrap;min-width:42px;text-align:right}
 .hist.empty li{justify-content:center;color:var(--mut);font-style:italic;background:transparent;border-style:dashed}

 /* Drawer Investigar */
 .scrim{position:fixed;inset:0;background:rgba(10,41,66,.34);backdrop-filter:blur(2px);z-index:40;opacity:0;pointer-events:none;transition:opacity .22s}
 .scrim.show{opacity:1;pointer-events:auto}
 .drawer{position:fixed;top:0;right:0;bottom:0;width:min(440px,94vw);background:var(--panel);box-shadow:-12px 0 40px rgba(10,41,66,.22);z-index:41;
   transform:translateX(100%);transition:transform .26s cubic-bezier(.4,0,.2,1);display:flex;flex-direction:column}
 .drawer.show{transform:none}
 .drawer-h{display:flex;align-items:center;gap:11px;padding:16px 20px;border-bottom:1px solid var(--line)}
 .drawer-h h2{font-size:16px;font-weight:700;color:var(--ink);flex:1}
 .drawer-b{padding:18px 20px;overflow:auto;flex:1}
 .drawer .ob-acts{display:flex;gap:8px;flex-wrap:wrap;margin-top:11px}
 .ord-out{margin:13px 0 0;background:#07223a;color:#cfe3f2;border-radius:10px;border:1px solid #0d3550;padding:11px 13px;max-height:300px;overflow:auto;
   font:12px/1.6 'IBM Plex Mono',Menlo,Consolas,monospace;white-space:pre-wrap;word-break:break-word;display:none}
 .ord-out.show{display:block} .ord-out .e{color:#ff9d9d} .ord-out .ok{color:#73e6a8} .ord-out .info{color:#7fd1f5}
 .emails{list-style:none;margin:12px 0 0;padding:0;display:flex;flex-direction:column;gap:7px}
 .emails li{display:flex;gap:10px;align-items:baseline;padding:9px 12px;border:1px solid var(--line);border-radius:10px;background:#fbfdff;font-size:13px}
 .emails li .su{flex:1;color:var(--ink2);font-weight:500} .emails li .dt{color:var(--mut);font-size:11.5px;font-family:'IBM Plex Mono',monospace;white-space:nowrap}
 .emails.empty li{color:var(--mut);justify-content:center;font-style:italic}

 /* Modal Ajustes */
 .modal{position:fixed;inset:0;z-index:42;display:none;align-items:flex-start;justify-content:center;padding:48px 18px;overflow:auto}
 .modal.show{display:flex}
 .modal-card{background:var(--panel);border:1px solid var(--line);border-radius:18px;box-shadow:0 24px 60px rgba(10,41,66,.3);width:min(560px,100%);padding:22px 24px}
 .modal-h{display:flex;align-items:center;gap:11px;margin-bottom:6px} .modal-h h2{font-size:18px;font-weight:800;color:var(--ink);flex:1}
 .cfg-group{border:1px solid var(--line);border-radius:12px;padding:13px 15px;margin-bottom:11px;background:#fbfdff}
 .cfg-group>h3{font:700 13px 'IBM Plex Sans',sans-serif;color:var(--ink);margin:0 0 10px;display:flex;align-items:center;gap:8px}
 .cfg-group>h3 .gp{font:600 10px 'IBM Plex Mono',monospace;text-transform:uppercase;letter-spacing:.04em;padding:2px 7px;border-radius:999px;border:1px solid var(--line);color:var(--mut);background:#fff}
 .cfg-group>h3 .gp.ok{color:var(--ok);border-color:var(--okln);background:var(--okbg)}
 .cfg-field{display:flex;flex-direction:column;gap:4px;margin-bottom:10px} .cfg-field:last-child{margin-bottom:0}
 .cfg-field label{font-size:12px;font-weight:600;color:var(--ink2)}
 .cfg-field input{font:500 13.5px 'IBM Plex Sans',sans-serif;color:var(--ink);background:#fff;border:1px solid var(--line);border-radius:9px;padding:9px 11px;outline:none;transition:.14s}
 .cfg-field input:focus{border-color:var(--rot);outline:2px solid var(--rot);outline-offset:1px}
 .cfg-field .hint{font-size:11px;color:var(--mut);font-family:'IBM Plex Mono',monospace}
 .cfg-show{display:inline-flex;align-items:center;gap:7px;font-size:12.5px;color:var(--ink2);cursor:pointer;margin:0 0 12px;user-select:none}
 .cfg-actions{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-top:6px}
 .imapnote{margin:12px 0 0;font-size:12.5px;color:var(--mut);background:var(--line2);border:1px solid var(--line);border-radius:10px;padding:10px 12px}
 .imapnote a{color:var(--rotd);font-weight:600;text-decoration:none} .imapnote a:hover{text-decoration:underline}

 @keyframes rise{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
 @media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
 .foot{max-width:1140px;margin:18px auto 0;padding:0 26px;color:var(--mut);font-size:12px;text-align:center}
</style></head><body>

<header>
 <div class="brand">
  <span class="mark"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3c4 4.5 6 7.5 6 10.5A6 6 0 0 1 6 13.5C6 10.5 8 7.5 12 3z"/></svg></span>
  <span><span class="t">Panel QA · <b>Rotoplas B2C</b></span><span class="s">monitoreo por área · datos de prueba</span></span>
 </div>
 <span class="sp"></span>
 <label class="envsel"><span class="led"></span>
  <select id="env" aria-label="Ambiente"><option value="qa">Entorno QA</option><option value="prod">PRODUCCIÓN</option></select>
 </label>
 <label class="toggle"><input type="checkbox" id="headed"><span class="track"></span>Ver navegador</label>
  <button class="iconbtn" id="btnSettings" title="Ajustes" aria-label="Ajustes"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg></button>
  <button class="iconbtn" id="btnUpdate" title="Actualizar panel (git pull + npm install)" aria-label="Actualizar panel" data-action="self-update" data-st="st-update" data-live="live-update" data-log="log-update" data-flow="actualizar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg></button>
  <span class="pill" id="st-update" style="margin-left:-4px"><span class="d"></span>actualizado</span>
  <button class="iconbtn" id="btnRestart" title="Reiniciar el panel (recarga el código del servidor)" aria-label="Reiniciar el panel"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/></svg></button>
</header>
<div class="prodwarn" id="prodwarn" hidden>
 <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/></svg>
 <span>Apuntando a <b>PRODUCCIÓN</b> — solo monitoreo de lectura. Datos de prueba (crear orden, mover estado, correos) están deshabilitados.</span>
</div>
<div class="prereq" id="prereq"><span class="pq"><span class="d"></span>Revisando prerequisitos…</span></div>
<div class="livebar" id="livebar" hidden>
 <span class="lb-spin"></span><span class="lb-now" id="lbNow">Trabajando…</span>
 <span class="lb-prog" id="lbProg" style="display:none">0/0</span>
 <span class="lb-counts" id="lbCounts" style="display:none">✓0 ✘0 –0</span>
 <button class="lb-jump" id="lbJump" type="button">ver detalle ↓</button>
 <button class="lb-cancel" id="lbCancel" type="button" style="display:none">Cancelar</button>
</div>
<div class="live" id="live-update"></div>
<button class="detalle" data-target="log-update" style="display:none;margin:8px 26px 0">ver detalle de actualización <span class="ar">▾</span></button>
<pre class="log" id="log-update" style="display:none;margin:0 26px 8px"></pre>

<main>
 <section class="master" id="master">
  <div class="mtxt">
   <h1><span id="mTitle">Listo para revisar</span> <span class="statetag" id="mTag">en espera</span></h1>
   <p class="msub" id="mSub">Corre una revisión de LECTURA de todo el sitio tras una liberación. Enciende cada celda del mapa por área. No muta datos.</p>
  </div>
  <button class="btn-primary" id="btnMaster"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg> Revisar sitio</button>
 </section>

 <div class="summary">
  <div class="sumcard">
   <div class="lbl">Salud (última corrida)</div>
   <div class="big"><div class="chiprow" id="sumSalud"><span class="sc ok"><span class="d"></span>0</span><span class="sc err"><span class="d"></span>0</span><span class="sc skip"><span class="d"></span>0</span></div></div>
  </div>
  <div class="sumcard">
   <div class="lbl">Cobertura del mapa</div>
   <div class="big"><b id="sumCobNum">—</b><div class="chiprow" id="sumCob"></div></div>
  </div>
 </div>

 <section class="block collapsed" id="mapBlock">
  <div class="block-h" data-block="mapBlock"><span class="cic"><svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg></span><h2>Mapa por área</h2><span class="hint">Responde · Estructura · Flujo · Móvil — clic en una celda para correrla</span><span class="block-chev"><svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg></span></div>
  <div id="map"><div class="maprow"><div class="maprow-h"><span class="anm">Cargando mapa…</span></div></div></div>
  <div class="bugline" id="bugline">
   <span class="b">Bugs conocidos vigilados: 4</span> <span>(0 arreglados)</span>
   <span>· BUG-001 (Home sin H1) · BUG-015 (logo no &lt;a&gt;) · BUG-003 (Contacto→FAQ) · BUG-119 (PAN/PCI)</span>
   <a href="/report" target="_blank">reporte HTML ↗</a>
   <a href="#" id="btnExportMd" title="Copia un resumen en Markdown para pegar en Jira/Slack">copiar resumen (Markdown) ⧉</a>
  </div>
  <div class="live" id="live-map" data-flow="checks"></div>
  <button class="detalle" data-target="log-map">ver detalle técnico <span class="ar">▾</span></button>
  <pre class="log" id="log-map"></pre>
 </section>

 <section class="block collapsed" id="evidBlock">
  <div class="block-h" data-block="evidBlock"><span class="cic"><svg viewBox="0 0 24 24"><path d="M3 7h4l2-2h6l2 2h4v12H3z"/><circle cx="12" cy="13" r="3.2"/></svg></span><h2>Evidencias de la última revisión</h2><span class="hint">capturas por área — evidencias/panel/</span><span class="block-chev"><svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg></span></div>
  <div style="display:flex;gap:10px;align-items:center;margin-bottom:11px">
   <button class="btn-sec" id="btnEvid"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-3-6.7L21 7"/><path d="M21 3v4h-4"/></svg>Recargar galería</button>
   <span class="hint" id="evidCount"></span>
  </div>
  <div class="evid-grid" id="evidGrid"></div>
 </section>

 <section class="block collapsed" id="xBlock">
  <div class="block-h" data-block="xBlock"><span class="cic"><svg viewBox="0 0 24 24"><path d="M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7z"/><path d="M9 12l2 2 4-4"/></svg></span><h2>Calidad transversal</h2><span class="hint">site-wide — no cabe como columna del mapa</span><span class="block-chev"><svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg></span></div>
  <div class="xrow"><span class="pill" id="st-xcut"><span class="d"></span>—</span><span class="xnm"><b>Errores y enlaces</b><small>excepciones JS no capturadas (Home·Categoría·Contacto) · 404/catchall (BUG-518)</small></span><button class="btn-sec" data-action="xcut" data-st="st-xcut" data-live="live-xcut" data-log="log-xcut" data-flow="checks"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>correr</button></div>
  <div class="xrow"><span class="pill" id="st-perf"><span class="d"></span>—</span><span class="xnm"><b>Performance</b><small>Lighthouse / Core Web Vitals — Home, PDP · lento (~1 min) · on-demand</small></span><button class="btn-sec" data-action="perf" data-st="st-perf" data-live="live-perf" data-log="log-perf" data-flow="checks"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>correr</button></div>
  <div class="live" id="live-perf" data-flow="checks"></div>
  <button class="detalle" data-target="log-perf">ver detalle técnico (Performance) <span class="ar">▾</span></button>
  <pre class="log" id="log-perf"></pre>
  <div class="xrow"><span class="pill"><span class="d"></span>baseline</span><span class="xnm"><b>PCI</b><small>2-pci-baseline — guard de BUG-119 (PAN en detalle de pedido). Se vigila en Mi cuenta.</small></span></div>
  <div class="live" id="live-xcut" data-flow="checks"></div>
  <button class="detalle" data-target="log-xcut">ver detalle técnico <span class="ar">▾</span></button>
  <pre class="log" id="log-xcut"></pre>
 </section>

 <section class="block collapsed" id="dataBlock">
  <div class="block-h" data-block="dataBlock"><span class="cic"><svg viewBox="0 0 24 24"><path d="M9 3h6M10 3v6l-5 8a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-8V3"/></svg></span><h2>Datos de prueba</h2><span class="hint">crea datos reales — QA-only</span><span class="block-chev"><svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg></span></div>
  <div class="fenced">
   <span class="fence-lbl">🔒 QA-only · muta datos</span>
   <p class="msub" style="margin:0 0 6px">Crea un <b>pedido de prueba</b> recorriendo el sitio como un usuario real, avanza sus estados y verifica que los correos de <b>ventasecom@rotoplas.com</b> lleguen.</p>
   <div class="fields">
    <div class="field"><label for="selTipo">Tipo de pedido</label>
     <select id="selTipo"><option value="fisico">Producto físico (Base para tinaco)</option><option value="servicio">Servicio de lavado (wizard)</option></select></div>
    <div class="field"><label for="selPago">Método de pago</label>
     <select id="selPago"><option value="credito">Tarjeta de crédito (Visa 4242)</option><option value="debito">Tarjeta de débito (Visa 4111)</option><option value="transferencia">Transferencia / SPEI</option><option value="efectivo">Pago en efectivo</option></select>
     <span class="hint" id="pagoHint"></span></div>
   </div>
   <div style="display:flex;gap:10px;flex-wrap:wrap">
    <button class="btn-primary" data-action="crear-orden" data-st="st-crear" data-live="live-data" data-log="log-data" data-opts="1" data-flow="orden"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg> Crear pedido</button>
    <button class="btn-sec" data-action="capa2-auto" data-st="st-pipeline" data-live="live-data" data-log="log-data" data-flow="capa2"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg> Pipeline auto (crear + transiciones)</button>
    <span class="pill" id="st-crear"><span class="d"></span>—</span>
   </div>
   <div class="ordbox" id="ordBox">
    <div class="ob-top"><span class="ob-lbl">Pedido creado:</span><span class="ob-num" id="ordNum">—</span>
     <button class="ob-copy" id="ordCopy" type="button">copiar</button>
     <button class="btn-sec" id="ordInvestigar" type="button"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/></svg> Investigar esta orden</button></div>
    <div class="timeline" id="timeline"></div>
   </div>
   <div class="live" id="live-data" data-flow="orden"></div>
   <button class="detalle" data-target="log-data">ver detalle técnico <span class="ar">▾</span></button>
   <pre class="log" id="log-data"></pre>
  </div>
 </section>

 <section class="block collapsed" id="histBlock">
  <div class="block-h" data-block="histBlock"><span class="cic"><svg viewBox="0 0 24 24"><path d="M12 8v4l3 2"/><circle cx="12" cy="12" r="9"/></svg></span><h2>Historial reciente</h2><span class="hint">últimas 15 corridas — solo en este navegador</span><span class="block-chev"><svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg></span></div>
  <ul class="hist empty" id="histList"><li>Aún no hay corridas registradas.</li></ul>
  <button class="detalle" id="histClear" style="margin-top:8px">borrar historial</button>
 </section>
</main>
<p class="foot"><span id="lastRun"></span></p>

<!-- Drawer Investigar -->
<div class="scrim" id="scrim"></div>
<aside class="drawer" id="drawer" aria-hidden="true">
 <div class="drawer-h">
  <h2>Investigar pedido</h2>
  <button class="iconbtn" id="drawerClose" aria-label="Cerrar"><svg viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg></button>
 </div>
 <div class="drawer-b">
  <div class="field"><label for="invOrder">Número de orden</label><input id="invOrder" placeholder="6XXXXXXXXX" autocomplete="off" spellcheck="false"></div>
  <div class="ob-acts">
   <button class="btn-sec" data-inv="order-status"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>Estado</button>
   <button class="btn-sec" data-inv="order-payments"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>Pagos</button>
   <button class="btn-sec" data-inv="order-messages"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>Historial</button>
   <button class="btn-sec" id="invEmails"><svg viewBox="0 0 24 24"><path d="M3 6h18v12H3z"/></svg>Correos</button>
  </div>
  <pre class="ord-out" id="invOut"></pre>
  <ul class="emails" id="invEmailList" style="display:none"></ul>
 </div>
</aside>

<!-- Modal Ajustes -->
<div class="modal" id="modal">
 <div class="modal-card">
  <div class="modal-h"><h2>Ajustes</h2><button class="iconbtn" id="modalClose" aria-label="Cerrar"><svg viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg></button></div>
  <p class="msub" style="margin:0 0 14px">Credenciales locales (se guardan solo en <code>.env</code>, nunca a GitHub). Mínimo la <b>Sesión B2C</b>.</p>
  <label class="cfg-show"><input type="checkbox" id="cfgShow"> Mostrar credenciales</label>
  <div id="cfgGroups"><div class="msub">Cargando campos…</div></div>
  <div class="cfg-actions">
   <button class="btn-primary" id="btnSaveCfg"><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M17 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7l-4-4z"/></svg> Guardar</button>
   <button class="btn-sec" data-action="check-imap" data-st="st-imaptest" data-live="live-cfg" data-log="log-cfg"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>Probar IMAP</button>
   <span class="pill" id="st-imaptest"><span class="d"></span>—</span>
  </div>
  <button class="btn-sec" data-action="gen-auth-b2c" data-st="st-genauth" data-live="live-cfg" data-log="log-cfg" style="margin-top:11px;width:100%;justify-content:center"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 1 3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></svg> Generar sesión B2C (login una vez)</button>
  <span class="pill" id="st-genauth" style="margin-top:8px"><span class="d"></span>—</span>
  <p class="imapnote" id="imapnote">Cargando…</p>
  <div class="live" id="live-cfg" data-flow=""></div>
  <button class="detalle" data-target="log-cfg">ver detalle técnico <span class="ar">▾</span></button>
  <pre class="log" id="log-cfg"></pre>
 </div>
</div>

<script>
var $=function(s){return document.querySelector(s);};
var byId=function(id){return document.getElementById(id);};
var running=false;
var ENV='qa';
// Estado de la corrida activa (para Cancelar): el EventSource vivo, el pill en curso y su panel.
var activeES=null,activeStId=null,activeLiveEl=null,cancelled=false,runStartedAt=0;
var PROD_BLOCKED=['crear-orden','capa2-auto','purchase','login-check','move-state'];
var AREAS=[];            // poblado desde /config
var AREA_LABELS={};
var STATES=[];

// ─── Ambiente ────────────────────────────────────────────────────────────────
function applyEnv(v){
 ENV=(v==='prod')?'prod':'qa';
 document.body.classList.toggle('env-prod',ENV==='prod');
 var w=byId('prodwarn'); if(w){if(ENV==='prod')w.removeAttribute('hidden');else w.setAttribute('hidden','');}
 var blocked=(ENV==='prod');
 PROD_BLOCKED.forEach(function(act){
  var btns=document.querySelectorAll('[data-action="'+act+'"],[data-cellaction="'+act+'"]');
  for(var i=0;i<btns.length;i++){btns[i].disabled=blocked;btns[i].title=blocked?'Deshabilitado en producción — mutaría datos reales':'';}
 });
 loadPrereq();
}
byId('env').addEventListener('change',function(){applyEnv(this.value);});

// ─── Master + pills ──────────────────────────────────────────────────────────
var MASTER={
 idle:{title:'Listo para revisar',tag:'en espera',sub:'Corre una revisión de LECTURA de todo el sitio tras una liberación. Enciende cada celda del mapa por área. No muta datos.'},
 run:{title:'Revisando el sitio…',tag:'corriendo',sub:'Responde + Estructura de cada área, una por una. Mantén esta pestaña abierta.'},
 ok:{title:'Todo en pie',tag:'ok',sub:'La estructura crítica de lectura respondió. Ningún elemento load-bearing se rompió.'},
 skip:{title:'Revisión con omitidos',tag:'omitido',sub:'Algunas áreas no verificaron nada (sesión @auth ausente). Revisa el detalle.'},
 err:{title:'Algo se rompió',tag:'revisar',sub:'Una celda falló. Abre su detalle inline para ver qué fue.'}
};
function setMaster(state){
 var m=byId('master'); m.classList.remove('is-run','is-ok','is-err','is-skip');
 if(state&&state!=='idle')m.classList.add('is-'+state);
 var d=MASTER[state]||MASTER.idle; byId('mTitle').textContent=d.title; byId('mTag').textContent=d.tag; byId('mSub').textContent=d.sub;
}
function setPill(el,state){
 if(!el)return;
 el.classList.remove('is-run','is-ok','is-err','is-skip','is-pend','is-idle');
 var txt={run:'corriendo…',ok:'OK',err:'revisar',skip:'omitido',pend:'⏳',idle:'—'}[state]||'—';
 if(state&&state!=='idle')el.classList.add('is-'+state);
 var dot=el.querySelector('.d'); el.textContent=''; if(dot)el.appendChild(dot); else{dot=document.createElement('span');dot.className='d';el.appendChild(dot);}
 el.appendChild(document.createTextNode(' '+txt));
 var c=el.closest&&el.closest('.cell');
 if(c){c.classList.remove('is-run','is-ok','is-err','is-skip'); if(state&&state!=='idle'&&state!=='pend')c.classList.add('is-'+state);}
 renderSalud();
}
function setBusy(b){
 running=b; document.body.classList.toggle('busy',b);
 var btns=document.querySelectorAll('[data-action],[data-cell],#btnMaster,#invEmails,[data-inv]');
 for(var i=0;i<btns.length;i++)btns[i].disabled=b;
 var cb=byId('lbCancel'); if(cb)cb.style.display=b?'':'none';
 if(b){cancelled=false;runStartedAt=Date.now();ensureNotifyPerm();}  // nueva corrida
 if(!b&&ENV==='prod')applyEnv('prod');
}
// Notificación del navegador al terminar corridas LARGAS (≥25s, p.ej. compra E2E ~3 min).
// Pide permiso la primera vez; degrada en silencio si no se concede.
function ensureNotifyPerm(){try{if('Notification'in window&&Notification.permission==='default')Notification.requestPermission();}catch(_){}}
function maybeNotify(label,state){
 try{
  if(!('Notification'in window)||Notification.permission!=='granted')return;
  if(Date.now()-runStartedAt<25000)return;   // corridas cortas no molestan
  var ic={ok:'✓',err:'✗',skip:'–'},body={ok:'Todo en pie',err:'Algo falló — revisa el panel',skip:'Omitido (revisa prerequisitos)'};
  new Notification('Panel QA B2C — '+(ic[state]||'')+' '+(label||'corrida'),{body:body[state]||'',tag:'qa-run'});
 }catch(_){}
}
// Cancela la corrida en curso: cierra el SSE (el server mata el proceso hijo en req.on('close')),
// detiene la cola (bandera cancelled) y restaura la celda en curso a estado neutro.
function cancelRun(){
 if(!running)return;
 cancelled=true;
 if(activeES){try{activeES.close();}catch(_){}} activeES=null;
 if(activeLiveEl)timerStop(activeLiveEl);
 if(activeStId){var p=byId(activeStId);if(p)setPill(p,'idle');activeStId=null;}
 activeLiveEl=null;
 setBusy(false);
 var b=byId('livebar');
 if(b){b.className='livebar is-skip';var sp=b.querySelector('.lb-spin');if(sp)sp.textContent='■';byId('lbNow').textContent='Corrida cancelada';if(_lbHideT)clearTimeout(_lbHideT);_lbHideT=setTimeout(hideLivebar,3000);}
}
function logLine(logEl,text,cls){var d=document.createElement('div');d.className=cls||'';d.textContent=text;logEl.appendChild(d);logEl.scrollTop=logEl.scrollHeight;}
function classify(t){
 if(/^✓|PASS|passed|✔|exitosa|VERIFICADO|\\bOK\\b/i.test(t))return'ok';
 if(/error|fail|✗|✘|rechaz|inválid|FALL/i.test(t))return'e';
 if(/^CAPA2_ORDER=|orden creada|→|▶|Running|tests/i.test(t))return'info';
 return'';
}

// ─── ACTIVIDAD EN VIVO (preservada del panel previo) ─────────────────────────
var FLOWS={
 orden:[
  {re:/tecleando usuario|login: teclea/i,t:'Tecleando usuario y contraseña'},
  {re:/sesi[oó]n iniciada|sesi[oó]n .* activa/i,t:'Sesión iniciada'},
  {re:/agregad[oa] al carrito|cotizaci[oó]n generada|wizard abierto/i,t:'Producto en el carrito'},
  {re:/iniciar compra/i,t:'Entrando al checkout'},
  {re:/direcci[oó]n usada|paso 1:/i,t:'Dirección confirmada'},
  {re:/informaci[oó]n confirmada|paso 2:/i,t:'Datos confirmados'},
  {re:/procesando pago|capturada|generar pedido \\(/i,t:'Procesando el pago'},
  {re:/✓ orden creada|orden creada:/i,t:'¡Orden creada!'}
 ],
 capa2:[
  {re:/tecleando usuario|login: teclea/i,t:'Iniciando sesión (usuario y contraseña)'},
  {re:/sesi[oó]n iniciada|sesi[oó]n .* activa|wizard abierto|agregad[oa] al carrito|cotizaci[oó]n generada/i,t:'Creando orden de prueba'},
  {re:/procesando pago|orden creada|CAPA2_ORDER=/i,t:'Pago procesado'},
  {re:/confirmed|confirmado/i,t:'Estado: confirmado'},
  {re:/shipped|en camino/i,t:'Estado: en camino'},
  {re:/correo|email|verific|@capa2|skipped|passed/i,t:'Verificando correos'}
 ]
};
function ahoraTexto(text){
 var t=text.replace(/^\\[[^\\]]+\\]\\s*/,'').replace(/\\s+/g,' ').trim();
 if(/^\\$ /.test(t))return'';
 if(/Running \\d+ test/i.test(t))return'Arrancando las pruebas…';
 if(/\\bpassed\\b/i.test(t)&&/\\bskipped\\b/i.test(t))return'Pruebas finalizadas';
 if(/^✓|^\\s*ok\\b/i.test(t))return'Verificación OK';
 if(t.length>90)t=t.slice(0,90)+'…';
 return t;
}
function fmtClock(ms){var s=Math.floor(ms/1000);return Math.floor(s/60)+':'+('0'+(s%60)).slice(-2);}
function timerStart(liveEl){if(!liveEl)return;liveEl._t0=Date.now();var el=liveEl.querySelector('[data-time]');if(!el)return;liveEl._timer=setInterval(function(){el.textContent=fmtClock(Date.now()-liveEl._t0);},500);}
function timerStop(liveEl){if(!liveEl)return;if(liveEl._timer){clearInterval(liveEl._timer);liveEl._timer=null;}var el=liveEl.querySelector('[data-time]');if(el&&liveEl._t0)el.textContent=fmtClock(Date.now()-liveEl._t0);}

var _lbHideT=null;
function showLivebar(){var b=byId('livebar');if(!b)return;if(_lbHideT){clearTimeout(_lbHideT);_lbHideT=null;}b.className='livebar';b.removeAttribute('hidden');}
function hideLivebar(){var b=byId('livebar');if(b)b.setAttribute('hidden','');}
function syncLivebar(liveEl){
 var b=byId('livebar');if(!b||b.hasAttribute('hidden')||!liveEl)return;
 var nowEl=liveEl.querySelector('[data-now]');
 var now=nowEl&&nowEl.childNodes[0]?nowEl.childNodes[0].nodeValue:'';
 byId('lbNow').textContent=now||'Trabajando…';
 var pr=byId('lbProg'),ct=byId('lbCounts');
 if(liveEl._mode==='tests'){pr.style.display='';pr.textContent=(liveEl._done||0)+'/'+(liveEl._total||'?');ct.style.display='';ct.textContent='✓'+greenCount(liveEl)+' ✘'+(liveEl._fail||0)+' –'+(liveEl._skip||0);}
 else{pr.style.display='none';ct.style.display='none';}
}
byId('lbJump').addEventListener('click',function(){var l=window._activeLive;(l||byId('livebar')).scrollIntoView({behavior:'smooth',block:'center'});});
byId('lbCancel').addEventListener('click',cancelRun);
byId('btnExportMd').addEventListener('click',function(e){e.preventDefault();exportMarkdown();});

function liveStart(liveEl,flowOverride){
 if(!liveEl)return;
 window._activeLive=liveEl;showLivebar();
 var flow=flowOverride||liveEl.getAttribute('data-flow');
 liveEl.className='live show is-run';liveEl._flow=flow;liveEl._idx=-1;liveEl._n=0;liveEl._rows={};
 if(flow==='checks'){
  liveEl._mode='tests';liveEl._total=0;liveEl._done=0;liveEl._ok=0;liveEl._fail=0;liveEl._skip=0;liveEl._known=0;liveEl._fixed=0;liveEl._flaky=0;
  liveEl.innerHTML='<div class="live-now"><span class="live-spin"></span><span class="live-txt" data-now>Arrancando las pruebas…<small data-sub></small></span><span class="live-time" data-time>0:00</span></div>'
   +'<div class="lp"><div class="lp-track"><div class="lp-bar" data-bar></div></div><span class="lp-num" data-num>0/0</span></div>'
   +'<div class="lcounts"><span class="lc lc-ok" data-cok>✓ 0 en pie</span><span class="lc lc-fail" data-cfail>✘ 0 rotos</span><span class="lc lc-skip" data-cskip>– 0 omitidos</span></div>'
   +'<ul class="tlist" data-tlist></ul>';
  timerStart(liveEl);syncLivebar(liveEl);return;
 }
 liveEl._mode='steps';
 var steps=FLOWS[flow];
 var html='<div class="live-now"><span class="live-spin"></span><span class="live-txt" data-now>Arrancando…<small data-sub></small></span><span class="live-time" data-time>0:00</span></div>';
 if(steps){html+='<ul class="live-steps">';for(var i=0;i<steps.length;i++)html+='<li data-step="'+i+'"><span class="tick">✓</span>'+steps[i].t+'</li>';html+='</ul>';}
 liveEl.innerHTML=html;timerStart(liveEl);syncLivebar(liveEl);
}
function humanTitle(o){return {suite:(o.suite||'').replace(/@\\w+\\s*/g,'').trim(),title:(o.title||'').trim()};}
function setNow(liveEl,main,sub){var nowEl=liveEl.querySelector('[data-now]');if(!nowEl)return;nowEl.childNodes[0].nodeValue=main;var subEl=liveEl.querySelector('[data-sub]');if(subEl)subEl.textContent=sub||'';}
function updProg(liveEl){
 var total=liveEl._total||0,done=liveEl._done||0;
 var bar=liveEl.querySelector('[data-bar]'),num=liveEl.querySelector('[data-num]');
 if(bar)bar.style.width=(total?Math.round(done/total*100):0)+'%'; if(num)num.textContent=done+'/'+(total||'?');
 var cok=liveEl.querySelector('[data-cok]'),cf=liveEl.querySelector('[data-cfail]'),cs=liveEl.querySelector('[data-cskip]'),g=greenCount(liveEl);
 if(cok){cok.textContent='✓ '+g+' en pie';cok.className='lc lc-ok'+(g?' on':'');}
 if(cf){cf.textContent='✘ '+(liveEl._fail||0)+' rotos';cf.className='lc lc-fail'+(liveEl._fail?' on':'');}
 if(cs){cs.textContent='– '+(liveEl._skip||0)+' omitidos';cs.className='lc lc-skip'+(liveEl._skip?' on':'');}
}
function friendlyError(o){
 var e=String(o.error||''),T=function(re){return re.test(e);};
 if(o.status==='timedOut'||T(/Test timeout|Timed out.*test\\b/i))return'La prueba tardó demasiado y se canceló. El sitio pudo no cargar a tiempo (o un elemento nunca apareció).';
 if(T(/unexpected.*pass|expected to fail/i))return'¡Buena noticia! Un bug conocido parece arreglado: la prueba que debía fallar pasó. Toca cerrar el ticket.';
 if(T(/toBe\\(200\\)|Expected:\\s*200|response.*[45]\\d\\d|ERR_|ECONNREFUSED|net::/i))return'La URL no respondió 200. Suele ser un deploy a medias o infraestructura caída — no el sitio roto por dentro.';
 if(T(/Ha ocurrido un error/i))return'La página mostró "Ha ocurrido un error" en vez del contenido.';
 if(T(/toBeGreaterThan|Expected:\\s*>\\s*0|Received:\\s*0|toHaveCount/i))return'Se esperaba al menos un elemento y no apareció ninguno (contador en 0). Esa sección no se renderizó.';
 if(T(/toBeVisible|to be visible|not visible/i))return'Un elemento esperado nunca se hizo visible. Pudo no renderizarse o cambiar de lugar.';
 if(T(/toBeEnabled|to be enabled|disabled/i))return'Un botón o campo siguió deshabilitado cuando debía habilitarse.';
 if(T(/toBeAttached|waiting for.*locator|getByRole|getByText|getByLabel|locator\\(/i))return'No se encontró un elemento clave en la página. Si el equipo cambió el markup a propósito, actualiza el contract.';
 if(T(/toContainText|toHaveText|toHaveTitle|expected substring|to contain/i))return'El texto esperado no coincidió con lo que mostró la página.';
 if(T(/toHaveURL|expected url/i))return'La navegación terminó en una URL distinta a la esperada.';
 return'Una verificación no se cumplió. Abre el detalle técnico para ver el assert exacto.';
}
function classifyOutcome(o){if(o.status==='skipped')return'skip';if(o.expected==='failed')return o.status==='passed'?'fixed':'known';return o.status==='passed'?'ok':'fail';}
function rowReason(st,o){
 if(st==='fail')return friendlyError(o);
 if(st==='known')return'Bug conocido confirmado: el problema sigue presente, tal como se esperaba. NO es regresión — la suite lo vigila para avisarte el día que se arregle.';
 if(st==='fixed')return'¡Un bug conocido se arregló! Esta prueba debía fallar y ahora pasa. Toca cerrar el ticket.';
 if(st==='flaky')return'Falló al primer intento y pasó al reintentar (flaky). Suele ser timing o hidratación de Qwik bajo carga, no regresión — pero si se repite, endurece el selector.';
 return'';
}
function fmtMs(ms){return ms>=1000?(ms/1000).toFixed(1)+'s':ms+'ms';}
function fillRow(li,st,o){
 li.className='trow is-'+st;li.innerHTML='';
 var h=humanTitle(o);
 var dot=document.createElement('span');dot.className='tdot';li.appendChild(dot);
 var tt=document.createElement('span');tt.className='tt';
 if(h.suite){var sp=document.createElement('span');sp.className='ts';sp.textContent=h.suite;tt.appendChild(sp);}
 tt.appendChild(document.createTextNode(h.title));
 var reason=rowReason(st,o);if(reason){var rs=document.createElement('span');rs.className='treason';rs.textContent=reason;tt.appendChild(rs);}
 li.appendChild(tt);
 var ms=document.createElement('span');ms.className='tms';ms.textContent=o.ms?fmtMs(o.ms):'';li.appendChild(ms);
 if(o.error&&(st==='fail'||st==='known'||st==='flaky')){
  li.classList.add('has-err');
  var err=document.createElement('div');err.className='terr';
  var lbl=document.createElement('div');lbl.className='terr-lbl';lbl.textContent='Detalle técnico (Playwright)';err.appendChild(lbl);
  var raw=document.createElement('div');raw.className='terr-raw';raw.textContent=o.error;err.appendChild(raw);li.appendChild(err);
 }
}
function makeRow(liveEl,st,o){
 var li=document.createElement('li');
 li.addEventListener('click',function(){if(li.classList.contains('has-err'))li.classList.toggle('open');});
 fillRow(li,st,o);
 var L=liveEl.querySelector('[data-tlist]');if(L){L.appendChild(li);L.scrollTop=L.scrollHeight;}
 return li;
}
function countInc(liveEl,st){liveEl['_'+st]=(liveEl['_'+st]||0)+1;}
function countDec(liveEl,st){liveEl['_'+st]=Math.max(0,(liveEl['_'+st]||0)-1);}
function greenCount(liveEl){return (liveEl._ok||0)+(liveEl._known||0)+(liveEl._fixed||0)+(liveEl._flaky||0);}
function dashEvent(liveEl,o){
 if(!liveEl||liveEl._mode!=='tests')return;
 if(o.ev==='start'){liveEl._total=(liveEl._total||0)+(o.total||0);updProg(liveEl);syncLivebar(liveEl);return;}
 if(o.ev==='begin'){var h=humanTitle(o);setNow(liveEl,'Probando: '+(h.title||h.suite),h.suite);syncLivebar(liveEl);return;}
 if(o.ev==='end'){
  var key=(o.suite||'')+' >>> '+(o.title||'');
  liveEl._rows=liveEl._rows||{};
  var prev=liveEl._rows[key],st=classifyOutcome(o);
  if(prev){
   if(prev.st==='fail'&&st==='ok')st='flaky';
   var dispO={suite:o.suite,title:o.title,ms:o.ms,expected:o.expected,status:o.status,outcome:o.outcome,error:o.error||(prev.o&&prev.o.error)||''};
   countDec(liveEl,prev.st);fillRow(prev.li,st,dispO);prev.st=st;prev.o=dispO;
  }else{liveEl._done++;var li=makeRow(liveEl,st,o);prev=liveEl._rows[key]={li:li,st:st,o:o};}
  countInc(liveEl,st);updProg(liveEl);syncLivebar(liveEl);
 }
}
function liveLine(liveEl,text){
 if(!liveEl||!liveEl.classList.contains('show'))return;
 if(liveEl._mode==='tests')return;
 var now=ahoraTexto(text),flow=liveEl._flow,steps=FLOWS[flow];
 if(steps){
  for(var i=steps.length-1;i>liveEl._idx;i--){
   if(steps[i].re.test(text)){
    var lis=liveEl.querySelectorAll('.live-steps li');
    for(var k=0;k<lis.length;k++){lis[k].classList.remove('active');if(k<i)lis[k].classList.add('done');else lis[k].classList.remove('done');}
    if(lis[i])lis[i].classList.add('active');liveEl._idx=i;if(!now)now=steps[i].t;break;
   }
  }
 }
 if(/^\\s*✓|✓\\s+\\d+|\\bok\\b/i.test(text))liveEl._n++;
 var nowEl=liveEl.querySelector('[data-now]'),subEl=liveEl.querySelector('[data-sub]');
 if(nowEl&&now)nowEl.childNodes[0].nodeValue=now;
 if(subEl&&!steps&&liveEl._n>0)subEl.textContent=liveEl._n+' verificación(es) OK';
 syncLivebar(liveEl);
}
function liveDone(liveEl,state,msg){
 if(!liveEl||!liveEl.classList.contains('show'))return;
 liveEl.classList.remove('is-run','is-ok','is-err','is-skip');liveEl.classList.add('is-'+state);
 var spin=liveEl.querySelector('.live-spin');if(spin)spin.textContent={ok:'✓',err:'✗',skip:'!'}[state]||'';
 var nowEl=liveEl.querySelector('[data-now]');if(nowEl)nowEl.childNodes[0].nodeValue=msg||{ok:'Listo',err:'Falló',skip:'Omitido'}[state];
 if(state==='ok'){var lis=liveEl.querySelectorAll('.live-steps li');for(var k=0;k<lis.length;k++){lis[k].classList.remove('active');lis[k].classList.add('done');}}
 if(liveEl._mode==='tests'){
  var subEl=liveEl.querySelector('[data-sub]');
  if(subEl){var txt=greenCount(liveEl)+' en pie · '+(liveEl._fail||0)+' rotos · '+(liveEl._skip||0)+' omitidos';
   if(liveEl._flaky)txt+=' · '+liveEl._flaky+' flaky';if(liveEl._known)txt+=' · '+liveEl._known+' bug(s) vigilado(s)';if(liveEl._fixed)txt+=' · ¡'+liveEl._fixed+' arreglado(s)!';subEl.textContent=txt;}
 }
 var b=byId('livebar');
 if(b&&!b.hasAttribute('hidden')){b.className='livebar is-'+state;syncLivebar(liveEl);var sp2=b.querySelector('.lb-spin');if(sp2)sp2.textContent={ok:'✓',err:'✗',skip:'!'}[state]||'';byId('lbNow').textContent=msg||{ok:'Listo',err:'Falló',skip:'Omitido'}[state];if(_lbHideT)clearTimeout(_lbHideT);_lbHideT=setTimeout(hideLivebar,4000);}
}
function triage(action,log){
  var fails=[],re=/[✘✗×]\\s+\\d+\\s+.*?›\\s*([^\\n]+)/g,m;
  while((m=re.exec(log)))fails.push(m[1].replace(/\\(\\d+(\\.\\d+)?(ms|s)\\)\\s*$/,'').trim());
  var causa,pista,clase='regresion';
  if(/expected.*200|toBe\\(200\\)|net::ERR|ECONNREFUSED|response.*(4\\d\\d|5\\d\\d)/i.test(log)){
   causa='Ambiente: una URL no respondió 200.';clase='ambiente';pista='Suele ser un deploy a medias o infra caída, NO el sitio roto por dentro. Reintenta; si persiste, avisa a dev/infra.';
  }else if(/@content|renderiza contenido real/i.test(log)){
   causa='La página dio 200 pero no renderizó (faltó title o header).';clase='render';pista='Render roto REAL — title/header son lo más estable que hay. Revisa la hidratación (Qwik) de esa URL.';
  }else if(/Timed out.*(toBeVisible|toBeAttached|toBeEnabled)|waiting for|getByRole|getByText|locator\\(/i.test(log)){
   causa='Un elemento crítico esperado no apareció.';clase='regresion';pista='Los selectores son estables por diseño (rol/texto/href). Lo más probable es REGRESIÓN real. Si el cambio fue a propósito, actualiza el contract y haz commit.';
  }else if(/unexpected.*pass|expected to fail|fixme/i.test(log)){
   causa='Un bug conocido cambió de estado.';clase='baseline';pista='Si un test "bug conocido" PASÓ, el bug se arregló → ciérralo en el inventario.';
  }else{causa='Falló una verificación.';clase='otro';pista='Abre el detalle técnico para ver el error exacto.';}
  return {fails:fails,causa:causa,pista:pista,clase:clase};
}
// Triage amigable para self-update: traduce errores de git/npm a lenguaje QA.
function selfUpdateTriage(log){
  var causa,pista,clase='otro';
  if(/fatal:.*not a git repository/i.test(log)){
   causa='Esta carpeta no es un repositorio git.';clase='ambiente';pista='El panel se instaló copiando archivos en vez de usar git clone. Reinstálalo siguiendo la guía (git clone …).';
  }else if(/Could not resolve host|unable to access|Failed to connect|network|timeout|ETIMEDOUT|ECONNREFUSED|ENOTFOUND/i.test(log)){
   causa='No hay conexión a internet o GitHub no responde.';clase='ambiente';pista='Revisa tu conexión a internet y vuelve a intentar. Si tienes VPN, asegúrate de que esté activa. Si el problema sigue, GitHub puede estar caído — espera unos minutos.';
  }else if(/Please commit your changes|Your local changes|merge conflict|CONFLICT/i.test(log)){
   causa='Hay cambios locales que chocan con la actualización.';clase='conflicto';pista='Algún archivo del panel se modificó localmente. Resuélvelo con git (guarda o descarta esos cambios) y reintenta. El panel sigue funcionando con la versión actual.';
  }else if(/Permission denied|could not lock/i.test(log)){
   causa='Otro programa está usando los archivos del panel.';clase='bloqueo';pista='Cierra otras terminales, editores (VS Code) o ventanas que tengan abierta esta carpeta. Luego vuelve a intentar.';
  }else if(/npm ERR|npm install.*failed/i.test(log)){
   causa='npm install falló al instalar dependencias.';clase='instalacion';pista='Puede ser falta de espacio en disco, problema de red con el registro npm, o una dependencia rota. Reintenta; si persiste, abre el detalle del error abajo.';
  }else{causa='La actualización falló por un problema inesperado.';pista='Abre "ver detalle de actualización" abajo para ver el error exacto.';}
  return {fails:[],causa:causa,pista:pista,clase:clase};
}
function liveTriage(liveEl,t,skipped,why){
 if(!liveEl)return;
 var box=document.createElement('div');box.className='triage';var html='';
 if(skipped){
  html+='<div class="row"><span class="k">Qué pasó</span><span class="v">La corrida no verificó nada (<b>'+skipped+' omitido(s)</b>).</span></div>';
  var por=(why==='auth')?'Esta área necesita sesión B2C (<code>rotoplas-auth-b2c.json</code>). Sin sesión sus tests <b>@auth</b> se omiten — no es fallo del sitio.':'Probablemente faltó el App Password (Modo A) o no había nada que correr. <b>El verde NO significaría "OK"</b> → por eso es ámbar.';
  html+='<div class="row"><span class="k">Por qué</span><span class="v">'+por+'</span></div>';
  if(why==='auth'&&ENV==='qa')html+='<div class="row"><span class="k"></span><span class="v"><button class="btn-sec" id="btnRegenAuth" type="button"><svg viewBox="0 0 24 24"><path d="M21 12a9 9 0 1 1-3-6.7M21 4v5h-5"/></svg>Regenerar sesión B2C ahora</button></span></div>';
 }else{
  if(t.fails.length)html+='<div class="row"><span class="k">Qué falló</span><span class="v fail">'+t.fails.slice(0,3).join('<br>')+'</span></div>';
  html+='<div class="row"><span class="k">Causa probable</span><span class="v"><b>'+t.causa+'</b></span></div>';
  html+='<div class="row"><span class="k">Qué hacer</span><span class="v">'+t.pista+'</span></div>';
 }
 box.innerHTML=html;liveEl.appendChild(box);
 var rb=box.querySelector('#btnRegenAuth');if(rb)rb.addEventListener('click',regenAuth);
}
// Genera la sesión B2C en contexto (cuando un área @auth se omitió por sesión faltante),
// sin ir al modal de Ajustes. Reusa la acción gen-auth-b2c y refresca el semáforo al terminar.
function regenAuth(){
 if(running)return;
 runOne({action:'gen-auth-b2c',stId:null,liveId:'live-map',logId:'log-map',flow:'',label:'Generar sesión B2C',onDone:function(s){if(s!=='err')loadPrereq();}});
}
function veredicto(d){var s=d.summary||{};if(d.code!==0||s.failed>0)return'err';if(s.passed===0&&s.skipped>0)return'skip';return'ok';}

// ─── Motor de corrida (SSE) — unificado ──────────────────────────────────────
function startRun(cfg){
 // cfg: {action, area, tipo, pago, order, stateValue, stId, liveId, flow, isMaster, queued, onDone}
 var stEl=cfg.stId?byId(cfg.stId):null;
 var liveEl=cfg.liveId?byId(cfg.liveId):null;
 var logEl=cfg.logId?byId(cfg.logId):null;
 if(logEl&&!cfg.queued)logEl.textContent='';
 if(liveEl)liveStart(liveEl,cfg.flow);
 if(cfg.isMaster){setMaster('run');}
 else setPill(stEl,'run');
 var runLog='',capturedOrder='';
 var headed=byId('headed').checked?'1':'0';
 var qs='/stream?action='+encodeURIComponent(cfg.action)+'&headed='+headed+'&env='+encodeURIComponent(ENV);
 if(cfg.area)qs+='&area='+encodeURIComponent(cfg.area);
 if(cfg.tipo)qs+='&tipo='+encodeURIComponent(cfg.tipo);
 if(cfg.pago)qs+='&pago='+encodeURIComponent(cfg.pago);
 if(cfg.order)qs+='&order='+encodeURIComponent(cfg.order);
 if(cfg.stateValue)qs+='&state='+encodeURIComponent(cfg.stateValue);
 var es=new EventSource(qs);
 activeES=es;activeStId=cfg.stId||null;activeLiveEl=liveEl;   // para Cancelar
 es.addEventListener('meta',function(e){var d=JSON.parse(e.data);if(logEl)logLine(logEl,'$ '+d.pretty+(d.headed==='1'||d.headed===true?'   (con ventana)':'   (sin ventana)'),'cmd');});
 es.addEventListener('line',function(e){
  var d=JSON.parse(e.data);if(d.text==='')return;
  if(d.text.indexOf('@@DASH ')===0){try{dashEvent(liveEl,JSON.parse(d.text.slice(7)));}catch(_){}return;}
  runLog+=d.text+'\\n';if(logEl)logLine(logEl,d.text,d.stream==='err'?'e':classify(d.text));liveLine(liveEl,d.text);
  var mo=d.text.match(/CAPA2_ORDER=([A-Za-z0-9]{5,24})/)||d.text.match(/orden creada:\\s*([A-Za-z0-9]{5,24})/i);
  if(mo)capturedOrder=mo[1];
 });
  es.addEventListener('done',function(e){
   var d=JSON.parse(e.data);timerStop(liveEl);var state=veredicto(d);
   if(cfg.isMaster){/* el master agrega su propio veredicto al final */}
   else setPill(stEl,state);
   liveDone(liveEl,state,veredictoMsg(cfg.flow,state,d));
   // ── Self-update: triage amigable para QA no técnico ──────────────
   if(cfg.action==='self-update'){
     if(state==='err'){
       var tr2=selfUpdateTriage(runLog);
       liveTriage(liveEl,tr2,0);
     }
     // Siempre mostrar el detalle y log tras un update (éxito o fallo).
     var dt=byId('detalle-update')||document.querySelector('.detalle[data-target="log-update"]');
     var lg=byId('log-update');
     if(dt)dt.style.display=''; if(lg)lg.style.display='';
     // Éxito → reinicia el server para cargar el código recién bajado. El
     // live-reload recarga la página sola. Vero no toca la terminal.
     if(state!=='err'){liveDone(liveEl,state,'Actualizado. Reiniciando el panel para aplicar los cambios…');setTimeout(restartPanel,1000);}
   }
   if(state==='err'&&cfg.action!=='self-update'){
    var tr=triage(cfg.action,runLog);
    if(liveEl&&liveEl._mode==='tests'&&liveEl._rows){var rf=Object.keys(liveEl._rows).map(function(k){return liveEl._rows[k];}).filter(function(r){return r.st==='fail';});if(rf.length)tr.fails=rf.slice(0,4).map(function(r){var h=humanTitle(r.o);return (h.suite?h.suite+' › ':'')+h.title;});}
    liveTriage(liveEl,tr,0);
   }else if(state==='skip')liveTriage(liveEl,null,(d.summary&&d.summary.skipped)||1,cfg.auth?'auth':'');
  if(cfg.action==='crear-orden'&&capturedOrder&&state!=='err')showOrder(capturedOrder,true);
  byId('lastRun').textContent=' · Última: '+new Date().toLocaleTimeString('es-MX',{hour:'2-digit',minute:'2-digit'});
  recordRun(cfg.action,state,d.summary,{stId:cfg.stId,label:cfg.label||ACT_LABEL[cfg.action]||cfg.action});
  es.close();activeES=null;activeStId=null;activeLiveEl=null;
  if(cfg.onDone)cfg.onDone(state,capturedOrder);
 });
 es.onerror=function(){
  if(cancelled){es.close();return;}              // cierre por Cancelar: no es un error real
  timerStop(liveEl);if(!cfg.isMaster)setPill(stEl,'err');
  liveDone(liveEl,'err','Se cortó la conexión con el panel');
  liveTriage(liveEl,{fails:[],causa:'Se cortó la conexión con el panel (SSE).',pista:'¿El servidor del panel sigue activo? Revisa la terminal de npm run dashboard.',clase:'otro'},0);
  es.close();activeES=null;activeStId=null;activeLiveEl=null;if(cfg.onDone)cfg.onDone('err','');
 };
}
function veredictoMsg(flow,state,d){
  if(state==='skip')return'Se omitió: nada verificado';
  if(state==='err')return'Algo falló — mira el detalle';
  if(flow==='orden'||flow==='capa2')return'¡Listo! Flujo completado como un usuario real';
  if(flow==='actualizar')return'Panel actualizado. Si ves cosas raras, recarga la página (F5).';
  return'Todo en pie';
}
// Expande la sección que contiene el panel en vivo de una corrida → su resultado
// nunca queda oculto bajo una sección colapsada (las secciones arrancan colapsadas).
function expandFor(cfg){
 var liveEl=cfg&&cfg.liveId?byId(cfg.liveId):null;
 var block=liveEl&&liveEl.closest?liveEl.closest('.block'):null;
 if(block&&block.classList.contains('collapsed'))setCollapsed(block,false);
}
// Refresca la galería si el bloque de evidencias está abierto (tras una corrida).
function refreshEvidIfOpen(){var b=byId('evidBlock');if(b&&!b.classList.contains('collapsed'))loadEvidencias();}
// Corrida simple (una celda / un botón)
function runOne(cfg){if(running)return;expandFor(cfg);setBusy(true);var done=cfg.onDone;cfg.onDone=function(s,o){setBusy(false);refreshEvidIfOpen();maybeNotify(cfg.label||ACT_LABEL[cfg.action]||cfg.action,s);if(done)done(s,o);};startRun(cfg);}
// Cola secuencial (área completa / master)
function runQueue(list,opts){
 if(running||!list.length)return;opts=opts||{};expandFor(list[0]);setBusy(true);
 if(opts.isMaster)setMaster('run');
 var worst='ok',i=0;
 function next(){
  if(cancelled)return;                       // Cancelar detuvo la cola (setBusy ya se llamó)
  if(i>=list.length){setBusy(false);refreshEvidIfOpen();if(opts.isMaster){setMaster(worst);}maybeNotify(opts.isMaster?'Revisar sitio':'Corrida por área',worst);if(opts.onAll)opts.onAll(worst);return;}
  var cfg=list[i++];cfg.queued=true;
  cfg.onDone=function(state){if(state==='err')worst='err';else if(state==='skip'&&worst!=='err')worst='skip';next();};
  startRun(cfg);
 }
 next();
}

// ─── Mapa por área ────────────────────────────────────────────────────────────
var DIMS=[
 {key:'responde',label:'Responde'},
 {key:'estructura',label:'Estructura'},
 {key:'flujo',label:'Flujo'},
 {key:'movil',label:'Móvil'}
];
function cellCfg(area,dim){
 // Devuelve la config de corrida para una celda, o null si no es corrible (⏳/—/na).
 if(dim==='responde'){if(!area.responde)return null;return {action:'area-responde',area:area.key,stId:'p-'+area.key+'-responde',liveId:'live-map',logId:'log-map',flow:'checks',auth:area.auth,label:'Responde · '+area.label};}
 if(dim==='estructura'){return {action:'area',area:area.key,stId:'p-'+area.key+'-estructura',liveId:'live-map',logId:'log-map',flow:'checks',auth:area.auth,label:'Estructura · '+area.label};}
 if(dim==='flujo'){if(!area.flujo)return null;return {action:area.flujo,stId:'p-'+area.key+'-flujo',liveId:'live-map',logId:'log-map',flow:'checks',auth:area.auth,label:'Flujo · '+area.label};}
 if(dim==='movil'){if(!area.movil)return null;return {action:'area-movil',area:area.key,stId:'p-'+area.key+'-movil',liveId:'live-map',logId:'log-map',flow:'checks',auth:area.auth,label:'Móvil · '+area.label};}
 return null;
}
function cellValText(area,dim){
 if(dim==='responde')return area.responde?(area.respondeCount+' URL'+(area.respondeCount!==1?'s':'')):'—';
 if(dim==='estructura')return area.files.join(' · ');
 if(dim==='flujo')return area.flujo?(area.flujoLabel||'mutante 🔒'):'⏳ pendiente';
 if(dim==='movil')return area.movil?(area.movilLabel||'375px'):'⏳ parqueado';
 return '⏳ parqueado';
}
// Detalle descriptivo del área: QUÉ prueba cada dimensión y SOBRE QUÉ URLs/specs,
// para entenderlo ANTES de correr. Se muestra al expandir el área.
function buildAreaDetail(a){
 var d=document.createElement('div');d.className='area-detail';
 function blk(titulo,tag,muted){
  var b=document.createElement('div');b.className='adblock'+(muted?' muted':'');
  var hh=document.createElement('div');hh.className='adh';hh.appendChild(document.createTextNode(titulo));
  if(tag){var t=document.createElement('span');t.className='adtag';t.textContent=tag;hh.appendChild(t);}
  b.appendChild(hh);var body=document.createElement('div');body.className='adbody';b.appendChild(body);d.appendChild(b);return body;
 }
 // Responde — lista las URLs reales que se piden (200 + render).
 var rBody=blk('Responde','200 + renderiza',!a.responde);
 if(a.responde&&a.respondeUrls&&a.respondeUrls.length){
  var ul=document.createElement('ul');ul.className='adurls';
  a.respondeUrls.forEach(function(u){
   var li=document.createElement('li');
   var n=document.createElement('span');n.className='un';n.textContent=u.nombre;
   var p=document.createElement('span');p.className='up';p.textContent=u.path;
   li.appendChild(n);li.appendChild(p);ul.appendChild(li);
  });
  rBody.appendChild(ul);
 } else { rBody.textContent='El cascarón global se verifica en TODA página; no tiene URL propia.'; }
 // Estructura — qué specs y qué comprueban.
 blk('Estructura','elementos críticos').textContent=
   'Comprueba que los elementos clave existan (que no desaparecieron). Specs: '+a.files.join(' · ');
 // Flujo — efecto real.
 blk('Flujo','hace lo que promete',!a.flujo).textContent=
   a.flujo?((a.flujoLabel||'flujo')+(a.lock?' · muta datos reales (QA-only 🔒)':'')):'Sin prueba aún (pendiente).';
 // Móvil.
 blk('Móvil','375px',!a.movil).textContent=
   a.movil?(a.movilLabel||'misma estructura a 375px'):'Parqueado (sin prueba móvil).';
 return d;
}
function buildMap(areas){
 var host=byId('map');if(!host)return;host.innerHTML='';
 areas.forEach(function(a){
  AREA_LABELS[a.key]=a.label;
  var row=document.createElement('div');row.className='maprow collapsed'; // siempre colapsada al cargar
  var h=document.createElement('div');h.className='maprow-h';
  var chev=document.createElement('span');chev.className='mchev';chev.innerHTML='<svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>';h.appendChild(chev);
  var nmWrap=document.createElement('div');nmWrap.className='anmwrap';
  var nm=document.createElement('span');nm.className='anm';nm.textContent=a.label;
  if(a.lock){var lk=document.createElement('span');lk.className='lock';lk.textContent='🔒';nm.appendChild(lk);}
  nmWrap.appendChild(nm);
  if(a.desc){var dsc=document.createElement('span');dsc.className='adesc';dsc.textContent=a.desc;nmWrap.appendChild(dsc);}
  h.appendChild(nmWrap);
  var sp=document.createElement('span');sp.className='sp';h.appendChild(sp);
  // Botón "correr área" = sus dimensiones de lectura (Responde + Estructura + Móvil).
  var rb=document.createElement('button');rb.className='btn-sec';rb.setAttribute('data-cell','area-read');rb.setAttribute('data-area',a.key);
  rb.innerHTML='<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>Correr área';
  rb.addEventListener('click',function(ev){ev.stopPropagation();row.classList.remove('collapsed');runAreaRead(a.key);});
  h.appendChild(rb);
  // Clic en el encabezado expande/colapsa el área (no cuando se pulsa "Correr área").
  h.addEventListener('click',function(){row.classList.toggle('collapsed');});
  row.appendChild(h);
  var cells=document.createElement('div');cells.className='cells';
  DIMS.forEach(function(dim){
   var cfg=cellCfg(a,dim.key);
   var cell=document.createElement('button');cell.className='cell';
   var pid='p-'+a.key+'-'+dim.key;
   var pill=document.createElement('span');pill.className='pill';pill.id=pid;
   var dot=document.createElement('span');dot.className='d';pill.appendChild(dot);
   var dimEl=document.createElement('span');dimEl.className='cdim';dimEl.textContent=dim.label;
   var valEl=document.createElement('span');valEl.className='cval';valEl.textContent=cellValText(a,dim.key);
   cell.appendChild(pill);cell.appendChild(dimEl);cell.appendChild(valEl);
   var runnable=!!cfg;
   if(dim.key==='responde'&&!a.responde){cell.classList.add('is-na');cell.disabled=true;setPill(pill,'idle');}
   else if(dim.key==='movil'&&!a.movil){cell.classList.add('is-pend');cell.disabled=true;setPill(pill,'pend');cell.title='Móvil 375px parqueado en esta área. Ver tests/COBERTURA.md';}
   else if(dim.key==='flujo'&&!a.flujo){cell.classList.add('is-pend');cell.disabled=true;setPill(pill,'pend');cell.title='Flujo aún sin prueba. Ver tests/COBERTURA.md';}
   else{setPill(pill,'idle');
    if(dim.key==='flujo'&&a.lock)cell.classList.add('is-flujolock'); // candado solo si muta
    cell.setAttribute('data-cell',dim.key);cell.setAttribute('data-area',a.key);
    if(cfg.action)cell.setAttribute('data-cellaction',cfg.action);
    cell.title=(a.lock&&dim.key==='flujo'?'Flujo mutante 🔒 (QA-only) — ':'')+dim.label+': '+cellValText(a,dim.key);
    (function(c){c.addEventListener('click',function(){runOne(cfg);});})(cell);
   }
   cells.appendChild(cell);
  });
  row.appendChild(cells);row.appendChild(buildAreaDetail(a));host.appendChild(row);
 });
 restorePills();renderSalud();renderCobertura();
 if(ENV==='prod')applyEnv('prod');
}
function runAreaRead(key){
 var a=AREAS.filter(function(x){return x.key===key;})[0];if(!a)return;
 var list=[];var r=cellCfg(a,'responde');if(r)list.push(r);var e=cellCfg(a,'estructura');if(e)list.push(e);var m=cellCfg(a,'movil');if(m)list.push(m);
 runQueue(list,{});
}
function runMaster(){
 // Lectura de TODAS las áreas: Responde + Estructura. Enciende cada celda.
 var list=[];
 AREAS.forEach(function(a){var r=cellCfg(a,'responde');if(r)list.push(r);var e=cellCfg(a,'estructura');if(e)list.push(e);var m=cellCfg(a,'movil');if(m)list.push(m);});
 runQueue(list,{isMaster:true});
}
byId('btnMaster').addEventListener('click',runMaster);

// ─── Resumen global ───────────────────────────────────────────────────────────
function renderSalud(){
 var el=byId('sumSalud');if(!el)return;
 var ok=0,err=0,skip=0;
 var pills=document.querySelectorAll('#map .pill');
 for(var i=0;i<pills.length;i++){var c=pills[i];if(c.classList.contains('is-ok'))ok++;else if(c.classList.contains('is-err'))err++;else if(c.classList.contains('is-skip'))skip++;}
 el.innerHTML='<span class="sc ok"><span class="d"></span>'+ok+'</span><span class="sc err"><span class="d"></span>'+err+'</span><span class="sc skip"><span class="d"></span>'+skip+'</span>';
}
function renderCobertura(){
 var withTest=0,total=0,pend=0;
 AREAS.forEach(function(a){
  // Responde: cuenta solo si el área tiene URLs (cascarón no → "—", no cuenta).
  if(a.responde){total++;withTest++;}
  total++;withTest++; // estructura (todas tienen)
  total++;if(a.flujo)withTest++;else pend++; // flujo
  total++;if(a.movil)withTest++;else pend++; // movil
 });
 byId('sumCobNum').textContent=withTest+'/'+total+' celdas';
 byId('sumCob').innerHTML='<span class="sc ok"><span class="d"></span>'+withTest+' con prueba</span><span class="sc pend"><span class="d"></span>'+pend+' ⏳</span>';
}

// ─── Exportar resumen a Markdown (pegar en Jira/Slack) ────────────────────────
// Símbolo de una celda: lee el pill ya pintado + el estado estructural conocido (—/⏳).
function dimSym(a,dim){
 if(dim==='responde'&&!a.responde)return '—';
 if(dim==='flujo'&&!a.flujo)return '⏳';
 if(dim==='movil'&&!a.movil)return '⏳';
 var p=byId('p-'+a.key+'-'+dim);
 if(p){if(p.classList.contains('is-ok'))return '✓';if(p.classList.contains('is-err'))return '✗';if(p.classList.contains('is-skip'))return '○';if(p.classList.contains('is-run'))return '…';}
 return '·'; // sin correr en esta sesión
}
function buildMarkdown(){
 var envLabel=(ENV==='prod')?'Producción':'QA';
 var ok=0,err=0,skip=0,pills=document.querySelectorAll('#map .pill');
 for(var i=0;i<pills.length;i++){var c=pills[i];if(c.classList.contains('is-ok'))ok++;else if(c.classList.contains('is-err'))err++;else if(c.classList.contains('is-skip'))skip++;}
 var L=[];
 L.push('## Panel QA B2C — '+envLabel+' — '+new Date().toLocaleString('es-MX'));
 L.push('');
 L.push('**Salud:** ✓ '+ok+' · ✗ '+err+' · ○ '+skip+'   ·   **Cobertura:** '+byId('sumCobNum').textContent);
 L.push('');
 L.push('| Área | Responde | Estructura | Flujo | Móvil |');
 L.push('|---|:--:|:--:|:--:|:--:|');
 var fails=[];
 AREAS.forEach(function(a){
  var r=dimSym(a,'responde'),e=dimSym(a,'estructura'),f=dimSym(a,'flujo'),m=dimSym(a,'movil');
  L.push('| '+a.label+(a.lock?' 🔒':'')+' | '+r+' | '+e+' | '+f+' | '+m+' |');
  [['Responde',r],['Estructura',e],['Flujo',f],['Móvil',m]].forEach(function(p){if(p[1]==='✗')fails.push(a.label+' › '+p[0]);});
 });
 if(fails.length){L.push('');L.push('### Fallos');fails.forEach(function(x){L.push('- **'+x+'**');});}
 L.push('');
 L.push('_Leyenda: ✓ ok · ✗ falla · ○ omitido (sesión) · ⏳ pendiente · — no aplica · · sin correr_');
 return L.join('\\n');
}
function exportMarkdown(){
 var md=buildMarkdown();
 var done=function(msg){var b=byId('btnExportMd');if(!b)return;var prev=b.textContent;b.textContent=msg;setTimeout(function(){b.textContent=prev;},1800);};
 if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(md).then(function(){done('✓ copiado');}).catch(function(){done('descargado');dlMarkdown(md);});}
 else{dlMarkdown(md);done('descargado');}
}
function dlMarkdown(md){try{var blob=new Blob([md],{type:'text/markdown'});var u=URL.createObjectURL(blob);var a=document.createElement('a');a.href=u;a.download='qa-b2c-resumen.md';document.body.appendChild(a);a.click();document.body.removeChild(a);setTimeout(function(){URL.revokeObjectURL(u);},2000);}catch(_){}}

// ─── Historial ────────────────────────────────────────────────────────────────
var HIST_KEY='dashHistoryV2',LAST_KEY='dashLastV2',HIST_MAX=15;
var ACT_LABEL={'area-responde':'Responde','area':'Estructura','purchase':'Compra E2E','login-check':'Login','forms-email':'Forms+correo','crear-orden':'Crear pedido','capa2-auto':'Pipeline correos','order-status':'estado','order-payments':'pagos','order-messages':'historial','move-state':'mover estado','check-imap':'IMAP','gen-auth-b2c':'Generar sesión'};
function loadHist(){try{return JSON.parse(localStorage.getItem(HIST_KEY))||[];}catch(_){return[];}}
function saveHist(a){try{localStorage.setItem(HIST_KEY,JSON.stringify(a.slice(0,HIST_MAX)));}catch(_){}}
function lastByPill(){try{return JSON.parse(localStorage.getItem(LAST_KEY))||{};}catch(_){return{};}}
function fmtTime(ts){return new Date(ts).toLocaleTimeString('es-MX',{hour:'2-digit',minute:'2-digit'});}
function resWord(e){if(e.state==='ok')return e.ok!=null?('✓ '+e.ok+' en pie'):'✓ OK';if(e.state==='err')return e.fail!=null?('✘ '+e.fail+' rotos'):'✘ falló';if(e.state==='skip')return '– omitido';return e.state||'';}
function recordRun(action,state,summary,opts){
 opts=opts||{};
 var e={ts:Date.now(),action:action,label:opts.label||ACT_LABEL[action]||action,state:state};
 if(summary){e.ok=summary.passed;e.fail=summary.failed;e.skip=summary.skipped;}
 var a=loadHist();a.unshift(e);saveHist(a);renderHist();
 var stId=opts.stId;if(!stId)return;
 var last=lastByPill();last[stId]={state:state,ts:e.ts};try{localStorage.setItem(LAST_KEY,JSON.stringify(last));}catch(_){}
}
function renderHist(){
 var list=byId('histList');if(!list)return;var a=loadHist();
 if(!a.length){list.className='hist empty';list.innerHTML='<li>Aún no hay corridas registradas.</li>';return;}
 list.className='hist';list.innerHTML='';
 for(var i=0;i<a.length;i++){var e=a[i],st=e.state||'idle';
  var li=document.createElement('li');li.className='is-'+st;
  var dot=document.createElement('span');dot.className='hdot';li.appendChild(dot);
  var lbl=document.createElement('span');lbl.className='hlbl';lbl.textContent=e.label;li.appendChild(lbl);
  var res=document.createElement('span');res.className='hres';res.textContent=resWord(e);li.appendChild(res);
  var tm=document.createElement('span');tm.className='htime';tm.textContent=fmtTime(e.ts);li.appendChild(tm);
  list.appendChild(li);
 }
}
function restorePills(){
 var last=lastByPill();
 for(var stId in last){if(!last.hasOwnProperty(stId))continue;var pill=byId(stId);if(!pill)continue;
  setPill(pill,last[stId].state);pill.title='Última corrida: '+new Date(last[stId].ts).toLocaleString('es-MX');}
}
byId('histClear').addEventListener('click',function(){try{localStorage.removeItem(HIST_KEY);localStorage.removeItem(LAST_KEY);}catch(_){}renderHist();});
renderHist();

// ─── Datos de prueba: pedido + línea de tiempo ────────────────────────────────
var ORDER_KEY='dashOrderV2';
var TL_STEPS=[
 {key:'creada',label:'Creada',email:'Tu pedido está en proceso',state:null},
 {key:'confirmada',label:'Confirmada',email:'Tu pedido fue confirmado',state:'order:Confirmed'},
 {key:'camino',label:'En camino',email:'Tu pedido esta en camino',state:'ship:Shipped'},
 {key:'entrega',label:'Punto de entrega',email:'Tu pedido está en punto de entrega',state:'ship:Pending'},
 {key:'entregada',label:'Entregada',email:'Tu pedido fue entregado',state:null,gate:true}
];
function buildTimeline(){
 var host=byId('timeline');if(!host)return;host.innerHTML='';
 TL_STEPS.forEach(function(s,i){
  var step=document.createElement('div');step.className='tlstep'+(i===0?' done':'')+(s.gate?' gate':'');
  step.setAttribute('data-tl',s.key);
  var node=document.createElement('span');node.className='tlnode';node.textContent='✓';step.appendChild(node);
  var body=document.createElement('div');body.className='tlbody';
  var tlt=document.createElement('div');tlt.className='tlt';tlt.textContent=s.label;body.appendChild(tlt);
  var mail=document.createElement('div');mail.className='tlmail';mail.innerHTML='correo esperado: <b>"'+s.email+'"</b>';body.appendChild(mail);
  if(s.state){
   var btn=document.createElement('button');btn.className='btn-sec';btn.setAttribute('data-adv',s.state);btn.setAttribute('data-tlkey',s.key);
   btn.innerHTML='<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>Avanzar a "'+s.label+'"';
   btn.addEventListener('click',function(){advanceStep(s.state,s.key,this);});
   body.appendChild(btn);
  }else if(s.gate){var g=document.createElement('div');g.className='gatenote';g.textContent='✋ Gate manual: requiere portal B2B + imagen de prueba de entrega (irreproducible vía CT).';body.appendChild(g);}
  step.appendChild(body);host.appendChild(step);
 });
}
function advanceStep(stateValue,key,btn){
 var num=byId('ordBox').getAttribute('data-order');if(!num)return;
 runOne({action:'move-state',order:num,stateValue:stateValue,stId:'st-crear',liveId:'live-data',logId:'log-data',flow:'',label:'Mover → '+key,onDone:function(st){
  if(st!=='err'){var step=document.querySelector('[data-tl="'+key+'"]');if(step){step.classList.add('done');step.classList.remove('active');var nx=step.nextElementSibling;if(nx)nx.classList.add('active');}}
 }});
}
function showOrder(num,expand){
 if(!num)return;byId('ordNum').textContent=num;
 var box=byId('ordBox');box.classList.add('show');box.setAttribute('data-order',num);
 try{localStorage.setItem(ORDER_KEY,num);}catch(_){}
 buildTimeline();
}
byId('ordCopy').addEventListener('click',function(){var num=byId('ordBox').getAttribute('data-order')||'';if(!num)return;if(navigator.clipboard)navigator.clipboard.writeText(num);var b=this;b.textContent='copiado';setTimeout(function(){b.textContent='copiar';},1200);});
byId('ordInvestigar').addEventListener('click',function(){var num=byId('ordBox').getAttribute('data-order')||'';openDrawer(num);});
(function(){try{var n=localStorage.getItem(ORDER_KEY);if(n)showOrder(n,false);}catch(_){}})();

function syncPagoHint(){
 var tipo=byId('selTipo').value,pago=byId('selPago').value,h=byId('pagoHint'),msg='';
 if(tipo==='servicio'&&pago!=='credito'&&pago!=='debito')msg='El servicio solo admite tarjeta → se usará crédito.';
 else if(pago==='efectivo')msg='Efectivo disponible para montos < $5,000.';
 else if(pago==='transferencia')msg='Genera el pedido con instrucciones SPEI (sin tarjeta).';
 h.textContent=msg;
}
byId('selTipo').addEventListener('change',syncPagoHint);byId('selPago').addEventListener('change',syncPagoHint);syncPagoHint();

// ─── Botones data-action (datos de prueba + ajustes) ─────────────────────────
function wireActionButtons(){
 var btns=document.querySelectorAll('[data-action]');
 for(var i=0;i<btns.length;i++){(function(btn){
  if(btn._wired)return;btn._wired=true;
  btn.addEventListener('click',function(){
   var cfg={action:btn.getAttribute('data-action'),stId:btn.getAttribute('data-st'),liveId:btn.getAttribute('data-live'),logId:btn.getAttribute('data-log'),flow:btn.getAttribute('data-flow')||''};
   if(btn.getAttribute('data-opts')){cfg.tipo=byId('selTipo').value;cfg.pago=byId('selPago').value;}
   runOne(cfg);
  });
 })(btns[i]);}
}
wireActionButtons();

// ─── Detalle toggles + logs ocultos ──────────────────────────────────────────
document.addEventListener('click',function(ev){
 var t=ev.target.closest?ev.target.closest('.detalle'):null;if(!t)return;
 var el=byId(t.getAttribute('data-target'));if(!el)return;
 if(t.classList.contains('open')){t.classList.remove('open');el.style.display='none';}else{t.classList.add('open');el.style.display='block';}
});

// ─── Secciones colapsables (colapsadas por defecto; estado recordado) ────────
var COLLAPSE_KEY='dashCollapseV2';
function loadCollapse(){try{return JSON.parse(localStorage.getItem(COLLAPSE_KEY))||{};}catch(_){return{};}}
function saveCollapse(m){try{localStorage.setItem(COLLAPSE_KEY,JSON.stringify(m));}catch(_){}}
function setCollapsed(block,collapsed){
 if(!block)return;block.classList.toggle('collapsed',collapsed);
 var m=loadCollapse();m[block.id]=collapsed;saveCollapse(m);
}
(function initCollapse(){
 var saved=loadCollapse(),heads=document.querySelectorAll('.block-h[data-block]');
 for(var i=0;i<heads.length;i++){(function(h){
  var id=h.getAttribute('data-block'),block=byId(id);
  // Default = COLAPSADO (ya viene con la clase en el HTML); si el usuario lo abrió antes, respetarlo.
  if(saved.hasOwnProperty(id))block.classList.toggle('collapsed',!!saved[id]);
  h.addEventListener('click',function(){
   var nowCollapsed=!block.classList.contains('collapsed');
   setCollapsed(block,nowCollapsed);
   if(id==='evidBlock'&&!nowCollapsed)loadEvidencias(); // cargar al abrir
  });
 })(heads[i]);}
 // Si el bloque de evidencias quedó abierto (estado recordado), cargar al inicio.
 if(byId('evidBlock')&&!byId('evidBlock').classList.contains('collapsed'))loadEvidencias();
})();

// ─── Drawer Investigar ────────────────────────────────────────────────────────
function openDrawer(num){
 byId('scrim').classList.add('show');byId('drawer').classList.add('show');byId('drawer').setAttribute('aria-hidden','false');
 if(num)byId('invOrder').value=num;
 byId('invOut').classList.remove('show');byId('invOut').textContent='';byId('invEmailList').style.display='none';
}
function closeDrawer(){byId('scrim').classList.remove('show');byId('drawer').classList.remove('show');byId('drawer').setAttribute('aria-hidden','true');}
byId('drawerClose').addEventListener('click',closeDrawer);
byId('scrim').addEventListener('click',function(){closeDrawer();closeModal();});
function invQuery(action){
 if(running)return;var num=byId('invOrder').value.trim();if(!/^[A-Za-z0-9]{5,24}$/.test(num)){var o=byId('invOut');o.classList.add('show');o.textContent='Número de orden inválido.';return;}
 var out=byId('invOut');out.classList.add('show');out.textContent='';byId('invEmailList').style.display='none';
 setBusy(true);logLine(out,'› consultando '+(ACT_LABEL[action]||action)+' de '+num+'…','info');
 var es=new EventSource('/stream?action='+encodeURIComponent(action)+'&order='+encodeURIComponent(num)+'&env='+encodeURIComponent(ENV));
 es.addEventListener('line',function(e){var d=JSON.parse(e.data);if(d.text==='')return;logLine(out,d.text,d.stream==='err'?'e':classify(d.text));});
 es.addEventListener('done',function(){es.close();setBusy(false);});
 es.onerror=function(){logLine(out,'Se cortó la conexión.','e');es.close();setBusy(false);};
}
var invBtns=document.querySelectorAll('[data-inv]');for(var ib=0;ib<invBtns.length;ib++){(function(b){b.addEventListener('click',function(){invQuery(b.getAttribute('data-inv'));});})(invBtns[ib]);}
byId('invEmails').addEventListener('click',function(){
 if(running)return;var num=byId('invOrder').value.trim();var list=byId('invEmailList');
 setBusy(true);list.style.display='';list.className='emails';list.innerHTML='<li>Buscando…</li>';
 fetch('/emails'+(num?('?order='+encodeURIComponent(num)):'')).then(function(r){return r.json();}).then(function(d){
  if(d.mode==='A'){list.className='emails empty';list.innerHTML='<li>Modo A: abre el buzón de ventasecom a mano (Ajustes → link).</li>';}
  else if(d.error){list.className='emails empty';list.innerHTML='<li>'+d.error+'</li>';}
  else if(d.emails&&d.emails.length){list.innerHTML='';d.emails.forEach(function(m){var li=document.createElement('li');var su=document.createElement('span');su.className='su';su.textContent=m.subject||'(sin asunto)';var dt=document.createElement('span');dt.className='dt';dt.textContent=m.date?new Date(m.date).toLocaleString('es-MX'):'';li.appendChild(su);li.appendChild(dt);list.appendChild(li);});}
  else{list.className='emails empty';list.innerHTML='<li>Sin correos de ventasecom en las últimas 2 horas.</li>';}
  setBusy(false);
 }).catch(function(){list.className='emails empty';list.innerHTML='<li>Error al leer el buzón.</li>';setBusy(false);});
});

// ─── Modal Ajustes ────────────────────────────────────────────────────────────
function openModal(){byId('modal').classList.add('show');byId('scrim').classList.add('show');}
function closeModal(){byId('modal').classList.remove('show');if(!byId('drawer').classList.contains('show'))byId('scrim').classList.remove('show');}
byId('btnSettings').addEventListener('click',openModal);
byId('modalClose').addEventListener('click',closeModal);
document.addEventListener('keydown',function(e){if(e.key==='Escape'){closeDrawer();closeModal();}});

// ─── Reinicio del panel + live-reload ───────────────────────────────────────────
// restartPanel(): pide al server re-ejecutarse. El live-reload recarga la página
// sola cuando el nuevo server está arriba (BOOT_ID distinto) → ves el código nuevo
// sin F5 ni tocar la terminal. Lo usa el botón Reiniciar y el final de Actualizar.
var _restarting=false;
function restartPanel(){
 if(_restarting)return; _restarting=true;
 var b=byId('btnRestart'); if(b)b.classList.add('spin');
 fetch('/restart',{method:'POST'}).catch(function(){/* el server cae al reiniciar: esperado */});
 setTimeout(function(){location.reload();},8000); // red de seguridad si el live-reload no dispara
}
byId('btnRestart').addEventListener('click',restartPanel);

// Live-reload: escucha el BOOT_ID del server por SSE. Si cambia (server reinició),
// recarga la página. EventSource reconecta solo tras la caída del reinicio.
(function(){
 var boot=null;
 var es=new EventSource('/live');
 es.onmessage=function(e){
  var id=(e.data||'').trim(); if(!id)return;
  if(boot===null){boot=id;} else if(id!==boot){location.reload();}
 };
})();

function buildConfig(groups,values){
 var host=byId('cfgGroups');if(!host)return;host.innerHTML='';
 groups.forEach(function(g){
  var box=document.createElement('div');box.className='cfg-group';
  var h=document.createElement('h3');h.appendChild(document.createTextNode(g.group));
  var gp=document.createElement('span');gp.className='gp';h.appendChild(gp);box.appendChild(h);
  g.items.forEach(function(it){
   var f=document.createElement('div');f.className='cfg-field';
   var lb=document.createElement('label');lb.textContent=it.label;f.appendChild(lb);
   var inp=document.createElement('input');inp.type=it.secret?'password':'text';inp.value=(values&&values[it.key])||'';
   inp.setAttribute('data-key',it.key);inp.setAttribute('data-secret',it.secret?'1':'0');inp.autocomplete='off';inp.spellcheck=false;f.appendChild(inp);
   if(it.hint){var hn=document.createElement('span');hn.className='hint';hn.textContent=it.hint;f.appendChild(hn);}
   box.appendChild(f);
  });
  host.appendChild(box);
 });
 cfgStatus();
}
function cfgStatus(){
 var host=byId('cfgGroups');if(!host)return;var groups=host.querySelectorAll('.cfg-group');
 for(var j=0;j<groups.length;j++){var gi=groups[j].querySelectorAll('input[data-key]'),all=true,any=false;
  for(var k=0;k<gi.length;k++){if(gi[k].value.trim())any=true;else all=false;}
  var gp=groups[j].querySelector('.gp');if(gp){gp.textContent=all?'completo':(any?'incompleto':'vacío');gp.className='gp'+(all?' ok':'');}}
}
function setImapNote(mode){
 var n=byId('imapnote');if(!n)return;
 if(mode==='B')n.innerHTML='<b style="color:var(--ok)">Modo B</b> · los correos se leen por IMAP. "Investigar → Correos" lista los recientes de ventasecom.';
 else n.innerHTML='<b style="color:var(--warn)">Modo A</b> · sin App Password: confirma el correo a mano en <a target="_blank" href="https://mail.google.com/mail/u/0/#search/from%3Aventasecom%40rotoplas.com">el buzón de ventasecom ↗</a>.';
}
byId('cfgShow').addEventListener('change',function(){var show=this.checked,ins=byId('cfgGroups').querySelectorAll('input[data-secret="1"]');for(var i=0;i<ins.length;i++)ins[i].type=show?'text':'password';});
byId('cfgGroups').addEventListener('input',cfgStatus);
byId('btnSaveCfg').addEventListener('click',function(){
 var btn=this,orig=btn.innerHTML,ins=byId('cfgGroups').querySelectorAll('input[data-key]'),payload={};
 for(var i=0;i<ins.length;i++){var v=ins[i].value.trim();if(v)payload[ins[i].getAttribute('data-key')]=v;}
 btn.disabled=true;btn.textContent='Guardando…';
 fetch('/config/save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}).then(function(r){return r.json();}).then(function(res){
  cfgStatus();if(res&&res.imapMode)setImapNote(res.imapMode);btn.textContent='Guardado ✓ ('+((res&&res.saved&&res.saved.length)||0)+')';
  setTimeout(function(){btn.disabled=false;btn.innerHTML=orig;},1700);loadPrereq();
 }).catch(function(){btn.textContent='Error al guardar';setTimeout(function(){btn.disabled=false;btn.innerHTML=orig;},1700);});
});

// ─── Prerequisitos (semáforo) ─────────────────────────────────────────────────
function loadPrereq(){
 fetch('/prereq?env='+encodeURIComponent(ENV)).then(function(r){return r.json();}).then(function(p){
  var host=byId('prereq');if(!host)return;host.innerHTML='';
  function pq(label,state,fixLabel,fixFn){
   var s=document.createElement('span');s.className='pq '+(state==='ok'?'ok':(state==='warn'?'warn':'bad'));
   var d=document.createElement('span');d.className='d';s.appendChild(d);s.appendChild(document.createTextNode(label));
   if(fixLabel&&state!=='ok'){var b=document.createElement('button');b.textContent=fixLabel;b.addEventListener('click',fixFn);s.appendChild(b);}
   host.appendChild(s);
  }
  pq('Sitio alcanzable',p.site?'ok':'bad');
  pq('Sesión B2C',p.authB2c?'ok':'warn','generar',function(){openModal();});
  pq('Correos (IMAP)',p.imap?'ok':'warn','configurar',function(){openModal();});
  pq('CT credenciales',p.ct?'ok':'bad','ajustar',function(){openModal();});
 }).catch(function(){var host=byId('prereq');if(host)host.innerHTML='<span class="pq bad"><span class="d"></span>No se pudo leer prerequisitos</span>';});
}

// ─── Galería de evidencias (evidencias/panel/<area>/) ────────────────────────
function loadEvidencias(){
 var grid=byId('evidGrid'),cnt=byId('evidCount');if(!grid)return;
 grid.innerHTML='<div class="evid-empty">Cargando…</div>';
 fetch('/evidencias').then(function(r){return r.json();}).then(function(d){
  var files=(d&&d.files)||[];
  if(cnt)cnt.textContent=files.length?(files.length+' captura'+(files.length!==1?'s':'')):'';
  if(!files.length){grid.innerHTML='<div class="evid-empty">Aún no hay capturas. Corre una revisión por área (con el navegador en cualquier modo) y se guardarán en evidencias/panel/&lt;área&gt;/.</div>';return;}
  grid.innerHTML='';
  files.forEach(function(f){
   var fail=/__fail\\.png$/i.test(f.name);
   var a=document.createElement('a');a.className='evid-item'+(fail?' fail':'');a.href='/evidencia/'+f.rel;a.target='_blank';
   var img=document.createElement('img');img.loading='lazy';img.src='/evidencia/'+f.rel;a.appendChild(img);
   var cap=document.createElement('div');cap.className='cap';
   var b=document.createElement('b');b.textContent=(AREA_LABELS[f.area]||f.area)+(fail?' · ✘':'');cap.appendChild(b);
   cap.appendChild(document.createTextNode(f.name.replace(/__(ok|fail)\\.png$/i,'').replace(/-/g,' ').slice(0,60)));
   a.appendChild(cap);grid.appendChild(a);
  });
 }).catch(function(){grid.innerHTML='<div class="evid-empty">No se pudo leer la galería.</div>';});
}
byId('btnEvid').addEventListener('click',loadEvidencias);

// ─── Carga inicial de configuración ───────────────────────────────────────────
fetch('/config').then(function(r){return r.json();}).then(function(c){
 if(c.prodBlocked&&c.prodBlocked.length)PROD_BLOCKED=c.prodBlocked;
 if(c.areas){AREAS=c.areas;buildMap(c.areas);}
 if(c.states)STATES=c.states;
 if(c.envFields)buildConfig(c.envFields,c.envValues||{});
 setImapNote(c.imapMode);
 applyEnv(byId('env').value);
 wireActionButtons();
 loadPrereq();
}).catch(function(){byId('map').innerHTML='<div class="maprow"><div class="maprow-h"><span class="anm">No se pudo leer la configuración del panel.</span></div></div>';});
</script>
</body></html>`;
