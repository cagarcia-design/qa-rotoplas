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
| 1 | **Header y Footer** | — | `1-global-layout` · `0-links` ✓ | buscador · links a destino ⏳ | ⏳ |
| 2 | **Home** | `/` ✓ | `1-home` ✓ | selector de soluciones navega ⏳ | ⏳ |
| 3 | **Catálogo / PDP** | 7 categorías ✓ | `1-pdp` · `1-catalog` ✓ | add-to-cart real · galería · filtros · acordeones · CP ⏳ (F7) | ⏳ |
| 4 | **Servicios** | `/servicios-lavado/` ✓ | `1-servicios` · `1-servicio-lavado` ✓ | compra del servicio ⏳ | ⏳ |
| 5 | **Institucional** | contacto ✓ | `1-contacto` · `1-faq` · `1-distribuidores` · `1-legales` ✓ | contacto submit · faq acordeón · distribuidores encadenado ⏳ | ⏳ |
| 6 | **Compra (carrito → pago)** 🔒 | cart · checkout1 ✓ | `2-cart-empty` · `2-money-path` ✓ | `3-money-path-purchase` ✓ (mutante 🔒) | ⏳ |
| 7 | **Mi cuenta** 🔒 | login · signup · forgot · seguimiento ✓ | `2-customer` · `2-pci-baseline` ✓ | `1-login` ✓ (mutante 🔒) | ⏳ |

> **Nota Responde:** el spec original marcaba Header/Footer y Mi cuenta como "—". Aquí Mi cuenta SÍ tiene Responde
> (login/signup/forgot/seguimiento son URLs de health reales) → su celda enciende. Header/Footer queda "—" a propósito:
> el cascarón global se verifica como Estructura en **toda** página, no tiene URL propia.

## Calidad transversal (site-wide, fuera del mapa)

No caben como columnas (lo harían ilegible). Sección propia.

| Categoría | Estado | Cubre |
|---|---|---|
| Errores y enlaces | ⏳ (F3) | consola JS nueva · links a **destino correcto** (BUG-003) · 404/catchall (BUG-518) |
| Performance | ⏳ (F3) | Lighthouse / Core Web Vitals (Home, PDP) |
| PCI (baseline) | ✓ | `2-pci-baseline` — guard expected-fail de BUG-119 (PAN en detalle de pedido) |

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

1. **Flujo Catálogo/PDP a fondo (F7)** — add-to-cart real que persiste · galería de *este* producto · filtros/orden · acordeones · disponibilidad por CP.
2. **Móvil 375px** — `5-mobile.contract.spec.js`: **PDP y catálogo a 375px ACTIVOS y verdes** (overflow REAL por intento-de-scroll, viewport 375 explícito). **Home (hamburguesa/menú) parqueado** (`test.skip` por test): el menú es handler Qwik `on:click` sin `<input>` y `.mobile-menu` aparece duplicado (BUG-005) → abrir+asertar necesita inspección de DOM en vivo. El panel mantiene la columna Móvil como ⏳ (no corre móvil por área).
3. **Calidad transversal (F3)** — specs nuevos: consola JS · links a destino · 404 · Lighthouse.
4. **Flujos de área restantes** — buscador (Header) · selector de soluciones (Home) · compra de servicio (Servicios) · contacto submit / faq acordeón / distribuidores encadenado (Institucional).
5. **Móvil de Compra/Mi cuenta** — los mutantes a 375px.

> Lo bloqueado por causa externa (no es gap nuestro): BUG-457 wizard A/B inestable · BUG-566 reseñas rotas E2E · forgot-password no verificable en prod · `Delivered`→"entregado" irreproducible vía CT.

## Evidencias — dónde y cómo se guardan

Dos universos separados, a propósito:

| Origen | Ruta | Naming | Quién lo genera |
|---|---|---|---|
| **Manual (sesiones QA)** | `evidencias/*.png` (plano) | `E<n>-TC<n>-<desc>.png`, `BUG-<id>-<desc>.png`, `CAPA2-*`, `F<fase>-*` | el agente/QA a mano (regla 1 de CLAUDE.md) |
| **Panel (automático)** | `evidencias/panel/<area>/<slug>__<ok\|fail>.png` | slug del test + veredicto | hook `afterEach` de `tests/_helpers.js` |

**Captura del panel — cómo:** opt-in vía `DASH_EVIDENCE=1` (lo pone el panel en sus corridas; las corridas por CLI **no** lo setean → cero costo, cero archivos). El área sale de `DASH_AREA`. Es **latest por celda** (se sobreescribe cada corrida) → el tamaño queda acotado; el historial profundo lo da el **reporte HTML** de Playwright (`/report`) + git.

**Galería:** el panel sirve `/evidencias` (scoped SOLO a `evidencias/panel/`, NO al plano) → bloque "Evidencias de la última revisión" con miniaturas por área, servidas por `/evidencia/<area>/<file>`. Todo `evidencias/` está gitignored (no se commitea binario).
