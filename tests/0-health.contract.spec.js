// tests/0-health.contract.spec.js
// CAPA 0 · HEALTH — ¿el ambiente respondió tras el deploy?
// La capa más barata y rápida: una petición HTTP por URL crítica, sin renderizar.
// Si esto falla, no tiene sentido correr las capas caras (contracts/smoke).
//
// Fuente de las URLs: _targets.js (HEALTH_URLS). Editar la lista AHÍ, no aquí.
// Correr: npm run check:b2c:health

const { test, expect, statusDe } = require('./_helpers');
const { HEALTH_URLS } = require('./_targets');

test.describe('@health Capa 0 — URLs críticas responden 200', () => {
  for (const { nombre, url } of HEALTH_URLS) {
    test(`${nombre} → 200`, async ({ request }) => {
      const status = await statusDe(request, url);
      expect(status, `${nombre} (${url}) devolvió ${status}, se esperaba 200`).toBe(200);
    });
  }
});
