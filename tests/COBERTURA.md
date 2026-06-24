# Cobertura del panel QA B2C — mapa por área

> Fuente de verdad de **qué celda del mapa tiene prueba y cuál está pendiente (⏳)**.
> El panel (`scripts/dashboard.js`) pinta este mapa en vivo; las celdas ⏳ enlazan aquí.
> El diseño del panel vive en `../diseno-dashboard.md`; el ADR del sistema de checks en `../overview.md` §F6.

## Eje organizador

Un solo eje: **por ÁREA del sitio**. Cada área se mide en 4 dimensiones (naturaleza de la acción):

- **Responde** — la URL devuelve 200 **y** renderiza (title + header). Recortado por área vía el campo `area` de `HEALTH_URLS` (`_targets.js`).
- **Estructura** — DOM contracts: los elementos load-bearing existen (specs `@contract`).
- **Flujo** — la funcionalidad **hace** lo que promete (add-to-cart persiste, submit envía, compra genera orden). Los flujos que **mutan** datos van con candado 🔒 (QA-only).
- **Móvil** — los mismos contracts a 375px.

## Estados de celda

| Estado | Significado |
|---|---|
| ✓ | corrió y pasó |
| ✕ | corrió y falló (regresión o bug confirmado) |
| ○ | omitido (necesita sesión `@auth` y no hay) |
| ⏳ | **pendiente** — sin prueba aún (ver "Pendientes" abajo) |
| — | no aplica (p. ej. el cascarón no tiene URL propia: se verifica en toda página) |
| gris | sin correr en esta sesión |

## Mapa 7×4

| # | Área | Responde | Estructura | Flujo | Móvil |
|---|---|---|---|---|---|
| 1 | **Header y Footer** | — | `1-global-layout` ✓ (header · nav · footer + chatbot · newsletter · barra promo) | `9-flujo-areas` ✓ (buscador → SRP con resultados) | `5-mobile` ✓ (footer global 375px) |
| 2 | **Home** | `/` ✓ | `1-home` ✓ | `9-flujo-areas` ✓ (selector de soluciones → categoría) | `5-mobile` ✓ (header + hamburguesa abre menú) |
| 3 | **Catálogo / PDP** | 7 categorías ✓ | `1-pdp` · `1-catalog` ✓ | `7-pdp-flujo` ✓ (galería · acordeones · compra por CP) + add-to-cart persiste en `2-money-path` 🔒 | `5-mobile` ✓ (PDP + catálogo 375px) |
| 4 | **Servicios** | hub `/servicios/` · `/servicios-lavado/` ✓ | `1-servicios` · `1-servicio-lavado` ✓ | `7-servicios-flujo` ✓ (cotización → carrito; variante A/B pineada) | `5-mobile` ✓ (landing 375px) |
| 5 | **Institucional / Contenido** | contacto · faq · distribuidores · legales · **nosotros · blog · recursos** ✓ | `1-contacto` · `1-faq` · `1-distribuidores` · `1-legales` · `1-contenido` ✓ | `9-flujo-areas` ✓ (contacto valida submit vacío) · faq acordeón + distribuidores ⏳ | `5-mobile` ✓ (contacto 375px) |
| 6 | **Compra (carrito → pago → post-venta)** 🔒 | cart · checkout1 · **seguimiento** ✓ | `2-cart-empty` · `2-money-path` · `2-seguimiento` ✓ | `3-money-path-purchase` ✓ (mutante 🔒) | `5-mobile` ✓ (carrito 375px) |
| 7 | **Mi cuenta** 🔒 | login · signup · forgot ✓ | `2-customer` · `2-pci-baseline` · `1-forms` ✓ | `1-login` ✓ (mutante 🔒) | `5-mobile` ✓ (customer 375px @auth) |

> **Nota Responde:** Header/Footer queda "—" a propósito: el cascarón global se verifica como Estructura en **toda**
> página, no tiene URL propia (su link-check de salud vive en la transversal "Errores y enlaces", abajo).
> **Cambios de taxonomía (s29):** (a) **Seguimiento** `/traking/` pasó de Mi cuenta → **Compra** (es post-venta y
> **anónimo**: se entra con nº de pedido, sin sesión). (b) **Nosotros/Blog/Recursos** se adoptaron en
> **Institucional / Contenido** (eran páginas B2C reales sin área — hueco MECE). (c) `1-forms`
> (login/signup/forgot) se sumó a la Estructura de Mi cuenta (antes corría solo vía `check-all`).
> (d) **Responde** ahora es simétrico con Estructura: FAQ/distribuidores/legales/hub de servicios ya tienen check 200.

## Calidad transversal (site-wide, fuera del mapa)

No caben como columnas (lo harían ilegible). Sección propia.

| Categoría | Estado | Cubre |
|---|---|---|
| Errores y enlaces | ✓ | `6-xcut` (`@xcut`) — excepciones JS no capturadas (Home·Categoría·Contacto) · 404/catchall (BUG-518) · **`0-links`** (`@xcut`) link-check de header/footer (internos 200). El "link a destino correcto" (BUG-003) lo vigila el guard en `1-global-layout`. _Nota s29: `0-links` se movió de `@health` a `@xcut` — antes se colaba en el Responde de las 7 áreas; ahora corre una vez aquí._ |
| Performance | ✓ | `8-perf` (`@perf`) — Lighthouse mobile en Home + PDP. Anti-flaky: categorías deterministas (a11y/bp/seo) con piso cercano al baseline; perf-score + Core Web Vitals solo con pisos de catástrofe. On-demand (`npm run check:b2c:perf`), fuera del run rápido. |
| PCI (baseline) | ✓ | `2-pci-baseline` — guard expected-fail de BUG-119 (PAN en detalle de pedido) |
| Centinelas de bloqueo | ✓ | `9-centinelas` (`@bloqueo`) — vigilan muros **externos** (fix NO nuestro): reseñas E2E (BUG-566), correo "entregado" (gate de fulfillment real), forgot-prod sin inbox. Cubren la parte no-rota y dejan la rota como guard que se pone verde solo al arreglarse. On-demand (`npm run check:b2c:bloqueos`). Ver sección abajo. |

## Bugs conocidos vigilados (baseline ejecutable)

No cargan celdas del mapa — viven en su propia línea. Si uno **pasa** (se arregló) → cerrar ticket.

| ID | Qué vigila | Spec |
|---|---|---|
| BUG-001 | Home sin H1 | `1-home` |
| BUG-015 | logo no es `<a>` | `1-global-layout` |
| BUG-003 | Contacto → enlaza a FAQ | `1-global-layout` |
| BUG-119 | PAN expuesto en detalle de pedido (PCI) | `2-pci-baseline` |

## Pendientes (⏳) — roadmap

Estas celdas están **diseñadas pero sin prueba**. Orden de `../diseno-dashboard.md` §8–9.

1. ~~**Flujo Catálogo/PDP a fondo (F7)**~~ **✅ N1 (s27):** `7-pdp-flujo.contract.spec.js` (`@flujo`) — galería muestra ESTE producto (SKU en `<img>`), acordeones `<details>` abren, compra habilitada por CP (seed). El add-to-cart que **persiste** ya vive en `2-money-path @auth`. _Resta (no bloqueante): filtros/orden de categoría._
2. ~~**Móvil 375px**~~ **✅ COLUMNA COMPLETA — las 7 áreas (s28):** `5-mobile.contract.spec.js` — 9 tests verdes. Home desparqueado (el parqueo era selector equivocado: `label[for="open-menu"]` es un artefacto 0x0; el real es `button[aria-label="Abrir menú"]` → monta `.mobile-menu-content`). Resto de áreas a 375px (footer global · servicios · contacto · carrito · customer @auth) con shell que renderiza sin overflow real. El panel corre Móvil por área (acción `area-movil`, recorta `5-mobile` por título; quoting de `q()` arreglado para patrones con espacios).
3. ~~**Calidad transversal (F3)**~~ **✅ cerrada (s28):** consola JS + 404/catchall (`6-xcut`) · Lighthouse/CWV (`8-perf`). Resta de roadmap (otra ronda): a11y · SEO/meta · seguridad (PII/cookies/headers) · regresión visual.
4. **Flujos de área** — **✅ (s28–29):** `9-flujo-areas.contract.spec.js` cubre buscador (Header → SRP), selector de soluciones (Home → categoría) y contacto (Institucional). **Servicios:** `7-servicios-flujo` (`@flserv`) cotiza → mete el servicio al carrito (variante A/B **pineada** → ya no es bloqueo, solo el **pago** queda diferido por mutante). _Resta (residual):_ faq acordeón (BUG-091, mecanismo dudoso) · distribuidores encadenado (selects + Google Maps).
5. ~~**Móvil de Compra/Mi cuenta**~~ **✅ (s28)** — carrito 375px (anónimo) y customer 375px (@auth, skip sin sesión). Cierra la columna Móvil.
6. ~~**Taxonomía incompleta**~~ **✅ (s29):** Nosotros/Blog/Recursos adoptados en Institucional/Contenido · Seguimiento movido a Compra · `1-forms` en Estructura de Mi cuenta · Responde simetrizado · cascarón profundizado (chatbot/newsletter/promo).

> **Bloqueos externos — ahora VIGILADOS, no invisibles** (`9-centinelas`, `@bloqueo`). El fix NO es nuestro, pero
> se cubre la parte no-rota y la rota flippea sola al arreglarse: BUG-566 reseñas E2E · `Delivered`→"entregado"
> (gate de fulfillment real) · forgot-password en prod (sin inbox). _BUG-457 (wizard A/B) **dejó de ser bloqueo**:
> se disolvió pineando `builderVisitorId` → es el Flujo de Servicios._

## Evidencias — dónde y cómo se guardan

Dos universos separados, a propósito:

| Origen | Ruta | Naming | Quién lo genera |
|---|---|---|---|
| **Manual (sesiones QA)** | `evidencias/*.png` (plano) | `E<n>-TC<n>-<desc>.png`, `BUG-<id>-<desc>.png`, `CAPA2-*`, `F<fase>-*` | el agente/QA a mano (regla 1 de CLAUDE.md) |
| **Panel (automático)** | `evidencias/panel/<area>/<slug>__<ok\|fail>.png` | slug del test + veredicto | hook `afterEach` de `tests/_helpers.js` |

**Captura del panel — cómo:** opt-in vía `DASH_EVIDENCE=1` (lo pone el panel en sus corridas; las corridas por CLI **no** lo setean → cero costo, cero archivos). El área sale de `DASH_AREA`. Es **latest por celda** (se sobreescribe cada corrida) → el tamaño queda acotado; el historial profundo lo da el **reporte HTML** de Playwright (`/report`) + git.

**Galería:** el panel sirve `/evidencias` (scoped SOLO a `evidencias/panel/`, NO al plano) → bloque "Evidencias de la última revisión" con miniaturas por área, servidas por `/evidencia/<area>/<file>`. Todo `evidencias/` está gitignored (no se commitea binario).
