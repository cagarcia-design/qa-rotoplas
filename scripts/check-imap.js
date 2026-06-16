// scripts/check-imap.js
// SMOKE de conexión IMAP para el check Capa 2 (Modo B autónomo).
//
// Verifica que las credenciales IMAP de .env (GMAIL_IMAP_USER / GMAIL_IMAP_PASS)
// logran conectar al inbox y leer los correos transaccionales B2C
// (remitente ventasecom@rotoplas.com). Si esto pasa, el spec @capa2 puede correr
// DESATENDIDO (sin Gmail MCP / sin agente en el loop).
//
// Uso:
//   node scripts/check-imap.js                 → lista últimos correos de ventasecom
//   node scripts/check-imap.js <texto>         → además filtra asunto/cuerpo por <texto>
//
// IMPORTANTE sobre la contraseña:
//   Gmail/Workspace normalmente RECHAZA IMAP con la contraseña normal de la cuenta.
//   Si ves "AUTHENTICATIONFAILED" o "Application-specific password required", hay que
//   generar un APP PASSWORD de 16 caracteres en https://myaccount.google.com/apppasswords
//   (requiere 2FA activo) y ponerlo en GMAIL_IMAP_PASS.

require('dotenv').config();

const USER = process.env.GMAIL_IMAP_USER;
const PASS = process.env.GMAIL_IMAP_PASS;
const REMITENTE = 'ventasecom@rotoplas.com';

async function main() {
  if (!USER || !PASS) {
    console.error('Faltan GMAIL_IMAP_USER / GMAIL_IMAP_PASS en .env');
    process.exit(2);
  }

  let ImapFlow;
  try { ({ ImapFlow } = require('imapflow')); }
  catch { console.error('Falta imapflow. Corre: npm i imapflow'); process.exit(2); }

  const filtro = process.argv[2];

  const client = new ImapFlow({
    host: 'imap.gmail.com',
    port: 993,
    secure: true,
    auth: { user: USER, pass: PASS },
    logger: false,
  });

  try {
    await client.connect();
  } catch (e) {
    console.error('\n❌ Conexión IMAP FALLÓ:', e.responseText || e.message);
    if (/auth/i.test(e.message) || /AUTHENTICATIONFAILED/i.test(String(e.responseText))) {
      console.error(
        '\n→ Gmail rechazó la contraseña. Necesitas un APP PASSWORD (16 chars):\n' +
        '   1. Activa 2FA en la cuenta ' + USER + '\n' +
        '   2. Genera uno en https://myaccount.google.com/apppasswords\n' +
        '   3. Ponlo en .env como GMAIL_IMAP_PASS (sin espacios)\n'
      );
    }
    process.exit(1);
  }

  try {
    const lock = await client.getMailboxLock('INBOX');
    try {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000); // últimas 24h
      const uids = await client.search({ from: REMITENTE, since }, { uid: true });
      console.log(`\n✅ Conexión IMAP OK como ${USER}`);
      console.log(`   ${uids.length} correo(s) de ${REMITENTE} en las últimas 24h:\n`);
      let mostrados = 0;
      for (const uid of uids.reverse()) {
        const msg = await client.fetchOne(uid, { envelope: true }, { uid: true });
        const asunto = msg.envelope?.subject || '(sin asunto)';
        const fecha = msg.envelope?.date ? new Date(msg.envelope.date).toISOString() : '?';
        if (filtro && !asunto.toLowerCase().includes(filtro.toLowerCase())) continue;
        console.log(`   ${fecha}  ${asunto}`);
        if (++mostrados >= 15) break;
      }
      if (filtro && mostrados === 0) console.log(`   (ningún asunto contiene "${filtro}")`);
    } finally {
      lock.release();
    }
  } finally {
    await client.logout().catch(() => {});
  }
}

main().catch(e => { console.error(e); process.exit(1); });
