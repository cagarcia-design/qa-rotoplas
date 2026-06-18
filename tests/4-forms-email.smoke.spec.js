// tests/4-forms-email.smoke.spec.js
// CAPA 2 (N2 · EFECTO REAL) — Formularios: submit con datos válidos + EL CORREO SALE.
//
// QUÉ AÑADE sobre 1-forms (N0/N1): 1-forms verifica que el form RENDERICE y VALIDE
// (campos visibles, email malformado rechazado, credenciales malas no autentican).
// ESTE spec hace el CAMINO FELIZ: envía datos válidos, verifica la confirmación de la
// UI, y EMITE la expectativa de correo para confirmar que el email realmente salió.
//
// MODO DE VERIFICACIÓN DE CORREO (decisión del usuario 2026-06-18): Gmail MCP (Modo A)
// → el agente Claude lee el inbox c.agarcia@rotoplas.com. Node NO puede llamar al MCP,
// por eso este spec NO bloquea su veredicto en la llegada del correo: hace el submit +
// asercióna la confirmación de UI (autónomo, sirve en CI) y ADEMÁS imprime una línea
//   @@EMAIL_EXPECT {"form":...,"to":...,"subjectRe":...,"sinceTs":...}
// que el agente/dashboard consume para confirmar el correo por MCP. Si algún día se
// configura GMAIL_IMAP_PASS, ese mismo @@EMAIL_EXPECT alimenta waitForEmail() (_email.js)
// para verificación autónoma por IMAP — sin tocar este archivo.
//
// PROD-SAFETY (decisión del usuario): forgot-password corre en QA Y prod (el correo de
// reset NO cambia nada hasta hacer clic en el link → no-destructivo). Los formularios
// que MUTAN datos (signup crea cuenta, contacto crea lead, newsletter crea suscripción)
// quedan GATEADOS a QA-only hasta definir alcances de prod ("después definimos alcances").
//
// Tag: @forms @smoke @email
// Correr: npx playwright test --project=b2c-contracts --grep "@email"

const { test, expect, irA } = require('./_helpers');

const BASE = process.env.B2C_BASE_URL || 'https://qarotoplasmx.io';
const IS_PROD = /rotoplas\.com\.mx/i.test(BASE);

// Inbox que el verificador (Gmail MCP / IMAP) puede LEER. Es el destinatario de los
// correos a verificar → debe ser una cuenta cuyo buzón controlamos. Override por env.
const INBOX = process.env.B2C_FORMS_INBOX || 'c.agarcia@rotoplas.com';

/**
 * Imprime la expectativa de correo en una línea machine-readable que el verificador
 * (agente Gmail MCP, o IMAP vía _email.js) consume tras la corrida. sinceTs se captura
 * JUSTO antes del submit (no aquí) para no confundir un correo viejo con el recién
 * disparado — mismo contrato que waitForEmail({ sinceTs }).
 */
function emitirExpectativaCorreo(info) {
  console.log('@@EMAIL_EXPECT ' + JSON.stringify(info));
}

// ─────────────────────────────────────────────────────────────────────────
// FORGOT-PASSWORD — prod-safe (el reset no muta nada hasta hacer clic en el link).
// Corre en QA y prod. El correo va a INBOX (debe estar registrado EN ESE AMBIENTE para
// que el sitio dispare el reset). Verificación del arribo: Gmail MCP (Modo A).
//
// ⚠️ HALLAZGO 2026-06-18 — PROD NO VERIFICA CON c.agarcia:
//   QA y prod tienen BASES DE USUARIOS SEPARADAS. c.agarcia@rotoplas.com está registrada
//   en QA, NO en prod → en prod el submit muestra "éxito" (anti-enumeración) pero NO
//   manda correo (confirmado por Gmail MCP: el reset de QA llegó, el de prod no).
//   Por eso la aserción de UI sola da VERDE ENGAÑOSO en prod. Para verificar el reset en
//   prod hace falta una cuenta REGISTRADA EN PROD cuyo inbox podamos leer
//   (override: B2C_FORMS_INBOX). Hasta tenerla, en prod este test solo prueba que el
//   FORM SUBMITEA sin error — NO que el correo salió. El @@EMAIL_EXPECT lleva env:prod
//   para que el verificador sepa que en prod aún no hay cuenta válida.
// ─────────────────────────────────────────────────────────────────────────
test.describe('@forms @smoke @email Forgot-password — el correo de reset SALE', () => {

  test('Submit con email registrado → confirmación de UI + emite expectativa de correo', async ({ page }) => {
    await irA(page, '/forgot-password/');
    await page.locator('input[name="email"]').first().fill(INBOX);

    const sinceTs = Date.now(); // ancla temporal para el verificador de correo
    await page.getByRole('button', { name: /enviar correo/i }).click();

    // Confirmación de UI del envío. La copy EXACTA del éxito no está mapeada
    // (inventario gap #3: dependía de Capa 2) → aceptamos cualquier afordancia de
    // éxito: aparece un mensaje de envío, o el form sale de /forgot-password, y NO
    // queda visible el error de validación. Loose a propósito hasta endurecer con
    // el DOM real (probe en vivo) — pero distingue "envió" de "rebotó por validación".
    await expect(async () => {
      const errorVisible = await page
        .getByText(/correo electrónico válida/i).first()
        .isVisible().catch(() => false);
      const exitoVisible = await page
        .getByText(/(enviado|revisa|bandeja|te enviamos|recuperaci[oó]n|restablece|instrucciones)/i).first()
        .isVisible().catch(() => false);
      const salioDelForm = !page.url().includes('/forgot-password');
      expect(!errorVisible && (exitoVisible || salioDelForm)).toBeTruthy();
    }).toPass({ timeout: 12000 });

    emitirExpectativaCorreo({
      form: 'forgot-password',
      env: IS_PROD ? 'prod' : 'qa',
      to: INBOX,
      from: 'ventasecom@rotoplas.com',
      subjectRe: '(restablece|recuperaci[oó]n|contrase[nñ]a|reset)',
      sinceTs,
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────
// FORMULARIOS QUE MUTAN — QA-only hasta definir alcances de prod.
// Se dejan como test.fixme (visibles en el reporte como "pendiente de definir"), no
// silenciosamente ausentes: documentan el alcance acordado y qué falta decidir.
// Al implementarlos: emitir @@EMAIL_EXPECT igual que forgot-password.
// ─────────────────────────────────────────────────────────────────────────
test.describe('@forms @smoke @email Mutantes (QA-only) — pendientes de alcance', () => {
  test.skip(IS_PROD, 'Crean datos reales (cuenta/lead/suscripción) → no se corren en prod hasta definir alcances.');

  // Signup → correo de bienvenida. Necesita un email DESECHABLE legible (no ensuciar
  // la base con c.agarcia). Decidir: ¿alias +smoke de un Gmail propio? ¿se borra la cuenta?
  test.fixme('Signup válido → correo de bienvenida llega (definir email desechable + cleanup)', async () => {});

  // Contacto → auto-reply "Se ha enviado tu información, pronto te contactaremos" (inv. I.14.d).
  // Genera un lead real en su CRM → confirmar que QA no notifica a ventas reales.
  test.fixme('Contacto válido → auto-reply llega (confirmar destino del lead en QA)', async () => {});

  // Newsletter → doble opt-in (POST ?qfunc=WMuxo3zKEsY, inv. I.10). Crea suscripción.
  test.fixme('Newsletter válido → correo de doble opt-in llega', async () => {});
});
