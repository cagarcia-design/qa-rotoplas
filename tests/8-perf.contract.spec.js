// tests/8-perf.contract.spec.js
// CALIDAD TRANSVERSAL · PERFORMANCE (@perf) — Lighthouse / Core Web Vitals en las
// páginas clave (Home, PDP). Cierra la fila "Performance" del panel (F3). Es site-wide,
// no cabe como columna del mapa por área (lo haría ilegible) → sección propia, como @xcut.
//
// POR QUÉ ESTE DISEÑO (anti-flaky es lo primero, ver diseno-dashboard §7):
//   El SCORE de performance de Lighthouse es ruidoso por naturaleza (varía ±10 pts entre
//   corridas según CPU/red del momento). Si lo asertáramos contra el baseline exacto, la
//   suite gritaría rojos que NO son regresiones → se apaga. Entonces partimos las
//   aserciones por estabilidad de la señal:
//     • Categorías DETERMINISTAS (a11y · best-practices · seo) — son rule-based sobre el
//       DOM, no dependen del timing → mismo sitio, mismo score. Se asertan con piso
//       cercano al baseline (margen chico): aquí SÍ una caída = regresión real.
//     • PERFORMANCE score + Core Web Vitals (LCP/CLS/TBT) — dependen del timing → solo
//       pisos de CATÁSTROFE (muy holgados): atrapan una página 2x más lenta o rota, no el
//       ruido normal. Los NÚMEROS reales se imprimen siempre (marcador @@PERF) para que el
//       operador los lea, aunque no fallen.
//   Todos los umbrales son configurables por env (abajo) sin tocar el código.
//
// BASELINE (Lighthouse 13 + chrome-launcher, mobile, medido 2026-06-23 — s28):
//   Home: perf ~42 · a11y 89 · bp 58 · seo 100     PDP: perf ~45 · a11y 79 · bp 58 · seo 85
//   ⚠️ SUPERSEDE los números s12 "89/58/100/33" del overview: aquéllos se midieron con
//   DevTools MCP `lighthouse_audit` (otra versión/criterio) → NO comparables con esta corrida
//   autónoma. El baseline de un guard de regresión es la realidad actual medida con ESTA
//   herramienta, no un número heredado de otra. Re-medir y re-anclar si el sitio cambia.
//
// DEPENDENCIAS: lighthouse + chrome-launcher (en package.json). Si no están instaladas,
//   el check hace SKIP limpio (no rompe el resto de la suite) con instrucción de instalar.
//   Lighthouse lanza su PROPIO Chrome (chrome-launcher) apuntando al Chromium de Playwright
//   → no usa el fixture `page`. Siempre headless (la medición de perf lo exige).
//
// Es LENTO (~30-60s por página) → fuera del run rápido `check:b2c`. On-demand:
//   npm run check:b2c:perf     (o desde el panel → fila "Performance")

const { test, expect } = require('./_helpers');
const { abs, PRODUCTO } = require('./_targets');

// ─── Umbrales (todos configurables por env) ──────────────────────────────────
const FORM_FACTOR = process.env.PERF_FORM_FACTOR === 'desktop' ? 'desktop' : 'mobile';
const CAT_MARGIN  = Number(process.env.PERF_CAT_MARGIN || 15);   // holgura de categorías estables vs baseline (15: bp oscila por error fantasma de consola, BUG-050)
const PERF_MIN    = Number(process.env.PERF_MIN || 20);          // piso de catástrofe del score de performance
const LCP_MAX     = Number(process.env.PERF_LCP_MAX || 12000);   // ms (mobile throttled puede ser alto)
const CLS_MAX     = Number(process.env.PERF_CLS_MAX || 0.5);
const TBT_MAX     = Number(process.env.PERF_TBT_MAX || 4000);    // ms

// Páginas clave + su baseline (mobile s12). PRODUCTO.slug ya se resuelve por ambiente.
const PAGINAS = [
  { nombre: 'Home', url: abs('/'),            base: { perf: 42, a11y: 89, bp: 58, seo: 100 } },
  { nombre: 'PDP',  url: abs(PRODUCTO.slug),  base: { perf: 45, a11y: 79, bp: 58, seo: 85 } },
];

// ─── Tooling: carga perezosa de lighthouse/chrome-launcher (ESM) ──────────────
// Ambos son ESM puro en sus versiones actuales → dynamic import() desde este CJS.
// Si cualquiera falta o falla al cargar, devolvemos null → el test hace skip.
async function loadTooling() {
  try {
    const { launch } = await import('chrome-launcher');
    const lighthouse = (await import('lighthouse')).default;
    const { chromium } = require('playwright');
    const chromePath = chromium.executablePath();
    return { launch, lighthouse, chromePath };
  } catch (_) {
    return null;
  }
}

// Corre Lighthouse contra `url` y devuelve scores + Core Web Vitals.
async function audit(tooling, url) {
  const chrome = await tooling.launch({
    chromePath: tooling.chromePath,
    chromeFlags: ['--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
  });
  try {
    const options = {
      port: chrome.port,
      output: 'json',
      logLevel: 'error',
      onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
      formFactor: FORM_FACTOR,
    };
    // Para desktop hay que emular pantalla + throttling de escritorio juntos (si no, se
    // mezcla CPU/red de móvil con pantalla grande → números sin sentido). Mobile = default.
    if (FORM_FACTOR === 'desktop') {
      options.screenEmulation = { mobile: false, width: 1350, height: 940, deviceScaleFactor: 1, disabled: false };
      options.throttling = { rttMs: 40, throughputKbps: 10240, cpuSlowdownMultiplier: 1, requestLatencyMs: 0, downloadThroughputKbps: 0, uploadThroughputKbps: 0 };
    }
    const { lhr } = await tooling.lighthouse(url, options);
    const pct = (c) => Math.round((lhr.categories[c] && lhr.categories[c].score != null ? lhr.categories[c].score : 0) * 100);
    const num = (a) => (lhr.audits[a] ? lhr.audits[a].numericValue : null);
    return {
      runtimeError: lhr.runtimeError,
      scores: { perf: pct('performance'), a11y: pct('accessibility'), bp: pct('best-practices'), seo: pct('seo') },
      cwv: { lcp: num('largest-contentful-paint'), cls: num('cumulative-layout-shift'), tbt: num('total-blocking-time'), fcp: num('first-contentful-paint'), si: num('speed-index') },
    };
  } finally {
    // chrome-launcher v1: kill() es síncrono (no devuelve promesa) y en Windows puede
    // lanzar EPERM al borrar su temp dir mientras Chrome aún suelta el handle. El proceso
    // sí muere; solo la limpieza del temp falla (cosmético, el SO lo recoge). Swallow.
    try { chrome.kill(); } catch (_) { /* limpieza de temp no fatal */ }
  }
}

const ms = (v) => (v == null ? '—' : Math.round(v) + 'ms');

test.describe('@perf Calidad transversal — Performance (Lighthouse)', () => {
  // Lighthouse es lento: una auditoría puede tardar ~60s. Holgura amplia por test.
  test.describe.configure({ timeout: 150_000 });

  for (const { nombre, url, base } of PAGINAS) {
    test(`${nombre} — Lighthouse no regresa (${FORM_FACTOR})`, async () => {
      const tooling = await loadTooling();
      test.skip(!tooling, 'lighthouse/chrome-launcher no instalados → npm i lighthouse chrome-launcher');

      const r = await audit(tooling, url);

      // Visibilidad: número real SIEMPRE (lo lea o no falle el assert). Marcador para el panel.
      const s = r.scores, c = r.cwv;
      console.log(`@@PERF ${JSON.stringify({ page: nombre, formFactor: FORM_FACTOR, url, scores: s, cwv: c })}`);
      console.log(`  ${nombre} (${FORM_FACTOR}): perf ${s.perf} · a11y ${s.a11y} · bp ${s.bp} · seo ${s.seo}` +
        ` | LCP ${ms(c.lcp)} · CLS ${c.cls != null ? c.cls.toFixed(3) : '—'} · TBT ${ms(c.tbt)} · FCP ${ms(c.fcp)}` +
        ` (baseline perf ${base.perf}/a11y ${base.a11y}/bp ${base.bp}/seo ${base.seo})`);

      // 0) Lighthouse efectivamente corrió (la página es auditable, no reventó en runtime).
      expect(r.runtimeError, `Lighthouse no pudo auditar ${nombre}: ${r.runtimeError && r.runtimeError.message}`).toBeFalsy();

      // 1) Categorías DETERMINISTAS — piso cercano al baseline (regresión real si caen).
      expect(s.a11y, `Accesibilidad de ${nombre} regresó (baseline ${base.a11y})`).toBeGreaterThanOrEqual(base.a11y - CAT_MARGIN);
      expect(s.bp,   `Best-practices de ${nombre} regresó (baseline ${base.bp})`).toBeGreaterThanOrEqual(base.bp - CAT_MARGIN);
      expect(s.seo,  `SEO de ${nombre} regresó (baseline ${base.seo})`).toBeGreaterThanOrEqual(base.seo - CAT_MARGIN);

      // 2) PERFORMANCE score — solo catástrofe (ruidoso por timing; el número ya se imprimió).
      expect(s.perf, `Performance de ${nombre} colapsó (baseline ${base.perf}, piso ${PERF_MIN})`).toBeGreaterThanOrEqual(PERF_MIN);

      // 3) Core Web Vitals — pisos de catástrofe holgados (atrapan 2x más lento, no el ruido).
      if (c.lcp != null) expect(c.lcp, `LCP de ${nombre} catastrófico`).toBeLessThan(LCP_MAX);
      if (c.cls != null) expect(c.cls, `CLS de ${nombre} catastrófico`).toBeLessThan(CLS_MAX);
      if (c.tbt != null) expect(c.tbt, `TBT de ${nombre} catastrófico`).toBeLessThan(TBT_MAX);
    });
  }
});
