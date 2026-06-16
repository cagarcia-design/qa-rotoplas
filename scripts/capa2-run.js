// scripts/capa2-run.js
// ORQUESTADOR del check Capa 2 autónomo (Pieza 1 + Pieza 2 en una corrida).
//
// Hace, en orden:
//   1. PIEZA 1 — crea una orden B2C FRESCA por la UI (crear-orden-b2c.js), salvo que
//      ya venga CAPA2_ORDER en el entorno (para reusar una orden concreta).
//   2. PIEZA 2 — corre el spec @capa2 (3-capa2-pipeline) con CAPA2_ORDER ya seteado,
//      que mueve el status vía CT y verifica los correos (Modo B / IMAP).
//
// Por qué un orquestador y no globalSetup: globalSetup corre en OTRO proceso y su
// process.env NO se propaga a los workers de Playwright. Aquí seteamos CAPA2_ORDER
// ANTES de spawnear Playwright → llega limpio al spec. Cross-platform (Node puro).
//
// Uso:
//   node scripts/capa2-run.js                  → crea orden + corre el pipeline
//   CAPA2_ORDER=6XXXX node scripts/capa2-run.js → reusa esa orden, no crea otra
//
// NOTA: la verificación de correo del spec necesita IMAP (GMAIL_IMAP_USER/PASS, App
// Password). Sin ellas el spec hace SKIP de la verificación, pero la orden queda creada
// y su número impreso → un agente puede verificar los correos en Modo A (Gmail MCP).

const { spawnSync } = require('child_process');
const path = require('path');
const { crearOrdenB2C } = require('./crear-orden-b2c');
const { emailCredsDisponibles } = require(path.resolve(__dirname, '..', 'tests', '_email'));

(async () => {
  let order = process.env.CAPA2_ORDER;

  if (!order) {
    console.log('▶ Pieza 1 — creando orden B2C fresca por la UI…');
    order = await crearOrdenB2C();
    console.log(`✓ Orden creada: ${order}`);
  } else {
    console.log(`▶ Reusando CAPA2_ORDER=${order} (no se crea orden nueva)`);
  }

  if (!emailCredsDisponibles()) {
    console.log(
      '\n⚠ Sin credenciales IMAP (GMAIL_IMAP_PASS = App Password). El spec @capa2 hará\n' +
      '  SKIP de la verificación de correo. La orden YA está creada:\n' +
      `      CAPA2_ORDER=${order}\n` +
      '  → Verificación Modo A (agente con Gmail MCP): mover estados con\n' +
      `      node scripts/ct-api.js --b2c-set-state ${order} Confirmed\n` +
      `      node scripts/ct-api.js --b2c-set-shipment ${order} Shipped\n` +
      '    y confirmar los correos en el inbox c.agarcia@rotoplas.com.\n'
    );
  }

  console.log('\n▶ Pieza 2 — corriendo el pipeline @capa2 (CT → correo)…\n');
  const res = spawnSync(
    'npx',
    ['playwright', 'test', '--project=b2c-contracts', '--grep', '@capa2'],
    {
      cwd: path.resolve(__dirname, '..'),
      stdio: 'inherit',
      shell: true,
      env: { ...process.env, CAPA2_ORDER: order },
    }
  );
  process.exit(res.status || 0);
})().catch((e) => { console.error(`capa2-run ERROR: ${e.message}`); process.exit(1); });
