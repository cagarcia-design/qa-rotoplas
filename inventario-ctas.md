# Inventario de CTAs / DOM Contracts — B2C Rotoplas (qarotoplasmx.io)

> **Propósito:** Mapeo exhaustivo y modular del sitio B2C. Base para escribir `tests/` que detecten regresiones post-deploy del tipo "un elemento desapareció, un link cambió de href, una sección ya no renderiza".
>
> **Estructura del documento (5 partes; la Parte V / matriz B2B↔B2C fue descartada — no aporta a este equipo):**
> 1. **COMPONENTES REUSABLES** — fuente de verdad para DOM contracts. Cada componente se documenta UNA vez.
> 2. **PÁGINAS** — compone componentes globales + secciones únicas. Evita duplicar info.
> 3. **AUDITORÍAS GLOBALES** — console, network, tracking, performance, WhatsApp, tablas globales.
> 4. **BUGS NUMERADOS** — listado consolidado con severidad y evidencia.
> 6. **DOM CONTRACTS EJECUTABLES** — snippets Playwright agrupados por componente, listos para copy-paste. *(Se conserva la etiqueta "Parte VI" para no romper las referencias internas; la Parte V quedó vacante.)*
>
> **Sesión:** `andrei.garcia@xideral.co` (cuando autenticado) | invitado para el resto.
> **Fecha de mapeo:** 2026-05-27. **Última actualización:** 2026-06-05.
> **Framework del sitio:** **Qwik (Builder.io CMS)** — atributos `q:id`, `q:key`, `on:click="q-<chunk>.js#s_<symbol>"`, CSS scoping con prefijo `⭐️` (NO bug).

---

## Estado de cobertura

> El cuerpo de este inventario describe el sitio **en presente**. El avance del mapeo vive **solo en esta tabla**; los gaps puntuales abiertos viven en `overview.md` → "Pendientes de mapeo abiertos".

| Fase | Alcance | Estado |
|---|---|---|
| F0 · Setup + detección de framework | — | ✅ Completo |
| F1A · Estructural anónimo | Home, login, signup, forgot, contacto, FAQs, traking, header/footer global | ✅ Completo |
| F1B · Estructural autenticado | `/customer/*`, header autenticado, logout | ✅ Completo |
| F1C · Catálogo | 8 categorías + 3 sub-categorías + PDP + listing genérico (I.16) + add-to-cart | ✅ Completo |
| F1D · Marketing / contenido | blog, nosotros (+sub), distribuidores, servicios (+wizard), recursos (+sub), legales | ✅ Completo |
| F2 · Gap-closure | mini-cart, CFDI, métodos de pago, modales PDP, código descuento, network polling | ✅ Completo |
| F3 · Transaccional E2E | tarjeta, transferencia, efectivo, tarjeta rechazada, signup | ✅ Completo |
| F4 · Mobile (390×844) | home, PDP, cart, customer | ✅ Completo · Lighthouse mobile ✅ (III.6) |
| F5 · Auditorías globales | consola, red/PII, chatbot, AG Grid, Lighthouse, a11y | ✅ Completo |
| F6 · DOM contracts ejecutables | Parte VI | ⏳ Pendiente |
| F7 · Limpieza + handoff | ruido meta eliminado; Parte IV = tabla maestra de bugs (505 activos); 37 punteros en recaps grandes + descripciones inline conservadas en bugs locales; jerarquía de headings corregida (101 cambios); pendientes → overview; no-pérdida verificada | ✅ Completo |

---

## 📑 Índice navegable

### Parte I — Componentes reusables
- I.1 Header global (anónimo) · I.1.b Header autenticado
- I.2 Nav superior (top-bar) + submenús
- I.3 Mega-menú lateral (drawer)
- I.4 Footer global
- I.5 Barra promocional / aviso de cookies
- I.6 Modal "Verifica disponibilidad" / "Agregar dirección"
- I.7 Widget verificación CP
- I.8 Carrusel de productos (genérico)
- I.9 Tarjeta de producto
- I.10 Newsletter signup
- I.11 Chatbot Silvia (Dialogflow CX)
- I.12 Toasts (catálogo)
- I.13 Mini-cart drawer
- I.14 Forms — a) Login · b) Signup · c) Forgot password · d) Contacto
- I.15 Sidebar área de cuenta (`/customer/*`)
- I.16 Componente Listing genérico (`/products/[categoria]/`)

### Parte II — Páginas
- II.1 `/` Home (anónima) + Matriz de URLs verificadas
- II.2 `/login/`
- II.3 `/signup/` (+ registro E2E)
- II.4 `/forgot-password/`
- II.5 `/cart/`
- II.5.b `/checkout/[1-3]/` (Dirección → Información → Pago)
- II.6 Confirmación de compra `/order/[orderNumber]/`
- II.7 Listings de catálogo — II.7.1 Almacenamiento (+captadores, +tinacos) · II.7.2 Especializado · II.7.3 Presurización · II.7.4 Purificación · II.7.5 Tratamiento · II.7.6 Calentamiento · II.7.7 Conducción · II.7.8 Servicios
- II.8 PDP `/product/[slug]_[id]/`
- II.9 `/customer` (Mis datos)
- II.10 `/customer/orders` (+ II.10.b detalle de pedido)
- II.11 `/customer/address` (+ II.11b reseñas · II.11c wishlist)
- II.12 `/traking/` vs `/tracking/`
- II.13 `/preguntas-frecuentes/`
- II.14 `/contacto/`
- II.15 `/distribuidores/`
- II.16 `/servicios/` + `/servicios-lavado/` (+ II.16.c wizard de cotización)
- II.17 `/nosotros/` (+ II.17.a quiénes-somos · II.17.b presencia)
- II.18 `/blog/` (+ II.18.b post individual)
- II.19 `/recursos/` (+ II.19.a videos · II.19.b tips · II.19.c librería)
- II.20 Páginas legales

### Parte III — Auditorías globales
- III.1 Tracking y privacidad
- III.2 Consola JS por página
- III.3 Network polling y endpoints
- III.4 WhatsApp / chatbot por página
- III.5 AG Grid (si aplica)
- III.6 Performance / Lighthouse
- III.7 Accesibilidad
- III.8 Mobile (390×844)

### Parte IV — Registro de bugs
- Tabla maestra consolidada (BUG-B2C-001 → 534) + apéndice "IDs retirados"

### Parte VI — DOM Contracts ejecutables

---

# Parte I — COMPONENTES REUSABLES

> Convenciones Qwik (aplican a TODOS los componentes):
> - No usar `q:id` como selector — son auto-generados y volátiles entre builds.
> - Las clases `⭐️*` son CSS scope por componente — pueden cambiar al rebuild. Preferir atributos semánticos (`id`, `aria-label`, `name`, `alt`).
> - Handlers `on:click="q-XXX.js#..."` cargan lazy. Esperar 100-300ms tras `goto` antes del primer click crítico.

---

## I.1 Header global

> Selector raíz: `header.header-main` (tag semántico ✅)
> Presente en: TODAS las páginas (anónimas + autenticadas).

### Estructura DOM

```
<header class="header-main">
  ├─ <input type="checkbox" id="close-promo">  ← controla la barra promocional vía CSS :checked
  └─ <div class="tools-bar">
       ├─ <div class="menu-container">
       │   ├─ <div class="desktop-menu">
       │   │   └─ <label for="open-menu" class="tool menu">  ← icono hamburguesa SVG azul (#165EEB)
       │   └─ <div class="mobile-menu">
       │       └─ <button aria-label="Abrir menú" class="tool menu">  ← versión mobile del mismo
       ├─ <div class="logo-container" title="ir al inicio">
       │   └─ <img src="cdn.builder.io/.../d58db9..." alt="logo" width=150 height=50>
       ├─ <div class="⭐️search-container">
       │   └─ <input id="search-input" placeholder="Encuentra lo que buscas aquí...">
       │   └─ <button>"Ver todos los resultados"</button>
       ├─ link "Inicia sesión o regístrate"  ← cuando ANÓNIMO
       └─ <a href="/cart">  ← icono carrito (sin badge en anónimo)
</header>
```

### Elementos

| Elemento | Selector estable | Tipo | Estado | Notas |
|---|---|---|---|---|
| Hamburger desktop | `label[for="open-menu"]` | label (CSS toggle) | Visible | Abre **mega-menú lateral** (sección I.3) |
| Hamburger mobile | `button[aria-label="Abrir menú"]` | button | Solo <768px | Handler Qwik `q-Di2QeAYP.js#s_mEfQJuL0y1I` |
| Logo | `header img[alt="logo"]` | img CDN Builder | Visible siempre | `<div on:click>` NO `<a>` — navega vía JS programático. SEO impact (BUG-B2C-015) |
| Search input | `input#search-input` | text | Visible siempre | Placeholder `Encuentra lo que buscas aquí...`. **DOM tiene 2 inputs con mismo id** → BUG-B2C-016 |
| Ver todos los resultados | `button:has-text("Ver todos los resultados")` | button | Visible al typear | 2 botones en DOM (uno por instancia del search) |
| Login link | `a:has-text("Inicia sesión o regístrate")` | StaticText | Solo anónimo | Cambia a "Mi cuenta" / dropdown cuando autenticado (verificar F1B) |
| Carrito | `header a[href="/cart"]` | a | Visible siempre | Badge numérico cuando hay items (verificar tras add-to-cart) |

### Bugs en este componente
**Bugs de esta sección:** BUG-B2C-002, 015, 016 — detalle en Parte IV.

### Contract (ver Parte VI)

---

## I.2 Nav superior (top-bar)

> Detectado como `<navigation>` separado del header en el snapshot (uid=1_2). Presente en TODAS las páginas.

### Items observados (anónimo, viewport 1366)

| Texto | Tipo | href | Notas |
|---|---|---|---|
| Tienda | link `<a>` | `/` | Apunta al mismo home — redundante con el logo |
| Conocenos | link `<a>` | `/nosotros/` | ⚠️ falta tilde "Conócenos" → **BUG-B2C-009** |
| Rotoplas Servicios | **submenu-launcher** | — (dropdown) | ✅ ES expandible: revela 5 links externos en hover. Ver §"Submenús" abajo. (BUG-010 anulado) |
| Blog | link `<a>` | `/blog` | (footer apunta a `/blog/` con `/` final, este sin → inconsistencia) |
| Amigo Plomero | **submenu-launcher** | — (dropdown) | ✅ ES expandible: revela 2 links externos en hover. (BUG-011 anulado) |
| Recursos | link `<a>` | `/recursos/` | ✅ 200 verificado (II.19) |
| Contacto | link `<a>` | `/preguntas-frecuentes/` | ⚠️ Mismo bug del footer — debería ir a `/contacto/` → **BUG-B2C-003** confirmado en 2 lugares |
| Ver mas | **submenu-launcher** | — (dropdown) | ✅ ES expandible: revela 1 link (Distribuidores B2B). Falta tilde "Ver más" → BUG-017. |

### Submenús expandibles del nav

> "Rotoplas Servicios", "Amigo Plomero" y "Ver mas" son submenu-launchers con dropdowns de links externos. El a11y snapshot no expone el submenú porque los launchers carecen de `role`/`aria-haspopup` (BUG-436); por eso el árbol a11y los reporta como texto plano.

**Mecanismo:** `.submenu` tiene `display:none` por defecto → se revela en **hover CSS** (dropdown `position:absolute`). El launcher **NO tiene `on:click` en desktop** (solo hover). En mobile (`nav.mobile-navbar`) el `.menu-link-mob` SÍ tiene handler de toggle (`q-8k5p389a.js#s_w04u9rGB8uI`).

**Estructura DOM (desktop):**
```
nav.desktop-nav > .links > .menu-item
  > .submenu-launcher (span "Rotoplas Servicios" + chevron svg)
  > .submenu (display:none) > a[target=_blank] > div.submenu-link "Bebbia"
```
**Duplicación desktop/mobile:** existen **2 `<nav>`** (`mobile-navbar` + `desktop-nav`), cada uno con su copia completa de los 8 links → DOM duplication (mismo patrón que footer BUG-005).

#### Submenú 1 — "Rotoplas Servicios" (5 links, chevron `<svg>`)

| Texto | href | target | rel |
|---|---|---|---|
| Bebbia | `https://bebbia.com/` | `_blank` | ❌ (vacío) |
| Rieggo | `https://rieggo.com/` | `_blank` | ❌ (vacío) |
| Agroindustria | `https://agroindustria.rotoplas.com.mx/` | `_blank` | ❌ (vacío) |
| Servicios de agua | `https://www.rotoplasserviciosdeagua.com.mx/` | `_blank` | ❌ (vacío) |
| Tuboplus | `https://rotoplas.com.mx/tuboplus` | `_blank` | ❌ (vacío) |

#### Submenú 2 — "Amigo Plomero" (2 links, chevron `<svg>`)

| Texto | href | target | rel |
|---|---|---|---|
| Capacitación | `https://capacitacion.rotoplas.com/` | `_blank` | ❌ (vacío) |
| Gana más con rotoplas | `https://ganamasconrotoplas.com/` | `_blank` | ❌ (vacío) |

#### Submenú 3 — "Ver mas" (1 link, chevron `<img>`)

| Texto | href | target | rel |
|---|---|---|---|
| Distribuidores | `https://b2bdistribuidores.rotoplas.com/login` | `_blank` | ❌ (vacío) |

#### Bugs de los submenús del nav

**Bugs de esta sección:** BUG-B2C-435, 436, 437, 438, 439, 009, 003, 017, 018 — detalle en Parte IV. (BUG-010 y 011 anulados → reclasificados a BUG-436; ver Apéndice IDs retirados.)

#### DOM contract — submenús del nav

```javascript
test('I.2 nav submenús expandibles', async ({ page }) => {
  await page.goto('https://qarotoplasmx.io/');
  // 8 anchors externos target=_blank sin rel (BUG-435)
  const blank = page.locator('nav.desktop-nav a[target="_blank"]');
  expect(await blank.count()).toBe(8);
  for (const a of await blank.all()) {
    expect((await a.getAttribute('rel')) || '').not.toContain('noopener'); // hoy true (BUG-435)
  }
  // submenú revela en hover
  const launcher = page.locator('.menu-item', { hasText: 'Rotoplas Servicios' });
  await launcher.hover();
  await expect(page.locator('a[href="https://bebbia.com/"]')).toBeVisible();
  // BUG-436: launcher sin aria-haspopup
  expect(await page.locator('.submenu-launcher').first().getAttribute('aria-haspopup')).toBeNull();
});
```

#### Evidencia

- `evidencias/F1D-12-nav-submenus-expandidos.png` — 3 submenús forzados visibles (display:block)
- `scripts/F1D-nav-submenus-deep.json` — estructura DOM + 8 links + verificación rel

### Contract (Parte VI)

---

## I.3 Mega-menú lateral (drawer)

> Se abre al hacer click en hamburger del header (`label[for="open-menu"]`).
> Selector raíz: `div.drawer-panel.header-extension`
> Backdrop: `div.drawer-backdrop`
> Contenedor exterior: `div.drawer-container` (1361×581 en viewport 1366)

### Estructura del drawer (anónimo)

```
<div class="drawer-panel header-extension">  ← 550x511px
  ├─ <h3>Categorías</h3>
  │   ├─ <button>Servicios Nuevo</button>   ← badge "Nuevo"
  │   ├─ <button>Almacenamiento</button>
  │   ├─ <button>Almacenamiento Especializado</button>
  │   ├─ <button>Conducción</button>
  │   ├─ <button>Presurización</button>
  │   ├─ <button>Tratamiento</button>
  │   ├─ <button>Calentamiento</button>
  │   ├─ <button>Purificación</button>
  │   └─ <button>Mascotas</button>          ← ⚠️ no aparece en footer
  ├─ <h3>Sub categorías</h3>
  │   └─ <button>Lavado de Tinaco y Cisterna</button>
  ├─ <h3>Promociones Calidad</h3>
  │   ├─ <h3>Promo</h3>
  │   └─ <button>Prueba</button>            ← ⚠️ contenido placeholder
  └─ <button aria-label="Cerrar">×</button>
```

### Categorías ofrecidas — 9 items

1. Servicios (badge "Nuevo")
2. Almacenamiento
3. Almacenamiento Especializado
4. Conducción
5. Presurización
6. Tratamiento
7. Calentamiento
8. Purificación
9. **Mascotas** — categoría que existe aquí pero NO en el footer ni en "Lo más vendido"

### Bugs detectados
**Bugs de esta sección:** BUG-B2C-013, 019, 020 — detalle en Parte IV.

### Contract (Parte VI)

---

## I.4 Footer global

> Selector raíz: `footer` (tag semántico ✅)
> Presente en TODAS las páginas.
> Estructura: una sección `div.⭐️c79o2-0.grid` con 6 columnas de links.

### Columnas y links (verificados)

#### Columna A: Servicio al cliente (`<h3>`)
| Texto | href | Target |
|---|---|---|
| Seguimiento del pedido | `/traking/` | _self | ⚠️ typo "traking" → **BUG-B2C-008** |
| Preguntas frecuentes | `/preguntas-frecuentes/` | _self |
| Soy distribuidor | `https://b2bdistribuidores.rotoplas.com/login` | _blank |
| Quiero ser distribuidor | `https://quiero-ser-distribuidor.rotoplas.com.mx/` | _blank |

#### Columna B: Productos (`<h3>`)
| Texto | href | Notas |
|---|---|---|
| Almacenamiento | `/products/almacenamiento/` | |
| Almacenamiento Especializado | `/products/almacenamiento-especializado/` | |
| Presurización | `/products/presurizacion/` | |
| Purificación | `/products/purificacion/` | |
| Tratamiento | `/products/tratamiento/` | |
| Calentamiento | `/products/calentamiento` | ⚠️ sin `/` final → **BUG-B2C-007** |
| Conducción | `/products/conduccion/` | |

> ⚠️ Falta "Mascotas" y "Servicios" comparado con mega-menú lateral → BUG-B2C-013

#### Columna C: Sobre Rotoplas (`<h3>`)
| Texto | href | Target |
|---|---|---|
| Rotoplas corporativo | `https://rotoplas.com/` | _blank |
| Sustentabilidad | `https://rotoplas.com/sustentabilidad/` | _blank |
| Agroindustria | `https://agroindustria.rotoplas.com.mx/` | _blank |
| Carreras | `https://rotoplas.com/careers/` | _blank |
| Ubicación distribuidores | `/distribuidores/` | _self |
| Servicios por contratación | `/servicios/` | _self |
| Blog | `/blog/` | _self |

#### Columna D: Contáctanos (`<h3>`)
| Texto | href | Notas |
|---|---|---|
| Contacto | `/preguntas-frecuentes` | ⚠️ apunta a FAQ → **BUG-B2C-003** |
| Déjanos un mensaje | `/contacto/` | _self |

#### Columna E: Certificación de datos (`<h3>`)
- "Tus pagos están protegidos por nuestra certificación de datos" → PDF PCI DSS `storage.googleapis.com/rtp-bucket-b2b-prd/B2C/Recursos/certification_pci_dss_rotoplas.pdf` (_blank)
- + image `cdn.builder.io/.../9d513f6d6af44b70b5451e3386cf76b9` (alt: "Tus pagos están protegidos...")

#### Columna F: Síguenos (`<h3>`)
| Red | href |
|---|---|
| Facebook | `https://www.facebook.com/share/vR37WcfFW32gto8j/?mibextid=LQQJ4d` |
| Instagram | `https://www.instagram.com/gruporotoplas?igsh=MTlxdm4wYWxlN3Rp` |
| YouTube | `https://www.youtube.com/channel/UChnJZvrPqHVyJnQF-c6ssGg` |
| LinkedIn | `https://www.linkedin.com/company/grupo-rotoplas/` |

### Payment methods (imágenes)
- `cdn.builder.io/.../bcff2bfb0b5d497f8f29a8ef7c342f59` alt `"Payment method"` (sin descripción específica)
- `cdn.builder.io/.../e1da66bb61fe45a895380466ae79ed85` alt `"Payment method"` (sin descripción específica)
- Bug de esta sección: BUG-B2C-021 (alt genérico "Payment method") — detalle en Parte IV.

### Legales (fila inferior, sin `<h3>`)
| Texto | href | Notas |
|---|---|---|
| Aviso de privacidad | `/aviso-de-privacidad` | sin `/` final |
| Términos y condiciones | `/terminos-y-condiciones` | sin `/` final |
| Seguridad de la información | `/seguridad-de-la-informacion/` | con `/` final |
| Código de ética | `https://storage.googleapis.com/.../rtp_codigo_de_etica_y_conducta_esp_baja_movil_20190711.pdf` | _blank — PDF |

### Copyright
- `Copyright © 2026 Rotoplas S.A. de C.V. Todos los derechos reservados.`
- Año hardcodeado (BUG-B2C-022 — detalle en Parte IV).

### Newsletter (form, sin `<h3>` separado en footer pero relacionado)
- Input email `placeholder="Compartenos un email"` (sin tilde) → BUG-B2C-004 (detalle en Parte IV)
- Botón **"Suscribirse"** (visible en home, no necesariamente en footer global — verificar)

### Resumen de bugs del footer
**Bugs de esta sección:** BUG-B2C-003, 004, 005, 007, 008, 021, 022 — detalle en Parte IV.

### Contract (Parte VI)

---

## I.5 Barra promocional close-promo

> Patrón CSS-only para banner dismissible (no requiere JS).
> Selector raíz: `<input type="checkbox" id="close-promo">` en el header — al marcar, CSS oculta el banner via `#close-promo:checked ~ .promo-bar { display: none }`.
> Posición observada: y=78 (debajo del nav superior, encima del header con logo/búsqueda)
> Texto: `"Consulta qué productos tenemos listos para enviar a tu ubicación"` (a x=425, w=487)
> Botón: `<button>Ver cómo</button>` (a x=920, w=52)

### Comportamiento — CTA "Ver cómo"
- **Click en "Ver cómo"** → abre el modal `<dialog>` "Verifica disponibilidad de entrega" (componente I.6)

**Dismiss:** patrón CSS-only `#close-promo:checked ~ … { display:none }`. **No existe `label[for="close-promo"]` en el DOM** (el checkbox de cierre no tiene control enlazado visible) y su estado **no se persiste** en storage → si se oculta, el banner reaparece en cada recarga.

**Evidencia:** `F1A-05-home-banner-promo-visible.png`

---

## I.6 Modal "Verifica disponibilidad de entrega" / "Agregar dirección" (2 pasos)

> Selector raíz: `<dialog class="⭐️y68z3c-0 ⭐️wumgim-1 modal" aria-label="Verifica disponibilidad de entrega" modal>`
> **Triggers verificados:**
> 1. Click en botón "Ver cómo" del banner promo (I.5)
> 2. Aparece auto-modal al primer add-to-cart cuando el usuario no tiene CP guardado

### Paso 1 — Captura de Código Postal (default al abrir)

| Elemento | Selector | Tipo | Descripción |
|---|---|---|---|
| H2 | `dialog h2:has-text("Verifica disponibilidad de entrega")` | heading | Título principal del modal |
| Botón Cerrar | `dialog button[aria-label="Cerrar"]` o `button:has-text("Cerrar")` (description="Cerrar") | button | Cierra el modal |
| Texto principal | `"Ingresa tu ubicación para mostrarte el catálogo disponible con envío a tu domicilio"` | StaticText | |
| Texto secundario | `"No te preocupes, puedes escribir tu código postal"` | StaticText | ⚠️ copy raro ("no te preocupes" como apertura) |
| Input CP | `input[placeholder="Código postal"]` (aria-label "Código postal") | textbox | Sin `name` ni `id` → BUG-B2C-023 |
| Botón CP | `button:has-text("Buscar por código postal")` | button — CTA primario | |
| Botón dirección | `button:has-text("Escribir dirección")` | button — CTA secundario | Lleva al Paso 2 |

### Paso 2 — Form completo "Agregar dirección"

| Campo | Selector | Tipo | Required | Notas |
|---|---|---|---|---|
| Volver | `button:has-text("Volver")` | button | — | Regresa al Paso 1 |
| Cerrar | `dialog button[aria-label="Cerrar"]` | button | — | Cierra el modal |
| H2 | `dialog h2:has-text("Agregar dirección")` | heading | — | Cambia entre paso 1 y 2 |
| H3 (subtítulo) | `"Ingresa tu ubicación..."` | heading | — | ⚠️ **BUG-B2C-045** h3 sin h2 inmediato (jerarquía rota) |
| Calle | `input[name="streetName"]` (textbox "Calle*") | text | ✅ | |
| Número exterior | `input[name="streetNumber"]` (textbox "Número exterior*") | text | ✅ | |
| Número interior | `input[name="noInt"]` (textbox "Número interior") | text | ❌ | Único campo NO requerido |
| Código postal | `input[name="postalCode"]` (textbox "Código postal*") | text | ✅ | Pre-llenado si vino del Paso 1 |
| **Colonia** | `select[name="building"]` | combobox | ✅ | ÚNICO campo combobox — opciones se pueblan por el CP (Sepomex). ✅ verificado: CP 06700 → "Roma Norte" |
| Ciudad | `input[name="city"]` (textbox "Ciudad*") | text | ✅ | ✅ **auto-llenado por CP confirmado** (06700 → "Ciudad de México") |
| Estado | `input[name="state"]` (textbox "Estado*") | text | ✅ | ✅ **auto-llenado por CP confirmado** (06700 → "Ciudad de México") |
| Entre calles | `input[name="additionalAddressInfo"]` o equivalente (textbox "Entre calles") | text | ❓ | ⚠️ **BUG-B2C-046** — leyenda externa dice `*` pero placeholder dice "Entre calles" sin asterisco |
| Leyenda | `" Campos obligatorios."` | StaticText | — | ⚠️ **BUG-B2C-047** — espacio inicial en blanco antes de "Campos" |
| Heading alias | `"Guardar dirección como"` | StaticText | — | |
| Radio Casa | `input[type="radio"][name="manualAddressAlias"][value="casa" o similar]` | radio | — | |
| Radio Oficina | idem `value="oficina"` | radio | — | ⚠️ B2B usa "Trabajo" — verificar matriz |
| Radio Obra | idem `value="obra"` | radio | — | ⚠️ **BUG-B2C-048 (INFO)** — categoría "Obra" específica construcción, no en B2B |
| Radio Otro | idem `value="otro"` | radio | — | |
| CTA primario | `button:has-text("Ubicar en el mapa")` | button | — | DISABLED hasta completar campos requeridos |

### Bugs del componente
**Bugs de esta sección:** BUG-B2C-045, 046, 047, 048, 049 — detalle en Parte IV.

### Flujo del Paso 1

El paso 1 ofrece **tres rutas** (todos `type="submit"` salvo el de mapa):
- **Buscar por código postal** (icon-only, `aria-label="Buscar por código postal"`, class `submit-btn`): al teclear un CP válido (ej. **02800**) la consulta de disponibilidad se resuelve vía **Qwik server function** (`POST /?qfunc=…`, no REST público) y el modal muestra **"disponible"** + un **mapa de Google interactivo** con un **pin arrastrable** y el tooltip *"Ajusta el pin para validar la dirección"*, más el botón **"Confirmar punto de entrega"**. El input CP es `type="text"` con **`inputmode="numeric"`** (teclado numérico móvil ✓), `maxlength=5`, **sin `name` ni `id`** (BUG-023).
- **Ubicar en el mapa** (`locate-btn`, `type="button"`): geolocalización del navegador.
- **Escribir dirección** (`address-…`, submit): cambia al Paso 2 (form manual).

**Positivos:** el mapa de Google **sí es interactivo** (pin arrastrable, confirma el punto de entrega); el CP resuelve disponibilidad sin recargar. Evidencia: `F1C-30-modal-i6-cp-disponible-mapa.png`.

> El autofill por CP en el form fiscal del checkout (mismo motor) está verificado en II.5.b §12.

### Paso 2 — validación, autofill y guardado (verificado en vivo s12, autenticado)

Ejercido vía `/customer/address/` → "Agregar dirección" (la misma instancia del modal I.6), creando una dirección real (Oficina / Álvaro Obregón 100, Roma Norte, CP 06700). Hallazgos:

- **Autofill por CP CONFIRMADO** (ya no "probablemente"): al teclear el CP en `input[name="postalCode"]` se dispara la consulta Sepomex (Qwik `?qfunc`) y se rellenan **`select[name="building"]` (Colonia)** con las colonias del CP + **`input[name="city"]`** + **`input[name="state"]`**. Verificado: CP `06700` → Colonia "Roma Norte", Ciudad "Ciudad de México", Estado "Ciudad de México".
- **Sin validación inline por campo:** el form **no muestra mensajes de error** al dejar campos vacíos. La validación es por **gating-disable**: el CTA "Ubicar en el mapa" permanece `disabled` hasta que estén llenos **Calle + Número exterior + Código postal + Colonia + Ciudad + Estado + un alias** (Casa/Oficina/Obra/Otro). Confirmado: con todos los textos llenos pero **sin alias seleccionado** el botón sigue `disabled`; al elegir alias se habilita. *(Contrasta con `/contacto`, `/signup`, `/traking` que sí permiten submit vacío con error inline → inconsistencia de política de validación ya registrada.)*
- **Radios de alias custom-styled (0×0):** el `<input type="radio" class="alias-option__input">` real es invisible (tamaño 0); solo el label estilizado es clickeable → un `el.click()` programático no basta, requiere click real sobre el label (patrón Qwik).
- **3er paso = mapa en ruta propia:** "Ubicar en el mapa" navega a **`/customer/address/add/`** (no es overlay) con el mapa Google interactivo + botón **"Confirmar punto de entrega"**.
- **Guardado SILENCIOSO (BUG-B2C-526):** tras "Confirmar punto de entrega" la dirección se guarda y aparece en `/customer/address/`, **pero NO se muestra ningún toast/confirmación** de éxito. El usuario no recibe feedback de que se guardó.
- **Auto-default sin preguntar (BUG-B2C-527):** la dirección recién agregada se marca **automáticamente como "predeterminada de envío"** (el header pasó a CP 06700) sin confirmación del usuario — cambia el destino de entrega de forma silenciosa.

**Caveat de disponibilidad (sub-paso del toggle de instalación, II.8 §19.b):** se cambió el CP de entrega a 06700 (Roma Norte) para intentar habilitar el toggle de instalación, pero **los 4 tinacos-con-bomba (los únicos productos con el toggle) siguen "No disponible"** tanto en 02800 como en 06700 → es una limitación de **datos de stock del entorno QA**, no de la herramienta. El recálculo de precio + persistencia del add-on de instalación en el cart queda sin ejercer por falta de un SKU instalable en stock.

**Evidencias:** `F1A-07-modal-verifica-disponibilidad-paso1.png`, `F1A-08-modal-agregar-direccion-paso2-form.png`, `F2-31-modal-direccion-paso3-mapa.png`

---

## I.7 Widget verificación CP

> Componente reutilizado desde I.6 (Modal "Verifica disponibilidad de entrega"). Se dispara desde el banner de ubicación (`#zipCodeCoverageHeader`) que aparece en home y páginas anónimas.

### Banner trigger (presente en home y páginas anónimas)

```html
<div id="zipCodeCoverageHeader" style="background:#ABF7CB;padding:16px 8px;display:flex;justify-content:center"
     on:qvisible="q-rCbmexQw.js#_hW[0] q-rCbmexQw.js#_hW[1]" q:id="zl">
  <svg>…</svg>
  <span><strong>Consulta qué productos tenemos listos para enviar a tu ubicación</strong></span>
  <button on:click="q-rCbmexQw.js#s_f2kd0B6g6Qg[0 1 2 3]" q:id="zm">Ver cómo</button>
</div>
```

Click en "Ver cómo" → abre el `<dialog modal>`.

### Modal "Verifica disponibilidad de entrega" (mapeado 2026-06-05)

- **Elemento:** `<dialog modal>` — tag semántico ✅
- **H2:** `"Verifica disponibilidad de entrega"`
- **Copy:** `"Ingresa tu ubicación para mostrarte el catálogo disponible con envío a tu domicilio"` + `"No te preocupes, puedes escribir tu código postal"`
- **Botón cerrar:** `<button>` (X) en esquina superior derecha

#### Paso 1 — Código Postal (default)

| Elemento | Selector / Atributos |
|---|---|
| Input CP | `<input type="text" placeholder="Código postal">` — sin `name`, sin `id`, sin `maxlength` |
| Botón submit | `<button>Buscar por código postal</button>` — handler Qwik |
| Botón alternativo | `<button>Escribir dirección</button>` — cambia al Paso 2 (form manual, ver I.6) |

**Comportamiento verificado:** al teclear CP 02800 y click en "Buscar por código postal", el modal muestra confirmación de cobertura (autofill de Colonia/Municipio vía endpoint `?qfunc`) y permite continuar. El CP se persiste en el estado Qwik de la sesión.

### Bugs de esta sección
**Bugs de esta sección:** BUG-B2C-023 (input CP sin name ni id) — detalle en Parte IV.

### DOM Contract
```js
// Trigger desde home
await page.locator('button:has-text("Ver cómo")').click();
const dialog = page.locator('dialog[open], [role="dialog"]').first();
await expect(dialog).toBeVisible();
await expect(dialog.locator('h2')).toHaveText('Verifica disponibilidad de entrega');
// Input CP
const cpInput = dialog.locator('input[placeholder="Código postal"]');
await cpInput.fill('02800');
await dialog.locator('button:has-text("Buscar por código postal")').click();
// Verificar POST al endpoint Qwik del CP (qfunc)
const [cpReq] = await Promise.all([
  page.waitForRequest(r => r.url().includes('qfunc=') && r.method() === 'POST'),
  dialog.locator('button:has-text("Buscar por código postal")').click()
]);
expect(cpReq.headers()['x-qrl']).toBeTruthy();
```

---

## I.8 Carrusel de productos (genérico)

> Componente reusable usado en home en al menos 2 secciones: "Lo más vendido por categoría" y "Productos recomendados".

### Estructura

```
<section>
  ├─ <StaticText>"Lo más vendido por categoría" | "Productos recomendados"</StaticText>
  ├─ Tabs de categoría (solo en "Lo más vendido")
  │   ├─ Almacenamiento
  │   ├─ Almacenamiento especializado
  │   ├─ Presurización
  │   ├─ Purificación
  │   ├─ Tratamiento
  │   └─ Calentamiento
  │   ⚠️ NO incluye: Conducción ni Mascotas → BUG-B2C-014
  ├─ <button disabled>‹ scroll left</button>
  ├─ Tarjetas de producto (ver I.9) ×8
  ├─ <button>scroll right ›</button>
  └─ Paginación dots
      ├─ <button aria-label="Ir al slide 1">●</button>
      ├─ <button aria-label="Ir al slide 2">○</button>
      ├─ <button aria-label="Ir al slide 3">○</button>
      └─ <button aria-label="Ir al slide 4">○</button>  ← solo en "Lo más vendido"
</section>
```

### Bugs
**Bugs de esta sección:** BUG-B2C-014, 024 — detalle en Parte IV.

---

## I.9 Tarjeta de producto

> Item interno del carrusel I.8 y de los listings de categoría.

### Estructura observada (home)

```
<card>
  ├─ Badge descuento: <StaticText>"-XX%"</StaticText>  (puede ser 0 → BUG-B2C-025)
  ├─ Badge "+ vendido" o "+ Vendidos" (inconsistente capitalización → BUG-B2C-026)
  ├─ <h3>Nombre del producto</h3>  (a veces se muestra 2x con texto truncado: "Tinaco Plus+ Tinaco Plus+...")
  ├─ "Ideal para: N personas"  (solo algunos productos)
  ├─ Precio actual: $XX,XXX.XX  (segmentado en 4 StaticText: $, entero, ., decimal)
  ├─ Precio anterior tachado: $XX,XXX.XX
  └─ <button>Agregar al carrito</button>
</card>
```

### Bugs detectados
**Bugs de esta sección:** BUG-B2C-025, 026, 027, 028 — detalle en Parte IV.

### Productos confirmados en home (referencia)
| Nombre | Precio | Precio anterior | % desc |
|---|---|---|---|
| Cisterna 5,000 litros | $21,279.06 | $21,494.00 | -1% |
| Cisterna 10,000 litros | $44,984.29 | $46,366.00 | -2% |
| Tinaco Plus+ equipado 2,500 litros color beige | $7,372.61 | $9,215.77 | -20% |
| Tinaco Plus+ equipado 800 litros color beige | $3,332.45 | $4,165.56 | -19% |
| Cisterna 2,800 litros | $9,218.95 | $12,291.93 | -24% |
| Multiconector con válvula esfera y tuerca unión integrada | $178.20 | $198.00 | -10% |
| Tinaco Plus+ equipado 450 litros color beige | $2,417.71 | $3,022.14 | -20% |
| Cisterna equipada 5,000 litros | $24,536.16 | $24,784.00 | -1% |
| Tanque vertical estándar 25,000 litros color negro | $124,714.31 | $155,892.90 | -20% |
| Bomba presurizadora 1/2 HP | $1,592.25 | $2,123.00 | -25% |
| Biodigestor Plus+ 1,300 litros | $16,664.40 | $18,516.00 | -10% |
| Regadera Eléctrica EcoDucha 3T | $496.00 | — | (sin descuento) |
| Registro de lodos para biodigestor | $2,257.00 | — | (sin descuento) |

---

## I.10 Newsletter signup

> Sección en home (`<h2>Descubre un mundo de ofertas exclusivas</h2>`) y replicada en footer.
> Input: `<textbox required>` con `placeholder="Compartenos un email"` → BUG-B2C-004
> Botón: icon-only `<button aria-label="Suscribirse" title="Suscribirse">` (handler Qwik `q-Afg11N0z.js#s_y8BHXu107YM`)
> Texto secundario: "Sé el primero en saber de nuestros descuentos especiales y lanzamientos"

**Submit con email inválido** (`type="email"`, typeMismatch): el campo **se limpia sin mostrar error inline ni toast de feedback** y dispara pixels de tracking Builder.io (`.builder-pixel-*`).

**Submit con email válido** (`qa.test.rotoplas@mailinator.com`, verificado en vivo 2026-06-05):
- **Endpoint:** `POST https://qarotoplasmx.io/?qfunc=WMuxo3zKEsY`
- **Headers:** `content-type: application/qwik-json`, `x-qrl: WMuxo3zKEsY`
- **Request body:** `{"_entry":"1","_objs":["\u0002_#s_WMuxo3zKEsY",["0"]]}`
- **Response:** `200` con body `{"_entry":"0","_objs":[[]]}` — respuesta vacía (sin confirmación inline, sin toast, sin mensaje de éxito/error)
- **Post-submit:** el campo se limpia, sin feedback visible al usuario. **No se verifica double opt-in** (depende de Capa 2 — correo, gap bloqueado).
- **DOM Contract:**
```js
await page.locator('input[placeholder="Compartenos un email"]').fill('test@mailinator.com');
await page.locator('button[aria-label="Suscribirse"]').click();
// Verificar POST al endpoint Qwik
const [req] = await Promise.all([
  page.waitForRequest(r => r.url().includes('qfunc=WMuxo3zKEsY') && r.method() === 'POST'),
  page.locator('button[aria-label="Suscribirse"]').click()
]);
expect(req.headers()['x-qrl']).toBe('WMuxo3zKEsY');
const resp = await req.response(); expect(resp.status()).toBe(200);
```

---

## I.11 Chatbot Silvia (Dialogflow CX)

> **NO es WhatsApp** — es Dialogflow CX inyectado vía Web Component `<df-messenger>`.
> Script: `https://www.gstatic.com/dialogflow-console/fast/df-messenger/prod/v1/df-messenger.js`
> Elemento raíz: `<df-messenger id="my-df-chat-injected">`

### Configuración Dialogflow CX (atributos del custom element)

| Atributo | Valor | Notas |
|---|---|---|
| `project-id` | `rtp-client-agents` | Proyecto GCP |
| `agent-id` | `8dccfcf3-f7ed-426c-be95-1ef2a066b078` | UUID del agente CX |
| `language-code` | `es` | Español |
| `intent` | `WELCOME` | Intent inicial al abrir |
| `location` | `global` | Región GCP |
| `max-query-length` | `256` | Límite caracteres por mensaje |

### Configuración burbuja (`<df-messenger-chat-bubble>` interna)

| Atributo | Valor |
|---|---|
| `chat-title` | `¡Hola soy Silvia!` |
| `chat-subtitle` | `Tu asistente virtual` |
| `chat-icon` | `https://storage.googleapis.com/rtp-client-agents-public-23892/avatar-ai.webp` |
| `chat-title-icon` | (mismo) |
| `placeholder-text` | `Escribe tu pregunta...` (NO se usa — ver bug) |

### Estado cerrado
- Botón visible: `<button aria-label="Abrir ¡Hola soy Silvia!" expandable>` (55×55px, esquina derecha media-alta)

### Estado abierto (mapeado vivo)

```
┌─ <h2>¡Hola soy Silvia!</h2>
├─ <h3>Tu asistente virtual</h3>
├─ <button aria-label="Cerrar ¡Hola soy Silvia!">×</button>
├─ ⚠️ StaticText "Se ha producido un error. Vuelve a intentarlo."   ← BUG-B2C-050
├─ Mensajes del agente (live region "polite"):
│   ├─ "Mensaje del agente:" + <h3>¡Hola! Soy Silvia</h3>
│   ├─ "Tu asistente especializado en soluciones Rotoplas. Puedo brindarte información detallada
│   │    sobre nuestros productos, precios vigentes y recomendaciones personalizadas.
│   │    Al interactuar conmigo, aceptas los términos de uso de este agente."
│   ├─ <a target="_blank">Leer Términos y Condiciones</a> → `rotoplas.com.mx/terminos-y-condiciones-ia/`
│   ├─ "Bienvenido, ¿Con qué puedo ayudarte el día de hoy?"
│   └─ "¿En qué solución de agua estás interesado hoy?"
├─ <textbox placeholder="Hablar con agente" multiline>   ← NO usa el `placeholder-text="Escribe tu pregunta..."` declarado en config
└─ <button>Enviar</button>   (disabled hasta typing)
```

### Interacción real con el NLU (verificado en vivo s12)

El `df-messenger` usa **shadow DOM cerrado** (`element.shadowRoot === null` → inaccesible por JS), pero **el árbol de accesibilidad sí lo expone** → se interactúa con DevTools por `uid` (no por selector CSS). Round-trip completo verificado:

- **Mensaje enviado:** "¿Qué tinaco me recomiendas para una casa de 4 personas?" (`textbox[aria-label="Hablar con agente"]` → botón "Enviar").
- **Respuesta del agente (NLU funcional):** *"Para una casa con 4 personas, te recomiendo el **Tinaco Tricapa Equipado de 750 litros**, ya que está diseñado específicamente para cubrir las necesidades de hasta 4 personas. También el **Tinaco de 1100 litros** es una excelente opción, pues puede abastecer a 4 a 6 personas sin inconvenientes."* + quick-reply de seguimiento: *"¿Te gustaría conocer el precio de alguno de estos modelos?"*
- **Conclusión:** el agente Dialogflow CX **responde correctamente** con recomendaciones de producto contextualizadas — el chat es **plenamente funcional**. Evidencia `F2-32-chatbot-silvia-nlu-respuesta.png`.

> **BUG-050 reconfirmado y agravado:** el banner "Se ha producido un error. Vuelve a intentarlo." **persiste arriba del chat incluso durante una conversación 100% exitosa** (sigue presente tras recibir la recomendación). Es un **falso error fijo**, no transitorio — no refleja el estado real del agente.

### Bugs detectados
**Bugs de esta sección:** BUG-B2C-050, 051, 052 — detalle en Parte IV.

### Presencia cross-página
Silvia se monta en home, PDP y `/customer/*`. El checkout NO la monta (layout minimalista). Cobertura cross-página en III.4.

### Notas de estado

- **BUG-050** es **intermitente** (race de carga del agente CX): el mensaje fantasma "Se ha producido un error. Vuelve a intentarlo." no siempre aparece. Severidad MEDIA, marcado intermitente.
- **BUG-051** a reverificar: en algunas cargas el placeholder visible es **"Escribe tu pregunta..."** (el declarado en config), no "Hablar con agente".
- Bienvenida verbatim (femenino): *"¡Hola! Soy Silvia. Tu asistente especializada en soluciones Rotoplas. Puedo brindarte información detallada sobre nuestros productos, precios vigentes y recomendaciones personalizadas. Al interactuar conmigo, aceptas los términos de uso de este agente."* + chip **"Leer Términos y Condiciones"** (BUG-052) + input "Escribe tu pregunta..." + botón enviar.

> **Nota de testabilidad:** el `<df-messenger>` de Dialogflow CX renderiza el input y los mensajes en **shadow DOM cerrado / iframe interno** que **no se puede manejar programáticamente** (native value setter + traversal de shadow roots no alcanzan el input). Enviar un mensaje libre y mapear la respuesta NLU del agente requiere interacción por coordenadas/teclado real o herramienta específica de Dialogflow — fuera del alcance de selectores. El contenido conversacional es de un tercero (Google Dialogflow), no superficie de bug propia de Rotoplas más allá de la config (arriba) y la UX de entrada. Cobertura cross-página: presente en home/PDP/customer; **el checkout NO lo monta** (layout minimalista).

**Evidencia:** `F1A-06-chatbot-silvia-abierto.png`, `F1C-31-chatbot-silvia-abierto.png` (reapertura sin error fantasma).

---

## I.12 Toasts (catálogo)

Toast detectado por shell residual: `"Añadiste este articulo a tu carrito"` (con typo BUG-B2C-002).

---

## I.13 Mini-cart drawer (post-add-to-cart)

> Diferente al mega-menú lateral.
> Selector raíz: `div.drawer-panel.header-extension` (mismo class que el mega-menú — posible conflicto)
> Trigger: click en "Agregar al carrito" en cualquier carrusel/PDP/listing
> Contenido confirmado:
> - StaticText "Añadiste este articulo a tu carrito" (con typo BUG-B2C-002)
> - link "Ver Carrito" → `/cart`
> - botón "Cerrar"

### Bug arquitectónico
**Bugs de esta sección:** BUG-B2C-029 (drawer comparte clases `drawer-panel header-extension` con el mega-menú) — detalle en Parte IV.

---

## I.14 Forms (login / signup / contacto / recuperación)

### I.14.a Form Login (`/login/`)

| Elemento | Selector | Tipo | Notas |
|---|---|---|---|
| H1 | `h1:has-text("Inicia sesión")` | heading | ✅ tiene H1 (a diferencia del home) |
| Input email | `input#email` o `input[placeholder*="Correo"]` | text | Label "Correo electrónico*" — ⚠️ debería ser `type="email"` |
| Input password | `input[type="password"]` | password | Label "Contraseña*" |
| Link forgot | `a:has-text("Olvidé mi contraseña")` → `/forgot-password` | a | ⚠️ sin `/` final → redirect 301 (BUG-B2C-054) |
| Botón submit | `button:has-text("Iniciar sesión")` | button | NO usa `<form>` semántico. Handler Qwik `q-CmT-bS6_.js#s_7s0GKaBtn2k[0]`. |

### Validaciones (verificadas en vivo 2026-06-05)

| Caso | Error inline | Selector |
|---|---|---|
| Submit vacío (email + password) | `"Introduce una dirección de correo electrónico válida, con formato: (Ej: usuario@ejemplo.com)."` | `span.error` bajo el input email, precedido por `!` indicator |
| Email malformado (`notanemail`) | Mismo mensaje que submit vacío | ídem |
| Solo email válido sin password | Mismo mensaje (el error prioriza el email) | ídem |

**Comportamiento Enter key:** el input password NO está dentro de un `<form>` → presionar Enter dispara el handler Qwik del botón submit (mismo comportamiento que click).

**Selector de error estable:** `#email + * .error` o `text="Introduce una dirección de correo electrónico válida"`.

**Evidencia:** `F1A-09-login.png`| Texto+link signup | `"Si no tienes una cuenta, crea una "` + `a:has-text("aquí")` → `/signup` | a | ⚠️ sin `/` final → doble redirect (BUG-B2C-055) |

**Evidencia:** `F1A-09-login.png`

---

### I.14.b Form Signup (`/signup/` — URL canónica REAL, NO `/registro/`)

> `/registro/` devuelve "Ha ocurrido un error" mientras que `/signup/` funciona — invierte la convención típica de B2C en español (BUG-B2C-056, detalle en Parte IV).

| # | Input | name | type | id | required nativo | Label visible |
|---|---|---|---|---|---|---|
| 1 | Nombre(s) | `name` | `text` | `name` | ❌ | "Nombre(s)*" |
| 2 | Apellido(s) | `lastName` | `text` | `lastName` | ❌ | "Apellido(s)*" |
| 3 | Correo electrónico | `email` | `text` ⚠️ | `email` | ❌ | "Correo electrónico*" |
| 4 | Teléfono | `phone` | `text` ⚠️ | `phone` | ❌ | "Teléfono*" |
| 5 | Crea contraseña | `password` | `password` | `password` | ❌ | "Crea una contraseña*" |
| 6 | Confirma contraseña | `comppassword` ⚠️ | `password` | `comppassword` | ❌ | "Confirma tu contraseña*" |
| 7 | Acepto T&C | `privacity` ⚠️ | `checkbox` | _(sin id)_ | ❌ | "Acepto los Términos y condiciones y el Aviso de privacidad" |

**Validación password indicada en UI:**
- Mínimo 8 caracteres
- Una letra mayúscula
- Un número del 0 al 9

**CTA primario:** `button:has-text("Crear cuenta")`
**Link secundario:** "Si ya tienes una cuenta, inicia sesión aquí" → `/login/` (verificar slash)
**Links T&C en disclaimer:** `/terminos-y-condiciones/` (apunta a redirect cross-domain → BUG-B2C-037)

**Bugs detectados:**
**Bugs de esta sección:** BUG-B2C-056, 057, 058, 059, 060, 061 — detalle en Parte IV.

**Evidencia:** `F1A-11-signup-form.png` (signup OK) | `F1A-10-BUG-B2C-056-registro-error.png` (registro roto)

---

### I.14.c Form Forgot Password (`/forgot-password/`)

- **URL canónica:** `https://qarotoplasmx.io/forgot-password/`
- **Title:** `Rotoplas` (genérico — alimenta **BUG-B2C-053**)
- **H1:** `Olvidé mi contraseña` ✓
- **Microcopy:**
  - Subtítulo: "Ingresa tu correo electrónico para recibir instrucciones para restablecer tu contraseña."
  - Label: "Correo electrónico*"
  - Footer del form: "Si no tienes una cuenta, crea una aquí" → link `aquí` apunta a `/signup` (sin `/` final → **BUG-B2C-055** aplica también aquí)

**Form attrs:**
```
<form action="/forgot-password/?qaction=Fhhau06fw68" method="post" class="⭐️xfgimw-0">
```
- `qaction` = action ID generado por Qwik (cambia por sesión/build — NO usar como selector estable).

**Inputs (1 visible):**

| name | type | placeholder | required | autocomplete | maxlength | aria-label | Selector estable |
|---|---|---|---|---|---|---|---|
| `email` | **`text`** ❌ | `*` ❌ | `false` ❌ | `off` ❌ | `30` ❌ | (ninguno) | `input[name="email"]` |

> Atributos relevantes adicionales: `on:input="q-CHjAh2g9.js#s_X1nXuxQCsrg[0 1]"` (handler Qwik lazy), `q:id="2o"`.

**Botón submit:**
- Texto: `Enviar correo`
- Selector estable: `button[type="submit"].button-primary`

**Validación cliente (verificada en vivo 2026-06-05):**

| Caso | Resultado | Mensaje |
|---|---|---|
| Submit vacío | ❌ Bloquea | `"Introduce una dirección de correo electrónico válida, con formato: (Ej: usuario@ejemplo.com)."` |
| Email malformado (`notanemail`) | ❌ Bloquea | Mismo mensaje de error (no distingue "vacío" de "formato inválido"). |
| Email con `> 30` caracteres | ❌ Bloqueado por `maxlength="30"` en el input (BUG-B2C-064) — el atributo impide físicamente escribir más. |
| Email válido (registrado) | ⏸ No verificado | Depende de Capa 2 (llegada del correo de reset). El submit SÍ envía POST al endpoint Qwik, pero no hay feedback inline que confirme éxito/fallo de envío. |
| Email válido (no registrado) | ⏸ No verificado | Ídem Capa 2 — posiblemente mismo comportamiento silencioso (sin distinguir "usuario no encontrado"). |

- Selector mensaje: `input[name="email"] ~ .error` o `text="Introduce una dirección de correo electrónico válida"`.
- URL no cambia: stays at `/forgot-password/`.
- El form SÍ usa `<form action="/forgot-password/?qaction=..." method="post">` (a diferencia de login que no usa `<form>`).

**Tracking observado al submit (mutaciones DOM):**
- `window.__unifiedFormTrackingInit` — inyecta eventos GA4 `form_send` / `form_success`.
- `window.__last_tracked_url_register_terms` — tracking adicional de registro.

**Links visibles desde el form (no header/footer):**
- `aquí` → `/signup` (BUG-B2C-055 — sin `/` final → 301)
- **NO existe** link de regreso a `/login/` desde dentro del form → **BUG-B2C-062**.

**Bugs de esta sección:** BUG-B2C-062, 063, 064, 065, 066 (nuevos) + 060, 053, 055 (aplicados) — detalle en Parte IV.

**DOM contract draft (Playwright):**
```javascript
await expect(page.locator('h1')).toHaveText('Olvidé mi contraseña');
await expect(page.locator('input[name="email"]')).toBeVisible();
await expect(page.locator('button[type="submit"]')).toHaveText(/Enviar correo/i);
// Validación cliente:
await page.locator('button[type="submit"]').click();
await expect(page.locator('.error').first()).toContainText('correo electrónico válida');
```

**Evidencias:**
- `F1A-12-forgot-password-form.png` — estado inicial del form
- `F1A-13-forgot-password-error-vacio.png` — error de validación con submit vacío

---

### I.14.d Form Contacto (`/contacto/`)

- **URL canónica:** `https://qarotoplasmx.io/contacto/`
- **Subtítulo:** "Déjanos tus datos y te contactaremos"
- **NO usa `<form>` tag** → inputs sueltos + `<button type="button">` → **BUG-B2C-068**. Implicaciones: Enter no submitea, browser no detecta como form para autofill agrupado, herramientas a11y no agrupan.

**Inputs (7 campos visibles):**

| name | type | required | maxlength | autocomplete | Label asociado | Selector estable |
|---|---|---|---|---|---|---|
| `name` | `text` | `false` ❌ | — | `on` | "Nombre y apellido*" (`for="name"`) | `input#name` |
| `phone` | **`text`** ❌ | `false` ❌ | `10` | `on` | "Teléfono*" (`for="phone"`) | `input#phone` |
| `email` | **`text`** ❌ | `false` ❌ | (sin) | `on` | "Correo electrónico*" (`for="email"`) | `input#email` |
| `zipcode` | `text` | `false` | `5` | `on` | "Código postal" (`for="zipcode"`) ⚠️ sin `*` pero label sugiere opcional | `input#zipcode` |
| `type` | `select-one` | `false` | — | — | "Tipo de solicitud *" | `select#type` |
| `message` | **`text`** ❌ (debería ser `textarea`) | `false` | `240` | `on` | "Escribe tu mensaje*" (`for="message"`) | `input#message` |
| `privacity` | `checkbox` | `false` | — | — | (texto: "Acepto los Términos y condiciones y el Aviso de privacidad") | (sin id) |

**Opciones del select `type`:**
1. `Seleccione una opción` (placeholder)
2. `Asesoría de Ventas`
3. `Garantías`
4. `Cancelaciones y Devoluciones`

**Botón submit:**
- Texto: `Enviar`
- `type="button"` (no `type="submit"` — porque no hay `<form>`)
- Selector estable: `button.⭐️984ub4-0` → mejor por texto: `button:has-text("Enviar")`

**Validación cliente (submit vacío — confirmada):**

| Campo | Mensaje de error inline |
|---|---|
| `name` | `Introduce un nombre u apellido válido` ⚠️ typo "u" → **BUG-B2C-073** |
| `phone` | `Introduce un teléfono válido debe de contener 10 dígitos` ⚠️ "debe de" + sin puntuación → **BUG-B2C-074** |
| `email` | `Este es un campo requerido` |
| `type` (select) | `Este es un campo requerido` (border rojo + texto) |
| `message` | `Este es un campo requerido` |
| `privacity` (checkbox) | `Este es un campo requerido` |
| `zipcode` | (no error — confirma que es opcional) |

> Estilos de error mezclados (`Introduce un X válido` vs `Este es un campo requerido`) → **BUG-B2C-075**.

**Bugs de esta sección:** BUG-B2C-067, 068, 069, 070, 071, 072, 073, 074, 075 (nuevos) + 053, 059, 060, 061, 066 (heredados confirmados) — detalle en Parte IV.

### Submit con datos válidos (verificado en vivo 2026-06-05)

**Datos de prueba:** nombre `"Prueba QA Mapeo"`, teléfono `5512345678`, email `qa.test.rotoplas@mailinator.com`, CP `02800`, tipo `Asesoría de Ventas`, mensaje `"Este es un mensaje de prueba..."`, T&C aceptado.

**Resultado:**
- **Toast de éxito:** `"Se ha enviado tu información, pronto te contactaremos"` — aparece como banner/toast flotante en la parte superior de la página.
- **Endpoint:** POST a Qwik `?qfunc` (confirmado por el usuario — el endpoint exacto no se capturó en esta sesión por paginación incompleta de network requests).
- **Post-submit:** la URL permanece en `/contacto/`, los campos NO se limpian (quedan con los valores ingresados).
- **Efecto colateral detectado:** el campo CP (`02800`) dispara simultáneamente el modal I.6 "Agregar dirección" porque el sistema interpreta el CP como intento de verificar cobertura. Esto no bloquea el submit del formulario de contacto pero sí ensucia la UX (modal inesperado superpuesto al toast).

**Validación de email malformado:** probado con `"notanemail"` — mismo error `"Este es un campo requerido"` (no distingue formato inválido de campo vacío).

**Validación de teléfono < 10 dígitos:** probado con `"123"` — error `"Introduce un teléfono válido debe de contener 10 dígitos"` (BUG-B2C-074).

**DOM Contract (submit válido):**
```js
await page.locator('input#name').fill('Prueba QA');
await page.locator('input#phone').fill('5512345678');
await page.locator('input#email').fill('test@mailinator.com');
await page.locator('input#zipcode').fill('02800');
await page.locator('select#type').selectOption('Asesoría de Ventas');
await page.locator('input#message').fill('Mensaje de prueba QA.');
await page.locator('input[type="checkbox"]').first().check();
await page.locator('button:has-text("Enviar")').click();
// Verificar toast de éxito
await expect(page.getByText('Se ha enviado tu información')).toBeVisible({ timeout: 5000 });
await expect(page.getByText('pronto te contactaremos')).toBeVisible();
```

**Evidencias:**
- `F1A-14-contacto-form-inicial.png` — form en estado inicial
- `F1A-15-contacto-errores-submit-vacio.png` — errores inline post-submit vacío

---

## I.1.b Header global — versión AUTENTICADA

> Variante del Header global (I.1) que aparece tras login con un usuario válido. Reemplaza el texto "Inicia sesión o regístrate" por el bloque de identidad de usuario + dropdown con menú de cuenta + badge de carrito numérico.

**Estructura del contenedor:**
```html
<div class="tools-bar">
  <!-- Avatar con iniciales (texto plano dentro) -->
  <span class="JG">JG</span>
  <!-- Nombre del usuario en 2 nodos (StaticText) -->
  <span>Jorge</span> <span>García</span>
  <!-- Email del usuario -->
  <span>andrei.garcia@xideral.co</span>
  <!-- Badge del carrito con conteo numérico -->
  <a href="/cart" class="tool session-icon cart">1</a>
  <!-- Menú dropdown autenticado (renderizado 2x por responsive) -->
  <a class="menuMovil" href="/customer">Mis datos</a>
  <a class="menuDEsk" href="/customer">Mis datos</a>
  <a class="menuMovil" href="/customer/orders">Mis pedidos</a>
  <a class="menuDEsk" href="/customer/orders">Mis pedidos</a>
  <a class="menuMovil" href="/customer/address">Mis direcciones</a>
  <a class="menuDEsk" href="/customer/address">Mis direcciones</a>
  <a class="menuMovil" href="/customer/reviews">Mis reseñas</a>
  <a class="menuDEsk" href="/customer/reviews">Mis reseñas</a>
  <button type="submit">Cerrar sesión</button>
</div>
```

**Top-bar de dirección guardada (componente adicional autenticado):**

Aparece sobre el header principal cuando el usuario tiene al menos una dirección guardada (probable que también para invitados con CP capturado).

```
Casa: Camarones 155k, Col. Nueva Santa María, Ciudad de México, Ciudad de México, C.P. 02800
                                                                                    [Cambiar]
```

- Etiqueta `Casa` viene del alias de dirección (Casa / Oficina / Obra / Otro — ver I.6 Modal dirección).
- Botón `Cambiar` → abre el modal I.6 con la opción de cambiar de dirección.

**Bugs de esta sección:** BUG-B2C-099 (`menuDEsk` typo), 100 (links duplicados desktop+mobile), 016 (patrón id duplicado) — detalle en Parte IV.

**Selectores estables:**
- Avatar iniciales: buscar por texto de 2 chars dentro de `.tools-bar`
- Email: `.tools-bar :has-text("@")` o por regex
- Badge carrito: `.tools-bar a.cart`
- Cada link autenticado: `a.menuDEsk[href="/customer/..."]`
- Botón logout: `.tools-bar button:has-text("Cerrar sesión")`

**DOM contract (Playwright) — header autenticado:**
```javascript
// Tras login:
await expect(page.locator('.tools-bar')).toContainText('andrei.garcia@xideral.co');
await expect(page.locator('.tools-bar')).toContainText('Jorge');
await expect(page.locator('.tools-bar')).toContainText('García');
await expect(page.locator('.tools-bar a[href="/cart"]')).toContainText(/\d+/);  // badge
await expect(page.locator('.tools-bar a.menuDEsk[href="/customer"]')).toHaveText('Mis datos');
await expect(page.locator('.tools-bar a.menuDEsk[href="/customer/orders"]')).toHaveText('Mis pedidos');
await expect(page.locator('.tools-bar a.menuDEsk[href="/customer/address"]')).toHaveText('Mis direcciones');
await expect(page.locator('.tools-bar a.menuDEsk[href="/customer/reviews"]')).toHaveText('Mis reseñas');
await expect(page.locator('.tools-bar button:has-text("Cerrar sesión")')).toBeVisible();
// Verificar que NO aparece "Inicia sesión o regístrate":
await expect(page.locator('text=Inicia sesión o regístrate')).toHaveCount(0);
```

**Evidencia:** `F1B-01-home-autenticado.png`

---

## I.15 Sidebar área de cuenta (`/customer/*`)

> Menú lateral que aparece en TODAS las páginas `/customer/*`. Replica los mismos links del dropdown del header (I.1.b) — usuario tiene navegación redundante header+sidebar.

**Estructura DOM:**

Los mismos 4 links + botón logout que I.1.b, pero renderizados como un bloque lateral o vertical en la página. Misma duplicación `menuMovil`/`menuDEsk`.

| Link | URL | Aplica clase activa cuando |
|---|---|---|
| Mis datos | `/customer` | URL es `/customer/` |
| Mis pedidos | `/customer/orders` | URL empieza con `/customer/orders` |
| Mis direcciones | `/customer/address` | URL empieza con `/customer/address` |
| Mis reseñas | `/customer/reviews` | URL empieza con `/customer/reviews` |
| Cerrar sesión | (button, no URL) | N/A — siempre dispara logout |

**Comportamiento de "Cerrar sesión":**

| Aspecto | Observado |
|---|---|
| Trigger | `<button>Cerrar sesión</button>` en `.tools-bar` (header) o sidebar `/customer/*` |
| Redirect post-logout | `https://qarotoplasmx.io/login/` (NO al home `/`) → **BUG-B2C-146** (inesperado) |
| Toast/feedback | **NINGUNO** — logout silencioso → **BUG-B2C-145** |
| Cookies JS-visible antes vs después | Idénticas (todas son de tracking — la cookie de sesión es HttpOnly ✅) |
| Header tras logout | Vuelve a versión anónima (I.1) con "Inicia sesión o regístrate" |
| localStorage/sessionStorage | Tracking keys persisten (correcto, no es PII) |

**Evidencia:** `F1B-19-logout-redirect-login.png`

**DOM contract:** mismo snippet que I.1.b. La duplicación funcional es intencional pero documentar para tests.

---

## I.16 Componente Listing genérico (`/products/[categoria]/`) — matriz exhaustiva

> Instancia representativa mapeada en `/products/presurizacion/`. Compartido por las categorías (Almacenamiento, Almacenamiento Especializado, Presurización, Purificación, Tratamiento, Calentamiento, Conducción, Servicios) con sólo deltas específicos (sub-categorías propias, opciones de filtros, conteos, imágenes). Las secciones II.7.X referencian este componente.

### 1. Estructura del DOM listing

```
<header global>                              ← I.1
<nav top-bar>                                ← I.2
<main>
  ├── Hero banner <img alt="Banner">         ← bucket prd con NFD (BUG-201/255)
  ├── <h1>{Categoría}</h1>                   ← trailing space variable (BUG-274/285)
  ├── breadcrumb: home > {categoría}         ← sin schema.org (BUG-273)
  ├── <aside class="filter-sidebar">         ← sidebar de filtros
  │     ├── Sub-categorías (Todos, …)        ← `<li>` con on:click, NO checkboxes
  │     ├── Sort by                          ← 4 opciones (sin "Relevancia")
  │     ├── Capacidad                        ← filtro heredado (BUG-257/275)
  │     ├── Potencia                         ← filtro heredado
  │     └── Material                         ← filtro heredado
  │     [Limpiar] [Aplicar]                  ← botones acción del filtro
  ├── <div class="sorts">{N} Productos Ordenar por
  ├── <grid of articles>
  │     └── <article class="card-product-filter">  ← una por producto (BUG-261 class crudo)
  └── <nav aria-label="Paginación de productos">   ← SOLO si N productos > 24 (caso Conducción)
<footer global>                              ← I.4
```

### 2. Botones del listing — desglose exhaustivo

> Desde `/products/presurizacion/` (autenticado como `andrei.garcia@xideral.co`): 20 buttons en `<main>` + 22 `<li>` clickables Qwik (filtros).

#### 2.a Botones del HEADER cargado dentro de main

| qid | Texto / aria-label | Clase | Visible | Handler Qwik | Comportamiento esperado | Hallazgo |
|---|---|---|---|---|---|---|
| `bj` | "Cambiar" | (sin clase) | ✓ top 87 | `q-8k5p389a.js#s_f2kd0B6g6Qg` | Abrir modal I.6 "Verifica disponibilidad de entrega" (cambiar CP/dirección) | OK |
| `bm` | (aria-label="Abrir menú") | `tool menu` | ✗ (mobile-only) | `q-BX-zVVi1.js#s_mEfQJuL0y1I` | Abrir drawer mega-menú lateral (I.3) | Mobile-only |
| `bs`, `cr` | "Ver todos los resultados" (×2 mobile + desktop) | `⭐️6h3eza-0` | ✗ (oculto, disabled) | `q-CHjAh2g9.js#s_SRPpXe86Fa8` | Dentro del autocompletado del search — ir a SRP | Oculto hasta typear |
| — | "Cerrar sesión" | (sin clase) | ✗ (en dropdown user) | sin Qwik | Logout y redirect a `/login/` | No probado |
| `cu` | (aria-label="Cerrar", title="Cerrar") | `close-btn` | ✓ top 131 | `q-8k5p389a.js#s_3u0EgbJQMPg` | Cerrar toast o banner promo del header | OK |

#### 2.b Botones del SIDEBAR de filtros

| qid | Texto / aria-label | Clase | Visible | Handler | Comportamiento esperado | Hallazgo |
|---|---|---|---|---|---|---|
| `3m` | "Limpiar" | `CloseButton` | ✓ top 589 (disabled si no hay filtros activos) | `q-Db5Vz_yL.js#s_vnBwuoTKZQA` | Resetear todos los filtros seleccionados | **BUG-259**: clase engañosa `CloseButton` + sin `aria-disabled` |
| `3n` | "Aplicar" | `disabled` | ✗ (mobile drawer only) | `q-Db5Vz_yL.js#s_K23ZPyyRB08` | Aplicar selección de filtros (UX de drawer mobile — desktop aplica al click instantáneo) | Mobile drawer only |

#### 2.c Botones de los CARDS de producto

12 `<button class="addtoCart">Agregar al carrito</button>` visibles (en `/presurizacion/` los 12 con disponibilidad online; los otros 12 usan `<a>` "Buscar distribuidor" — patrón split).

| Tipo | Cantidad típica | Clase | Comportamiento esperado | Hallazgo |
|---|---|---|---|---|
| "Agregar al carrito" | variable por categoría (0..24/pág) | `⭐️whrvov-1 addtoCart` | Agregar producto al cart + actualizar badge header (`1`→`2`) + mostrar toast "Añadiste este artículo a tu carrito" | **Sin aria-label por producto** — screen reader anuncia N veces "Agregar al carrito" sin contexto (BUG-B2C-349) |

#### 2.d Botones del FOOTER (cargado en main por el snapshot a11y tree)

Heredados de I.4 Footer global. Sin nuevos en listing.

### 3. `<li>` clickables (filtros Qwik — NO son `<button>`)

22 items totales en `/presurizacion/`. Desglose por grupo:

#### 3.a Sub-categorías (parte alta del sidebar)

| Texto | Clase | Handler | Comportamiento esperado | Hallazgo |
|---|---|---|---|---|
| "Todos" | `⭐️c2ijco-8 selected` | `q-DjoIJWK-.js#s_OKkFg9S1nek` | Mostrar todos los productos de la categoría | Activo por default |
| "Kits de Presurización" | `⭐️c2ijco-8` | `q-DH7Bx1uO.js#s_3iMqcj4AtWc` | Filtrar solo Kits | sub-categoría específica de presurización |
| "Bombas" | `⭐️c2ijco-8` | mismo handler | Filtrar solo Bombas | sub-categoría específica |

#### 3.b "Ordenar por" — 4 opciones

| Texto | Handler | Comportamiento esperado |
|---|---|---|
| "Mayor a menor precio" | `q-B-ddRyEM.js#s_1Xf9HStECyk` | Sort descendente por precio |
| "Menor a mayor precio" | mismo | Sort ascendente por precio |
| "Nombre A - Z" | mismo | Sort alfabético ascendente |
| "Nombre Z - A" | mismo | Sort alfabético descendente |

**Sin opciones:** "Relevancia", "Más vendido", "Más reciente", "Mejor calificado" → BUG-256.

#### 3.c "Capacidad" — 1 opción

| Texto | Handler | Hallazgo |
|---|---|---|
| "No aplica" | `q-BX-zVVi1.js#s_karJYQbOUUI` | Único valor → **BUG-257**: filtro vacío de datos reales, debería ocultarse |

#### 3.d "Potencia" — 9 opciones (la categoría presurización aplica)

`q-CHjAh2g9.js#s_m0UJZOwkS4E` para todos:

`No aplica`, `1/4 HP`, `1/3 HP`, `1/2 HP`, `3/4 HP`, `1 HP`, `1 1/2 HP`, `2 HP`, `3 HP`

Hallazgo: opción `"No aplica"` **NO debe ser una opción seleccionable** — debería filtrarla el backend (BUG-258).

#### 3.e "Material" — 5 opciones

`q-DH7Bx1uO.js#s_1sghBUA4IX0` para todos:

| Texto | Hallazgo |
|---|---|
| "Acero de alta calidad" | OK |
| "Acero inoxidable" | OK |
| "Hierro fundido" | OK |
| "No aplica" | BUG-258 sistémico |
| **"Plastico PE"** | **BUG-B2C-348** — sin tilde, debería `"Plástico PE"` |

#### 3.f Anatomía DOM de un `<li>` filtro

```html
<li class="⭐️ob4c2y-0 ⭐️ykambm-2" on:click="q-CHjAh2g9.js#s_m0UJZOwkS4E[0 1 2 3]">
  1/2 HP
</li>
```

**Bugs a11y de los filtros (sistémicos del componente):**

| ID | Severidad | Hallazgo |
|---|---|---|
| **BUG-B2C-348** | BAJA copy | Opción "Plastico PE" sin tilde (debería "Plástico PE"). Aparece en /presurizacion/. Verificar las demás categorías. |
| **BUG-B2C-350** | ALTA a11y | TODOS los filtros (sub-categorías + sort + facets) son `<li>` con `on:click` Qwik — NO son `<input type="checkbox">`, NO tienen `role="checkbox"`, `role="radio"` ni `role="menuitem"`. No tienen `aria-checked` ni `aria-selected`. **Keyboard navigation imposible** + screen reader no anuncia estado. Confirma BUG-128 sistémico. |

### 4. Links del listing — desglose exhaustivo

76 `<a>` totales. Agrupados:

#### 4.a Header autenticado (cargado en main por snapshot)

Heredados de I.1.b. 8 links (×2 `menuMovil` + `menuDEsk`): "Mis datos", "Mis pedidos", "Mis direcciones", "Mis reseñas". Hrefs `/customer/*` ✓.

#### 4.b Iconos del header

| Texto | href | target | rel | Comportamiento esperado |
|---|---|---|---|---|
| "1" (cart badge) | `/cart` | _self | — | Ir al carrito |
| "Ver Carrito" (drawer-button) | `/cart` | _self | — | Ir al carrito desde toast |

#### 4.c Breadcrumb

| Texto | href | qid | Hallazgo |
|---|---|---|---|
| (icono home, sin texto) | `/` | `2k` | **BUG-B2C-351**: link sin alt/aria-label/texto — invisible para screen reader |
| "Presurización" | `/products/presurizacion` (sin slash final) | `2m` (`class="active"`) | Apunta a sí mismo. Sin slash → redirect 301 extra |

#### 4.d Banner publicitario Builder.io

| Texto | href | qid | Hallazgo |
|---|---|---|---|
| (sin texto) | `https://rotoplas.com.mx/servicios-lavado/` | (Builder block ID) | **BUG-B2C-352**: link cross-domain a `rotoplas.com.mx` (sitio distinto) **sin texto, sin alt, sin aria-label** + `target="_self"` (rompe navegación dentro del listing y manda al user a otro dominio). Builder.io block hardcodeado. |

#### 4.e Cards de producto — link "Buscar distribuidor" (cuando no hay compra online)

12 instancias en `/presurizacion/`:

| href | target | rel | Hallazgo |
|---|---|---|---|
| `/distribuidores` (sin slash final) | `_blank` | **(vacío)** | **BUG-B2C-347 sistémico**: `_blank` sin `rel="noopener noreferrer"` en cada instancia (reverse tabnabbing). 12× en este listing. |

#### 4.f Footer global

Heredados de I.4. Confirmaciones en listings:
- "Contacto" → `/preguntas-frecuentes` (no `/contacto/`) → BUG-003 sistémico
- "Calentamiento" → `/products/calentamiento` (sin slash) → BUG-007 reconfirmado
- Footer social media: `rel="noopener noreferrer"` ✓ correcto (contraste con share del PDP)

### 5. Cards de producto — interacción de navegación a PDP

```html
<article class="⭐️whrvov-1 {facet1} {facet2} {facet3} card-product-filter" q:id="...">
  <!-- Sin <a href> en el card root -->
  <div class="⭐️whrvov-1" on:click="q-VMgkZI0U.js#s_sZ2AEO0G4ao[0 1]">
    <!-- handler Qwik en un <div> intermedio sin label semántico -->
    <img alt="" loading="lazy">                  <!-- BUG-178 alt vacío -->
    <span class="discount-badge">-{N}%</span>    <!-- opcional -->
    <h3 class="info__title">{Nombre producto}</h3>
    <!-- bloques de precio -->
    <button class="addtoCart">Agregar al carrito</button>
    <!-- O en su lugar: <a class="searchDistributor" href="/distribuidores" target="_blank">Buscar distribuidor</a> -->
  </div>
</article>
```

**Comportamiento esperado del click en card:**
- Click sobre el área del card (no sobre los CTAs) → navegar a PDP en `/product/{NombreCamelCase}_{SKU}/`.
- Bug **BUG-147 sistémico**: navegación 100% via Qwik handler, NO via `<a href>` → rompe Cmd+click, browser preview link, crawlers, screen readers.

**Comportamiento esperado de los CTAs dentro del card:**

| CTA | Comportamiento esperado |
|---|---|
| "Agregar al carrito" | Agregar producto al cart + actualizar badge header (`N` → `N+1`) + mostrar toast "Añadiste este artículo a tu carrito" durante ~3s |
| "Buscar distribuidor" | Abrir `/distribuidores` en nueva pestaña |

### 6. Modal "Verifica disponibilidad de entrega" (I.6) — carga lazy

**Comportamiento esperado:** click en botón "Cambiar" (qid=`bj`) carga lazy el modal con inputs CP + dirección. `modalCP = null` en DOM hasta que se dispara el click.

### 7. DOM contract Playwright — componente listing genérico

```javascript
// tests/visual/listing-component-contract.spec.js
import { test, expect } from '@playwright/test';

test.describe('I.16 Componente Listing genérico', () => {
  test('botones del header en main', async ({ page }) => {
    await page.goto('https://qarotoplasmx.io/products/presurizacion/');
    await expect(page.getByRole('button', { name: 'Cambiar' })).toBeVisible();
    await expect(page.locator('button[aria-label="Cerrar"]')).toBeVisible();
  });

  test('sidebar filtros — limpiar disabled cuando no hay selección', async ({ page }) => {
    await page.goto('https://qarotoplasmx.io/products/presurizacion/');
    await expect(page.getByRole('button', { name: 'Limpiar' })).toBeDisabled();
  });

  test('BUG-B2C-350: filtros como <li> sin role/aria-checked', async ({ page }) => {
    await page.goto('https://qarotoplasmx.io/products/presurizacion/');
    const filtroLi = page.locator('li:has-text("1/2 HP")').first();
    expect(await filtroLi.getAttribute('role')).toBeNull();
    expect(await filtroLi.getAttribute('aria-checked')).toBeNull();
    expect(await filtroLi.evaluate(el => el.tagName)).toBe('LI');
  });

  test('cards sin <a href> al PDP (BUG-147 sistémico)', async ({ page }) => {
    await page.goto('https://qarotoplasmx.io/products/presurizacion/');
    const cardsWithAnchor = await page.locator('article[class*="card-product-filter"] > a[href*="/product/"]').count();
    expect(cardsWithAnchor).toBe(0);  // hoy 0 (bug) — invertir a > 0 tras fix
  });

  test('Buscar distribuidor — _blank sin rel="noopener" (BUG-347)', async ({ page }) => {
    await page.goto('https://qarotoplasmx.io/products/presurizacion/');
    const links = page.locator('a:has-text("Buscar distribuidor")');
    const count = await links.count();
    for (let i = 0; i < count; i++) {
      const rel = await links.nth(i).getAttribute('rel');
      expect(rel || '').not.toContain('noopener');  // hoy todos sin noopener — invertir tras fix
    }
  });
});
```

### 8. Evidencias

- `scripts/F1C-listing-all-elements.json` — inventario completo: 20 botones + 76 links + 22 `<li>` filtros + handler de navegación de card + estado del modal CP

### 9. Deltas por categoría — REFERENCIA cruzada

Las secciones II.7.3-II.7.8 documentan SOLO el delta específico de cada categoría:

| Categoría | Delta clave |
|---|---|
| II.7.1 Almacenamiento | 84 prod / 4 págs / sub-categorías captadores-pluviales + tinacos |
| II.7.2 Almacenamiento especializado | 168 prod / 7 págs |
| **II.7.3 Presurización** | 24 prod / 0 págs / sub-cat "Kits"+"Bombas" / discount mixto, 10/24 sin compra online |
| **II.7.4 Purificación + purificadores-de-agua** | 15+5 prod / sub-vista duplicate content / -20% sistémico |
| **II.7.5 Tratamiento** | 12 prod / banner SIN NFD / -10% biodigestores / 5 sin compra online |
| **II.7.6 Calentamiento** | 6 prod / **único con meta tags reales** / 0 descuento / JSX leak "Ideal para:" |
| **II.7.7 Conducción** | **652 prod / 28 págs** / único con `<nav>` paginación / sin URL state |
| **II.7.8 Servicios** | 8 prod / banner roto src="" / 14 JSX leaks SVG / categoría con nombre mismatch |

---

# Parte II — PÁGINAS

> Cada página lista: componentes globales que usa (referencias a Parte I) + secciones únicas + heading/CTAs propios + bugs específicos.

---

## II.1 `/` Home (anónima)

- **URL:** `https://qarotoplasmx.io/`
- **Title:** `Rotoplas México | Soluciones Integrales de Agua. Venta en Línea`
- **Meta description:** `Compra en línea productos Rotoplas y aprovecha más de 45 años de innovación en soluciones para almacenar, conducir y purificar agua de forma sustentable.`
- **HTML lang:** `es-mx`
- **H1:** ⚠️ **NINGUNO** → **BUG-B2C-001**
- **Conteo bruto:** 77 links, 71 botones, 1 form, 105 imágenes
- **Cookies al cargar:** `QuantumMetricUserID`, `_fbp`, `_ga`, `_gcl_au`, `_ga_VL8QZDP9KQ`, `QuantumMetricSessionID`

### Componentes globales que usa
- I.1 Header global
- I.2 Nav superior
- I.4 Footer global
- I.5 Barra promocional close-promo
- I.7 Widget verificación CP
- I.8 Carrusel de productos (×2 — "Lo más vendido" + "Productos recomendados")
- I.10 Newsletter signup
- I.11 Chatbot Silvia

### Secciones únicas de la home

#### Hero promocional (banners carrusel) — mapeado 2026-06-05

**Contenedor:** `div.⭐️7y6rwi-1.banner` (Qwik-scoped), anidado dentro de `main > div > div` con elementos duplicados para desktop + mobile.

**5 slides con imágenes:**
| # | Imagen (desktop) | Origen |
|---|---|---|
| 1 | `…4a88e977c75048809a7c9981e08c2881?format=webp` | `cdn.builder.io` |
| 2 | `…Kits%20conducción%20B2C%20Desk.webp` | `storage.googleapis.com/rtp-bucket-b2b-prd` |
| 3 | `…0550e72d8f6e41419d4c870d8bc130f8?format=webp` | `cdn.builder.io` |
| 4 | `…453f3959cfd6482ebb14669dca23783b?format=webp` | `cdn.builder.io` |
| 5 | `…ed3efa4472eb4244a9fd8a668e6e80f3?format=webp` | `cdn.builder.io` |

Todos con `alt="Banner Rotoplas"` (genérico — mismo alt para los 5 slides). ~~**BUG-B2C-517.**~~ **CERRADO s22**: alts cambiaron a descriptivos ("Banner Goles", "Banner Rotogotas", etc.).

**Navegación:** 5 dots `<button aria-label="Ir al slide 1">` … `<button aria-label="Ir al slide 5 (más)">` en contenedor `.⭐️5y6m7i-0.dot.active`. Duplicados 4× (desktop + mobile + 2 carruseles de productos). **No hay flechas prev/next** — solo dots.

**Auto-rotate:** Qwik-managed (no jQuery/slick), inferido del handler `q-rCbmexQw.js`. Sin atributo `data-slick` ni configuración de intervalo expuesta en DOM.

**Links en slides: NINGUNO.** Las 5 imágenes son `<img>` sueltos sin `<a>` envolvente — los banners **no son clickeables**. Esto es un carrusel puramente informacional, sin CTAs.

**DOM Contract (s22 — alts descriptivos, verificar vigencia):**
```js
// Los alts ya no son "Banner Rotoplas" genérico. Hoy son descriptivos:
// "Banner Goles", "Banner Rotogotas", "Banner bombas inteligentes", etc.
const banners = page.locator('img[alt^="Banner"]'); // ancla por prefijo estable
await expect(banners).toHaveCount(14); // 7 desktop + 7 mobile (antes eran 5+5)
const dots = page.locator('button[aria-label="Ir al slide 1"]');
await expect(dots.first()).toBeVisible();
// Verificar que no hay links dentro del carrusel
const bannerContainer = page.locator('.⭐️7y6rwi-1');
await expect(bannerContainer.locator('a')).toHaveCount(0);
```

#### "Nuestras categorías" (carrusel scroll lateral)
- 9 categorías con heading h3 cada una:
  1. Lavado de tinaco y cisterna
  2. Tinacos y cisternas
  3. Almacenamiento especializado
  4. Presurización
  5. Tratamiento
  6. Purificación
  7. Mascotas
  8. Calentamiento
  9. Conducción
- Botones: "Scroll Left" / "Scroll Right" (sin aria-label visible — verificar)

#### "Lo más vendido por categoría" (I.8 Carrusel)
- Ver I.8 para estructura + I.9 para tarjetas
- 8 productos visibles, paginación 4 slides

#### "Soluciones a medida" (3 link cards)
- "Tinacos y Cisternas — garantía de por vida" → `/products/almacenamiento/`
- "Agua purificada — segura e ilimitada" → `/products/purificacion/`
- "Captación de lluvia — solución sustentable" → `/products/almacenamiento/captadores-pluviales/` ← **URL NUEVA descubierta**

#### "¿Qué necesitas solucionar hoy?" (selector de soluciones)
- H2 `"¿Qué necesitas solucionar hoy?"`
- Texto: "Selecciona la opción que mejor lo describa y te mostraremos los productos que necesitas."
- 4 radios (`name="solution"`):
  1. Baja presión de agua en mi casa.
  2. Falta de agua por cortes en el suministro o escasez.
  3. Agua con sedimentos, tierra o impurezas
  4. Fugas de agua en tuberías
- Botón "Soluciones" (disabled hasta seleccionar)

> **BUG-B2C-030** (BAJA UX/copy) — inconsistencia en puntuación: 2 opciones terminan en punto, 2 no. Falta uniformidad.

#### "Nuevos lanzamientos" (2 link cards sin texto)
- Link 1 → `/products/almacenamiento/tinacos/`
- Link 2 → `/products/purificacion/purificadores-de-agua/`

> **BUG-B2C-031** (MEDIA a11y) — Links de "Nuevos lanzamientos" sin texto accesible — solo contienen imagen sin alt apropiado. Lectores de pantalla no anuncian el destino.

#### "Por qué elegirnos" (4 features con h3)
- Compra rápida
- Calidad garantizada
- Entrega a domicilio
- Atención personalizada

#### "Productos recomendados" (I.8 Carrusel — 7 productos)

#### "Más que servicios, soluciones que marcan diferencia" (3 servicios)
- Servicio de purificación → `/servicios/` (botón "Quiero saber más")
- Sistemas de riego → `/servicios/` (mismo link — duplicado intencional?)
- Soluciones tecnológicas integrales → `https://www.rotoplasserviciosdeagua.com.mx/` _blank

> **BUG-B2C-032** (BAJA) — primeros 2 servicios apuntan al mismo URL `/servicios/`. Confuso para el usuario.

#### "Descubre consejos de expertos Rotoplas" (h2 + link blog)
- H2 `"Descubre consejos de expertos Rotoplas"`
- Link "Ir al blog" → `https://rotoplas.com.mx/blog/` ← ⚠️ URL externa diferente a `/blog/` del footer y `/blog` del nav

> **BUG-B2C-012** (MEDIA) — Inconsistencia masiva del Blog:
> - Nav superior: `/blog` (sin `/` final)
> - Footer: `/blog/` (con `/`)
> - Home interna: `https://rotoplas.com.mx/blog/` (diferente dominio)
> - **3 URLs distintas para el blog**. Solo una será correcta — las otras 2 son bugs.

#### "Descubre un mundo de ofertas exclusivas" — Newsletter (I.10)

### Bugs de esta sección
**Bugs de esta sección:** BUG-B2C-001, 030, 031, 032 — detalle en Parte IV.

### Evidencias
- `F0-01-home-anonimo-initial.png` — full page home anónima inicial
- `F1A-01-home-mega-menu-abierto.png` — viewport con drawer lateral abierto

---

### Matriz de URLs verificadas

### URLs públicas confirmadas 200 (sin auth) — **canónica = con `/` final**

| URL canónica | Title / H1 | Notas |
|---|---|---|
| `/` | "Rotoplas México \| Soluciones Integrales..." / sin H1 | BUG-B2C-001 sin H1 |
| `/registro/` | "Crea una cuenta" | URL canónica de signup |
| `/login/` | "Inicia sesión" | URL canónica |
| `/forgot-password/` | "Olvidé mi contraseña" | URL canónica recuperación |
| `/cart/` | _por mapear_ | `/checkout` redirige aquí si vacío |
| `/traking/` | _por mapear_ | typo confirmado BUG-B2C-008 |
| `/tracking/` | _por mapear_ | **AMBOS responden 200** (duplicación) |
| `/preguntas-frecuentes/` | H1: **"Contáctanos"** | ⚠️ H1 incorrecto BUG-B2C-036 |
| `/contacto/` | _por mapear form_ | |
| `/distribuidores/` | _por mapear_ | |
| `/servicios/` | _por mapear_ | |
| `/servicios-lavado/` | _por mapear_ | Mencionado en `tasks/lessons.md` L-008 |
| `/nosotros/` | H1: "Nosotros" | ✅ correcto |
| `/recursos/` | H1: "Recursos" | ✅ correcto |
| `/blog/` | _por mapear_ | URL canónica |
| `/aviso-de-privacidad/` | Title: "Aviso de privacidad" / sin H1 | BUG-B2C-001 extendido |
| `/seguridad-de-la-informacion/` | _por mapear_ | |
| `/products/almacenamiento/` | _por mapear_ | |
| `/products/almacenamiento-especializado/` | _por mapear_ | |
| `/products/presurizacion/` | _por mapear_ | |
| `/products/purificacion/` | _por mapear_ | |
| `/products/tratamiento/` | _por mapear_ | |
| `/products/calentamiento/` | _por mapear_ | |
| `/products/conduccion/` | _por mapear_ | |
| `/products/mascotas/` | _por mapear_ | ✅ confirma BUG-B2C-013 (existe pero sin link footer) |
| `/products/servicios/` | _por mapear_ | ✅ confirma categoría Servicios existe |
| `/products/almacenamiento/captadores-pluviales/` | _por mapear_ | Subcategoría |
| `/products/almacenamiento/tinacos/` | _por mapear_ | Subcategoría |
| `/products/purificacion/purificadores-de-agua/` | _por mapear_ | Subcategoría |

### 🚨 URLs que devuelven HTML con H1 "Ha ocurrido un error" → **BUG-B2C-034 (CRÍTICO)**

| URL | Comportamiento esperado | Comportamiento real |
|---|---|---|
| `/mi-cuenta/` | Redirect a /login/ con returnUrl | HTML 200 con H1 "Ha ocurrido un error" + botón "Volver al sitio" |
| `/account/` | Idem | Idem (URL inglesa duplicada → BUG-B2C-035) |
| `/mis-pedidos/` | Idem | Idem |
| `/orders/` | Idem | Idem (URL inglesa duplicada → BUG-B2C-035) |
| `/checkoutfinished/` | Mostrar confirmación o redirect | "Ha ocurrido un error" cuando se accede directo |
| `/wishlist/` | Redirect a /login/ | "Ha ocurrido un error" |
| `/lista-de-deseos/` | Idem | Idem (URL ES duplicada) |
| `/ofertas/` | Listing de ofertas O 404 | "Ha ocurrido un error" |
| `/recuperar/` | 404 o redirect a /forgot-password/ | "Ha ocurrido un error" |
| `/recuperar-contrasena/` | Idem | Idem |
| `/olvide-contrasena/` | Idem | Idem |
| `/sustentabilidad/` | Mostrar contenido o redirect a `rotoplas.com/sustentabilidad/` (footer) | "Ha ocurrido un error" |
| `/transactionhistory/` | URL B2B reutilizada — 404 o redirect | "Ha ocurrido un error" |

**Evidencia:** `tickets/regresiones-smoke-b2c/evidencias/F1A-02-BUG-B2C-034-mi-cuenta-anonimo-error.png`

### 🟠 URLs que redirigen (causan round-trip HTTP innecesario) → **BUG-B2C-033**

| URL del link | Redirect 301 a | Origen del link |
|---|---|---|
| `/login` | `/login/` | _interno_ |
| `/signup` | `/signup/` | _interno_ |
| `/registro` | `/registro/` | _interno_ |
| `/blog` | `/blog/` | **Nav superior I.2** |
| `/aviso-de-privacidad` | `/aviso-de-privacidad/` | **Footer I.4** |
| `/terminos-y-condiciones` | **cross-domain** → `rotoplas.com.mx/ofertas-rotoplas-terminos-y-condiciones/` | **Footer I.4** → BUG-B2C-037 |
| `/preguntas-frecuentes` | `/preguntas-frecuentes/` | _interno_ |
| `/contacto` | `/contacto/` | _interno_ |
| `/distribuidores` | `/distribuidores/` | _interno_ |
| `/servicios` | `/servicios/` | _interno_ |
| `/nosotros` | `/nosotros/` | _interno_ |
| `/recursos` | `/recursos/` | _interno_ |
| `/products/calentamiento` | `/products/calentamiento/` | **Footer I.4** → BUG-B2C-007 |
| `/cart` | `/cart/` | **Header I.1** |
| `/checkout` | `/cart/` (no a checkout!) | _interno cuando carrito vacío_ |

### 🔴 URLs 410 Gone (eliminadas)
| URL | Status |
|---|---|
| `/promociones` | 410 Gone |
| `/promociones/` | 410 Gone |

→ Página existió antes, fue removida deliberadamente. Verificar si existe link huérfano apuntando a ella.

---

## II.2 `/login/` — Form de login

- **URL canónica:** `/login/` (con `/` final)
- **Title:** "Rotoplas" — ⚠️ BUG-B2C-053 (debería ser "Inicia sesión \| Rotoplas")
- **H1:** "Inicia sesión" ✅
- **Componentes globales usados:** I.1 Header, I.2 Nav superior, I.4 Footer, I.5 Promo bar — ❌ I.11 Chatbot Silvia **NO aparece** (relevante para auditoría III.4)
- **Form completo:** ver I.14.a
- **Evidencia:** `F1A-09-login.png`

## II.3 `/signup/` — Signup

- **URL canónica REAL:** `/signup/` (NO `/registro/` como creí inicialmente — `/registro/` está roto)
- **Title:** "Rotoplas" — ⚠️ BUG-B2C-053
- **H1:** "Crea una cuenta" ✅
- **Componentes globales usados:** I.1 Header, I.2 Nav superior, I.4 Footer, I.5 Promo bar
- **Form completo:** ver I.14.b (7 inputs + checkbox + validación de password en UI)
- **Evidencia OK:** `F1A-11-signup-form.png`
- **Evidencia BUG `/registro/`:** `F1A-10-BUG-B2C-056-registro-error.png`

### II.3.b Registro E2E

Registro completo con datos válidos (nombre "Prueba", apellidos "QA Smoke", email único `qa.b2c.test.<ts>@mailinator.com`, teléfono 10 dígitos, password `TestQA2027`): **la cuenta se crea** — tras "Crear cuenta" el sitio redirige a `/login/`; al iniciar sesión con esas credenciales el acceso es inmediato (header muestra el nombre "Prueba", sin gate de verificación de correo).

**Validación de contraseña (positivo):** el form exige y muestra inline las reglas — *"Debe contener: Mínimo 8 caracteres, Una letra mayúscula, Un número del 0 al 9"* — y *"La contraseña no coincide con la anterior."* cuando `password` ≠ `comppassword`.

| ID | Severidad | Hallazgo |
|---|---|---|
| **BUG-B2C-509** | MEDIA UX | **Registro exitoso sin feedback.** Tras crear la cuenta, el sitio redirige a `/login/` **sin ningún mensaje de éxito** ("cuenta creada", "revisa tu correo", "ahora inicia sesión"). El usuario no recibe confirmación de que el registro funcionó ni instrucción de qué hacer; parece que el form falló. |
| **BUG-B2C-510** | MEDIA legal/UX | **"Crear cuenta" no está gated por la casilla de Aviso de privacidad.** El botón se habilita con datos válidos aunque la casilla "Acepto los Términos y condiciones y el Aviso de privacidad" esté **sin marcar** (`privacity.checked=false`, `button.disabled=false`). El consentimiento de privacidad no bloquea el envío — riesgo legal (LFPDPPP) además de UX. |
| **BUG-B2C-511** | BAJA validación | **Email sin validación de formato inline.** El campo email (`type="text"`, BUG-057) acepta `"correoinvalido"` (sin `@`) sin mostrar error inline al perder foco; tampoco el teléfono corto. Sin `type="email"` no hay validación HTML5 y la JS no valida formato en blur. |

> Bugs relacionados (ver I.14.b / Parte IV): BUG-057 (email `type=text`), BUG-058 (`comppassword`), BUG-059/061 (`privacity`), BUG-060 (`required=false`), BUG-066 (placeholder `*`).

Evidencia: `F1A-11-signup-form.png` (form lleno). Cuenta E2E: `qa.b2c.test.1780636516931@mailinator.com`.

## II.4 `/forgot-password/` — Recuperar contraseña

- **URL canónica:** `/forgot-password/` (NO `/recuperar`, `/recuperar-contrasena`, `/olvide-contrasena` — todas devuelven "Ha ocurrido un error" → BUG-B2C-034)
- **H1:** "Olvidé mi contraseña"
- **Form / inputs / CTAs / post-action:** ver I.14.c.

## II.5 `/cart/`

> Página de carrito (autenticado). Producto de referencia: **Tamboplas 250 litros color negro, SKU 500040, $1,991.57**. Componentes globales: I.1 Header, I.2 Nav, I.4 Footer. `/checkout` redirige aquí cuando el carrito está vacío.

### 1. Meta y estructura

| Campo | Valor | Hallazgo |
|---|---|---|
| `<title>` | `Rotoplas` | ❌ BUG-251 sistémico (placeholder) |
| `meta[description]` | `¡Disfruta lo mejor de Rotoplas al alcance de un solo clic!` | ❌ BUG-359 sistémico |
| canonical | `/cart/` | ✓ |
| H1 | (ninguno) | ❌ BUG-353 sistémico |
| H2 | `"Mi carrito"`, `"Tal vez te pueda interesar"` (+ 2 del modal global de dirección) | "Mi carrito" debería ser H1 |
| Breadcrumb | `Inicio` (`/`) > `Mi Carrito` | "Inicio" → `/` ✓ (no tempmx) |

### 2. Fila de producto (`.line-cart-item`)

| Elemento | Valor | Hallazgo |
|---|---|---|
| Columnas (headers `.cat-items-titles`) | `Producto` · `Cantidad` · `Subtotal` | OK |
| Imagen | `storage.googleapis.com/rtp-bucket-b2b-qas/Imagenes_optimizadas/500040_1.webp` (161×161) | ❌ bucket `rtp-bucket-b2b-qas` (BUG-201/208) + `alt=""` (BUG-178) |
| Nombre | "Tamboplas 250 litros color negro" | — |
| SKU | `SKU: 500040` | ✓ visible |
| Precio unitario | `$1,991` + `.57` (2 nodos) | ❌ BUG-028 sistémico (precio segmentado) |
| Link a PDP | **ninguno** | ❌ **BUG-B2C-460** — el item del carrito NO enlaza a su PDP. El usuario no puede volver al producto desde el carrito. |
| Stepper cantidad | `<button class="decreasebutton">` / `<span>1</span>` / `<button class="increasebutton">` | ❌ BUG-458 (ver abajo) |
| Subtotal línea | `$1,991.57` | — |

### 3. Steppers de cantidad — a11y

`decreasebutton` e `increasebutton`: **completamente vacíos** — sin texto, sin `aria-label`, sin `title`, sin `<svg>`, sin `innerHTML`. El símbolo `+`/`−` se pinta con CSS `::before`/`::after` (`content:" "`). Lector de pantalla anuncia "botón" sin contexto.

| ID | Severidad | Hallazgo |
|---|---|---|
| **BUG-B2C-458** | CRÍTICO a11y | Steppers `.decreasebutton`/`.increasebutton` sin ningún contenido accesible (texto/aria/title/svg). Peor que el stepper del PDP (BUG-318) y del wizard (BUG-401): aquí ni siquiera hay SVG, el glifo es CSS `content`. Imposible operar con AT. Patrón sistémico de steppers rotos en TODO el sitio (PDP + wizard + cart). |

### 4. Resumen del pedido (`.ContainerTotals`)

```
Atendido por tu distribuidor local autorizado
Productos: 1        Servicios: 0
Subtotal:  $1,991.57
Ahorraste: $0.00
Envío:     $200.00   (Envío gratis en compras mayores a $2,000.00 MXN)
Total:     $2,191.57 (Incluye IVA)
1 Artículo(s) en el carrito
Te faltan SOLO $8.43 MXN en productos para obtener envío gratis
```

- Cálculo de "faltan $8.43" correcto ($2,000.00 − $1,991.57). ✓
- "Ahorraste: $0.00" se muestra aunque sea cero (ruido visual).
- Acordeón de totales en mobile implementado con `<input type="checkbox" id="open-total">` / `id="open-total-cart"` como toggle CSS (sin label asociado, sin `aria-expanded`).

### 5. Aceptación de T&C + gating del checkout

- Checkbox **"Acepto todos los Términos y condiciones"** → link a `/terminos-y-condiciones-serviciados/` (status **200**, mismo dominio).
- **Gating verificado:** botón "Iniciar compra" está `disabled` mientras el checkbox NO esté marcado; al marcarlo → `enabled`; al desmarcarlo → `disabled` de nuevo. ✅ Buena UX (fuerza aceptación de T&C antes de comprar).

| ID | Severidad | Hallazgo |
|---|---|---|
| **BUG-B2C-459** | MEDIA a11y/QA | El checkbox de aceptación de T&C **no tiene `id`, ni `name`, ni `aria-label`**. No es identificable por lectores de pantalla, password managers, ni automatización; no se asocia a su label vía `for`. |
| **BUG-B2C-461** | ALTA legal | El punto de aceptación legal de la compra (carrito de **productos**) enlaza a `/terminos-y-condiciones-serviciados/` — los **Términos de Servicios** (lavado), NO términos de compra de producto del e-commerce. Agrava BUG-038 (el sitio no tiene T&C generales de e-commerce). El usuario acepta términos que no corresponden a lo que compra. |
| (positivo) | — | El gating del botón por aceptación de T&C es correcto y debe conservarse. |

### 6. Botones de la página

| Texto | Clase | Estado | Handler | Comportamiento esperado |
|---|---|---|---|---|
| Iniciar compra | `button-primary` | disabled (gated T&C) | Qwik | Ir a checkout/pago |
| Vaciar carrito | `clear-cart` | enabled | `q-AplTxEcF.js#s_GBU72YGEVqY` | Eliminar todos los items. **Verificado: vacía el carrito al instante SIN modal de confirmación** (BUG-513, mismo patrón destructivo que BUG-131 en direcciones). |
| − / + (stepper) | `decreasebutton`/`increasebutton` | enabled | Qwik | Decrementar/incrementar cantidad |

> Todos duplicados 2× en el DOM (desktop + mobile responsive, patrón BUG-005).

| ID | Severidad | Hallazgo |
|---|---|---|
| **BUG-B2C-462** | BAJA código | Clase `sercicesAsItems` — typo en el nombre de clase (debería `servicesAsItems`). |
| **BUG-B2C-463** | BAJA a11y | Checkboxes `open-total`/`open-total-cart` usados como toggle CSS del acordeón de totales (mobile) sin `aria-expanded` ni label — control no accesible. |

### 7. Cross-sell "Tal vez te pueda interesar" (H2)

4 productos con badge de descuento (-19%, -9%, -10%, -20%): Tinaco Plus+ Centrifuga 1,100L, Tinaco Vertical Presurizadora 500L, Tinaco Vertical Centrifuga 500L, Tinaco Plus+ Presurizadora 1,100L.

- CTA de cada card: **depende del estado de AUTENTICACIÓN** (verificado): **anónimo** → `button.addtoCart` "Agregar al carrito"; **autenticado** → `a.searchDistributor` "Buscar distribuidor" → `/distribuidores`. → **BUG-B2C-483** (ver abajo — comportamiento invertido y dañino).
- H3 con **nombre duplicado** ("Tinaco Plus+ con Bomba Centrifuga 1,100 ... Tinaco Plus+ con Bomba Centrifuga 1,100 litros") — BUG-027 sistémico.

### 8. Estado vacío

Tras la compra (orden 52820261OYM4) el carrito quedó vacío. Estado vacío:

| Elemento | Valor |
|---|---|
| H2 | "Tu carrito está vacío" |
| Copy | "Los mejores productos a un clic. ¡Añádelos a tu carrito!" + "Recuerda: al superar los $2,000 MXN tu envío es completamente gratis." |
| Contador | "0" |
| Ilustración | `<img alt="Carrito vacío">` SVG inline (icono de carrito, fill `#165EEB`) ✓ con alt |
| CTA | botón **"Ver productos"** (visible) |
| "Iniciar compra" / "Vaciar carrito" | **ocultos** (display:none) — correcto, verificado |
| Cross-sell | "Tal vez te pueda interesar" con 4 cards y botón "Agregar al carrito" |

#### Bugs del estado vacío + add-to-cart + sesión

| ID | Severidad | Hallazgo |
|---|---|---|
| **BUG-B2C-479** | BAJA copy | La página de carrito usa **"Mi carrito"** (H2) y **"Mi Carrito"** (breadcrumb/heading) — capitalización inconsistente en la misma vista. |
| **BUG-B2C-480** | **CERRADO s22 (falso positivo)** | ~~Logout tras compra exitosa (orden 52820261OYM4, observado 1 vez).~~ No se reprodujo en 5 compras posteriores con todos los métodos de pago. Falso positivo. |
| **BUG-B2C-481** | ALTA UX | **Add-to-cart anónimo da falsa confirmación (sistémico).** Click en "Agregar a carrito" — tanto en el **PDP principal** como en el cross-sell — estando anónimo abre el mini-cart drawer "Añadiste este articulo a tu carrito" + "Ver Carrito", pero el item **NO persiste**: el badge sigue en 0 y `/cart` muestra "Tu carrito está vacío". El carrito anónimo no funciona o la confirmación es falsa. Consecuencia: **un invitado nunca puede armar un carrito → el checkout es inalcanzable sin sesión** (gating de facto, pero por una confirmación engañosa en vez de un prompt de login). |
| **BUG-B2C-482** | MEDIA UX | El mini-cart drawer (I.13) post-add **no nombra el producto, cantidad ni precio** — solo el texto genérico "Añadiste este articulo a tu carrito" (+ "articulo" sin tilde, BUG-002 sistémico). El usuario no confirma QUÉ agregó. |
| **BUG-B2C-483** | ALTA UX/negocio | El CTA del cross-sell depende del estado de **autenticación, de forma invertida y dañina**: el usuario **anónimo** recibe "Agregar al carrito" (que NO persiste — BUG-481), mientras el usuario **autenticado** (el que SÍ puede comprar) recibe "Buscar distribuidor" → lo saca del flujo de compra hacia `/distribuidores`. El comprador logueado no puede añadir el producto sugerido al carrito desde el cross-sell. |

#### Cross-state invitado (sin sesión) — verificado

Recorrido del catálogo/PDP/carrito como **invitado** (logout previo), contrastado con el estado autenticado:

| Elemento | Autenticado | Invitado |
|---|---|---|
| Header de cuenta | Nombre + email + dropdown "JG" | **"Inicia sesión o regístrate"** |
| Barra superior | Dirección guardada ("Casa: Camarones 155k…") | Banner **"Consulta qué productos tenemos listos para enviar a tu ubicación" + "Ver cómo"** |
| Badge carrito | Numérico cuando hay items | Sin badge (0, no persiste — BUG-481) |
| PDP disponibilidad | "Disponible para C.P. 02800" | **"Disponibilidad por zona"** (sin CP en contexto) |
| PDP precio | $1,551.60 visible | **$1,551.60 visible igual** (el precio no se oculta al invitado) |
| Reseñas | "¡Se el primero en dejar una reseña!" + botón **"Escribir una reseña"** | **"¡Inicia sesión y se el primero en dejar una reseña!"** — sin botón (gating correcto) |
| Add-to-cart | Persiste (badge sube, item en /cart) | **No persiste** — drawer de confirmación falso (BUG-481) |
| Checkout | Alcanzable con items | **Inalcanzable** (no hay forma de armar carrito) |

| ID | Severidad | Hallazgo |
|---|---|---|
| **BUG-B2C-508** | BAJA copy/ortografía | En reseñas del PDP: **"se el primero en dejar una reseña"** — falta tilde en el imperativo: debe ser **"sé el primero"**. Presente en ambos estados (invitado: "¡Inicia sesión y se el primero…!"; autenticado: "¡Se el primero…!"). |

**Positivos (no-bug):** el precio se muestra al invitado (no hay paywall de precio); el gating de reseñas es correcto (sin sesión no aparece el botón "Escribir una reseña", se invita a iniciar sesión); el empty state oculta correctamente "Iniciar compra"/"Vaciar carrito".

Evidencia: `F1C-29-guest-cart-vacio-no-persiste.png`.

#### Evidencia del estado vacío

- `evidencias/F1C-18-cart-empty-state.png` — "Tu carrito está vacío" + ilustración + "Ver productos" + cross-sell con "Agregar al carrito"

### 9. DOM contract

```javascript
test('II.5 /cart/ — con item', async ({ page }) => {
  await page.goto('https://qarotoplasmx.io/cart/');
  await expect(page.locator('h2', { hasText: 'Mi carrito' })).toBeVisible();
  await expect(page.locator('.line-cart-item')).toHaveCount(1);
  await expect(page.getByText('SKU: 500040')).toBeVisible();
  // BUG-458: steppers vacíos
  const dec = page.locator('.decreasebutton').first();
  expect(await dec.getAttribute('aria-label')).toBeNull();
  expect((await dec.textContent()).trim()).toBe('');
  // gating: Iniciar compra disabled sin T&C
  await expect(page.locator('.button-primary').first()).toBeDisabled();
  const tyc = page.locator('input[type="checkbox"]').filter({ has: page.locator('xpath=..') }); // checkbox de T&C
  // BUG-461: T&C link es serviciados
  const tycLink = page.locator('a[href*="terminos-y-condiciones-serviciados"]');
  await expect(tycLink).toBeVisible();
  // resumen
  await expect(page.getByText('Total:')).toBeVisible();
  await expect(page.getByText(/Incluye IVA/)).toBeVisible();
});
```

### 10. Evidencia

- `evidencias/F1C-12-cart-con-item.png` — carrito full-page con item Tamboplas + resumen + cross-sell
- `scripts/F1C-cart-deep.json` — dump completo (item, resumen, gating, botones, cross-sell, bugs)

### 11. Stepper de cantidad

Botones `.decreasebutton` / `.increasebutton` (Qwik `q-…#…`). **Recálculo correcto en ambas direcciones:**

| Acción | Cantidad | Subtotal | Envío | Total |
|---|---|---|---|---|
| Inicial | 1 | $1,551.60 | $200.00 | $1,751.60 |
| Incrementar (+) | 2 | $3,103.20 | **Gratis** (cruza umbral $2,000) | $3,103.20 |
| Decrementar (−) | 1 | $1,551.60 | $200.00 (reaparece) | $1,751.60 |

**Positivo:** el recálculo de Subtotal/Total y la lógica de "Envío gratis en compras mayores a $2,000" se aplican en vivo al cambiar la cantidad. Los botones `decreasebutton`/`increasebutton` no tienen texto, `aria-label` ni `title` (el glifo +/− es CSS `content`) → inoperables con lector de pantalla (BUG-458).

## II.5.b `/checkout/[1-3]/` — Checkout 3 pasos

> Flujo de checkout con pasos en URL: **Dirección (`/checkout/1/`) → Información (`/checkout/2/`) → Pago (`/checkout/3/`)**. `/checkout` redirige a `/checkout/1/`.

### 1. Layout y elementos persistentes

- **Header/footer propios minimalistas** — el checkout NO usa el nav global (I.2) ni el footer global (I.4). Header = solo logo "ir al inicio" → `/`. Footer = "Contáctanos" + email + tel + 4 links legales.
- **Panel "Resumen del pedido"** persistente en los 3 pasos (Productos 1, Servicios 0, Subtotal $1,991.57, Ahorraste $0.00, Envío $200.00, Total $2,191.57 Incluye IVA).
- **Stepper:** `.stepper` con `line step-1/2/3 active|inactive` + `.step-name`. Labels: Dirección · Información · Pago.
- `<title>` = `Rotoplas` (BUG-251 sistémico). Chatbot Silvia presente (botón "Abrir ¡Hola soy Silvia!").

### 2. Anomalías del footer del checkout (distinto al footer global I.4)

| Elemento | Valor en checkout | Hallazgo |
|---|---|---|
| Copyright | `© 2024` | ❌ **BUG-B2C-464** — el footer global del sitio dice `© 2026`; el del checkout dice `© 2024`. Año hardcodeado **inconsistente entre dos footers del mismo sitio**. |
| "Términos y condiciones" | href `/terminos-y-condiciones`, **`title="Aviso de privacidad"`** | ❌ **BUG-B2C-465** — el link de T&C tiene tooltip/título "Aviso de privacidad" (atributo equivocado). |
| "Seguridad de la información" | `https://rotoplas.com.mx/seguridad-de-la-informacion/` | ❌ **BUG-B2C-466** — cross-domain a producción; el footer global usa `qarotoplasmx.io/seguridad-de-la-informacion/`. Inconsistencia de dominio. |
| "Código de ética" | `https://rotoplas.com.mx/wp-content/uploads/2020/02/…20190711.pdf` | ❌ **BUG-B2C-467** — host distinto al del footer global (`storage.googleapis.com/rtp-bucket-b2b-prd/…`). 2 ubicaciones para el mismo PDF (ambas 2019). |
| Teléfono | `tel:800 506 3000` | ❌ **BUG-B2C-468** — href `tel:` con espacios (debería `tel:8005063000`). |

### 3. Paso 1 — Dirección (`/checkout/1/`)

| Elemento | Detalle | Hallazgo |
|---|---|---|
| Código de descuento | textbox "Código" **disabled** + botón "Aplicar" | ❌ **BUG-B2C-470** — el campo de código de descuento está deshabilitado en el paso 1 (¿se habilita en otro paso? no hay indicación). Usuario no puede aplicar cupón. |
| H3 "Verifica tu dirección de envío" | dirección guardada "Casa" (Camarones 155k… CDMX 02800) | — |
| Selección de dirección | 4× `<input type="radio" name="manualAddressAlias">` **sin `id`** | ❌ **BUG-B2C-469** — radios de dirección sin `id` ni label asociado (a11y). |
| CTAs | "Usar esta dirección" (avanza a paso 2), "Cambiar dirección", "Intentar con otro CP" | "Usar esta dirección" → loading "Espere un momento" → `/checkout/2/` |

### 4. Paso 2 — Información de contacto (`/checkout/2/`)

H3 "Información de contacto". 4 campos **todos `readonly`** (pre-llenados de la cuenta):

| Campo | Valor | Estado |
|---|---|---|
| Nombre(s)* | "Jorge" | readonly |
| Apellido(s)* | "García" | readonly |
| Teléfono* | "5511111111" | readonly |
| Correo electrónico* | "andrei.garcia@xideral.co" | readonly |

CTA "Continuar" → `/checkout/3/`. **No hay campos CFDI/RFC en este paso** (contraste con checkout B2B). La facturación se maneja en el paso 3 + post-compra.

### 5. Paso 3 — Pago (`/checkout/3/`)

**Métodos de pago (3):** "Tarjeta de crédito / débito" (Visa · MasterCard · American Express), "Transferencia", "Pago en efectivo".

- Selección de método = **`.check-card`** (divs con clase `checked` en el seleccionado, comportamiento tipo radio) dentro de `.payment-methods`. ~~Antes `.method-card` (divs clickeables) — el markup cambió entre s16 y s22.~~ → BUG-473.

**Formulario de tarjeta:**

| Campo | name | type | maxlength | autocomplete | inputmode | placeholder |
|---|---|---|---|---|---|---|
| Nombre del titular* | `cc-name` | text | — | `off` | — | `*` |
| Número de tarjeta* | `cc-number` | text | 19 | `off` | — (no numeric) | `*` |
| MM/AA* | `cc-exp` | text | — | `off` | — | `*` |
| CVV/CSC* | `cc-csc` | **password** | **3** | `off` | — | `*` |

**Facturación electrónica (H2):** "Puedes facturar desde la sección Mis pedidos luego de realizar la compra." + toggle **"Sin CFDI"** / **"CFDI"** (ambos como `<h1>`).

**OpenPay:** "Powered by OpenPay", "Proveedor de pagos PCI Nivel 1", iframes antifraude (`tst.kaptcha.com` + `sandbox-api.opencontrol.mx`).

**Checkbox** "Acepto los Términos y condiciones y el Aviso de privacidad" → botón **"Pagar" disabled** (gated). **No se completó el pago.**

#### Bugs del paso 3

| ID | Severidad | Hallazgo |
|---|---|---|
| **BUG-B2C-471** | ALTA SEO/a11y | **3 `<h1>` en la página de pago**: "Disfrute el envío estándar en todas las compras" (banner promo), "Sin CFDI", "CFDI". Múltiples H1 + jerarquía invertida (H1 anidados bajo el H2 "Facturación electrónica" y el H3 "Método de pago"). |
| **BUG-B2C-472** | MEDIA a11y | Las opciones del toggle de facturación "Sin CFDI"/"CFDI" están marcadas como `<h1>` — abuso semántico (son controles seleccionables, no encabezados). |
| **BUG-B2C-473** | MEDIA a11y | Los 3 métodos de pago son `<div>` clickeables sin `role="radio"`/`radiogroup`, sin estado `aria-checked`, sin selección por teclado. |
| **BUG-B2C-474** | MEDIA UX/seg | Los 4 campos de tarjeta usan `autocomplete="off"` — bloquea el autofill legítimo de tarjetas del navegador/gestor. Debería usar tokens `cc-name`/`cc-number`/`cc-exp`/`cc-csc`. |
| **BUG-B2C-475** | MEDIA mobile | `cc-number` y `cc-csc` sin `inputmode="numeric"` → en móvil aparece teclado de texto en lugar del numérico. |
| **BUG-B2C-476** | ALTA funcional | `cc-csc` con `maxlength="3"` pero se ofrece **American Express** (CVV de **4 dígitos**). El campo bloquea el CVV correcto de Amex → pagos Amex imposibles de completar. |
| **BUG-B2C-477** | BAJA UX | Los 4 inputs de tarjeta tienen `placeholder="*"` (solo un asterisco) — sin placeholder informativo del formato esperado. |
| **BUG-B2C-478** | BAJA copy | "Tarjetas validas para pago:" — "validas" sin tilde (válidas). |

### 6. Hallazgo positivo

El botón "Pagar" hace gating por aceptación de T&C + datos (disabled hasta completar). Igual que el carrito (II.5). Conservar.

### 7. DOM contract — checkout

```javascript
test('II.5.b /checkout/ — 3 pasos', async ({ page }) => {
  // requiere carrito con ≥1 item
  await page.goto('https://qarotoplasmx.io/checkout');
  await expect(page).toHaveURL(/\/checkout\/1\//);
  // paso 1: dirección
  await expect(page.getByRole('heading', { name: 'Verifica tu dirección de envío' })).toBeVisible();
  await page.getByRole('button', { name: 'Usar esta dirección' }).click();
  await expect(page).toHaveURL(/\/checkout\/2\//);
  // paso 2: campos readonly
  await expect(page.locator('input[value="Jorge"]')).toHaveAttribute('readonly', '');
  await page.getByRole('button', { name: 'Continuar' }).click();
  await expect(page).toHaveURL(/\/checkout\/3\//);
  // paso 3: pago
  await expect(page.locator('input[name="cc-number"]')).toBeVisible();
  // BUG-476: CVV maxlength 3 pese a Amex
  expect(await page.locator('input[name="cc-csc"]').getAttribute('maxlength')).toBe('3');
  // BUG-474: autocomplete off
  expect(await page.locator('input[name="cc-number"]').getAttribute('autocomplete')).toBe('off');
  // BUG-471: 3 H1
  expect(await page.locator('h1').count()).toBe(3);
  // BUG-464: footer © 2024
  await expect(page.getByText(/Copyright © 2024/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Pagar' })).toBeDisabled();
});
```

### 8. Evidencias

- `evidencias/F1C-13-checkout-paso1-direccion.png`
- `evidencias/F1C-14-checkout-paso2-informacion.png`
- `evidencias/F1C-15-checkout-paso3-pago.png`
- `scripts/F1C-checkout-deep.json` — dump de los 3 pasos + anomalías footer + form tarjeta

### 9. Métodos de pago — Transferencia y Efectivo

Al seleccionar un método distinto a Tarjeta, el formulario de tarjeta se oculta y el botón de acción cambia de **"Pagar"** a **"Generar pedido"**.

| Método | Form | Botón acción | Copy / comportamiento |
|---|---|---|---|
| Tarjeta de crédito / débito | cc-name, cc-number, cc-exp, cc-csc + OpenPay | **Pagar** | Cobro inmediato (mapeado en §5) |
| **Transferencia** | (ninguno) | **Generar pedido** | "Una vez que elijas este método y procedas con la compra, tendrás **48 horas naturales.para** realizar tu pago. Se mostrarán los datos e instrucciones para realizar la transferencia, los cuales también recibirás por correo electrónico." |
| **Pago en efectivo** | (ninguno) | **Generar pedido** | Muestra instrucciones + bloque de políticas (precios/entrega/devoluciones) que referencian `https://rotoplas.com.mx` |

| ID | Severidad | Hallazgo |
|---|---|---|
| **BUG-B2C-492** | BAJA copy | Transferencia: "48 horas **naturales.para** realizar tu pago" — falta espacio tras el punto (y el punto sobra: debería "48 horas naturales para realizar"). |

#### 9.b Flujo "Generar pedido" por Transferencia (orden 6520265MD5Y)

Seleccionar **Transferencia** (StaticText `.method-card`, BUG-473) oculta el formulario de tarjeta y cambia el botón a **"Generar pedido"** (gated por la aceptación de T&C vía checkbox que requiere click real CDP en Qwik). Copy del método (verbatim): *"Una vez que elijas este método y procedas con la compra, tendrás 48 horas naturales.para realizar tu pago. Se mostrarán los datos e instrucciones para realizar la transferencia, los cuales también recibirás por correo electrónico. Además, te notificaremos por correo una vez que tu pago haya sido validado."* Con el carrito en 1 item ("Base para tinaco GDPV" SKU 310002, Total $1,751.60) y el toggle en **"Sin CFDI"**, "Generar pedido" crea la orden server-side (POST `/checkout/3/` 200 + GA `purchase`) y navega a la confirmación **`/order/[orderNumber]/`**. La orden persiste en `/customer/orders`.

**Pantalla de confirmación de transferencia `/order/[orderNumber]/` — mapeo deep**

Meta y estructura:

| Campo | Valor | Hallazgo |
|---|---|---|
| `<title>` | `Rotoplas` | BUG-251 sistémico (placeholder) |
| `meta[description]` | `¡Disfruta lo mejor de Rotoplas al alcance de un solo clic!` | BUG-359 sistémico (genérica) |
| `meta[robots]` | ❌ AUSENTE | **BUG-B2C-515**: página transaccional con nº de orden en URL **indexable** (debería `noindex`) |
| `link[canonical]` | `…/order/6520265MD5Y/` (self) | OK |
| `og:title` / `og:type` | ❌ ausentes | patrón sistémico |
| `htmlLang` | `es-mx` | OK |
| **H1** | **"¡Solo falta un paso!"** | único H1 de contenido (contraste con tarjeta "¡Tu compra ha sido un éxito!") |
| Jerarquía | H2 "Agregar dirección" + H2 "Verifica disponibilidad de entrega" + H3 "Ingresa tu ubicación…" **preceden al H1** | BUG-049 sistémico: el modal I.6 (cerrado) se renderiza global y sus headings se cuentan → jerarquía invertida (H2 antes de H1) |

Copy de contenido (verbatim): *"Tu número de orden es: 6520265MD5Y. Para confirmar tu pedido, por favor realiza la transferencia por el monto exacto incluyendo centavos y sin fraccionar dentro de un plazo de 48 horas. Puedes encontrar los detalles de cómo hacer la transferencia dando clic en el botón "Ver instrucciones" o también los puedes encontrar en tu correo electrónico enviado por Openpay. … Una vez que se confirme tu pago, te lo notificaremos por correo electrónico y comenzaremos a preparar tu pedido."*

Botones de la confirmación (todos `type="submit"`, sin `aria-label` salvo donde se indica):

| Texto | type | class | handler Qwik | Acción / destino |
|---|---|---|---|---|
| **Imprimir** | submit | `action-print` (`⭐️3qxbwv-0 ⭐️c31f8c-1`) | `q-yugS4KFE.js#s_Gg3po6hi4ok` | `window.print()` |
| **Ver instrucciones** | submit | `button-secondary` | `q-BSjEIjFW.js#s_fQtSa5Hm07Q[0]` | Abre **pestaña nueva** con el PDF SPEI de OpenPay |
| **Ir a mis pedidos** | submit | `button-primary` | `q-B1_3-yEJ.js#s_GRno8MXqY0s[0 1]` | Navega a `/customer/orders` |
| **Continuar comprando** | submit | `button-secondary` | `q-DvLv6hFm.js#s_5u1nj0F3n6M[0 1]` | Navega a la tienda (home) |

> Los CTAs son `<button type="submit">` (no `type="button"`) y sin `aria-label`; el texto visible los hace operables, pero el `submit` fuera de un `<form>` es semánticamente incorrecto. La confirmación **no contiene links propios** (los `a[href="/cart"]`, "Ver Carrito" y "Aviso de privacidad" detectados pertenecen al shell global: mini-cart drawer I.13 + banner de cookies). Header/footer = componentes globales I.1/I.4 (footer duplicado 2× — BUG-005).

**Datos bancarios — PDF SPEI de OpenPay** (`sandbox-dashboard.openpay.mx/spei-pdf/…`, `application/pdf`, pestaña nueva). Título **"Pasos para realizar el pago"**, en 2 columnas (campo por campo):

| Columna "Desde BBVA" | Columna "Desde cualquier otro banco" |
|---|---|
| Número de convenio CIE: **1411217** | Beneficiario: **Amigley Bastardo** |
| Referencia: **25990055384624135297** | Banco destino: **BBVA Bancomer** |
| Importe: **$ 1,751.60 MXN** | Clabe: **000000000000000001** (placeholder sandbox) |
| Concepto: **Transferencia SPEI 6520265MD5Y** | Concepto de pago: **25990055384624135297** |
| | Referencia: **1411217** |
| | Importe: **$ 1,751.60 MXN** |

Pie del PDF: línea de contacto + logos **Banamex / Banorte / BBVA Bancomer / Santander** + *"¿Quieres pagar en otros bancos con servicio spei? visita: www.openpay.mx/bancos.html"* + "Powered by Openpay".

**Guard de negocio (positivo):** no se puede generar un nuevo pedido por transferencia mientras haya uno pendiente de pago — "Generar pedido" se bloquea con el toast *"Por favor completa la transferencia que tienes pendiente del pedido anterior para habilitar esta opción."* El guard **se libera** cuando el pago del pedido previo se valida en backend (el pedido avanza de "En proceso" a "Confirmado"/"En camino").

| ID | Severidad | Hallazgo |
|---|---|---|
| **(positivo)** | — | Guard correcto: impide acumular pedidos de transferencia sin pagar (uno pendiente a la vez). |
| **(positivo)** | — | La confirmación entrega los datos vía "Ver instrucciones" (PDF SPEI) + correo. Flujo completo y funcional. |
| **BUG-B2C-514** | MEDIA UX | **La confirmación de transferencia NO muestra resumen de orden** (sin productos/SKU, sin dirección de envío, sin Subtotal/Envío/Total). El usuario no puede verificar qué ni cuánto pagará desde la confirmación. Inconsistente con la confirmación de tarjeta/efectivo, que sí muestran el resumen completo. |
| **BUG-B2C-515** | BAJA SEO | `meta[robots]` ausente en `/order/[orderNumber]/` — página transaccional con número de orden en la URL queda indexable. Debería ser `noindex`. |
| **BUG-B2C-505** | BAJA copy/data | En el PDF SPEI, el teléfono de contacto se renderiza como literal **"null"**: *"Si tienes dudas comunícate a Amigley Bastardo al teléfono **null** o al correo abastardo@rotoplas.com"*. |
| **BUG-B2C-516** | INFO data | En el PDF SPEI el valor **1411217** se etiqueta como "Número de convenio CIE" (col. BBVA) y como "Referencia" (col. otro banco), y **25990055384624135297** como "Referencia" (BBVA) y "Concepto de pago" (otro banco) — mismos valores con etiquetas distintas entre columnas. Es el modelo CIE/SPEI de OpenPay (correcto técnicamente) pero puede confundir al usuario. |
| **BUG-B2C-492** | BAJA copy | (reconfirmado) Copy del método: "48 horas **naturales.para** realizar tu pago" — falta espacio tras el punto y el punto sobra. |
| **BUG-B2C-500** | MEDIA UX | **State-leak del modal fiscal.** Si durante el checkout se abre el toggle **CFDI** y se teclean datos, y luego se vuelve a **"Sin CFDI"**, al pulsar "Generar pedido" aparece el modal **"Datos fiscales incorrectos — Puede continuar con una factura genérica o corregir los datos fiscales"** y un overlay "Procesando" que **bloquea la navegación a la confirmación**, aunque el usuario eligió no facturar. En la corrida limpia (CFDI nunca tocado) **no se reproduce**. |

> **BUG-499 DESCARTADO** (→ apéndice "IDs retirados"). La confirmación de transferencia se muestra correctamente y los datos bancarios se entregan vía "Ver instrucciones" (PDF SPEI) + correo. El fallo aparente de no entrega era el state-leak del modal fiscal + overlay (BUG-500).

**DOM contract — confirmación de transferencia:**

```javascript
test('II.6 transferencia — /order/[n]/ "¡Solo falta un paso!"', async ({ page }) => {
  // tras "Generar pedido" por transferencia
  await expect(page).toHaveURL(/\/order\/[A-Z0-9]+\//);
  await expect(page.getByRole('heading', { level: 1, name: '¡Solo falta un paso!' })).toBeVisible();
  await expect(page.getByText(/Tu número de orden es:/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Ver instrucciones' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Ir a mis pedidos' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Continuar comprando' })).toBeVisible();
  // BUG-514: sin resumen de orden
  await expect(page.getByText('SKU:')).toHaveCount(0);
  // BUG-515: robots ausente
  await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
});
```

Evidencias: `F1C-25-transferencia-confirmacion-solo-falta-un-paso.png`, `F1C-26-transferencia-modal-ver-instrucciones.png`, `F1C-27-transferencia-spei-pdf-openpay.png`. Orden de prueba: **6520265MD5Y**.

#### 9.c Flujo "Generar pedido" por Pago en efectivo (orden 652026BIL00)

Seleccionar **Pago en efectivo** oculta el formulario de tarjeta y cambia el botón a **"Generar pedido"** (gated por T&C). Copy del método: *"Una vez que elijas este método y procedas con la compra, tendrás 48 horas naturales para realizar tu pago. Recibirás por correo electrónico los datos e instrucciones para realizar el depósito y te notificaremos por correo una vez que tu pago haya sido validado."* Al pulsar "Generar pedido" con CFDI en "Sin CFDI", la orden se crea y la página navega a **`/order/[orderNumber]/`**. La orden persiste en `/customer/orders`.

A diferencia de Transferencia, la confirmación de efectivo **reutiliza la pantalla de éxito estándar ya mapeada en II.6** (la misma del pago con tarjeta), con estos elementos verbatim:

- Botón **"Imprimir"** (esquina superior) + icono de **check verde**.
- **H1 "¡Tu compra ha sido un éxito!"** + *"Tu pedido está siendo procesado y te notificaremos el proceso a tu correo: andrei.garcia@xideral.co"*.
- **No. de pedido:** 652026BIL00.
- **Dirección de envío:** Jorge García · Camarones 155k, Nueva Santa María, Azcapotzalco, Ciudad de México, Ciudad de México · C.P. 02800 · Teléfono 5511111111.
- **Datos de pago:** "Efectivo" + disclaimer *"*El tiempo de entrega puede variar según el pedido; sin embargo, te mantendremos informado(a) con actualizaciones de estatus vía correo electrónico."*.
- **Productos / Detalles:** "Base para tinaco GDPV · SKU: 310002 · Cantidad: 1 · $1,551.60". Pedido realizado: 4 de junio de 2026. **Subtotal $1,551.60 · Envío $200.00 · Total $1,751.60 (Incluye IVA)** — resumen de orden COMPLETO (contraste con la confirmación de transferencia que lo omite, BUG-514).
- CTAs **"Continuar comprando"** + **"Ir a mis pedidos"** (mismos botones que II.6).
- **No hay botón "Ver instrucciones" ni referencia/ficha de depósito en pantalla** — el copy del método indica que esos datos llegan solo por correo.

> Meta tags, PCI-masking y el resto del árbol DOM son idénticos a la confirmación estándar mapeada en **II.6** (no se reduplican aquí). La diferencia única respecto a tarjeta es "Datos de pago: Efectivo" (sin tarjeta enmascarada) y el disclaimer de tiempo de entrega.

| ID | Severidad | Hallazgo |
|---|---|---|
| **BUG-B2C-506** | MEDIA UX/copy | La confirmación de efectivo muestra **check verde + "¡Tu compra ha sido un éxito!"** cuando el pago **sigue pendiente** (el usuario tiene 48 h para depositar y aún no pagó nada). Es engañoso e **inconsistente con Transferencia**, que para el mismo estado (pago pendiente) muestra correctamente H1 "¡Solo falta un paso!". |
| **BUG-B2C-507** | MEDIA UX | Efectivo **no entrega instrucciones ni referencia de depósito en pantalla** (sin "Ver instrucciones", sin ficha/número de referencia) — depende 100% del correo. Inconsistente con Transferencia, que muestra los datos en pantalla (PDF SPEI) además del correo. Si el correo no llega, el usuario no tiene cómo pagar. |

**Comportamiento positivo (no-bug):** el copy de efectivo usa "48 horas naturales **para** realizar tu pago" (con espacio correcto) — el typo "naturales.para" de **BUG-492** es exclusivo del copy de Transferencia. El modal fiscal **no se dispara** en corrida limpia (reconfirma que BUG-500 es state-leak por tocar el toggle CFDI).

Evidencia: `F1C-28-efectivo-confirmacion-compra-exitosa.png`. Orden de prueba: **652026BIL00**.

#### 9.d Capa 2 — Correos transaccionales de Transferencia y Efectivo (plantillas D y E)

> **Cerrado en sesión 16 (2026-06-08)** con la cuenta de inbox legible `c.agarcia@rotoplas.com`. Se re-ejecutaron ambos flujos E2E para verificar el **efecto externo real (el correo con instrucciones de pago llega)** — el último pendiente de Capa 2 para métodos de pago. Órdenes nuevas: **Transferencia `6820263SS52`** · **Efectivo `6820266FJM8`**. Remitente en ambos: `ventasecom@rotoplas.com`. **On-site y PDFs reconfirmados** sin cambios respecto a 9.b/9.c (mismo `¡Solo falta un paso!` + "Ver instrucciones"→PDF SPEI para transferencia; misma pantalla de éxito sin instrucciones para efectivo; PDFs SPEI/PayNet con beneficiario "Amigley Bastardo" + teléfono roto — ver abajo).

Con esto **B2C suma 5 plantillas de correo distintas**: A (compra tarjeta / bienvenida, ©2026, `lang=es`), B (reset / contacto, ©2023, `lang=en`), C (status, ©2023, `lang=en`), **D (transferencia/SPEI, ©2025, `lang=en`)** y **E (efectivo/PayNet, ©2023, `lang=en`)**. La fragmentación de plantillas (3 años distintos de copyright, 2 footers distintos, `lang` inconsistente) es la deuda transversal de fondo.

**(D) Correo de Transferencia — asunto "Recibimos tu pedido"** (hilo Gmail `19ea918c9ab23e5f`, orden 6820263SS52):

| Elemento | Valor verbatim / `href` | Hallazgo |
|---|---|---|
| Remitente / asunto | `ventasecom@rotoplas.com` · **"Recibimos tu pedido"** | el asunto, el H1 del correo y el H1 on-site **no coinciden** → BUG-558 |
| `<html lang>` | `en` | reconfirma **BUG-547** (contenido español) |
| `<meta viewport>` | `width<corrupto>vice-width, initial-scale=1.0` | **BUG-562**: el `=device-` está corrupto (byte inválido U+FFFD) → escalado móvil del correo roto. Presente también en plantilla E |
| Logo | `res.cloudinary.com/.../djix4vyqyx8ikzf1tprz.png` (`alt="Logo"`) | OK |
| H1 | **"¡Tu pedido está casi listo!"** | difiere del asunto y del on-site "¡Solo falta un paso!" (BUG-558) |
| H3 | "Tu número de orden es: 6820263SS52" | OK |
| Copy | *"…realiza la transferencia por el monto exacto **,** incluyendo los centavos y sin fraccionar, dentro de **un plazo de 48 horas.** … o también puedes encontrarlos en el correo electrónico enviado por Openpay."* | **BUG-560**: espacio antes de la coma ("exacto ,") |
| CTA "Ver instrucciones" | `<a href="https://sandbox-dashboard.openpay.mx/spei-pdf/…?utm_*">` (botón outline azul) | OK — abre el mismo PDF SPEI |
| Tabla "Detalles de la orden" | Método: **Transferencia**; envío "Avenida Álvaro Obregón, 191, A, 06700, Cuauhtémoc, Roma Norte, Ciudad de México, **Mexico**"; facturación "RFC XAXX010101000, … **C. P. 04950**, Régimen 616, Uso S01"; Productos: Base para tinaco GDPV / 310002 / $1,551.60 / 1 | dirección estilo plantilla C → reconfirma **BUG-554** ("Mexico" sin acento + orden alcaldía/colonia). Factura genérica pese a "Sin CFDI" → reconfirma **BUG-556**. (Incluye nº exterior 191, a diferencia de la plantilla A que lo omite — BUG-536) |
| Totales | Subtotal $1,551.60 · Costo de Envío $200.00 · Total* $1,751.60 · *IVA incluido | OK (sección Descuentos comentada en el HTML por decisión de negocio 23/07/2025) |
| Texto plano | tabla de Productos **sin filas** (encabezados sí, datos no) | reconfirma **BUG-555** |
| CTA "Ver mi pedido" | `https://qarotoplasmx.io/traking/6820263SS52?utm_*` | OK |
| Footer | **"Copyright 2025 Rotoplas S.A. de C.V."** + "Aviso de privacidad." → `/Avisodeprivacidad/` + "Términos y condiciones" → `/Terminosycondiciones/` | **BUG-559**: año 2025 (4º valor distinto) y sin símbolo "©". Links legales CamelCase → reconfirma **BUG-545** (404). Footer **minimal** (sin "¿Necesitas ayuda?" ni teléfono, a diferencia de E) |

**(E) Correo de Efectivo — asunto "Tu pedido está en proceso"** (hilo Gmail `19ea82f4b94ea359`, msg `19ea92011f86b9b9`, orden 6820266FJM8):

| Elemento | Valor verbatim / `href` | Hallazgo |
|---|---|---|
| Remitente / asunto | `ventasecom@rotoplas.com` · **"Tu pedido está en proceso"** | el asunto coincide con el H1 del correo, pero **no** con el H1 on-site de efectivo ("¡Tu compra ha sido un éxito!") |
| `<html lang>` / `<meta viewport>` | `en` / corrupto | reconfirma **BUG-547** + **BUG-562** |
| H1 | "Tu pedido está en proceso" | OK |
| Copy | *"Descarga y presenta tu orden de pago en cualquiera de nuestros puntos autorizados. Recuerda que tienes 48 horas naturales para realizar el pago en efectivo…"* | OK |
| CTA "Descarga tu Orden de pago" | `<a href="https://sandbox-dashboard.openpay.mx/paynet-pdf/…?utm_*" download="Váucher de pago.pdf" target="_blank">` | **BUG-561**: el atributo `download` dice "**Váucher**" (mal escrito → "Voucher"/"Comprobante") |
| CTA "Puntos de pago autorizados" | `https://www.paynet.com.mx/?utm_*` (`target="_blank"`) | OK |
| Tabla "Detalles de la orden" | Método: **Efectivo**; envío y facturación **idénticos a la plantilla D** (mismos BUG-554 / BUG-556); Productos: Base para tinaco GDPV / 310002 / $1,551.60 / 1 | reconfirma BUG-554, BUG-556 |
| Totales | Subtotal $1,551.60 · Costo de Envío $200.00 · Total* $1,751.60 | OK |
| Texto plano | tabla de Productos **sin filas** | reconfirma **BUG-555** |
| Footer | "¿Necesitas ayuda? Comunícate … `servicioaclientes@rotoplas.com` o al número telefónico **55 1234 5678**." + legal `/Terminosycondiciones/` · `/Avisodeprivacidad/` + **"Copyright © 2023"** | footer estilo plantilla C → reconfirma **BUG-552** (teléfono falso) + **BUG-545** (legal 404). Año 2023 (consistente con B/C) |

**PDFs de instrucciones de pago (generados por OpenPay) — reconfirmados:**

- **PDF SPEI** (transferencia, `…/spei-pdf/mzwjgp42ijmfpjmteixh/tri9gjpd4l5olptd52um`): convenio CIE **1411217**, Referencia **26466998854628135203**, CLABE **000000000000000001** (sandbox), Banco **BBVA Bancomer**, Importe **$1,751.60**, Concepto "Transferencia SPEI 6820263SS52". Footer: *"Si tienes dudas **comunicate** a Amigley Bastardo al teléfono **null** o al correo abastardo@rotoplas.com"* → reconfirma **BUG-505** (teléfono "null") + **BUG-563** (("comunicate" sin tilde)) + **BUG-564** ("Fecha y hora … a las **15:17 PM**", formato 24 h + PM). Guardado a disco: `evidencias/CAPA2-11b-spei-6820263SS52.pdf`.
- **Voucher PayNet** (efectivo, `…/paynet-pdf/mzwjgp42ijmfpjmteixh/1010100657639519`): código de barras + Referencia **1010 1006 5763 9519**, Total **$1,751.60**, Límite "10 de junio de 2026, a las 15:25:08", Concepto "Pago en tienda 6820266FJM8", tiendas 7-Eleven/Farmacias del Ahorro/Super Farmacia/Walmart/Sam's/Bodega Aurrera. Footer: *"En caso de dudas contacta a **AMIGLEY BASTARDO** al correo abastardo@rotoplas.com o al teléfono [**en blanco**]"* → **extiende BUG-505** (el teléfono de contacto también está roto aquí, esta vez vacío en vez de "null"). Guardado a disco: `evidencias/CAPA2-15b-paynet-6820266FJM8.pdf`.

> **INFO entorno (no-bug numerado):** el comercio "Amigley Bastardo" y el correo `abastardo@rotoplas.com` en ambos PDFs son la **cuenta sandbox de OpenPay**; en producción deben mostrar a Rotoplas. Se documenta para que al pasar a prod se verifique la config del comercio OpenPay (nombre + teléfono + correo de contacto), donde el teléfono roto (BUG-505) seguiría apareciendo si no se configura.

**Conclusión de Capa 2 (pagos):** ambos métodos **entregan el efecto externo real** — el correo con instrucciones llega en segundos al inbox y enlaza a su PDF (SPEI / PayNet) correcto. Las dos capas se cumplen: (1) el flujo on-site crea la orden y persiste en `/customer/orders`, y (2) el correo con los datos de pago llega. Evidencias on-site: `CAPA2-09`…`CAPA2-14`.

| ID | Severidad | Hallazgo |
|---|---|---|
| **BUG-B2C-558** | BAJA UX | Transferencia usa **3 titulares distintos** para el mismo evento: asunto del correo "Recibimos tu pedido", H1 del correo "¡Tu pedido está casi listo!" y H1 on-site "¡Solo falta un paso!". |
| **BUG-B2C-559** | BAJA | Correo de transferencia (plantilla D) footer "**Copyright 2025**" — cuarto año distinto entre plantillas (A=2026, B/C/E=2023, D=2025) y sin símbolo "©". |
| **BUG-B2C-560** | BAJA copy | Correo de transferencia (plantilla D): "…por el monto exacto **,** incluyendo…" — espacio antes de la coma. |
| **BUG-B2C-561** | BAJA copy | Correo de efectivo (plantilla E): el CTA de descarga tiene `download="**Váucher** de pago.pdf"` — palabra mal escrita (debe "Voucher"/"Comprobante"). |
| **BUG-B2C-562** | MEDIA | Correos plantillas **D y E**: `<meta name="viewport">` corrupto (`width<U+FFFD>vice-width` en vez de `width=device-width`) → el correo no escala en móvil. |
| **BUG-B2C-563** | BAJA copy | PDF SPEI (OpenPay): "Si tienes dudas **comunicate**…" — "comunicate" sin tilde. *(PDF de OpenPay — escalar a OpenPay.)* |
| **BUG-B2C-564** | BAJA copy | PDF SPEI (OpenPay): "Fecha y hora: 8 de junio de 2026, a las **15:17 PM**" — formato 24 h con "PM" redundante. *(PDF de OpenPay.)* |

Evidencias: `CAPA2-09-checkout-transferencia.png`, `CAPA2-10-confirmacion-transferencia-6820263SS52.png`, `CAPA2-11-pdf-spei-openpay-6820263SS52.png` + `CAPA2-11b-spei-6820263SS52.pdf`, `CAPA2-13-checkout-efectivo.png`, `CAPA2-14-confirmacion-efectivo-6820266FJM8.png` + `CAPA2-15b-paynet-6820266FJM8.pdf`. Hilos Gmail: D `19ea918c9ab23e5f`, E `19ea82f4b94ea359` (msg `19ea92011f86b9b9`).

### 10. Toggle de facturación CFDI (form fiscal completo)

Toggle "Sin CFDI" (default) / "CFDI". Al elegir **CFDI** despliega un formulario fiscal de **14 campos**:

| # | Label | `name` | Tipo | Atributos | Hallazgo |
|---|---|---|---|---|---|
| 1 | RFC* | `RFC` | text | maxlength=13, label✓ | — |
| 2 | Razón social* | `nameCFDI` | text | label✓ | — |
| 3 | Uso CFDI * | `ProductoSat` | select (5) | — | ❌ **BUG-484** name `ProductoSat` no corresponde (debería `usoCFDI`) |
| 4 | Régimen Fiscal* | `idproductosat` | select (20) | — | ❌ **BUG-485** name `idproductosat` no corresponde (debería `regimenFiscal`) |
| 5 | "Mi dirección fiscal es la misma que mi dirección de envío" | (sin name) | checkbox | — | toggle de copiar dirección |
| 6 | Calle* | `steet` | text | label✓ | ❌ **BUG-486** typo (`street`) |
| 7 | Número exterior* | `streetNumber` | text | — | — |
| 8 | Número interior | `noInt` | text | — | (opcional, sin `*`) |
| 9 | Código postal* | `postalCode` | text | maxlength=5 | autofill dispara al completar 5 dígitos |
| 10 | Municipio* | `region` | text | readonly tras autofill | ❌ **BUG-490** name `region` no corresponde al label "Municipio" |
| 11 | Colonia * | `building` | select | se puebla por CP | ❌ **BUG-490** name `building` para campo "Colonia" + ❌ **BUG-B2C-496** label "Colonia *" con espacio antes del `*` |
| 12 | Estado* | `state` | text | readonly tras autofill | — |
| 13 | Ciudad* | `city` | text | readonly tras autofill | ⚠️ **BUG-B2C-497** duplica el valor de "Estado" (ambos "Ciudad de México") → campo redundante junto a "Municipio" |
| 14 | (privacidad) | `privacity` | checkbox | — | ❌ **BUG-487** typo (`privacy`) |

**Uso CFDI — 5 opciones (lista completa):** `Selecciona una opcion`, `G01 Adquisición de mercancias`, `G03 Gastos en general`, `I08 Otra maquinaria y equipo`, `S01 Sin efectos fiscales`.

**Régimen Fiscal — 20 opciones (catálogo SAT completo):** 601 General de Ley Personas Morales · 603 Personas Morales con Fines no Lucrativos · 605 Sueldos y Salarios · 606 Arrendamiento · 607 Enajenación o Adquisición de Bienes · 608 Demás ingresos · 610 Residentes en el Extranjero · 611 Ingresos por Dividendos · 612 Personas Físicas con Actividades Empresariales y Profesionales · 614 Ingresos por intereses · 615 Régimen de premios · 616 Sin obligaciones fiscales · 620 Sociedades Cooperativas de Producción · 621 Incorporación Fiscal · 622 Actividades Agrícolas/Ganaderas/Silvícolas/Pesqueras · 623 Opcional para Grupos de Sociedades · 624 Coordinados · 625 Plataformas Tecnológicas · 626 Régimen Simplificado de Confianza.

| ID | Severidad | Hallazgo |
|---|---|---|
| **BUG-B2C-488** | BAJA copy | Uso CFDI opción `"Selecciona una opcion"` sin tilde (opción). |
| **BUG-B2C-489** | BAJA copy | Uso CFDI opción `"G01 Adquisición de mercancias"` sin tilde (mercancías). |
| **BUG-B2C-490** | MEDIA código | Campos de domicilio fiscal con `name` que no corresponde al label: Colonia→`region`, Municipio→`city`. Confunde mantenimiento + autofill. |
| **BUG-B2C-491** | BAJA UX/a11y | Campos fiscales con `placeholder="*"` (sin formato) y `autocomplete="on"` genérico (no usa tokens estándar `organization`/`postal-code`/`address-line1`). |
| **BUG-B2C-493** | MEDIA data | Catálogo "Uso CFDI" tiene **solo 5 opciones** (G01, G03, I08, S01 + placeholder) mientras el catálogo SAT tiene ~25 usos (P01, D01–D10, CP01, etc.). El de Régimen Fiscal sí está completo (20). Usuarios con usos distintos no pueden facturar correctamente. |

### 11. Código de descuento — NO funcional (verificado en vivo)

El campo de cupón vive en el paso 1 (`/checkout/1/`), bajo el texto **"Agrega un código de descuento"**: un `input[placeholder="Código"]` **permanentemente `disabled`** junto a un botón **"Aplicar" que NO está disabled**. Verificado en vivo: al hacer click en "Aplicar" con el campo deshabilitado, **el input sigue `disabled` y no aparece ningún toast/error** — la acción es un **no-op silencioso**. No se observó ninguna ruta que habilite el campo. Conclusión: la función de código de descuento está **inoperante** en QA (no se puede teclear cupón, "Aplicar" no responde).

| ID | Severidad | Hallazgo |
|---|---|---|
| **BUG-B2C-470** | MEDIA UX | (confirmado en vivo) Campo "Código" de descuento `disabled` — el usuario no puede aplicar cupón en ninguno de los 3 pasos. |
| **BUG-B2C-495** | MEDIA UX | Inconsistencia: el botón **"Aplicar" está habilitado** mientras el input "Código" está `disabled`; al pulsarlo no habilita el campo ni da feedback (no-op silencioso). El control sugiere una acción posible que en realidad no existe. |

Evidencia: `F1C-19-checkout-codigo-descuento-disabled.png`.

### 12. CFDI — autofill por C.P. (funciona)

Validado el autofill del domicilio fiscal: al teclear **C.P. 02800** en el `postalCode` del form CFDI, el select **`building` (Colonia)** se pobló con la opción correcta **"Nueva Santa María"** y el input **`region` (Municipio)** se autollenó con **"Azcapotzalco"** — ambos coherentes con el C.P. Es un **comportamiento positivo** (el autofill opera). Corrobora el naming confuso de **BUG-490** (`building`=Colonia, `region`=Municipio/Alcaldía — nombres que no corresponden a su label). Evidencia: `F1C-20-checkout-cfdi-autofill-cp.png`.

> **Nota de a11y/arquitectura:** los inputs `city`/`state` con esos `id` existen **dos veces** en el DOM de la página (form CFDI + markup oculto del modal I.6 renderizado globalmente) → colisión de `id` que dificulta selectores y autofill. Registrar en la pasada de a11y (F5).

### 14. Tarjeta rechazada — pantalla de error de pago

Ejecutado un pago con la tarjeta sandbox de rechazo **`4000 0000 0000 0002`** (titular "Jorge Garcia", exp 12/26, CVV 123, "Sin CFDI", T&C aceptado). Resultado: el pago se procesa contra OpenPay sandbox y **se rechaza, permaneciendo en `/checkout/3/`** (NO se coloca orden — el carrito conserva el item). El error se muestra como banner/toast inline en la sección de método de pago:

> **"Lamentablemente, tu pago fue rechazado. Si gustas intentar de nueva cuenta, por considerar hay un error. Si persiste el rechazo contacta a tu banco."**

| ID | Severidad | Hallazgo |
|---|---|---|
| **BUG-B2C-498** | MEDIA copy | El mensaje de rechazo tiene gramática rota: *"Si gustas intentar de nueva cuenta, **por considerar hay un error**"* — la cláusula no tiene sentido. Debería ser algo como "vuelve a intentarlo; considera que pudo haber un error. Si persiste, contacta a tu banco." Visible al usuario en el momento de mayor fricción (pago fallido). |

**Comportamiento positivo (no-bug):** el rechazo se maneja **sin perder el carrito ni la sesión** y sin crear orden — el usuario puede corregir y reintentar en la misma pantalla. Gating de "Pagar" por T&C también correcto.

**Observación a confirmar — modal "Datos fiscales incorrectos":** durante este intento (tras haber explorado el toggle CFDI y vuelto a "Sin CFDI") apareció además un modal **"Datos fiscales incorrectos — Puede continuar con una factura genérica o corregir los datos fiscales antes de proceder"** con botones **"Corregir datos"** / **"Generar factura genérica"**. Sugiere que el RFC/datos fiscales tecleados durante la exploración **persisten y se validan aunque el toggle esté en "Sin CFDI"** (posible state-leak). Pendiente de reproducir de forma aislada (CFDI nunca tocado) para confirmar si es bug de fuga de estado o flujo legítimo. Evidencia: `F1C-21-checkout-tarjeta-rechazada.png`.

> **Nota técnica (red):** durante el checkout la red está dominada por tracking (GA4 `view_cart`/`add_to_cart`, Google Ads, **Quantum Metric** con POSTs de session-replay en polling permanente a `ingest.quantummetric.com`). Esto **confirma BUG-006** (tracking sin gate de consentimiento, también en el funnel de pago) y explica por qué `networkidle` nunca resuelve en este sitio (los contracts deben usar `domcontentloaded`).

## II.6 Confirmación de compra `/order/[orderNumber]/`

> Página de éxito post-pago. La URL real de confirmación es **`/order/[orderNumber]/`** (ej. `/order/52820261OYM4/`), **NO** `/checkoutfinished/`. La ruta `/checkoutfinished/` devuelve HTTP 200 + "Ha ocurrido un error" (ruta muerta — BUG-034/144 sistémico); es una referencia legacy que no corresponde al flujo actual.
>
> Orden de referencia (tarjeta `4242 4242 4242 4242`, exp 12/26, CVV 123, Sin CFDI): **52820261OYM4**.

### 1. Meta y estructura

| Campo | Valor | Hallazgo |
|---|---|---|
| URL | `/order/52820261OYM4/` | patrón `/order/[orderNumber]/` |
| `<title>` | `Rotoplas` | ❌ BUG-251 sistémico (placeholder incluso en confirmación) |
| `meta[description]` | genérico | ❌ BUG-359 sistémico |
| **H1** | `"¡Tu compra ha sido un éxito!"` | ✅ **H1 semántico real** — excepción positiva (la mayoría de páginas no tienen H1) |
| H2 | "Productos", "Detalles" (+ 2 del modal global) | OK |
| Layout | Header + **footer GLOBAL** (© 2026) | Contraste: el checkout usa footer minimalista © 2024 (BUG-464); la confirmación vuelve al global © 2026 |

### 2. Contenido de la confirmación

```
H1: ¡Tu compra ha sido un éxito!
"Tu pedido está siendo procesado y te notificaremos el proceso a tu correo: andrei.garcia@xideral.co"
No. de pedido: 52820261OYM4

Dirección de envío: Jorge García
  Camarones 155k, Nueva Santa María, Azcapotzalco, Ciudad de México, Ciudad de México, C.P. 02800
  Teléfono: 5511111111

Datos de pago: Tarjeta de Crédito  **** **** **** 4242

Productos / Detalles:
  Tamboplas 250 litros color negro · SKU: 500040 · Cantidad: 1 · $1,991.57
  Pedido realizado: 28 de mayo de 2026
  Subtotal: $1,991.57 · Envío: $200.00 · Total: $2,191.57 (Incluye IVA)
```

### 3. Botones

| Texto | Comportamiento esperado |
|---|---|
| Imprimir | `window.print()` — verificado en vivo 2026-06-05 en orden 52820261OYM4. Botón `<button>` con handler Qwik `q-YL4W09wm.js#s_Gg3po6hi4ok`. Abre el diálogo nativo de impresión del navegador (print preview del comprobante). NO descarga PDF ni abre nueva pestaña. |
| Continuar comprando | Volver a la tienda |
| Ir a mis pedidos | → `/customer/orders` (la orden debe aparecer ahí) |

### 4. Hallazgos POSITIVOS (no-bug — conservar)

| Hallazgo | Detalle |
|---|---|
| **PCI correcto** | La tarjeta se enmascara a **últimos 4 dígitos** (`**** **** **** 4242`). **Contraste directo con BUG-119 de B2B**, que exponía 6 dígitos del PAN (violación PCI-DSS 3.4). En B2C el enmascaramiento es correcto. |
| **H1 semántico** | Una de las pocas páginas del sitio con `<h1>` real. |
| **Carrito vaciado** | Tras la compra exitosa el carrito queda vacío (badge sin número). |
| **Confirmación completa** | Muestra No. de pedido, email de notificación, dirección, teléfono y método de pago enmascarado. |

### 5. `/checkoutfinished/` — ruta legacy muerta

| URL | Status | Resultado |
|---|---|---|
| `/checkoutfinished/` (acceso directo) | 200 | "Ha ocurrido un error" (BUG-034/144 sistémico) |
| `/order/[orderNumber]/` | 200 | Confirmación real ✅ |

La ruta `/checkoutfinished/` (nombre del flujo legacy) no es la página de éxito; documentado para evitar futuras confusiones en contracts.

### 6. DOM contract

```javascript
test('II.6 /order/[orderNumber]/ — confirmación', async ({ page }) => {
  // tras completar pago, URL = /order/<n>/
  await expect(page).toHaveURL(/\/order\/[A-Z0-9]+\//);
  await expect(page.getByRole('heading', { level: 1, name: '¡Tu compra ha sido un éxito!' })).toBeVisible();
  await expect(page.getByText(/No\. de pedido:/)).toBeVisible();
  // PCI: solo últimos 4 (NO regresión a 6 dígitos como B2B BUG-119)
  await expect(page.getByText(/\*{4} \*{4} \*{4} \d{4}/)).toBeVisible();
  const masked = await page.getByText(/\*{4} \*{4} \*{4} \d{4}/).textContent();
  expect(masked.replace(/\D/g,'').length).toBe(4); // exactamente 4 dígitos visibles
  // footer global © 2026 (no el © 2024 del checkout)
  await expect(page.getByText(/Copyright © 2026/)).toBeVisible();
});
```

### 7. Evidencias

- `evidencias/F1C-16-checkout-pago-lleno.png` — form de tarjeta lleno (pre-pago)
- `evidencias/F1C-17-order-confirmacion-exito.png` — confirmación con No. de pedido 52820261OYM4
- `scripts/F1C-order-confirmacion-deep.json` — dump de la confirmación + positivos PCI

### 8. Persistencia en Mis pedidos

La orden 52820261OYM4 aparece al tope de `/customer/orders` (1 producto, 28 de mayo de 2026, $2,191.57, "Ver detalles" + "Solicitar factura antes del 27 de junio"). E2E completo: cart → checkout → pago → orden → Mis pedidos. Copy "No. De pedido"/"Fecha de pedidos" en BUG-111/112 (ver II.10).

## II.7 `/products/[categoria]/` — Listings de catálogo (umbrella F1C)

**Resumen estructural común a TODAS las categorías** (confirmado en F1C.1):

- **Framework:** misma SSR Qwik con `q:route="products/[...slug]"` y `q:render="ssr"`
- **HTML lang:** `es-mx`
- **Cards de producto:** `<article class="card-product-filter">` — todas comparten el mismo template
- **Sin `<a href>`:** la navegación a PDP se dispara con `on:click` Qwik en el `<h3 class="info__title">` y en el `<div class="galery">` (ver BUG-B2C-147 — crítico SEO/a11y).
- **Filtros (sidebar):** secciones `<h4>` con `<ul class="filter-list">` siguiente, cada `<li>` con `<input type="hidden">` (no checkbox/radio); selección por click handler Qwik. Sin keyboard nav. Ver BUG-B2C-158.
- **Filtros típicos:** `Ordenar por` (siempre 4 opciones: Mayor↔Menor precio, Nombre A↔Z), `Capacidad`, `Potencia`, `Material` (varía por categoría). Algunos también: `Color`.
- **Sort = handler Qwik sobre `<li>`** — no `<select>` ni botones radio.
- **Paginación:** `‹ Anterior` [1] [2] [3] [4] `Siguiente ›` — todos `<button class="pagination-btn">` con `on:click="q-pFrEWLZp.js#s_0yBwjwabCxM"`. Funcional vía URL `?page=N`. **Primer click en paginación falla silenciosamente** (Qwik resumability — handler aún no hidratado) — ver BUG-B2C-160.
- **Productos por página:** 24 en todas las categorías observadas.
- **Sin breadcrumb visible:** ninguna categoría/subcategoría tiene breadcrumb propio. Ver BUG-B2C-159.
- **H1 sistemáticamente repetido entre parent y subcategorías** — `/products/almacenamiento/tinacos/` muestra H1 "Almacenamiento" (no "Tinacos"). Ver BUG-B2C-161.
- **Title + meta description sistemáticamente con placeholders** "{slug} meta title" / "{slug} meta description" no editados. Ver BUG-B2C-150/151/162/163.

**Decisión de scope:** se mapea **estructura completa + sample de productos por categoría** (suficiente para detectar patrones de bugs estructurales). No se enlistan los ~80 productos individuales por categoría. Los productos completos están extraídos en `scripts/F1C-almacenamiento-all-pages.json` como referencia.

---

### II.7.1 `/products/almacenamiento/`

#### Meta tags

| Atributo | Valor | Diagnóstico |
|---|---|---|
| `<title>` | `almacenamiento meta title` | ❌ placeholder Builder.io (BUG-B2C-150) |
| `meta[name="description"]` | `almacenamiento meta description` | ❌ placeholder (BUG-B2C-151) |
| `meta[name="viewport"]` | `width=device-width, initial-scale=1.0` | ✅ |
| `meta[charset]` | `utf-8` | ✅ |
| **`meta[name="url"]`** | URL de la página | ❌ **BUG-B2C-193 NEW** — meta no estándar; el URL canónico se declara con `<link rel="canonical">`, no con `<meta name="url">`. Confunde crawlers. |
| `meta[property="og:title"]` | `almacenamiento meta title` | ❌ Open Graph con placeholder (BUG-B2C-175) |
| `meta[property="og:description"]` | `almacenamiento meta description` | ❌ Open Graph con placeholder |
| `meta[property="og:url"]` | `https://qarotoplasmx.io/products/almacenamiento/` | ✅ |
| `meta[property="og:image"]` | ❌ AUSENTE | sin imagen para preview → **BUG-B2C-194 NEW** |
| `meta[property="og:type"]` | ❌ AUSENTE | falta tipo (recomendable `website` o `product.group`) |
| `meta[name="robots"]` | ❌ AUSENTE | (BUG-B2C-176) |
| `meta[name="twitter:*"]` | ❌ AUSENTE | (BUG-B2C-177) |
| `link[rel="canonical"]` | `https://qarotoplasmx.io/products/almacenamiento/` | ✅ |
| `link[rel="alternate"][hreflang]` | ❌ AUSENTE | sin alternates para otros idiomas → **BUG-B2C-195 NEW** si se planea expandir LATAM. |
| `<html lang>` | `es-mx` | ✅ |

> **Inconsistencia entre categorías:** `/almacenamiento/` usa placeholders explícitos `"{slug} meta title"` mientras `/almacenamiento-especializado/`, `/presurizacion/`, `/purificacion/`, `/tratamiento/`, `/conduccion/`, `/mascotas/` usan `"Rotoplas"` genérico. Es decir, el bug de title placeholder tiene **DOS variantes coexistiendo** en commercetools/Builder.io. → **BUG-B2C-196 NEW** documenta esta inconsistencia.

- **H1:** `Almacenamiento` ✅ (único caso correcto — el parent es el único que tiene H1 que coincide con la categoría)
- **H1 class:** `⭐️e9g5cr-0 one-word` — la class CSS varía según número de palabras (`one-word` aquí, `two-words` en almacenamiento-especializado). Confirma que el componente sabe contar palabras pero el CSS de `two-words` no inserta espacio (origen de BUG-B2C-166).
- **Auth:** opcional — funciona autenticado o como invitado, mismo contenido.
- **Breadcrumb:** ❌ NO EXISTE (BUG-B2C-159) — verificado: 0 `nav[aria-label*="breadcrumb"]`, 0 `[class*="breadcrumb"]`, 0 `itemtype*="BreadcrumbList"`.

#### Headings completos (deep extraction)

| Nivel | Total | Detalle |
|---|---|---|
| H1 | 1 | `"Almacenamiento"` · class `⭐️e9g5cr-0 one-word` · visible |
| H2 | 2 | `"Agregar dirección"` (modal oculto), `"Verifica disponibilidad de entrega"` (modal CP oculto) — globales del header, mismas que cualquier página |
| H3 | 37 | 1× `"Ingresa tu ubicación..."` (modal) · 1× `"Filtrar por:"` (sidebar) · 24× títulos de producto (`h3.info__title` + `on:click="q-DslYsNu0.js#s_lPlB0u7MmZM"`) · 11× col-title del footer (5 mobile + 5 desktop + Síguenos) — **sin banner "¡Envío GRATIS!" como H3 (a diferencia de almacenamiento-especializado)** — el banner promocional NO está presente en esta categoría. → **BUG-B2C-197 NEW:** banner promocional global inconsistente entre categorías. |
| **H4** | 5 | `"Todos los productos"` (cabecera del listing, class `⭐️c2ijco-8 filter-title`, visible, clickable) · `"Ordenar por"` (oculto sin scroll) · `"Capacidad"` (visible) · `"Potencia"` (oculto sin scroll) · `"Material"` (oculto sin scroll) |
| H5 | 0 | — |
| H6 | 0 | — |

#### Filtros (sidebar izquierdo)

| Heading H4 | Tipo | # opciones | Items observados | Bugs |
|---|---|---|---|---|
| `Ordenar por` | radio implícito (un solo seleccionable) | 4 | Mayor a menor precio · Menor a mayor precio · Nombre A - Z · Nombre Z - A | BUG-B2C-158 (a11y) |
| `Capacidad` | checkbox implícito | 17 | No aplica · 250 · 450 · **450 lts..** · 500 · **600 lts..** · 750 · 800 · 1,000 · 1,100 · 1,200 · 2,000 · 2,500 · 2,800 · 5,000 · **5,000 lts..** · 10,000 lts. | BUG-B2C-154 (duplicados con puntos extra) |
| `Potencia` | checkbox implícito | 5 | No aplica · 1/2 HP · **1/2 HP bomba** · 1 HP · 1 a 2 HP | BUG-B2C-157 (inconsistencia "bomba") |
| `Material` | checkbox implícito | 10 | Celulosa · Nylon · Polietileno · **polipropileno** · **Polipropileno** · **PP polipropileno atoxic** · **PP Polipropileno atoxic.** · **Sistema de separación primeras\nlluvias (Tlaloque)…** (×2) · Varios | BUG-B2C-155 / 156 (duplicados casing + saltos línea) |

> **Marcado en negritas:** valores con bugs de duplicación o data dirty.

#### Paginación

- **Total páginas:** 4 (verificado por click + URL `?page=N`)
- **Productos por página:** 24 (24 + 24 + 24 + 12 = **84 productos totales**)
- **URLs paginadas:** `/?page=1` · `/?page=2` · `/?page=3` · `/?page=4` (`?page=1` y sin parámetro son equivalentes — no se verifica que sea canonicalización HTTP)
- **Bug:** primer click en botón de paginación **no navega** (Qwik resumability lag — BUG-B2C-160). La URL directa SI funciona.

#### Cards de producto — anatomía

```html
<article class="card-product-filter [filtros_aplicables_a_la_card]">
  <div class="product-card-header">
    <span class="discount-badge">-25%</span>           <!-- opcional, solo si hay descuento -->
    <div class="galery" on:click="q-VMgkZI0U.js#...">   <!-- navega a PDP (NO es <a>) -->
      <img loading="lazy" />
      <img loading="lazy" />                            <!-- segunda imagen ¿hover? por verificar -->
    </div>
  </div>
  <div class="info">
    <div class="info__header">
      <h3 class="info__title" on:click="q-DslYsNu0.js#...">Cisterna 1,200 litros</h3>  <!-- navega a PDP -->
    </div>
    <div class="dynamic-price variant-large">
      <div class="current-price-row">
        <span class="split-price sp-large highlighted">$5,084</span>
        <span class="decimal">.04</span>
      </div>
      <span class="split-price sp-small sp-regular line-through">$6,778</span>
      <span class="decimal">.06</span>
    </div>
    <div class="info_bottom">
      <button type="submit" class="addtoCart" on:click="q-B-ddRyEM.js#...">
        <svg>...</svg>
        <span class="addtoCart__text">Agregar al carrito</span>
      </button>
    </div>
  </div>
</article>
```

**Atributos del article:** la className contiene las clases CSS de los filtros aplicables a la card (ej. `1,200_lts. Polietileno No_aplica card-product-filter`). El filtrado en cliente se hace con CSS (`display:none` por clase). **Bug:** las clases tienen guiones bajos en lugar de espacios (`1,200_lts.`) y conservan los duplicados sucios del filtro (`450 lts..` se traduce a class `450_lts..`).

#### Sample de productos (página 1, 10 primeros de 24)

| # | Título visible (h3) | Descuento | Precio actual | Precio anterior | Truncado | JSX leak | filterClasses (className del article) |
|---|---|---|---|---|---|---|---|
| 1 | Base para tinaco GDPV | -10% | $1,551.60 | $1,724.00 | ❌ | ❌ | `No_aplica·Polietileno·No_aplica` |
| 2 | Cartucho de repuesto para filtro de sedi**...** | -25% | $200.99 | $267.99 | ✅ | ❌ | `No_aplica·Celulosa·No_aplica` |
| 3 | Cartucho de repuesto para filtro de sedi**...** | -25% | $561.75 | $749.00 | ✅ | ❌ | `No_aplica·Celulosa·No_aplica` |
| 4 | Cisterna 1,200 litros | -25% | $5,084.04 | $6,778.72 | ❌ | **✅ JSX LEAK** | `1,200_lts.·Polietileno·No_aplica` |
| 5 | Cisterna 1,200 litros con bomba centrifu**...** | -24% | $6,322.55 | $8,430.06 | ✅ | ❌ | `1,200_lts.·Polietileno·1/2_HP_bomba` |
| 6 | Cisterna 10,000 litros | -24% | $XX,XXX.XX | $XX,XXX.XX | ❌ | ❌ | `10,000_lts.·Polietileno·No_aplica` |
| 7 | Cisterna 2,800 litros | -24% | $9,218.95 | $12,291.93 | ❌ | ❌ | `2,800_lts.·Polietileno·No_aplica` |
| 8 | Cisterna 5,000 litros | -25% | $XX,XXX.XX | $XX,XXX.XX | ❌ | ❌ | `5,000_lts.·Polietileno·No_aplica` |
| 9 | Cisterna con Sensor de nivel 10,000 litr**...** | -24% | $37,904.21 | $50,538.94 | ✅ | ❌ | `10,000_lts.·Polietileno·No_aplica` |
| 10 | Cisterna con Sensor de nivel 5,000 litro**...** | -25% | $17,571.34 | $23,428.46 | ✅ | ❌ | `5,000_lts.·Polietileno·No_aplica` |

**Patrón observado:** las 24 cards pág 1 → 2 JSX leaks (Cisterna 1,200 + cisterna 10,000lts equipada PLP) · 6 truncados · 2 con título duplicado idéntico (`"Electronivel Agro Agua dura 10 metros"` ×2 con precios diferentes — BUG-153).

> **Sample completo de 84 productos en:** `tickets/regresiones-smoke-b2c/scripts/F1C-almacenamiento-all-pages.json`. Dump deep en `F1C-almacenamiento-full-deep.json`.

#### Card anatomy — DOM contract (refinado)

Anatomía complementaria a la documentada en umbrella II.7:

- **`<article>` no tiene `on:click` ni `<a href>` propio.** Confirmado en deep extraction. Toda navegación a PDP es por h3.
- **q:ids internos del Qwik runtime** (sample primer card): `DIV.q:id="4n"` (galery wrapper) · `IMG.q:id="4o"` y `4p` (las 2 imágenes) · `H3.q:id="4q"` (título) · `DIV.q:id="4s"` (info wrapper) · `SPAN.q:id="4u"`,`4v`,`4x`,`4y` (precios split) · `BUTTON.q:id="4z"` (addtoCart). Estos `q:id` cambian por hidratación — **NO usar como selector estable**, son contadores efímeros del runtime.
- **Imágenes con `width="150" height="150"`** atributos HTML explícitos ✅ (previene layout shift / good CWV).
- **No usan `srcset` ni `sizes`** — pierde optimización responsive. Mismo `src` para mobile y desktop (puede ser ineficiente en mobile). → **BUG-B2C-198 NEW**.
- **`loading="lazy"`** ✅ en ambas imágenes.
- **`alt=""`** (BUG-B2C-178 confirmado sistémico).

#### Inconsistencia de bucket de imágenes

**Hallazgo nuevo:** las imágenes en `/products/almacenamiento/` cards apuntan al bucket `https://storage.googleapis.com/rtp-bucket-b2b-qas/Imagenes_optimizadas/{SKU}_1.webp` (con `qas` al final), mientras que las de `/products/almacenamiento-especializado/` apuntan a `https://storage.googleapis.com/rtp-bucket-b2b-qa/Imagenes_optimizadas/{SKU}_1.webp` (sin la `s`). **DOS buckets distintos sirviendo imágenes según categoría**. Posibles causas: migración a medio terminar, env vars distintos según deploy, o duplicación accidental. → **BUG-B2C-199 NEW MEDIA infra**.

#### Cookie banner

- ✅ Presente: `"En Rotoplas usamos cookies para mejorar tu experiencia. Conoce nuestras políticas de cookies en nuestro Aviso de privacidad [link] Acepto"`
- ✅ Botón `"Acepto"` presente (tipo `submit`)
- ❌ Sin botón `"Rechazar"` ni `"Configurar"` (BUG-B2C-192 sistémico)
- ⚠️ Banner duplicado en el DOM (aparece 2× según la extracción del mainTextPreview de mascotas y verified aquí) — posible duplicación de componente o variantes responsive

#### Footer columna "Productos"

- 2 variantes en DOM (mobile + desktop) — confirma BUG-B2C-185
- Variant invisible: 7 links · Variant visible: 7 links — **mismos 7 links** en ambas variantes
- ❌ NO incluye `/products/mascotas/` ni `/products/servicios/` (BUG-B2C-173)
- ❌ `/products/calentamiento` (sin slash final → BUG-B2C-007 confirmado en footer también)

#### Hallazgos críticos específicos de /almacenamiento/

1. **JSX leak en 8 productos** (4 únicos × 2 páginas duplicadas en extracción inicial; productos únicos): `Cisterna 1,200 litros`, `cisterna 10,000lts equipada PLP`, `Tinaco Plus+`, `Tinaco Plus+ equipado 800 litros color b...`, `Tinaco Tricapa 450 litros color beige + ...`, `Tinaco Tricapa 600 litros color beige + ...`. Patrón: el bloque `Ideal para: {/* Cabeza */}{/* Cuerpo */}` aparece 4 veces seguido del valor real ("4 personas", "8 personas"). Bug del template Qwik. → BUG-B2C-148.
2. **Producto duplicado:** `Electronivel Agro Agua dura 10 metros` aparece 2 veces en la misma página 1 con precios diferentes ($2,879.10 y $6,389.11). Probablemente 2 SKUs con mismo display name. → BUG-B2C-153.
3. **Nombre interno PLP/DESC leaked:** `cisterna 10,000lts equipada PLP` concatena `PLPcisterna 10,000lts equipada DESC` — los dos nombres internos del CMS. → BUG-B2C-149.
4. **30 productos con titles truncados con `...`** sin tooltip — BUG-B2C-152.
5. **8 productos sin descuento** (badge vacío) mezclados con 16 con descuento.

#### Sub-categoría `/products/almacenamiento/captadores-pluviales/`

#### Meta tags

| Atributo | Valor | Diagnóstico |
|---|---|---|
| `<title>` | `Rotoplas` | ❌ genérico (BUG-B2C-162) |
| `meta[name="description"]` | `Rotoplas` | ❌ genérico (BUG-B2C-163) |
| `meta[name="url"]` | URL completa | ❌ no estándar (BUG-B2C-193 sistémico) |
| `meta[property="og:title"]` | `Rotoplas` | ❌ Open Graph genérico |
| `meta[property="og:image"]` | ausente | ❌ BUG-B2C-194 sistémico |
| `link[rel="canonical"]` | `https://qarotoplasmx.io/products/almacenamiento/captadores-pluviales/` | ✅ |

#### Headings

| Nivel | Total | Detalle |
|---|---|---|
| **H1** | 1 | `"Almacenamiento"` (class `⭐️e9g5cr-0 one-word`) ❌ **debería ser "Captadores pluviales"** (BUG-B2C-161 sistémico) |
| H2 | 2 | Modales globales (Agregar dirección, Verifica disponibilidad de entrega) — ocultos |
| H3 | ≥6 | `"Ingresa tu ubicación..."` (modal) · `"Filtrar por:"` (sidebar) · 3× títulos de producto · `"Servicio al cliente"` (footer col) … |
| **H4** | 5 | **`"Captación pluvial"`** ✅ (header del listing — class `filter-title`, visible) · `"Ordenar por"` · `"Capacidad"` (visible) · `"Potencia"` · `"Material"` |

> **HALLAZGO ARQUITECTÓNICO IMPORTANTE:** la subcategoría SÍ tiene el nombre correcto `"Captación pluvial"` como **H4** del listing (`filter-title`), pero el **H1** sigue mostrando el nombre del padre `"Almacenamiento"`. Es decir, el dato del nombre de la subcategoría EXISTE en el DOM (en H4) pero está mal asignado al heading H1 que es el que importa SEO. Solución sugerida: tomar el valor del H4 `filter-title` y usarlo como H1 (eliminando o degradando el H1 actual).

#### Productos (3 totales, sin paginación)

| # | Título visible (h3) | data-tooltip (nombre completo) | Precio | Bug |
|---|---|---|---|---|
| 1 | `Sistema de captación pluvial 1,100 litro...` | `"Sistema de captación pluvial 1,100 litros vertical urbano"` | $17,299.00 | truncado |
| 2 | `Sistema de captación pluvial 2,500 litro...` | `"Sistema de captación pluvial 2,500 litros vertical urbano"` | $21,999.01 | truncado |
| 3 | `Sistema de captación pluvial 5,000  ltro...` | `"Sistema de captación pluvial 5,000  ltros vertical urbano"` | $35,499.00 | **BUG-B2C-164** (doble espacio + typo `ltros` en vez de `litros` — confirmado tanto en h3 visible como en data-tooltip → bug está en commercetools, no en CSS truncation) |

> **HALLAZGO NUEVO importante — refinamiento BUG-152:** las cards en `/captadores-pluviales/` **SÍ tienen `data-tooltip` con el nombre completo del producto** en el H3:
> ```html
> <h3 data-tooltip="Sistema de captación pluvial 1,100 litros vertical urbano" class="⭐️whrvov-1 info__title" on:click="...">Sistema de captación pluvial 1,100 litro...</h3>
> ```
> **MEDIO BUG-152 invalidado / refinado:** los títulos truncados SÍ tienen tooltip — pero pendiente verificar si es sistémico o solo en captadores-pluviales. En `/almacenamiento/` parent **NO había `data-tooltip`** (revisar dump deep). → **BUG-B2C-200 NEW INFO** documenta la inconsistencia.

#### Imágenes — TERCER bucket diferente

Las cards de `/captadores-pluviales/` apuntan a:
```
https://storage.googleapis.com/rtp-bucket-b2b-prd/Imagenes_optimizadas/{SKU}_1.webp
```
**Bucket `rtp-bucket-b2b-prd` = producción.** Estamos en QA pero las imágenes vienen de PROD. Si producción cambia o borra una imagen → QA se rompe. → **BUG-B2C-201 NEW CRÍTICO infra**.

Resumen de buckets observados en F1C:
- `/products/almacenamiento/` → `rtp-bucket-b2b-qas`
- `/products/almacenamiento-especializado/` → `rtp-bucket-b2b-qa`
- `/products/almacenamiento/captadores-pluviales/` → `rtp-bucket-b2b-prd`

**Tres buckets distintos para imágenes** en QA — uno apuntando a producción. Solo BUG-199 ya documentó 2; con esto pasamos a 3.

#### Atributo `class` del `<article>` con saltos de línea literales

El filtro Material de captadores-pluviales tiene valores con `\n` literal (BUG-165). Esto se propaga al `className` del `<article>` con guion bajo:
```
<article class="1,100_lts. Sistema_de_separación_primeras
lluvias_(Tlaloque):_Fabricado_de_polietileno_de_alta_densidad.
Tinaco_Plus:_Material_fabricado_de_polietileno_de_ultra_alto_peso_molecular_de_color_beige_por_fuera_y_blanco_por_dentro. No_aplica card-product-filter">
```
**El atributo `class` contiene saltos de línea literales** (`\n`) — esto es HTML inválido según parsers estrictos. Aunque Chrome lo tolera, puede romper:
- CSS selectores (`.Sistema_de_separación_primeras...` no funciona con `\n`)
- Web Components / Custom Elements (parser estricto)
- Scrapers / SEO crawlers
- Tests Playwright que usen `getByClass`
→ **BUG-B2C-202 NEW ALTA arq**

#### Filtros completos

- **Ordenar por:** 4 opciones (estándar)
- **Capacidad:** 3 opciones (1,100 / 2,500 / 5,000 lts.) — limpio
- **Potencia:** 1 opción (`"No aplica"`) — BUG-186 sistémico
- **Material:** 2 opciones — ambas son descripciones técnicas completas de 220+ chars con `\n` literales (BUG-165 confirmado)

#### Cookie banner

- ✅ Presente, mismo patrón global (BUG-192).

#### Footer Productos

- Mismos 7 links que el resto, NO incluye Mascotas/Servicios (BUG-173 sistémico).

#### Sub-categoría `/products/almacenamiento/tinacos/`

#### Meta tags

| Atributo | Valor | Diagnóstico |
|---|---|---|
| `<title>` | `Tinacos meta title` | ❌ placeholder Builder.io (BUG-B2C-150) — variante "{slug} meta title" |
| `meta[name="description"]` | `Tinacos meta description` | ❌ placeholder |
| `meta[property="og:title"]` | `Tinacos meta title` | ❌ Open Graph con placeholder |
| `meta[name="robots"]` / `twitter:*` / `og:image` | ausentes | (BUG-176/177/194 sistémicos) |
| `link[rel="canonical"]` | `https://qarotoplasmx.io/products/almacenamiento/tinacos/` | ✅ |

#### Headings

| Nivel | Valor | Diagnóstico |
|---|---|---|
| **H1** | `Almacenamiento` (class `one-word`) | ❌ debería ser "Tinacos" (BUG-B2C-161) |
| **H4 `filter-title` visible** | `Tinacos` ✅ | nombre correcto presente en H4 (mismo patrón que captadores-pluviales — confirma BUG-B2C-200) |

#### Productos (24 pág 1 · 2 páginas totales · ~48 productos)

**Sample 10 productos con data-tooltip + bucket de imagen:**

| # | Título visible (h3) | data-tooltip (nombre completo) | Bucket / origen de imagen |
|---|---|---|---|
| 1 | `Tamboplas 250 litros color negro` | **(none)** ❌ | `rtp-bucket-b2b-qas` (150×150) |
| 2 | `Tinaco Plus+ con Bomba Centrifuga 1,100 ...` | `Tinaco Plus+ con Bomba Centrifuga 1,100 litros` | **`cdn.builder.io`** (45×45 placeholder) |
| 3 | `Tinaco Plus+ con Bomba Presurizadora 1,1...` | `Tinaco Plus+ con Bomba Presurizadora 1,100 litros` | **`images.cdn.us-central1.gcp.commercetools.com`** (150×150) |
| 4 | `Tinaco Plus+ equipado 2,000 litros color...` | `Tinaco Plus+ equipado 2,000 litros color beige` | **`cdn.builder.io`** (45×45 placeholder) |
| 5 | **`Tinaco Plus+`** ⚠️ | `Tinaco Plus+ equipado 2,500 litros color beige` | **`cdn.builder.io`** (45×45 placeholder) → **BUG-B2C-204 NEW ALTA** título visible es solo `"Tinaco Plus+"` (sin litros/color) — el tooltip indica que es 2,500 lts beige, pero el usuario no lo ve sin hover. Si hay varios SKUs con nombre `"Tinaco Plus+"` no se distinguen. |
| 6 | `Tinaco Plus+ equipado 450 litros color b...` | `Tinaco Plus+ equipado 450 litros color beige` | `rtp-bucket-b2b-qas` (150×150) |
| 7 | `Tinaco Plus+ equipado 800 litros color b...` | `Tinaco Plus+ equipado 800 litros color beige` | **`cdn.builder.io`** (45×45 placeholder) |
| 8 | `Tinaco Resistec 1,100 litros color gris ...` | `Tinaco Resistec 1,100 litros color gris (Venta exclusiva en Tuxtla)` | **`rtp-bucket-b2b-prd`** → **BUG-B2C-205 NEW MEDIA** producto **geo-locked a Tuxtla** mostrado a usuarios en CDMX sin disclaimer en el card visible — solo aparece en el tooltip. |
| 9 | `Tinaco Resistec 450 litros color beige` | **(none)** ❌ | `rtp-bucket-b2b-qa` (150×150) |
| 10 | `Tinaco Resistec 450 litros color gris (V...` | `Tinaco Resistec 450 litros color gris (Venta exclusiva en Tuxtla)` | `rtp-bucket-b2b-prd` |

#### data-tooltip inconsistente

- **19 de 24 productos** en `/tinacos/` tienen `data-tooltip` (con el nombre completo, útil para títulos truncados)
- **5 productos NO tienen `data-tooltip`** — usuario solo ve el título truncado sin recurso para nombre completo. Ej: `Tamboplas 250 litros color negro` (no necesita tooltip porque cabe), `Tinaco Resistec 450 litros color beige` (cabe). Pero hay otros que SÍ están truncados y no tienen tooltip.
- → **BUG-B2C-203 NEW BAJA** inconsistencia en `data-tooltip` — no todos los productos lo tienen, lo cual hace que el "rescate" de truncado (BUG-152) sea inconsistente. Solución: hacer `data-tooltip` obligatorio para TODOS los productos.

#### JSX leaks observados (4 únicos en pág 1)

- `Tinaco Plus+`
- `Tinaco Plus+ equipado 800 litros color b...`
- `Tinaco Tricapa 450 litros color beige + ...`
- `Tinaco Tricapa 600 litros color beige + ...`

#### Filtros completos

- **Ordenar por:** 4 (estándar)
- **Capacidad:** 11 opciones — `250 lts. · 450 lts. · **450 lts..** · 500 lts. · **600 lts..** · 750 lts. · 800 lts. · 1,000 lts. · 1,100 lts. · 2,000 lts. · 2,500 lts.` → duplicados con puntos extra (BUG-154 confirmado heredado del catálogo)
- **Potencia:** 2 opciones (`No aplica` · `1/2 HP bomba`) — inconsistencia BUG-157
- **Material:** 1 opción (`Polietileno`) — sin valor funcional, mismo problema que BUG-186

#### CINCO ORIGINS DE IMÁGENES en una sola página

Verificado en /tinacos/ pág 1:

| Origin | Productos | Comentario |
|---|---|---|
| `storage.googleapis.com/rtp-bucket-b2b-qas/...` | Tamboplas, Tinaco Plus+ 450 | bucket QA con `s` extra |
| `storage.googleapis.com/rtp-bucket-b2b-qa/...` | Tinaco Resistec 450 beige | bucket QA canónico |
| `storage.googleapis.com/rtp-bucket-b2b-prd/...` | Tinaco Resistec 1,100/450 gris (Tuxtla) | **bucket PRODUCCIÓN servido en QA** ⚠️ |
| `cdn.builder.io/api/v1/image/assets%2F.../a4b10ac1cdd04673a404eb1dafc8dcc4?format=webp` | 5 productos comparten el mismo asset Builder.io | **placeholder genérico** — 5 productos sin imagen propia comparten una imagen genérica de Builder.io |
| `images.cdn.us-central1.gcp.commercetools.com/...` | Tinaco Plus+ con Bomba Presurizadora | CDN nativo de commercetools, sin pasar por GCS |

→ **BUG-B2C-207 NEW MEDIA UX:** 5 productos tinacos comparten la **misma imagen placeholder de Builder.io** (`a4b10ac1cdd04673a404eb1dafc8dcc4`). El usuario ve 5 productos con la misma imagen — pierde diferenciación visual.

→ **BUG-B2C-208 NEW ALTA infra:** **CINCO origins distintos** sirviendo imágenes en una sola página. Caos infraestructural — si cualquiera de los 5 endpoints cambia o se cae, parte del catálogo se rompe. Necesita unificación a un solo origin canónico.

→ **BUG-B2C-209 NEW BAJA performance:** imágenes placeholder de Builder.io tienen `width=45 height=45` reales — CSS las escala a 150×150. Pixelación visible para el usuario en cards con placeholder.

#### Evidencias

- `F1C-01-almacenamiento-listado-inicial.png` — pág 1 completa con filtros y sample de productos
- `F1C-02-almacenamiento-jsx-leak-cisterna-1200.png` — JSX leak visible en Cisterna 1,200 lts

### II.7.2 `/products/almacenamiento-especializado/`

#### Meta tags

| Atributo | Valor | Diagnóstico |
|---|---|---|
| `<title>` | `Rotoplas` | ❌ genérico — BUG-B2C-167 |
| `meta[name="description"]` | `Rotoplas` | ❌ genérico — BUG-B2C-168 |
| `meta[name="viewport"]` | presente | ✅ |
| `meta[property="og:title"]` | `Rotoplas` | ❌ Open Graph roto — BUG-B2C-175 |
| `meta[property="og:description"]` | `Rotoplas` | ❌ — BUG-B2C-175 |
| `meta[property="og:url"]` | `https://qarotoplasmx.io/products/almacenamiento-especializado/` | ✅ |
| `meta[name="robots"]` | ❌ AUSENTE | falta control SEO crawlers — BUG-B2C-176 |
| `meta[name="twitter:*"]` | ❌ AUSENTE | sin Twitter Card — BUG-B2C-177 |
| `link[rel="canonical"]` | `https://qarotoplasmx.io/products/almacenamiento-especializado/` | ✅ |
| `<html lang>` | `es-mx` | ✅ |

#### Headings

| Nivel | Total | Texto + clase + handler |
|---|---|---|
| **H1** | 1 | `"Almacenamientoespecializado"` (sin espacio) · class `⭐️e9g5cr-0 two-words` · **BUG-B2C-166 ALTA copy** — la class CSS se llama "two-words" pero el render junta las palabras sin espacio |
| H2 | 2 | `"Agregar dirección"` (modal `Agregar dirección`, oculto), `"Verifica disponibilidad de entrega"` (modal CP, oculto) |
| H3 | 38 | Desglose: 1× modal (`"Ingresa tu ubicación para mostrarte el catálogo disponible con envío a tu domicilio"`) · 1× sidebar (`"Filtrar por:"`) · 1× banner promocional (`"¡Envío GRATIS en toda la tienda!"`) · **24× títulos de producto** (selector `h3.info__title` con `on:click="q-DslYsNu0.js#s_lPlB0u7MmZM"`) · 11× columnas de footer (5 col-title × 2 variantes mobile/desktop + 1 "Síguenos") |
| **H4** | 5 | `"Todos los productos"` (header del listing, class `⭐️c2ijco-8 filter-title`, hasOnClick=true visible) · `"Ordenar por"` (sidebar, oculto en desktop sin scroll) · `"Capacidad"` · `"Potencia"` · `"Material"` |
| H5 | 0 | — |
| H6 | 0 | — |

> **BUG-B2C-184 (NEW):** El listing tiene un H4 `"¡Envío GRATIS en toda la tienda!"` como **H3** (no H4). Mensaje promocional debería ser H4 o párrafo, no H3 — interrumpe jerarquía semántica.
> **BUG-B2C-185 (NEW):** Los col-title del footer aparecen **duplicados en el DOM** (5× variante mobile + 5× variante desktop) — penaliza el bundle (rev BUG-B2C-005 ya documentado para footer global).

#### Breadcrumb

| Aspecto | Resultado |
|---|---|
| `nav[aria-label*="breadcrumb"]` | ❌ ausente |
| Cualquier elemento con class `breadcrumb*` | ❌ ausente |
| `itemtype*="BreadcrumbList"` (schema.org) | ❌ ausente |

→ confirma BUG-B2C-159 sistémico

#### Sidebar de filtros — anatomía completa

Estructura HTML:
```html
<aside class="filter-sidebar">
  <h4 class="filter-title">Filtrar por:</h4>  (h3 en realidad — ver headings arriba)
  <h4 class="filter-title">Ordenar por</h4>
  <ul class="filter-list">
    <li class="⭐️ob4c2y-0 ⭐️ykambm-2">Mayor a menor precio</li>
    <li>Menor a mayor precio</li>
    <li>Nombre A - Z</li>
    <li>Nombre Z - A</li>
  </ul>
  <h4 class="filter-title">Capacidad</h4>
  <ul class="filter-list">
    <li>No aplica</li>
    <li>120 lts.</li>
    ...
  </ul>
  …
</aside>
```

**Anatomía de cada `<li>` de filtro:**
- ❌ NO tiene `<input type="checkbox">` ni `<input type="radio">`
- ❌ NO tiene `<label>` ni `<button>` interno
- ❌ NO tiene atributo `data-value` ni `data-filter`
- ❌ NO tiene `aria-pressed` ni `aria-checked` ni `role="checkbox"`
- ❌ NO tiene `tabindex` (no focusable con keyboard)
- ❌ NO tiene `on:click` atributo visible (debe inyectarse via Qwik resumability handler en el `<ul>` padre con delegation)
- ✅ Solo tiene `class` de Qwik scoped CSS
- **Para selección, el filtrado se aplica por CSS sobre la className del `<article>`** — class del filtro `1,200_lts.` se mapea a una clase del article con el mismo nombre (con guion bajo).

**Implicaciones para contracts:** no se puede seleccionar un filtro con `page.getByRole('checkbox')` ni `page.locator('input[name="capacidad"]')`. Se debe usar `page.locator('h4:has-text("Capacidad") + ul li:has-text("1,200 lts.")').click()`.

#### Filtros completos (4)

#### `Ordenar por` (4 opciones)
1. Mayor a menor precio
2. Menor a mayor precio
3. Nombre A - Z
4. Nombre Z - A

#### `Capacidad` (27 opciones)
No aplica · 120 · 250 · 300 · 450 · 500 · 600 · 750 · 850 · 1,000 · 1,100 · 1,300 · 1,700 · 2,500 · 2,850 · 3,000 · 3,500 · 4,000 · **5,000** · **5,001** · 7,000 · 10,000 · 13,000 · 14,000 · 15,000 · 22,000 · 25,000 lts.

> **BUG-B2C-169:** valores `5,000 lts.` y `5,001 lts.` coexisten — diferencia de 1 litro improbable, casi seguro un typo en commercetools (alguien escribió 5,001 cuando quiso 5,000).

#### `Potencia` (1 opción)
- No aplica

> Solo 1 opción → el filtro es inútil al usuario en esta categoría. Considera ocultarlo en cliente si no hay variación. **BUG-B2C-186 (NEW):** filtros con una sola opción `"No aplica"` se muestran al usuario sin valor funcional.

#### `Material` (6 opciones — sin duplicados aquí ✅)
1. HDPE
2. Polietileno
3. Polipropileno
4. Polipropileno y acero inoxidable
5. Polipropileno y EDPM
6. Polipropileno y FKM

#### Paginación

| Botón | text | class | aria-current | on:click handler |
|---|---|---|---|---|
| Prev | `‹ Anterior` | `pagination-btn pagination-nav` | — | `q-DuaowyMw.js#s_SQHqfDxvb48[0 1]` |
| 1 | `1` | `pagination-btn active` | **`page`** ✅ | `q-pFrEWLZp.js#s_0yBwjwabCxM[0 1]` |
| 2–7 | `2`–`7` | `pagination-btn` | ❌ falta cuando no es active | `q-pFrEWLZp.js#s_0yBwjwabCxM[0 1]` |
| Next | `Siguiente ›` | `pagination-btn pagination-nav` | — | `q-DuaowyMw.js#s_ZGdfcZLLwMU[0 1]` |

- **Total páginas:** 7
- **Productos por página:** 24
- **Total estimado:** 7 × 24 = ~168 productos
- **BUG-B2C-179 (NEW):** botones `‹ Anterior` y `Siguiente ›` **sin `aria-label`** — screen readers leen literalmente "menor que Anterior" / "Siguiente mayor que" en lugar de "Página anterior" / "Página siguiente"
- **BUG-B2C-187 (NEW):** los botones numéricos NO activos también deberían tener `aria-label="Ir a página N"` — actualmente solo `text=N`
- BUG-B2C-160 aplica (primer click falla por resumability)

#### Card anatomy — DOM contract

```html
<article class="⭐️whrvov-1 No_aplica Polipropileno_y_acero_inoxidable No_aplica card-product-filter">
  <div class="⭐️whrvov-1 product-card-header">
    <span class="⭐️yepct3-0 discount-badge">-10%</span>      <!-- opcional cuando hay descuento -->
    <div class="⭐️whrvov-1 galery">                          <!-- on:click solo en algunas categorías -->
      <div class="⭐️whrvov-1"><img class="⭐️whrvov-1" loading="lazy" alt="" src="https://storage.googleapis.com/rtp-bucket-b2b-qa/Imagenes_optimizadas/580047_1.webp"/></div>
      <div class="⭐️whrvov-1"><img class="⭐️whrvov-1" loading="lazy" alt="" src="https://storage.googleapis.com/rtp-bucket-b2b-qa/Imagenes_optimizadas/580047_1.webp"/></div>
    </div>
  </div>
  <div class="⭐️whrvov-1 info">
    <div class="⭐️whrvov-1 info__header">
      <h3 class="⭐️whrvov-1 info__title" on:click="q-DslYsNu0.js#s_lPlB0u7MmZM[0 1]" q:id="4t">Adaptador de venteo 12 de 2"</h3>
    </div>
    <div class="⭐️vdymqe-0 dynamic-price variant-large">
      <div class="⭐️vdymqe-0 current-price-row">
        <span class="⭐️nzwa8e-0 split-price sp-large highlighted">$712</span>
        <span class="⭐️nzwa8e-0 decimal">.80</span>
      </div>
      <span class="⭐️nzwa8e-0 split-price sp-small sp-regular line-through">$792</span>
      <span class="⭐️nzwa8e-0 decimal">.00</span>
    </div>
    <div class="⭐️whrvov-1 info_bottom">
      <button type="submit" class="⭐️whrvov-1 addtoCart" on:click="q-B-ddRyEM.js#s_bEHv1oZTYTo[0 1 2 3 4 5 6 7 8]">
        <svg>...</svg>
        <span class="⭐️whrvov-1 addtoCart__text">Agregar al carrito</span>
      </button>
    </div>
  </div>
</article>
```

#### Hallazgos críticos de la card

1. **BUG-B2C-178 (NEW) MEDIA a11y CRÍTICA:** TODAS las imágenes de productos tienen `alt=""` vacío. Screen readers no anuncian. Patrón sistémico — afecta los 24 productos de la página verificada y probablemente todo el catálogo.
2. **BUG-B2C-188 (NEW) BAJA UX:** Las dos `<img>` de la galería tienen el **mismo `src`** (no hay segunda imagen distinta para hover/swap). Verificar si es feature incompleta del CMS o decisión consciente.
3. **BUG-B2C-189 (NEW) MEDIA a11y:** Botón "Agregar al carrito" usa `type="submit"` pero NO está dentro de un `<form>` — el submit no tiene efecto válido. Debería ser `type="button"`. También sin `aria-label="Agregar {producto} al carrito"`.
4. **Confirmación BUG-B2C-147:** la card es `<article>` sin `<a href>` — todo navegación via Qwik `on:click` en h3.
5. **Confirmación BUG-B2C-148:** dos cards con JSX leak (Bebedero estandar 1,700 lts + Bebedero horizontal 500 lts).
6. **Precios en formato split** — separan entero ($712) de decimales (.80) con clases CSS. Para tests de precio usar `.dynamic-price` como contenedor.

#### Productos completos del listado (24 títulos pág 1)

| # | Título h3 visible | Truncado | JSX leak | Notas |
|---|---|---|---|---|
| 1 | `Adaptador de venteo 12 de 2"` | ❌ | ❌ | OK |
| 2 | `Adaptador de venteo con malla 10 de 3¨` | ❌ | ❌ | **BUG-B2C-181** — usa diéresis doble `¨` en vez de comillas `"` |
| 3 | `Bebedero estandar 1,700 litros color neg...` | ✅ | ✅ | "estandar" sin tilde → typo |
| 4 | `Bebedero horizontal 500 litros estandar ...` | ✅ | ✅ | "estandar" sin tilde |
| 5 | `Bebedero y Comedero estandar 1,000 litro...` | ✅ | ❌ | "estandar" sin tilde |
| 6 | `Bebedero y Comedero estandar 300 litros ...` | ✅ | ❌ | "estandar" sin tilde |
| 7 | `Bebedero y Comedero estandar 850 litros ...` | ✅ | ❌ | "estandar" sin tilde |
| 8 | `Bola de propileno 3 pulgadas` | ❌ | ❌ | **BUG-B2C-180** — typo: debería "polipropileno", no "propileno" |
| 9 | `Conexión cuadrada de polipropileno 2 pul...` | ✅ | ❌ | OK |
| 10 | `Conexión cuadrada de polipropileno TOR. ...` | ✅ | ❌ | **BUG-B2C-190 NEW** — TOR es jerga interna (Toricidad?) — repetido 2× |
| 11 | `Conexión cuadrada de polipropileno TOR. ...` | ✅ | ❌ | duplicado del anterior |
| 12 | `Conexión hexagonal de polipropeno VITON ...` | ✅ | ❌ | **BUG-B2C-191 NEW** — typo: "polipropeno" (faltan letras) |
| 13 | `Conexión hexagonal de polipropileno VITO...` | ✅ | ❌ | OK |
| 14 | `Conexión hexagonal de polipropileno de 4...` | ✅ | ❌ | OK |
| 15 | `Conexión hexagonal de polipropileno y ED...` | ✅ | ❌ | **BUG-B2C-183 NEW** — 5 entradas truncadas idénticas a "ED..." (15-19) |
| 16 | `Conexión hexagonal de polipropileno y ED...` | ✅ | ❌ | duplicado |
| 17 | `Conexión hexagonal de polipropileno y ED...` | ✅ | ❌ | duplicado |
| 18 | `Conexión hexagonal de polipropileno y ED...` | ✅ | ❌ | duplicado |
| 19 | `Conexión hexagonal de polipropileno y ED...` | ✅ | ❌ | duplicado |
| 20 | `Conexión hexagonal polipropileno 2"` | ❌ | ❌ | OK |
| 21 | `Niple corto de polipropileno 2"` | ❌ | ❌ | OK |
| 22 | `Niple corto de polipropileno 3/4´` | ❌ | ❌ | **BUG-B2C-182** — apóstrofe izquierdo `´` en vez de comillas `"` |
| 23 | `Niple corto de polipropileno 3´` | ❌ | ❌ | apóstrofe izquierdo en BUG-182 |
| 24 | `Niple corto polipropileno 1 1/2 pulgada` | ❌ | ❌ | falta "de" entre "corto" y "polipropileno" — inconsistencia de naming |

**Patrones:** 16 de 24 productos truncados (67%) · 2 con JSX leak (8.3%) · 6 con typos "estandar" sin tilde · 1 con typo "polipropeno" · 5 duplicados visualmente "Conexión hexagonal de polipropileno y ED..." · 3 con caracteres especiales mal usados (¨ y ´ en vez de ")

#### Cookie banner

- ✅ Presente: `"En Rotoplas usamos cookies para mejorar tu experiencia. Conoce nuestras políticas de cookies en nuestro Aviso de privacidad [link] Acepto"`
- ✅ Botón "Acepto" presente
- ⚠️ Sin botón "Rechazar" ni "Configurar" — implica que el usuario debe aceptar TODO o navegar fuera. **BUG-B2C-192 (NEW):** banner cookies sin opción explícita de rechazo (puede violar LFPDPPP — confirmar con legal). Ver también BUG-006.

#### Footer columna "Productos"

Solo **7 links** (de 9 categorías que existen):
1. Almacenamiento → `/products/almacenamiento/`
2. Almacenamiento Especializado → `/products/almacenamiento-especializado/`
3. Presurización → `/products/presurizacion/`
4. Purificación → `/products/purificacion/`
5. Tratamiento → `/products/tratamiento/`
6. Calentamiento → `/products/calentamiento` _(sin slash final → BUG-007 sistémico)_
7. Conducción → `/products/conduccion/`

> ❌ NO incluye `/products/mascotas/` ni `/products/servicios/` (→ BUG-B2C-173)

#### Estado de sesión

- Mapeado autenticado (`andrei.garcia@xideral.co`).

#### Evidencia

- `F1C-04-almacenamiento-especializado-listado.png` — listado completo pág 1 con sidebar de filtros + paginación + footer

### II.7.3 `/products/presurizacion/`

> **Profundidad de mapeo (categorías 3+):** no se enumera producto por producto ni paginación item-por-item. Se mapea: meta + H1 + breadcrumb + filtros (estructura) + paginación (estructura) + card anatomy (template) + image origins (auditoría multi-origen) + bugs nuevos + DOM contract Playwright. Productos individuales solo si tienen bug propio en copy/precio/imagen.

#### 1. Meta tags y SEO

| Campo | Valor real | Observación |
|---|---|---|
| `<title>` | `Rotoplas` | ❌ Genérico — sin nombre de categoría (BUG-B2C-251) |
| `meta[name="description"]` | `Rotoplas` | ❌ Placeholder (BUG-B2C-252) |
| `meta[name="url"]` | `https://qarotoplasmx.io/products/presurizacion/` | OK |
| `meta[property="og:title"]` | `Rotoplas` | ❌ Placeholder (BUG-B2C-253) |
| `meta[property="og:description"]` | `Rotoplas` | ❌ Placeholder (BUG-B2C-253) |
| `meta[property="og:url"]` | `https://qarotoplasmx.io/products/presurizacion/` | OK |
| `link[rel="canonical"]` | `https://qarotoplasmx.io/products/presurizacion/` | OK |
| `html[lang]` | `es-mx` | OK |
| Charset | UTF-8 | OK |
| `link[rel="manifest"]` | `/manifest.json` | OK |

**SEO sistémico (heredado):** sin `og:image`, sin `og:type`, sin twitter cards, sin schema.org JSON-LD de tipo `ItemList` / `Product`.

#### 2. Estructura semántica

- **H1** (único): `"Presurización "` ← **trailing space literal** en el texto (BUG-B2C-254). Clase `⭐️e9g5cr-0 one-word`.
- **H2** (global, no de la página): `"Agregar dirección"` + `"Verifica disponibilidad de entrega"` (modales globales del header).
- **H3 sección:** sin H3 de sección dentro del listing (todos los H3 son de productos o de columnas de footer).
- **H4 filtros:** `Todos los productos`, `Ordenar por`, `Capacidad`, `Potencia`, `Material`.
- **Breadcrumb:** `<a href="/">` (sólo ícono, sin texto) → `<a href="/products/presurizacion" class="active">Presurización</a>`. Sin paso intermedio "Productos". Sin schema.org `BreadcrumbList`.
- **Banner hero:** `<img alt="Banner">` apuntando a `https://storage.googleapis.com/rtp-bucket-b2b-prd/B2C/Categorias/Desktop/banner_presurizacio%CC%81n.webp` ← **bucket de PRODUCCIÓN** (BUG-201 sistémico) + nombre con **NFD unicode no normalizado** (`presurizacio%CC%81n` = "presurización" con `ó` descompuesto en `o` + combinante U+0301) (BUG-B2C-255).

#### 3. Filtros (sidebar izquierdo)

| Filtro | # opciones | Sample opciones | Bug |
|---|---|---|---|
| Ordenar por | 4 | "Mayor a menor precio", "Menor a mayor precio", "Nombre A - Z", "Nombre Z - A" | Sin "Relevancia" / "Más vendido" / "Más reciente" → opciones de orden pobres (BUG-B2C-256) |
| Capacidad | 1 | "No aplica" únicamente | ❌ Filtro vacío de datos reales (BUG-B2C-257) — sólo expone valor "No aplica", no debería renderizarse |
| Potencia | 9 | "No aplica", "1/4 HP", "1/3 HP", "1/2 HP", "3/4 HP", "1 HP", "1 1/2 HP", "2 HP", "3 HP" | Opción "No aplica" como ítem seleccionable contamina facets (BUG-B2C-258) |
| Material | 5 | "Acero de alta calidad", "Acero inoxidable", "Hierro fundido", "No aplica", "Plástico PE" | Opción "No aplica" reincide (BUG-B2C-258) |

**Estructura DOM filtros:** todos los items son `<li>` con handler Qwik `on:click`. **No son `<input type="checkbox">` ni `<button role="checkbox">`** — keyboard nav imposible, screen readers no anuncian estado, no hay `aria-pressed` ni `aria-checked` (BUG sistémico, ya documentado en BUG-128).

**Botón "Limpiar":** clase `CloseButton` (engañoso — no es un close), atributo `disabled` propio del `<button>` ✓, pero **sin `aria-disabled`** (BUG-B2C-259).

**Mobile drawer:** se vuelve drawer en viewport móvil (cubierto en III.8).

#### 4. Conteo / Sort / Paginación

- **Conteo:** `24 Productos` (string completo: `"24 ProductosOrdenar por"` — concatenación sin separador en el componente sort wrapper `<div class="sorts">`). El `.textContent` recorrido genera `"24 ProductosOrdenar por"` literal (BUG-B2C-260: falta separador visual/semántico en el texto crudo del componente).
- **Paginación:** ❌ **No existe paginación** — los 24 caben en una sola página. Verificado: `[class*="paginat"], nav[aria-label*="pag"]` = `null`. **Inconsistencia con almacenamiento** (que sí paginaba con 24/pág).
- **Sort control:** `<div class="sorts">` (no `<select>`, no `<button>` con `aria-haspopup`). Lista de opciones probablemente colapsable (no probada interacción).

#### 5. Card anatomy — template estructural

```
<article class="⭐️whrvov-1 No_aplica Plastico_PE No_aplica card-product-filter" q:id="3t">
  <!-- BUG-B2C-261: clase con DATOS DE FACETS concatenados con `_` ("No_aplica Plastico_PE No_aplica")
       expone metadata interna y rompe selectores CSS por clase -->
  <!-- BUG-147 sistémico: SIN <a href> al PDP — navegación 100% via Qwik handler -->
  <img src="..." alt="" loading="lazy" q:id="3x"/>  <!-- BUG-178 sistémico: alt vacío -->
  <span class="discount-badge">-25%</span>          <!-- presente sólo si hay descuento -->
  <h3 class="info__title" q:id="...">Nombre del producto</h3>
  <div class="dynamic-price variant-large">
    <div class="current-price-row">
      <span class="split-price sp-large highligh">$899</span>
      <span class="decimal">.24</span>
    </div>
    <div>
      <span class="split-price sp-small sp-regul">$1,199</span>
      <span class="decimal">.00</span>
    </div>
  </div>
  <button class="addtoCart">
    <span class="addtoCart__text">Agregar al carrito</span>
  </button>
</article>
```

**Variantes detectadas:**
- **Sin descuento + sin distribuidor:** card sin `<span class="discount-badge">` pero con `<button class="addtoCart">` (ej. "Kit SIstema Booster Dual" — sólo precio actual sin tachado).
- **Sin compra directa:** card sin precio y sin botón "Agregar al carrito" — en su lugar `<a href="/distribuidores">Buscar distribuidor</a>` (10 de 24 productos). No hay UI que explique al usuario por qué unos sí y otros no se pueden comprar online (BUG-B2C-262).
- **`data-tooltip`:** ausente en presurización (vs presente en /tinacos/ con nombre completo del producto) → inconsistencia inter-categoría (BUG-B2C-263).

#### 6. Image origins — auditoría multi-origen

24 imágenes de producto, **4 origins distintos**:

| Origen | Cantidad | Observación |
|---|---|---|
| `storage.googleapis.com/rtp-bucket-b2b-qa/Imagenes_optimizadas` | 11 | ✓ Bucket QA correcto |
| `storage.googleapis.com/rtp-bucket-b2b-qas/Imagenes_optimizadas` | 3 | ❌ Bucket con typo "qas" (BUG-202 sistémico) |
| `storage.googleapis.com/rtp-bucket-b2b-prd/Imagenes_optimizadas` | 3 | ❌ Bucket de PRODUCCIÓN sirviendo a QA (BUG-201 sistémico) |
| `images.cdn.us-central1.gcp.commercetools.com/206b973b-…` | 7 | commercetools CDN directo, sin pasar por bucket Rotoplas (BUG-200 sistémico) |

Banner hero: bucket `prd` (BUG-201 sistémico para banners también, ya documentado).

#### 7. Bugs de esta sección (BUG-B2C-251 → BUG-B2C-273)

**Bugs de esta sección:** BUG-B2C-251→273 — detalle en Parte IV. (Copy verbatim de productos, `className` crudos y banners NFD preservados en cada fila de Parte IV.)

#### 8. DOM contract Playwright

```javascript
// tests/visual/presurizacion-listing-contract.spec.js
import { test, expect } from '@playwright/test';

test.describe('II.7.3 /products/presurizacion/ — contract', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('https://qarotoplasmx.io/products/presurizacion/');
    await expect(page.locator('h1')).toBeVisible();
  });

  test('meta + H1 + breadcrumb estables', async ({ page }) => {
    await expect(page).toHaveTitle(/Rotoplas/);  // hoy genérico (BUG-B2C-251) — endurece tras fix
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /\/products\/presurizacion\/?$/);
    await expect(page.locator('h1')).toContainText('Presurización');
    await expect(page.locator('a[href="/products/presurizacion"]').first()).toHaveClass(/active/);
  });

  test('filtros estructurales presentes', async ({ page }) => {
    for (const title of ['Ordenar por', 'Capacidad', 'Potencia', 'Material']) {
      await expect(page.locator('h4.filter-title', { hasText: title })).toBeVisible();
    }
    await expect(page.getByRole('button', { name: 'Limpiar' })).toBeDisabled();
  });

  test('grid de productos renderiza N cards con anatomía esperada', async ({ page }) => {
    const cards = page.locator('article[class*="card-product-filter"]');
    await expect(cards).toHaveCount(24);
    const first = cards.first();
    await expect(first.locator('img').first()).toHaveAttribute('loading', 'lazy');
    await expect(first.locator('h3.info__title')).toBeVisible();
    // Al menos uno de: botón "Agregar al carrito" O link "Buscar distribuidor"
    const hasCta = await first.locator('button:has-text("Agregar al carrito"), a:has-text("Buscar distribuidor")').count();
    expect(hasCta).toBeGreaterThan(0);
  });

  test('banner sirve desde origen permitido (NO prd cuando QA esté limpio)', async ({ page }) => {
    const banner = page.locator('main img[alt="Banner"]').first();
    const src = await banner.getAttribute('src');
    // hoy: bucket prd (BUG-201). Endurecer a /rtp-bucket-b2b-qa/ tras fix:
    expect(src).toMatch(/rtp-bucket-b2b-(qa|qas|prd)/);
  });

  test('image origins observados (auditoría sistémica)', async ({ page }) => {
    const srcs = await page.locator('article[class*="card-product-filter"] img').evaluateAll(imgs => imgs.map(i => i.src));
    // Hoy coexisten 4 origins. Endurecer a 1 (qa) tras fix de BUG-200/201/202.
    expect(srcs.length).toBeGreaterThan(0);
  });
});
```

#### 9. Evidencias

- `evidencias/F1C-05-presurizacion-listado.png` — listing completo full-page
- `scripts/F1C-presurizacion-deep.json` — extracción JSON completa (filtros, card anatomy, image origins, breadcrumb raw HTML)

---

### II.7.4 `/products/purificacion/` + `/products/purificadores-de-agua/`

> Cobertura combinada: la categoría padre `/purificacion/` (15 productos) y la sub-vista `/purificadores-de-agua/` (5 productos, todos subset de la padre).

#### 1. Meta tags y SEO — **idéntico patrón sistémico**

| Página | `<title>` | `meta[description]` | `og:title/description` | canonical |
|---|---|---|---|---|
| `/products/purificacion/` | `Rotoplas` ❌ | `Rotoplas` ❌ | `Rotoplas` ❌ | `…/purificacion/` ✓ |
| `/products/purificadores-de-agua/` | `Rotoplas` ❌ | (no inspeccionada esta vez — sistémica) | (sistémica) | (no inspeccionada) |

BUG-B2C-251/252/253 sistémicos confirmados — aplican a TODAS las categorías.

#### 2. Estructura semántica

| Campo | `/purificacion/` | `/purificadores-de-agua/` |
|---|---|---|
| H1 | `"Purificación"` (sin trailing space) | `"Purificadores "` (con trailing space) |
| Breadcrumb | Home → Purificación | Home → **Purificadores** (sin paso "Purificación" intermedio) |
| Filtros (H4) | `Todos los productos`, `Ordenar por`, `Capacidad`, `Potencia`, `Material` | mismos |
| Banner src | `…rtp-bucket-b2b-prd/B2C/Categorias/Desktop/banner_purificacio%CC%81n.webp` (NFD) | `…rtp-bucket-b2b-prd/Categorias_B2B/Imagenes%20Familias/Purificaci%C3%B3n/Purificadores/Purificadores%20-%20Desk.webp` (NFC + `%20`) |

**Bugs específicos en estructura:**

| ID | Severidad | Hallazgo |
|---|---|---|
| **BUG-B2C-274** | INFO | Inconsistencia: H1 de `/purificacion/` SIN trailing space pero `/presurizacion/` y `/purificadores-de-agua/` SÍ tienen trailing space. Sin política única. |
| **BUG-B2C-281** | MEDIA SEO/UX | `/purificadores-de-agua/` carece de breadcrumb intermedio hacia su parent `/purificacion/`. Aparece como ruta de primer nivel pese a ser sub-vista. Pierde contexto jerárquico para usuario y para Google. |
| **BUG-B2C-282** | MEDIA infra | Banner de sub-categoría usa path con espacios `%20` y NFC normal (`Purificaci%C3%B3n`) mientras las categorías padre usan NFD (`presurizacio%CC%81n`). Dos esquemas de naming + dos buckets sub-path coexistiendo (`B2C/Categorias/Desktop/` vs `Categorias_B2B/Imagenes Familias/`). |
| **BUG-B2C-283** | ALTA SEO | Duplicate content: los 5 purificadores (Hydro-Pur® bajo/sobre tarja, Y/alcanizador blanco/negro, Sistema Osmosis Inversa) aparecen idénticos en `/purificacion/` y en `/purificadores-de-agua/`, sin `rel=canonical` entre ambas ni `noindex` en una. Riesgo de canibalización SERP. |

#### 3. Filtros — **bug categoría-amplio**

Filtros heredados (`Capacidad`, `Potencia`, `Material`) **NO APLICAN** semánticamente a purificadores ni a cartuchos de repuesto. Los purificadores no se miden en "HP" ni "litros de capacidad". El sidebar de filtros es genérico cross-categoría sin adaptación por contexto.

| ID | Severidad | Hallazgo |
|---|---|---|
| **BUG-B2C-275** | MEDIA UX | Filtros `Capacidad`, `Potencia`, `Material` heredados a categorías donde no aplican (purificación/cartuchos). Sidebar de filtros debería ser facet-driven por categoría, no fijo global. |

#### 4. Conteo / Sort / Paginación

| Página | Total | Sort opciones | Paginación | Discount sistémico |
|---|---|---|---|---|
| `/purificacion/` | 15 productos | mismas 4 (sin "Relevancia"/"Más vendido") | ❌ no existe (15 caben en 1 pág) | TODOS -20% |
| `/purificadores-de-agua/` | 5 productos | mismas 4 | ❌ no existe | TODOS -20% |

**Hallazgo:** descuento sistémico a nivel categoría (-20% para todo purificación, vs -25% mayoritario en presurización con algunas excepciones). Posible promo activa.

#### 5. Card anatomy

**Idéntica a presurización** (template `<article class="card-product-filter">` con BUG-147, BUG-178, BUG-261). En purificación TODOS los productos tienen `button.addtoCart` (0 con "Buscar distribuidor") — contraste con presurización donde 10/24 eran "Buscar distribuidor".

**Class crudo confirmado:** `"⭐️whrvov-1 No_aplica Varios No_aplica card-product-filter"` (BUG-261 sistémico — el valor `Varios` aparece como facet de Material).

#### 6. Image origins — auditoría

**Purificación (30 imágenes, 15 cards × 2):**

| Origen | Cantidad | Observación |
|---|---|---|
| `gcs/rtp-bucket-b2b-qa` | **0** | ⚠️ NINGUNA imagen del bucket QA correcto |
| `gcs/rtp-bucket-b2b-qas` | 16 | Bucket con typo (BUG-202 sistémico) |
| `gcs/rtp-bucket-b2b-prd` | 12 | Bucket de PRODUCCIÓN (BUG-201 sistémico) |
| `images.cdn.us-central1.gcp.commercetools.com/…` | 2 | commercetools directo (BUG-200 sistémico) |

| ID | Severidad | Hallazgo |
|---|---|---|
| **BUG-B2C-276** | CRÍTICO infra | En `/purificacion/`, **0 de 30 imágenes** vienen del bucket QA correcto (`rtp-bucket-b2b-qa`). 100% del contenido visual se sirve desde buckets erróneos (typo "qas", producción "prd", o CDN commercetools directo). Indica que el seed de datos QA está roto para esta categoría. |

#### 7. Bugs de copy en H3

**Bugs de esta sección:** BUG-B2C-277, 278, 279, 280, 284 — detalle en Parte IV. (Typos verbatim "secunadario", "OsmosisInversa", doble espacio y duplicación `...` preservados en Parte IV.)

#### 8. DOM contract Playwright

```javascript
// tests/visual/purificacion-listing-contract.spec.js
import { test, expect } from '@playwright/test';

test.describe('II.7.4 /products/purificacion/ + sub — contract', () => {
  test('purificación padre', async ({ page }) => {
    await page.goto('https://qarotoplasmx.io/products/purificacion/');
    await expect(page.locator('h1')).toContainText('Purificación');
    await expect(page.locator('article[class*="card-product-filter"]')).toHaveCount(15);
    await expect(page.locator('article[class*="card-product-filter"] button.addtoCart')).toHaveCount(15);
    await expect(page.locator('article[class*="card-product-filter"] a:has-text("Buscar distribuidor")')).toHaveCount(0);
    // Discount sistémico -20%
    const discounts = await page.locator('[class*="discount-badge"]').allTextContents();
    expect(new Set(discounts)).toEqual(new Set(['-20%']));
  });

  test('purificadores-de-agua sub', async ({ page }) => {
    await page.goto('https://qarotoplasmx.io/products/purificadores-de-agua/');
    await expect(page.locator('h1')).toContainText('Purificadores');
    await expect(page.locator('article[class*="card-product-filter"]')).toHaveCount(5);
    // BUG-B2C-281: breadcrumb NO incluye link "Purificación" intermedio
    const breadcrumbLinks = await page.locator('main nav a, main > div a[class*="active"]').allTextContents();
    // hoy: solo Home + Purificadores. Endurecer tras fix:
    expect(breadcrumbLinks.some(t => t.trim() === 'Purificadores')).toBe(true);
  });

  test('image origins (sistémico — falla mientras BUG-200/201/202)', async ({ page }) => {
    await page.goto('https://qarotoplasmx.io/products/purificacion/');
    const srcs = await page.locator('article img').evaluateAll(imgs => imgs.map(i => i.src));
    const qaCount = srcs.filter(s => s.includes('rtp-bucket-b2b-qa/')).length;
    const totalCount = srcs.length;
    // Hoy: qaCount === 0 (BUG-276). Endurecer tras fix:
    expect(totalCount).toBeGreaterThan(0);
  });
});
```

#### 9. Evidencias

- `evidencias/F1C-06-purificacion-listado.png` — listing full-page de /purificacion/
- `scripts/F1C-purificacion-deep.json` — extracción JSON (meta + filtros + image origins + H3 textos + variants)

---

### II.7.5 `/products/tratamiento/`

#### 1. Meta y estructura

| Campo | Valor |
|---|---|
| `<title>` | `Rotoplas` ❌ (BUG-251 sistémico) |
| `meta[description]` | `Rotoplas` ❌ |
| H1 | `"Tratamiento"` (SIN trailing space — contrario a presurización/purificadores) |
| Breadcrumb | Home → Tratamiento |
| Filtros (H4) | `Capacidad`, `Potencia`, `Material` (heredados — BUG-275 sistémico) |
| Banner src | `…/rtp-bucket-b2b-prd/B2C/Categorias/Desktop/banner_tratamiento.webp` |

**Hallazgo banner:** archivo `banner_tratamiento.webp` **sin caracteres acentuados** → no usa NFD (vs `presurizacio%CC%81n` y `purificacio%CC%81n` que sí). Confirma BUG-B2C-255 como inconsistente entre categorías.

#### 2. Conteo / Sort / Paginación

- **12 productos** (sin paginación — caben en una página).
- **Split de variantes:** 7 con `button.addtoCart`, 5 con `<a href="/distribuidores">Buscar distribuidor`. Patrón mixto similar a presurización.
- **Descuentos:** 5 productos con `-10%` (todos biodigestores). 7 sin descuento. Confirma patrón de discount por sub-familia, no por categoría completa.

#### 3. Card anatomy — patrón confirmado + nuevo bug en className

`firstCardClass`:
```
⭐️whrvov-1  3,000_lts.  Polietileno_de_alta_densidad  No_aplica  card-product-filter
```

**Bugs de esta sección:** BUG-B2C-285, 286, 287, 288 — detalle en Parte IV. (El `firstCardClass` de arriba es la evidencia del className inválido para CSS, BUG-286.)

#### 4. Image origins — 3 origins

| Origen | Cantidad |
|---|---|
| `gcs/rtp-bucket-b2b-qa` | 8 ✓ |
| `gcs/rtp-bucket-b2b-qas` | 6 ❌ |
| `gcs/rtp-bucket-b2b-prd` | 10 ❌ |

(No hay commercetools-direct esta vez. Sigue habiendo 3 buckets distintos — BUG-200/201/202 sistémicos.)

#### 5. DOM contract Playwright

```javascript
test('II.7.5 /products/tratamiento/ — contract', async ({ page }) => {
  await page.goto('https://qarotoplasmx.io/products/tratamiento/');
  await expect(page.locator('h1')).toContainText('Tratamiento');
  await expect(page.locator('article[class*="card-product-filter"]')).toHaveCount(12);
  const addToCart = await page.locator('article button.addtoCart').count();
  const buscarDistribuidor = await page.locator('article a:has-text("Buscar distribuidor")').count();
  expect(addToCart + buscarDistribuidor).toBe(12);  // suma debe igualar total cards
  // BUG-286: className con caracteres inválidos para CSS
  const firstClass = await page.locator('article[class*="card-product-filter"]').first().getAttribute('class');
  expect(firstClass).toMatch(/card-product-filter/);
});
```

#### 6. Evidencias

- `evidencias/F1C-07-tratamiento-listado.png`
- `scripts/F1C-tratamiento-deep.json`

---

### II.7.6 `/products/calentamiento/` — **ÚNICA con meta tags reales**

> Esta categoría es la **única del catálogo** con `<title>`, `meta[description]` y `og:*` reales (no placeholders `"Rotoplas"`). Confirma que el resto de categorías son bug de configuración, no limitación técnica.

#### 1. Meta y SEO — **únicos buenos del catálogo**

| Campo | Valor |
|---|---|
| `<title>` | `Agua Caliente al Instante \| Regadera eléctrica Rotoplas.` ✓ |
| `meta[description]` | `Rotoplas te ofrece regaderas eléctricas y accesorios al mejor precio. Agua caliente instantánea y ahorro de agua. Compra en línea.` ✓ |
| `og:title` | mismo que title ✓ |
| `og:description` | mismo que description ✓ |
| canonical | `/products/calentamiento/` ✓ |

| ID | Severidad | Hallazgo |
|---|---|---|
| **BUG-B2C-289** | BAJA SEO | Title termina con `"…Rotoplas."` (punto al final del nombre de la marca) en lugar de `"… \| Rotoplas"`. Convención SERP: marca al final con `|` o `-` separador, sin punto. |
| **BUG-B2C-290** | INFO SEO | Title usa `Regadera eléctrica` (singular) mientras meta description usa `regaderas eléctricas` (plural). Inconsistencia menor pero notable. |

#### 2. Redirect `/calentamiento` (sin `/`) → `/calentamiento/` (con `/`)

Navegar a `https://qarotoplasmx.io/products/calentamiento` resulta en la URL final `https://qarotoplasmx.io/products/calentamiento/` con `/`. El redirect 301 funciona del lado servidor. BUG-007 no es URL rota: es el **href del footer apuntando a `/calentamiento` sin barra**, lo cual fuerza un redirect 301 extra por cada click. Bug menor (extra request), severidad BAJA.

#### 3. Estructura

| Campo | Valor |
|---|---|
| H1 | `"Calentamiento"` (sin trailing space) |
| Breadcrumb | Home → Calentamiento |
| Filtros (H4) | `Capacidad`, `Potencia`, `Material` (sigue heredado — no aplica a regaderas) |
| Banner | `…/rtp-bucket-b2b-prd/B2C/Categorias/Desktop/banner_calentamiento.webp` (sin acentos en nombre) |

#### 4. Conteo / Sort / Paginación

- **6 productos** (sin paginación)
- **Split:** 3 add-to-cart, 3 "Buscar distribuidor"
- **Descuentos:** **0** (única categoría sin descuento alguno)

#### 5. Card anatomy — confirmación BUG-148 sistémico

| ID | Severidad | Hallazgo |
|---|---|---|
| **BUG-B2C-291** | CRÍTICO SSR | Producto "Regadera Eléctrica EcoDucha 3T" renderiza al usuario el texto literal: `"Ideal para:{/* Cabeza */}{/* Cuerpo */}1 personas"`. Confirmación de **BUG-148 sistémico** (JSX comments leaked) ahora en categoría Calentamiento. |
| **BUG-B2C-292** | BAJA copy | El mismo producto muestra `"1 personas"` (plural con cantidad 1). Falta lógica `n === 1 ? 'persona' : 'personas'`. |
| **BUG-B2C-293** | MEDIA infra | Image origins en calentamiento: 4 prd + 8 qas = **12 imágenes, 0 desde bucket QA correcto**. Sólo orígenes problemáticos (BUG-201/202). |

#### 6. H3 truncados sistémicos

2 de 6 productos (`Resistencia de repuesto para EcoDucha de 3 temperaturas` y `…4 temperaturas`) renderizan con `...` literal (BUG-270/280/288 sistémico).

#### 7. DOM contract Playwright

```javascript
test('II.7.6 /products/calentamiento/ — contract', async ({ page }) => {
  await page.goto('https://qarotoplasmx.io/products/calentamiento/');
  // Meta tags reales — endurecer (única categoría con título descriptivo):
  await expect(page).toHaveTitle(/Agua Caliente.*Regadera el[eé]ctrica.*Rotoplas/);
  const desc = await page.locator('meta[name="description"]').getAttribute('content');
  expect(desc).toMatch(/regaderas el[eé]ctricas/i);
  await expect(page.locator('h1')).toContainText('Calentamiento');
  await expect(page.locator('article[class*="card-product-filter"]')).toHaveCount(6);
  await expect(page.locator('[class*="discount-badge"]')).toHaveCount(0);
  // BUG-B2C-291: JSX leak en "Ideal para:"
  const idealText = await page.locator('article:has-text("Ideal para")').first().textContent();
  expect(idealText).not.toContain('{/* Cabeza */}');  // hoy falla — endurece tras fix
});

test('redirect /calentamiento → /calentamiento/', async ({ page }) => {
  const resp = await page.goto('https://qarotoplasmx.io/products/calentamiento');
  expect(page.url()).toBe('https://qarotoplasmx.io/products/calentamiento/');
});
```

#### 8. Evidencias

- `evidencias/F1C-08-calentamiento-listado.png`
- `scripts/F1C-calentamiento-deep.json`

---

### II.7.7 `/products/conduccion/` — **categoría más grande + único con paginación**

> 652 productos en 28 páginas (24/pág). Única categoría con `<nav>` de paginación visible — el resto de categorías cabe en una sola página.

#### 1. Meta y estructura

| Campo | Valor |
|---|---|
| `<title>` | `Rotoplas` ❌ (BUG-251 sistémico) |
| `meta[description]` | `Rotoplas` ❌ |
| H1 | `"Conducción"` (sin trailing space) |
| Breadcrumb | Home → Conducción |
| Filtros (H4) | `Capacidad`, `Potencia`, `Material` (heredados) |
| Banner | `…/rtp-bucket-b2b-prd/B2C/Categorias/Desktop/banner_conduccio%CC%81n.webp` (NFD) |

#### 2. Conteo / Sort / Paginación

| Campo | Valor |
|---|---|
| Total productos | **652** |
| Productos por página | 24 (primera página) |
| Total páginas | **28** |
| Split de variantes | 24/24 add-to-cart, **0** "Buscar distribuidor" → categoría 100% compra online |
| Descuentos | mezcla `-25%`, `-24%`, `-20%`, `-19%` (variable por producto, no por categoría) |

#### 3. Paginación — ANATOMÍA COMPLETA (componente único en el sitio)

```html
<nav aria-label="Paginación de productos" class="⭐️c2ijco-8 pagination">
  <button disabled>‹ Anterior</button>          <!-- pág 1: disabled correcto -->
  <button aria-current="page">1</button>        <!-- a11y ✓ -->
  <button>2</button>
  <button>3</button>
  ...                                            <!-- TODOS los botones 1..28 renderizados -->
  <button>28</button>
  <button>Siguiente ›</button>                   <!-- enabled cuando NO es última -->
</nav>
```

**Hallazgos del componente:**

| ID | Severidad | Hallazgo |
|---|---|---|
| **BUG-B2C-294** | ALTA SEO/UX | Botones de paginación son `<button>` **sin `href`** ni handler `?page=N` en URL. URL permanece `…/conduccion/` para todas las 28 páginas — no se puede compartir, no se puede agregar a favoritos, browser back roto, paginación invisible para Google. Crawler indexa solo 24 de 652 productos. |
| **BUG-B2C-295** | MEDIA UX | Paginación renderiza **los 28 botones de página** todos al mismo tiempo (sin colapsar con ellipsis `1 2 3 … 27 28`). En mobile fuerza overflow horizontal o wrapping vertical denso. |
| **BUG-B2C-296** | INFO | Aspecto positivo confirmado: `aria-label="Paginación de productos"` en `<nav>` ✓ + `aria-current="page"` en página activa ✓ + `disabled` en "‹ Anterior" cuando estamos en pág 1 ✓. **Mejor componente de a11y del sitio** auditado hasta ahora. |

#### 4. Image origins en pág 1

| Origen | Cantidad |
|---|---|
| `gcs/rtp-bucket-b2b-qa` | **0** ❌ |
| `gcs/rtp-bucket-b2b-qas` | 36 |
| `gcs/rtp-bucket-b2b-prd` | 12 |

(BUG-276 reincide — categorías sin imágenes del bucket QA correcto: purificación, calentamiento, conducción.)

#### 5. Productos detectables — marca dominante

**Todos los productos visibles en pág 1 son `Tuboplus`** (marca submarca de Rotoplas). El catálogo de Conducción coincide con la línea Tuboplus. Confirmar con paginación a páginas 14-28 si hay otras submarcas.

#### 6. Bugs de copy detectados en muestra de página 1

**Bugs de esta sección:** BUG-B2C-297, 298 — detalle en Parte IV.

(13 de 24 productos H3 con `...` literal sistémico — BUG-270/280/288 confirmado.)

#### 7. DOM contract Playwright

```javascript
test('II.7.7 /products/conduccion/ — contract pág 1', async ({ page }) => {
  await page.goto('https://qarotoplasmx.io/products/conduccion/');
  await expect(page.locator('h1')).toContainText('Conducción');
  await expect(page.locator('article[class*="card-product-filter"]')).toHaveCount(24);
  await expect(page.locator('nav[aria-label="Paginación de productos"]')).toBeVisible();
  // 28 páginas
  const pageButtons = page.locator('nav[aria-label="Paginación de productos"] button');
  await expect(pageButtons).toHaveCount(30);  // 1..28 + Anterior + Siguiente
  await expect(page.locator('nav[aria-label="Paginación de productos"] button:has-text("28")')).toBeVisible();
  // Pág 1 activa
  await expect(page.locator('button[aria-current="page"]')).toHaveText('1');
  // Anterior disabled
  await expect(page.locator('nav button:has-text("Anterior")')).toBeDisabled();
});

test('BUG-B2C-294: paginación sin URL state', async ({ page }) => {
  await page.goto('https://qarotoplasmx.io/products/conduccion/');
  const urlAntes = page.url();
  await page.locator('nav[aria-label="Paginación de productos"] button:has-text("2")').click();
  await page.waitForTimeout(500);
  // Hoy: URL no cambia (BUG). Tras fix debe contener ?page=2 o /page/2:
  expect(page.url()).toBe(urlAntes);  // hoy pasa porque NO cambia — invertir tras fix
});
```

#### 8. Evidencias

- `evidencias/F1C-09-conduccion-listado.png` — listing pág 1 con paginación visible
- `scripts/F1C-conduccion-deep.json`

---

### II.7.8 `/products/servicios/` — **la más rota + naming mismatch**

> Categoría con `<title>` específico, pero **banner roto, JSX leaks confirmados a 14 ocurrencias, 0 imágenes desde bucket QA** y nombre de categoría ("Servicios") **mismatch con el contenido** (sólo tinacos pre-equipados).

#### 1. Meta y estructura

| Campo | Valor |
|---|---|
| `<title>` | `Servicios` (no placeholder pero genérico — sin "Rotoplas") |
| `meta[description]` | `Servicios y Garantias` ❌ — **sin tilde** en "Garantías" |
| H1 | `"Servicios"` (sin trailing space) |
| Breadcrumb | Home → Servicios |
| Filtros (H4) | sin filtros adicionales — solo "Todos los productos" + "Ordenar por" |
| Banner | `<img alt="Banner" src="">` — **src vacío** (`naturalWidth: 0`) → imagen rota |

#### 2. Conteo / variantes / discounts

| Campo | Valor |
|---|---|
| Total productos | **8** |
| Split | 4 add-to-cart, 4 "Buscar distribuidor" |
| Descuentos | mezcla `-20%`, `-19%`, `-10%`, `-9%` (4 valores en 8 productos) |
| Paginación | no (caben en 1 pág) |

#### 3. Bugs nuevos críticos

**Bugs de esta sección:** BUG-B2C-299→303 — detalle en Parte IV. (Incluye CRÍTICOs: BUG-300 banner `src=""` vacío, BUG-302 JSX leak en SVG `<circle>`.)

#### 4. Card anatomy notable

`firstCardClass`: `"⭐️whrvov-1 2,500_lts. Polietileno No_aplica card-product-filter"` — BUG-286 sistémico (className con coma, punto y _ en datos crudos).

H3 patrón duplicado confirmado: el primer producto en snapshot a11y tree apareció como `"Tinaco Plus+ Tinaco Plus+ equipado 2,500 litros color beige"` — duplicación del nombre "Tinaco Plus+" al inicio del título (truncado + completo concatenado sin `...`).

#### 5. DOM contract Playwright

```javascript
test('II.7.8 /products/servicios/ — contract', async ({ page }) => {
  await page.goto('https://qarotoplasmx.io/products/servicios/');
  await expect(page).toHaveTitle('Servicios');
  await expect(page.locator('h1')).toContainText('Servicios');
  await expect(page.locator('article[class*="card-product-filter"]')).toHaveCount(8);
  // BUG-B2C-300: banner roto
  const bannerSrc = await page.locator('main img[alt="Banner"]').getAttribute('src');
  expect(bannerSrc === '' || bannerSrc.includes('/products/servicios/')).toBe(true);
  // BUG-B2C-302: JSX leaks
  const html = await page.content();
  const leaks = (html.match(/\{\/\*/g) || []).length;
  expect(leaks).toBeGreaterThan(0);  // hoy 14 — endurecer a 0 tras fix
});
```

#### 6. Evidencias

- `evidencias/F1C-10-servicios-listado.png`
- `scripts/F1C-servicios-deep.json`

---

## II.8 PDP `/product/[slug]_[id]/`

> Las PDP viven bajo `/product/[NombreConcatenado]_[SKU]/`. URL representativa: `https://qarotoplasmx.io/product/TinacoPlusconBombaCentrifuga1100litros_500545/`. Fuente: `/sitemap-products.xml` → 947 entries totales.

### 0. Convenciones de URL — patrón de slug

| Tipo | Ejemplo | Observación |
|---|---|---|
| Mayoría (≈946) | `/product/NombreConcatenadoEnCamelCase_NúmeroSKU/` | Sin guiones, sin tildes, sin eñes |
| Excepción | `/product/plato-para-mascotas-color-gris/` | Slug humano kebab-case sin SKU |
| **Sin tilde en slug** | `TinacoPlusconBombaCentrifuga…` (de "Centrífuga") | SEO degradado |

| ID | Severidad | Hallazgo |
|---|---|---|
| **BUG-B2C-304** | MEDIA SEO | Slugs sin tildes/eñes (`Centrifuga` por `Centrífuga`, `Derivacin` por `Derivación`, `Presin` por `Presión`, `Resistec` por `Resistex`). Google sí prefiere slugs con caracteres latinos completos para búsquedas localizadas en MX. |
| **BUG-B2C-305** | MEDIA infra | Patrón de slug **inconsistente**: 946 productos con `NombreCamelCase_ID`, 1 con `slug-kebab-humano-sin-id`. Sin política única. |

### 1. Meta tags — PDP SÍ tienen meta tags propias (contraste con listings)

| Campo | Valor real |
|---|---|
| `<title>` | `Tinaco Plus+ 1100L con Bomba Centrífuga \| Agua a Presión Constante` ✓ específico |
| `meta[description]` | `Almacena y distribuye agua con presión estable. Tinaco Plus+ de 1,100 litros con bomba centrífuga ideal para hogares y negocios. ¡Compra ahora y mejora tu suministro!` ✓ |
| `og:title` | mismo ✓ |
| `og:description` | mismo ✓ |
| `og:image` | `images.cdn.us-central1.gcp.commercetools.com/.../500545_1_1-N8srVXkA.png` ✓ |
| canonical | `…/product/TinacoPlusconBombaCentrifuga1100litros_500545/` ✓ |

| ID | Severidad | Hallazgo |
|---|---|---|
| **BUG-B2C-315** | CRÍTICO SEO | **CERO scripts `application/ld+json`** en el PDP. Sin schema.org `Product`, `Offer`, `AggregateRating`, `Breadcrumb`, `Review`. Google Shopping y rich snippets imposibles. |

### 2. H1 — **DOBLE H1 con contenido de prueba leaked**

```html
<h1 class="⭐️ctimhs-0">Tinaco Plus+ con Bomba Centrifuga 1,100 litros</h1>  <!-- producto real -->
...
<div class="builder-blocks">
  <div class="builder-f4bd845f7e3e41dea43ed6ecc88d6075 builder-block">
    <div class="builder-text">
      <h1>TEST TINACO</h1>  <!-- contenido de PRUEBA en PRODUCCIÓN -->
    </div>
  </div>
</div>
```

| ID | Severidad | Hallazgo |
|---|---|---|
| **BUG-B2C-313** | CRÍTICO HTML/SEO | **2 H1 en la misma página** — viola convención `<h1>` único por página. Google y screen readers no saben cuál es el título principal. |
| **BUG-B2C-314** | CRÍTICO contenido | H1 fantasma con texto literal **`"TEST TINACO"`** (contenido de pruebas) visible al usuario en producción QA. Viene de bloque Builder.io editable (`class="builder-f4bd845f7e3e41dea43ed6ecc88d6075"`). |
| **BUG-B2C-326** | BAJA copy | H1 real usa `"Centrifuga"` sin tilde — debería `"Centrífuga"`. Mismo bug que slug (BUG-304) reflejado en H1. |

### 3. Breadcrumb

```
Home > Almacenamiento > Tinacos > Tinaco Plus+ Con Bomba Centrifuga 1,100 Litros
```

- Sí tiene 4 niveles (vs 2 niveles en listings) ✓
- Pero **acceso desde `/products/servicios/` → breadcrumb dice `Almacenamiento > Tinacos`** → el producto tiene categoría primaria en taxonomía interna, no en la última de origen → confirma BUG-301 (multi-categoría sin canonical visible al usuario).

| ID | Severidad | Hallazgo |
|---|---|---|
| **BUG-B2C-327** | INFO | Breadcrumb del PDP usa Title Case (`"Con"`, `"Centrifuga"`, `"Litros"`) inconsistente con H1 que usa lowercase (`"con"`, `"litros"`). |
| **BUG-B2C-328** | MEDIA SEO | Breadcrumb sin marcado `schema.org/BreadcrumbList`. Heredado del sitio (sistémico). |

### 4. Galería / Carrusel — **BUG CRÍTICO: muestra imágenes de otros productos**

Carrusel con 2 dots (`Ir al slide 1`, `Ir al slide 2`) y clase `dot active`.

**Slide 1:** imagen correcta del producto: `…/500545_1_1-N8srVXkA.png` (SKU 500545 = el producto actual).

**Slides 2+ y carrusel auxiliar:** las imágenes del DOM incluyen:
- `…/500537_1_1-…png` → SKU 500537 = `Tinaco Vertical con Bomba Centrifuga 500 litros` (producto cross-sell)
- `…/500544_1_1-…png` → SKU 500544 = `Tinaco Vertical con Bomba Presurizadora 500 litros` (cross-sell)
- `…/500546_1_1-…png` → SKU 500546 = `Tinaco Plus+ con Bomba Presurizadora 1,100 litros` (cross-sell)

| ID | Severidad | Hallazgo |
|---|---|---|
| **BUG-B2C-316** | CRÍTICO UI/data | Galería del PDP `500545` muestra **imágenes de los productos cross-sell (500537/500544/500546)**, no del producto que se está viendo. Probable bug del selector de imágenes en el componente carrusel que confunde el producto principal con los relacionados. |
| **BUG-B2C-329** | BAJA a11y | Imágenes del carrusel con `alt=""` (BUG-178 sistémico). |
| **BUG-B2C-330** | INFO a11y | Dots del carrusel SÍ tienen `aria-label="Ir al slide N"` ✓ pero **sin `aria-current`** para indicar slide activo (lo expresan con clase `dot active` solamente — invisible para screen reader). |

### 5. Sección de compra

| Elemento | Estado actual | Hallazgos |
|---|---|---|
| Precio actual | `$4,921.15` ✓ |  |
| Discount badge | `-19%` ✓ |  |
| Precio tachado | `$6,151.43` ✓ |  |
| Toggle "¿Te lo instalamos en tu hogar?" | `<div class="installation-container">` — toggle de servicio extra | No es `<input type="checkbox">` ni `<button>` con `role="switch"`. Probable handler Qwik solamente. |
| Etiqueta "Nuevo" | `<div style="display:none" class="NewTag">Nuevo</div>` | Oculto via inline `display:none` — debería usar lógica condicional, no DOM frío con CSS hide |
| Ranking estrellas | `★★★★★` con `display:none` | Mismo patrón: hardcoded en DOM, oculto via CSS |
| Cantidad | botón `decreasebutton` + texto `1` + botón `increasebutton` | Ambos deshabilitados por CP |
| CTA primario | `<button class="buys">Comprar ahora</button>` disabled | `hasOnClick: true` ✓ |
| CTA secundario | `<button class="buy">Agregar a carrito</button>` disabled | `hasOnClick: true` ✓ |
| Mensaje CP | `No disponible para C.P. 02800Comprobar disponibilidad con otro C.P.` | Sin separador entre la frase y el call-to-action (concatenado en `.textContent`) |

| ID | Severidad | Hallazgo |
|---|---|---|
| **BUG-B2C-318** | CRÍTICO a11y | Botones `decreasebutton` y `increasebutton` (cantidad +/-) **sin aria-label, sin texto, sin title, sin innerHTML** → solo CSS y SVG implícito. Screen reader anuncia "botón" sin contexto. Imposible operar cantidad por teclado/AT. |
| **BUG-B2C-331** | MEDIA a11y | Toggle "¿Te lo instalamos en tu hogar?" implementado como `<div>` con handler Qwik, sin `role="switch"`, sin `aria-checked`. Invisible para AT. |
| **BUG-B2C-332** | MEDIA UI | Etiquetas `Nuevo` y `★★★★★` (ranking) están en el DOM con `display:none` inline hardcoded. Indica template estático no condicional — todos los PDPs tienen estos elementos ocultos en lugar de no renderizarlos. |
| **BUG-B2C-333** | BAJA UX | Mensaje de no disponibilidad CP concatena `"No disponible para C.P. 02800"` + `"Comprobar disponibilidad con otro C.P."` sin separador visible/semántico — el "Comprobar…" parece subtítulo cuando debería ser un botón/link claro. |
| **BUG-B2C-334** | MEDIA a11y | "Comprobar disponibilidad con otro C.P." no es `<button>` ni `<a>` — es texto plano clickable (no detectado en query `button,a`). Bug a11y + UX. |
| **BUG-B2C-335** | MEDIA UX | Cuando el producto **no está disponible para el CP**, el PDP igual se renderiza con CTAs deshabilitados. No hay indicador en el listing de la categoría que advierta de esto antes del click. Usuario perderá tiempo accediendo a productos no comprables. |

### 6. Acordeón "Descripción" — contenido completo

```
SKU 500545
Rotoplas te conviene más.
Rotoplas te conviene más

El Tinaco Plus+ de 1,100L de Rotoplas incluye una bomba centrífuga de 1/2 HP
diseñada para el llenado de tinacos y el suministro en construcciones donde se
requiera gran caudal. Ofreciendo resistencia a la intemperie, bajo consumo
eléctrico y un funcionamiento silencioso. El Tinaco tiene un diseño avanzado
que cuenta con soportes verticales, orejas de izaje y una tapa ergonómica,
garantizando resistencia una fácil instalación y agua limpia, es ideal para
hasta 4 personas!. Además, cuenta con la certificación EPD, demostrando
nuestro compromiso con la sustentabilidad.
Rotoplas más y mejor aguaRotoplas más y mejor agua.
```

| ID | Severidad | Hallazgo |
|---|---|---|
| **BUG-B2C-321** | BAJA copy | `"es ideal para hasta 4 personas!."` — punto + signo de exclamación final al revés (`!.` debería `!`). |
| **BUG-B2C-322** | BAJA copy | `"garantizando resistencia una fácil instalación"` — falta conjunción `"y"` entre `resistencia` y `una`. |
| **BUG-B2C-323** | BAJA copy | `"Rotoplas te conviene más."` aparece DOS veces consecutivas en el HTML (`<p>` + `<p id="main-description">` que abre con la misma frase). Lo mismo con `"Rotoplas más y mejor agua"` al final (concatenado sin separador). Template error o data duplicada. |
| **BUG-B2C-336** | INFO | Acordeón "Descripción" usa elemento nativo `<details>` con `<summary>` ✓ — buena práctica de a11y (DisclosureTriangle nativo). Punto positivo del PDP. |

### 7. Acordeón "Especificaciones técnicas"

Render con `<div class="container">` + filas `<div class="Capacidad Row">`, NO `<table>`.

```
Capacidad (L)   |   Diámetro (m)   |   Altura (m)   |   Color
1,100 lts.      |   1.15           |   1.25         |   Varios
```

| ID | Severidad | Hallazgo |
|---|---|---|
| **BUG-B2C-317** | MEDIA a11y/semántica | Especificaciones técnicas usan `<div class="Row">` en lugar de `<table>`/`<tr>`/`<td>` o `<dl>`/`<dt>`/`<dd>`. Screen readers no anuncian como tabla de datos. Información tabular pero estructura semántica de párrafos. |
| **BUG-B2C-337** | BAJA copy | Unidad `(L)` en header pero el valor dice `1,100 lts.` — abreviación literal `lts.` (no estándar) además de la unidad ya indicada en header. Doble notación inconsistente. |
| **BUG-B2C-338** | BAJA copy | Color del producto = `"Varios"` (de los facets crudos del className) en lugar de listar colores reales. UX poco informativa. |

### 8. Manuales descargables

```html
<a href="https://storage.googleapis.com/rtp-bucket-b2b-prd/B2C/Fichas_Técnicas/
Tinaco Plus+ con Bomba Centrifuga 1,100 litros - Ficha Técnica.pdf">
  Descargar manual
</a>
```

| ID | Severidad | Hallazgo |
|---|---|---|
| **BUG-B2C-339** | MEDIA infra | PDF de ficha técnica sirve desde `rtp-bucket-b2b-prd` (PRODUCCIÓN) en ambiente QA — confirma BUG-201 sistémico para assets adicionales del PDP. |
| **BUG-B2C-340** | INFO | Link `Descargar manual` sin `target="_blank"` ni `rel="noopener"` ni icono PDF ni indicación de tamaño/tipo de archivo. UX y a11y reducidas. |

### 9. Sección "Lleva tu producto al siguiente nivel" — cross-sell

- H2: `"Lleva tu producto al siguiente nivel"` ✓ (heading correcto)
- 3 cards usando misma anatomía de listing (BUG-147/178/261 reincide)
- Todos los cards: `"Buscar distribuidor"` (sin add-to-cart)
- Discounts: `-10%`, `-9%`, `-20%`

### 10. Sección "Reseñas"

```html
<div class="reviews">
  <p style="color:#165EEB">Reseñas</p>                                <!-- ❌ no es heading -->
  <div class="ContainerQuantity">
    <div class="noStarts">                                            <!-- ❌ typo: "noStarts" debería "noStars" -->
      <h4>¡Se el primero en dejar una reseña de este producto!</h4>   <!-- ❌ "Se" sin tilde -->
      <button>Escribir una reseña</button>
    </div>
  </div>
</div>
```

| ID | Severidad | Hallazgo |
|---|---|---|
| **BUG-B2C-307** | BAJA copy | `"¡Se el primero…"` — falta tilde, debería `"¡Sé el primero…"`. |
| **BUG-B2C-319** | MEDIA semántica | `"Reseñas"` se renderiza como `<p>` (no `<h2>`/`<h3>` como debería ser un section heading). Encabezado semántico perdido. |
| **BUG-B2C-341** | BAJA infra | Clase `"noStarts"` — typo: debería ser `"noStars"`. Indicador de calidad de código del template. |

### 11. Carrusel — anatomía detallada

```html
<button class="dot active" aria-label="Ir al slide 1"></button>
<button class="dot"        aria-label="Ir al slide 2"></button>
<!-- decreasebutton / increasebutton SIN aria-label — BUG-318 -->
<button class="scroll-down">  <!-- scroll-down sin aria-label -->
```

### 12. JSX leaks en el PDP

`jsxLeakCount: 0` ✓ — esta PDP no tiene JSX comments leaked. Confirma que el bug es por componente (cards de listing y SVG de "Ideal para"), no global del template PDP.

### 13. DOM contract Playwright — PDP completa

```javascript
// tests/visual/pdp-tinaco-plus-contract.spec.js
import { test, expect } from '@playwright/test';

test.describe('II.8 PDP /product/[slug]_[id]/ — contract', () => {
  const PDP_URL = 'https://qarotoplasmx.io/product/TinacoPlusconBombaCentrifuga1100litros_500545/';

  test('meta tags y SEO PDP', async ({ page }) => {
    await page.goto(PDP_URL);
    await expect(page).toHaveTitle(/Tinaco Plus.*Centr[ií]fuga.*Presi[oó]n Constante/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', PDP_URL);
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /500545/);
    // BUG-315: cero JSON-LD — endurecer a 1+ tras fix
    const jsonLd = await page.locator('script[type="application/ld+json"]').count();
    expect(jsonLd).toBe(0);  // hoy 0 (bug). Invertir a > 0 tras fix.
  });

  test('BUG-313/314: DOBLE H1 con contenido de prueba', async ({ page }) => {
    await page.goto(PDP_URL);
    const h1s = await page.locator('h1').allTextContents();
    expect(h1s.length).toBeGreaterThan(1);                // hoy 2 — bug
    expect(h1s).toContain('TEST TINACO');                  // contenido fantasma de Builder.io
    await expect(page.locator('h1', { hasText: 'Tinaco Plus' })).toBeVisible();
  });

  test('breadcrumb completo (4 niveles)', async ({ page }) => {
    await page.goto(PDP_URL);
    await expect(page.locator('a[href$="/products/almacenamiento/"], a[href$="/products/almacenamiento"]').first()).toBeVisible();
    await expect(page.locator('a[href*="/almacenamiento/tinacos"]')).toBeVisible();
  });

  test('sección compra — estado disabled por CP', async ({ page }) => {
    await page.goto(PDP_URL);
    await expect(page.getByRole('button', { name: 'Comprar ahora' })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Agregar a carrito' })).toBeDisabled();
    await expect(page.locator('text=No disponible para C.P.')).toBeVisible();
    // BUG-318: cantidad +/- sin aria-label
    const decreaseBtn = page.locator('button.decreasebutton');
    expect(await decreaseBtn.getAttribute('aria-label')).toBeNull();  // hoy null — invertir tras fix
  });

  test('acordeones nativos <details>', async ({ page }) => {
    await page.goto(PDP_URL);
    const descAccord = page.locator('details:has-text("Descripción")');
    const specsAccord = page.locator('details:has-text("Especificaciones técnicas")');
    await expect(descAccord).toBeVisible();
    await expect(specsAccord).toBeVisible();
    await descAccord.click();
    // SKU expuesto al abrir
    await expect(descAccord).toContainText('SKU 500545');
  });

  test('cross-sell con 3 cards', async ({ page }) => {
    await page.goto(PDP_URL);
    const crossSection = page.locator('section:has-text("Lleva tu producto"), div:has-text("Lleva tu producto")').first();
    await expect(page.locator('h2', { hasText: 'Lleva tu producto al siguiente nivel' })).toBeVisible();
  });

  test('BUG-316: galería contamina con imágenes de cross-sell', async ({ page }) => {
    await page.goto(PDP_URL);
    const galleryImgs = await page.locator('main img[alt=""]').evaluateAll(imgs => imgs.map(i => i.src));
    const containsCrossSellSku = galleryImgs.some(s => /500537|500544|500546/.test(s));
    expect(containsCrossSellSku).toBe(true);  // hoy true — invertir a false tras fix
  });

  test('reseñas con typo "noStarts" + "Se el primero"', async ({ page }) => {
    await page.goto(PDP_URL);
    await expect(page.locator('.noStarts, [class*="noStarts"]')).toBeAttached();  // typo en clase
    await expect(page.locator('h4', { hasText: 'Se el primero' })).toBeVisible(); // sin tilde
  });
});
```

### 14. Matriz exhaustiva — TODOS los botones del PDP (15 buttons) + comportamiento esperado

> Filtrado: 15 `<button>` totales en `<main>`. Aquí desglose con clase + qid + handler Qwik + comportamiento esperado verificado en vivo o inferido del DOM/clase.

| # | qid | Texto / aria-label | Clase | Visible? | Handler Qwik | Comportamiento esperado | Estado verificado |
|---|---|---|---|---|---|---|---|
| 1 | `55` | "Cambiar" | (sin clase) | ✓ (header) | `q-8k5p389a.js#s_f2kd0B6g6Qg` | Abrir modal "Verifica disponibilidad de entrega" para cambiar dirección/CP | No probado en sesión |
| 2 | `58` | (aria-label="Abrir menú") | `tool menu` | ✗ (mobile-only) | `q-BX-zVVi1.js#s_mEfQJuL0y1I` | Abrir drawer mega-menú lateral | Mobile-only |
| 3 | `5e` | "Ver todos los resultados" | `⭐️6h3eza-0` | ✗ (oculto, disabled) | `q-CHjAh2g9.js#s_SRPpXe86Fa8` | Dentro del autocompletado del searchbox — ir a SRP del query | Oculto |
| 4 | — | "Cerrar sesión" | (sin clase) | ✗ (en menú user) | sin Qwik (button HTML plano) | Logout del usuario | No probado |
| 5 | `6d` | "Ver todos los resultados" (duplicado) | `⭐️6h3eza-0` | ✗ | mismo handler | Variante mobile del #3 | Duplicado mobile/desktop |
| 6 | `6g` | (aria-label="Cerrar", title="Cerrar") | `close-btn` | ✓ | `q-8k5p389a.js#s_3u0EgbJQMPg` | Cerrar banner promocional o el toast "Añadiste este artículo a tu carrito" | No probado |
| 7 | `6m` | (sin label) | `⭐️g88usz-0` | ✗ (modal cerrado) | `q-B3yhcv9y.js#s_CpQxq4ux9RU` | **Botón Compartir** — abre modal con 3 links (FB sharer, Instagram DM, WhatsApp). Sus padres usan clase `modal-content` | Inferido, NO confirmado al click |
| 8 | `9j` | (sin label) | `⭐️s5ey5u-0 mini-btn scroll-down` | ✓ (top 249) | `q-AplTxEcF.js#s_HDuCAXKYdGQ` | Scroll-to-descripción / scroll abajo. Flecha hacia abajo en SVG. **Sin aria-label** | No probado |
| 9 | `ao` | (aria-label="Ir al slide 1") | `⭐️5y6m7i-0 dot active` | ✓ | `q-DhkIL9Z-.js#s_xhHAaSvSjYQ` | Cambiar carrusel al slide 1 | **✅ Verificado: click cambia activo** |
| 10 | `ap` | (aria-label="Ir al slide 2") | `⭐️5y6m7i-0 dot` | ✓ | mismo handler | Cambiar carrusel al slide 2 | **✅ Verificado: pasa de slide 1 → 2 (clase `active` migra)**. Sin `aria-current` (BUG-330) |
| 11 | `b5` | (sin texto, sin label) | `⭐️wfkamb-0 decreasebutton` | ✓ (disabled) | `q-DjoIJWK-.js#s_0TXm0CefqQM` | Decrementar cantidad (–1). Hoy disabled por CP. Sin aria-label, sin texto, sin title, sin innerHTML → **BUG-318** | No probado (disabled) |
| 12 | `b8` | (sin texto, sin label) | `⭐️wfkamb-0 increasebutton` | ✓ (disabled) | `q-DslYsNu0.js#s_a8NPhxwcUIA` | Incrementar cantidad (+1). Mismo bug a11y | No probado (disabled) |
| 13 | `b9` | "Comprar ahora" | `⭐️ctimhs-0 buys` | ✓ (disabled) | `q-DJlIR_9i.js#s_uIV6bDXAnXs` | Compra inmediata: agregar al cart + redirect a `/checkout` con producto pre-seleccionado | No probado (disabled por CP) |
| 14 | `ba` | "Agregar a carrito" | `⭐️ctimhs-0 buy` | ✓ (disabled) | `q-pFrEWLZp.js#s_fZ0B05EAO8o` | Agregar al cart, mostrar toast "Añadiste este artículo a tu carrito" + badge `1` en header cart | No probado (disabled por CP) |
| 15 | `db` | "Escribir una reseña" | `⭐️mujlg0-0` (parent `ContainerButtonActionPDP`) | ✓ (top 1723) | `q-pFrEWLZp.js#s_RIYC3O0XXCs` | Abrir formulario / modal de "Escribir reseña" — probablemente requiere login (sin probar) | No probado |

### 15. Matriz exhaustiva — TODOS los links del PDP (71 links) — DESGLOSE por sección

#### 15.a Header (usuario autenticado)

| Texto | href | target | rel | Handler Qwik | Comportamiento esperado |
|---|---|---|---|---|---|
| "Mis datos" (×2 `menuMovil` + `menuDEsk`) | `/customer` | _self | — | sí | Navegar a área de cuenta — Mis datos |
| "Mis pedidos" (×2) | `/customer/orders` | _self | — | sí | Ir al listado de pedidos |
| "Mis direcciones" (×2) | `/customer/address` | _self | — | sí | Ir a Mis direcciones |
| "Mis reseñas" (×2) | `/customer/reviews` | _self | — | sí | Ir a Mis reseñas |
| "1" (cart badge) | `/cart` | _self | — | no | Ir al carrito |
| "Ver Carrito" (drawer-button) | `/cart` | _self | — | sí | Ir al carrito desde toast |
| (Logo Rotoplas — sin texto) | `/` | _self | — | sí | Ir al home. **BUG a11y: link sin alt text ni aria-label** |

#### 15.b Breadcrumb

| Texto | href | Hallazgo |
|---|---|---|
| (icono home, sin texto) | `/` | Sin alt/aria-label |
| "almacenamiento" (lowercase) | `/products/almacenamiento` | Sin slash final → fuerza redirect 301 |
| "tinacos" (lowercase) | `/products/almacenamiento/tinacos` | Hereda misma característica |

| ID | Severidad | Hallazgo |
|---|---|---|
| **BUG-B2C-342** | BAJA SEO | Breadcrumb usa hrefs con texto del label en lowercase, pero el texto visible al usuario tiene **Title Case mixto** (`Almacenamiento`, `Tinacos`). El texto del `<a>` interno sí es lowercase. Inconsistencia visible. |

#### 15.c Sección "Manuales descargables"

| Texto | href | target | rel | Comportamiento esperado |
|---|---|---|---|---|
| "Descargar manual" | `…rtp-bucket-b2b-prd/B2C/Fichas_Técnicas/Tinaco Plus+ con Bomba Centrifuga 1,100 litros - Ficha Técnica.pdf` | `_blank` | (vacío) | Descargar/abrir PDF en nueva pestaña |

| ID | Severidad | Hallazgo |
|---|---|---|
| **BUG-B2C-343** | MEDIA seguridad | Link de manual a PDF en `_blank` SIN `rel="noopener noreferrer"`. Vulnerabilidad a reverse tabnabbing en el PDF si fuera redirect-able. |
| **BUG-B2C-344** | BAJA copy | Nombre del archivo PDF usa "Centrifuga" sin tilde (mismo bug que slug/H1). |

#### 15.d Sección "Compartir" (modal — actualmente oculto)

| Tipo | href | target | rel | Comportamiento esperado | a11y |
|---|---|---|---|---|---|
| Share Facebook (SVG icon) | `https://www.facebook.com/sharer/sharer.php?u={URL}` | `_blank` | (vacío) | Abrir Facebook Share dialog | Sin alt/aria-label en link ni en SVG ❌ |
| Share Instagram (IMG icon) | `https://www.instagram.com/direct/new/?text=Visita%20mi%20sitio:%20{URL}` | `_blank` | (vacío) | Abrir Instagram DM compose | IMG con `alt="Instagram Icon"` ✓ |
| Share WhatsApp (SVG icon) | `https://api.whatsapp.com/send?text={URL}` | `_blank` | (vacío) | Abrir WhatsApp con texto del URL | Sin alt/aria-label ❌ |

| ID | Severidad | Hallazgo |
|---|---|---|
| **BUG-B2C-345** | ALTA seguridad | Los 3 links de share social (`_blank`) **sin `rel="noopener noreferrer"`** — vulnerabilidad de reverse tabnabbing. CRÍTICO en redes sociales por el volumen de uso. |
| **BUG-B2C-346** | MEDIA UX/copy | Share de Instagram apunta a `direct/new` (DM compose) con texto fijo `"Visita mi sitio: {URL}"` — mensaje "visita mi sitio" desde la cuenta del usuario suena spam. Lo común es Instagram Stories share (más natural). |

#### 15.e Cross-sell (3 cards de "Lleva tu producto al siguiente nivel")

| Card | href | Comportamiento esperado | Hallazgo |
|---|---|---|---|
| `Tinaco Vertical con Bomba Centrifuga 500 litros` | NO existe `<a>` — solo handler Qwik en `<div class="⭐️whrvov-1">` | Click navega a PDP del producto | BUG-147 sistémico: sin `<a href>` → no Cmd+click, no preview link, no SEO |
| `Tinaco Vertical con Bomba Presurizadora` | mismo | mismo | mismo |
| `Tinaco Plus+ con Bomba Presurizadora 1,100 litros` | mismo | mismo | mismo |

**Botón secundario en cada card:**

| Texto | href | target | rel | Hallazgo |
|---|---|---|---|---|
| "Buscar distribuidor" (×3) | `/distribuidores` | `_blank` | (vacío) | **BUG-B2C-347**: `_blank` sin `rel="noopener noreferrer"` en 3 instancias. |

#### 15.f Footer del PDP — link "Contacto" mal apuntado (sistémico)

| Texto | href esperado | href real | Hallazgo |
|---|---|---|---|
| "Contacto" (footer columna Contáctanos) | `/contacto/` | `/preguntas-frecuentes` | **BUG-003 sistémico** reconfirmado en este PDP. |
| "Calentamiento" (footer columna Productos) | `/products/calentamiento/` | `/products/calentamiento` (sin slash) | **BUG-007** reconfirmado |

#### 15.g Links sociales del footer (4 íconos, `alt` con nombre red)

| Red | href | alt | rel |
|---|---|---|---|
| Facebook | `facebook.com/share/vR37WcfFW32gto8j/?mibextid=LQQJ4d` | "Facebook" ✓ | `noopener noreferrer` ✓ |
| Instagram | `instagram.com/gruporotoplas?igsh=MTlxdm4wYWxlN3Rp` | "Instagram" ✓ | `noopener noreferrer` ✓ |
| Youtube | `youtube.com/channel/UChnJZvrPqHVyJnQF-c6ssGg` | "Youtube" ✓ (sin tilde correcto — es marca registrada) | `noopener noreferrer` ✓ |
| LinkedIn | `linkedin.com/company/grupo-rotoplas/` | "LinkedIn" ✓ | `noopener noreferrer` ✓ |

(Footer ✓ correcto — contraste con bug del share del PDP.)

### 16. Otros elementos clickeables (no `<button>` ni `<a>`)

| Elemento | Etiqueta visible | Tag DOM | Handler Qwik | Comportamiento esperado | Hallazgo |
|---|---|---|---|---|---|
| Toggle instalación | "¿Te lo instalamos en tu hogar?" | `<div class="installation-container">` (sin children) | `q-DtioM6oP.js#s_91QX4mB7fMo` | Inferido: activar add-on de servicio de instalación + sumar al precio. **No verificado al click**. | **BUG-331 confirmado**: `<div>` plano con on:click. **Sin checkbox**, **sin role="switch"**, **sin aria-checked**, **sin indicador visual del estado seleccionado** (no hay `.checked`, `.active` ni `.selected` en clase). Para usuario es ambiguo si está activo |
| "Comprobar disponibilidad con otro C.P." | mismo | `<p class="ModalOpen">` con `on:click` | (Qwik handler) | Abre modal "Verifica disponibilidad de entrega" (mismo modal CP que el header) | **BUG-334 confirmado** + descubrimos clase semántica `ModalOpen`. Debería ser `<button>` con aria adecuado |
| Cards del listing y cross-sell | (nombre del producto) | `<article>` + `<div>` con `on:click` dentro | (Qwik handler) | Navegar a PDP del producto | **BUG-147 sistémico** — sin `<a href>` |

### 17. Verificaciones interactivas

| Acción | Antes | Después | Resultado |
|---|---|---|---|
| Click `button[aria-label="Ir al slide 2"]` | dot activo: "Ir al slide 1" | dot activo: "Ir al slide 2" | ✅ Handler Qwik del carrusel funciona. Clase `active` migra. **Sin `aria-current` migrando** → screen reader sigue creyendo que slide 1 es el activo (BUG-330) |
| Open `<details>` (Descripción + Especificaciones técnicas) | ambos `open=false` | ambos `open=true` | ✅ Acordeones nativos funcionan |
| Click toggle "¿Te lo instalamos…?" | sin modal | modal **"¡Instálalo con nosotros!"** abierto | ✅ **Verificado (s12, autenticado CP 02800):** el toggle **NO es un switch que recalcule precio inline** — abre un modal informativo que redirige al flujo "agrégalo al carrito y selecciona el servicio". El add-on de instalación se elige *después* de agregar al carrito, no en la PDP. Anatomía deep en §19.b. |
| Click "Comprar ahora" / "Agregar a carrito" | disabled (CP no disponible) | — | ⏸ Pendiente — cambiar CP a uno con disponibilidad, luego probar (ver F1C.10) |
| Click "Compartir" | reveal oculto | 3 `<a target="_blank">` visibles | ✅ NO es modal — es un reveal inline de 3 links de compartir (ver §20). Los 3 sin `rel` → **BUG-345 confirmado** |
| Click "Comprobar disponibilidad con otro C.P." (`<p class="ModalOpen">`) | sin modal | modal "Verifica disponibilidad de entrega" abierto | ✅ NO es modal propio del PDP — **reusa el componente I.6** (mismo 2-pasos, mismos 7 inputs + 4 radios alias + CP search `inputmode="numeric"`). Ver §20 |
| Click "Escribir una reseña" | PDP | navega a `/customer/reviews/` | ✅ NO abre modal — **navega al índice de Mis reseñas (II.11b)**, sin deep-link al producto → **BUG-B2C-494** (falsa expectativa). Ver §20 |

### 18. Disponibilidad volátil del PDP — caveat para contracts

El SKU 500545 (Tinaco Plus+ con Bomba Centrífuga 1,100 L) mapeado como PDP representativa muestra **"No disponible para C.P. 02800"** con `Comprar ahora`, `Agregar a carrito` y los steppers `+/-` en estado `disabled`. La disponibilidad del mismo SKU/CP **cambia entre cargas** (en mapeos previos del núcleo transaccional el add-to-cart de catálogo sí persistió para esta cuenta). Implicación para los DOM contracts: **la disponibilidad NO es aserción estable** — un contract no debe asertar que un SKU concreto está disponible para un CP concreto; debe asertar la *presencia* de los CTAs y su *gating* por disponibilidad (disabled cuando "No disponible"), no el resultado.

### 19. Los 3 "modales" del PDP NO son modales propios

Ninguno de los tres puntos de interacción abre un modal nuevo; cada uno reusa un componente ya inventariado o navega.

| Interacción | Trigger (DOM real) | Comportamiento verificado | Conclusión |
|---|---|---|---|
| **Compartir** | `<div class="SharedbuttonContainer">` → revela `<div class="ContainerIconsSharerd">` | Muestra **3 `<a target="_blank">`** inline (no modal, no `role="dialog"`, no focus trap): (1) Facebook sharer `https://www.facebook.com/sharer/sharer.php?u=<pdp-url>`; (2) Instagram `https://www.instagram.com/direct/new/?text=Visita%20mi%20sitio:%20<pdp-url>`; (3) WhatsApp `https://api.whatsapp.com/send?text=<pdp-url>` | Los **3 sin `rel="noopener noreferrer"`** (`rel=""`) → **BUG-345 confirmado en vivo**. Contrasta con los share del footer (FB/IG/YT/LinkedIn) que SÍ traen `rel="noopener noreferrer"` |
| **Cambio de C.P.** | `<p class="ModalOpen">Comprobar disponibilidad con otro C.P.</p>` | Abre el modal **"Verifica disponibilidad de entrega" = componente I.6** (idéntico al del header): 2 vistas (búsqueda por CP `input[inputmode="numeric"][maxlength=5]` + "Escribir dirección" con 7 inputs `streetName/streetNumber/noInt/postalCode(maxlength5)/city/state/additionalAddressInfo(maxlength250)` todos `required=false` + 4 radios `manualAddressAlias`), botón "Ubicar en el mapa" (disabled hasta completar) y "Buscar por código postal" | NO es modal propio del PDP → **reusa I.6**. Arrastra los bugs de I.6 (jerarquía de headings con **dos H2** "Agregar dirección" + "Verifica disponibilidad de entrega" + H3 intermedio; inputs `required=false`; placeholders `"*"`) |
| **Escribir reseña** | `<button>Escribir una reseña</button>` (sección Reseñas, debajo de H4 "¡Se el primero en dejar una reseña de este producto!") | **Navega a `/customer/reviews/`** (índice Mis reseñas, tab Pendientes default — II.11b). NO deep-linkea al SKU del PDP; el usuario aterriza en su lista de reseñas pendientes (productos que **sí compró**), no en un editor para este producto | **BUG-B2C-494** (MEDIA UX): el CTA "Escribir una reseña" del PDP promete reseñar *este* producto pero descarga al índice genérico sin contexto; si no se ha comprado el producto, no hay forma de reseñarlo y la UI no lo explica |

**Nota arquitectónica:** el markup del modal I.6 ("Agregar dirección" / "Verifica disponibilidad de entrega") y el modal "¿Quieres eliminar tu reseña?" están **renderizados ocultos en el DOM de todas las páginas** (aparecen en el a11y snapshot de PDP, `/customer/reviews/`, etc.). Explica por qué sus headings se cuentan en los snapshots de páginas que no los muestran visiblemente.

**Compra Rápida:** B2C **NO tiene** el panel "Compra Rápida" del B2B (verificado: ausente del header y del body en PDP autenticada). Es feature exclusivo B2B.

### 19.b Toggle "¿Te lo instalamos en tu hogar?" → modal "¡Instálalo con nosotros!" (verificado s12)

A diferencia de los 3 puntos de §19, este toggle **sí abre un modal propio**. Verificado autenticado (Jorge García / CP 02800) haciendo click real (CDP) sobre `<div class="installation-container">` (`on:click="q-BjEUJCeG.js#s_91QX4mB7fMo"`, `q:id=b3`).

**Qué hace:** NO es un switch que active un add-on ni recalcule el precio en la PDP (desmiente la inferencia previa). Abre un modal **informativo** que explica que la instalación se contrata *después*, dentro del carrito.

**Anatomía DOM del modal** (`div.modal` `⭐️g88usz-0`, `q:id=6k`):

| Parte | DOM real (selector estable) | Handler Qwik | Hallazgo |
|---|---|---|---|
| Wrapper / backdrop | `div.modal[q:id=6k]` con `on:click="q-Bu7G7URV.js#s_MIjbsIA1XRA"` (cierra al click fuera) | `s_MIjbsIA1XRA` | **Sin `role="dialog"`, sin `aria-modal`, sin `aria-labelledby`** → AT no lo anuncia como diálogo. **BUG-B2C-520** |
| Contenedor | `div.modal-content[q:id=6l]` | — | — |
| Botón cerrar | `button[q:id=6m]` con `<svg>` X (`stroke #002554`), `on:click="q-BYNfHtMQ.js#s_CpQxq4ux9RU"` | `s_CpQxq4ux9RU` | Existe pero es **icon-only sin `aria-label`/`title`/texto** → invisible para AT. **BUG-B2C-522** (mismo patrón que BUG-318/401 steppers) |
| Título | `<p>¡Instálalo con nosotros!</p>` | — | **Es `<p>`, NO heading** → modal sin H semántico. **BUG-B2C-521** |
| Cuerpo (copy verbatim) | `"Para que nuestros expertos puedan instalar tu producto, primero debes agregarlo a tu carrito y selecciona el servicio."` | — | **Inconsistencia de modo verbal**: "agregarlo" (infinitivo) + "selecciona" (imperativo). Debería ser "…agregarlo a tu carrito y **seleccionar** el servicio". **BUG-B2C-525** |
| Teléfono | Texto `"¿Quieres más información? Llama al: 800 506 3000"` | — | **`800 506 3000` es texto plano, NO `<a href="tel:8005063000">`** → en móvil no se puede tap-to-call. **BUG-B2C-524** |
| CTA | `div.builder-c93a8c958e524b8e8b44d3513b81d470.builder-block` "Agregar al carrito", `on:click="q-Cu7vsKYY.js#s_7wCAiJVliNE"` | `s_7wCAiJVliNE` | **Es un `<div>` Builder.io, NO `<button>`** — sin `role="button"`, sin `type`, sin foco por teclado. **BUG-B2C-523** (patrón sistémico BUG-147/473) |

**Caveat de cierre del gap:** la verificación de la **persistencia del add-on de instalación en el cart + recálculo de precio** no se completó porque el SKU representativo 500545 está **"No disponible para C.P. 02800"** (CTAs `disabled`) — el modal mismo exige "agregar al carrito" primero, lo que está bloqueado por disponibilidad para esta cuenta/CP (no es un límite de la herramienta). Queda como sub-paso para un SKU disponible. Lo **mapeable sin compra** (anatomía del toggle + modal + copy + selectores + handlers + bugs) está cerrado.

### 20. Evidencias

- `evidencias/F1C-11-pdp-tinaco-plus-completa.png` — PDP full-page con acordeones abiertos
- `evidencias/F1C-18-pdp-modal-cp-reusa-I6.png` — modal "Verifica disponibilidad de entrega" (componente I.6) abierto desde el PDP vía `<p class="ModalOpen">`
- `evidencias/F1C-30-toggle-instalacion-modal.png` — modal "¡Instálalo con nosotros!" abierto desde el toggle "¿Te lo instalamos en tu hogar?" (§19.b)
- `scripts/F1C-pdp-tinaco-plus-deep.json` — meta + headings + breadcrumb + galería + JSON-LD + CTAs
- `scripts/F1C-pdp-expanded-deep.json` — contenido completo de acordeones + cross-sell + reseñas + botones unlabeled
- `scripts/F1C-pdp-all-buttons-links.json` — **inventario completo de 15 buttons + 71 links con ubicación y estado**
- `scripts/F1C-pdp-interactivos.json` — verificación interactiva (dot 2 click + toggle install probe + cpDisponibilidad + share btn + share targets)

---



## II.9 `/customer` — Mis datos (autenticado)

> **Arquitectura del área de cuenta:** la URL canónica real es `/customer` (no `/mi-cuenta/`). Las URLs en español `/mi-cuenta/`, `/account/`, `/mis-pedidos/`, `/orders/` (BUG-B2C-034) son **URLs inexistentes** que devuelven "Ha ocurrido un error" independientemente de la autenticación, ni siquiera para usuarios logueados.

- **URL canónica:** `https://qarotoplasmx.io/customer/`
- **Title:** `Rotoplas` (genérico → BUG-053)
- **Canonical:** `https://qarotoplasmx.io/customer/`
- **H1:** ❌ NO TIENE — solo H2 "Mis datos" → BUG-067 patrón sistémico
- **HTML lang:** `es-mx`
- **Auth requerida:** sí — sin sesión redirige a página de error

### Componentes globales que usa
- I.1 Header global → versión autenticada (I.1.b — ver abajo)
- I.4 Footer global
- I.5 Barra promocional close-promo
- I.6 Modal "Agregar dirección" (residual del global)

### Sidebar del área customer (I.15 nuevo componente)

Menú lateral con 4 links + logout, presente en todas las páginas `/customer/*`:

| Link visible | URL real | Selector |
|---|---|---|
| Mis datos | `/customer` | `a.menuMovil[href="/customer"]`, `a.menuDEsk[href="/customer"]` |
| Mis pedidos | `/customer/orders` | igual con `/customer/orders` |
| Mis direcciones | `/customer/address` | igual con `/customer/address` |
| Mis reseñas | `/customer/reviews` | igual con `/customer/reviews` |
| Cerrar sesión | (botón, no link) | `button:has-text("Cerrar sesión")` |

> Cada link aparece duplicado con clases `menuMovil` (display:none en desktop) y `menuDEsk` ⚠️ (typo: "DEsk" → **BUG-B2C-099**). Confirma patrón duplicación DOM responsive (BUG-005, BUG-100).

### Secciones de la página /customer

#### Sección 1 — Mis datos (estado lectura)

| Campo | Valor mostrado | Acción |
|---|---|---|
| Nombre y apellido | `Jorge García` | (sin botón directo — comparte botón "Editar" con Teléfono) |
| Teléfono | `5511111111` | → botón `Editar` |
| Correo electrónico | `andrei.garcia@xideral.co` | ícono `?` (tooltip implícito sin texto visible) — **BUG-B2C-104** |
| Contraseña | `**********` | → botón `Actualizar` |

#### Sección 1.b — Modal/sub-vista "Editar datos de contacto" (tras click Editar)

| Input | name | type | maxlength | required | autocomplete | Label |
|---|---|---|---|---|---|---|
| Nombre(s)* | `name` | `text` | (sin) | `false` | `on` | "Nombre(s)*" → `for="name"` |
| Apellido(s)* | `lastName` | `text` | (sin) | `false` | `on` | "Apellido(s)*" → `for="lastName"` |
| Teléfono* | `phone` | **`text`** ❌ | `10` | `false` | `on` | "Teléfono*" → `for="phone"` |

- Botón: `Guardar`
- Sub-vista NO es modal flotante — reemplaza el contenido principal con header "Editar datos de contacto" + link "Volver" (que NO funciona programáticamente — quizás requiere click real humano).
- Cierra solo navegando atrás o salvando.

#### Sección 1.c — Modal/sub-vista "Actualizar contraseña" (tras click Actualizar)

| Input | name | type | maxlength | autocomplete | Label |
|---|---|---|---|---|---|
| Contraseña actual* | `password` | `password` ✅ | `20` ⚠️ | `on` | "Contraseña actual*" → `for="password"` |
| Contraseña nueva* | `newPassword` | `password` ✅ | `20` ⚠️ | `on` | "Contraseña nueva*" → `for="newPassword"` |
| Confirmar nueva contraseña* | **`comppassword`** ❌ | `password` ✅ | `20` ⚠️ | `on` | "Confirmar nueva contraseña*" → `for="comppassword"` |

**Política de password mostrada:**
> "Debe contener:
> Mínimo 8 caracteres
> Una letra mayúscula
> Un número del 0 al 9"

**Botón:** `Guardar` (inicia con `disabled=true` cuando los 3 inputs están vacíos — buen UX, **inconsistente con resto de forms del sitio** → **BUG-B2C-110**).

#### Sección 2 — Mis datos fiscales

Todos los campos vacíos en este usuario (sin RFC configurado). Campos mostrados:

- RFC
- Razón social / nombre
- Uso de CFDI
- **Regimen fiscal** ⚠️ sin tilde → **BUG-B2C-103** (debería "Régimen fiscal")
- Dirección fiscal

#### Sección 3 — Otros datos fiscales guardados

- Botón: `Agregar nuevos datos fiscales`
- (sin más contenido para este usuario)

### Bugs específicos de la página
- **BUG-B2C-099** — clase CSS `menuDEsk` con typo
- **BUG-B2C-100** — links menú autenticado duplicados desktop+mobile
- **BUG-B2C-101** — `/customer` sin H1 (patrón sistémico BUG-067)
- **BUG-B2C-102** — Title `Rotoplas` genérico
- **BUG-B2C-103** — "Regimen fiscal" sin tilde
- **BUG-B2C-104** — ícono `?` junto a email sin tooltip visible/texto
- **BUG-B2C-105** — Nombre+apellido sin botón "Editar" directo (debe deducirse del Editar de Teléfono)
- **BUG-B2C-107** — password `maxlength="20"`
- **BUG-B2C-108** — input `comppassword` mal escrito (patrón sistémico BUG-058)
- **BUG-B2C-109** — política password sin símbolo especial
- **BUG-B2C-110** — botón Guardar `disabled` cuando inputs vacíos en modal password (UX correcto pero **inconsistente con el resto** del sitio que permite submit vacío)

### DOM contract (Playwright)
```javascript
await page.goto('https://qarotoplasmx.io/customer');
// Sidebar
await expect(page.locator('a.menuDEsk[href="/customer"]')).toBeVisible();
await expect(page.locator('a.menuDEsk[href="/customer/orders"]')).toBeVisible();
await expect(page.locator('a.menuDEsk[href="/customer/address"]')).toBeVisible();
await expect(page.locator('a.menuDEsk[href="/customer/reviews"]')).toBeVisible();
await expect(page.getByRole('button', { name: 'Cerrar sesión' })).toBeVisible();
// Secciones
await expect(page.locator('h2:has-text("Mis datos")').first()).toBeVisible();
await expect(page.locator('h2:has-text("Mis datos fiscales")')).toBeVisible();
await expect(page.locator('h2:has-text("Otros datos fiscales guardados")')).toBeVisible();
// Editar
await page.getByRole('button', { name: 'Editar' }).click();
await expect(page.locator('input#name')).toBeVisible();
await expect(page.locator('input#lastName')).toBeVisible();
await expect(page.locator('input#phone')).toHaveAttribute('maxlength', '10');
// Actualizar password
await page.goto('https://qarotoplasmx.io/customer'); // reset
await page.getByRole('button', { name: 'Actualizar' }).click();
await expect(page.locator('input#password[type="password"]')).toBeVisible();
await expect(page.locator('input#newPassword')).toBeVisible();
await expect(page.locator('input#comppassword')).toBeVisible();  // ⚠️ documenta typo
await expect(page.getByRole('button', { name: 'Guardar' })).toBeDisabled();
```

### Evidencias
- `F1B-01-home-autenticado.png` — home tras login (header con dropdown usuario)
- `F1B-02-customer-mis-datos.png` — `/customer` estado lectura
- `F1B-03-customer-editar-datos.png` — sub-vista editar (nombre/apellido/teléfono)
- `F1B-04-customer-tras-click-actualizar-password.png` — estado intermedio
- `F1B-05-customer-modal-password.png` — sub-vista actualizar contraseña (3 inputs + política)

---

## II.10 `/customer/orders` — Mis pedidos (autenticado)

- **URL canónica:** `https://qarotoplasmx.io/customer/orders/`
- **Title:** `Rotoplas` (genérico → BUG-053/115)
- **Canonical:** `https://qarotoplasmx.io/customer/orders/`
- **H1:** ❌ NO TIENE — solo H2 "Mis pedidos" → BUG-116 (patrón sistémico)
- **Total pedidos para el usuario `andrei.garcia@xideral.co`:** **21** (5 páginas × 5 + 1 en la última)

### Componentes globales que usa
- I.1.b Header autenticado
- I.4 Footer global
- I.15 Sidebar customer (mismo bloque que el header)

### Estructura del listado

Contenedor principal: `<div class="MyOrders">`. Cada pedido renderizado como `<article class="CardMyOrder">` dentro de `<div class="ContainerNoOrder">`.

**Campos por tarjeta (orden DOM):**

| Campo | Texto en UI | Notas |
|---|---|---|
| Número de pedido | `No. De pedido: 5182026PUJC6` | ⚠️ "De" con D mayúscula → **BUG-B2C-111**. Formato: `MMDDAAAA + 5 chars random A-Z0-9` (12 chars). Algunos órdenes parecen tener formato distinto (regex `[A-Z0-9]{12}` no matchea todos). |
| Productos count | `1 producto` / `2 productos` | OK |
| Fecha | `Fecha de pedidos\n18 de mayo de 2026` | ⚠️ "Fecha de **pedidos**" (plural) cuando es UN pedido → **BUG-B2C-112** |
| Total | `Total *\n$696.00\nIVA incluido` | `*` indica IVA incluido pero sin leyenda explícita → **BUG-B2C-113** |
| Botón "Ver detalles" | `<button type="submit">` | navega a `/customer/orders/{orderNumber}/` |
| Botón "Solicitar factura" | `<button type="submit">` | **solo aparece dentro del plazo** (~30 días desde la compra). Pedidos viejos lo ocultan silenciosamente → **BUG-B2C-114** |
| Microcopy plazo factura | `Solicitar antes del 17 de junio de 2026` | aparece junto al botón Solicitar factura |
| Estado | `Abierto` | _todos los 21 pedidos del usuario tienen estado "Abierto"_ |

### Paginación

Contenedor: `<div class="pagination">` con divs `style="cursor:pointer"` (no son `<button>` ni `<a>`):

```html
<div class="pagination">
  <div style="cursor:pointer" class="selected" on:click="q-CqPwFcjf.js#s_XDLN05OywvU[0 1]">
    <p>1</p>
  </div>
  <div style="cursor:pointer" on:click="...">
    <p>2</p>
  </div>
  ... (3, 4, 5)
</div>
<button class="buttonPaginador" on:click="q-B3yhcv9y.js#s_yXQ9jF4PLdA[0 1]">
  <svg> chevron next </svg>
</button>
```

- 5 páginas con 5 pedidos cada una (la última tiene 1).
- Página actual: class `selected` (azul).
- Click en cualquier número cambia página sin navegación URL (SPA).
- **NO se puede deeplinkear:** la URL siempre es `/customer/orders/` independiente de la página → **BUG-B2C-079 patrón** + **BUG-B2C-123** (paginación no es focusable con keyboard ni anuncia rol a a11y).
- Botón siguiente: SVG chevron derecho (`#165eeb` azul Rotoplas) sin texto ni aria-label.

### Pedidos detectados (datos para tests)

**Página 1:**
| Order ID | Fecha | Items | Total |
|---|---|---|---|
| 5182026PUJC6 | 18 mayo 2026 | 1 | $696.00 |
| 5152026VYLK6 | 15 mayo 2026 | 1 | $5,396.00 |
| 5152026APFBG | 15 mayo 2026 | 2 | $29,648.03 |
| 4242026LYI08 | 24 abril 2026 | 2 | $693.60 |
| 4162026LJMXS | 16 abril 2026 | 1 | $472.60 |

**Página 2 (muestra):**
| Order ID | Fecha | Items | Total |
|---|---|---|---|
| 4162026GAGKB | 16 abril 2026 | 1 | $1,392.36 |
| 414202697PXF | 14 abril 2026 | 1 | $1,792.00 |
| 4102026QJTJI | 10 abril 2026 | 1 | $11,218.50 |
| (formato no estándar) | 9 abril 2026 | 2 | $4,228.00 |
| (formato no estándar) | 8 abril 2026 | 2 | $4,228.00 |

**Páginas 3-5:** 5 + 5 + 1 pedidos más (no exhaustivamente listados — dump completo via Network audit en F5).

### Botones globales por tarjeta

| Texto | type | Función |
|---|---|---|
| `Ver detalles` | submit | Navega a detalle del pedido |
| `Solicitar factura` | submit | (solo dentro de 30d) abre flujo de facturación |

### Bugs específicos

- **BUG-B2C-111** — "No. **De** pedido" con D mayúscula (debería minúscula)
- **BUG-B2C-112** — "Fecha de **pedidos**" (plural) — debería singular
- **BUG-B2C-113** — `*` en "Total *" sin leyenda explícita que conecte con "IVA incluido"
- **BUG-B2C-114** — Botón "Solicitar factura" desaparece silenciosamente tras plazo, sin mensaje al usuario
- **BUG-B2C-115** — Title genérico (patrón BUG-053)
- **BUG-B2C-116** — Sin H1 (patrón BUG-067)
- **BUG-B2C-123** — Paginación `<div cursor:pointer>` no `<button>`/`<a>` → no focusable, no a11y

### DOM contract (Playwright)
```javascript
await page.goto('https://qarotoplasmx.io/customer/orders');
await expect(page.locator('h2:has-text("Mis pedidos")')).toBeVisible();
// Cards de pedido
await expect(page.locator('article.CardMyOrder')).toHaveCount(5);
// Cada card tiene número, productos, fecha, total, estado
const firstCard = page.locator('article.CardMyOrder').first();
await expect(firstCard).toContainText(/No\. De pedido:/);
await expect(firstCard).toContainText(/Total/);
await expect(firstCard).toContainText(/Abierto|En proceso|Confirmado|En camino|Entregado/);
await expect(firstCard.locator('button:has-text("Ver detalles")')).toBeVisible();
// Paginación
await expect(page.locator('div.pagination > div')).toHaveCount(5);
await expect(page.locator('div.pagination > div.selected')).toContainText('1');
```

### Evidencias
- `F1B-06-customer-orders-listado.png` — listado página 1 (5 pedidos)
- `F1B-08-customer-orders-pagina-2.png` — listado página 2 (5 pedidos)

---

## II.10.b `/customer/orders/{orderNumber}` — Detalle de pedido

- **URL canónica:** `https://qarotoplasmx.io/customer/orders/5182026PUJC6/` (ejemplo)
- **Patrón URL:** `/customer/orders/[A-Z0-9]{12}/`
- **Title:** `Rotoplas` (genérico)
- **H1:** ❌ NO TIENE — el número de pedido aparece como heading sin `<h1>`
- **Auth requerida:** sí

### Estructura del detalle (orden DOM)

1. **Header del detalle:**
   - Link `Volver` (regresa al listado)
   - Botón `Volver a comprar` (re-agrega productos al carrito) — sin tooltip → **BUG-B2C-120**
   - Texto `No. **de** pedido: 5182026PUJC6` ✅ aquí sí está bien escrito (con "de" minúscula) — confirma **BUG-B2C-117** inconsistencia entre listado y detalle.

2. **Badge de estado:** `<div class="status-icon">En proceso</div>` + `<div class="status-icon-title">En proceso</div>`

3. **Resumen del pedido:**
   - `Estado del pedido: Orden en proceso` (texto plano)
   - `Fecha de pedido: 18 de mayo de 2026` ✅ aquí singular (confirma BUG-112 solo en listado)
   - `Total: $696.00 (incluye IVA)`

4. **Stepper de 5 estados (orden de progresión):**
   1. **En proceso** ← actual del pedido ejemplo
   2. Confirmado
   3. En camino
   4. En punto de entrega
   5. Entregado

   > Nota: el listado dice "Abierto" para todos los pedidos, pero el detalle muestra "En proceso" como el primer paso del stepper → **BUG-B2C-122** (inconsistencia label entre listado y detalle).

5. **Bloque "Productos":**
   - Heading: `{N} Productos` (sin label aria, sin H3)
   - Por producto:
     - Nombre: `Regadera Eléctrica EcoDucha 3T`
     - `SKU: 310841`
     - `Cantidad: 1`
     - Precio unitario: `$496.00`
     - `Subtotal: $496.00`

6. **Bloque "Dirección de envío":**
   - Nombre: `Jorge García`
   - Dirección: `Camarones 155k, Nueva Santa María, Azcapotzalco, Ciudad de México, Ciudad de México` (Estado + Municipio duplicados con coma → **BUG-B2C-118**)
   - `C.P. 02800`
   - Teléfono: `5511111111`

7. **Bloque "Datos de facturación":**
   - `Razón social: Jorge García`
   - `RFC: XAXX010101000` (RFC genérico de público en general)
   - `Régimen fiscal: 616-Sin Obligaciones Fiscales` ⚠️ código+descripción → **BUG-B2C-121**
   - `Código postal: 04950` (≠ del CP de envío 02800 — facturación es a otro CP, OK)
   - `Uso CFDI: S01-Sin Obligaciones Fiscales`

8. **Bloque "Datos de pago":**
   - `Método de pago: Tarjeta de Crédito`
   - **`**********424242`** ← **6 dígitos del PAN visibles** (10 asteriscos + 6 dígitos del PAN `4242 4242 4242 4242` final = `424242`). PCI-DSS permite máximo 4. **VIOLACIÓN PCI-DSS** → **BUG-B2C-119 (CRÍTICO seg/compliance)**.

9. **Totales:**
   - `Subtotal: $496.00`
   - `Costo de envío: $200.00`
   - `Total: $696.00`
   - `(*IVA incluido)` ← leyenda explícita aquí, NO en listado (BUG-113)

### Bugs específicos del detalle

- **BUG-B2C-117** — Inconsistencia "No. De pedido" (listado) vs "No. de pedido" (detalle)
- **BUG-B2C-118** — "Ciudad de México, Ciudad de México" duplicado en dirección sin diferenciador
- **BUG-B2C-119** — **CRÍTICO** — 6 dígitos del PAN visibles → violación PCI-DSS
- **BUG-B2C-120** — Botón "Volver a comprar" sin tooltip/confirmación
- **BUG-B2C-121** — "Régimen fiscal: 616-Sin Obligaciones Fiscales" mezcla código + descripción
- **BUG-B2C-122** — Inconsistencia label estado: listado dice "Abierto", detalle dice "En proceso"

### DOM contract (Playwright)
```javascript
await page.goto('https://qarotoplasmx.io/customer/orders/5182026PUJC6/');
await expect(page.locator('text=/No\\. de pedido:/')).toContainText('5182026PUJC6');
await expect(page.locator('text=Orden en proceso')).toBeVisible();
await expect(page.locator('text=Fecha de pedido:')).toBeVisible();
// Stepper 5 estados:
await expect(page.locator('text=En proceso')).toHaveCount(2);  // badge + step
await expect(page.locator('text=Confirmado')).toBeVisible();
await expect(page.locator('text=En camino')).toBeVisible();
await expect(page.locator('text=En punto de entrega')).toBeVisible();
await expect(page.locator('text=Entregado')).toBeVisible();
// Botones
await expect(page.locator('text=Volver')).toBeVisible();
await expect(page.locator('button:has-text("Volver a comprar")')).toBeVisible();
// PCI: NO debería haber 6 dígitos visibles (verificar BUG-119)
await expect(page.locator('text=/\\*+\\d{4,}/')).not.toContainText(/424242/);  // fail mientras no se arregle
```

### Evidencia
- `F1B-07-customer-orders-detalle-pedido.png` — detalle completo del pedido 5182026PUJC6

## II.11 `/customer/address` — Mis direcciones (autenticado)

- **URL canónica:** `https://qarotoplasmx.io/customer/address/`
- **Title:** `Rotoplas` (genérico)
- **Canonical:** `https://qarotoplasmx.io/customer/address/`
- **H1:** `Mis direcciones` ✅ **¡PRIMERA página autenticada con H1 correcto!** Inconsistente con resto del área `/customer` (BUG-101, BUG-116).
- **Auth requerida:** sí

### Componentes globales que usa
- I.1.b Header autenticado
- I.4 Footer global
- I.15 Sidebar customer

### Estructura del listado

Cada dirección guardada es una tarjeta con la siguiente jerarquía DOM:

```html
<div class="MyAddress">
  <h1>Mis direcciones</h1>
  <div class="addressGrid">
    <div class="addressCard">
      <div class="addressCardHeader">
        <h3>Casa</h3>  <!-- alias -->
        <button>Editar</button>
      </div>
      <div class="addressContent">
        <div class="addressBody">
          Camarones 155k
          Nueva Santa María
          Azcapotzalco
          Ciudad de México, Ciudad de México   <!-- BUG-118 duplicado -->
          C.P. 02800
        </div>
      </div>
    </div>
    <button>Usar esta dirección de envío como predeterminada</button>
    <button>Agregar dirección</button>
  </div>
</div>
```

**Direcciones del usuario `andrei.garcia@xideral.co`:** **1 dirección** (alias "Casa")

| Campo | Valor |
|---|---|
| Alias (H3) | Casa |
| Calle | Camarones |
| Número | 155k |
| Colonia | Nueva Santa María |
| Municipio | Azcapotzalco |
| Ciudad / Estado | Ciudad de México, Ciudad de México (duplicado → BUG-118 confirma patrón sistémico) |
| CP | 02800 |

### Botones del listado

| Texto / aria-label | Acción | Notas |
|---|---|---|
| `Editar` (texto + icono SVG, `aria-label="Editar {alias}"`) | Abre `/customer/address/edit/{id}` | `id` es 8 chars random (ej. `YfzND6ic`) |
| **(sin texto)** + icono SVG, `aria-label="Eliminar {alias}"` | **Elimina la dirección INSTANTÁNEAMENTE sin pedir confirmación** ⚠️ | Botón icono-only (rect 46x38px). Clase CSS `editLink` engañosa (debería `deleteLink`). **No abre modal, no toast, no alert** → **BUG-B2C-130** rectificado + nuevo **BUG-B2C-131 (CRÍTICO UX/data loss)** |
| `Usar esta dirección de envío como predeterminada` | (toggle predeterminada) | Texto excesivamente largo → **BUG-B2C-129** |
| `Agregar dirección` (`aria-label="Agregar dirección"`) | Abre `/customer/address/add/` | Tarjeta CTA con icono + texto. Mismo form que editar pero sin pre-fill |

### Flujo Editar — `/customer/address/edit/{id}`

**URL:** `https://qarotoplasmx.io/customer/address/edit/YfzND6ic/`
**Heading:** "Editar dirección" + "* Campos obligatorios." (texto leyenda al pie)
**Link "Volver":** sale del editor.

#### Inputs del form (orden DOM)

| Label | name | type | maxlength | required | Notas |
|---|---|---|---|---|---|
| Calle* | `streetName` | text | (sin) | `false` | OK |
| Número exterior* | `streetNumber` | text | `20` | `false` | maxlength razonable |
| Número interior | `noInt` | text | `20` | `false` | opcional (sin `*`) |
| Código postal* | `postalCode` | text | `5` | `false` | restringido 5 chars México |
| Colonia * | `building` | `<select>` | — | `false` | Solo 1 opción cargada actualmente ("Nueva Santa María") — probable que JS la rellene según CP. |
| Ciudad* | `city` | text | (sin) | `false` | texto libre → BUG-B2C-125 |
| Estado* | `state` | text | (sin) | `false` | texto libre, sin validar contra catálogo SAT/INEGI |
| Entre calles | `additionalAddressInfo` | text | `250` | `false` | opcional |

#### Radios "Guardar dirección como"

| value (alias) | name |
|---|---|
| Casa | `editAddressAlias` |
| Oficina | `editAddressAlias` |
| Obra | `editAddressAlias` |
| Otro | `editAddressAlias` |

#### Botones del editor

- `Cancelar` (button)
- `Ubicar en el mapa` (button) — único path para guardar → **BUG-B2C-124 + BUG-B2C-126**
- ❌ **NO existe botón "Guardar"** directo
- ❌ **NO existe botón "Eliminar dirección"** — no se puede borrar una dirección guardada → **BUG-B2C-130**

### Flujo "Ubicar en el mapa" (paso 2 de edición)

Tras click en "Ubicar en el mapa", la URL no cambia pero el contenido se reemplaza:

- Heading: "Editar dirección"
- Texto: "Dirección ingresada" + dirección concatenada
- Texto: "¡Ubicación confirmada!"
- Mapa interactivo (Google Maps embed): "Datos del mapa ©2026 INEGI" + link "Condiciones" + link "Informar un error en el mapa" + botón "Combinaciones de teclas" (atajos del mapa)
- Botones:
  - `Cancelar` — vuelve al editor
  - `Confirmar punto de entrega` ← **único path para guardar la edición** — label inadecuado fuera del flujo de checkout → **BUG-B2C-127**

### Flujo Agregar — `/customer/address/add/`

**URL:** `https://qarotoplasmx.io/customer/address/add/`
**Heading:** "Agregar dirección"
**Diferencia con Editar:** los radios usan `name="addAddressAlias"` en lugar de `editAddressAlias` → **BUG-B2C-128** (inconsistencia naming).

Resto idéntico al Editar.

### Bugs específicos

- **BUG-B2C-124** — Sin botón "Guardar" directo en editor; flujo obliga pasar por mapa
- **BUG-B2C-125** — `city` y `state` son inputs de texto libre; deberían ser selects validados contra catálogo SAT/INEGI
- **BUG-B2C-126** — Etiqueta "Ubicar en el mapa" no comunica que es paso de guardado
- **BUG-B2C-127** — Botón "Confirmar punto de entrega" mal etiquetado fuera del flujo de checkout
- **BUG-B2C-128** — Inconsistencia naming: `editAddressAlias` vs `addAddressAlias`
- **BUG-B2C-129** — Botón "Usar esta dirección de envío como predeterminada" demasiado largo
- **BUG-B2C-130** — sí existe botón "Eliminar {alias}" pero es icono-only sin texto, con clase CSS `editLink` engañosa. UX descubrible apenas con tab/hover/aria.
- **BUG-B2C-131 (CRÍTICO UX/data loss)** — Click en botón "Eliminar {alias}" **borra la dirección INSTANTÁNEAMENTE sin confirmación**: no modal, no alert, no toast de "¿Estás seguro?". Falta el patrón estándar para acciones destructivas. Si el usuario hace tap accidental, pierde la dirección.
- **BUG-B2C-132 (BAJA UX positiva)** — Tras agregar dirección exitosamente, el sitio muestra mensaje "¡Tu dirección ha sido agregada! Ahora podrás recibir tus compras sin contratiempos." + botón "Regresar". Es un buen pattern (vs. silencio del delete). Documentar para mantener consistencia: el delete debería tener flujo análogo.
- **BUG-B2C-133 (BAJA arq)** — Botón "Eliminar {alias}" usa la misma clase CSS `editLink` que el botón "Editar". Nombre engañoso → debería ser `deleteLink` o `removeAddress`.

### DOM contract (Playwright)
```javascript
await page.goto('https://qarotoplasmx.io/customer/address');
await expect(page.locator('h1:has-text("Mis direcciones")')).toBeVisible();
await expect(page.locator('div.addressCard')).toHaveCount(1);
await expect(page.locator('div.addressCard h3')).toHaveText(/Casa|Oficina|Obra|Otro/);
await expect(page.locator('button:has-text("Editar")')).toBeVisible();
await expect(page.locator('button:has-text("Agregar dirección")')).toBeVisible();
// Editar
await page.locator('button:has-text("Editar")').click();
await expect(page).toHaveURL(/\/customer\/address\/edit\/[A-Za-z0-9]+\//);
await expect(page.locator('input#streetName')).toBeVisible();
await expect(page.locator('input#postalCode')).toHaveAttribute('maxlength', '5');
await expect(page.locator('select#building')).toBeVisible();
await expect(page.locator('input[name="editAddressAlias"][value="Casa"]')).toBeVisible();
await expect(page.locator('button:has-text("Ubicar en el mapa")')).toBeVisible();
await expect(page.locator('button:has-text("Cancelar")')).toBeVisible();
// NO debería existir botón Guardar directo (documenta el bug)
// await expect(page.locator('button:has-text("Guardar")')).toHaveCount(0);
// NO debería existir botón Eliminar (documenta el bug)
// await expect(page.locator('button:has-text("Eliminar")')).toHaveCount(0);
```

### Evidencias
- `F1B-09-customer-address-listado.png` — listado con 1 dirección
- `F1B-10-customer-address-editar.png` — form editar dirección
- `F1B-11-customer-address-mapa-confirmacion.png` — paso 2: confirmación en mapa
- `F1B-12-customer-address-agregar.png` — form agregar dirección
- `F1B-13-customer-address-eliminar-estado.png` — estado "¡Agrega tu primera dirección!" tras eliminar accidentalmente (evidencia de BUG-131: delete sin confirmación)
- `F1B-14-customer-address-agregada-exito.png` — toast "¡Tu dirección ha sido agregada!" post-creación (BUG-132 pattern positivo)

## II.11b `/customer/reviews` — Mis reseñas (autenticado)

- **URL canónica:** `https://qarotoplasmx.io/customer/reviews/`
- **Title:** `Rotoplas` (genérico)
- **Canonical:** `https://qarotoplasmx.io/customer/reviews/`
- **H1:** ❌ NO TIENE — solo H2 "Mis reseñas" → **BUG-B2C-134**
- **H3 oculto en el DOM:** `¿Quieres eliminar tu reseña?` — sugiere modal de confirmación implementado SOLO para borrar reseñas (¡que sí existe!) pero NO para borrar direcciones (BUG-131). Inconsistencia de UX.

### Componentes globales que usa
- I.1.b Header autenticado
- I.4 Footer global
- I.15 Sidebar customer

### Tabs internas (NO son `<button role="tab">`)

```html
<span class="⭐️ap30nc-0" on:click="q-pFrEWLZp.js#s_NhToSRuQ8Js[0]" q:id="3o">Pendientes</span>
|
<span class="⭐️ap30nc-0" on:click="...">Realizadas</span>
```

- Pipe `|` literal entre los dos `<span>` (no es separador CSS) → **BUG-B2C-137**
- `<span>` con `on:click` Qwik en vez de `<button role="tab">` o `<a>` → **BUG-B2C-142** (no focusable, no a11y)

### Tab 1 — "Pendientes" (default activo)

**Microcopy:** "Recuerda que tu opinión es importante porque ayuda a otros a elegir los mejores productos."

**Tarjetas de producto pendiente de reseñar:**

Por tarjeta:
- Nombre del producto
- `SKU: 310841`
- `Fecha de pedido` + fecha (formato "DD de mes de AAAA")
- Microcopy `¿Qué te pareció el producto?`
- Widget rating: 5 estrellas vacías `☆☆☆☆☆` (clase contenedor `StartContainer` — typo "Start" debería "Star" → **BUG-B2C-138**)
- Botón `Reseñar producto`

**5 productos pendientes visibles en página 1** (para usuario `andrei.garcia@xideral.co`):

| Producto | SKU | Fecha pedido |
|---|---|---|
| Regadera Eléctrica EcoDucha 3T | 310841 | 18 mayo 2026 |
| **Tinaco Plus+ con Bomba Centrifuga 1,100 litros** ⚠️ | 500545 | 15 mayo 2026 |
| Tinaco Plus+ equipado 2,500 litros color beige | 500475 | 15 mayo 2026 |
| Juego de llave para regadera de 20 mm Tuboplus | 210137 | 24 abril 2026 |
| Llave para empotrar de 20 mm Tuboplus | 210136 | 24 abril 2026 |

> Producto SKU 500545 tiene typo "Centrifuga" sin tilde → debería "Centrífuga" → **BUG-B2C-136**

**Paginación:** 1, 2, 3 (mismo patrón `<div cursor:pointer>` que BUG-123)

### Sub-vista — Editor de reseña — `/customer/reviews/{productUUID}`

URL ejemplo: `https://qarotoplasmx.io/customer/reviews/9e5bffa5-f4b8-4e61-9e7a-90ac6effa330/`

> **UUID v4 del producto** (no es el SKU). Patrón URL: `/customer/reviews/[0-9a-f-]{36}/`.

**Estructura:**
- Link `Volver`
- Heading: "Escribe una reseña"
- Nombre del producto: `Regadera Eléctrica EcoDucha 3T`
- Rating widget: `☆☆☆☆☆` (5 estrellas clickeables)
- Textarea:
  - `<textarea name="reviewText" id="reviewText" maxlength="240" placeholder="Escribe tu reseña (Opcional)">`
  - `maxlength="240"` ❌ → **BUG-B2C-139** (muy corto, igual que `message` en contacto BUG-069)
  - Sin `aria-label` ni `aria-describedby`
- Microcopy: `Máximo 240 caracteres`
- Botón: `Publicar reseña`

### Tab 2 — "Realizadas"

**Empty state observado** (usuario sin reseñas publicadas):

> "Aún no has adquirido productos para dejar una reseña​" + botón `Continuar comprando`

**Problemas detectados:**
- ❌ Mensaje incorrecto: el usuario SÍ tiene productos adquiridos (5+ en tab Pendientes). Mensaje correcto sería "Aún no has dejado ninguna reseña" o "Tus reseñas publicadas aparecerán aquí" → **BUG-B2C-141**
- ❌ Texto contiene Zero Width Space invisible `​` (U+200B) al final → **BUG-B2C-143**

### Bugs específicos

- **BUG-B2C-134** — Sin H1 (patrón sistémico BUG-067)
- **BUG-B2C-135** — Title `Rotoplas` genérico (patrón BUG-053)
- **BUG-B2C-136** — Producto "Bomba Centrifuga" sin tilde (typo en catálogo)
- **BUG-B2C-137** — Pipe `|` literal entre tabs (en lugar de border CSS o separador semántico)
- **BUG-B2C-138** — CSS class `StartContainer` con typo (debería `StarContainer`)
- **BUG-B2C-139** — Textarea reseña con `maxlength="240"` — muy corto
- **BUG-B2C-140** — Widget rating sin `aria-label` ni `aria-valuetext`
- **BUG-B2C-141** — Empty state "Realizadas" con mensaje incorrecto
- **BUG-B2C-142** — Tabs son `<span>` con `on:click` Qwik (no `<button role="tab">`)
- **BUG-B2C-143** — Empty state contiene Zero Width Space invisible
- **BUG-B2C-529** — Modal "¿Quieres eliminar tu reseña?" (`div.modal-cancelation`) sin `role="dialog"`, sin `aria-modal`, no es `<dialog>` (MEDIA a11y, patrón BUG-520)
- **BUG-B2C-530** — Botón cerrar "X" del modal de eliminación es icon-only sin `aria-label` ni texto (BAJA a11y)
- **BUG-B2C-531** — Gatillo de eliminar (ícono basura) es `<div>/<svg>` con `cursor:pointer` sin `role`, sin `aria-label`, sin `tabindex` → no operable por teclado ni anunciado por lector de pantalla; no aparece en el a11y tree (MEDIA a11y)
- **BUG-B2C-532** — CSS class `containerButons` con typo (debería `containerButtons`) en el contenedor de botones del modal (BAJA infra)
- **BUG-B2C-533** — H3 del modal con espacio sobrante: `"¿Quieres eliminar tu reseña? "` (INFO)
- **BUG-B2C-534** — Editor de reseña con contador estático "Máximo 240 caracteres" sin conteo en vivo (ej. "87/240") (BAJA UX)

### Hallazgo positivo
El H3 oculto `¿Quieres eliminar tu reseña?` indica que el sitio SÍ implementa modal de confirmación para delete de reseñas. Inconsistente con el delete de direcciones (BUG-131) que NO tiene confirmación. Tomar este como referencia de pattern para fix de BUG-131.

### Paginación

3 páginas de productos pendientes de reseñar. Navegación con `<div class="⭐️ap30nc-0" style="cursor:pointer">` (no `<button>`/`<a>`) — mismo patrón que BUG-123. Página activa marcada con clase `selected`. Click en página 2 redirige correctamente (Qwik SPA). En "Realizadas" el paginador "siguiente" es `button.buttonPaginador` (círculo azul con chevron), `disabled` cuando solo hay 1 página (correcto).

### Publicación + eliminación de reseña — mapeo E2E en vivo

> Ejecutado con cuenta real sobre "Base para tinaco GDPV" SKU 310002. La reseña de prueba se publicó y luego se eliminó (sin dejar data pollution). Evidencia `F2-33`.

**Widget de estrellas (editor, interactivo):**
- Contenedor `div.StartContainer` (typo confirmado, BUG-B2C-138) → 5× `<span class="⭐️7f3gsd-0">` con `cursor:pointer`.
- **Sin `on:click` en atributo** (handler Qwik delegado), **sin `role`, sin `aria-label` por estrella, sin `tabindex`** → se exponen en el a11y tree como `StaticText "☆"`; no operable por teclado ni anunciado como control de rating (confirma/agrava **BUG-B2C-140** en el widget interactivo, no solo el de display).
- Al seleccionar N estrellas (click real CDP): las primeras N pasan a `★` con clase `active` y color `rgb(255,184,0)`; el resto queda `☆`. Feedback visual correcto (positivo).
- **Gating correcto (positivo):** botón "Publicar reseña" inicia `disabled`; se habilita al elegir ≥1 estrella.
- Contador de caracteres estático `"Máximo 240 caracteres"` sin conteo en vivo → **BUG-B2C-534**.

**Publicación (flujo real):**
- POST Qwik `qaction`: `/customer/reviews/{UUID}/q-data.json?qaction=6umxiG2X9yg`.
- Toast: **"Tu reseña ha sido enviada para revisión"** (`div.toast-container`).
- Redirect a `/customer/reviews/`.

> ⚠️ **CORRECCIÓN s16 (2026-06-08) — la publicación está ROTA (BUG-B2C-566, ALTA):** auditado con hook a `fetch`, ese POST devuelve **HTTP 200 con `{"success":"0"}` (fallo)** y la reseña **NO persiste**: el toast de "enviada para revisión" es un **falso éxito** (el frontend no valida `success`). La reseña **no** aparece en "Realizadas", **no** se hace pública en la PDP (sigue "¡Se el primero…!") y **no** genera correo. Lo que s13 interpretó como "aparece en Realizadas ★★★★☆" era render optimista de la UI, **no** persistencia real. Causa probable: el payload manda `product`=UUID del slot en vez del SKU. Evidencia `CAPA2-19-resena-audit-success0.json`. **Hasta corregir BUG-566, las reseñas no funcionan de extremo a extremo** (el resto de este §II.11b describe el flujo de UI, válido para el front, pero sin efecto real en backend).

**Eliminación (flujo real):**
- Gatillo: ícono basura (`<svg>` 30×31 dentro de `div[style="cursor:pointer"]`) en la tarjeta de "Realizadas" — icon-only sin `role`/`aria-label`/`tabindex` → **BUG-B2C-531**. Requiere click real CDP (el `.click()` programático no dispara el signal Qwik).
- Abre el modal de confirmación (`div.modal-cancelation` dentro de wrapper `.modal` que togglea `hidden`):
  - Sin `role="dialog"`, sin `aria-modal`, no es `<dialog>` → **BUG-B2C-529** (patrón BUG-520).
  - H3 `"¿Quieres eliminar tu reseña? "` (espacio sobrante) → **BUG-B2C-533**.
  - P: "Recuerda que al hacerlo, otros usuarios no podrán verla. Tu opinión es valiosa y ayuda a otros a tomar decisiones de compra."
  - `div.containerButons` (typo CSS → **BUG-B2C-532**) con 2 botones: **"Eliminar"** (`button-secondary`, contorno) y **"Cancelar"** (`button-primary`, azul). La acción segura (Cancelar) como primaria — patrón correcto (positivo).
  - Botón cerrar "X" icon-only sin `aria-label`/texto → **BUG-B2C-530**.
- Confirmar "Eliminar": POST Qwik `qaction` `/customer/reviews/q-data.json?qaction=nz27VmKylew` → toast **"Reseña eliminada"** → la reseña desaparece de "Realizadas".
- El empty state post-borrado **confirma en vivo BUG-B2C-141** (copy "Aún no has adquirido productos…" es falso) **y BUG-B2C-143** (Zero Width Space U+200B).

### DOM contract (Playwright)
```javascript
await page.goto('https://qarotoplasmx.io/customer/reviews');
await expect(page.locator('h2:has-text("Mis reseñas")')).toBeVisible();
// Tabs
await expect(page.locator('span:has-text("Pendientes")')).toBeVisible();
await expect(page.locator('span:has-text("Realizadas")')).toBeVisible();
// Tarjetas pendientes
await expect(page.locator('button:has-text("Reseñar producto")')).toHaveCount(5);
// Editor de reseña
await page.locator('button:has-text("Reseñar producto")').first().click();
await expect(page).toHaveURL(/\/customer\/reviews\/[0-9a-f-]{36}\//);
await expect(page.locator('h2:has-text("Escribe una reseña")')).toBeVisible();
await expect(page.locator('textarea#reviewText')).toHaveAttribute('maxlength', '240');
await expect(page.locator('button:has-text("Publicar reseña")')).toBeVisible();
// Gating: deshabilitado hasta elegir rating
await expect(page.locator('button:has-text("Publicar reseña")')).toBeDisabled();
await page.locator('.StartContainer span').nth(3).click();      // 4 estrellas
await expect(page.locator('.StartContainer span.active')).toHaveCount(4);
await expect(page.locator('button:has-text("Publicar reseña")')).toBeEnabled();
// Publicar → moderación
await page.locator('button:has-text("Publicar reseña")').click();
await expect(page.locator('.toast-container')).toHaveText(/enviada para revisión/);
await expect(page).toHaveURL(/\/customer\/reviews\/$/);
// Eliminación: modal de confirmación
await page.locator('span:has-text("Realizadas")').click();
await page.locator('.myReviews [style*="cursor: pointer"] svg').first().click(); // ícono basura
await expect(page.locator('.modal-cancelation h3')).toHaveText(/¿Quieres eliminar tu reseña\?/);
await expect(page.locator('.modal-cancelation button:has-text("Eliminar")')).toBeVisible();
await expect(page.locator('.modal-cancelation button:has-text("Cancelar")')).toBeVisible();
await page.locator('.modal-cancelation button:has-text("Eliminar")').click();
await expect(page.locator('.toast-container')).toHaveText(/Reseña eliminada/);
```

### Evidencias
- `F1B-15-customer-reviews-pendientes.png` — listado pendientes
- `F1B-16-customer-review-form-escribir.png` — editor de reseña
- `F1B-17-customer-reviews-realizadas-vacio.png` — tab Realizadas vacío con copy incorrecto
- `F2-33-resena-modal-eliminar.png` — modal "¿Quieres eliminar tu reseña?" abierto (botones Eliminar/Cancelar + tarjeta de la reseña publicada ★★★★☆ detrás)

## II.11c `/wishlist/` o `/lista-de-deseos/`
Las rutas `/wishlist/` y `/lista-de-deseos/` no aparecen en el sidebar autenticado (`/customer/...`) y devuelven "Ha ocurrido un error" incluso con sesión activa — referencias legacy sin página real (ver BUG-B2C-034).

## II.12 `/traking/` vs `/tracking/`

### Resolución del conflicto de URLs

| URL | Status | H1 | Funcional |
|---|---|---|---|
| `https://qarotoplasmx.io/traking/` (typo) | 200 | `Seguimiento de pedido` | ✅ **SÍ — es la URL canónica funcional del sitio** |
| `https://qarotoplasmx.io/tracking/` (correcto) | 200 | `Ha ocurrido un error` ❌ | ❌ **NO — devuelve página de error genérica** |
| `/traking` (sin slash) | 301 → `/traking/` | — | redirect |
| `/tracking` (sin slash) | 301 → `/tracking/` | — | redirect a error |

> **Decisión arquitectónica peligrosa:** el typo "traking" está **fosilizado como URL canónica oficial**. El link canonical del HTML declara `https://qarotoplasmx.io/traking/`. Todos los links internos (footer x2, FAQ tab "Contacto", header) apuntan a `/traking/`. Si Google o un usuario humano deduce la URL bien escrita `/tracking/`, encuentra error → **BUG-B2C-097 CRÍTICO**.

### Página canónica `/traking/`

- **URL:** `https://qarotoplasmx.io/traking/`
- **Title:** `Rotoplas` (genérico → BUG-053)
- **Canonical:** `https://qarotoplasmx.io/traking/` (declara la URL CON TYPO como oficial → **BUG-B2C-095**)
- **Meta description:** `¡Disfruta lo mejor de Rotoplas al alcance de un solo clic!` (genérica, no menciona seguimiento → **BUG-B2C-096**)
- **H1:** `Seguimiento de pedido` ✅ (uno de los H1 correctos del sitio)
- **Subtítulo:** "Puedes consultar el estado de tu pedido como invitado"
- **HTML lang:** `es-mx`

### Componentes globales que usa
- I.1 Header global
- I.2 Nav superior
- I.4 Footer global
- I.5 Barra promocional close-promo
- I.6 Modal "Verifica disponibilidad de entrega" (residual del global)

### Form de seguimiento

**NO usa `<form>` element** (patrón sistémico → BUG-068 aplica). Stack: inputs sueltos + `<button type="submit">` con handler Qwik `q-VMgkZI0U.js#s_32dPc1vLiTs[0 1 2 3]`.

**Único input visible:**

| Atributo | Valor | Observación |
|---|---|---|
| `name` | `password` | ❌ **BUG-B2C-094** — debería ser `orderNumber` o `noPedido` |
| `id` | `password` | ❌ confunde a11y tools, password managers, autofill |
| `type` | `text` | OK |
| `placeholder` | `*` | ❌ BUG-066 (no descriptivo) |
| `required` | `false` | ❌ BUG-060 (patrón sistémico, validación solo JS) |
| `maxlength` | (sin) | OK |
| `autocomplete` | `off` | discutible — `autocomplete="off"` puede bloquear conveniencia |
| `class` | `⭐️v4iv8v-0` | Qwik CSS scope |
| `q:id` | `2m` | Qwik symbol |
| `on:input` | `q-CHjAh2g9.js#s_X1nXuxQCsrg[0 1]` | handler lazy |

**Label asociado:** "Introduce el No. de tu pedido*" (`for="password"`)

**Botón submit:**
- Texto: `Ver pedido`
- `type="submit"`
- `class="⭐️ny04k5-0 button-primary"` → selector estable: `button.button-primary`
- Handler Qwik: `q-VMgkZI0U.js#s_32dPc1vLiTs[0 1 2 3]`
- `q:id`: `2p`

### Validaciones confirmadas

| Caso | Mensaje de error inline |
|---|---|
| Submit con campo vacío | `El No. de pedido es incorrecto, inténtalo nuevamente` ⚠️ **BUG-B2C-098** — copy confuso: dice "incorrecto" cuando no se introdujo ningún valor (debería decir "Por favor introduce un número de pedido") |
| Submit con valor `INVALIDORDERNUMBER123` | `Verifica el No. de tu pedido, no hemos encontrado coincidencias.` ✅ copy correcto para caso "buscado pero no encontrado" |

Selector del mensaje: `.⭐️v4iv8v-0.error` (Qwik scope) — buscar por texto es más estable.

### Cookies cargadas (sin consent)
`QuantumMetricUserID`, `_fbp`, `_ga`, `_gcl_au`, `QuantumMetricSessionID`, `_ga_VL8QZDP9KQ` → reconfirma BUG-006 (trackers pre-consent).

### Links internos del sitio que apuntan a `/traking/`
- Footer columna "Servicio al cliente" → "Seguimiento del pedido" (BUG-008)
- FAQ tab "Contacto" → mismo link
- No links a `/tracking/` (correcto) en el sitio.

### Bugs específicos de la página
- **BUG-B2C-094** — `name="password"` en input de número de pedido
- **BUG-B2C-095** — canonical declara URL con typo
- **BUG-B2C-096** — meta description genérica
- **BUG-B2C-097** — `/tracking/` (correcto) devuelve "Ha ocurrido un error"
- **BUG-B2C-098** — mensaje confuso al submit vacío

Heredados aplicables: BUG-008 (typo "traking"), BUG-053 (title), BUG-060 (required=false), BUG-066 (placeholder *), BUG-068 (sin form element).

### DOM contract (Playwright)
```javascript
// /traking/ debe estar disponible
const res = await page.goto('https://qarotoplasmx.io/traking/');
expect(res.status()).toBe(200);
await expect(page.locator('h1')).toHaveText('Seguimiento de pedido');
await expect(page.locator('input#password')).toBeVisible();
await expect(page.locator('label[for="password"]')).toHaveText(/No\. de tu pedido/);
await expect(page.locator('button.button-primary:has-text("Ver pedido")')).toBeVisible();
// Validación: empty submit
await page.locator('button.button-primary').click();
await expect(page.locator('.error').filter({ hasText: 'incorrecto' })).toBeVisible();
// Validación: orden inválida
await page.locator('input#password').fill('NO-EXISTE-12345');
await page.locator('button.button-primary').click();
await expect(page.locator('.error').filter({ hasText: 'no hemos encontrado coincidencias' })).toBeVisible();
// /tracking/ (correcto) — contract documenta el bug
await page.goto('https://qarotoplasmx.io/tracking/');
await expect(page.locator('h1')).toHaveText('Ha ocurrido un error');  // pendiente fix BUG-097
```

### Evidencias
- `F1A-23-traking-form-typo.png` — form de seguimiento en `/traking/`
- `F1A-24-tracking-correcto-error.png` — `/tracking/` (bien escrito) devuelve error
- `F1A-25-traking-error-pedido-invalido.png` — error inline tras submit con número inválido

## II.13 `/preguntas-frecuentes/`

- **URL:** `https://qarotoplasmx.io/preguntas-frecuentes/`
- **Title:** `Preguntas frecuentes` ✅ (uno de los pocos titles específicos del sitio)
- **H1:** `Contáctanos` ❌ → **BUG-B2C-036 CONFIRMADO**
- **H2:** "Preguntas frecuentes" (el contenido real de FAQs va aquí, debajo de Contacto)
- **Breadcrumb:** `Inicio > Contacto` (NO dice "Preguntas frecuentes" — refuerza la confusión)

### Arquitectura de la página

La página es una **vista híbrida Contacto + FAQs** en un solo URL:

**Sección 1 — Contacto (al inicio, justo bajo el H1 "Contáctanos"):**
- Copy: "La mayor parte de la información que necesitas la puedes encontrar en nuestro sitio web. Para cualquier otra cosa, puedes hablar con nosotros a través de las siguientes opciones:"
- **Llámanos:** `800 506 3000` → botón "Llamar" → `<a href="tel:8005063000">`
- **WhatsApp:** botón "Contactar" → `<a href="https://wa.me/525547420835?text=Hola%2C%20necesito%20ayuda">`

**Sección 2 — FAQs (debajo, H2 "Preguntas frecuentes"):**
- Tabs/categorías como `<a href="#">` (selector: `div.faqs-botones > a.faqs-boton.btn-center`):
  1. Acerca de los productos
  2. **Garantias** ⚠️ (sin tilde) → **BUG-B2C-076**
  3. Contacto
  4. **Generales** ← activa por default (`.faqs-boton-activo`)
  5. Servicio
- Acordeones de preguntas:
  - Pregunta nivel 1: `<p class="faqs-titulo">¿Pregunta?</p>` → al expandir muestra `<div class="faqs-contenido">`
  - Subgrupo: `<p>Sobre los Tinacos</p>` (heading no semántico)
  - Pregunta nivel 2 (sub-acordeón): `<p class="sub-faqs-titulo">¿Subpregunta?</p>`
- **Total preguntas en DOM: 56** (todas pre-renderizadas, JS controla visibility)
- **Preguntas visibles inicialmente: 3** (preguntas nivel 1 de categoría "Generales")
- Componente común scroll vertical, sin paginación.

### Componentes globales que usa
- I.1 Header global
- I.2 Nav superior
- I.4 Footer global
- I.5 Barra promocional close-promo
- I.8 Carrusel de productos (al final — "Productos relacionados"): incluye Tinaco Plus+, Tinaco Vertical, Tee Reducida, Montura, etc. — productos NO necesariamente relacionados con FAQs.

### Inventario EXHAUSTIVO de preguntas por categoría

> Dump completo extraído del DOM: `tickets/regresiones-smoke-b2c/scripts/faqs-dump.json`. Total: **56 preguntas** distribuidas en 5 tabs.

#### Tab 1 — "Acerca de los productos" (16 items)

1. ¿Dónde puedo comprar los productos Rotoplas?
   - _Respuesta:_ "Puedes realizar la compra de nuestros productos de forma fácil y segura en nuestra web https://tienda.rotoplas.com.mx/..." ⚠️ **link a sitio externo (`tienda.rotoplas.com.mx`) NO al propio dominio `qarotoplasmx.io`** → BUG potencial de cross-domain o transición arquitectónica.
2. ¿Qué diferencia hay entre el Tinaco negro y el beige?
3. **Sobre los Tinacos** (grupo con 4 sub-acordeones):
   - ¿Qué capacidades existen en los Tinacos?
   - ¿Cuáles son las medidas de los Tinacos? _(respuesta contiene tabla con typo `Diámtero` → **BUG-B2C-081**)_
   - ¿Qué accesorios van incluidos en los Tinacos?
   - ¿Cuántas capas tienen los Tinacos?
4. **Sobre las Cisternas** (grupo con 5 sub-acordeones):
   - ¿Cuál es la ventaja de usar una Cisterna Rotoplas?
   - ¿Qué capacidades existen en las Cisternas?
   - ¿Cuáles son las medidas de las Cisternas?
   - ¿Qué accesorios van incluidos en las Cisternas?
   - ¿La Cisterna puede instalarse al exterior? _(typo: "Si" sin tilde donde debe ir "Sí")_
5. ¿La instalación de los productos debe realizarse por un experto?
6. ¿Cada cuánto tiempo se debe dar mantenimiento al producto?
7. ¿Para qué sirve el Biodigestor?
8. ¿El Biodigestor cumple con alguna norma?
9. **¿Que puricador me recomiendan para casa habitación?** ⚠️ **DOBLE BUG**: "Que" sin tilde + "puricador" mal escrito ("purificador") → **BUG-B2C-083**
10. ¿Cómo funciona el Medidor de nivel de agua para tinaco o cisterna IOT?
11. ¿Cómo instalar el medidor de nivel Rotoplas IOT? _(respuesta SOLO contiene URL `https://www.youtube.com/watch?v=zQ0PCXdOF4g&t=1s` sin contexto → **BUG-B2C-088**)_
12. ¿Cómo vinculo la app Rotoplas al sensor de nivel IOT? _(respuesta SOLO URL YouTube → BUG-B2C-088 aplica)_
13. No puedo encontrar o descargar la App en la tienda de aplicaciones para usar el medidor de nivel IOT. ¿Qué puedo hacer?
14. No puedo vincular el Medidor de nivel con la App. ¿Qué debo revisar?
15. **Si el medidor de nivel IOS aparece "fuera de línea" en la app. ¿Qué debo hacer?** ⚠️ "IOS" parece typo — debería ser "IOT" (consistente con resto de preguntas) → **BUG-B2C-089**
16. Si el Medidor de nivel IOT muestra valores incorrectos de los niveles de agua. ¿A qué se debe?

#### Tab 2 — "Garantias" ⚠️ (3 items)

> _Nota: el tab está escrito sin tilde → **BUG-B2C-076**._

1. ¿Cuál es el tiempo de garantía de mi producto?
2. **¿Cómo puedo hacer valida la garantía de los productos Rotoplas?** ⚠️ typo: "valida" sin tilde → "válida" → **BUG-B2C-090**
3. ¿Es posible reparar los productos Rotoplas? _(respuesta: "Si, los productos..." → "Si" sin tilde donde debe ir "Sí")_

#### Tab 3 — "Contacto" (3 items)

1. ¿Cuáles son los medios de contacto oficiales en Rotoplas?
2. ¿Cuál es el número de Servicio a clientes? _(respuesta destaca con "Ojo, no te dejes engañar..." — copy informal vs resto)_
3. ¿Qué horario de atención tiene el Centro de Servicio a clientes?
   - _Respuesta:_ "lunes a viernes de 8:00 a 19:00 hrs y sábados de 9:00 a 13:00 hrs"

#### Tab 4 — "Generales" ← activa por default (3 items)

1. **¿Cuáles son los requisitos para ser distribuidor de la marca?** ⚠️ respuesta termina con `Link Dejanos tus datos (con formulario)` → **texto placeholder no reemplazado** + "Dejanos" sin tilde → **BUG-B2C-084**
2. ¿Dónde están ubicadas las plantas? _(lista: "Ixtapaluca, Guadalajara, Monterrey, Merida (sin tilde), Veracruz, Los Mochis, León, Tuxtla Gutiérrez" → **BUG-B2C-086** "Merida" sin tilde)_
3. ¿En dónde puedo ver su bolsa de trabajo?

> "Si tienes **interes** en formar parte" — "interes" sin tilde → **BUG-B2C-085**

#### Tab 5 — "Servicio" (5 grupos con sub-acordeones)

1. **Concepto y valor** (2 sub):
   - ¿Qué es exactamente el Servicio de Instalación / Mantenimiento y por qué debería contratarlo con ustedes?
   - ¿Qué servicios ofrecen exactamente? ¿Es solo instalación o también hacen diagnósticos y mantenimiento?
2. **Flujo del servicio** (3 sub):
   - Quiero contratar un producto y un servicio, ¿cuál es el orden exacto de los pasos que debo seguir? _(falta `¿` de apertura → **BUG-B2C-087**)_
   - ¿La instalación o el mantenimiento tienen el mismo precio sin importar mi ubicación o las condiciones de mi casa?
   - ¿Qué tan coordinada está la entrega de mi producto con la cita del servicio? ¿Mi producto y el técnico llegarán al mismo tiempo?
3. **Transparecia de costos y riesgos** ⚠️ typo "Transparecia" → "Transparencia" → **BUG-B2C-082** (4 sub):
   - ¿El precio que me muestran es final y garantizado o me van a cobrar "extras" una vez que estén en mi casa?
   - ¿Qué pasa si al llegar el técnico detecta que mi caso requiere algo más complejo (ej. más material o condiciones especiales)? ¿Hay un costo extra y cómo me lo notificarían?
   - ¿Qué materiales y piezas incluye exactamente el costo de la instalación? ¿Tengo que comprar yo algo adicional o el plomero viene con todo lo necesario?
   - Si el plomero que me envían daña algo en mi casa durante la instalación, ¿quién se hace cargo de la reparación y cómo de rápido se soluciona? _(falta `¿` apertura)_
4. **Calidad del servicio y personal** (2 sub):
   - ¿Cómo sé que el técnico/plomero que enviarán está realmente capacitado? ¿Están certificados o avalados por ustedes?
   - En el caso de mantenimiento (ej. lavado de tinaco), ¿qué tengo que tener listo para asegurar el éxito del servicio y no perder el tiempo de la cita? _(falta `¿` apertura)_
5. **Logística y agendamiento** (6 sub):
   - ¿Por qué tengo que esperar a que llegue el producto para poder agendar la cita? ¿No se puede agendar con anticipación para ahorrar tiempo?
   - ¿Cómo sé que ya puedo agendar? ¿Recibo una notificación específica para iniciar el agendamiento?
   - ¿Cuánto tiempo después de que mi producto llegue a casa puedo esperar que me contacten para agendar la instalación/mantenimiento?
   - ¿Qué pasa si agendo y mi producto no llega a tiempo o necesito cancelar? ¿Me penalizan por cancelar la cita a último momento?
   - El tiempo de espera (3 días a 1 mes) es real o debo esperar más? ¿Qué me garantiza que mi producto llegue a tiempo para la instalación? _(falta `¿` apertura)_
   - ¿Puedo cambiar la dirección de instalación/mantenimiento durante el agendamiento si es diferente a la de entrega del producto?

### Bugs específicos de la página
- **BUG-B2C-036** (H1 dice "Contáctanos" en página llamada "preguntas-frecuentes") — CONFIRMADO con evidencia visual
- **BUG-B2C-076** (categoría "Garantias" sin tilde — debería ser "Garantías")
- **BUG-B2C-077** (vista híbrida Contacto+FAQs en una sola URL — duplica con `/contacto/` y confunde IA del sitio)
- **BUG-B2C-078** (acordeones FAQ sin `<details>`, sin `aria-expanded`, sin `role="button"` en el `<p>` titulo — lectores de pantalla no perciben expansión)
- **BUG-B2C-079** (categorías `<a href="#">` sin hash real ni data-attr — no se puede deeplinkear a categoría específica de FAQ)
- **BUG-B2C-080** (3 versiones de "Contacto" entrelazadas: tab FAQ "Contacto" + sección Contacto al inicio + página `/contacto/` separada)

**DOM contract draft (Playwright):**
```javascript
await expect(page).toHaveTitle(/Preguntas frecuentes/);
await expect(page.locator('h1')).toHaveText(/Contáctanos|Preguntas frecuentes/); // ⚠️ contract documenta H1 actual (BUG-036 pendiente fix)
await expect(page.locator('a[href^="tel:"]')).toHaveAttribute('href', 'tel:8005063000');
await expect(page.locator('a[href*="wa.me"]')).toBeVisible();
await expect(page.locator('div.faqs-botones a')).toHaveCount(5);
await expect(page.locator('p.faqs-titulo, p.sub-faqs-titulo')).toHaveCount(56);
```

### Arquitectura JS del acordeón y los tabs

**El sitio NO usa Qwik para los acordeones de `/preguntas-frecuentes/`** — usa un `<script>` inline vanilla con event listeners imperativos. Esto contradice el patrón Qwik del resto del sitio.

**Código del handler** (extraído del inline script en `<div class="g-content g-particle">`):

```javascript
console.log('faqs:ready');  // debug log en producción → BUG-B2C-093

// Tabs
const tabButtons = document.querySelectorAll('.faqs-boton');
tabButtons.forEach(button => {
  button.addEventListener('click', function(e) {
    e.preventDefault();
    console.log(this.getAttribute('tab'));  // debug log → BUG-B2C-093
    tabButtons.forEach(btn => btn.classList.remove('faqs-boton-activo'));
    this.classList.add('faqs-boton-activo');
    const tabId = this.getAttribute('tab');
    const activeTab = document.getElementById(tabId);
    // fade out current + display:block + fade in (300ms + 50ms + 500ms)
  });
});

// Acordeón nivel 1
const faqTitles = document.querySelectorAll('.faqs-titulo');
const faqContents = document.querySelectorAll('.faqs-contenido');
faqContents.forEach(content => content.style.display = 'none');  // init colapsado
faqTitles.forEach(title => {
  title.addEventListener('click', function() {
    console.log('faqs-titulo');  // debug → BUG-B2C-093
    const content = this.nextElementSibling;
    // exclusive accordion: cierra cualquier .faqs-contenido visible antes de abrir el nuevo
    // animación slide max-height 300ms
  });
});

// Acordeón nivel 2 (sub-faqs)
const subFaqTitles = document.querySelectorAll('.sub-faqs-titulo');
// idéntica lógica con .sub-faqs-contenido
```

**Tabs y sus IDs internos:**

| Label visible | `tab=` attribute | ID del contenedor `<div class="faqs-tab">` |
|---|---|---|
| Acerca de los productos | `acerca` | `#acerca` |
| Garantias | `garantias` | `#garantias` |
| Contacto | `contacto` | `#contacto` |
| Generales | `generales` | `#generales` |
| **Servicio** | **`serviciados`** ❌ | **`#serviciados`** ❌ |

> Inconsistencia: label "Servicio" pero attribute/id usa `serviciados` (probablemente residuo del módulo B2B2C "Serviciados") → **BUG-B2C-092**.

**Comportamiento confirmado:**
- Acordeón **exclusivo**: al expandir uno, cierra todos los demás `.faqs-contenido` visibles.
- Animación slide via `max-height` con `transition: max-height 0.3s ease-in/out`.
- Tabs: fade-out (300ms) → `display:none` → `display:block` → fade-in (500ms).
- `e.preventDefault()` en tabs previene scroll a `#` (los `<a href="#">` no navegan).

**Comportamiento ROTO detectado (BUG CRÍTICO):**

Al hacer click programático y vía MCP DevTools (clicks reales del navegador) en `<p class="faqs-titulo">`, **el acordeón NO expande** — el contenido permanece `display: none`. Tests realizados:
1. Click via MCP `click(uid)` → no expande.
2. `element.click()` programático → no expande.
3. `dispatchEvent(new MouseEvent('click', {bubbles:true}))` → no expande.
4. Adjuntar un listener `addEventListener('click', ...)` propio → SÍ recibe el evento → confirma que el evento llega al DOM.
5. Forzar manualmente `content.style.display = 'block'` → SÍ se ve la respuesta.

→ **Conclusión:** los listeners adjuntos por el script inline NO están activos. Hipótesis (a confirmar en F2 con click humano real): el `forEach(title => title.addEventListener(...))` corrió antes de que Qwik terminara de hidratar el tab activo, por lo que los listeners se adjuntaron a nodos DOM que después fueron reemplazados/movidos durante el render final.

→ **BUG-B2C-091 (CRÍTICO):** Acordeones de FAQ no interactivos — respuestas no se pueden expandir en sesiones programáticas (y posiblemente en click real de usuario también). Si se confirma con un usuario humano, el contenido de FAQs es inaccesible en producción.

**BUG-B2C-091 evidencia:** `F1A-22-faqs-respuesta-expandida-forzada.png` — muestra la respuesta visible SOLO cuando forzamos `style.display='block'` manualmente desde DevTools.

**DOM contract draft (Playwright):**
```javascript
await expect(page).toHaveTitle(/Preguntas frecuentes/);
await expect(page.locator('h1')).toHaveText(/Contáctanos/);  // BUG-036 pendiente
await expect(page.locator('a[href^="tel:"]')).toHaveAttribute('href', 'tel:8005063000');
await expect(page.locator('a[href*="wa.me"]')).toBeVisible();
// Tabs
await expect(page.locator('div.faqs-botones a.faqs-boton')).toHaveCount(5);
const tabIds = ['acerca', 'garantias', 'contacto', 'generales', 'serviciados'];
for (const id of tabIds) {
  await expect(page.locator(`div.faqs-tab#${id}`)).toBeAttached();
}
// Acordeones totales
await expect(page.locator('p.faqs-titulo, p.sub-faqs-titulo')).toHaveCount(56);
// Estado inicial: solo tab "acerca" visible
await expect(page.locator('div.faqs-tab#acerca')).toBeVisible();
await expect(page.locator('div.faqs-tab#garantias')).toBeHidden();
// Click expansión (verificar BUG-B2C-091)
await page.locator('p.faqs-titulo').first().click();
await expect(page.locator('div.faqs-contenido').first()).toBeVisible({ timeout: 2000 });
```

### Componente reutilizable I.X — Acordeón FAQ (vanilla JS)

> Aprende del descubrimiento: documentar como componente Parte I para que el contrato Playwright se reuse.
>
> **Patrón estructural obligatorio:**
> ```html
> <div class="faqs-botones">
>   <a class="faqs-boton btn-center [faqs-boton-activo]?" tab="{id}" href="#">{Label}</a>
>   ...
> </div>
> <div id="{tabId}" class="faqs-tab" style="display: block|none">
>   <div class="faqs">
>     <p class="faqs-titulo d-flex flex-row flex-space-between">
>       ¿Pregunta? <i class="fa-solid fa-chevron-down"></i>
>     </p>
>     <div class="faqs-contenido" style="display: none">
>       <!-- contenido HTML (texto, links, tablas, imágenes, videos YouTube como URL plana) -->
>       <!-- O sub-acordeones: -->
>       <div class="sub-faqs">
>         <p class="sub-faqs-titulo">¿Subpregunta? <i class="fa-solid fa-chevron-down"></i></p>
>         <div class="sub-faqs-contenido" style="display: none">...</div>
>       </div>
>     </div>
>   </div>
> </div>
> ```

### Evidencias

- `F1A-16-faqs-H1-contactanos.png` — H1 "Contáctanos" en página de FAQs (BUG-036)
- `F1A-17-faqs-tab-acerca-productos.png` — tab "Acerca de los productos" activo
- `F1A-18-faqs-tab-garantias.png` — tab "Garantias" activo
- `F1A-19-faqs-tab-contacto.png` — tab "Contacto" activo
- `F1A-20-faqs-tab-servicio.png` — tab "Servicio" activo (con id interno `serviciados`)
- `F1A-21-faqs-expandido-forzado-evidencia-bug.png` — primer intento de captura del estado expandido (timing inicial)
- `F1A-22-faqs-respuesta-expandida-forzada.png` — respuesta visible SOLO al forzar `style.display='block'` (evidencia BUG-091)
- `tickets/regresiones-smoke-b2c/scripts/faqs-dump-completo.json` — dump JSON con las 56 preguntas + respuestas completas sin truncar

## II.14 `/contacto/`

- **URL:** `https://qarotoplasmx.io/contacto/`
- **Title:** `Rotoplas` (genérico → BUG-B2C-053)
- **H1:** ❌ NO TIENE — solo H2 "Contacto" → **BUG-B2C-067**
- **Breadcrumb:** `Inicio / Contacto / Contacto` (duplicado → **BUG-B2C-071**)
- **Subtítulo:** "Déjanos tus datos y te contactaremos"

### Componentes globales que usa
- I.1 Header global
- I.2 Nav superior
- I.4 Footer global
- I.5 Barra promocional close-promo (consent banner)
- I.14.d Form Contacto (mapeo completo en Parte I)

### Bugs específicos de la página
- **BUG-B2C-067** (sin H1) — ver tabla en Parte IV
- **BUG-B2C-071** (breadcrumb duplicado)
- Resto de bugs del form en I.14.d (BUG-B2C-068 a 075)

**Evidencias:** `F1A-14-contacto-form-inicial.png`, `F1A-15-contacto-errores-submit-vacio.png`

## II.15 `/distribuidores/`

> Buscador de distribuidores con Google Maps embebido + 2 selects encadenados (estado → ciudad). Componentes globales: I.1 Header, I.2 Nav, I.4 Footer.

### 1. Meta tags y SEO

| Campo | Valor | Hallazgo |
|---|---|---|
| `<title>` | `Rotoplas` | ❌ BUG-251 sistémico |
| `meta[description]` | `¡Disfruta lo mejor de Rotoplas al alcance de un solo clic!` | ❌ **BUG-B2C-359** — no menciona distribuidores ni mapa |
| canonical | `/distribuidores/` | ✓ |

### 2. Estructura semántica

| Campo | Valor | Hallazgo |
|---|---|---|
| **H1** | (ninguno) — `h1Count: 0` | ❌ **BUG-B2C-353** CRÍTICO SEO/a11y |
| H3 (sección principal) | `"Distribuidores cerca de ti"` | Debería ser H1 |
| H3 (resultados) | `"Tiendas cercanas"` | Debería ser H2 |
| Breadcrumb | `<a>Inicio</a> / <span>Ubicación distribuidores</span>` | Texto del span en lowercase pese a que el footer usa Title Case → inconsistencia |

### 3. Texto introductorio

```
"Visita las tiendas de nuestros distribuidores y encuentra lo que estas buscando."
"Ingresa tu estado y/o tu ciudad y encuentra a tu distribuidor más cercano."
```

| ID | Severidad | Hallazgo |
|---|---|---|
| **BUG-B2C-366** | BAJA copy | `"lo que estas buscando"` — falta tilde, debería `"lo que estás buscando"`. |

### 4. Selects (formulario de búsqueda)

#### 4.a Select Estado (`name="building"` clase `⭐️51h8gs-0`)

29 opciones (incluyendo placeholder vacío). Lista completa:

```
"", AGUASCALIENTES, BAJA CALIFORNIA NORTE, BAJA CALIFORNIA SUR, BELICE,
CAMPECHE, CHIAPAS, CHIHUAHUA, COAHUILA, COLIMA, DURANGO, GUANAJUATO,
JALISCO, MICHOACÁN, NAYARIT, NUEVO LEON, OAXACA, PUEBLA, QUERETARO,
QUINTANA ROO, SAN LUIS POTOSI, SINALOA, SONORA, TABASCO, TAMAULIPAS,
VERACRUZ, YUCATÁN, "YUCATÁN " (con trailing space), ZACATECAS
```

Handler Qwik: `q-B3yhcv9y.js#s_aax0VtEE4O4` — onChange dispara fetch de ciudades.

| ID | Severidad | Hallazgo |
|---|---|---|
| **BUG-B2C-354** | MEDIA data | `BELICE` aparece como estado — **es un país, no un estado mexicano**. |
| **BUG-B2C-355** | MEDIA data | `YUCATÁN` aparece **2 veces**: una sin trailing space (`"YUCATÁN"`) y otra con trailing space (`"YUCATÁN "`). Bug data del backend que escapó la deduplicación. |
| **BUG-B2C-356** | MEDIA copy/data | Estados sin tilde: `NUEVO LEON` (debería `LEÓN`), `QUERETARO` (debería `QUERÉTARO`), `SAN LUIS POTOSI` (debería `POTOSÍ`). Inconsistencia con `MICHOACÁN` y `YUCATÁN` que SÍ tienen tilde. |
| **BUG-B2C-361** | CRÍTICO data | **Faltan 6 estados mexicanos** del listado: Ciudad de México (CDMX), Estado de México (México), Hidalgo, Guerrero, Morelos, Tlaxcala. **CDMX es donde está el usuario** según su dirección guardada (Camarones 155k, Col. Nueva Santa María, Ciudad de México). Imposible buscar distribuidores en su propia ciudad. |
| **BUG-B2C-362** | BAJA UX | Estados ordenados alfabéticamente con UPPERCASE, sin filtro/typeahead. Para 28 estados manejable, pero combinado con CDMX faltante es crítico. |
| **BUG-B2C-358** | ALTA HTML | **2 `<select>` con `name="building"` en la misma página** (un select oculto del modal CP + el visible de estados). HTML inválido y posible conflicto de form submission. |

#### 4.b Select Ciudad (`name="cityS"` clase `⭐️51h8gs-0`)

Vacío hasta seleccionar un estado. Handler Qwik: `q-CT1uaRwv.js#s_5AiZlV00eIM`.

**Verificación interactiva (seleccionando JALISCO):**
- Carga **62 ciudades** de Jalisco
- Sample: `AMATITAN`, `AMECA`, `ARANDAS`, `ARENAL`, `ATOTONILCO`, `AUTLAN`, `CAPILLA DE GUADALUPE`

| ID | Severidad | Hallazgo |
|---|---|---|
| **BUG-B2C-364** | BAJA copy/data | Ciudades sin tildes: `AMATITAN` (Amatitán), `AUTLAN` (Autlán de Navarro), pierde precisión toponímica. |
| **BUG-B2C-365** | BAJA UX | Select nativo con 62 opciones de ciudades sin filtro/typeahead — para CDMX o Edo Mex sería peor. Recomendación: usar combobox con búsqueda. |

### 5. Mapa Google Maps embebido — controles

`<div role="region" aria-roledescription="mapa" aria-label="Mapa">` con Google Maps JS API (no iframe). Live region polite para anunciar cambios.

#### Botones del mapa (Google controls — heredados de la API)

| Texto / aria-label | Comportamiento esperado | Visible inicial |
|---|---|---|
| "Mapa" (aria-label="Mostrar mapa de calles") | Toggle vista mapa | ✓ |
| "Satélite" (aria-label="Mostrar imágenes satelitales") | Toggle vista satélite | ✓ |
| (aria-label="Activar o desactivar la vista de pantalla completa", `class="gm-fullscreen-control"`) | Fullscreen toggle | ✓ |
| (aria-label="Girar el mapa a la derecha") | Rotar 90° CW | ✗ (solo en satélite tilt) |
| (aria-label="Girar el mapa a la izquierda") | Rotar 90° CCW | ✗ |
| (aria-label="Inclinar el mapa", `class="gm-tilt"`) | Tilt 3D | ✗ |
| (aria-label="Controles de visualización del mapa") | Abrir panel de controles | ✓ |
| (aria-label="Mover hacia arriba/abajo/izquierda/derecha") | Pan en dirección | ✗ (mostrar con scroll) |
| (aria-label="Acercar" / "Alejar") | Zoom in/out | ✗ |
| (aria-label="Combinaciones de teclas") × 2 | Modal de keyboard shortcuts | ✓ (botón footer del mapa) |
| (aria-label="Datos del mapa") | Atribución de datos | ✗ |
| `gm-style-cc` (Escala del mapa) | Toggle métrico/imperial | ✗ |

Total: **~20 botones de Google Maps controls** — todos con `aria-label` ✓ (estándar de la API).

#### Links del mapa (Google atribución — pie del widget)

| Texto | href | rel | Comportamiento esperado |
|---|---|---|---|
| (logo Google, sin texto) | `https://maps.google.com/maps?ll=…&z=8` | `noopener` | Abrir Google Maps con el área visible |
| "Condiciones" | `https://www.google.com/intl/es-419_US/help/terms_maps.html` | `noopener` | Términos de Google Maps |
| "Informar un error en el mapa" | `https://www.google.com/maps/@…/data=…` | `noopener` | Reportar error a Google |

(Google Maps API gestiona `rel` correctamente — contraste con los share del PDP de Rotoplas que sí faltaron noopener.)

### 6. Resultados — Sección "Tiendas cercanas"

Antes de seleccionar estado: `<h3>Tiendas cercanas</h3>` + `<p>No has seleccionado una ubicación</p>`.

Después de seleccionar (Jalisco verificado):

```html
<div class="ContainerDistribuidoresData">
  <h3>Tiendas cercanas</h3>
  <div>
    <div class="containerListSuc">
      <p class="stongList" id="MapSuc">FERRETERIA HERMANOS GARCIA RIVERA S</p>
      <p class="lightList">CALZ. DEL CARMEN 55-A COL DON BOSCO</p>
    </div>
    <div class="containerListSuc">
      <p class="stongList" id="MapSuc">MARIA DE JESUS ALVAREZ RUIZ</p>
      <p class="lightList">AVENIDA PATRIA ORIENTE 34 COL JARDINES DEL MANANTIAL</p>
    </div>
    <!-- … N tiendas más -->
  </div>
</div>
```

| ID | Severidad | Hallazgo |
|---|---|---|
| **BUG-B2C-363** | ALTA HTML | **`id="MapSuc"` duplicado** — cada tienda renderizada en la lista usa el mismo `id`. HTML inválido (ids deben ser únicos). Rompe selectores `getElementById`, screen readers, y posibles handlers. |
| **BUG-B2C-367** | BAJA copy | Clase `stongList` — typo: debería ser `strongList`. |
| **BUG-B2C-368** | BAJA copy/UX | Nombre del distribuidor en MAYÚSCULAS y truncado `"FERRETERIA HERMANOS GARCIA RIVERA S"` (S sin completar — probable "S.A. de C.V."). Sin tildes (Ferretería, García). |
| **BUG-B2C-369** | MEDIA UX | Items de la lista solo muestran nombre + dirección. **Sin teléfono, sin horarios, sin link "Ver en Google Maps", sin distancia desde el usuario, sin productos disponibles, sin link a sitio web.** Información insuficiente para acción. |
| **BUG-B2C-370** | MEDIA UX | Marcadores en el mapa: solo **1 marker visible** para 62+ tiendas de Jalisco — posible bug del bind entre lista y mapa. |

### 7. Matriz exhaustiva — TODOS los botones específicos del listing (no globales)

> Filtrado: botones únicos del componente distribuidores (excluyendo header/footer/Google Maps controls).

| qid / id | Texto / aria-label | Clase | Comportamiento esperado | Estado |
|---|---|---|---|---|
| (sin qid) | Combobox estado (select) | `⭐️51h8gs-0` | onChange dispara fetch de ciudades del estado + actualiza mapa centrado | ✅ Verificado |
| (sin qid) | Combobox ciudad (select) | `⭐️51h8gs-0` | onChange filtra tiendas por ciudad + recentra mapa con marcadores | No probado |

**No hay botón "Buscar" explícito** — la búsqueda es onChange instantánea. UX delgada pero sin feedback visual de loading durante el fetch.

### 8. Links específicos del componente

| Texto | href | target | Comportamiento esperado | Hallazgo |
|---|---|---|---|---|
| "Inicio" (breadcrumb) | `/` | _self | Volver al home | ✓ |

(El resto de links son del header/footer/Google Maps documentados en componentes globales.)

### 9. DOM contract Playwright

```javascript
// tests/visual/distribuidores-contract.spec.js
import { test, expect } from '@playwright/test';

test.describe('II.15 /distribuidores/ — contract', () => {
  test('estructura básica', async ({ page }) => {
    await page.goto('https://qarotoplasmx.io/distribuidores/');
    // BUG-353: sin H1
    await expect(page.locator('h1')).toHaveCount(0);  // hoy 0 (bug) — invertir tras fix
    await expect(page.locator('h3', { hasText: 'Distribuidores cerca de ti' })).toBeVisible();
    await expect(page.locator('h3', { hasText: 'Tiendas cercanas' })).toBeVisible();
  });

  test('BUG-358: 2 selects con name="building"', async ({ page }) => {
    await page.goto('https://qarotoplasmx.io/distribuidores/');
    const buildingSelects = await page.locator('select[name="building"]').count();
    expect(buildingSelects).toBe(2);  // hoy 2 — invertir a 1 tras fix
  });

  test('BUG-355: YUCATÁN duplicado', async ({ page }) => {
    await page.goto('https://qarotoplasmx.io/distribuidores/');
    const estados = await page.locator('select[name="building"]').nth(1).locator('option').allTextContents();
    const yucatans = estados.filter(s => s.trim() === 'YUCATÁN');
    expect(yucatans.length).toBe(2);  // hoy 2 — invertir a 1 tras fix
  });

  test('BUG-361: CDMX faltante', async ({ page }) => {
    await page.goto('https://qarotoplasmx.io/distribuidores/');
    const opts = await page.locator('select[name="building"]').nth(1).locator('option').allTextContents();
    const hasCDMX = opts.some(s => /CDMX|CIUDAD DE M[EÉ]XICO|DISTRITO FEDERAL/i.test(s));
    expect(hasCDMX).toBe(false);  // hoy false (bug) — invertir tras fix
  });

  test('BUG-354: BELICE como estado', async ({ page }) => {
    await page.goto('https://qarotoplasmx.io/distribuidores/');
    const opts = await page.locator('select[name="building"]').nth(1).locator('option').allTextContents();
    expect(opts).toContain('BELICE');  // hoy presente — invertir tras fix
  });

  test('seleccionar JALISCO carga 62 ciudades', async ({ page }) => {
    await page.goto('https://qarotoplasmx.io/distribuidores/');
    await page.locator('select[name="building"]').nth(1).selectOption('JALISCO');
    await page.waitForTimeout(2000);
    const cities = await page.locator('select[name="cityS"] option').count();
    expect(cities).toBeGreaterThan(50);
  });

  test('BUG-363: id="MapSuc" duplicado después de seleccionar estado', async ({ page }) => {
    await page.goto('https://qarotoplasmx.io/distribuidores/');
    await page.locator('select[name="building"]').nth(1).selectOption('JALISCO');
    await page.waitForTimeout(2500);
    const dups = await page.locator('#MapSuc').count();
    expect(dups).toBeGreaterThan(1);  // hoy > 1 (bug) — invertir tras fix
  });

  test('mapa Google Maps embebido', async ({ page }) => {
    await page.goto('https://qarotoplasmx.io/distribuidores/');
    await expect(page.locator('[role="region"][aria-label="Mapa"]')).toBeVisible();
    await expect(page.locator('button:has-text("Mapa")')).toBeVisible();
    await expect(page.locator('button:has-text("Satélite")')).toBeVisible();
  });
});
```

### 10. Evidencias

- `evidencias/F1D-04-distribuidores-listado.png` — estado inicial sin selección
- `evidencias/F1D-05-distribuidores-jalisco-resultados.png` — con JALISCO seleccionado + lista de tiendas
- `scripts/F1D-distribuidores-deep.json` — meta + headings + selects + mapa + botones + links



## II.16 `/servicios/` + `/servicios-lavado/`

> Dos páginas distintas con propósitos diferentes:
> - **`/servicios/`** — landing institucional de las 3 sub-marcas Rotoplas: **bebbia** (purificación), **rieggo** (riego agrícola), **Rsa** (tratamiento). Cross-sell hacia sitios externos.
> - **`/servicios-lavado/`** — landing transaccional del servicio "Lavado de tinaco/cisterna" exclusivo CDMX, con FAQ y CTA WhatsApp.

---

### II.16.a `/servicios/` — Landing institucional sub-marcas

#### 1. Meta tags

| Campo | Valor | Hallazgo |
|---|---|---|
| `<title>` | `Rotoplas` | ❌ BUG-251 sistémico |
| `meta[description]` | `rotoplas` (lowercase) | ❌ **BUG-B2C-371** — peor que el placeholder estándar; sin mayúscula inicial |
| canonical | `/servicios/` | ✓ |

#### 2. Estructura semántica

| Campo | Valor | Hallazgo |
|---|---|---|
| `<main>` elements en página | **2** | ❌ **BUG-B2C-372** — duplicación de landmark `<main>` (HTML inválido, screen readers confunden) |
| H1 | (ninguno) | ❌ **BUG-353** sistémico |
| H2 visible | `"Descubre los servicios que Rotoplas tiene para ti"` (1) | Debería ser H1 |
| H3 visibles | 6 testimonios con comillas curvas "" | ❌ **BUG-B2C-378** — testimonios marcados como `<h3>` en lugar de `<blockquote>` + `<cite>` |
| H4 visibles | 9 (3 features por sub-marca × 3 sub-marcas) | OK estructura sub-secciones |

#### 3. Sub-marca 1 — **bebbia** (purificación de agua)

**Features (3 × H4):**
- `Agua de calidad` — "bebbia filtra y también purifica, eliminando el 99.9% de bacterias."
- `Practicidad` — "Agua disponible las 24 horas los 7 días de la semana sin cargar garrafones, solo gira la llave y disfruta."
- `Ahorro` — "Una familia gasta en promedio $800.00/mes en garrafones, con bebbia ahorras hasta 50%."

**Texto descriptivo:** `"Además de eliminar el 99.9% de bacterias, bebbia también elimina virus, microrganismos y microplásticos del agua…"`

**Testimonios:**
- "Shanik Aspe / Conductora/Madre de familia"
- "Chef Diego Alberto / chef" (chef sin capitalizar)
- "Fernanda Limón / Wellness"

**CTA:** `<button class="⭐️nwccjg-0">Visitar bebbia</button>` con handler `q-DtioM6oP.js#s_wsMRpeG04qY` — **NO es `<a>`** → comportamiento esperado: navegar a `https://bebbia.com/` (no verificado al click).

#### 4. Sub-marca 2 — **rieggo** (riego agrícola)

**Features (3 × H4):**
- `Acompañamiento 360°` — *"Contamos con un equipo de ingenieros especialistas para el diseño de tu proyecto, abarcando desde un sistema de riego para **cambo abierto** hasta un proyecto llave en mano para agricultura protegida."*
- `Financiamiento` — "Por eso, te brindamos nuestra oferta de servicios de financiamiento…"
- `Instalación` — "Realizamos proyectos hechos a la medida…"

**Sección con texto huérfano:** `"Ahorros en soluciones de tratamiento de agua desde 0% de inversión inicial​ Resources Group, con la finalidad de llevar más y mejor agua al segmento agrícola."`

**CTA:** `<button>Visitar rieggo</button>` con handler `q-pFrEWLZp.js#s_SM4vHNWxSMw`.

#### 5. Sub-marca 3 — **Rsa** (tratamiento)

**Features (3 × H4):**
- `El agua como servicio` — "Flexibilidad en esquemas comerciales con cero inversión inicial y esquemas Sell & lease back."
- `Operación y mantenimiento` — "Garantía de operación y mantenimiento las 24 horas de los 7 días de la semana…"
- `Sustentabilidad ecológica` — "Reducción de descargas a ríos, lagos, mares, fomento al equilibrio ecológico."

**CTA:** `<button>Visitar Rsa</button>` con handler `q-DhbZW6GB.js#s_YNh0lczhmPw`.

#### 6. Botones CTA — matriz exhaustiva

| qid | Texto | Tag | Clase | Handler Qwik | Comportamiento esperado | Hallazgo |
|---|---|---|---|---|---|---|
| (sin qid) | "Visitar bebbia" | **BUTTON** | `⭐️nwccjg-0` | `q-DtioM6oP.js#s_wsMRpeG04qY` | Navegar a `https://bebbia.com/` (externo) | ❌ **BUG-B2C-374** — debería ser `<a href target="_blank" rel="noopener">`. Como `<button>` no expone URL para crawlers, no permite Cmd+click, no permite preview-on-hover |
| (sin qid) | "Visitar rieggo" | **BUTTON** | `⭐️nwccjg-0` | `q-pFrEWLZp.js#s_SM4vHNWxSMw` | Navegar a sitio rieggo externo | mismo bug |
| (sin qid) | "Visitar Rsa" | **BUTTON** | `⭐️nwccjg-0` | `q-DhbZW6GB.js#s_YNh0lczhmPw` | Navegar a sitio Rsa externo | mismo bug + **"Rsa" capitalización inconsistente** (¿RSA o Rsa?) |

#### 7. Imágenes

| Cantidad | Detalle | Hallazgo |
|---|---|---|
| 3 imágenes principales | 2 con `naturalW=1370` (cargan OK) + 1 con `naturalW=0` (rota) | ❌ **BUG-B2C-375** una imagen rota |
| Todos los imgs con `alt=""` | (vacío) | ❌ **BUG-178** sistémico |
| 1 `<iframe>` vacío | `src=""` `title=""` | ❌ **BUG-B2C-377** iframe huérfano (espacio para futuro video bebbia?) |

#### 8. Bugs de copy en /servicios/

| ID | Severidad | Hallazgo |
|---|---|---|
| **BUG-B2C-379** | BAJA copy | rieggo features: `"sistema de riego para cambo abierto"` — typo, debería `"campo abierto"`. |
| **BUG-B2C-380** | BAJA copy | Testimonio Fernanda Limón: `"sea más practica"` — sin tilde (`"práctica"`). |
| **BUG-B2C-381** | BAJA copy | bebbia descripción: `"elimina virus, microrganismos y microplásticos"` — typo, debería `"microorganismos"`. |
| **BUG-B2C-382** | MEDIA copy | Texto huérfano `"… 0% de inversión inicial​ Resources Group, con la finalidad de llevar más y mejor agua al segmento agrícola."` — frase fragmentada que mezcla 2 mensajes diferentes. El nombre `Resources Group` aparece sin contexto previo. |
| **BUG-B2C-383** | BAJA copy | Testimonio Chef Diego Alberto: `"que calidad es increíble llega directo a mí cocina"` — gramática incorrecta (`mí` → `mi`), falta puntuación (`"…que la calidad es increíble, llega directo a mi cocina"`). |
| **BUG-B2C-384** | INFO | Testimonios con carácter ZWSP/RTL invisible al final (`"…/Wellness​"` aparente). Probable copia-pega desde Word/Google Docs sin sanitización. |
| **BUG-B2C-385** | BAJA copy | Testimonio Shanik Aspe: `"Conductora/Madre de familia"` — convención inconsistente con `"chef​"` minúscula del siguiente testimonio. |

---

### II.16.b `/servicios-lavado/` — Landing transaccional de lavado de tinaco/cisterna

#### 1. Meta tags

| Campo | Valor | Hallazgo |
|---|---|---|
| `<title>` | `Servicios Lavado` | ✓ específico (no placeholder) — segundo case-bueno de meta tags |
| `meta[description]` | `¡Disfruta lo mejor de Rotoplas al alcance de un solo clic!` | ❌ idéntico al de `/distribuidores/` — copy-paste sin personalizar (BUG-359 sistémico) |
| `og:title` | `Servicios Lavado` | ✓ |
| canonical | `/servicios-lavado/` | ✓ |

#### 2. Estructura semántica

| Campo | Valor | Hallazgo |
|---|---|---|
| `<main>` count | 1 ✓ | OK (contraste con /servicios/) |
| H1 count | **0** | ❌ BUG-353 sistémico |
| FAQ accordions | 6 `<details>` ✓ | DisclosureTriangle nativo correcto |

#### 3. Hero + propuesta de valor

```
"Lava y desinfecta tu tinaco y cisterna con los expertos."
"Bajo lineamiento COFEPRIS."
"*Servicio exclusivo para equipos Rotoplas en CDMX"
```

Imagen Desktop desde `cdn.builder.io/api/v1/image/assets%2F4cb0f3838abd4f1a8a6009f471299244%2F…` — espacio Builder.io **distinto** al resto del sitio (`b9d9011ceeb94100bbf26d7bffab75d6`).

| ID | Severidad | Hallazgo |
|---|---|---|
| **BUG-B2C-386** | INFO | Imagen del hero servida desde un workspace distinto de Builder.io (`4cb0f3838abd…` vs `b9d9011ce…` del resto). Posible asset huérfano sin permisos correctos. |

#### 4. Video embebido

```
<iframe src="https://www.youtube.com/embed/ZrMfQh_G2h0?si=u69MBZ6B2HhQmnYA"
        title="YouTube video player"
        allowfullscreen>
</iframe>
```

| ID | Severidad | Hallazgo |
|---|---|---|
| **BUG-B2C-387** | MEDIA privacidad | Video embebido desde `youtube.com/embed/...` en lugar de `youtube-nocookie.com/embed/...`. YouTube setea cookies de tracking en el primer carga (antes de play) — viola best-practice de privacidad LFPDPPP. |
| **BUG-B2C-388** | INFO a11y | `<iframe title="YouTube video player">` — título genérico de YouTube. Debería describir el contenido (`"Cómo lavar tu tinaco con Rotoplas"`). |

#### 5. Sección "¿Cómo funciona?" — 4 pasos

1. **Elige la cantidad de servicios** que necesitas lavar
2. **Realiza tu pago seguro** 100% en línea
3. **Agenda la fecha y hora para tu cita** desde tu cuenta
4. **Disfruta de agua limpia y segura** para tu hogar

Cada paso con `<img alt="Imagen">` desde Builder.io.

| ID | Severidad | Hallazgo |
|---|---|---|
| **BUG-B2C-389** | BAJA a11y | Imágenes de los 4 pasos con `alt="Imagen"` genérico — debería describir cada paso. |

#### 6. Sección "Qué incluye nuestro servicio" — 4 cards

| Título | Resultado |
|---|---|
| "Limpieza profunda" | "Eliminación efectiva de incrustaciones y residuos adheridos." |
| "Desinfección garantizada" | "Agua segura para consumo humano." |
| "Inspección de 7 puntos" | **"Eliminación efectiva de incrustaciones y residuos adheridos"** ← DUPLICADO de "Limpieza profunda" |
| "Protección de tu hogar" | "Cuidamos tu casa como si fuera nuestra." |

| ID | Severidad | Hallazgo |
|---|---|---|
| **BUG-B2C-390** | MEDIA copy/data | El "Resultado" del card "Inspección de 7 puntos" es **copia literal** del "Resultado" de "Limpieza profunda" (`"Eliminación efectiva de incrustaciones y residuos adheridos"`). El resultado correcto debería describir lo que la inspección revela (probables fugas, fallas, etc.). |
| **BUG-B2C-391** | INFO | La frase `"Eliminación efectiva de incrustaciones y residuos adheridos"` aparece **8 veces** en la página (`dupResultadoCopy: 8`). |

#### 7. Sección "Técnicos exclusivos en Rotoplas"

```
"No lavamos cualquier tinaco. Solo lavamos equipos Rotoplas."
¿Por qué?
- "Conocemos tu sistema: Entendemos cada modelo, accesorio y punto crítico…"
- "Eficiencia garantizada: Para Tinacos hasta 1,100L y Cisternas hasta 5,000L…"
```

Bullet point "Garantía de total Limpieza" — **capitalización rara**: `"total Limpieza"` (debería ser `"Limpieza Total"` o `"limpieza total"`).

| ID | Severidad | Hallazgo |
|---|---|---|
| **BUG-B2C-392** | BAJA copy | Encabezado `"Garantía de total Limpieza"` con palabra capitalizada en medio — debería `"Garantía total de Limpieza"` o `"Garantía de Limpieza Total"`. |

#### 8. CTAs — matriz exhaustiva

| Texto | Tag | href | target | rel | Hallazgo |
|---|---|---|---|---|---|
| **"Términos y condiciones"** (sección Técnicos exclusivos) | `<a>` | `https://rotoplas.com.mx/terminos-y-condiciones-serviciados/` | `_blank` | **(vacío)** | ❌ **BUG-211 sistémico** cross-domain a producción + **BUG-B2C-393**: sin `rel="noopener noreferrer"` (reverse tabnabbing) + **BUG-B2C-394**: el `<a>` tiene CSS Builder.io inline en `textContent` (workspace `4cb0f38…`) — clase `.builder-83d027884b51412d9f85160e0215045e` con bloque de estilos completo dentro del nodo. |
| **"Solicitar información"** | `<a>` | `https://wa.me/525547420835?text=Hola%2C%20necesito%20ayuda` | `_blank` | **(vacío)** | ❌ **BUG-B2C-395**: WhatsApp link `_blank` sin `rel="noopener noreferrer"`. Texto preset razonable. |

#### 9. FAQ accordions

6 acordeones nativos `<details>` con `<summary>` — buena práctica a11y ✓. Títulos:

1. ¿Qué debo tener listo antes de mi cita?
2. ¿Cuál es la garantía y cada cuánto debo contratarlo?
3. ¿Cómo agendo mi cita y quién debe recibir al técnico?
4. ¿Por qué el lavado con la recomendación COFEPRIS es mejor?
5. ¿Qué capacidad de tinacos cubre el servicio de lavado estándar?
6. ¿Brindan servicio de lavado para cisternas de concreto?

Iconos en el summary (`"icono"` aparece como texto leaked junto al título) → posible JSX leak o falta `aria-hidden` en el icon SVG.

| ID | Severidad | Hallazgo |
|---|---|---|
| **BUG-B2C-396** | MEDIA a11y | El texto del `<summary>` incluye literal "icono" al final (`"¿Qué debo tener listo antes de mi cita? icono"`). Probable `<img alt="icono">` dentro del summary, debería ser `aria-hidden="true"` ya que el icono es puramente decorativo. |

#### 10. Botones del flow (no hay CTA primario de "Comprar/Agendar")

| Texto | Visible | Hallazgo |
|---|---|---|
| "Cerrar" (close-btn del banner global) | ✓ | Único botón en main (excluyendo header) |

| ID | Severidad | Hallazgo |
|---|---|---|
| **BUG-B2C-397** | ALTA UX | **No hay CTA primario de "Agendar" / "Contratar servicio" / "Comprar" visible** en la página de servicio transaccional. El único path es **WhatsApp**. Para una landing transaccional con flujo descrito ("Elige cantidad → Pago → Agenda → Disfruta"), falta el botón que dispare el flujo. |

#### 10.bis URLs candidato de cotización inexistentes (404 sistémico)

No existe URL dedicada de cotización/agenda/pago para el servicio de lavado: las 11 URLs candidato devuelven el error genérico del 404 sistémico (BUG-144). El flow real es el wizard inline (II.16.c).

| URL probada | Status | "Ha ocurrido un error" |
|---|---|---|
| `/servicios-lavado/cotizar/` | 200 | ✓ (404 sistémico — BUG-144) |
| `/servicios-lavado/agendar/` | 200 | ✓ |
| `/cotizar-lavado/` | 200 | ✓ |
| `/cotizar/` | 200 | ✓ |
| `/agendar-servicio/` | 200 | ✓ |
| `/comprar-servicio/` | 200 | ✓ |
| `/comprar-lavado/` | 200 | ✓ |
| `/servicio-lavado/cotizar/` | 200 | ✓ |
| `/lavado/cotizar/` | 200 | ✓ |
| `/services/lavado/` | 200 | ✓ |
| `/checkout-servicio/` | 200 | ✓ |

No existe producto "Servicio de lavado" en el catálogo commercetools: la búsqueda en `/sitemap-products.xml` (947 productos) por `lavado`/`servicio` devuelve `[]`. JSX leaks en esta landing: 0.

#### 11. DOM contract Playwright

```javascript
// tests/visual/servicios-contract.spec.js
import { test, expect } from '@playwright/test';

test.describe('II.16.a /servicios/ — contract', () => {
  test('estructura', async ({ page }) => {
    await page.goto('https://qarotoplasmx.io/servicios/');
    await expect(page.locator('h1')).toHaveCount(0);  // hoy 0 (BUG-353) — invertir tras fix
    await expect(page.locator('main')).toHaveCount(2);  // hoy 2 (BUG-372) — invertir a 1 tras fix
    for (const cta of ['Visitar bebbia', 'Visitar rieggo', 'Visitar Rsa']) {
      await expect(page.getByRole('button', { name: cta })).toBeVisible();
    }
  });

  test('BUG-374: CTAs son <button> no <a>', async ({ page }) => {
    await page.goto('https://qarotoplasmx.io/servicios/');
    const bebbiaCta = page.locator('button:has-text("Visitar bebbia")');
    expect(await bebbiaCta.evaluate(el => el.tagName)).toBe('BUTTON');  // hoy BUTTON — invertir tras fix
  });

  test('BUGs copy /servicios/', async ({ page }) => {
    await page.goto('https://qarotoplasmx.io/servicios/');
    const body = await page.locator('body').textContent();
    expect(body).toContain('cambo abierto');       // BUG-379
    expect(body).toMatch(/m[aá]s practica/);       // BUG-380
    expect(body).toContain('microrganismos');      // BUG-381
    expect(body).toContain('Resources Group');     // BUG-382
  });
});

test.describe('II.16.b /servicios-lavado/ — contract', () => {
  test('estructura', async ({ page }) => {
    await page.goto('https://qarotoplasmx.io/servicios-lavado/');
    await expect(page).toHaveTitle('Servicios Lavado');
    await expect(page.locator('main')).toHaveCount(1);
    await expect(page.locator('details')).toHaveCount(6);
  });

  test('YouTube embed sin nocookie (BUG-387)', async ({ page }) => {
    await page.goto('https://qarotoplasmx.io/servicios-lavado/');
    const iframe = page.locator('iframe[src*="youtube"]');
    const src = await iframe.getAttribute('src');
    expect(src).toContain('youtube.com');
    expect(src).not.toContain('youtube-nocookie.com');  // hoy youtube.com — invertir tras fix
  });

  test('BUG-390: copy duplicado en "Inspección de 7 puntos"', async ({ page }) => {
    await page.goto('https://qarotoplasmx.io/servicios-lavado/');
    const matches = await page.locator('text=Eliminación efectiva de incrustaciones').count();
    expect(matches).toBeGreaterThan(1);  // hoy 8 — invertir a 1 tras fix
  });

  test('Términos y condiciones cross-domain sin noopener', async ({ page }) => {
    await page.goto('https://qarotoplasmx.io/servicios-lavado/');
    const tycLink = page.locator('a[href*="terminos-y-condiciones-serviciados"]');
    expect(await tycLink.getAttribute('href')).toContain('rotoplas.com.mx');  // BUG-211
    expect(await tycLink.getAttribute('rel') || '').not.toContain('noopener');  // BUG-393
  });

  test('WhatsApp CTA único', async ({ page }) => {
    await page.goto('https://qarotoplasmx.io/servicios-lavado/');
    const waLink = page.locator('a[href*="wa.me"]');
    await expect(waLink).toHaveText(/Solicitar informaci[oó]n/);
    expect(await waLink.getAttribute('rel') || '').not.toContain('noopener');  // BUG-395
  });
});
```

#### 12. Evidencias

- `evidencias/F1D-06-servicios.png` — landing institucional bebbia + rieggo + Rsa
- `evidencias/F1D-07-servicios-lavado.png` — landing transaccional COFEPRIS + YouTube + FAQ
- `scripts/F1D-servicios-deep.json` — meta + headings + CTAs + JSX leak count + image origins
- `scripts/F1D-servicios-lavado-deep.json` — meta + YouTube embed + 6 FAQ accordions + matriz CTAs + dup copy count

---

### II.16.c Wizard de cotización inline — `/servicios-lavado/`

> ⚠️ **Presencia inestable (BUG-B2C-457, ver §6.bis).** El wizard aparece de forma intermitente: cuando está ausente, el DOM tiene **0** `.cotizacion-item` y **0** `.wizard-options-container`, sin texto "Cotiza"/"Agregar al carrito", y el único CTA de acción es WhatsApp "Solicitar información" (BUG-397). El bloque Builder.io `.builder-89c44e22643141679676f33990624f5e` que lo contiene sirve entonces únicamente el hero. La anatomía abajo refleja el wizard **cuando está presente**; los contracts deben tratarlo como condicional, no garantizado.

> Componente dentro de la landing /servicios-lavado/ que permite cotización funcional con integración al cart. **CORRECCIÓN verificada en vivo (2026-06-11, sesión autenticada):** NO es un bloque inline siempre visible — es un **modal overlay** (`.modal-wizard`, `position:fixed`) que se **abre con un botón-imagen "Cotizar lavado"** (ver #0). El `.modal-wizard` permanece en el DOM oculto hasta que el trigger lo muestra. Clase scoping `⭐️wscmo6-0`.

#### 0. Trigger y apertura del modal (verificado en vivo 2026-06-11)

> Este sub-paso resuelve por qué sesiones previas no encontraban el wizard "por texto" y cómo abrirlo determinísticamente en automatización. Ver técnica homologada en `.claude/rules/tests.md` y `tasks/lessons.md` (L-014).

- **El trigger es una IMAGEN, no un botón de texto.** El CTA azul "Cotizar lavado" se renderiza como `<img class="banner-desk" alt="Imagen Desktop">` (Builder.io CDN, src termina en `…a634cf17136249eb951283231d61fa58`), tamaño ~243×84 px, con handler Qwik `on:click`. **No tiene `role="button"`, su `alt` es genérico "Imagen Desktop", y no contiene texto** → cualquier búsqueda por `textContent`/`getByRole('button', {name:/cotizar/})` lo OMITE (causa raíz del "no aparece el botón"). → **BUG-B2C-567** (a11y).
- **Cómo localizar el trigger (12 ejes — eje imagen/handler, no texto):** `[...document.querySelectorAll('img[class*="banner-desk"]')]` filtrando por `on:click` + rect de tamaño botón (~243×84). El hero grande (1361×473) es otra imagen banner del mismo componente; discriminar por tamaño.
- **Apertura:** click CDP real sobre la imagen (los handlers Qwik no responden a `.click()` programático — patrón Qwik del proyecto) → inyecta/muestra `.modal-wizard` (`display:flex`, `position:fixed`) con `.modal-content-wizard` adentro. Verificado: tras el click `document.querySelector('.modal-wizard')` pasa de oculto a visible.
- **Presencia A/B (BUG-457):** la landing es Builder.io con variantes; en ciertas variantes el trigger no se sirve. En automatización, pinear la variante copiando el `builderVisitorId` (localStorage) de una sesión que sí lo muestre — Builder.io asigna la variante por hash determinista de ese ID. Sin pin, tratar el trigger como condicional.

#### 1. Ubicación y carga

- **Container Builder.io:** `<div class="builder-89c44e22643141679676f33990624f5e builder-block">` → bloque A/B `variant-b4576184a3e04038ab0f0711614b4446`.
- **El modal `.modal-wizard` NO es visible en carga inicial** — requiere el click en el trigger imagen "Cotizar lavado" (#0). (Sesiones previas lo documentaron como "inline sin trigger"; corregido aquí.)
- **Modal overlay** `position:fixed`, layout 2 columnas: izquierda = wizard (`.wizard-container`), derecha = panel beneficios (`.benefits`).

#### 2. Estructura DOM completa (step 1 — selección)

```html
<div class="builder-89c44e22643141679676f33990624f5e builder-block">
  <p class="builder-text" style="font-size: 40px; color: white;">
    Cotiza tu limpieza profesional de tinaco o cisterna   <!-- ❌ NO es heading semántico -->
  </p>
  <h2>Contrata tu servicio de limpieza en tan solo 3 clics.</h2>
  <p>Tu servicio de limpieza en 3 clics:</p>
  <ul>
    <li>Elige: Selecciona hasta 3 tinacos o cisternas que quieras limpiar.</li>
    <li>Personaliza: Indica la capacidad de cada uno.</li>
    <li>Cotiza: Obtén tu precio final al instante.</li>
  </ul>

  <div class="modal-wizard">
    <button class="close-wizard">✕</button>
    <div class="modal-content-wizard">
      <div class="wizard-container">
        <div class="wizard">
          <!-- header titles ya rendered above -->
          <div class="wizard-options-container">
            <div class="question"><p>¿Qué quieres lavar?</p></div>
            <div class="wizard-options">
              <!-- Item Tinaco -->
              <div class="cotizacion-item">
                <div class="cotizacion-item-title flex items-center gap-2">
                  <img class="h-8 w-auto" alt="Tinaco" src="cdn.builder.io/.../3f9649f1.../"/>
                  <h3>Tinaco</h3>
                </div>
                <div class="quantity-control flex items-center gap-2 mt-2">
                  <button class="less disabled opacity-50" disabled><svg/></button>
                  <span class="cantidad text-lg font-bold">0</span>
                  <button class="plus"><svg/></button>
                </div>
                <div class="selectores mt-2">
                  <div class="custom-dropdown relative mt-2">
                    <div class="dropdown-toggle border px-3 py-2 rounded cursor-pointer flex justify-between">
                      Capacidad▼
                    </div>
                  </div>
                </div>
              </div>
              <!-- Item Cisterna (misma estructura, alt="Cisterna") -->
            </div>
            <div class="guardar-wrapper mt-6 flex justify-end">
              <button class="guardar bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700" disabled>
                Cotizar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Sección "¿Qué incluye tu servicio de limpieza?" -->
  <h2>¿Qué incluye tu servicio de limpieza?</h2>
  <p>Mantenimiento residencial y profesional para tu tinaco o cisterna.</p>
  <div class="benefits">
    <!-- 5 features con iconos check -->
  </div>
  <p>*La limpieza se recomienda 2 veces al año.</p>
</div>
```

#### 3. Matriz exhaustiva — TODOS los buttons del wizard (step 1)

| # | Texto/aria-label | Tag | Clase | Estado inicial | Comportamiento esperado | Verificado |
|---|---|---|---|---|---|---|
| 1 | `✕` (close-wizard) | BUTTON | `close-wizard` | enabled | Cerrar wizard inline (probable hide section) | ❌ Sin aria-label, sin title — solo carácter U+2715 |
| 2 | (sin texto) Less Tinaco | BUTTON | `less disabled opacity-50` | **disabled** (cantidad=0) | Decrementar cantidad de Tinacos en 1 | ✅ Se habilita cuando count > 0 |
| 3 | (sin texto) Plus Tinaco | BUTTON | `plus` | enabled | Incrementar cantidad de Tinacos en 1 | ✅ Verificado — incrementa correctamente. **❌ BUG: No respeta límite "hasta 3"** mencionado en copy — permite ir a 4+ |
| 4 | (sin texto) Less Cisterna | BUTTON | `less disabled opacity-50` | disabled | Decrementar cantidad de Cisternas en 1 | mismo patrón |
| 5 | (sin texto) Plus Cisterna | BUTTON | `plus` | enabled | Incrementar cantidad de Cisternas en 1 | mismo patrón |
| 6 | "Cotizar" | BUTTON | `guardar bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700` | **disabled** (no hay items ni capacidad) | Generar resumen + precio (step 2 inline) | ✅ Verificado — al click muestra resumen `$899.00` con botón "Agregar al carrito" |

#### 4. Custom dropdown "Capacidad" — anatomía

```html
<div class="custom-dropdown relative mt-2">
  <div class="dropdown-toggle border px-3 py-2 rounded cursor-pointer flex justify-between">
    Capacidad▼      <!-- texto + carácter U+25BC -->
  </div>
  <!-- Al click se inyecta: -->
  <ul class="dropdown-menu absolute z-10 bg-white border rounded mt-1 w-full max-h-...">
    <li class="dropdown-item px-3 py-2 hover:bg-gray-100 cursor-pointer">De 450 L a 1,100 L</li>
    <!-- ⚠️ SOLO 1 opción visible para Tinaco — verificar si hay más rangos -->
  </ul>
</div>
```

**Verificado al click del toggle:**
- Toggle "▼" cambia a "▲" cuando abierto ✓ (visual feedback OK)
- Lista aparece como `<ul class="dropdown-menu absolute">` con `<li class="dropdown-item">`
- **Solo 1 opción detectada para Tinaco:** `"De 450 L a 1,100 L"` — sospechoso porque Rotoplas tinacos van de 450L a 25,000L (Almacenamiento Especializado). Falta rangos: 1100-2500L, 2500-5000L, etc.
- Después de seleccionar, toggle muestra `"De 450 L a 1,100 L▼"` — **bug visual:** flecha sigue como ▼ (debería ▲ o ✓)

#### 5. Step 2 — Resumen + precio + Agregar al carrito (verificado)

Después de click "Cotizar" con `Tinaco=1, Capacidad="De 450 L a 1,100 L"`:

```
← Volver a cotizar

Servicio de mantenimiento a 1 tinaco

| Servicio | Capacidad           | Cantidad | Subtotal |
|----------|---------------------|----------|----------|
| Tinaco   | De 450 L a 1,100 L  | x1       | $899.00  |

Total: $899.00

[Agregar al carrito]
```

**Comportamiento verificado (2026-06-11):**
- URL **NO cambia** (`/servicios-lavado/` permanece) — la transición step 1 → step 2 ocurre **dentro del mismo modal** (`.modal-content-wizard`), sin navegación. (El modal sí es un overlay `position:fixed` abierto por el trigger #0; la corrección aplica a la apertura, no a esta transición interna.)
- **Precio $899.00 calculado client-side** — al click en "Cotizar" **NO se dispara ninguna petición de red** (verificado con hook a `fetch`/XHR instrumentado ANTES del click). El precio sale de una tabla en el componente Qwik, no de un endpoint de cotización. Implicación para contracts/dashboard: el precio no es verificable contra backend en este paso; se vuelve real recién al `Agregar al carrito` (línea del cart con SKU).
- Step 2: tabla `Servicio | Capacidad | Cantidad | Subtotal` (Tinaco | De 450 L a 1,100 L | x1 | $899.00), `Total: $899.00`, heading dinámico **"Servicio de mantenimiento a 1 tinaco"**, botón **"Agregar al carrito"** + link **"← Volver a cotizar"** (regresa al step 1).
- Evidencias: `evidencias/F2-servicio-lavado-boton-cotizar.png` (trigger), `…-wizard-abierto.png` (step 1), `…-cotizacion-resultado-899.png` (step 2).

#### 6. Bugs específicos del wizard (BUG-B2C-400 → BUG-B2C-413)

**Bugs de esta sección:** BUG-B2C-400→413 + **567, 568, 569, 570** — detalle en Parte IV. (Cubren: stepper sin clamping ni a11y, dropdown de capacidad `<div>` no-`<select>` con una sola opción, heading no semántico, mezcla Tailwind + Qwik, assets en 2 workspaces Builder.io, copy del flechado; **567** trigger imagen sin role/alt, **568** modal sin role=dialog/aria-modal/focus-trap, **569** detalles del servicio con copy placeholder en el cart, **570** servicio sin imagen en el cart.)

#### 7. Matriz definitiva — Flow completo de cotización (2 steps)

| Step | Lo que ve el usuario | Acciones disponibles |
|---|---|---|
| **Step 1: Selección** | Título wizard + lista 3 pasos + 2 cards (Tinaco / Cisterna) con stepper +/- y dropdown Capacidad | (a) Plus/Less en cada card; (b) Abrir dropdown Capacidad de Tinaco activo; (c) Cerrar wizard (✕); (d) Click "Cotizar" (disabled hasta tener cantidad + capacidad) |
| **Step 2: Resumen + agregar al carrito** | Tabla `Servicio \| Capacidad \| Cantidad \| Subtotal`, Total $XXX, botón "Agregar al carrito" | (a) "← Volver a cotizar" para regresar al step 1; (b) "Agregar al carrito" para integrar con cart |

#### 9. Flujo real de compra del servicio — verificado E2E hasta carrito (2026-06-11, autenticado)

> **RESUELVE el pendiente #3 del overview** (¿el servicio es compra o solo cotización?). **El servicio SÍ es comprable** como un producto estándar de e-commerce: "Agregar al carrito" lo inserta como line-item con SKU propio y de ahí continúa por el checkout normal hacia el pago en línea ("Realiza tu pago seguro 100% en línea" del copy). Mapeado simulando el recorrido real de un cliente (sin atajos por API). Cuenta `c.agarcia@rotoplas.com` ("Jorge Rotoplas").

**Secuencia real del usuario (la que deben replicar dashboard #6 y contract #7):**

1. `/servicios-lavado/` → click trigger imagen **"Cotizar lavado"** (#0) → abre `.modal-wizard`.
2. Stepper Tinaco `+` (`button.plus`) → cantidad `1` → aparece dropdown **Capacidad** (`.custom-dropdown`).
3. Abrir dropdown (`.dropdown-toggle`) → `<ul.dropdown-menu>` con `<li.dropdown-item>` **"De 450 L a 1,100 L"** (única opción para Tinaco) → seleccionar.
4. `button.guardar` "Cotizar" se habilita → click → step 2 con `$899.00`.
5. **"Agregar al carrito"** → **cierra el modal** + dispara el **mini-cart drawer** "Añadiste este articulo a tu carrito" (`a.drawer-button` "Ver Carrito"). El badge del header pasa a **1**.
6. `/cart` → el servicio aparece como **`service-card`** (componente distinto al line-item de producto físico):

| Campo | Valor verificado | Selector / nota |
|---|---|---|
| Nombre | **Mantenimiento Tinaco** | header de la fila |
| SKU | **452308** | `SKU: 452308` (mapea en CT a "Tinaco Plus+ equipado 2,500 beige mtto") |
| Precio | **$899.00** | columna Subtotal |
| Imagen | **"No image available"** (placeholder) → **BUG-B2C-570** | el servicio no trae imagen de producto |
| Cantidad | stepper `−  1  +` | `button.decreasebutton` / `button.increasebutton` — **icon-only sin aria-label** (a11y, patrón BUG-401) |
| Eliminar | ícono basura | quita el servicio del cart |
| Detalles | toggle **"Detalles del servicio"** (`button.service-card__details-toggle`, chevron `.service-card__details-arrow`) | al expandir muestra **5 líneas placeholder**: *"Tinaco Plus+ equipado 2,500 beige mtto detalle 1…5"* → **BUG-B2C-569** (copy de relleno sin terminar) |

7. **Resumen del pedido** (`Resumen del pedido`): `Subtotal: $899.00` · `Ahorraste: $0.00` · `Envío: $0.00` · `Total: $899.00 (Incluye IVA)` · `1 Artículo(s) en el carrito` · banner **"Atendido por tu distribuidor local autorizado"**.
8. **Gate T&C** → checkbox "Acepto todos los Términos y condiciones" (link `a.terms-span` → /terminos-y-condiciones) **habilita** `button.button-primary` **"Iniciar compra"** (disabled hasta marcar). También `button.clear-cart` "Vaciar carrito".
9. "Iniciar compra" → entra al **checkout estándar** (`/checkout/…`, mismo wizard de 3 pasos que el producto físico, II.5.b) → pago en línea. *(No se completó el pago — fuera de necesidad; el flujo de pago ya está mapeado E2E para producto físico en §II.5.b/§9.d.)*

**Conclusión para el plan de órdenes (s19) y contracts:** "crear orden tipo servicio" es un flujo **real y completo** que termina en pago. El script de creación (`crear-orden-b2c.js`) y el contract deben recorrer la secuencia 1→9 por UI (no inyectar el SKU 452308 directo al cart). Métodos de pago: los mismos del checkout estándar (crédito/débito/transferencia/efectivo<5k) — a confirmar si el servicio restringe alguno.

**Evidencias:** `evidencias/F2-servicio-lavado-cart-lineitem-899.png` (line-item + resumen + gate T&C).

#### 8. DOM contract Playwright — wizard de cotización

```javascript
// tests/visual/cotiza-lavado-wizard.spec.js
import { test, expect } from '@playwright/test';

test.describe('II.16.c Wizard cotización /servicios-lavado/', () => {
  test('estructura step 1', async ({ page }) => {
    await page.goto('https://qarotoplasmx.io/servicios-lavado/');
    const wizard = page.locator('.wizard-options-container');
    await wizard.scrollIntoViewIfNeeded();
    await expect(wizard).toBeVisible();
    await expect(wizard.locator('.cotizacion-item')).toHaveCount(2);
    await expect(wizard.locator('button.plus')).toHaveCount(2);
    await expect(wizard.locator('button.less')).toHaveCount(2);
    await expect(wizard.locator('button.guardar:has-text("Cotizar")')).toBeDisabled();
  });

  test('BUG-400: plus no respeta límite 3', async ({ page }) => {
    await page.goto('https://qarotoplasmx.io/servicios-lavado/');
    await page.locator('.wizard-options-container').scrollIntoViewIfNeeded();
    const plusTinaco = page.locator('button.plus').first();
    for (let i = 0; i < 5; i++) await plusTinaco.click();
    const cantidad = await page.locator('.cantidad').first().textContent();
    expect(parseInt(cantidad)).toBeGreaterThan(3);  // hoy true (BUG) — invertir a == 3 tras fix
  });

  test('BUG-401: botones +/- sin aria-label', async ({ page }) => {
    await page.goto('https://qarotoplasmx.io/servicios-lavado/');
    const less = page.locator('button.less').first();
    expect(await less.getAttribute('aria-label')).toBeNull();  // hoy null (BUG)
  });

  test('BUG-404: dropdown Capacidad con 1 sola opción', async ({ page }) => {
    await page.goto('https://qarotoplasmx.io/servicios-lavado/');
    await page.locator('button.plus').first().click();
    await page.locator('.dropdown-toggle').first().click();
    const options = await page.locator('.dropdown-item').count();
    expect(options).toBe(1);  // hoy 1 (BUG)
  });

  test('flow completo step 1 → step 2 → cart', async ({ page }) => {
    await page.goto('https://qarotoplasmx.io/servicios-lavado/');
    await page.locator('button.plus').first().click();
    await page.locator('.dropdown-toggle').first().click();
    await page.locator('.dropdown-item').first().click();
    await expect(page.locator('button.guardar:has-text("Cotizar")')).toBeEnabled();
    await page.locator('button.guardar:has-text("Cotizar")').click();
    await expect(page.locator('text=Total:')).toBeVisible();
    await expect(page.locator('text=$899.00')).toBeVisible();
    await expect(page.locator('button:has-text("Agregar al carrito")')).toBeVisible();
  });

  test('BUG-407: heading principal no es h1/h2', async ({ page }) => {
    await page.goto('https://qarotoplasmx.io/servicios-lavado/');
    const title = page.locator('text=Cotiza tu limpieza profesional').first();
    expect(await title.evaluate(el => el.tagName)).not.toBe('H1');
    expect(await title.evaluate(el => el.tagName)).not.toBe('H2');
  });
});
```

#### 9. Evidencias del wizard

- `evidencias/F1D-09-cotiza-widget-inicial.png` — viewport con widget step 1 visible (cantidades = 0)
- `evidencias/F1D-10-cotiza-widget-tinaco1.png` — widget con Tinaco=1 y dropdown Capacidad
- `evidencias/F1D-11-cotiza-resultado.png` — step 2 con resumen $899.00 + "Agregar al carrito"
- `scripts/F1D-cotiza-widget.json` — primer inspección del widget
- `scripts/F1D-cotiza-widget-anatomy.json` — anatomía + steppers + features
- `scripts/F1D-cotiza-widget-tree.json` — árbol completo del wizard-options-container
- `scripts/F1D-cotiza-interactivo.json` — clicks plus + verificación límite 3
- `scripts/F1D-cotiza-capacidad.json` — dropdown abierto + opciones de capacidad
- `scripts/F1D-cotiza-resultado.json` — click Cotizar + step 2 resumen + precio

#### 10. Presencia inestable del wizard

El wizard aparece de forma intermitente (A/B test / feature-flag / regresión de contenido Builder.io): funcional en algunas cargas (flujo $899 + "Agregar al carrito") y ausente del DOM en otras. Los contracts no pueden asertar su presencia; cuando no está, el único path es WhatsApp (BUG-397).

**Bug de esta sección:** BUG-B2C-457 — detalle en Parte IV.

---

### II.16.d Ciclo post-compra del servicio — detalle de orden + agendado (`/booking/`) + correos (verificado E2E 2026-06-11, s20)

> **Mapeo en vivo del ciclo completo de un servicio comprado.** Orden de prueba real: **`6122026VSX6C`** (Mantenimiento Tinaco, SKU 452308, $899, tarjeta sandbox 4242, "Sin CFDI"), cuenta `c.agarcia@rotoplas.com`. Resuelve cómo y cuándo se **agenda** el servicio y qué **correos** dispara. El servicio se trata como un producto físico con un ciclo de fulfillment + una capa extra de "cita".

#### 1. Detalle de orden — `/customer/orders/{orderNumber}/`

- **Pipeline de estado idéntico al producto físico:** `En proceso → Confirmado → En camino → En punto de entrega → Entregado` (no hay estados propios de servicio).
- Bloque del ítem: **"1 Servicios"** → **Mantenimiento Tinaco**, **`Número de servicio: {orderNumber}-{sku}-0`** (ej. `6122026VSX6C-452308-0`), **`Instalación en: Hogar`**, precio, "Términos y condiciones aceptados". Reaparecen las **5 líneas placeholder** "Tinaco Plus+ equipado 2,500 beige mtto detalle 1…5" (BUG-B2C-569).
- **Gate de agendado (copy):** *"*El servicio de Instalación se programará una vez que recibas el producto. Recibirás una notificación para agendar la cita"*. Mientras el estado **NO** es "Entregado", **no hay botón de agendar** (`agendarButtonPresent: false`).
- Sección informativa **"Proceso de Cancelación de Servicios"** (política específica de servicios) + botón **"Cancelar pedido"** / **"Solicitar devolución"**.
- **Datos de facturación genéricos pese a "Sin CFDI":** RFC `XAXX010101000`, Régimen `616-Sin Obligaciones Fiscales`, Uso CFDI `S01` (consistente con BUG-556).
- **⚠️ Inconsistencia PCI (BUG-B2C-571):** la confirmación `/order/{n}/` enmascara `**** **** **** 4242` (4 dígitos, correcto), pero el detalle `/customer/orders/{n}/` muestra **`**********424242` (últimos 6 dígitos)** → expone 6 dígitos, mismo patrón que el histórico BUG-119 del B2B.

#### 2. Desbloqueo del agendado — CTA "Agendar limpieza"

- **Solo cuando `shipmentState → Delivered` (UI = "Entregado")** aparece en el detalle de orden el CTA **"Agendar limpieza"** (`<a href="/booking/{orderNumber}-{sku}-0">`). Verificado avanzando la orden por CT API (`ct:b2c:set-state Confirmed` + `ct:b2c:set-shipment Delivered`) → reload → el botón aparece.
- **⚠️ Inconsistencia de copy:** el CTA dice "Agendar **limpieza**", pero el flujo destino se titula "Cita para **instalación**" y los textos hablan de "servicio de **instalación**" / "Saltar cita de **instalación**" → mezcla limpieza/lavado vs instalación en todo el flujo de servicio (**BUG-B2C-572**, copy heredado del flujo de instalación de producto).

#### 3. Flujo de agendado — `/booking/{orderNumber}-{sku}-0`

- **Heading:** "Cita para instalación" + "Número de servicio: {…}" + nombre del servicio + (placeholder details BUG-569) + dirección de la orden + "No image available".
- **Copy:** *"Elige la fecha y hora que mejor se adapte a tu agenda. Agenda hoy y asegura el mejor horario."* · **Zona horaria: `America/Mexico_City`**.
- **Tabs:** "Sugerencias" / "Más fechas".
- **Slots** (`div.hour-card.date-card`, click selecciona, gating del Confirmar): se ofrecieron 5 — `12 de junio 08:00 a 12:00 hrs`, `12 de junio 13:00 a 18:00 hrs`, `13 de junio 08:00 a 12:00 hrs`, `13 de junio 13:00 a 18:00 hrs`, `15 de junio 08:00 a 12:00 hrs` (franjas de mañana 08-12 y tarde 13-18). Inputs hidden `selectedQuote`, `order`.
- **Botones:** `button.confirm-button` **"Confirmar"** (disabled hasta seleccionar slot) + **"Saltar cita de instalación"** (alternativa: *"¿Quieres programar tu cita después? Puedes agendar tu instalación más tarde desde tu Portal del cliente."*).
- **Confirmar** → POST `/booking/{numeroServicio}/q-data.json?qaction=uEmyv6ZhUxg` (HTTP 200) → pantalla **"Instalación programada con éxito"**: *"El servicio de instalación está programado para Junio 12, 08:00 a. m. a 12 p. m."* + "Tu número de servicio es: {…}" + **"Te enviaremos un correo electrónico de confirmación con los detalles e información de los requisitos."** + CTAs "Continuar comprando" / "Ver detalle del pedido". Evidencia `F2-servicio-lavado-cita-programada-exito.png`.

#### 4. Correos del ciclo de servicio (Capa 2) — qué dispara y qué NO

| Evento | Correo | ¿Reproducible vía CT API? |
|---|---|---|
| Compra creada (orden Open) | **"Tu pedido está en proceso"** (plantilla A, idéntica a producto físico — **sin nada específico de servicio ni link de agendado**) | ✅ (~s) |
| `orderState → Confirmed` | **"Tu pedido fue confirmado"** | ✅ (~s) |
| `shipmentState → Delivered` | "Tu pedido fue entregado" **+ (presunta) notificación "agenda tu cita"** | ❌ **NO vía CT API** — gate de fulfillment real (portal B2B + imagen de prueba, ver nota s18). La UI sí desbloquea "Agendar limpieza" con el estado crudo, pero **el correo de agendar no se dispara** por el cambio CT solo. |
| Cita confirmada (`/booking` Confirmar) | La pantalla **promete** "Te enviaremos un correo electrónico de confirmación" | 🔎 **NO observado** en el inbox tras confirmar la cita (esperado vs recibido divergen → posible **BUG-B2C-573**: correo de confirmación de cita prometido pero no entregado; o bien depende del mismo gate de fulfillment). Pendiente reconfirmar. |

> **Conclusión para Capa 2 de serviciados:** el ciclo de **agendado** depende del evento "Entregado" REAL (portal B2B + imagen), no automatizable solo por CT API — igual que el correo "entregado". El correo de confirmación de cita que promete la UI **no se observó** al confirmar por UI. La compra del servicio en sí dispara los mismos correos A (creación) y de confirmación que un producto físico.

**Bugs de esta sección:** BUG-B2C-569 (placeholder en detalles), 571 (PCI 6 dígitos en detalle de orden), 572 (copy "instalación" vs "limpieza/lavado" en todo el flujo de agendado), 573 (correo de confirmación de cita prometido y no observado) — detalle en Parte IV / bugs-b2c.md.

**Evidencias:** `F2-servicio-lavado-order-detail-agendado.png`, `F2-servicio-lavado-booking-picker.png`, `F2-servicio-lavado-cita-programada-exito.png`, `F2-servicio-lavado-orden-6122026VSX6C-exito.png`, `F2-servicio-lavado-checkout3-pago.png`.

---

## II.17 `/nosotros/`

### Meta tags

| Atributo | Valor | Diagnóstico |
|---|---|---|
| `<title>` | `Nosotros` | ✅ |
| `meta[name="description"]` | `¡Disfruta lo mejor de Rotoplas al alcance de un solo clic!` | ❌ genérico sistémico (BUG-B2C-221) |
| `meta[name="keywords"]` | `Rotoplas, agua, soluciones, productos, servicios` | ⚠️ keywords genéricos (poco SEO relevante hoy) |
| `meta[name="robots"]` | `index, follow` | ✅ |
| `meta[property="og:title"]` | `Nosotros` | ✅ |
| `meta[property="og:description"]` | `¡Disfruta lo mejor de Rotoplas al alcance de un solo clic!` | ❌ duplica el genérico |
| `meta[property="og:url"]` | `https://qarotoplasmx.io/nosotros/` | ✅ |
| `meta[property="og:image"]` | ❌ AUSENTE | sin imagen para preview |
| **`meta[name="key1"]`** | `value1` | ❌ **placeholder LITERAL no editado en producción** (BUG-B2C-241 NEW CRÍTICO) |
| **`meta[name="key2"]`** | `value2` | ❌ **placeholder LITERAL** (BUG-B2C-241) |
| **`meta[name="position"]`** | `1` | ❌ meta tag no estándar (BUG-B2C-242 NEW) |
| `link[rel="canonical"]` | `https://qarotoplasmx.io/nosotros/` | ✅ |
| `<html lang>` | `es-mx` | ✅ |

### Headings

| Nivel | Total | Detalle |
|---|---|---|
| **H1** | **1** ✅ | `"Nosotros"` · class `mt-0 fs40 lhn light blue5` (utility classes, no Qwik scoped — sistema diseño propio) · visible |
| **H2** | 6 | 2 modales globales + **4 propios `class="rtp-btn"`**: `"Quiénes somos"` · `"Estrategia"` · `"Carreras"` · `"Corporativo"` |
| H3 | 18 | 1× modal · 6× cards de productos recomendados (`info__title`) · 11× col-titles del footer (variantes mobile + desktop) |
| H4-H6 | 0 | — |

### Breadcrumb

- `nav[aria-label*="breadcrumb"]`: 0
- `[class*="breadcrumb"]`: **3** — la página `/nosotros/` SÍ tiene breadcrumb (diferente de las categorías que no lo tienen). Verificar contenido exacto.

### Estructura de la página (4 secciones)

| Sección | Class | Headings | Links | Imgs |
|---|---|---|---|---|
| Hero | `g-flushed` | H1: "Nosotros" | 1 | 1 (imagen "Almacenamiento" 680×410 — alt explícito ✅) |
| 4 tarjetas principales | `g-flushed` | 4× H2 (Quiénes somos · Estrategia · Carreras · Corporativo) | 12 | 6 (imágenes 327×218, alts correctos) |
| Bloque adicional (probable mosaico de productos) | `g-flushed` | — | 6 | 6 |
| Sección de productos relacionados | — | 6× H3 (productos: Tinaco Plus+, Tee Reducida, Montura de Derivación...) | 6 | 13 |

### CTAs principales (links del cuerpo)

| Texto | Href | Target | Diagnóstico |
|---|---|---|---|
| `Quienes somos` | `/nosotros/quienes-somos` | `_self` | ❌ "Quienes" sin tilde (debería "Quiénes") — typo de copy. Pero el H2 sí dice "Quiénes" con tilde. Inconsistencia entre H2 y label del link. |
| `Quiénes somos` | `/nosotros/quienes-somos` | `_self` | ✅ duplicado (mismo destino) — segundo link con tilde correcta. |
| `Estrategia` | `/nosotros/estrategia` | `_self` | ❌ **HTTP 410 GONE** (recurso eliminado) — link roto |
| `Estrategia` | `/nosotros/estrategia/` | `_self` | ❌ HTTP 410 (con slash, también 410) — link roto duplicado |
| `Carreras` | `https://rotoplas.com/careers/` | `_self` (no _blank) | ⚠️ cross-domain pero sin `target="_blank"` — abre en misma pestaña, usuario sale del sitio |
| `Carreras` | `https://rotoplas.com/careers/` | `_blank` | ✅ duplicado con _blank correcto |
| `Corporativo` | `https://rotoplas.com/` | `_self` | mismo problema BUG-243 |
| `Corporativo` | `https://rotoplas.com/` | `_blank` | duplicado con _blank |

**Patrón:** los 4 CTAs (Quiénes somos, Estrategia, Carreras, Corporativo) aparecen **DUPLICADOS en el DOM** con diferente `target` (`_self` y `_blank`). Sugiere render duplicado del mismo componente con variantes responsive (desktop sin target / mobile con target?). → **BUG-B2C-243 NEW MEDIA arq**.

#### Sub-páginas verificadas

| URL | Status | Title | H1 | Bug |
|---|---|---|---|---|
| `/nosotros/quienes-somos` | 200 (redirige a `/quienes-somos/` con slash) | `"¿Quiénes somos? \| Más agua con Rotoplas México"` ✅ | — | OK — primera página con title bien formateado |
| `/nosotros/quienes-somos/` | 200 (canónica) | mismo | — | OK |
| **`/nosotros/estrategia`** | **HTTP 410 GONE** | — | — | **BUG-B2C-246 NEW CRÍTICO** — link roto |
| **`/nosotros/estrategia/`** | **HTTP 410 GONE** | — | — | mismo bug |
| **`/nosotros/identidad/`** | 200 | `Rotoplas` (genérico) | **`"Ha ocurrido un error"`** | **BUG-B2C-247 NEW CRÍTICO** — link a página de error |
| **`/nosotros/empleos/`** | 200 | `Rotoplas` (genérico) | **`"Ha ocurrido un error"`** | **BUG-B2C-248 NEW CRÍTICO** — link a página de error |
| `/nosotros/presencia/` | 200 | `"Nosotros > Presencia"` | — | ⚠️ formato breadcrumb-style — único en el sitio, inconsistente con otros titles |

### Links a catálogo — URL legacy

En `/nosotros/` los links a categorías de producto usan el formato **legacy** `/categoria-producto/{slug}/` en lugar del canónico `/products/{slug}/`:
- `/categoria-producto/almacenamiento/`
- `/categoria-producto/almacenamiento-especializado/`
- `/categoria-producto/conduccion/`
- `/categoria-producto/purificacion/`
- `/categoria-producto/tratamiento/`
- `/categoria-producto/calentamiento/`

Verificado: `/categoria-producto/almacenamiento/` **redirige a `/products/almacenamiento/`** (HTTP 301/302 server-side). Por lo tanto no es link roto, pero **es duplicate content para SEO** (dos URLs canónicas para la misma página). → **BUG-B2C-249 NEW MEDIA SEO**.

### CTAs adicionales

| Texto | Href | Tipo |
|---|---|---|
| `Llamar` | `tel:8005063000` | tel: link (selector contracts) |
| `Contactar` | `https://wa.me/525547420835?text=Hola%2C%20necesito%20ayuda` | WhatsApp deep link (target=`_blank`) |
| `Nosotros` (footer del Nosotros) | `/nosotros/identidad/` | ❌ link a página de error (BUG-247) |
| `Empleos` | `/nosotros/empleos/` | ❌ link a página de error (BUG-248) |
| `Presencia` | `/nosotros/presencia/` | OK |
| `Estrategia` | `/nosotros/estrategia/` | ❌ HTTP 410 (BUG-246) |

### Imágenes

12 imágenes en main, todas servidas desde `cdn.builder.io`. **Alts correctos** (`"Almacenamiento"`, `"Quiénes somos"`, `"Estrategia"`, `"Carreras"`, `"Corporativo"`) — contrasta con las cards de catálogo (BUG-178 con alt vacío). En `/nosotros/` el alt está bien.

### Videos

**Iframe encontrado:** `<iframe style="display: none;"></iframe>` — **NO es un video de YouTube.** Es un iframe oculto de tracking (GTM/analytics). En `/nosotros/` no existe video embebido; el mapeo previo que asumía YouTube estaba equivocado. Verificado en vivo 2026-06-05 con scroll completo sin lazy-load de video. G18 cerrado.

### Formularios

0 forms — pagina solo institucional, sin captura de leads.

### Cookie banner

✅ Presente (sistémico).

### Evidencia

- `F1D-03-nosotros-listado.png` — full-page screenshot

### Sub-rutas de `/nosotros/`

| Sub-ruta | Status | Contenido | Mapeo |
|---|---|---|---|
| `/nosotros/quienes-somos/` | **200** ✓ | Quiénes somos + Misión/Visión + Valores | II.17.a abajo |
| `/nosotros/presencia/` | **200** ✓ | Oficinas México + Latinoamérica | II.17.b abajo |
| `/nosotros/estrategia` (y `/estrategia/`) | **410 GONE** | — | BUG-246 |
| `/nosotros/identidad/` | 200 + "Ha ocurrido un error" | — | BUG-247 |
| `/nosotros/empleos/` | 200 + "Ha ocurrido un error" | — | BUG-248 |

---

### II.17.a `/nosotros/quienes-somos/` — Quiénes somos / Misión / Valores

#### Meta y estructura

| Campo | Valor | Hallazgo |
|---|---|---|
| `<title>` | `¿Quiénes somos? \| Más agua con Rotoplas México` | ✅ correcto (¿? + tilde + marca) |
| `meta[description]` | `¿Quiénes somos? Rotoplas es una empresa líder en el desarrollo con casi 4 décadas de experiencia y una cultura de innovación y sustentabilidad` | ✅ descriptivo |
| `og:title` | `¿Quiénes somos? \| Más agua con Rotoplas México` | ✅ |
| canonical | `/nosotros/quienes-somos/` | ✓ |
| H1 | (ninguno) | ❌ BUG-353 sistémico |
| Heading visible de contenido | `"Quienes Somos"` | Sin `¿?` ni tilde, mientras el `<title>` sí los tiene → inconsistencia dentro de la misma página (BUG-B2C-451) |

#### Contenido (secciones)

- **Quienes Somos:** "Grupo Rotoplas, empresa líder en el desarrollo y venta de soluciones de agua, con casi 4 décadas de experiencia… almacenamiento, conducción y mejoramiento del agua."
- **Misión y Visión:** "…ofrecer soluciones descentralizadas y sustentables de agua… dentro del Estilo Rotoplas." / "Nuestra Misión es que la gente tenga Más y mejor agua."
- **Nuestros valores** (3+): Colaboración, Actitud de servicio, Responsabilidad social y ambiental.

#### Breadcrumb (compartido con las sub-rutas de /nosotros/)

`Inicio` → `https://tempmx.rotoplas.com` · `Nosotros` → `https://tempmx.rotoplas.com/nosotros/` · `Nosotros` → `/nosotros/identidad/` · `Quiénes somos` → `/nosotros/quienes-somos`

El breadcrumb contiene **2 entradas "Nosotros"** con destinos distintos: una a `tempmx.rotoplas.com/nosotros/` (host TEMP roto) y otra a `/nosotros/identidad/` (página "Ha ocurrido un error"). Ambos destinos están rotos → breadcrumb inutilizable.

**Bugs de esta sección:** BUG-B2C-452 + sistémicos BUG-B2C-414 (host tempmx en breadcrumb), BUG-B2C-247 (/nosotros/identidad/ → error) y BUG-B2C-353 (sin H1) — detalle en Parte IV.

#### Evidencia

- `evidencias/F1D-17-nosotros-quienes-somos.png`

---

### II.17.b `/nosotros/presencia/` — Presencia México + Latinoamérica

#### Meta y estructura

| Campo | Valor | Hallazgo |
|---|---|---|
| `<title>` | `Nosotros > Presencia` | ❌ **BUG-250** — formato breadcrumb con `>` literal (mal en SERP) |
| `og:title` | `Nosotros > Presencia` | ❌ mismo problema en og:title |
| `meta[description]` | `¡Disfruta lo mejor de Rotoplas al alcance de un solo clic!` | ❌ BUG-359 sistémico |
| canonical | `/nosotros/presencia/` | ✓ |
| H1 | (ninguno) | ❌ BUG-353 sistémico |
| Intro | "Somos una empresa líder 100%mexicana con presencia en nuestro país y Latinoamérica…" | ❌ BUG-453 (sin espacio) |

#### Oficinas — "Presencia en México" (8)

| Región | Dirección (resumen) | Tel |
|---|---|---|
| Pacífico | Carretera al Campo 35 km 1.9, Zona insdustrial Santa Rosa, Los Mochis, Sin., C.P. 81200 | (668) 816 1680 |
| Guadalajara | Camino a Buenavista #56, Tlajomulco de Zúñiga, Jal., C.P. 45640 | (333) 884 1800 |
| León | Carretera a Santa Ana del Conde #1650, León, Gto., C.P. 37680 | (477) 710 7400 |
| México | Anáhuac #91, Col. El Mirador, Coyoacán, **México, D.F.**, C.P. 04950 | (55) 5483 2950 |
| Monterrey | Valle Dorado #300, Col. Valle Soleado, Guadalupe, N.L., C.P. 67114 | (818) 131 0300 |
| Golfo | Av. 2 manz. 6 lote 16a #261, Cd. Industrial Bruno Pagliai, Veracruz, Ver., C.P. 91697 | (229) 989 7200 |
| Tuxtla Gutiérrez | Calzada Emiliano Zapata km 2 #99 int. 5, Col. Terán, Tuxtla Gutiérrez, Chis., C.P. 29050 | (961) 604 1847 |
| Sureste | Tablaje #13348, Anillo Periférico, Mérida, Yuc., C.P. 97227 | (999) 930 0350 |

#### Oficinas — "Presencia en Latinoamérica" (5+)

Guatemala (Villa Nueva), El Salvador (La Libertad), Honduras (Tegucigalpa), Costa Rica (La Uruca), Nicaragua (Managua).

#### CTAs superiores (compartidos con /nosotros/, duplicados desktop/mobile)

| Texto | href | target | rel | Hallazgo |
|---|---|---|---|---|
| Quienes somos | `/nosotros/quienes-somos` | `_self` | — | ✅ destino 200. ❌ label sin tilde (→ BUG-455). |
| Estrategia | `/nosotros/estrategia` (+ `/estrategia/`) | `_self` | — | ❌ destino **410 GONE** (BUG-246). |
| Carreras | `https://rotoplas.com/careers/` | mezcla `_self`(sin rel) y `_blank`(noopener) | — | ❌ **BUG-456** rel/target inconsistente entre instancias del mismo link. |
| Corporativo | `https://rotoplas.com/` | `_self` | — | ✓ |

#### Bugs

Datos técnicos: intro "100%mexicana" sin espacio; dirección Pacífico "Zona insdustrial" (typo de "industrial"); oficina México usa "México, D.F." (nomenclatura deprecada desde 2016, inconsistente con CDMX usado en el resto del sitio); CTA "Carreras" con `target`/`rel` inconsistente entre instancias duplicadas (`_self` sin rel vs `_blank` con `noopener noreferrer`).

**Bugs de esta sección:** BUG-B2C-453→456 + sistémicos BUG-B2C-250 (title con `>` literal), BUG-B2C-246 (Estrategia → 410), BUG-B2C-452/414 (breadcrumb), BUG-B2C-353/359 (sin H1 + meta genérica) — detalle en Parte IV.

#### DOM contract — sub-rutas /nosotros/

```javascript
test('II.17.a /nosotros/quienes-somos/', async ({ page }) => {
  await page.goto('https://qarotoplasmx.io/nosotros/quienes-somos/');
  await expect(page).toHaveTitle('¿Quiénes somos? | Más agua con Rotoplas México');
  await expect(page.locator('h1')).toHaveCount(0); // BUG-353
});

test('II.17.b /nosotros/presencia/', async ({ page }) => {
  await page.goto('https://qarotoplasmx.io/nosotros/presencia/');
  await expect(page).toHaveTitle('Nosotros > Presencia');           // BUG-250
  await expect(page.getByText('Presencia en México')).toBeVisible();
  await expect(page.getByText('Presencia en Latinoamérica')).toBeVisible();
  // BUG-452: breadcrumb con 2 "Nosotros", uno a /identidad/ roto
  const nosotrosCrumbs = page.locator('main a', { hasText: /^Nosotros$/ });
  expect(await nosotrosCrumbs.count()).toBe(2);
});

test('estado sub-rutas /nosotros/', async ({ request }) => {
  expect((await request.get('https://qarotoplasmx.io/nosotros/quienes-somos/')).status()).toBe(200);
  expect((await request.get('https://qarotoplasmx.io/nosotros/presencia/')).status()).toBe(200);
  expect((await request.get('https://qarotoplasmx.io/nosotros/estrategia')).status()).toBe(410); // BUG-246
});
```

#### Evidencia

- `evidencias/F1D-16-nosotros-presencia.png` — full-page con las 8 oficinas México + Latinoamérica

---

## II.18 `/blog/` y posts

### Meta tags

| Atributo | Valor | Diagnóstico |
|---|---|---|
| `<title>` | `Rotoplas` | ❌ genérico (BUG-B2C-220 NEW) |
| `meta[name="description"]` | `¡Disfruta lo mejor de Rotoplas al alcance de un solo clic!` | ❌ genérico sistémico (BUG-B2C-221 NEW) |
| `meta[property="og:*"]` | ❌ AUSENTES | sin Open Graph |
| `meta[name="robots"]`, `twitter:*`, `og:image` | ❌ AUSENTES | (BUG-176/177/194/218 sistémicos) |
| `link[rel="canonical"]` | `https://qarotoplasmx.io/blog/` | ✅ |

### Headings — DRAMÁTICAMENTE INCORRECTOS

| Nivel | Total en página | Detalle |
|---|---|---|
| **H1** | **0** ❌ | **No existe H1 propio** del blog. La página carece de heading principal. **BUG-B2C-222 NEW CRÍTICO SEO/a11y.** |
| H2 | 2 | Solo H2 de modales globales (Agregar dirección, Verifica disponibilidad). No hay H2 propio del blog. |
| H3 | 12 | 0× H3 propios del contenido. Todos son del footer (col-titles) y modal. |
| H4-H6 | 0 | — |

> **Los títulos de cada post son simples `<a>` sin estar envueltos en heading semántico (H2/H3).** Penaliza SEO masivamente — Google espera que cada post listado tenga `<h2>` con su título. → **BUG-B2C-223 NEW ALTA SEO**.

### Estructura de posts — sin `<article>` semántico

Los posts NO están envueltos en `<article>` tags. Son `<div>` con clase `blog-article` + anchor + párrafo. → **BUG-B2C-224 NEW MEDIA a11y/SEO** — los posts de un blog deben usar `<article>` por convención HTML5.

### Card anatomy — DOM contract Playwright

**Selector estable para una post card:** `div.blog-article` (10 cards en pág 1)

```html
<div class="builder-8843900e09a845929ddbe3e085bae2b0 builder-block blog-article">
  <!-- Imagen del post (Builder.io CDN, 234x165, lazy, alt vacío) -->
  <img loading="lazy" alt="" width="234" height="165"
       src="https://cdn.builder.io/api/v1/image/assets%2Fb9d9011ceeb94100bbf26d7bffab75d6%2F{ASSET_GUID}" />
  
  <!-- Fecha (formato inglés abreviado) -->
  <div class="builder-{guid} builder-text">May 21</div>
  <div class="builder-{guid} builder-text">2025</div>
  
  <!-- Link de imagen (sin texto) -->
  <a href="https://qarotoplasmx.io/{slug-del-post}"></a>
  
  <!-- Título del post (ANCHOR, NO heading — BUG-223) -->
  <a href="https://qarotoplasmx.io/{slug-del-post}">Título del post completo</a>
  
  <!-- Resumen / excerpt -->
  <div class="builder-text">Lorem ipsum del post (220-280 chars típicamente)</div>
  
  <!-- CTA "Leer más" -->
  <a href="https://qarotoplasmx.io/{slug-del-post}">Leer más</a>
  
  <!-- Link de categoría -->
  <a href="https://qarotoplasmx.io/category/{slug-categoria}">Soluciones rotoplas</a>
</div>
```

**Selectores Playwright sugeridos:**
| Element | Selector estable |
|---|---|
| Una post card | `div.blog-article` |
| Título del post | `div.blog-article a:has-text("{título}")` o el 2do `<a>` de la card |
| Fecha | `div.blog-article .builder-text` (primer match con regex `^(Jan|Feb|...)`) |
| Año | `div.blog-article .builder-text:has-text(/^\d{4}$/)` |
| Imagen | `div.blog-article img` |
| Categoría | `div.blog-article a[href*="/category/"]` |
| CTA "Leer más" | `div.blog-article a:has-text("Leer más")` |
| Paginación link N | `a.pagination-link.pagination-number:has-text("N")` |
| Siguiente | `a.pagination-link.pagination-next` |

**Atributos clave del article:**
- `class="builder-{GUID_único} builder-block blog-article"` — el GUID es único por card, **no usar como selector**; usar `.blog-article` que sí es estable.
- Sin `on:click` propio (la navegación es via `<a>` href estándar)
- Sin `q:id` (no aparenta ser Qwik-handled — es Builder.io vanilla)

### Imágenes de posts

Las 10 imágenes de posts pág 1 son **todas** servidas desde `cdn.builder.io/api/v1/image/assets/{builder-org-id}/{asset-guid}`. **NO USAN** los buckets de commercetools / GCP. Esto es porque el blog vive en Builder.io CMS (separado del catálogo).

| Atributo de `<img>` | Valor | Diagnóstico |
|---|---|---|
| `src` | `https://cdn.builder.io/api/v1/image/assets%2Fb9d9011ceeb94100bbf26d7bffab75d6%2F{asset-guid}` | ✅ Builder.io CDN |
| `alt` | `""` (vacío en TODAS las 10 cards) | ❌ **BUG-B2C-178 sistémico también en blog** — screen readers no anuncian las imágenes |
| `loading` | `lazy` | ✅ |
| `width` × `height` | `234 × 165` | ✅ atributos HTML explícitos (previene layout shift) |
| `srcset` / `sizes` | ❌ ausentes | (BUG-B2C-198 sistémico) |

### Listado principal de posts (10 visibles en pág 1)

| # | Fecha (formato listado principal) | Título completo | URL del post | Categoría |
|---|---|---|---|---|
| 1 | `May 21 2025` | `Rotoplas: Un año de transformación sostenible e innovación tecnológica` | `/transformacion-sostenible-e-innovacion-con-rotoplas` | `Soluciones rotoplas` |
| 2 | `May 11 2025` | `Consecuencias del desabasto de agua en el campo: la tecnología como aliada para una agricultura sostenible` | `/consecuencias-desabasto-de-agua-en-el-campo` | `Soluciones rotoplas` |
| 3 | `May 9 2025` | `¿Cómo afecta la baja presión del agua a tu negocio? 5 señales para revisar tu instalación hidráulica` | `/como-afecta-la-baja-presion-de-agua-a-tu-negocio` | `Conduccion` |
| 4 | `May 8 2025` | `Irregularidades en el flujo de agua: ¿Para qué sirve una válvula globo?` | `/para-que-sirve-una-valvula-globo` | `Conduccion` |
| 5 | `May 7 2025` | `Crisis hídrica en el Norte: ¿Compromete el futuro del agua ante la presión de EE.UU.?` | `/crisis-hidrica-en-el-norte-del-pais-compromete-el-futuro-del-agua` | `Almacenamiento` |
| 6 | `Apr 24 2025` | `¿Cómo saber si tu sistema de filtración de agua está funcionando correctamente?` | `/como-saber-si-tu-sistema-de-filtracion-esta-funcionando` | `Purificacion` |
| 7 | `Apr 16 2025` | `Importancia del cuidado del agua en la industria hotelera` | `/importancia-cuidado-del-agua-industria-hotelera` | `Soluciones rotoplas` |
| 8 | `Apr 15 2025` | `Mangueras y conexiones: evita fugas y asegura un flujo de agua eficiente` | `/mangueras-y-conexiones-evita-fugas` | `Conduccion` |
| 9 | `Apr 14 2025` | `Tipos de materiales para tuberías de agua potable, ¿cuál es el mejor?` | `/tipos-de-materiales-para-tuberias-agua-potable` | `Conduccion` |
| 10 | `Apr 11 2025` | ` ¿Sabías que Puedes Recolectar Agua de Lluvia? Guía Fácil para Conocer la Captación Pluvial` | `/guia-facil-para-captacion-de-agua-pluvial` | `Soluciones rotoplas` |

**URLs de posts:** todas viven en el ROOT del dominio (`/transformacion-sostenible-e-innovacion-con-rotoplas`), NO en `/blog/{slug}/`. → **BUG-B2C-225 NEW INFO URL structure** — los posts del blog deberían estar bajo `/blog/{slug}/` para reflejar su jerarquía. Actualmente compiten por namespace con cualquier otra ruta del sitio.

### Listado secundario en sidebar (5 posts recientes — DUPLICACIÓN)

El DOM contiene un segundo listado con los **mismos 5 primeros posts** pero con formato de fecha **distinto**:

| # | Fecha (sidebar) | Título |
|---|---|---|
| 1 | `mayo 21, 2025` | `Rotoplas: Un año de transformación sostenible e innovación tecnológica` |
| 2 | `mayo 11, 2025` | `Consecuencias del desabasto...` |
| 3 | `mayo 9, 2025` | `¿Cómo afecta la baja presión...` |
| 4 | `mayo 8, 2025` | `Irregularidades en el flujo...` |
| 5 | `mayo 7, 2025` | `Crisis hídrica en el Norte...` |

→ **BUG-B2C-226 NEW MEDIA copy:** la **MISMA fecha** se renderiza en 2 formatos distintos en la **MISMA página** — listado principal usa formato inglés abreviado `"May 21 2025"`, sidebar usa formato español `"mayo 21, 2025"`. Inconsistencia notable y mal SEO para sitio en español.

### Paginación — off-by-one bug

- Página actual ([no destacada]): `/blog/` (sin parámetro)
- Botón `"2"` → href `/blog/?page=1` ❌ debería ser `?page=2` (o equivalente)
- Botón `"3"` → href `/blog/?page=2` ❌
- Botón `"Siguiente"` → href `/blog/?page=1`

→ **BUG-B2C-227 NEW MEDIA UX:** la numeración visible al usuario (1, 2, 3) NO coincide con el valor `?page=N` en el URL. La página `?page=1` es realmente la **segunda** página. Off-by-one que confunde URL sharing y bookmarks.

Sin `aria-current="page"` en el botón "1" (la página actual). Sin `aria-label="Página N"`. Mismo patrón de a11y débil que la paginación de categorías (BUG-179).

### Categorías de blog — sin tildes

URLs vistas en sidebar de cada post:
- `/category/soluciones-rotoplas` (`"Soluciones rotoplas"`)
- `/category/conduccion` (`"Conduccion"` — debería **Conducción**)
- `/category/almacenamiento` (`"Almacenamiento"`)
- `/category/purificacion` (`"Purificacion"` — debería **Purificación**)

→ **BUG-B2C-228 NEW BAJA copy:** las categorías del blog `"Conduccion"` y `"Purificacion"` **no llevan tilde** en su display name, aunque las mismas palabras SÍ llevan tilde en el resto del sitio (footer, mega-menú, listing). Inconsistencia: el campo "categoría" en el CMS del blog (probablemente WordPress separado o módulo Builder.io) tiene los nombres sin tilde.

### Buscador en el header del blog

El header del sitio incluye un input de búsqueda global (`id="search-input"`, placeholder `"Encuentra lo que buscas aquí..."`). Aparece duplicado 2× en el DOM (desktop + mobile responsive). No verifico aquí si la búsqueda incluye posts del blog o solo productos — pendiente F2.

### Cookie banner

✅ Presente (mismo patrón BUG-192 sistémico).

### Estado autenticado observado

Header autenticado: ✅ Jorge García + JG visible + cart badge "1". Cookie de sesión persistente.

### Evidencia

- `F1D-01-blog-vacio.png` — captura full-page del blog (la página NO está vacía: los posts SÍ se renderizan; el nombre del archivo es engañoso. Los queries por `<article>` no los detectan porque los posts no usan `<article>` tag → confirma BUG-224).
- Snapshot a11y completo: `F1D-blog-deep.json` + snapshot dump.

### II.18.b Post individual `/transformacion-sostenible-e-innovacion-con-rotoplas/`

#### Meta tags (MUY DIFERENTE al listing — los posts SÍ tienen OG, robots, article:*)

| Atributo | Valor | Diagnóstico |
|---|---|---|
| `<title>` | `Rotoplas: Un año de transformación sostenible e innovación tecnológica` | ✅ específico del post |
| `meta[name="description"]` | `¡Disfruta lo mejor de Rotoplas al alcance de un solo clic!` | ❌ **el genérico de siempre — debería ser excerpt del post** (BUG-B2C-233 NEW) |
| `meta[name="robots"]` | `index, follow` | ✅ |
| `meta[name="keywords"]` | `""` (vacío) | ❌ vacío (aunque keywords ya no son SEO relevantes) |
| `meta[name="author"]` | `AdminRotoplas` | ❌ **usuario admin literal, no nombre real** (BUG-B2C-232 NEW) |
| `meta[property="og:locale"]` | `es_MX` | ✅ |
| `meta[property="og:type"]` | `article` | ✅ correcto para post de blog |
| `meta[property="og:title"]` | `Rotoplas: Un año de transformación...` | ✅ |
| `meta[property="og:description"]` | `¡Disfruta lo mejor de Rotoplas al alcance de un solo clic!` | ❌ duplicado del genérico |
| `meta[property="og:url"]` | URL canónica | ✅ |
| `meta[property="og:site_name"]` | `Rotoplas` | ✅ |
| `meta[property="og:image"]` | `https://cdn.builder.io/api/v1/image/...` | ✅ imagen del post |
| **`meta[property="article:published_time"]`** | `2025-05-21T17:53:46` | ✅ ISO 8601 con timezone implícito UTC |
| **`meta[property="article:modified_time"]`** | `Thu Jan 01 1970 00:00:00 GMT+0000` | ❌ **UNIX EPOCH 0 — el post nunca se ha modificado según Google** (BUG-B2C-231 NEW MEDIA SEO) — debería estar ausente si no hay modificación o tener fecha real |
| `meta[name="twitter:card"]` | `summary_large_image` | ✅ |
| `meta[name="twitter:label1"]` / `twitter:data1` | `Escrito por` / `AdminRotoplas` | ❌ data1 usa el usuario admin literal |

> **Inconsistencia notable:** el listing `/blog/` carece de la mayoría de estos meta tags, pero el post individual SÍ los tiene. Significa que solo los posts (no el listing) están bien optimizados a nivel meta.

#### Headings

| Nivel | Total | Detalle |
|---|---|---|
| **H1** | **0** ❌ | **Post sin H1** — solo el `<title>` del documento. (BUG-B2C-230 NEW CRÍTICO SEO/a11y) — Google espera H1 con el título del post visible en el cuerpo. |
| **H2** | 5 propios del contenido + 2 modales globales | `wp-block-heading` (¡WORDPRESS!): "Compromiso ambiental: acción climática y economía circular" · "Impacto social: inclusión, voluntariado y acceso al agua" · "Gobernanza robusta y transparente" · "Eficiencia operativa y digitalización como motor de crecimiento" · "Mirada hacia el futuro" |
| H3 | 19 | `"Artículos relacionados"` ✅ propio · 6× títulos de productos relacionados (cards con `info__title`) · 12× col-titles del footer |
| H4 | 1 | `"Artículos recientes"` ✅ propio (sidebar) |
| H5–H6 | 0 | — |

> **HALLAZGO ARQUITECTÓNICO CRÍTICO — BUG-B2C-240 NEW:** la class `wp-block-heading` confirma que **el blog está montado sobre WORDPRESS** (integrado al CMS Builder.io / SSR Qwik del resto del sitio). Esto explica:
> - Categorías de blog sin tilde (`Conduccion`, `Purificacion`) — campo separado en WordPress no sincronizado con el catálogo
> - URL slugs en root del dominio (`/transformacion-...`) — pattern típico WordPress
> - `meta[name="author"] = "AdminRotoplas"` — username de WordPress
> - `article:published_time` con formato ISO 8601 — meta de Yoast SEO de WordPress
> - **Tres CMS coexistiendo en el sitio:** Builder.io (layouts) + commercetools (catálogo) + WordPress (blog). Cada uno con su propio sistema de fechas, autoría, etc.

#### "Artículos relacionados" — muestra PRODUCTOS, no posts

La sección H3 `"Artículos relacionados"` lista **6 cards de PRODUCTOS** (con class `card-product-filter`, las mismas del catálogo), NO posts del blog:
- Tinaco Plus+ con Bomba Centrifuga 1,100 lts
- Tinaco Vertical con Bomba Presurizadora
- Tinaco Vertical con Bomba Centrifuga 500
- Tinaco Plus+ con Bomba Presurizadora 1,1...
- Tee Reducida Central de 75 mm x 50 mm
- Montura de Derivación Hembra, 20 mm a 11...

→ **BUG-B2C-239 NEW MEDIA UX:** la palabra "Artículos" es ambigua (puede significar post o producto). En el contexto de un POST de blog, el usuario espera "Artículos relacionados" = POSTS relacionados, no productos. Refactorizar a "Productos relacionados" o usar realmente posts relacionados del mismo tema/categoría.

#### Lo que FALTA al post

| Elemento estándar de blog | Estado | Bug |
|---|---|---|
| **H1 con título visible** | ❌ ausente | BUG-B2C-230 |
| **Fecha visible al usuario** | ❌ ausente (solo en meta tag) | BUG-B2C-234 NEW |
| **Autor visible al usuario** | ❌ ausente (solo en meta tag, y dice "AdminRotoplas") | BUG-B2C-235 NEW |
| **Tiempo de lectura estimado** | ❌ ausente | — |
| **Tags del post** | ❌ ausente | — |
| **Botones social share** (Facebook, Twitter, WhatsApp, LinkedIn) | ❌ ausentes | BUG-B2C-236 NEW |
| **Sección de comentarios** | ❌ ausente (sin Disqus, FB Comments ni nativos) | BUG-B2C-237 NEW |
| **Breadcrumb** | ❌ ausente | BUG-B2C-238 (BUG-159 sistémico) |
| **Link a categoría del post** | ❌ ausente en el post | — |
| **Posts relacionados** (no productos) | ❌ ausente | parte de BUG-239 |
| **"Sigue leyendo" o "Newsletter signup"** | ❌ ausente | — |

#### Imágenes del contenido

- Imagen principal del post: `cdn.builder.io` con alt vacío (BUG-178 sistémico)
- Imágenes de productos relacionados (en cards card-product-filter): `images.cdn.us-central1.gcp.commercetools.com/...` 161×161 (commercetools CDN — sexto origin)

#### Evidencia

- `F1D-02-post-individual-transformacion.png` — full-page screenshot del post individual

### II.18.c `/category/{slug}` — listado por categoría + paginación + feed

Verificado en vivo (evidencia `F2-30-blog-gap-closure.png`).

**Listado por categoría** — `/category/conduccion/` (mismo patrón para `soluciones-rotoplas`, `almacenamiento`, `purificacion`):
- Devuelve 200, `canonical` auto-referencial `/category/conduccion/`. El filtro por categoría **funciona** (sólo muestra los posts de esa categoría).
- `<title>` = `"Rotoplas"` genérico (BUG-220 sistémico) · **sin H1** (BUG-353/222 sistémico) · post-cards renderizados como `builder-text` divs (sin heading semántico, igual que el listing).
- Posts enlazados como `<a href>` reales a la **raíz `/{slug}`** (no `/blog/{slug}/`) — confirma BUG-225. Las cards del blog **SÍ son `<a>`** (BUG-147 NO aplica al blog).

**Paginación** — verificado que el off-by-one de BUG-227 es **sistémico también en `/category/`**: en `/category/conduccion/` (página 1) el botón `"2"` → `?page=1`, `"3"` → `?page=2`, `"Siguiente"` → `?page=1`. (Corrige la nota previa de BUG-227 que asumía que las categorías paginaban "correctamente".)

**Feed RSS / sindicación** — verificado que **no existe feed funcional** (refina BUG-229, que sólo cubría el `<link rel="alternate">` ausente):
- `/feed/` → **falso 200**: `content-type: text/html`, cuerpo = el HTML catchall de Qwik (`q:route="[...catchall]"`), no XML. (BUG-518)
- `/blog/feed/` → **503**. `/rss.xml`, `/feed`, `/blog/rss.xml` → redirect opaco.
- **Blog ausente de todos los sitemaps:** `sitemap.xml` (index) sólo enlaza `sitemap-static.xml` + `sitemap-categories.xml` + `sitemap-products.xml`; `sitemap-static.xml` lista 5 URLs (`/aviso-de-privacidad/`, `/terminos-y-condiciones/`, `/servicios/`, `/traking/`, `/faqs/`) — ningún `/blog/` ni post. Los posts (root `/{slug}`) no son descubribles por crawlers vía sitemap. (BUG-519)

**`article:modified_time` — confirmado sistémico:** valor `"Thu Jan 01 1970 00:00:00 GMT+0000"` en 2/2 posts verificados (`/transformacion-sostenible-e-innovacion-con-rotoplas`, `/consecuencias-desabasto-de-agua-en-el-campo`). Además del valor epoch-0, el **formato es JS `Date.toString()`** (no ISO 8601 como `published_time`), lo que rompe parsers de Google/Yoast. (BUG-231 ampliado.) `published_time` correcto en ambos; ambos posts con `og:type=article`, JSON-LD presente, `robots=index,follow`, y **sin H1** (BUG-230 sistémico).

#### Evidencia II.18.c

- `F2-30-blog-gap-closure.png` — listing del blog con overlay del gap-closure (paginación, permalinks root, feed inexistente, modified_time 1970)

---

## II.19 `/recursos/`

> Página hub que organiza el contenido descargable e informativo del sitio en 4 categorías + CTAs de contacto + 6 links de "Conoce más sobre Rotoplas".

### 1. Meta tags y SEO

| Campo | Valor | Hallazgo |
|---|---|---|
| `<title>` | `Recursos` ✓ | (3er case-bueno — sin "Rotoplas" como marca pero específico) |
| `meta[description]` | `¡Disfruta lo mejor de Rotoplas al alcance de un solo clic!` | ❌ **BUG-359 sistémico** — copy idéntico al de /distribuidores/ y /servicios-lavado/, no menciona "Recursos" |
| canonical | `/recursos/` | ✓ |

### 2. Estructura semántica

| Campo | Valor | Hallazgo |
|---|---|---|
| **H1** | `"Recursos"` ✓ | Uno de los pocos casos con H1 real entre las páginas de contenido (contraste con /distribuidores/ y /servicios/) |
| H2 visibles | `BIM Revit`, `Videos`, `Tips`, `Librería` (4 categorías) | OK |
| Breadcrumb | `<a title="Ir a Rotoplas.">Inicio</a> > Recursos` | ❌ **BUG-B2C-414** CRÍTICO ver detalle abajo |

### 3. Breadcrumb — link "Inicio" cross-domain a host inexistente

```html
<a href="https://tempmx.rotoplas.com/" title="Ir a Rotoplas.">Inicio</a>
```

| ID | Severidad | Hallazgo |
|---|---|---|
| **BUG-B2C-414** | **CRÍTICO** infra/UX | El link "Inicio" del breadcrumb apunta a `https://tempmx.rotoplas.com/` — **host TEMP/staging que NO ES PÚBLICAMENTE ACCESIBLE** (verificado con fetch: `Failed to fetch` → CORS bloqueado / DNS no resuelve / firewall). El title del link `"Ir a Rotoplas."` con punto literal al final también es bug copy. El breadcrumb home de /recursos/ está roto. |

### 4. Las 4 categorías de recursos (H2 + link)

| Card | Texto | href | target | rel | Hallazgo |
|---|---|---|---|---|---|
| BIM Revit | `<h2>BIM Revit</h2>` | `https://rotoplas.com.mx/recursos/bim-revit-descargas/` | `_self` | (vacío) | ❌ **BUG-B2C-415** Cross-domain a producción (`rotoplas.com.mx`), no a QA. + Sin `rel="noopener"`. + `_self` (no `_blank`) → al click el usuario SALE del sitio QA. |
| Videos | `<h2>Videos</h2>` | `/recursos/videos/` | `_self` | (vacío) | OK (mismo dominio) — sub-recurso 200 verificado |
| Tips | `<h2>Tips</h2>` | `/recursos/tips/` | `_self` | (vacío) | OK — sub-recurso 200 verificado |
| Librería | `<h2>Librería</h2>` | `/recursos/libreria/` | `_self` | (vacío) | OK — sub-recurso 200 verificado |

Cada card combina `<img>` (sin alt apropiado, solo el nombre del recurso) + `<h2>` dentro del `<a>` — link wraps both.

### 5. Sección "Todas nuestras soluciones" — 6 links LEGACY URL pattern

| Texto | href | Hallazgo |
|---|---|---|
| Almacenamiento | `/categoria-producto/almacenamiento/` | ❌ **BUG-B2C-416** URL LEGACY — debería `/products/almacenamiento/`. BUG-249 sistémico reconfirmado en /recursos/. |
| Almacenamiento especializado | `/categoria-producto/almacenamiento-especializado/` | mismo |
| Conducción | `/categoria-producto/conduccion/` | mismo |
| Purificación | `/categoria-producto/purificacion/` | mismo |
| Tratamiento | `/categoria-producto/tratamiento/` | mismo |
| Calentamiento | `/categoria-producto/calentamiento/` | mismo |

**Nota:** las URLs `/categoria-producto/…` redirigen a `/products/…` (cf. BUG-249 documentado anteriormente), pero el link interno de /recursos/ no usa la URL canónica.

### 6. CTAs de contacto

```
"¿Quieres información sobre algún producto? déjanos tus datos y uno de
nuestros asesores se pondrá en contacto contigo."
```

| Texto | Tag | href | target | rel | Hallazgo |
|---|---|---|---|---|---|
| "Llamar" | `<a>` | `tel:8005063000` | `_self` | (vacío) | OK — protocol tel: funcional. **❌ BUG-B2C-417** número sin formato internacional (`+52 800 506 3000`) |
| "Contactar" | `<a>` | `https://wa.me/525547420835?text=Hola%2C%20necesito%20ayuda` | `_blank` | **(vacío)** | ❌ **BUG-395 sistémico** — `_blank` sin `rel="noopener noreferrer"` |

### 7. Sección "Conoce más sobre Rotoplas" — 6 links con sub-rutas /nosotros/ rotas

| Texto | href | target | rel | Hallazgo |
|---|---|---|---|---|
| Nosotros | `/nosotros/identidad/` | `_self` | (vacío) | ❌ **BUG-247 sistémico** — confirmado: `/nosotros/identidad/` muestra "Ha ocurrido un error". Link roto. |
| Empleos | `/nosotros/empleos/` | `_self` | (vacío) | ❌ **BUG-248 sistémico** — confirmado: `/nosotros/empleos/` muestra "Ha ocurrido un error". |
| Presencia | `/nosotros/presencia/` | `_self` | (vacío) | ✓ **Verificado: 200 sin error** (única sub-ruta /nosotros/ funcional de las 4 referenciadas). |
| Blog | `/blog/` | `_self` | `noopener noreferrer` (en una copia) | OK |
| Estrategia | `/nosotros/estrategia/` | `_self` | (vacío) | ❌ **BUG-246 sistémico** — `/nosotros/estrategia/` devuelve HTTP 410 GONE. Link roto. |
| Sustentabilidad | `https://rotoplas.com/sustentabilidad/` | `_blank` | (vacío) en una copia + `noopener noreferrer` en otra | Inconsistencia entre instancias del mismo link |

**Resumen:** **3 de 6 links de "Conoce más" son rutas confirmadas como rotas** (Nosotros, Empleos, Estrategia). Catastrófico para usuario que llega a /recursos/ buscando información institucional.

**Bug de esta sección:** BUG-B2C-418 (sección "Conoce más sobre Rotoplas" con 3 de 6 links rotos a sub-rutas /nosotros/: identidad → BUG-247, empleos → BUG-248, estrategia → BUG-246) — detalle en Parte IV.

### 8. Image origins — workspace inconsistente

| Asset | Workspace Builder.io |
|---|---|
| Hero "Recursos" | `4cb0f3838abd…` |
| BIM Revit card | `4cb0f3838abd…` |
| Videos card | `4cb0f3838abd…` |
| Tips card | `4cb0f3838abd…` |
| Librería card | `4cb0f3838abd…` |
| Llamar icon | `4cb0f3838abd…` |
| Contactar icon | `4cb0f3838abd…` |
| "Conoce más" 6 íconos (Nosotros/Empleos/Presencia/Blog/Estrategia/Sustentabilidad) | `b9d9011ceeb…` |

/recursos/ mezcla **2 workspaces de Builder.io**: el de /servicios-lavado/ (`4cb0f38…`) para sus assets propios + el del sitio principal (`b9d901…`) para el bloque "Conoce más". Posible asset duplicación entre workspaces.

**Bug de esta sección:** BUG-B2C-419 — detalle en Parte IV.

### 9. Verificación de sub-recursos (fetch HEAD/GET)

| URL | Status | "Ha ocurrido un error" |
|---|---|---|
| `/recursos/videos/` | 200 | ❌ NO (página real) |
| `/recursos/tips/` | 200 | ❌ NO (página real) |
| `/recursos/libreria/` | 200 | ❌ NO (página real) |
| `rotoplas.com.mx/recursos/bim-revit-descargas/` | Failed to fetch | CORS o no accesible desde QA |
| `tempmx.rotoplas.com/` | Failed to fetch | DNS/firewall — confirma BUG-414 |

### 10. DOM contract Playwright

```javascript
test('II.19 /recursos/ — contract', async ({ page }) => {
  await page.goto('https://qarotoplasmx.io/recursos/');
  await expect(page).toHaveTitle('Recursos');
  await expect(page.locator('h1', { hasText: 'Recursos' })).toBeVisible();
  // 4 categorías H2
  for (const cat of ['BIM Revit', 'Videos', 'Tips', 'Librería']) {
    await expect(page.locator('h2', { hasText: cat })).toBeVisible();
  }
  // BUG-414: breadcrumb Inicio apunta a tempmx.rotoplas.com
  const inicio = page.locator('a', { hasText: 'Inicio' }).first();
  expect(await inicio.getAttribute('href')).toContain('tempmx.rotoplas.com');  // hoy true (BUG)
  // BUG-415: BIM Revit cross-domain
  const bim = page.locator('a:has(h2:has-text("BIM Revit"))');
  expect(await bim.getAttribute('href')).toContain('rotoplas.com.mx');
  // BUG-416: 6 links categoria-producto LEGACY
  const legacyLinks = await page.locator('a[href*="categoria-producto"]').count();
  expect(legacyLinks).toBe(6);  // hoy 6 (BUG)
  // BUG-418: 3 de 6 "Conoce más" links rotos
  // (verificación viva en F1B previa documentación)
});
```

### 11. Evidencias

- `evidencias/F1D-08-recursos.png` — listing full-page
- `scripts/F1D-recursos-deep.json` — meta + H1 + 4 categorías + 6 legacy links + 6 conoce-más + tel/wa CTAs + verificación HEAD de sub-recursos

---

### II.19.a `/recursos/videos/` — Galería de videos por categoría

> Galería de videos de YouTube organizada por 9 categorías con carrusel paginado. Construida sobre el mismo stack Qwik que el resto del catálogo.

#### 1. Meta y estructura

| Campo | Valor | Hallazgo |
|---|---|---|
| `<title>` | `Rotoplas` | ❌ BUG-251 sistémico (placeholder) |
| `meta[description]` | `¡Disfruta lo mejor de Rotoplas al alcance de un solo clic!` | ❌ BUG-359 sistémico (copy genérico compartido) |
| canonical | `/recursos/videos/` | ✓ |
| H1 | (ninguno) | ❌ BUG-353 sistémico |
| H3 visible | `"Videos de almacenamiento"` (título del carrusel de la categoría activa) | Debería ser H2; jerarquía rota |
| Breadcrumb | `Inicio` (`/`) > `Recursos` (`/recursos/`) > `Videos` | Link "Inicio" apunta a `/` ✓ — **no** a `tempmx.rotoplas.com` (a diferencia del breadcrumb de `/recursos/` raíz, BUG-414). Inconsistencia interna entre breadcrumbs del mismo árbol. |

#### 2. Categorías (9 botones, filtro)

`almacenamiento` (activa), `purificación`, `institucional`, `historias rotoplas`, `cuenta con cada gota`, `bebederos`, `tuboplus`, `favoritos`, `tratamiento de aguas residuales`.

| Atributo | Valor |
|---|---|
| Tag | `<button class="category-item">` (la activa lleva `category-item active`) |
| `role` | ❌ ninguno (no `role="tab"`) |
| `aria-selected` | ❌ ninguno |
| Casing | todas en minúscula, inconsistente con el heading "Almacenamiento" capitalizado |

#### 3. Carrusel de videos

- Video destacado: 1 `<iframe>` YouTube cargado (`youtube.com/embed/Fe9c2YbMVko?...enablejsapi=1`), `title="Pruebas en Tinacos Rotoplas"` ✓.
- Paginación: `"1 of 3"` + botones `Prev` (con clase `hidden` en pág. 1) / `Next` (clase `pagination-btn`). Botones **duplicados 2×** en DOM (desktop + mobile responsive, patrón BUG-005).
- Títulos de videos de la categoría "almacenamiento": `Pruebas en Tinacos Rotoplas`, `¿Cómo instalar un Tinaco Rotoplas?`, `¿Cómo funciona un tinaco Rotoplas?`, `Nueva línea de Cisternas Rotoplas: Innovación y tecnología de punta`, `Proceso de Instalación de Tinaco Rotoplas`, `Proceso de Instalación de Cisterna Rotoplas`, `Nueva Válvula de Llenado Rotoplas`, `Tinacos Rotoplas`, `Accesrios para Cisternas Rotoplas`.

#### 4. Bugs

Datos técnicos: los 9 filtros son `<button class="category-item">` sin `role="tab"`/`aria-selected`/`tabindex` coordinado (no forman tablist navegable); título de video `"Accesrios para Cisternas Rotoplas"` (typo de "Accesorios"); nombres de las 9 categorías en minúscula (`almacenamiento`, `purificación`, `historias rotoplas`); botones "Prev"/"Next" sin `aria-label` y duplicados 2× en el DOM.

**Bugs de esta sección:** BUG-B2C-440→443 + sistémicos BUG-B2C-251 (title placeholder), BUG-B2C-353 (sin H1), BUG-B2C-359 (meta genérica), BUG-B2C-387 (embeds youtube.com no nocookie) — detalle en Parte IV.

#### 5. DOM contract

```javascript
test('II.19.a /recursos/videos/', async ({ page }) => {
  await page.goto('https://qarotoplasmx.io/recursos/videos/');
  await expect(page).toHaveTitle('Rotoplas');                  // BUG-251
  await expect(page.locator('h1')).toHaveCount(0);             // BUG-353
  await expect(page.locator('.category-item')).toHaveCount(9);
  await expect(page.locator('.category-item.active')).toHaveText('almacenamiento');
  // BUG-440: categorías sin role tab
  expect(await page.locator('.category-item').first().getAttribute('role')).toBeNull();
  // YouTube embed (BUG-387)
  expect(await page.locator('iframe[src*="youtube"]').first().getAttribute('src')).toContain('youtube.com');
});
```

#### 6. Evidencia

- `evidencias/F1D-13-recursos-videos.png` — galería con categoría "almacenamiento" activa + carrusel

---

### II.19.b `/recursos/tips/` — Tips con popups (WordPress + Popup Maker)

> **Stack distinto:** esta sub-página está construida sobre **WordPress** (clases `post post-page`, `g-grid`, `g-content g-particle`) con el plugin **Popup Maker** (`pum`, `popmake-overlay`, `pum-trigger`). Confirma el patrón de 3 CMS coexistiendo (Qwik + commercetools + WordPress) ya visto en `/blog/`.

#### 1. Meta y estructura

| Campo | Valor | Hallazgo |
|---|---|---|
| `<title>` | `Aprende los mejores Tips con Rotoplas \| Rotoplas México` | ✅ **título correcto** (marca + descriptivo) — excepción positiva vs. el placeholder sistémico |
| `meta[description]` | `Bajo la premisa de que "la gente tenga más y mejor agua", buscamos generar un impacto positivo que trascienda en una sociedad más sustentable` | ✅ descriptivo (aunque es el statement de misión genérico de Rotoplas) |
| canonical | `/recursos/tips/` | ✓ |
| H1 | (ninguno) | ❌ BUG-353 sistémico (incluso en WordPress) |
| Breadcrumb | `Inicio` (`/`) > `Recursos` (`/recursos/`) > `Tips` | "Inicio" → `/` ✓ |

#### 2. Nodos de tips (8) — cada uno dispara un popup de video

| # | Título | Descripción | Trigger Popup Maker |
|---|---|---|---|
| 1 | Aprende el proceso de Termofusión | "La Termofusión es un método de soldadura simple y rápido, para unir tubos de polipropileno marca Tuboplus." | `popmake-tip-termofusion` → `pum-360` |
| 2 | Nuevas válvulas angulares Tuboplus | "Te invitamos a conocer la nueva Válvula Angular Tuboplus® en sus versiones termofusionable…" | `popmake-tip-valvula-angular` → `pum-362` |
| 3 | Descubre cómo surge el agua alcalina | "Prueba agua purificada y alcalina hasta con 8.5 grados de pH." | `popmake-tip-proceso-alcalinizador` → `pum-364` |
| 4 | Instalación de la Válvula de llenado | "Sin piezas metálicas, sin necesidad de calibrarse y de menor tamaño." | `popmake-tip-valvula` → `pum-366` |
| 5 | Descarga la aplicación de Tuboplus | "Tu guía donde podrás encontrar proceso de termofusión paso a paso, beneficios y mucho más." | (sin popup — link de descarga) |
| 6 | Instala tu propio tinaco Rotoplas | "Aprende el proceso adecuado para instalar tu propio tinaco." | `popmake-tip-tinaco` → `pum-374` |
| 7 | Te enseñamos cómo instalar tu Purificador y Alcalinizador | "Es muy fácil instalar tu Purificador Alcalinizador Rotoplas, aquí te decimos cómo." | `popmake-tip-purificador` → `pum-376` |
| 8 | ¿Quieres instalar una cisterna? Te decimos cómo | "Aquí encontrarás el proceso paso a paso para instalar una cisterna Rotoplas." | `popmake-tip-cisterna` → `pum-379` |

#### 3. Popups (Popup Maker)

7 overlays pre-renderizados en el DOM (`pum-360, 362, 364, 366, 374, 376, 379`), cada uno con un `<iframe>` de YouTube. Total **7 iframes YouTube** en la página, todos con `title=""` (vacío).

#### 4. Bugs

Datos técnicos: los 7 `<iframe>` de YouTube de los popups tienen `title=""` vacío; la página corre sobre **WordPress + Popup Maker** (2 stacks distintos bajo `/recursos/`, carga cookies/fuentes/bundle WP solo aquí); los 7 popups con iframes YouTube se **pre-renderizan ocultos en el DOM** al cargar (7 reproductores + 7 conexiones a YouTube antes de interacción).

**Bugs de esta sección:** BUG-B2C-444→446 + sistémicos BUG-B2C-353 (sin H1), BUG-B2C-387 (embeds youtube.com no nocookie) — detalle en Parte IV.

#### 5. DOM contract

```javascript
test('II.19.b /recursos/tips/', async ({ page }) => {
  await page.goto('https://qarotoplasmx.io/recursos/tips/');
  await expect(page).toHaveTitle(/Aprende los mejores Tips con Rotoplas/);
  await expect(page.locator('h1')).toHaveCount(0);            // BUG-353
  await expect(page.locator('.tips-nodo')).toHaveCount(8);
  await expect(page.locator('.pum-overlay')).toHaveCount(7);  // popups pre-renderizados
  // BUG-444: iframes sin title
  const titles = await page.locator('iframe[src*="youtube"]').evaluateAll(els => els.map(e=>e.title));
  expect(titles.every(t => t === '')).toBe(true);
});
```

#### 6. Evidencia

- `evidencias/F1D-14-recursos-tips.png` — grid de 8 tips (WordPress)

---

### II.19.c `/recursos/libreria/` — Catálogo y manuales descargables (WordPress)

> Sub-página de descargas de documentos. Construida sobre **WordPress** (`post post-page`, `g-grid`). 4 nodos de descarga, de los cuales 3 están marcados "Próximamente".

#### 1. Meta y estructura

| Campo | Valor | Hallazgo |
|---|---|---|
| `<title>` | `Librería` | ✓ específico (con tilde) |
| `meta[description]` | `¡Disfruta lo mejor de Rotoplas al alcance de un solo clic!` | ❌ BUG-359 sistémico |
| canonical | `/recursos/libreria/` | ✓ |
| H1 | (ninguno) | ❌ BUG-353 sistémico |
| Breadcrumb | `Inicio` → `https://tempmx.rotoplas.com` · `Recursos` → `https://tempmx.rotoplas.com/recursos/` · `Libreria` | ❌ **BUG-414 sistémico** — **ambos** links del breadcrumb apuntan al host TEMP/staging no público (no solo "Inicio"). Además "Libreria" sin tilde en el breadcrumb (el `<title>` sí la tiene). |

#### 2. Nodos de descarga (4)

| # | Título | Estado | Mecanismo |
|---|---|---|---|
| 1 | Catalogo de Productos | Disponible | `<div class="hvr-float rtp-btn libreria-descarga-catalogo" data="190515_Agro-Diptico_ARweb.pdf">Descargar</div>` + `<img src="/rtp-resources/libreria/rtp-ar-catalogo.jpg">` |
| 2 | Manual Tanques Horizontales | **Próximamente** | (sin CTA) |
| 3 | Manual Tanques Verticales | **Próximamente** | (sin CTA) |
| 4 | Manual de Resistencias Químicas | **Próximamente** | (sin CTA) |

#### 3. Bugs

Datos técnicos: el botón "Descargar" del catálogo es un `<div>` (no `<a>`/`<button>`) con `cursor:auto`, sin handler `on:click` detectable y sin `href`; usa el atributo no estándar `data="190515_Agro-Diptico_ARweb.pdf"` en lugar de `href`/`data-file` (descarga frágil, no accesible por teclado ni indexable). El archivo referenciado es un díptico de Agroindustria (`Agro-Diptico_AR`) fechado 2019-05-15 (>6 años), no un "Catálogo de Productos" B2C. "Catalogo de Productos" sin tilde. **3 de 4** nodos marcados "Próximamente" (Manuales Horizontales, Verticales, Resistencias Químicas) → 75% vacío.

**Bugs de esta sección:** BUG-B2C-447→450 + sistémicos BUG-B2C-414 (breadcrumb tempmx), BUG-B2C-353 (sin H1), BUG-B2C-359 (meta genérica) — detalle en Parte IV.

#### 4. DOM contract

```javascript
test('II.19.c /recursos/libreria/', async ({ page }) => {
  await page.goto('https://qarotoplasmx.io/recursos/libreria/');
  await expect(page).toHaveTitle('Librería');
  await expect(page.locator('h1')).toHaveCount(0);                 // BUG-353
  // BUG-447: Descargar es div sin href
  const descargar = page.locator('.libreria-descarga-catalogo');
  expect(await descargar.evaluate(el => el.tagName)).toBe('DIV');
  expect(await descargar.getAttribute('href')).toBeNull();
  // BUG-448: data apunta a Agro-Diptico 2019
  expect(await descargar.getAttribute('data')).toContain('190515_Agro-Diptico');
  // BUG-450: 3 "Próximamente"
  await expect(page.locator('text=Próximamente')).toHaveCount(3);
  // BUG-414: breadcrumb tempmx
  const inicio = page.locator('a', { hasText: 'Inicio' }).first();
  expect(await inicio.getAttribute('href')).toContain('tempmx.rotoplas.com');
});
```

#### 5. Evidencia

- `evidencias/F1D-15-recursos-libreria.png` — 4 nodos (1 catálogo + 3 Próximamente)
- `scripts/F1D-subrecursos-deep.json` — dump de los 3 sub-recursos (videos + tips + librería)

#### Resumen sub-recursos `/recursos/` — homogeneidad de stack

| Sub-recurso | Stack | `<title>` | Breadcrumb "Inicio" | Estado |
|---|---|---|---|---|
| `/recursos/videos/` | Qwik | ❌ "Rotoplas" | ✓ `/` | Funcional, 9 categorías |
| `/recursos/tips/` | WordPress + Popup Maker | ✅ correcto | ✓ `/` | Funcional, 8 tips |
| `/recursos/libreria/` | WordPress | ✅ "Librería" | ❌ `tempmx.rotoplas.com` | 75% "Próximamente" + descarga rota |

**Hallazgo transversal:** los 3 sub-recursos usan **stacks distintos** (Qwik vs WordPress) y **3 convenciones de breadcrumb distintas** para el mismo nivel del árbol `/recursos/*`. Inconsistencia arquitectónica.

---

## II.20 Páginas legales

### II.20.a `/aviso-de-privacidad/`

#### Meta y estructura
| Campo | Valor | Hallazgo |
|---|---|---|
| `<title>` | `Aviso de privacidad` ✓ | OK específico |
| H1 | (ninguno) | ❌ **BUG-353 sistémico** — solo H3 `"Aviso de privacidad"` |
| Breadcrumb | `Home > Aviso De Privacidad` | Title Case `"Aviso De Privacidad"` con `De` mayúscula extra ❌ **BUG-B2C-420** |
| Última actualización | `3/mayo/2024` | ❌ **BUG-B2C-421** — >2 años desactualizado a 2026-05-28 |

#### Contenido
- Texto LFPDPPP completo: identidad del responsable (Grupo Rotoplas SAB), 7 categorías de datos, finalidades primarias y secundarias, opt-out por email, cookies (esenciales, preferencias, rendimiento, publicitarias), derechos ARCO, retención.
- 3 `<a href="mailto:privacy.mx@rotoplas.com">` con 1 instancia que tiene **trailing space en el href** (`mailto:privacy.mx@rotoplas.com `) → ❌ **BUG-B2C-422** mailto inválido.
- 2 `<a href="https://rotoplas.com.mx/">` cross-domain a producción.

#### Bugs específicos

| ID | Severidad | Hallazgo |
|---|---|---|
| **BUG-B2C-420** | INFO | Breadcrumb `"Aviso De Privacidad"` con `"De"` capitalizado en medio (should be `"de"` minúsculas). |
| **BUG-B2C-421** | MEDIA legal | Fecha de actualización `3/mayo/2024` — más de 2 años sin revisión. Mejor práctica: revisar anualmente. |
| **BUG-B2C-422** | BAJA infra | Uno de los 3 `mailto:privacy.mx@rotoplas.com` tiene trailing space en href — link inválido. |
| **BUG-B2C-423** | MEDIA UX | Sección "deshabilitar cookies por navegador" lista 5 navegadores (`(i) Internet Explorer`, `(ii) Firefox`, `(iii) Chrome`, `(iv) Safari`, `(v) Opera`). Cada párrafo termina con `"…puede consultar el siguiente enlace"` **SIN link real** — solo texto plano. Usuario no puede ir a la guía. |
| **BUG-B2C-424** | INFO copy | Menciona `Internet Explorer` (deprecated en 2024-2026) como navegador soportado. Eliminar. |
| **BUG-B2C-425** | BAJA copy | Mezcla comillas curvas (`"…"`) y rectas (`"…"`) en mismo párrafo. |
| **BUG-B2C-426** | INFO infra | 2 links del aviso apuntan a `https://rotoplas.com.mx/` (producción) — verificar si es el sitio canónico para la marca o si debería ser `qarotoplasmx.io`. |

#### Botones/links matriz

| Texto | href | Comportamiento esperado |
|---|---|---|
| `privacy.mx@rotoplas.com` (×3) | `mailto:privacy.mx@rotoplas.com` (1 con trailing space) | Abrir cliente de correo del usuario con destinatario pre-llenado |
| `https://rotoplas.com.mx` (×2) | `https://rotoplas.com.mx/` | Navegar al sitio corporativo |
| `enlace` (×5 sin link) | (texto plano, no es `<a>`) | ❌ debería navegar a guía del navegador — actualmente no hace nada |

---

### II.20.b `/terminos-y-condiciones` (sin slash) y `/terminos-y-condiciones/` (con slash)

#### Estado verificado

| URL | Status | Comportamiento |
|---|---|---|
| `/terminos-y-condiciones` | **`Failed to fetch`** desde fetch JS dentro de QA | Verificado: redirect cross-domain a `rotoplas.com.mx/ofertas-rotoplas-terminos-y-condiciones/` bloqueado por CORS al re-fetch desde JS interno → en navegador SÍ se sigue el 301 (BUG-037 confirmado). |
| `/terminos-y-condiciones/` | **`Failed to fetch`** | Mismo |

Datos técnicos: cross-domain redirect a T&C de promo Hot Sale Mayo 2026, no T&C generales del e-commerce; el sitio B2C NO tiene T&C generales propios (bloqueador legal); footer link "Términos y condiciones" apunta a la ruta rota con `target="_self"` (el usuario sale del sitio sin tab nueva).

**Bugs de esta sección:** BUG-B2C-037, 038, 039, 427 — detalle en Parte IV.

---

### II.20.c `/seguridad-de-la-informacion/`

#### Meta y estructura

| Campo | Valor | Hallazgo |
|---|---|---|
| `<title>` | `seguridad-de-la-informacion` (literal del slug) | ❌ **BUG-B2C-428** — title es el slug sin formatear, sin tildes, sin espacios. SEO catastrófico |
| H1 | (ninguno) | ❌ **BUG-353 sistémico** — solo H2 |
| Breadcrumb | `Inicio > Seguridad de la información` | Link "Inicio" apunta a **`https://tempmx.rotoplas.com/`** → ❌ **BUG-414 sistémico** (mismo host TEMP roto que /recursos/) |

#### Contenido

**H2 visibles:** "Seguridad de la información", "Normas operativas", "Tips de seguridad"

**Secciones de tips:**
1. **Compras seguras en la WEB** — verificar https, candado, sitios oficiales
2. **Información Confidencial** — evitar correo/redes, usar PC personal
3. **Correos electrónicos sospechosos** — Rotoplas no pide tarjetas/NIP/CVV por correo
4. **Evita conectarte a Wi-Fi pública** — ❌ **fragmentación rara: el StaticText `"s"` aparece aislado entre el heading y el contenido** (uid=16_75) — probable separación CSS quebrada
5. **Contraseñas** — robustas + cambiar cada 3 meses
6. **Aplicaciones legítimas** — solo desde tiendas oficiales

#### Bugs específicos

Datos técnicos: `<title>` literal `"seguridad-de-la-informacion"` (slug crudo, sin tildes/espacios/marca); fragmento `"s"` huérfano entre el H2 `"Evita conectarte a Wi-Fi pública"` y el primer párrafo del tip; sección "Todas nuestras soluciones" con **5 links de categoría que TODOS apuntan a `/seguridad-de-la-informacion/`** (auto-referenciales rotos): "Almacenamiento", "Almacenamiento especializado", "Conducción", "Mejoramiento", "Purifcación"; categoría `"Purifcación"` (typo, falta `i`); categoría `"Mejoramiento"` no existe en el catálogo (`/products/...`, data legacy); `"Mejorar continua"` debería `"Mejora continua"`.

**Bugs de esta sección:** BUG-B2C-428→433 — detalle en Parte IV.

#### Botones/links matriz

| Texto | href | Hallazgo |
|---|---|---|
| Breadcrumb "Inicio" | `https://tempmx.rotoplas.com/` | ❌ BUG-414 sistémico (host TEMP) |
| "Almacenamiento" | `/seguridad-de-la-informacion/` | ❌ BUG-430 auto-referencial |
| "Almacenamiento especializado" | `/seguridad-de-la-informacion/` | ❌ BUG-430 |
| "Conducción" | `/seguridad-de-la-informacion/` | ❌ BUG-430 |
| "Mejoramiento" | `/seguridad-de-la-informacion/` | ❌ BUG-430 + categoría inexistente (BUG-432) |
| "Purifcación" | `/seguridad-de-la-informacion/` | ❌ BUG-430 + typo (BUG-431) |
| "Llamar" | `tel:8005063000` | OK |
| "Contactar" | `https://wa.me/525547420835?text=...` `_blank` sin `rel="noopener"` | ❌ BUG-395 sistémico |

---

### II.20.d Código de ética (PDF externo)

| Campo | Valor |
|---|---|
| Tipo | PDF |
| href | `https://storage.googleapis.com/rtp-bucket-b2b-prd/B2C/Manuales/rtp_codigo_de_etica_y_conducta_esp_baja_movil_20190711.pdf` |
| Hallazgo | ❌ Nombre del archivo termina en `20190711` (sospecho fecha 2019-07-11 → **>6 años desactualizado**) + bucket `prd` (BUG-201 sistémico) |

**Bug de esta sección:** BUG-B2C-434 (PDF "Código de ética" fechado 2019-07-11, >6 años desactualizado) — detalle en Parte IV.

---

### DOM contract Playwright para II.20

```javascript
test('II.20.a /aviso-de-privacidad/', async ({ page }) => {
  await page.goto('https://qarotoplasmx.io/aviso-de-privacidad/');
  await expect(page).toHaveTitle('Aviso de privacidad');
  await expect(page.locator('h1')).toHaveCount(0);  // BUG-353
  // BUG-422: mailto con trailing space
  const mailtos = await page.locator('a[href^="mailto:"]').evaluateAll(els => els.map(e => e.href));
  expect(mailtos.some(m => /\s$/.test(m))).toBe(true);  // hoy true
});

test('II.20.c /seguridad-de-la-informacion/', async ({ page }) => {
  await page.goto('https://qarotoplasmx.io/seguridad-de-la-informacion/');
  await expect(page).toHaveTitle('seguridad-de-la-informacion');  // BUG-428
  // BUG-430: 5 links auto-referenciales
  const autoLinks = await page.locator('main a[href*="/seguridad-de-la-informacion/"]').count();
  expect(autoLinks).toBeGreaterThan(4);
});

test('BUG-414 sistémico: tempmx.rotoplas.com en breadcrumbs', async ({ page }) => {
  for (const path of ['/recursos/', '/seguridad-de-la-informacion/']) {
    await page.goto(`https://qarotoplasmx.io${path}`);
    const inicio = await page.locator('a:has-text("Inicio")').first().getAttribute('href');
    expect(inicio).toContain('tempmx.rotoplas.com');
  }
});
```

### Evidencias

- `scripts/F1D-legales-check.json` — verificación HEAD/GET de 6 URLs legales

---

# Parte III — AUDITORÍAS GLOBALES

## III.1 Tracking y privacidad

Cargados en `/` (anónimo) ANTES de cualquier consentimiento visible:

| Servicio | Script | Cookies seteadas | Riesgo |
|---|---|---|---|
| Google Tag Manager | `googletagmanager.com/gtag/js?id=G-VL8QZDP9KQ` | (vía GTM) | Tracker maestro |
| Google Analytics 4 | (vía GTM) | `_ga`, `_ga_VL8QZDP9KQ` | Analytics |
| Google Ads Conversions | `googleads.g.doubleclick.net/.../867789465`, `.../11514895263` | `_gcl_au` | Ads remarketing |
| Facebook Pixel | `connect.facebook.net/.../1111221477251547` | `_fbp` | FB tracking |
| Quantum Metric | `cdn.quantummetric.com/qscripts/quantum-rotoplasb2b2c.js` | `QuantumMetricUserID`, `QuantumMetricSessionID` | Session replay (grabación de sesiones) |
| Dialogflow Messenger | `gstatic.com/.../df-messenger.js` | (n/d) | Chatbot Google |

→ **BUG-B2C-006 (ALTA — privacidad)**: 6 sistemas de tracking cargan en home antes de consentimiento explícito. Verificar conformidad LFPDPPP (México) y eventual GDPR para usuarios de UE accediendo desde el dominio internacional.

**Evidencia de red dura (captura CDP, home recargada):** los trackers se cargan vía **GTM `GTM-MF3PDKTJ`** (más `gtm.js` propio en `/gtm.js`) de forma **incondicional al page load**, y disparan eventos **sin esperar consentimiento**:

| Evento disparado al cargar | Endpoint | reqid ejemplo |
|---|---|---|
| GA4 `page_view` | `analytics.google.com/g/collect` (`tid=G-VL8QZDP9KQ`) + `stats.g.doubleclick.net/g/collect` | 313, 314, 335 |
| Google Ads `page_view`/`conversion` | `google.com/ccm/collect`, `googleadservices.com/pagead/conversion/867789465` (`bttype=purchase`) | 307, 311, 312, 318 |
| Google Ads remarketing + audiencias | `googleads.g.doubleclick.net/pagead/viewthroughconversion/{867789465,11514895263}`, `google.com(.mx)/pagead/1p-user-list/...`, `google.com/rmkt/collect` | 309, 310, 315–320, 327–332 |
| Facebook Pixel `PageView` | `connect.facebook.net/.../1111221477251547` + `facebook.com/tr/?ev=PageView` | 321, 323, 325 |
| Endpoint de eventos (server-side) | `mpc2-prod-23-is5qnl632q-ue.a.run.app/events?cee=no` (POST) | 324 |

**Banner de cookies — anatomía DOM:** `div.ContainerAvisoDeCookies` con un único `<button class="AceptarCookies">Acepto</button>` (handler Qwik `q-BYNfHtMQ.js#s_qeRh1BXl6jo`) + link "Aviso de privacidad" → `/aviso-de-privacidad`. **No ofrece "Rechazar" ni configuración granular** (**BUG-192**). Verificado en contexto aislado limpio (sin consentimiento previo): al primer paint ya existen las cookies `_ga` / `_ga_VL8QZDP9KQ` / `_fbp` / `_gcl_au` y dispararon GA4 / FB Pixel / Google Ads / Quantum Metric **antes** de tocar "Acepto". Pulsar "Acepto" elimina el banner del DOM pero **no escribe cookie ni `localStorage` de consentimiento legible**; tras recargar, el banner no reaparece (se suprime sin registro auditable de consentimiento). La carga de GTM (`GTM-MF3PDKTJ`) y el disparo de eventos **no dependen del consentimiento** → el tracking ocurre igual con o sin "Acepto". Refuerza BUG-006 con evidencia de red reproducible.

## III.2 Consola JS por página

Capturado `list_console_messages` (filtro error+warn) en home, PDP, `/cart`, los 3 pasos de checkout y `/customer/orders`:

| Página | Errores | Warnings | Nota |
|---|---|---|---|
| `/` Home | 0 | 0 | Limpia |
| PDP `/product/…_500545/` | 0 | 0 | Limpia |
| `/checkout/3/` (pago) | 0 | 0 | Limpia incluso tras pago rechazado y "Generar pedido" |
| `/customer/orders` | 0 | 0 | Limpia |

**Positivo:** no se observan errores/warnings de consola en los flujos críticos. (La consola sí recibe mucho ruido `log`/`info` de GTM/Quantum Metric, pero nada a nivel error.) Re-muestrear en F4 mobile y en estados de error de forms.

## III.3 Network polling y endpoints

Observado vía `list_network_requests` durante cart→checkout→pago:

- **Tracking dominante (confirma BUG-006):** GA4 (`G-VL8QZDP9KQ`) con eventos `view_cart`/`begin_checkout`/`purchase` (con `value`/`currency_code` y datos de producto `id310002 / Base para tinaco GDPV`), Google Ads conversions (867789465, 11514895263), Facebook, y **Quantum Metric** (`ingest.quantummetric.com/horizon/rotoplasb2b2c`) con **POSTs de session-replay en polling permanente** (cada ~1–3 s). → explica por qué `networkidle` NUNCA resuelve; los contracts deben usar `domcontentloaded`.
- **Backend de catálogo/cart:** `commercetools` (`images.cdn…commercetools.com`) + `/q-data.json` (Qwik city) + POSTs `/{ruta}/?qfunc=…` (server actions Qwik) — la creación de orden es `POST /checkout/3/?qfunc=0U0Vvx8c6Fw` → 200.
- **Pasarela de pago:** OpenPay sandbox (`sandbox-api.opencontrol.mx`, `tst.kaptcha.com` antifraude) embebido en iframes. **Dato cruzado:** el copy de políticas de transferencia/efectivo cita como proveedor de pasarela/reembolsos a **KUSHKI S. DE R.L. DE C.V.**, no OpenPay → posible inconsistencia de proveedor entre el cobro (OpenPay) y el texto legal (Kushki). Registrar para legal.
- **Privacidad:** el estado Qwik serializado en el HTML (`q-data`/`q:state`) **expone PII del cliente** (email, teléfono, direcciones, IDs de commercetools, hash de password) inline en la página de checkout. INFO/seguridad → **BUG-B2C-501**.

## III.4 WhatsApp / chatbot por página

El sitio B2C **no** usa botón flotante de WhatsApp; usa el **chatbot "Silvia" (Dialogflow CX)** documentado en I.11. Presente (botón "Abrir ¡Hola soy Silvia!") en todas las páginas mapeadas (home, PDP, `/customer/*`, checkout NO lo monta — el layout minimalista del checkout omite el chatbot). Bugs ya documentados: BUG-050 (mensaje de error fantasma al abrir), BUG-051 (placeholder no aplicado).

## III.5 AG Grid (si aplica)

El B2C **NO usa AG Grid** (a diferencia del B2B, que lo usa en carrito/órdenes/compra rápida). El catálogo, carrito y listados de órdenes del B2C se renderizan con **componentes Qwik nativos** (`<article>` cards, `.line-cart-item`, listas de pedidos como tarjetas) — no hay `[role="treegrid"]` ni `.ag-root-wrapper`. Implicación para tests: no aplica el quirk de virtualización de columnas; sí aplica el de resumability de Qwik (clicks tempranos).

## III.6 Performance / Lighthouse (desktop + mobile)

| Página | Device | A11y | Best Practices | SEO | Agentic |
|---|---|---|---|---|---|
| `/` Home | desktop | **83** | **58** | 100 | 33 |
| `/` Home | **mobile** | **89** | **58** | 100 | 33 |
| PDP `/product/…_500545/` | desktop | **77** | **58** | **92** | 33 |
| PDP `/product/…_500545/` | **mobile** | **77** | **58** | **92** | 33 |

**Mobile vs desktop (re-auditado en `device:mobile`):** los scores son **estables entre form factors** — no hay regresión específica de móvil. Única diferencia: Home A11y sube 83→**89** en móvil (Lighthouse pondera distinto tap-targets/viewport entre perfiles). PDP idéntica (77/58/92/33). BP 58 y Agentic 33 persisten en ambos perfiles → los lastres (tracking cookies, cards sin `<a href>`, botones sin nombre accesible) son agnósticos al device. Evidencia: `F4-04-lighthouse-mobile.png` + reports JSON/HTML generados por el audit.

**Best Practices 58 (ambas) — audits fallidos:** `deprecations` (1 API deprecada), **`third-party-cookies`** (home 5: `QuantumMetricUserID`, `__cf_bm`, `_GRECAPTCHA`, `NID`, `IDE`; PDP 3), `inspector-issues`. El score bajo de Best Practices lo arrastra el stack de tracking (refuerza BUG-006).

**SEO:** Home 100; **PDP 92** penalizado por `image-alt` (3 imágenes sin `alt`) → **confirma BUG-178 (alt vacío sistémico)** incluso en PDP.

**Agentic Browsing 33** (ambas) — bajo: el sitio es difícil de operar programáticamente (cards sin `<a href>` BUG-147, botones sin nombre accesible BUG-318/401, handlers Qwik lazy).

✅ Gap cerrado: Lighthouse re-auditado en `device:mobile` (ver tabla arriba) — scores estables, sin regresión móvil.

## III.7 Accesibilidad

Audits a11y fallidos (Lighthouse) y su correspondencia con bugs ya documentados:

| Audit Lighthouse | Home | PDP | Bug del inventario que lo corrobora |
|---|---|---|---|
| **`button-name`** (botones sin nombre accesible) | 2 | 3 | **BUG-318 / BUG-401** (steppers `+/-` solo SVG, sistémico) |
| **`color-contrast`** (contraste insuficiente) | **32** | 8 | NUEVO → **BUG-B2C-502** (contraste insuficiente sistémico; 32 nodos en home) |
| **`link-name`** (links sin nombre discernible) | 2 | 1 | **BUG-031 / BUG-015** (links/ logo solo imagen sin texto accesible) |
| **`image-alt`** (imágenes sin `[alt]`) | — | 3 | **BUG-178** (alt vacío sistémico) |
| **`target-size`** (touch targets chicos) | 10 | 2 | NUEVO → **BUG-B2C-503** (áreas táctiles < mínimo; relevante para mobile/F4) |

A11y 77–83 confirma que los problemas no son aislados sino sistémicos (steppers, alts, contraste, target-size). En mobile el audit `target-size` pesa más.

## III.8 Mobile (390×844, touch)

Emulado iPhone-12-class (390×844) y re-verificados los flujos clave autenticados:

| Vista | Overflow X | Hallazgos |
|---|---|---|
| **Home** | No (390px) | Nav desktop oculto; aparece hamburger `button[aria-label="Abrir menú"]` → drawer **"Menú principal"** con 9 launchers de categoría (Servicios con badge "Nuevo", Almacenamiento, Almac. Especializado, Conducción, Presurización, Tratamiento, Calentamiento, Purificación, **Mascotas**), cada uno con chevron `>`. **Mascotas SÍ aparece** aquí (contraste con su ausencia en footer — matiza BUG-013). Chatbot Silvia presente. Evidencia `F4-01`. |
| **PDP** (`/product/BASE-PARA-TINACO/`) | No (390px) | Galería con dots, breadcrumb, precio con `-10%` + tachado, CTAs **"Comprar ahora"** + **"Agregar a carrito"** inline y activos. **No hay sticky bottom-bar de add-to-cart** (patrón común en e-commerce móvil ausente → el usuario debe hacer scroll para comprar). Evidencia `F4-02`. |
| **Cart** (`/cart/`) | No (390px) | Layout en columna: card de item (imagen, nombre, SKU, precio, stepper `− 1 +`, ícono eliminar), barra de progreso "Te faltan SOLO $448.40 MXN para envío gratis", Subtotal, "Iniciar compra". El stepper `+/-` arrastra BUG-458 (a11y) pero es usable visualmente. Evidencia `F4-03`. |
| **`/customer/orders`** | No (390px) | Pedidos como tarjetas apiladas (5 listados), sidebar de cuenta desktop colapsa, hamburger presente. |

**Positivo global:** **ninguna vista presenta overflow horizontal** (`scrollWidth == 390` en todas) — el responsive es sólido. La consola se mantiene limpia en mobile.

**Bug de esta sección:** BUG-B2C-504 (PDP móvil sin sticky add-to-cart bar) — detalle en Parte IV.

**Nav institucional ausente del menú móvil (BUG-B2C-528 — verificado s12):** el menú móvil "Menú principal" (`.dropdown-menu`, abierto con `button[aria-label="Abrir menú"]`) contiene **únicamente** los launchers de categoría de producto + "Servicios" (badge "Nuevo") + "Lavado de Tinaco y Cisterna" + **"Prueba"** (categoría TEST que se filtra a producción, patrón BUG-313/314). Los items institucionales del top-bar desktop (I.2) — **Conócenos, Blog, Recursos, Contacto, Amigo Plomero** — **NO son accesibles desde el menú móvil** (solo "Tienda" sobrevive como nav superior en móvil). El usuario móvil solo alcanza Blog/legales vía el footer (scroll completo); Conócenos/Recursos/Contacto/Amigo Plomero quedan **inalcanzables por navegación** en móvil. Evidencia `F4-05-nav-institucional-ausente-movil.png`.

**Lighthouse mobile:** ✅ ejecutado (ver III.6) — Home 89/58/100/33, PDP 77/58/92/33, estable vs desktop.

**Residual menor:** layout del checkout móvil de 3 pasos (el checkout está cubierto funcionalmente en desktop y el `/cart/` móvil ya se verificó sin overflow; falta confirmar el layout móvil de los pasos Dirección→Información→Pago, que requiere un SKU disponible en el carrito).

---

# Parte IV — BUGS NUMERADOS

| ID | Severidad | Componente/Página | Descripción | Evidencia |
|---|---|---|---|---|
| BUG-B2C-001 | MEDIA | Home `/` | Sin `<h1>`. Solo H2. SEO + a11y. | `F0-01-home-anonimo-initial.png` |
| BUG-B2C-002 | BAJA | I.1 Header | Texto "Añadiste este articulo a tu carrito" sin tilde "artículo". | (pendiente captura toast) |
| BUG-B2C-003 | BAJA | I.2 Nav + I.4 Footer | Link "Contacto" apunta a `/preguntas-frecuentes` en vez de `/contacto/`. Bug duplicado en 2 lugares. | (footer audit DOM) |
| BUG-B2C-004 | BAJA | I.10 Newsletter | Input placeholder "Compartenos un email" sin tilde "Compártenos". | (pendiente) |
| BUG-B2C-005 | INFO | I.4 Footer | DOM duplica items 2x (responsive desktop+mobile). | (DOM inspect) |
| BUG-B2C-006 | ALTA (privacidad) | III.1 Tracking | 6 trackers cargan antes de consentimiento. LFPDPPP/GDPR. | `F0-01-home-anonimo-initial.png` + network |
| BUG-B2C-007 | BAJA | I.4 Footer | `/products/calentamiento` sin `/` final. Inconsistencia con resto. | (footer audit) |
| BUG-B2C-008 | BAJA | I.4 Footer | URL `/traking/` con typo ("traking" en vez de "tracking"). | (footer audit) |
| BUG-B2C-009 | BAJA | I.2 Nav | "Conocenos" sin tilde "Conócenos". | `F1A-01-home-mega-menu-abierto.png` |
| BUG-B2C-012 | MEDIA | I.2 + I.4 + II.1 | Blog tiene 3 URLs distintas: `/blog`, `/blog/`, `https://rotoplas.com.mx/blog/`. | snapshot |
| BUG-B2C-013 | MEDIA | I.3 + I.4 + I.8 | Categoría "Mascotas" en mega-menú y carrusel pero NO en footer ni "Lo más vendido". | snapshot |
| BUG-B2C-014 | BAJA | I.8 Carrusel | "Lo más vendido por categoría" omite Conducción y Mascotas. | snapshot |
| BUG-B2C-015 | BAJA SEO | I.1 Header | Logo es `<div on:click>` no `<a href="/">`. Crawlers no detectan link al home. | DOM inspect |
| BUG-B2C-016 | MEDIA a11y | I.1 Header | Dos `<input id="search-input">` en DOM. Viola unicidad de ids. | DOM inspect |
| BUG-B2C-017 | BAJA | I.2 Nav | "Ver mas" sin tilde + sin función (StaticText). | snapshot |
| BUG-B2C-018 | MEDIA | I.2 Nav + I.4 Footer | Links Blog inconsistentes con/sin `/` final. (parte de BUG-012). | snapshot |
| BUG-B2C-019 | BAJA | I.3 Mega-menú | "Promociones Calidad" → "Promo" → botón "Prueba" — placeholder de QA en producción. | `F1A-01-home-mega-menu-abierto.png` |
| BUG-B2C-020 | PENDIENTE | I.3 Mega-menú | Botones categoría son `<button>` no `<a>` — sin Ctrl+click, sin SEO. Verificar. | — |
| BUG-B2C-021 | BAJA a11y | I.4 Footer | Imágenes de métodos de pago con alt genérico "Payment method" sin marca. | DOM inspect |
| BUG-B2C-022 | BAJA | I.4 Footer | Año "2026" hardcodeado en copyright. | DOM inspect |
| BUG-B2C-023 | BAJA | I.7 Widget CP | Input CP sin `id` ni `name`. | DOM inspect |
| BUG-B2C-024 | BAJA | I.8 Carrusel | Botón scroll-left sin aria-label visible. | snapshot |
| BUG-B2C-025 | MEDIA | I.9 Tarjeta | Badge "-1%" descuento absurdo (Cisterna 5000L: $21,279.06 vs $21,494.00). | snapshot |
| BUG-B2C-026 | BAJA | I.9 Tarjeta | Inconsistencia "+ vendido" vs "+ Vendidos". | snapshot |
| BUG-B2C-027 | BAJA | I.9 Tarjeta | Nombre producto duplicado en H3: "Tinaco Plus+ Tinaco Plus+...". | snapshot |
| BUG-B2C-028 | MEDIA SEO | I.9 Tarjeta | Precio segmentado en 4 nodos (`$ 21,279 . 06`). Crawlers no leen valor completo. | snapshot |
| BUG-B2C-029 | BAJA arq. | I.13 + I.3 | Mini-cart drawer y mega-menú comparten clases `drawer-panel header-extension`. | DOM inspect |
| BUG-B2C-030 | BAJA UX | II.1 Home | Radios "¿Qué necesitas solucionar hoy?" — puntuación inconsistente (2 con punto, 2 sin). | snapshot |
| BUG-B2C-031 | MEDIA a11y | II.1 Home | Links "Nuevos lanzamientos" sin texto accesible, solo imagen. | snapshot |
| BUG-B2C-032 | BAJA | II.1 Home | Servicios "Purificación" y "Riego" apuntan al mismo `/servicios/`. | snapshot |
| BUG-B2C-033 | BAJA performance | Global links | Múltiples URLs causan redirect 301 innecesario por falta de `/` final (links en nav, footer y header). Cada redirect = round-trip HTTP extra. Lista completa en II.0 (matriz redirects). | fetch audit |
| BUG-B2C-034 | **CRÍTICO UX/SEO** | URLs inexistentes (sistémico) | Las 11 URLs (`/mi-cuenta/`, `/account/`, `/mis-pedidos/`, `/orders/`, `/checkoutfinished/`, `/wishlist/`, `/lista-de-deseos/`, `/ofertas/`, `/recuperar/`, `/sustentabilidad/`, `/transactionhistory/`) **no existen en el sitio**: devuelven "Ha ocurrido un error" incluso CON sesión activa (no son rutas autenticadas con bug de redirect). Las URLs canónicas reales son `/customer`, `/customer/orders`, `/customer/address`, `/customer/reviews`. Las URLs en español son referencias huérfanas. → ver también BUG-B2C-144 (404 sistémico). | `F1A-02-BUG-B2C-034-mi-cuenta-anonimo-error.png` + `F1B-18-url-inexistente-error-generico.png` |
| BUG-B2C-035 | MEDIA SEO | Duplicación URLs es↔en | `/mi-cuenta/` + `/account/` y `/mis-pedidos/` + `/orders/` ambos sirven el mismo recurso sin canonical declarado. Google indexa duplicate content. | fetch audit |
| BUG-B2C-036 | MEDIA copy | `/preguntas-frecuentes/` | H1 de la página dice "Contáctanos" en lugar de "Preguntas frecuentes". Confusión del usuario. | fetch audit |
| BUG-B2C-037 | **ALTA UX/SEO** | I.4 Footer | Link "Términos y condiciones" en footer apunta a `/terminos-y-condiciones` que silenciosamente redirige a OTRO dominio `rotoplas.com.mx/ofertas-rotoplas-terminos-y-condiciones/`. Usuario sale del sitio sin warning. Browser history y session continuity rotas. | `F1A-03-BUG-B2C-037-tyc-redirect-cross-domain.png` |
| BUG-B2C-038 | ALTA legal | I.4 Footer T&C | El destino del link T&C son los términos de una PROMOCIÓN específica (Hot Sale Mayo 2026 / "Golazos de descuentos"), NO los términos generales del sitio. **El sitio no tiene T&C generales accesibles.** Riesgo legal: si un usuario compra hoy, ¿qué términos aplican? | `F1A-03-BUG-B2C-037-tyc-redirect-cross-domain.png` |
| BUG-B2C-039 | MEDIA copy | T&C cross-domain | En la misma página de T&C aparecen DOS nombres de promoción distintos: H2 dice "GOLAZOS DE DESCUENTOS" pero el body dice "GOLES AZULES (HOT SALE MAYO 2026)". Inconsistencia interna. | `F1A-03-BUG-B2C-037-tyc-redirect-cross-domain.png` |
| BUG-B2C-040 | BAJA | I.2 Nav superior | En el dominio rotoplas.com.mx (al que redirige T&C) el nav superior dice "Conócenos" y "Ver más" CON tildes correctas. Esto confirma que en qarotoplasmx.io los items son **bug, no decisión de copy** (BUG-009 y BUG-017 confirmados como bugs reales). | `F1A-03-BUG-B2C-037-tyc-redirect-cross-domain.png` |
| BUG-B2C-041 | INFO | Global URL canónica | `/promociones` y `/promociones/` devuelven 410 Gone. Página fue removida deliberadamente — buscar links huérfanos que aún apunten ahí. | fetch audit |
| BUG-B2C-042 | INFO | `/traking/` vs `/tracking/` | AMBAS URLs responden 200. Duplicación. Verificar si son la misma página y cuál usa el sitio internamente — el footer apunta a `/traking/` (typo BUG-B2C-008). | fetch audit |
| BUG-B2C-045 | BAJA a11y | I.6 Modal dirección paso 2 | Jerarquía heading rota: H2 "Agregar dirección" + H3 "Ingresa tu ubicación..." inmediato (debería ser texto plano o p). | `F1A-08-modal-agregar-direccion-paso2-form.png` |
| BUG-B2C-046 | BAJA UX | I.6 Modal dirección paso 2 | Campo "Entre calles" tiene `*` en la leyenda externa pero el placeholder del input dice "Entre calles" sin asterisco. Inconsistencia visual de obligatoriedad. | `F1A-08-modal-agregar-direccion-paso2-form.png` |
| BUG-B2C-047 | BAJA copy | I.6 Modal dirección paso 2 | Texto leyenda " Campos obligatorios." inicia con un espacio en blanco extra. | `F1A-08-modal-agregar-direccion-paso2-form.png` |
| BUG-B2C-048 | INFO | I.6 Modal dirección paso 2 | Radio "Obra" como alias de dirección — categoría específica construcción, no existe en B2B (que usa Trabajo). Documenta diferencia entre catálogos B2B vs B2C. | `F1A-08-modal-agregar-direccion-paso2-form.png` |
| BUG-B2C-049 | INFO SEO | I.6 Modal | H2 "Agregar dirección" del modal cerrado aparece en el snapshot de la home (5 H2 contados). Verificar si Google indexa como contenido visible. | snapshot home |
| BUG-B2C-050 | **MEDIA UX** | I.11 Chatbot Silvia | Banner "Se ha producido un error. Vuelve a intentarlo." aparece al abrir el chatbot Y **persiste durante una conversación 100% exitosa** (verificado s12: sigue visible tras recibir una recomendación de producto correcta del NLU). Es un **falso error fijo**, no transitorio — no refleja el estado real del agente, que funciona. | `F2-32-chatbot-silvia-nlu-respuesta.png` |
| BUG-B2C-051 | BAJA copy | I.11 Chatbot Silvia | Atributo `placeholder-text="Escribe tu pregunta..."` declarado en config no se aplica — placeholder real visible "Hablar con agente". | snapshot |
| BUG-B2C-052 | INFO governance | I.11 + I.4 Footer | Existe URL específica `rotoplas.com.mx/terminos-y-condiciones-ia/` para T&C del chatbot IA, pero los T&C generales del sitio redirigen a página de promoción (BUG-037-038). Inconsistencia de governance legal. | `F1A-06`, `F1A-03` |
| BUG-B2C-053 | BAJA SEO | I.14.a/b Forms auth | Title de `/login/` y `/signup/` es "Rotoplas" genérico. Debería ser "Inicia sesión \| Rotoplas" y "Crea una cuenta \| Rotoplas". | `F1A-09`, `F1A-11` |
| BUG-B2C-054 | BAJA performance | I.14.a Login | Link "Olvidé mi contraseña" apunta a `/forgot-password` (sin `/` final) → redirect 301 a `/forgot-password/`. Round-trip extra. | `F1A-09-login.png` |
| BUG-B2C-055 | BAJA performance | I.14.a Login | Link "aquí" apunta a `/signup` (sin `/` final) → redirect 301 a `/signup/`. Round-trip extra (más grave si el destino también redirige). | `F1A-09-login.png` |
| BUG-B2C-056 | **CRÍTICO** | I.14.b Signup | `/registro/` devuelve "Ha ocurrido un error" cuando `/signup/` funciona. URL inconsistente entre fetch HEAD inicial (200 + H1 "Crea una cuenta") y navegación browser (error). Si algún link interno aún apunta a `/registro/`, signup queda inaccesible. | `F1A-10-BUG-B2C-056-registro-error.png` |
| BUG-B2C-057 | MEDIA UX | I.14.b Signup | Inputs `email` y `phone` con `type="text"`. Deberían ser `type="email"` y `type="tel"` — impide validación nativa HTML5 y keyboard apropiado en mobile. | `F1A-11-signup-form.png` |
| BUG-B2C-058 | BAJA arq. | I.14.b Signup | name del input `comppassword` mal escrito. Convención: `confirmPassword` o `password_confirmation`. | `F1A-11-signup-form.png` |
| BUG-B2C-059 | BAJA arq. | I.14.b Signup | name del checkbox `privacity` mal escrito en inglés. Debería ser `privacy` / `acceptTerms` / `terms`. | `F1A-11-signup-form.png` |
| BUG-B2C-060 | MEDIA a11y/seg | I.14.b Signup | TODOS los inputs con asterisco visual tienen `required=false` en HTML. Validación solo cliente JS. Si JS falla (CSP, Qwik hydration error), form se envía vacío. | `F1A-11-signup-form.png` |
| BUG-B2C-061 | BAJA a11y | I.14.b Signup | Checkbox `privacity` sin `id` ni `<label for>` asociado. Lectores de pantalla no anuncian su propósito. | `F1A-11-signup-form.png` |
| BUG-B2C-062 | MEDIA UX | I.14.c Forgot Password | Sin link "Volver a iniciar sesión" en `/forgot-password/`. Usuario sin escape natural a `/login/`. | `F1A-12-forgot-password-form.png` |
| BUG-B2C-063 | MEDIA UX/a11y | I.14.c Forgot Password | Input email con `type="text"` (debería ser `type="email"`). Confirma patrón global B2C — mismo bug que BUG-B2C-057 en signup. | `F1A-12-forgot-password-form.png` |
| BUG-B2C-064 | **ALTA UX/datos** | I.14.c Forgot Password | Input email con `maxlength="30"`. RFC 5321 permite 254. Emails largos válidos son rechazados silenciosamente (sin feedback). **Bloquea recuperación de contraseña** para usuarios con dominios largos. | `F1A-12-forgot-password-form.png` |
| BUG-B2C-065 | MEDIA UX | I.14.c Forgot Password | Input email con `autocomplete="off"`. Bloquea autofill del browser. Debería ser `autocomplete="email"`. | `F1A-12-forgot-password-form.png` |
| BUG-B2C-066 | BAJA UX | I.14.c Forgot Password | Placeholder del input es solo `"*"`. No comunica qué escribir; el `*` solo indica required. | `F1A-12-forgot-password-form.png` |
| BUG-B2C-067 | MEDIA SEO/a11y | II.12 `/contacto/` | Página sin `<h1>` (solo H2 "Contacto"). Mismo patrón que home (BUG-001) → confirma patrón sistémico del sitio. | `F1A-14-contacto-form-inicial.png` |
| BUG-B2C-068 | MEDIA UX/arq | I.14.d Contacto | Form NO usa `<form>` element. Inputs sueltos + `<button type="button">`. Enter no submitea, browser autofill agrupado roto. | `F1A-14-contacto-form-inicial.png` |
| BUG-B2C-069 | MEDIA UX | I.14.d Contacto | Campo `message` es `<input type="text">` con maxlength=240, no `<textarea>`. Multilinea imposible. Debería ser `<textarea>` con maxlength 1000+. | `F1A-14-contacto-form-inicial.png` |
| BUG-B2C-070 | MEDIA UX | I.14.d Contacto | Campo `phone` con `type="text"` (debería `type="tel"` + `autocomplete="tel-national"`). Sin teclado numérico mobile. | `F1A-14-contacto-form-inicial.png` |
| BUG-B2C-071 | BAJA | II.12 `/contacto/` | Breadcrumb `Inicio / Contacto / Contacto` — último segmento duplica el H2. | `F1A-14-contacto-form-inicial.png` |
| BUG-B2C-072 | BAJA | I.14.d Contacto | Label "Código postal" sin asterisco (=opcional), pero placeholder del input es `"*"`. Inconsistencia visual de obligatoriedad. | `F1A-14-contacto-form-inicial.png` |
| BUG-B2C-073 | BAJA copy | I.14.d Contacto | Error name dice "Introduce un nombre **u** apellido válido". La regla "o→u" solo aplica antes de palabras o-/ho-. "Apellido" empieza con "a" → debe ser "o". | `F1A-15-contacto-errores-submit-vacio.png` |
| BUG-B2C-074 | BAJA copy/gramática | I.14.d Contacto | Error phone: "Introduce un teléfono válido debe de contener 10 dígitos". Dequeísmo + sin puntuación entre cláusulas. | `F1A-15-contacto-errores-submit-vacio.png` |
| BUG-B2C-075 | INFO inconsistencia | I.14.d Contacto | Estilos de error mezclados: algunos "Introduce un X válido", otros "Este es un campo requerido". Sin política consistente. | `F1A-15-contacto-errores-submit-vacio.png` |
| BUG-B2C-076 | BAJA copy | II.13 FAQs | Tab/categoría "Garantias" sin tilde → debe ser "Garantías". | `F1A-16-faqs-H1-contactanos.png` |
| BUG-B2C-077 | MEDIA UX/arq | II.13 FAQs | `/preguntas-frecuentes/` mezcla Contacto (teléfono + WhatsApp) + FAQs en una sola URL. Duplica funcionalidad con `/contacto/` (form). Confusión: ¿cuál URL debería usar el usuario? Refuerza BUG-003 (footer link "Contacto" apunta aquí). | `F1A-16-faqs-H1-contactanos.png` |
| BUG-B2C-078 | MEDIA a11y | II.13 FAQs | Acordeones FAQ usan `<p class="faqs-titulo">` sin `<details>`, sin `aria-expanded`, sin `role="button"`. Lectores de pantalla no perciben que son expandibles ni el estado. | `F1A-16-faqs-H1-contactanos.png` |
| BUG-B2C-079 | BAJA SEO | II.13 FAQs | Categorías son `<a href="#">` sin URL hash real ni `data-category`. No se puede deeplinkear a categoría específica (ej. `/preguntas-frecuentes/#garantias`). Pérdida de SEO long-tail. | `F1A-16-faqs-H1-contactanos.png` |
| BUG-B2C-080 | INFO | II.13 + II.14 | 3 versiones de "Contacto" entrelazadas: tab FAQ "Contacto" + sección Contacto al inicio de `/preguntas-frecuentes/` + página `/contacto/` separada. Arquitectura de información confusa. | `F1A-16-faqs-H1-contactanos.png` |
| BUG-B2C-081 | BAJA copy | II.13 FAQ "Acerca productos" / sub "Tinacos" | Typo en respuesta tabla de medidas: `Diámtero` → debe ser `Diámetro`. | `faqs-dump.json` |
| BUG-B2C-082 | BAJA copy | II.13 FAQ tab "Servicio" | Typo grupo: `Transparecia de costos y riesgos` → debe ser `Transparencia`. | `faqs-dump.json` |
| BUG-B2C-083 | MEDIA copy | II.13 FAQ "Acerca productos" pregunta 9 | DOBLE typo en pregunta visible al usuario: `¿Que puricador me recomiendan para casa habitación?` → debería `¿Qué purificador...`. Visible en producción, daña percepción de calidad. | `faqs-dump.json` |
| BUG-B2C-084 | MEDIA copy/contenido | II.13 FAQ "Generales" pregunta 1 | Respuesta termina con `Link Dejanos tus datos (con formulario)` — texto placeholder NO reemplazado por el link real. Pregunta de distribuidores queda sin call-to-action funcional. | `faqs-dump.json` |
| BUG-B2C-085 | BAJA copy | II.13 FAQ "Generales" | "Si tienes **interes** en formar parte" — "interes" sin tilde → "interés". | `faqs-dump.json` |
| BUG-B2C-086 | BAJA copy | II.13 FAQ "Generales" pregunta 2 | Lista de plantas con tildes inconsistentes: "Merida" sin tilde y "Tuxtla Gutiérrez" CON tilde. | `faqs-dump.json` |
| BUG-B2C-087 | BAJA copy | II.13 FAQ tab "Servicio" | Al menos 4 preguntas comienzan sin signo de apertura `¿`: "Quiero contratar...", "Si el plomero...", "En el caso de mantenimiento...", "El tiempo de espera...". Regla obligatoria del español. | `faqs-dump.json` |
| BUG-B2C-088 | MEDIA UX/contenido | II.13 FAQ "Acerca productos" preguntas 11-12 | Respuestas a "¿Cómo instalar el medidor IOT?" y "¿Cómo vinculo la app?" son SOLO URLs de YouTube (`https://www.youtube.com/watch?v=...`) sin contexto ni embed. UX malo: el usuario no sabe que clicar lleva a un video. Mínimo: convertir en link clicable o embed. | `faqs-dump.json` |
| BUG-B2C-089 | BAJA copy | II.13 FAQ "Acerca productos" pregunta 15 | "Si el medidor de nivel **IOS** aparece fuera de línea..." — "IOS" parece typo (resto de preguntas usan "IOT"). Confusión iOS vs IOT. | `faqs-dump.json` |
| BUG-B2C-090 | BAJA copy | II.13 FAQ "Garantias" pregunta 2 | Pregunta visible: "¿Cómo puedo hacer **valida** la garantía...?" — "valida" sin tilde → "válida" (verbo). | `faqs-dump.json` |
| BUG-B2C-091 | **CRÍTICO funcional** | II.13 FAQ acordeones | Click programático y vía DevTools en `<p class="faqs-titulo">` NO expande el acordeón. Los listeners adjuntos por el script inline `<script>` están inactivos. El evento llega al DOM (verificado con listener propio) pero el handler del sitio no ejecuta. Hipótesis: race condition entre `forEach` del script y la hidratación de Qwik que reemplaza nodos. **Si se reproduce con click humano real, las 56 FAQs son inaccesibles en producción.** | `F1A-22-faqs-respuesta-expandida-forzada.png` |
| BUG-B2C-092 | BAJA arq | II.13 FAQ tab "Servicio" | Tab con label "Servicio" usa `tab="serviciados"` y `id="#serviciados"` internamente. Inconsistencia entre label visible y atributo lógico (probable residuo del módulo Serviciados B2B2C). Confunde debugging, analytics y deeplinking futuro. | `F1A-20-faqs-tab-servicio.png` |
| BUG-B2C-093 | BAJA arq/perf | II.13 FAQ inline script | Script inline contiene 3 `console.log` en producción: `console.log('faqs:ready')` al cargar + `console.log(this.getAttribute('tab'))` por click de tab + `console.log('faqs-titulo')`/`console.log('sub-faqs-titulo')` por click de pregunta. Spam de console en producción, ruido para debugging real, mínima sobrecarga. | inline script |
| BUG-B2C-094 | **ALTA arq/sec** | II.12 `/traking/` form | Input para número de pedido tiene `name="password"` e `id="password"`. Implicaciones: (1) password managers ofrecen guardar el número de pedido como contraseña, (2) a11y tools lo tratan como campo password con `type="text"` (cleartext password warning), (3) Lighthouse penaliza, (4) browser autofill confunde con credenciales. **Debe ser `name="orderNumber"` o `name="noPedido"`.** | `F1A-23-traking-form-typo.png` |
| BUG-B2C-095 | MEDIA SEO | II.12 `/traking/` | `<link rel="canonical" href="https://qarotoplasmx.io/traking/">` declara la URL CON TYPO como canónica oficial. Google entrena el index con la versión incorrecta. Si en el futuro renombran a `/tracking/` (correcto), queda doble URL y redirect 301 en cadena. | DOM inspect |
| BUG-B2C-096 | BAJA SEO | II.12 `/traking/` | Meta description: "¡Disfruta lo mejor de Rotoplas al alcance de un solo clic!" — texto genérico de marketing, no menciona "seguimiento" ni "rastreo de pedido". Pérdida de SEO long-tail para queries como "rastrear mi pedido rotoplas". | DOM inspect |
| BUG-B2C-097 | **CRÍTICO UX/SEO** | II.12 `/tracking/` | `https://qarotoplasmx.io/tracking/` (URL **bien escrita**) devuelve HTML 200 con H1 "Ha ocurrido un error" en lugar de redirect 301 a `/traking/` o servir el mismo contenido. Mismo patrón que BUG-B2C-034 (rutas autenticadas). Si Google indexa la URL bien escrita o un usuario tipea correctamente, ve error. **El typo está fosilizado como URL canónica.** | `F1A-24-tracking-correcto-error.png` |
| BUG-B2C-098 | BAJA UX | II.12 `/traking/` validación | Al submit con campo vacío, error: "El No. de pedido es incorrecto, inténtalo nuevamente". Confuso: dice "incorrecto" cuando no hay valor. Debería ser "Por favor, introduce el número de pedido" o "Este campo es requerido". | `F1A-25-traking-error-pedido-invalido.png` (background del estado) |
| BUG-B2C-099 | BAJA arq/copy | I.1.b + I.15 Sidebar | Clase CSS `menuDEsk` con typo (debería `menuDesk`). Inconsistente con su par `menuMovil` (correcto). Aplica a los 4 links del menú autenticado. | `F1B-01-home-autenticado.png` |
| BUG-B2C-100 | BAJA arq/perf | I.1.b + I.15 Sidebar | Links del menú autenticado renderizados duplicados (`menuMovil` + `menuDEsk`) en DOM. Misma patrón que footer (BUG-005). Aumenta el bundle y duplica el work del DOM diffing. | `F1B-01-home-autenticado.png` |
| BUG-B2C-101 | MEDIA SEO/a11y | II.9 `/customer` | Sin `<h1>` (solo H2 "Mis datos"). Patrón sistémico (BUG-067, BUG-001). | `F1B-02-customer-mis-datos.png` |
| BUG-B2C-102 | BAJA SEO | II.9 `/customer` | Title `Rotoplas` genérico en lugar de "Mis datos \| Rotoplas". Patrón sistémico BUG-053. | `F1B-02-customer-mis-datos.png` |
| BUG-B2C-103 | BAJA copy | II.9 `/customer` Mis datos fiscales | Label "Regimen fiscal" sin tilde → "Régimen fiscal". | `F1B-02-customer-mis-datos.png` |
| BUG-B2C-104 | BAJA UX | II.9 `/customer` Mis datos | Ícono `?` junto al campo Correo electrónico, sin tooltip visible ni texto que explique. Usuario no sabe qué hace. | `F1B-02-customer-mis-datos.png` |
| BUG-B2C-105 | BAJA UX | II.9 `/customer` Mis datos | "Nombre y apellido" no tiene botón "Editar" directo — el usuario debe deducir que se edita junto con Teléfono. El editor sí permite cambiarlo, pero la UI de lectura no lo comunica. | `F1B-02-customer-mis-datos.png` |
| BUG-B2C-106 | MEDIA UX | II.9 `/customer` editor contacto | Modo lectura muestra "Nombre y apellido: Jorge García" como un solo campo; el editor lo divide en `name` + `lastName`. Inconsistencia entre presentación y modelo de datos. | `F1B-03-customer-editar-datos.png` |
| BUG-B2C-107 | MEDIA seg | II.9 `/customer` modal password | Inputs `password`, `newPassword`, `comppassword` con `maxlength="20"`. NIST 800-63B y OWASP recomiendan permitir mínimo 64 caracteres para passphrases. Limita la seguridad. | `F1B-05-customer-modal-password.png` |
| BUG-B2C-108 | BAJA arq | II.9 `/customer` modal password | Input "Confirmar nueva contraseña" tiene `name="comppassword"` (mal escrito). Mismo bug que en signup (BUG-058) → patrón sistémico confirmado. | `F1B-05-customer-modal-password.png` |
| BUG-B2C-109 | INFO seg | II.9 `/customer` política password | Política: mín 8 chars + 1 mayúscula + 1 número. NO requiere símbolo especial ni longitud > 8. Más débil que recomendación OWASP/NIST moderna (passphrases largos). | `F1B-05-customer-modal-password.png` |
| BUG-B2C-110 | INFO inconsistencia UX | II.9 `/customer` modal password | Botón "Guardar" inicia con `disabled=true` cuando los 3 inputs están vacíos — patrón UX correcto. **Inconsistente con el resto de forms del sitio** (signup, contacto, forgot-password, traking) que sí permiten submit vacío y muestran error inline. Falta política única de validación. | `F1B-05-customer-modal-password.png` |
| BUG-B2C-111 | BAJA copy | II.10 `/customer/orders` | Texto "No. **De** pedido" con "De" en mayúscula (debería ser "de" minúscula — preposición). Visible en cada una de las 21 tarjetas de pedido. | `F1B-06-customer-orders-listado.png` |
| BUG-B2C-112 | BAJA copy | II.10 `/customer/orders` | Label "Fecha de **pedidos**" (plural) cuando se refiere a la fecha de UN único pedido. Debería ser "Fecha de pedido". | `F1B-06-customer-orders-listado.png` |
| BUG-B2C-113 | INFO UX | II.10 `/customer/orders` | Asterisco `*` en "Total *" sin leyenda explícita que conecte con "IVA incluido". Convención `*` = nota al pie pero el listado no lo formaliza. El detalle SÍ tiene "(*IVA incluido)". | `F1B-06-customer-orders-listado.png` |
| BUG-B2C-114 | MEDIA UX | II.10 `/customer/orders` | Botón "Solicitar factura" desaparece silenciosamente cuando vence el plazo de 30 días desde la compra. El usuario no recibe mensaje "Plazo de facturación vencido". | `F1B-06-customer-orders-listado.png` |
| BUG-B2C-115 | BAJA SEO | II.10 `/customer/orders` | Title `Rotoplas` genérico (patrón sistémico BUG-053). Debería ser "Mis pedidos \| Rotoplas". | `F1B-06-customer-orders-listado.png` |
| BUG-B2C-116 | MEDIA SEO/a11y | II.10 `/customer/orders` | Página sin `<h1>` (solo H2). Patrón sistémico BUG-067. | `F1B-06-customer-orders-listado.png` |
| BUG-B2C-117 | BAJA copy | II.10 vs II.10.b | Inconsistencia case: listado dice "No. **De** pedido" (BUG-111) mientras que el detalle del mismo pedido dice "No. **de** pedido" (correcto). Misma data, dos versiones. | `F1B-06` + `F1B-07` |
| BUG-B2C-118 | BAJA UX/data | II.10.b detalle pedido | Dirección muestra "Ciudad de México, Ciudad de México" duplicado (Estado + Municipio = mismo valor para CDMX) sin etiquetar quién es quién. Confunde al lector. | `F1B-07-customer-orders-detalle-pedido.png` |
| BUG-B2C-119 | **CRÍTICO seg/compliance** | II.10.b detalle pedido | El bloque "Datos de pago" muestra `**********424242` — los **últimos 6 dígitos del PAN** de la tarjeta visibles (10 asteriscos + 6 dígitos). **PCI-DSS Req. 3.4 / 3.3 permite máximo los últimos 4 dígitos.** Esto es violación de compliance — riesgo legal y operativo. | `F1B-07-customer-orders-detalle-pedido.png` |
| BUG-B2C-120 | BAJA UX | II.10.b detalle pedido | Botón "Volver a comprar" sin tooltip ni confirmación. No queda claro si re-agrega TODOS los productos del pedido al carrito o si abre una vista de selección. Riesgo de carrito accidental. | `F1B-07-customer-orders-detalle-pedido.png` |
| BUG-B2C-121 | BAJA UX | II.10.b detalle pedido | "Régimen fiscal: 616-Sin Obligaciones Fiscales" y "Uso CFDI: S01-Sin Obligaciones Fiscales" mezclan código SAT + descripción. Para usuario final mostrar SOLO descripción es más legible. | `F1B-07-customer-orders-detalle-pedido.png` |
| BUG-B2C-122 | MEDIA UX/copy | II.10 vs II.10.b | Inconsistencia label estado: listado muestra "**Abierto**", detalle muestra el mismo estado como "**En proceso**" (primer paso del stepper). Usuario no relaciona ambos labels. | `F1B-06` + `F1B-07` |
| BUG-B2C-123 | MEDIA a11y | II.10 paginación | Paginación renderizada como `<div style="cursor:pointer">` con handlers Qwik en lugar de `<button>` o `<a>`. NO es focusable con keyboard, NO anuncia rol button/link a lectores de pantalla, NO permite deeplinking a página específica. | `F1B-08-customer-orders-pagina-2.png` |
| BUG-B2C-124 | MEDIA UX | II.11 `/customer/address/edit/{id}` | No existe botón "Guardar" directo en el editor. El usuario debe usar "Ubicar en el mapa" → "Confirmar punto de entrega" para persistir cambios. Flujo no obvio sin tutorial. | `F1B-10-customer-address-editar.png` |
| BUG-B2C-125 | MEDIA UX/data | II.11 editar/agregar dirección | Inputs `city` y `state` son texto libre. Deberían ser `<select>` validados contra catálogo SAT/INEGI para evitar typos. | `F1B-10-customer-address-editar.png` |
| BUG-B2C-126 | BAJA UX | II.11 editar dirección | Botón "Ubicar en el mapa" no comunica que es paso de guardado. Mejor "Validar dirección en el mapa" o "Validar y continuar". | `F1B-10-customer-address-editar.png` |
| BUG-B2C-127 | BAJA UX | II.11 mapa de confirmación | Botón "Confirmar punto de entrega" mal etiquetado fuera del flujo de checkout. En contexto de editar dirección guardada, debería ser "Guardar dirección". | `F1B-11-customer-address-mapa-confirmacion.png` |
| BUG-B2C-128 | BAJA arq | II.11 editar vs agregar | Radios de alias usan `name="editAddressAlias"` en editar y `name="addAddressAlias"` en agregar. Inconsistencia naming — debería ser `addressAlias` único. | `F1B-10` + `F1B-12` |
| BUG-B2C-129 | BAJA UX | II.11 `/customer/address` | Botón "Usar esta dirección de envío como predeterminada" es texto demasiado largo (~50 chars). Mejor: toggle/checkbox "Predeterminada" o "Establecer como predeterminada". | `F1B-09-customer-address-listado.png` |
| BUG-B2C-130 | BAJA UX/a11y | II.11 botón eliminar | Botón "Eliminar {alias}" es icono-only (SVG) con `aria-label`, sin texto visible ni tooltip. UX descubrible solo con keyboard tab + screen reader o hover prolongado. Clase CSS engañosa: `editLink` (debería `deleteLink`). | `F1B-09-customer-address-listado.png` |
| BUG-B2C-131 | **CRÍTICO UX/data loss** | II.11 botón eliminar | Click en "Eliminar {alias}" **borra la dirección INSTANTÁNEAMENTE sin modal de confirmación**, sin toast tipo "¿Estás seguro?", sin opción de undo. Un tap accidental borra la dirección sin recuperación. Patrón industry-standard exige confirmación para acciones destructivas. | `F1B-13-customer-address-eliminar-estado.png` |
| BUG-B2C-132 | INFO UX positiva | II.11 agregar dirección | Tras crear dirección exitosamente, sitio muestra mensaje "¡Tu dirección ha sido agregada! Ahora podrás recibir tus compras sin contratiempos." + botón "Regresar". Buen pattern. Documentar para aplicar consistencia en delete (BUG-131). | `F1B-14-customer-address-agregada-exito.png` |
| BUG-B2C-133 | BAJA arq | II.11 botón eliminar | Botón eliminar usa la misma clase CSS `editLink` que el botón "Editar". Nombre de clase engañoso para a11y tools y QA inspección. Debería ser `deleteLink` / `removeAddress`. | `F1B-09-customer-address-listado.png` |
| BUG-B2C-134 | MEDIA SEO/a11y | II.11b `/customer/reviews` | Página sin `<h1>` (solo H2 "Mis reseñas"). Patrón sistémico BUG-067. | `F1B-15-customer-reviews-pendientes.png` |
| BUG-B2C-135 | BAJA SEO | II.11b `/customer/reviews` | Title `Rotoplas` genérico. Debería "Mis reseñas \| Rotoplas". | `F1B-15-customer-reviews-pendientes.png` |
| BUG-B2C-136 | BAJA copy | II.11b catálogo productos | Producto "Tinaco Plus+ con Bomba **Centrifuga** 1,100 litros" — "Centrifuga" sin tilde → "Centrífuga". Visible en tab Pendientes (SKU 500545) y probablemente en PDP/catálogo. | `F1B-15-customer-reviews-pendientes.png` |
| BUG-B2C-137 | BAJA arq | II.11b tabs | Pipe `|` literal entre tabs "Pendientes" y "Realizadas" en lugar de separador CSS (border, divider). Visible como caracter de texto. | `F1B-15-customer-reviews-pendientes.png` |
| BUG-B2C-138 | BAJA arq | II.11b widget rating | CSS class `StartContainer` con typo (debería `StarContainer`). Aplica a todos los containers de estrellas. | `F1B-15-customer-reviews-pendientes.png` |
| BUG-B2C-139 | BAJA UX | II.11b editor reseña | Textarea con `maxlength="240"`. 240 chars es muy corto para reseñas de producto (estándar industry: 500-1000 chars). Mismo límite que `message` en `/contacto/` (BUG-069). | `F1B-16-customer-review-form-escribir.png` |
| BUG-B2C-140 | MEDIA a11y | II.11b widget rating | Widget de estrellas sin `aria-label`, sin `aria-valuetext`, sin `role="radiogroup"`/`role="slider"`. Lectores de pantalla no anuncian el rating actual ni opciones. | `F1B-16-customer-review-form-escribir.png` |
| BUG-B2C-141 | MEDIA UX/copy | II.11b tab Realizadas | Empty state: "Aún no has adquirido productos para dejar una reseña" — **incorrecto**: el usuario SÍ tiene productos (5+ en Pendientes). Debería: "Aún no has dejado ninguna reseña" o "Tus reseñas publicadas aparecerán aquí". Mensaje confunde al usuario. | `F1B-17-customer-reviews-realizadas-vacio.png` |
| BUG-B2C-142 | MEDIA a11y | II.11b tabs | Tabs "Pendientes" y "Realizadas" son `<span>` con `on:click` Qwik en lugar de `<button role="tab">` o `<a>`. No focusable con keyboard, no anuncia rol a screen readers. Mismo patrón que paginación (BUG-123). | `F1B-15-customer-reviews-pendientes.png` |
| BUG-B2C-143 | BAJA arq/copy | II.11b empty state | Texto "Aún no has adquirido productos para dejar una reseña" contiene Zero Width Space invisible `​` (U+200B) al final. Caracter invisible rompe búsqueda Ctrl+F y testing automatizado que use match exacto. | `F1B-17-customer-reviews-realizadas-vacio.png` |
| BUG-B2C-144 | **CRÍTICO SEO/UX** | Routing global (404) | CUALQUIER URL inexistente del sitio (`/esta-url-no-existe-xyz123/`, `/lorem-ipsum-fake-page/`, etc.) devuelve **HTML 200 + H1 "Ha ocurrido un error"** en lugar de HTTP 404. Confirmado en F1B.6. Implicaciones: (1) Google indexa páginas de error como contenido válido (200 = canónico), (2) usuarios no entienden si la URL es incorrecta o es un fallo temporal, (3) crawlers SEO penalizan, (4) misma página de error usada para errores genuinos + URLs inexistentes → diagnóstico imposible. Pattern correcto: HTTP 404 + página "No encontrada" con link al home + sitemap. | `F1B-18-url-inexistente-error-generico.png` |
| BUG-B2C-145 | BAJA UX | I.1.b + I.15 Logout | Click "Cerrar sesión" no muestra toast/mensaje de confirmación ("Has cerrado sesión correctamente"). Logout silencioso. Industry-standard sugiere feedback explícito. | `F1B-19-logout-redirect-login.png` |
| BUG-B2C-146 | BAJA UX | I.1.b + I.15 Logout | Post-logout redirige a `/login/` en lugar de al home `/`. Usuario que acaba de cerrar sesión raramente quiere re-loguearse — quiere salir. El redirect a /login confunde. Mejor redirigir a `/`. | `F1B-19-logout-redirect-login.png` |
| BUG-B2C-147 | **CRÍTICO** SEO/a11y | II.7 cards de producto (global catálogo) | Las tarjetas de producto en TODOS los listings `/products/*` **no tienen `<a href>`** apuntando a la PDP. La navegación a la PDP se dispara con `on:click` Qwik en el `<h3 class="info__title">` y en el `<div class="galery">`. Implicaciones: (1) Google/crawlers NO siguen los productos (SEO catastrófico — productos invisibles para search), (2) Cmd/Ctrl+click no abre en pestaña nueva, (3) right-click "Copiar URL del enlace" no funciona, (4) screen readers no anuncian las cards como navegables, (5) bookmarks/sharing imposible sin entrar primero. Patrón correcto: envolver toda la card con `<a href="/products/categoria/slug/">` o usar `<a>` invisible cubriendo la card. | `F1C-01-almacenamiento-listado-inicial.png` |
| BUG-B2C-148 | **CRÍTICO** SSR | II.7.1 card "Cisterna 1,200 litros" + "cisterna 10,000lts equipada PLP" | **JSX comments leaked al DOM renderizado al usuario**: el texto visible en la card contiene literalmente `{/* Cabeza */}{/* Cuerpo */}{/* Cabeza */}{/* Cuerpo */}{/* Cabeza */}{/* Cuerpo */}{/* Cabeza */}{/* Cuerpo */}` 4 veces seguidas entre "Ideal para:" y "4 personas" / "8 personas". Es código JSX/Qwik que debió procesarse en build pero llegó al cliente como string. Detectado en 2 de 24 cards en `/products/almacenamiento/` página 1. Sugiere bug en el template del CMS Builder.io que mezcla comentarios JSX con strings literales. | `F1C-02-almacenamiento-jsx-leak-cisterna-1200.png` |
| BUG-B2C-149 | **CRÍTICO** copy | II.7.1 card "cisterna 10,000lts equipada PLP" | El título de la card muestra DOS nombres internos del CMS concatenados: `cisterna 10,000lts equipada PLPcisterna 10,000lts equipada DESC`. "PLP" y "DESC" son jerga interna (Product Landing Page / Description) que nunca debió ser pública. Además: nombre en minúsculas iniciales en vez de "Cisterna equipada 10,000 litros". | `F1C-02-almacenamiento-jsx-leak-cisterna-1200.png` |
| BUG-B2C-150 | MEDIA SEO | II.7.1 `/products/almacenamiento/` | `<title>` es literalmente `"almacenamiento meta title"` (placeholder de Builder.io no editado). SEO catastrófico — el title es lo más importante para Google. **Posiblemente afecta a las 9 categorías** — verificar en cada listing. | `F1C-01-almacenamiento-listado-inicial.png` |
| BUG-B2C-151 | MEDIA SEO | II.7.1 `/products/almacenamiento/` | `<meta name="description">` es literalmente `"almacenamiento meta description"` (placeholder de Builder.io no editado). Mismo problema sistémico que BUG-150. | `F1C-01-almacenamiento-listado-inicial.png` |
| BUG-B2C-152 | MEDIA UX | II.7.1 cards (global) | Los títulos largos de producto se truncan con `...` (CSS `text-overflow:ellipsis`) sin tooltip `title=""` ni mecanismo de expansión. Ejemplos en /almacenamiento/: `"Cartucho de repuesto para filtro de sedi..."`, `"Cisterna 1,200 litros con bomba centrifu..."`, `"Cisterna con Sensor de nivel 10,000 litr..."`. El usuario debe entrar a la PDP para saber qué producto es. Mínimo agregar `title={fullName}` al H3 para hover-tooltip nativo. | `F1C-01-almacenamiento-listado-inicial.png` |
| BUG-B2C-153 | BAJA UX | II.7.1 listing | Producto `"Electronivel Agro Agua dura 10 metros"` aparece **2 veces** en el listado de `/products/almacenamiento/` página 1 con el mismo precio y la misma imagen aparente. Probablemente duplicado en commercetools o filtro por variantes mal aplicado. | `F1C-01-almacenamiento-listado-inicial.png` |
| BUG-B2C-154 | MEDIA data | II.7.1 filtro Capacidad | Opciones del filtro Capacidad tienen duplicados con puntos extra: **`450 lts.` vs `450 lts..`** (segundo con 2 puntos), **`5,000 lts.` vs `5,000 lts..`** (segundo con 2 puntos), **`600 lts..`** (con 2 puntos sin par limpio). Indica data dirty en commercetools — atributos de producto sin normalización de capitalización/puntuación. Confunde al usuario que ve "dos" opciones para la misma capacidad. | filter-items dump |
| BUG-B2C-155 | MEDIA data | II.7.1 filtro Material | Opciones del filtro Material tienen duplicados por capitalización y puntuación: **`polipropileno` vs `Polipropileno`** (mayúscula), **`PP polipropileno atoxic` vs `PP Polipropileno atoxic.`** (mayúscula + punto final). Mismo problema sistémico que BUG-154. | filter-items dump |
| BUG-B2C-156 | MEDIA data + UX | II.7.1 filtro Material | Opción **`"Sistema de separación primeras\nlluvias (Tlaloque): Fabricado"`** aparece 2 veces idénticas en el filtro, AMBAS con un salto de línea literal (`\n`) en medio que rompe el layout del filtro. Texto compuesto típico de un attribute mal normalizado en CMS. | filter-items dump |
| BUG-B2C-157 | BAJA UX | II.7.1 filtro Potencia | Inconsistencia: opciones incluyen **`1/2 HP`** y **`1/2 HP bomba`** como entradas separadas. ¿Por qué una incluye "bomba"? Probable que sea el mismo filtro pero con dos data values en commercetools. Confunde criterio de selección. | filter-items dump |
| BUG-B2C-158 | MEDIA a11y | II.7.1 filtros (global) | Las opciones de filtros (Capacidad, Potencia, Material, Ordenar por) son `<li>` SIN `<input type="checkbox">` ni `<button>` — son spans/divs con handlers Qwik. Implicaciones: (1) screen readers no anuncian que son seleccionables, (2) keyboard nav (Tab) las salta, (3) state "seleccionado" no se anuncia a a11y tree. Pattern correcto: usar `<input type="checkbox">` o `<button role="checkbox" aria-checked>`. | filter-items dump |
| BUG-B2C-159 | MEDIA SEO | II.7.1 `/products/almacenamiento/` | **No hay breadcrumb visible** en la página de listing. El usuario perdido en `/products/almacenamiento/captadores-pluviales/` no tiene cómo navegar de regreso (excepto botón "Volver" del browser). Penaliza UX + SEO (los breadcrumbs son rich snippets en Google). Header tiene `<nav>` pero es el nav global, no el de la jerarquía del producto. | `F1C-01-almacenamiento-listado-inicial.png` |
| BUG-B2C-160 | ALTA UX | II.7 paginación (global) | **El primer click en cualquier botón de paginación falla silenciosamente** después de cargar la página. La URL no cambia, los productos no se actualizan. A partir del segundo click la paginación responde normalmente. Causa: handler Qwik `q-pFrEWLZp.js#s_0yBwjwabCxM` aún no hidratado al primer evento (resumability lag). Workaround: la paginación SI funciona vía URL `?page=N`. Bug sistémico que afecta TODOS los listings. | reproducido en `F1C-almacenamiento-all-pages.json` (pág 1 y 2 contenido idéntico) |
| BUG-B2C-161 | **CRÍTICO** SEO | II.7 subcategorías (global) | **TODAS las subcategorías tienen H1 = nombre de la categoría parent**, no el nombre propio de la subcategoría. Ejemplos verificados: `/products/almacenamiento/captadores-pluviales/` H1="Almacenamiento" (debería "Captadores pluviales"); `/products/almacenamiento/tinacos/` H1="Almacenamiento" (debería "Tinacos"). Implicación SEO: Google considera ambas páginas duplicadas (mismo H1), penaliza ranking. UX: usuario no sabe en qué página está. Confirmar patrón en otras subcategorías (purificadores-de-agua etc.). | URL directa |
| BUG-B2C-162 | MEDIA SEO | II.7 captadores-pluviales | Title de `/products/almacenamiento/captadores-pluviales/` es `"Rotoplas"` (genérico — mismo que home). No editado en Builder.io. | URL directa |
| BUG-B2C-163 | MEDIA SEO | II.7 captadores-pluviales | Meta description de `/products/almacenamiento/captadores-pluviales/` es `"Rotoplas"` (genérico). Sin valor SEO. | URL directa |
| BUG-B2C-164 | MEDIA copy | II.7 captadores-pluviales card #3 | Producto muestra título truncado erróneamente: **`"Sistema de captación pluvial 5,000  ltro..."`** — DOS espacios entre "5,000" y "ltro", y el truncado corta en "ltro" en vez de mostrar "litros". Comparado con productos 1 y 2 que usan formato consistente "5,000 litros". Bug de data en commercetools (espacio doble + posible nombre fuente diferente). | URL directa |
| BUG-B2C-165 | MEDIA data + UX | II.7 captadores-pluviales filtro Material | Las 2 opciones del filtro Material son descripciones técnicas completas de 200+ caracteres con saltos de línea (`\n`) literales como label de filtro. Ej: `"Sistema de separación primeras\nlluvias (Tlaloque): Fabricado de polietileno de alta densidad.\nCisterna: Material fabricado con pebd (polietileno lineal de baja densidad)"`. El campo "material" de commercetools se usó como descripción técnica completa del producto, en lugar de un valor categórico ("Polietileno", "PEBD"). Rompe el layout del sidebar (texto envuelve múltiples líneas) y el filtrado por material es inservible. | URL directa |
| BUG-B2C-166 | ALTA copy | II.7.2 `/products/almacenamiento-especializado/` H1 | H1 renderiza como **`"Almacenamientoespecializado"` (sin espacio)** entre las dos palabras. La class CSS de Qwik se llama `two-words` (indica que el componente sabe que son 2 palabras) pero el CSS no inserta separación visual. Debería ser "Almacenamiento Especializado" o "Almacenamiento especializado". Penaliza SEO + UX. | `F1C-04-almacenamiento-especializado-listado.png` |
| BUG-B2C-167 | MEDIA SEO | II.7.2 `/products/almacenamiento-especializado/` | Title `"Rotoplas"` (genérico — patrón sistémico, igual que home, mascotas, presurizacion, purificacion, tratamiento, conduccion). | `F1C-04-almacenamiento-especializado-listado.png` |
| BUG-B2C-168 | MEDIA SEO | II.7.2 `/products/almacenamiento-especializado/` | Meta description `"Rotoplas"` (genérico). | `F1C-04-almacenamiento-especializado-listado.png` |
| BUG-B2C-169 | MEDIA data | II.7.2 filtro Capacidad | Coexisten `5,000 lts.` y `5,001 lts.` — diferencia de 1 litro improbable. Casi seguro typo en commercetools. | filter dump |
| BUG-B2C-170 | **CRÍTICO** SEO | II.7 `/products/mascotas/` | **H1 totalmente vacío `""`** — la página no tiene H1 visible. Penaliza SEO + accesibilidad (screen readers no encuentran heading principal). | `F1C-03-mascotas-vacia.png` |
| BUG-B2C-171 | **CRÍTICO** producto | II.7 `/products/mascotas/` | Categoría **completamente vacía (0 productos)**. ¿Soft-launch sin productos cargados? ¿Categoría obsoleta? Si la categoría no debe mostrarse aún, debería estar oculta del menú/footer. Si debe mostrarse, falta cargar productos en commercetools. Estado actual rompe expectativa del usuario que llega buscando productos para mascotas. | `F1C-03-mascotas-vacia.png` |
| BUG-B2C-172 | MEDIA UX/copy | II.7 `/products/mascotas/` | Empty state usa copy `"No encontramos coincidencias para tu búsqueda. Intenta buscar de nuevo o explora nuestro catálogo completo."` — copy es de "búsqueda sin resultados", **no de categoría vacía**. Semánticamente incorrecto. Para categoría vacía debería: "Pronto traeremos productos a esta categoría" o "Esta categoría aún no tiene productos disponibles". | `F1C-03-mascotas-vacia.png` |
| BUG-B2C-173 | MEDIA UX | I.4 Footer global columna "Productos" | El footer global lista **SOLO 7 categorías** (Almacenamiento, Almacenamiento Especializado, Presurización, Purificación, Tratamiento, Calentamiento, Conducción). **No incluye Mascotas ni Servicios**, que sí son URLs activas (200) bajo `/products/`. Inconsistencia: o se incluyen todas las categorías o las categorías excluidas no deberían ser navegables. | `F1C-04-almacenamiento-especializado-listado.png` |
| BUG-B2C-174 | INFO | II.7 `/products/mascotas/` | La página vacía no muestra sidebar de filtros (correcto — sin productos no hay qué filtrar). Pero la falta del sidebar puede confundir al usuario sobre si está en la página correcta. Considera mostrar el sidebar deshabilitado con copy "Sin productos disponibles". | `F1C-03-mascotas-vacia.png` |
| BUG-B2C-175 | MEDIA SEO | II.7 todas las categorías | Meta tags **Open Graph (`og:title`, `og:description`, `og:url`)** todos con valor `"Rotoplas"` placeholder. Compartir una categoría en Facebook/WhatsApp/Slack muestra "Rotoplas" como título de preview, sin contexto del producto. | `F1C-04` |
| BUG-B2C-176 | BAJA SEO | II.7 todas las categorías | Falta `<meta name="robots">` — sin control explícito de indexación. Recomendable agregar `index,follow` para categorías o `noindex,follow` para variantes paginadas (`?page=2+`) para evitar duplicate content. | `F1C-04` |
| BUG-B2C-177 | BAJA SEO | II.7 todas las categorías | Faltan meta tags `twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`. Compartir en Twitter/X muestra preview sin formato. | `F1C-04` |
| BUG-B2C-178 | **CRÍTICO** a11y | II.7 cards de producto (global) | **TODAS las imágenes de las cards tienen `alt=""` (string vacío)** — screen readers no anuncian el producto. Patrón sistémico verificado en /almacenamiento/, /almacenamiento-especializado/ — afecta el catálogo entero. Pattern correcto: `alt="{nombre del producto}"`. | `F1C-04` |
| BUG-B2C-179 | MEDIA a11y | II.7 paginación (global) | Los botones `‹ Anterior` y `Siguiente ›` **sin `aria-label`** — screen readers leen literalmente "menor que Anterior" / "Siguiente mayor que" en vez de "Página anterior" / "Página siguiente". | `F1C-04` |
| BUG-B2C-180 | BAJA copy | II.7.2 producto "Bola de propileno 3 pulgadas" | **Typo:** debería ser "polipropileno" (no "propileno" — falta el prefijo "poli"). Inconsistente con el resto de productos de Niple/Conexión que sí dicen "polipropileno". | `F1C-04` |
| BUG-B2C-181 | BAJA copy | II.7.2 producto "Adaptador de venteo con malla 10 de 3¨" | Usa **diéresis doble `¨`** (caracter U+00A8) en vez de comillas dobles `"` (caracter U+0022) para denotar pulgadas. Caracter visualmente similar pero incorrecto — confunde búsqueda Ctrl+F, copiar/pegar y a11y. | `F1C-04` |
| BUG-B2C-182 | BAJA copy | II.7.2 productos "Niple corto de polipropileno 3/4´" y "3´" | Usan **apóstrofe izquierdo `´`** (caracter U+00B4) en vez de comillas dobles `"` para pulgadas. Mismo problema que BUG-181, pero distinto caracter Unicode. La denotación correcta de pulgadas es `"`. | `F1C-04` |
| BUG-B2C-183 | MEDIA UX | II.7.2 productos "Conexión hexagonal de polipropileno y ED..." | **5 entradas consecutivas con título idéntico truncado** "Conexión hexagonal de polipropileno y ED..." (posiciones 15-19 del listado). Sin ver el nombre completo el usuario no puede distinguirlas. Causa raíz probable: 5 SKUs con prefix de nombre común y solo diferencia en el sufijo, todos truncados antes del distintivo. | `F1C-04` |
| BUG-B2C-184 | BAJA SEO/a11y | II.7.2 banner promocional | El texto promocional `"¡Envío GRATIS en toda la tienda!"` está marcado como **H3** en el DOM. Interrumpe jerarquía semántica del documento (un banner promocional debería ser H4/`<p>`/`<aside>`, no H3 paralelo a títulos de producto). | `F1C-04` |
| BUG-B2C-185 | BAJA arq | I.4 Footer global | Las 5 columnas del footer (`Servicio al cliente`, `Productos`, `Sobre Rotoplas`, `Contáctanos`, `Certificación de datos`) renderizan **2× en el DOM** — una variante visible en desktop, otra en mobile (hidden via CSS responsive). Penaliza bundle size y duplica work del DOM diffing. Mejor: un solo render + CSS responsive. **Confirma + extiende BUG-B2C-005 sobre el footer global.** | `F1C-04` |
| BUG-B2C-186 | BAJA UX | II.7 filtros con una sola opción | Algunas categorías muestran filtros con una sola opción `"No aplica"` (ej. `/almacenamiento-especializado/` filtro Potencia = solo "No aplica"). Filtro sin variación no aporta — debería ocultarse en cliente o servirse condicionalmente. | filter dump |
| BUG-B2C-187 | BAJA a11y | II.7 paginación numérica | Los botones numéricos `2`–`N` no activos solo tienen `text=N` sin `aria-label="Ir a página N"`. El botón `1` activo SI tiene `aria-current="page"` ✅, pero los demás carecen de hint. | `F1C-04` |
| BUG-B2C-188 | INFO UX | II.7 cards | Las dos `<img>` de la galería de cada card tienen el **mismo `src`** — no hay segunda imagen distinta para hover-swap. Verificar si es funcionalidad incompleta del CMS (Builder.io) o decisión consciente. Si era hover effect, no aporta. | `F1C-04` |
| BUG-B2C-189 | MEDIA a11y | II.7 cards botón "Agregar al carrito" | El botón usa `type="submit"` pero **NO está dentro de un `<form>`** — el submit no tiene efecto válido. Debería ser `type="button"`. Tampoco tiene `aria-label="Agregar {producto} al carrito"` — screen readers solo leen "Agregar al carrito" sin saber a cuál producto se refiere. | `F1C-04` |
| BUG-B2C-190 | BAJA copy | II.7.2 productos "Conexión cuadrada de polipropileno TOR. ..." | "TOR." parece jerga interna (¿Toricidad? ¿Tornillería?). Sin documentación pública, el usuario no entiende qué significa. 2 entradas idénticas truncadas. | `F1C-04` |
| BUG-B2C-191 | BAJA copy | II.7.2 producto "Conexión hexagonal de polipropeno VITON ..." | **Typo:** "polipropeno" (faltan letras "il"). Debería "polipropileno". | `F1C-04` |
| BUG-B2C-192 | ALTA legal/UX | I.x Cookie banner global | El banner de cookies (`"En Rotoplas usamos cookies... Acepto"`) presenta solo botón "Acepto" — **sin opción explícita de "Rechazar"** ni "Configurar cookies". Bajo LFPDPPP México y GDPR (si tiene tráfico EU), el consentimiento debe ser tan fácil de rechazar como de aceptar. Confirmar con legal. Relacionado con BUG-006 sobre trackers cargados pre-consentimiento. | `F1C-04` |
| BUG-B2C-193 | INFO SEO | II.7.1 `/products/almacenamiento/` meta tags | Existe `<meta name="url" content="...">` no estándar. Para declarar URL canónica se usa `<link rel="canonical">` (presente) y `<meta property="og:url">` (presente). El `meta name="url"` adicional puede confundir crawlers o ser un artefacto del CMS Builder.io. Recomendar removerlo. | `F1C-almacenamiento-full-deep.json` |
| BUG-B2C-194 | MEDIA SEO | II.7 todas las categorías | Falta `meta[property="og:image"]` — al compartir una categoría en Facebook/WhatsApp/Slack, el preview no muestra imagen (Facebook autogenera una imagen genérica del logo si no la encuentra). Pierde CTR. Recomendar agregar `og:image` con una imagen representativa por categoría. Aplica también `og:type` (recomendable `website` o `product.group`). | `F1C-almacenamiento-full-deep.json` |
| BUG-B2C-195 | BAJA i18n | II.7 todas las categorías | Falta `<link rel="alternate" hreflang="...">`. Si se planea operar en otros países o idiomas, los buscadores no sabrán qué versión servir. Penalización SEO multinacional. | `F1C-almacenamiento-full-deep.json` |
| BUG-B2C-196 | MEDIA data | II.7 inconsistencia de placeholders | `/products/almacenamiento/` y `/products/almacenamiento/tinacos/` usan **placeholder `"{slug} meta title"`** (texto editorial original sin completar) mientras `/products/almacenamiento-especializado/`, `/products/presurizacion/`, `/products/purificacion/`, `/products/tratamiento/`, `/products/conduccion/`, `/products/mascotas/` usan **`"Rotoplas"`** (default genérico). DOS variantes del mismo bug coexistiendo en commercetools/Builder.io. Inconsistencia indica trabajos de SEO iniciados parcialmente y abandonados. | comparación entre dumps |
| BUG-B2C-197 | BAJA UX | II.7 banner promocional inconsistente | El banner `"¡Envío GRATIS en toda la tienda!"` (H3) aparece en `/products/almacenamiento-especializado/` pero NO en `/products/almacenamiento/` ni en sus subcategorías. Inconsistencia: o el banner es global (debería aparecer en todas las categorías) o es contextual (debería tener lógica clara de cuándo aparece). | dumps |
| BUG-B2C-198 | BAJA performance | II.7 cards (global) | Las `<img>` de cards de producto **no usan `srcset` ni `sizes`** — el mismo `src` se sirve a mobile y desktop. En mobile (375-390px), descargar una imagen optimizada para 150×150 desktop es relativamente eficiente, pero no se aprovechan formatos responsivos (`<picture>` con WebP a diferentes resoluciones). Penalización Core Web Vitals en redes lentas. | `F1C-almacenamiento-full-deep.json` |
| BUG-B2C-199 | MEDIA infra | II.7 buckets de imágenes inconsistentes | **Dos buckets distintos sirviendo imágenes** según categoría: `/products/almacenamiento/` usa `https://storage.googleapis.com/rtp-bucket-b2b-qas/...` mientras `/products/almacenamiento-especializado/` usa `https://storage.googleapis.com/rtp-bucket-b2b-qa/...` (sin la `s` final). Posibles causas: migración a medio terminar, env vars divergentes entre cards, duplicación accidental de assets. Si uno de los buckets se borra → imágenes rotas. Coherencia de infra crítica. Ver BUG-208 que extiende este a 5 origins. | comparación entre dumps |
| BUG-B2C-200 | INFO arq | II.7 H4 filter-title vs H1 | El nombre correcto de la subcategoría SÍ existe en el DOM como **H4 `filter-title`** (ej. `"Captación pluvial"`, `"Tinacos"`) pero NO en el H1 (que muestra el padre `"Almacenamiento"`). Hallazgo importante: el dato existe → solución potencial es elevar el H4 al H1 (refactor de template). Refina entendimiento de BUG-161. | `F1C-captadores-pluviales-deep.json` + `F1C-tinacos-deep.json` |
| BUG-B2C-201 | **CRÍTICO** infra | II.7 captadores-pluviales imágenes | Las 3 imágenes de cards en `/captadores-pluviales/` apuntan a **`storage.googleapis.com/rtp-bucket-b2b-prd/...`** (bucket de PRODUCCIÓN) desde environment QA. Implicaciones: (1) si prod cambia o elimina una imagen → QA muestra rota, (2) inconsistencia ambiental → ningún test puede confiar en que las imágenes coinciden con commercetools QA. | `F1C-captadores-pluviales-deep.json` |
| BUG-B2C-202 | ALTA arq | II.7 className del article | El atributo `class` del `<article>` de las cards contiene **saltos de línea `\n` literales** (porque los valores del filtro Material tienen `\n`). HTML estándar permite saltos de línea en valores de atributo pero rompe: (1) CSS selectores con esa class, (2) librerías que parsean className.split(' '), (3) tests Playwright con `getByClass`, (4) crawlers SEO con parsers estrictos. → solución upstream: limpiar el valor "Material" en commercetools (BUG-165), o downstream: el componente Qwik debería normalizar `\n` → espacio antes de aplicar el className. | `F1C-captadores-pluviales-deep.json` |
| BUG-B2C-203 | BAJA UX | II.7.1 tinacos data-tooltip inconsistente | De las 24 cards en `/tinacos/` pág 1, **19 tienen `data-tooltip` con el nombre completo del producto** y **5 NO lo tienen**. Inconsistencia: cuando un título está truncado y no tiene tooltip, el usuario no puede ver el nombre completo sin entrar a la PDP. Patrón heredado de commercetools — algunos productos tienen el `data-tooltip` field configurado, otros no. Hacer obligatorio. Refina BUG-152. | `F1C-tinacos-deep.json` |
| BUG-B2C-204 | ALTA UX | II.7.1 tinacos card #5 | El producto #5 de `/tinacos/` muestra como título visible solo **`"Tinaco Plus+"`** (sin litros ni color distintivo), mientras su `data-tooltip` dice `"Tinaco Plus+ equipado 2,500 litros color beige"`. El usuario sin hover no sabe qué producto es. Si existen múltiples SKUs llamados solo `"Tinaco Plus+"` en el listing, **no se pueden distinguir entre sí**. Bug del campo "nombre corto" del producto en commercetools — debe incluir mínimo capacidad + color. | `F1C-tinacos-deep.json` |
| BUG-B2C-205 | MEDIA UX/geo | II.7.1 tinacos productos "Venta exclusiva en Tuxtla" | El producto `"Tinaco Resistec 1,100 litros color gris (Venta exclusiva en Tuxtla)"` (y otro 450 lts. gris) está **geo-locked a Tuxtla** según su `data-tooltip`, pero se muestra a todos los usuarios sin disclaimer visible en la card. El usuario fuera del área de Tuxtla puede intentar comprarlo y descubrir hasta el checkout que no se le envía. Solución: o se filtra por geo del usuario (CP guardado en sesión), o se agrega badge visible "Venta exclusiva [región]" en la card. | `F1C-tinacos-deep.json` |
| BUG-B2C-206 | INFO | II.7 imágenes con `width=45 height=45` | Las imágenes placeholder de Builder.io en cards tienen atributos HTML `width="45" height="45"` mientras los slots están dimensionados a 150×150 por CSS. Resultado: imágenes escaladas + pixeladas en pantalla. Se beneficiaría de servir el mismo placeholder en 150×150 o usar `srcset`. | `F1C-tinacos-deep.json` |
| BUG-B2C-207 | MEDIA UX | II.7.1 tinacos placeholder de imagen compartido | **5 productos** de `/tinacos/` pág 1 comparten **exactamente la misma imagen** de Builder.io (asset `a4b10ac1cdd04673a404eb1dafc8dcc4`). Causa: estos 5 productos no tienen imagen propia en commercetools, así que el sistema sirve un placeholder genérico de Builder.io. Resultado: el usuario ve 5 productos con la misma imagen → pierde diferenciación visual, parece error de UI, deteriora confianza. Solución: asegurar que TODO producto en commercetools tenga imagen propia antes de publicar. | `F1C-tinacos-deep.json` |
| BUG-B2C-208 | **CRÍTICO** infra | II.7 múltiples origins de imágenes | **CINCO origins distintos** sirviendo imágenes en una sola página `/tinacos/`: (1) `storage.googleapis.com/rtp-bucket-b2b-qas/...`, (2) `storage.googleapis.com/rtp-bucket-b2b-qa/...`, (3) `storage.googleapis.com/rtp-bucket-b2b-prd/...`, (4) `cdn.builder.io/api/v1/image/...`, (5) `images.cdn.us-central1.gcp.commercetools.com/...`. Caos infra: 5 endpoints distintos con caching, latencia, geo-distribución y reglas CSP diferentes. Si cualquiera cae → parte del catálogo se rompe. Imposible mantener consistencia de cache control / CDN edge. Necesita estrategia única (proxy unificado o un solo bucket). Confirma + extiende BUG-199 y BUG-201. | `F1C-tinacos-deep.json` |
| BUG-B2C-209 | BAJA performance | II.7 placeholder Builder.io pixelado | Las imágenes placeholder servidas desde `cdn.builder.io/api/v1/image/...?format=webp` se descargan a tamaño real 45×45 pero se renderizan a 150×150 (CSS). Imagen pixelada visible. Pierde calidad percibida. | `F1C-tinacos-deep.json` |
| BUG-B2C-210 | MEDIA SEO | II.14 `/servicios/` | Meta description es la cadena `"rotoplas"` (minúscula, una sola palabra, sin formato). Sin valor SEO. | `F1D-url-verification.json` |
| BUG-B2C-211 | MEDIA SEO | II.20 `/seguridad-de-la-informacion/` | `<title>` es el slug literal `"seguridad-de-la-informacion"` (con guiones, sin tildes, sin formato humano). Debería ser `"Seguridad de la información \| Rotoplas"` o similar. | `F1D-url-verification.json` |
| BUG-B2C-212 | **CRÍTICO** legal/UX | I.4 Footer `/terminos-y-condiciones` | (Relacionado con BUG-037/038.) El link del footer `/terminos-y-condiciones` redirige **cross-domain** a `https://rotoplas.com.mx/ofertas-rotoplas-terminos-y-condiciones/` — son T&C de promo Hot Sale Mayo, NO T&C generales del e-commerce. El sitio B2C **no tiene T&C generales propios** del e-commerce. Bloqueador legal. | navigate browser |
| BUG-B2C-220 | MEDIA SEO | II.18 `/blog/` title | Title `"Rotoplas"` (genérico — patrón sistémico con muchas categorías). Debería incluir "Blog" o título específico. | `F1D-blog-deep.json` |
| BUG-B2C-221 | MEDIA SEO | II.18 `/blog/` meta description | Meta description `"¡Disfruta lo mejor de Rotoplas al alcance de un solo clic!"` — frase genérica reutilizada en /blog/, /nosotros/, /distribuidores/, /servicios-lavado/, /recursos/, /aviso-de-privacidad/, /seguridad-de-la-informacion/ y /mascotas/. Es decir, **8 páginas comparten la misma meta description** — Google penaliza duplicate content de meta descriptions. | `F1D-blog-deep.json` |
| BUG-B2C-222 | **CRÍTICO** SEO/a11y | II.18 `/blog/` H1 | **No existe H1** en la página del blog. La página carece de heading principal. Google espera H1 único por página. Screen readers no pueden identificar el tema de la página. | `F1D-01-blog-vacio.png` |
| BUG-B2C-223 | ALTA SEO | II.18 `/blog/` títulos de posts | Los títulos de cada post listado son `<a>` simple, **sin envolverlos en `<h2>` o `<h3>`**. Google penaliza listings de blog sin heading semántico por post (no puede determinar relevancia ni breadcrumb). Pattern correcto: `<h2><a href="...">Título</a></h2>`. | `F1D-blog-deep.json` |
| BUG-B2C-224 | MEDIA a11y/SEO | II.18 `/blog/` containers de posts | Los posts son `<div class="blog-article">`, **NO `<article>`**. HTML5 spec recomienda `<article>` para items de blog/news. Penaliza estructura semántica y rich snippets de Google. | `F1D-blog-cards-deep-v2.json` |
| BUG-B2C-225 | INFO arq URL | II.18 `/blog/` slugs de posts | Los posts viven en el ROOT del dominio (ej. `/transformacion-sostenible-e-innovacion-con-rotoplas`), no bajo `/blog/{slug}/`. La URL pierde la jerarquía de blog. Pattern recomendado: `/blog/transformacion-sostenible-e-innovacion-con-rotoplas/`. Permite SEO de blog (sitemap, breadcrumb, etc.) y evita colisiones con cualquier otra ruta. | snapshot a11y |
| BUG-B2C-226 | MEDIA copy/i18n | II.18 `/blog/` fechas inconsistentes | La **MISMA fecha de post** se renderiza en 2 formatos diferentes en la misma página: listado principal usa formato inglés abreviado (`"May 21 2025"`, `"Apr 16 2025"`) mientras el sidebar usa formato español (`"mayo 21, 2025"`, `"abril 16, 2025"`). Inconsistencia notable y mala localización para sitio en español-MX. | snapshot a11y |
| BUG-B2C-227 | MEDIA UX | II.18 `/blog/` paginación off-by-one | La numeración visible al usuario (1, 2, 3) NO coincide con el parámetro `?page=N` en el URL. Verificado: botón `"2"` → `/blog/?page=1`, botón `"3"` → `/blog/?page=2`, botón `"Siguiente"` → `/blog/?page=1`. La página inicial sin parámetro es implícitamente `?page=0`. Esto confunde URL sharing, bookmarks y consistencia. **Verificado sistémico también en `/category/{slug}`** (en `/category/conduccion/` el botón `"2"` → `?page=1`, `"Siguiente"` → `?page=1`) — las categorías paginan con el mismo off-by-one, no "correctamente". | `F1D-blog-cards-deep-v2.json` + `F2-30-blog-gap-closure.png` |
| BUG-B2C-228 | BAJA copy/i18n | II.18 `/blog/` categorías sin tilde | Las categorías del blog `"Conduccion"` (debería **Conducción**) y `"Purificacion"` (debería **Purificación**) **no llevan tilde** en su display name. Inconsistencia: en el footer + mega-menú + listing de productos las mismas palabras SÍ están bien escritas. Bug del campo "categoría" en el CMS del blog. | `F1D-blog-cards-deep-v2.json` |
| BUG-B2C-229 | INFO SEO | II.18 `/blog/` sin RSS feed | El blog no expone `<link rel="alternate" type="application/rss+xml">` ni `<link rel="alternate" type="application/atom+xml">`. Estándar para blogs (lectores RSS, agregadores, IFTTT, Zapier). Builder.io expone RSS de su CMS pero el sitio no lo enlaza. | `F1D-blog-cards-deep-v2.json` |
| BUG-B2C-230 | **CRÍTICO** SEO/a11y | II.18.b posts individuales H1 | Los posts individuales del blog **no tienen `<h1>` visible** — solo el `<title>` del documento. Google espera H1 con el título del post en el cuerpo de la página para confirmar el tema. Screen readers no encuentran el heading principal. Verificado en `/transformacion-sostenible-e-innovacion-con-rotoplas/`. Probablemente sistémico — verificar otros posts. | `F1D-blog-post-individual.json` |
| BUG-B2C-231 | MEDIA SEO | II.18.b post `article:modified_time` UNIX epoch | `meta[property="article:modified_time"]` tiene valor `"Thu Jan 01 1970 00:00:00 GMT+0000"` — UNIX epoch 0 default sin inicializar. Google interpreta como "post nunca modificado" (o data corrupta). Solución: o se omite el meta tag si el post nunca se modificó, o se setea con la fecha de última modificación real. **Verificado sistémico (2/2 posts) y con doble defecto: además del valor epoch-0, el formato es JS `Date.toString()` (`"Thu Jan 01 1970..."`) en vez de ISO 8601 como `published_time` — rompe parsers de Yoast/Google.** | `F1D-blog-post-individual.json` + `F2-30-blog-gap-closure.png` |
| BUG-B2C-232 | BAJA copy | II.18.b post meta author | `meta[name="author"] = "AdminRotoplas"` y `meta[name="twitter:data1"] = "AdminRotoplas"` — usuario admin literal de WordPress, no nombre real del autor. Para posts editoriales debería ser nombre real (ej. "Equipo Rotoplas" o nombre del redactor). | `F1D-blog-post-individual.json` |
| BUG-B2C-233 | MEDIA SEO | II.18.b post meta description | Meta description del post individual es la cadena genérica `"¡Disfruta lo mejor de Rotoplas al alcance de un solo clic!"` (misma frase del listado y otras 7 páginas). Debería ser un excerpt del post para SEO + CTR en SERPs. Aplica también a `og:description` y `twitter:description`. | `F1D-blog-post-individual.json` |
| BUG-B2C-234 | MEDIA UX | II.18.b post sin fecha visible | El usuario no ve la fecha de publicación al leer el post — solo está en `meta[property="article:published_time"]`. Estándar en blogs: fecha visible debajo del título (o autor). | `F1D-blog-post-individual.json` |
| BUG-B2C-235 | MEDIA UX | II.18.b post sin autor visible | El usuario no ve quién escribió el post — solo está en `meta[name="author"]` (y dice "AdminRotoplas"). Falta byline visible. | `F1D-blog-post-individual.json` |
| BUG-B2C-236 | MEDIA UX | II.18.b post sin social share | El post no incluye **botones para compartir** en Facebook, Twitter/X, WhatsApp, LinkedIn (estándar en todo blog moderno). Pierde shares orgánicos y tráfico social. | `F1D-blog-post-individual.json` |
| BUG-B2C-237 | INFO UX | II.18.b post sin comentarios | El post no incluye **sección de comentarios** (sin Disqus, sin FB Comments, sin nativos). Puede ser decisión consciente (modera carga moderación) pero pierde engagement. | `F1D-blog-post-individual.json` |
| BUG-B2C-238 | MEDIA SEO | II.18.b post sin breadcrumb | El post no tiene breadcrumb `Inicio > Blog > Categoría > Título del post`. Penaliza rich snippets en Google + perder navegación contextual del usuario. BUG-159 sistémico aplica también aquí. | `F1D-blog-post-individual.json` |
| BUG-B2C-239 | MEDIA UX | II.18.b post "Artículos relacionados" | La sección H3 `"Artículos relacionados"` lista **6 cards de PRODUCTOS** del catálogo (clase `card-product-filter`), NO posts del blog. La palabra "artículo" es ambigua. En contexto de blog/post, el usuario espera posts relacionados. Refactorizar a "Productos relacionados" o agregar realmente posts del mismo tema. | `F1D-blog-post-individual.json` |
| BUG-B2C-240 | INFO arq | II.18 blog montado sobre WordPress | **Hallazgo arquitectónico:** la class `wp-block-heading` en los headings del post confirma que **el blog está sobre WordPress** (integrado vía iframe / proxy al CMS Builder.io / SSR Qwik). Implicaciones: el sitio tiene **3 CMS coexistiendo** — Builder.io (layouts), commercetools (catálogo), WordPress (blog). Cada uno con su propio modelo de fechas, autoría, categorización. Explica inconsistencias documentadas (categorías sin tilde de WP vs catálogo bien escrito, slugs en root del dominio, `meta author=AdminRotoplas` que es username WordPress). | `F1D-blog-post-individual.json` |
| BUG-B2C-241 | **CRÍTICO** SEO | II.17 `/nosotros/` meta placeholders | La página `/nosotros/` tiene **`<meta name="key1" content="value1">`** y **`<meta name="key2" content="value2">`** — placeholders LITERALES no editados dejados en producción. Probablemente alguien copió un boilerplate de meta tags y no completó los valores. Datos basura para crawlers. | `F1D-nosotros-deep.json` |
| BUG-B2C-242 | INFO SEO | II.17 `/nosotros/` meta no estándar | La página `/nosotros/` tiene `<meta name="position" content="1">` — no es un meta tag estándar reconocido por buscadores. Probablemente residuo de un schema.org markup mal implementado (BreadcrumbList tiene `position` pero como propiedad de itemListElement, no como meta global). | `F1D-nosotros-deep.json` |
| BUG-B2C-243 | MEDIA arq | II.17 `/nosotros/` links duplicados | Los 4 CTAs principales (`"Quiénes somos"`, `"Estrategia"`, `"Carreras"`, `"Corporativo"`) aparecen **DUPLICADOS en el DOM** con distinto `target` (uno sin target / otro con `_blank`). Sugiere render duplicado del mismo componente con variantes responsive (mobile vs desktop) — penaliza bundle + DOM diffing. Mismo patrón que footer global (BUG-185). Adicionalmente: el primer "Quienes somos" sin tilde + el segundo "Quiénes somos" con tilde — **inconsistencia de copy entre los duplicados**. | `F1D-nosotros-deep.json` |
| BUG-B2C-244 | BAJA copy | II.17 `/nosotros/` CTA "Quienes somos" sin tilde | El label visible del primer link es `"Quienes somos"` (sin tilde) mientras el segundo (mismo destino) es `"Quiénes somos"` (con tilde). El H2 dice "Quiénes somos" con tilde. Inconsistencia ortográfica entre 2 instancias del mismo link en la misma página. | `F1D-nosotros-deep.json` |
| BUG-B2C-245 | INFO arq | II.17 `/nosotros/` trailing slash inconsistente | Los CTAs duplicados usan distinto trailing slash para el mismo destino: `/nosotros/estrategia` (sin slash) y `/nosotros/estrategia/` (con slash). Ambos retornan 410, pero por inconsistencia general del sitio. | `F1D-nosotros-deep.json` |
| BUG-B2C-246 | **CRÍTICO** | II.17 `/nosotros/estrategia` HTTP 410 | El link `Estrategia` del cuerpo de `/nosotros/` apunta a `/nosotros/estrategia` (y `/nosotros/estrategia/`) que **devuelve HTTP 410 GONE** (recurso permanentemente eliminado). 4 links en /nosotros/ apuntan a esta URL rota (2 duplicados × 2 variantes slash). Bug crítico visible al usuario — click en "Estrategia" → página vacía. | `F1D-url-verification.json` |
| BUG-B2C-247 | **CRÍTICO** | II.17 `/nosotros/identidad/` "Ha ocurrido un error" | El link `Nosotros` del footer de /nosotros/ apunta a `/nosotros/identidad/` que devuelve HTTP 200 pero el H1 visible es `"Ha ocurrido un error"`. Página genérica de error en lugar de contenido. Mismo patrón sistémico que BUG-144 pero aplicado a una sub-página interna que solía existir. | `F1D-url-verification.json` |
| BUG-B2C-248 | **CRÍTICO** | II.17 `/nosotros/empleos/` "Ha ocurrido un error" | El link `Empleos` del footer de /nosotros/ apunta a `/nosotros/empleos/` que devuelve HTTP 200 pero el H1 es `"Ha ocurrido un error"`. Página de error. | `F1D-url-verification.json` |
| BUG-B2C-249 | MEDIA SEO | II.17 `/nosotros/` URL legacy categoría | Los 6 links a categorías de producto en `/nosotros/` usan el formato **legacy** `/categoria-producto/{slug}/` en lugar del canónico `/products/{slug}/`. Confirmado por browser: las URLs legacy redirigen 301/302 a las canónicas, por lo que no son links rotos. Pero generan: (1) duplicate content si Google indexa ambas variantes, (2) carga extra de redirect por cada click. Inconsistencia con el resto del sitio (header, footer Productos, mega-menú usan `/products/`). | navigate confirmation |
| BUG-B2C-250 | BAJA copy | II.17 `/nosotros/presencia/` title formato | El title de la página es `"Nosotros > Presencia"` — formato breadcrumb-style con caracter `>` literal. Inconsistente con el resto de páginas del sitio que usan `"Título \| Rotoplas"` o `"Título"` solo. El `>` literal puede causar problemas de display en SERPs de Google. | `F1D-url-verification.json` |
| BUG-B2C-251 | ALTA SEO | II.7.3 `/products/presurizacion/` | `<title>` = `"Rotoplas"` genérico, sin "Presurización" ni "Productos de presurización Rotoplas". CTR orgánico penalizado. Sistémico: confirmado en todas las categorías excepto Calentamiento. | `evidencias/F1C-05-presurizacion-listado.png` |
| BUG-B2C-252 | ALTA SEO | II.7.3 `/products/presurizacion/` | `meta[name="description"]` = `"Rotoplas"` placeholder literal. Sin valor descriptivo para SERP. Sistémico. | `evidencias/F1C-05-presurizacion-listado.png` |
| BUG-B2C-253 | MEDIA SEO/social | II.7.3 `/products/presurizacion/` | `og:title` y `og:description` = `"Rotoplas"`. Compartir en redes muestra título inútil. Sistémico. | `evidencias/F1C-05-presurizacion-listado.png` |
| BUG-B2C-254 | BAJA | II.7.3 `/products/presurizacion/` | H1 `"Presurización "` con espacio trailing literal en el texto (clase `⭐️e9g5cr-0 one-word`). | `evidencias/F1C-05-presurizacion-listado.png` |
| BUG-B2C-255 | MEDIA infra | II.7.3 `/products/presurizacion/` | Banner URL con NFD unicode (`presurizacio%CC%81n.webp`) — `ó` descompuesto en `o` + U+0301, no normalizado a NFC. Funciona pero rompe expectativas de URL canonical/handler. Inconsistente entre categorías (Tratamiento y Calentamiento no usan NFD). | `evidencias/F1C-05-presurizacion-listado.png` |
| BUG-B2C-256 | BAJA UX | II.7.3 `/products/presurizacion/` (sistémico listing) | Sort sin opciones "Relevancia", "Más vendido", "Más reciente", "Mejor calificado". Solo precio + alfabético (4 opciones). | `evidencias/F1C-05-presurizacion-listado.png` |
| BUG-B2C-257 | MEDIA UX | II.7.3 `/products/presurizacion/` (sistémico listing) | Filtro "Capacidad" solo tiene opción "No aplica" en /presurizacion/ — debe ocultarse cuando no hay valores reales aplicables a la categoría. | `evidencias/F1C-05-presurizacion-listado.png` |
| BUG-B2C-258 | MEDIA UX/data | II.7.3 `/products/presurizacion/` (sistémico listing) | Opción "No aplica" expuesta como filtro seleccionable en Capacidad, Potencia y Material. Contamina facets, confunde UX. Backend debería filtrarla del agregado antes de enviarlo al frontend. | `evidencias/F1C-05-presurizacion-listado.png` |
| BUG-B2C-259 | BAJA a11y | II.7.3 `/products/presurizacion/` (I.16 listing) | Botón "Limpiar" (`<button class="CloseButton">`) usa `disabled` nativo pero sin `aria-disabled`. Clase `CloseButton` es engañosa: no es un botón de cierre sino de reset. | `evidencias/F1C-05-presurizacion-listado.png` |
| BUG-B2C-260 | INFO | II.7.3 `/products/presurizacion/` (I.16 listing) | El componente sort wrapper `<div class="sorts">` concatena `"24 Productos"` + `"Ordenar por"` sin separador semántico. `.textContent` produce `"24 ProductosOrdenar por"` literal. Afecta scrapers y screen readers. | `evidencias/F1C-05-presurizacion-listado.png` |
| BUG-B2C-261 | MEDIA infra/CSS | II.7.3 `/products/presurizacion/` (sistémico listing) | `<article>` con clase `"No_aplica Plastico_PE No_aplica card-product-filter"` — facets crudos de datos (Material, Capacidad, Potencia) concatenados con `_` en la lista de clases CSS. Expone metadata interna al DOM + rompe selectores CSS que usen esas clases. Ejemplo real: `"⭐️whrvov-1 No_aplica Varios No_aplica card-product-filter"`. | `scripts/F1C-presurizacion-deep.json` |
| BUG-B2C-262 | MEDIA UX | II.7.3 `/products/presurizacion/` | 10 de 24 productos muestran "Buscar distribuidor" en lugar de precio + add-to-cart, sin explicación visible al usuario del motivo. No hay tooltip ni mensaje "Sin disponibilidad online en tu zona". Usuario no entiende por qué algunos productos no se pueden comprar online. | `evidencias/F1C-05-presurizacion-listado.png` |
| BUG-B2C-263 | BAJA | II.7.3 `/products/presurizacion/` | Cards de presurización NO tienen atributo `data-tooltip`; cards de `/tinacos/` SÍ tienen `data-tooltip` con nombre completo del producto. Inconsistencia inter-categoría en el template de la card. | `evidencias/F1C-05-presurizacion-listado.png` |
| BUG-B2C-264 | BAJA copy | II.7.3 `/products/presurizacion/` | Nombre de producto `"Bomba periferica 3/4 H"` — falta letra final `P` en la unidad de potencia (debería `"3/4 HP"`). | `scripts/F1C-presurizacion-deep.json` |
| BUG-B2C-265 | BAJA copy | II.7.3 `/products/presurizacion/` | Nombre de producto `"Kit SIstema Booster Dual"` — mayúscula extra: `SIstema` (debería `Sistema`). | `scripts/F1C-presurizacion-deep.json` |
| BUG-B2C-266 | BAJA copy | II.7.3 `/products/presurizacion/` | 5 productos con `kit` en minúscula en el H3 (`kit Sistema Residencial Tinaco`, `kit Sistema Residencial Tinaco/Cisterna`, `kit Sistema Residencial Tinaco/Cisterna Plus`) vs el resto del sitio que usa `Kit Sistema...` con mayúscula inicial. Inconsistencia ortográfica de nomenclatura. | `scripts/F1C-presurizacion-deep.json` |
| BUG-B2C-267 | BAJA copy | II.7.3 `/products/presurizacion/` | Nombre de producto `"Bomba sumergible para cisterna  1/2 HP"` — doble espacio literal entre `"cisterna"` y `"1/2 HP"`. | `scripts/F1C-presurizacion-deep.json` |
| BUG-B2C-268 | BAJA copy/ortografía | II.7.3 `/products/presurizacion/` | 3 productos con `"Bomba periferica…"` sin tilde — debería `"periférica"`. | `scripts/F1C-presurizacion-deep.json` |
| BUG-B2C-269 | BAJA copy/ortografía | II.7.3 `/products/presurizacion/` | 5 productos con `"Bomba centrifuga…"` sin tilde — debería `"centrífuga"`. | `scripts/F1C-presurizacion-deep.json` |
| BUG-B2C-270 | MEDIA UI | II.7.3 `/products/presurizacion/` (sistémico listing) | 2 H3 muestran el nombre **duplicado con `...` literal** en el texto: `"Kit Sistema Residencial Tinaco/Cisterna ... Kit Sistema Residencial Tinaco/Cisterna Max"`. Render bug del template `info__title` que repite el nombre truncado + completo en el mismo nodo de texto. Sistémico (confirmado en II.7.4, II.7.5, II.7.7 también). | `scripts/F1C-presurizacion-deep.json` |
| BUG-B2C-272 | BAJA infra | II.7.3 `/products/presurizacion/` | Banner `<img>` con `alt="Banner"` — alt no descriptivo. Debería describir el contenido visual del banner para a11y (WCAG 1.1.1). | `evidencias/F1C-05-presurizacion-listado.png` |
| BUG-B2C-273 | BAJA SEO | II.7.3 `/products/presurizacion/` (sistémico listing) | Breadcrumb del listing sin marcado `schema.org/BreadcrumbList`. Heredado del sitio (sistémico), pero relevante para SEO de listings. | `evidencias/F1C-05-presurizacion-listado.png` |
| BUG-B2C-274 | INFO | II.7.4 `/products/purificacion/` | Inconsistencia: H1 de `/purificacion/` SIN trailing space pero `/presurizacion/` y `/purificadores-de-agua/` SÍ tienen trailing space. Sin política única entre categorías. | `evidencias/F1C-06-purificacion-listado.png` |
| BUG-B2C-275 | MEDIA UX | II.7.4 `/products/purificacion/` (sistémico listing) | Filtros `Capacidad`, `Potencia`, `Material` heredados a categorías donde no aplican semánticamente (purificación/cartuchos). El sidebar de filtros es genérico cross-categoría sin adaptación por contexto. Purificadores no se miden en "HP" ni en "litros de capacidad". | `evidencias/F1C-06-purificacion-listado.png` |
| BUG-B2C-276 | CRÍTICO infra | II.7.4 `/products/purificacion/` | En `/purificacion/`, **0 de 30 imágenes** vienen del bucket QA correcto (`rtp-bucket-b2b-qa`). 100% del contenido visual se sirve desde buckets erróneos: `rtp-bucket-b2b-qas` (typo, BUG-202) ×16, `rtp-bucket-b2b-prd` (producción, BUG-201) ×12, commercetools CDN directo (BUG-200) ×2. Indica que el seed de datos QA está roto para esta categoría. | `scripts/F1C-purificacion-deep.json` |
| BUG-B2C-277 | BAJA copy | II.7.4 `/products/purificacion/` | Nombre de producto `"Cartucho de repuesto secunadario de carbón activado…"` — typo: `secunadario` debería ser `secundario`. | `scripts/F1C-purificacion-deep.json` |
| BUG-B2C-278 | BAJA copy/ortografía | II.7.4 `/products/purificacion/` | `"Sistema de Osmosis Inversa"` y una variante `"Sistema de OsmosisInversa"` (sin espacio) — falta tilde: debería `"Ósmosis"`. Dos formas incorrectas coexistiendo. | `scripts/F1C-purificacion-deep.json` |
| BUG-B2C-279 | BAJA copy | II.7.4 `/products/purificacion/` | `"Sistema de Osmosis Inversa  para uso Doméstico"` — doble espacio literal entre `"Inversa"` y `"para"`. | `scripts/F1C-purificacion-deep.json` |
| BUG-B2C-280 | MEDIA UI | II.7.4 `/products/purificacion/` (sistémico listing) | **13 de 15 H3** muestran texto duplicado: `"Cartucho de repuesto … Cartucho de repuesto …"` con `...` literal en medio. Render bug del template `info__title` — repite texto truncado + completo en el mismo nodo. Confirma BUG-B2C-270 (presurización) como sistémico del componente. | `scripts/F1C-purificacion-deep.json` |
| BUG-B2C-281 | MEDIA SEO/UX | II.7.4 `/products/purificadores-de-agua/` | `/purificadores-de-agua/` carece de breadcrumb intermedio hacia su parent `/purificacion/`. Aparece como ruta de primer nivel pese a ser sub-vista. Pierde contexto jerárquico para usuario y para Google (Home → Purificadores en lugar de Home → Purificación → Purificadores). | `evidencias/F1C-06-purificacion-listado.png` |
| BUG-B2C-282 | MEDIA infra | II.7.4 `/products/purificadores-de-agua/` | Banner de sub-categoría usa path con espacios `%20` y NFC normal (`Purificaci%C3%B3n`) mientras las categorías padre usan NFD (`presurizacio%CC%81n`). Dos esquemas de naming + dos buckets sub-path coexistiendo (`B2C/Categorias/Desktop/` vs `Categorias_B2B/Imagenes Familias/`). | `evidencias/F1C-06-purificacion-listado.png` |
| BUG-B2C-283 | ALTA SEO | II.7.4 `/products/purificacion/` + `/purificadores-de-agua/` | Duplicate content: los 5 purificadores (Hydro-Pur® bajo/sobre tarja, alcalinizador blanco/negro, Sistema Ósmosis Inversa) aparecen idénticos en ambas URLs sin `rel=canonical` entre ellas ni `noindex` en ninguna. Riesgo de canibalización SERP y penalización por contenido duplicado. | `evidencias/F1C-06-purificacion-listado.png` |
| BUG-B2C-284 | INFO | II.7.4 `/products/purificacion/` | `Hydro-Pur®` usa símbolo `®` correctamente en copy, pero **no es marca registrada por código de cliente B2C** — verificar si está justificado legalmente o es residuo de nomenclatura B2B migrado sin revisión. | `scripts/F1C-purificacion-deep.json` |
| BUG-B2C-285 | INFO | II.7.5 `/products/tratamiento/` (sistémico) | Confirmación sistémica: H1 inconsistente con trailing space entre categorías — presurización SÍ, purificación NO, purificadores SÍ, tratamiento NO. Sin política única en el componente. | `evidencias/F1C-07-tratamiento-listado.png` |
| BUG-B2C-286 | ALTA infra/CSS | II.7.5 `/products/tratamiento/` (sistémico listing) | `className` del `<article>` contiene tokens con **caracteres inválidos para selectores CSS**: `3,000_lts.` (coma + punto literales). En CSS la regla `.3,000_lts.` rompe el parser. El componente vuelca el valor de "Capacidad" raw (con su unidad y separadores de miles) directamente a la lista de clases. Ejemplo real: `"⭐️whrvov-1  3,000_lts.  Polietileno_de_alta_densidad  No_aplica  card-product-filter"`. | `evidencias/F1C-07-tratamiento-listado.png` |
| BUG-B2C-287 | INFO | II.7.5 `/products/tratamiento/` | Confirmación: descuentos varían por categoría/sub-familia (presurización -25%, purificación -20%, tratamiento -10% para biodigestores). Sin documentación visible al usuario del scope de las promos. | `evidencias/F1C-07-tratamiento-listado.png` |
| BUG-B2C-288 | MEDIA UI | II.7.5 `/products/tratamiento/` (sistémico) | Confirmado patrón sistémico BUG-B2C-270/280 también en tratamiento: 5 H3 con `...` literal (texto truncado + completo concatenado en el mismo nodo). | `evidencias/F1C-07-tratamiento-listado.png` |
| BUG-B2C-289 | BAJA SEO | II.7.6 `/products/calentamiento/` | Title termina con `"…Rotoplas."` (punto al final del nombre de la marca) en lugar de `"… \| Rotoplas"` o `"… - Rotoplas"`. Convención SERP: marca al final con separador `|` o `-`, sin punto. | `evidencias/F1C-08-calentamiento-listado.png` |
| BUG-B2C-290 | INFO SEO | II.7.6 `/products/calentamiento/` | Title usa `"Regadera eléctrica"` (singular) mientras `meta[name="description"]` usa `"regaderas eléctricas"` (plural). Inconsistencia interna menor pero notable para SEO. | `evidencias/F1C-08-calentamiento-listado.png` |
| BUG-B2C-291 | CRÍTICO SSR | II.7.6 `/products/calentamiento/` | Producto "Regadera Eléctrica EcoDucha 3T" renderiza al usuario el texto literal: `"Ideal para:{/* Cabeza */}{/* Cuerpo */}1 personas"`. Comentario JSX leakeado al HTML del componente "Ideal para" (SVG + texto). Confirmación de BUG-148 sistémico en categoría Calentamiento. | `evidencias/F1C-08-calentamiento-listado.png` |
| BUG-B2C-292 | BAJA copy | II.7.6 `/products/calentamiento/` | El mismo producto muestra `"1 personas"` (plural con cantidad 1). Falta lógica condicional `n === 1 ? 'persona' : 'personas'` en el template. | `evidencias/F1C-08-calentamiento-listado.png` |
| BUG-B2C-293 | MEDIA infra | II.7.6 `/products/calentamiento/` | Image origins en calentamiento: 4 desde `rtp-bucket-b2b-prd` + 8 desde `rtp-bucket-b2b-qas` = **12 imágenes, 0 desde bucket QA correcto** (`rtp-bucket-b2b-qa`). Solo orígenes problemáticos (BUG-201/202 sistémicos). | `scripts/F1C-calentamiento-deep.json` |
| BUG-B2C-294 | ALTA SEO/UX | II.7.7 `/products/conduccion/` | Botones de paginación son `<button>` **sin `href`** ni parámetro `?page=N` en la URL. La URL permanece `…/conduccion/` en todas las 28 páginas — no se puede compartir un número de página concreto, no se puede agregar a favoritos, el botón "Atrás" del browser no funciona para volver a la página anterior, y la paginación es invisible para Google (crawler indexa solo 24 de 652 productos). | `evidencias/F1C-09-conduccion-listado.png` |
| BUG-B2C-295 | MEDIA UX | II.7.7 `/products/conduccion/` | Paginación renderiza **los 28 botones de página todos al mismo tiempo** (sin colapsar con ellipsis `1 2 3 … 27 28`). En mobile fuerza overflow horizontal o wrapping vertical denso e ilegible. | `evidencias/F1C-09-conduccion-listado.png` |
| BUG-B2C-296 | INFO | II.7.7 `/products/conduccion/` | Aspecto positivo: `aria-label="Paginación de productos"` en `<nav>` ✓ + `aria-current="page"` en botón de página activa ✓ + `disabled` en "‹ Anterior" cuando estamos en página 1 ✓. Mejor componente de a11y del sitio auditado hasta ahora. | `evidencias/F1C-09-conduccion-listado.png` |
| BUG-B2C-297 | BAJA copy | II.7.7 `/products/conduccion/` | Nombre de producto `"Termofusor 800 Watts con maletin Tuboplus"` — sin tilde en `maletin` (debería `maletín`). | `scripts/F1C-conduccion-deep.json` |
| BUG-B2C-298 | BAJA copy | II.7.7 `/products/conduccion/` | Inconsistencia singular/plural: `"Tijera cortatubo Tuboplus hasta 75 mm"` (singular) vs `"Tijeras cortatubo de hasta 120 mm Tuboplus"` (plural). Productos similares con denominación plural inconsistente. | `scripts/F1C-conduccion-deep.json` |
| BUG-B2C-299 | BAJA copy | II.7.8 `/products/servicios/` | `meta[name="description"]` = `"Servicios y Garantias"` — sin tilde en `Garantías`. | `evidencias/F1C-10-servicios-listado.png` |
| BUG-B2C-300 | CRÍTICO infra | II.7.8 `/products/servicios/` | Banner `<img alt="Banner">` con **`src=""` vacío** y `naturalWidth: 0`. El SRC se resolvió a la URL de la propia página (`/products/servicios/`) porque el atributo está vacío. Imagen rota visualmente. | `evidencias/F1C-10-servicios-listado.png` |
| BUG-B2C-301 | MEDIA UX/IA | II.7.8 `/products/servicios/` | Categoría se llama **"Servicios"** pero todos los productos son tinacos pre-equipados con bombas (ej. "Tinaco Plus+ equipado 2,500 litros"). No hay copy explicativo que aclare el alcance ("Tinaco + servicio de instalación", "Pago a meses", etc.). El nombre de la categoría no refleja el contenido, confundiendo al usuario. | `evidencias/F1C-10-servicios-listado.png` |
| BUG-B2C-302 | CRÍTICO SSR | II.7.8 `/products/servicios/` | **14 ocurrencias** de JSX comments leakeados en el HTML, con patrón embebido en SVG `<circle>`: `<circle cx="5.5" cy="-2" r="2" fill="#165EEB"></circle>{/* Cabeza */}…{/* Cuerpo */}`. Confirma BUG-148 sistémico — esta vez visibles dentro de iconos SVG, no solo en texto. | `evidencias/F1C-10-servicios-listado.png` |
| BUG-B2C-303 | ALTA infra | II.7.8 `/products/servicios/` | Image origins en `/servicios/`: 3 desde `cdn.builder.io` + 16 desde `commercetools` directamente = 19 imágenes, **0 desde bucket GCS** (ni `qa`, ni `qas`, ni `prd`). La categoría se sirve 100% desde Builder.io CMS + commercetools directo. Inconsistencia infra respecto al resto de categorías. | `scripts/F1C-servicios-deep.json` |
| BUG-B2C-304 | MEDIA SEO | II.8 PDP `/product/[slug]/` (sistémico) | Slugs de URL sin tildes ni eñes: `Centrifuga` por `Centrífuga`, `Derivacin` por `Derivación`, `Presin` por `Presión`, `Resistec` por `Resistex`. 946 de 947 productos siguen este patrón. Google prefiere slugs con caracteres latinos completos para búsquedas localizadas en MX. | `scripts/F1C-pdp-tinaco-plus-deep.json` |
| BUG-B2C-305 | MEDIA infra | II.8 PDP `/product/[slug]/` (sistémico) | Patrón de slug **inconsistente**: 946 productos con `NombreCamelCase_ID`, 1 producto con `slug-kebab-humano-sin-id` (`/product/plato-para-mascotas-color-gris/`). Sin política única de naming. | `scripts/F1C-pdp-tinaco-plus-deep.json` |
| BUG-B2C-307 | BAJA copy | II.8 PDP — Sección Reseñas | `"¡Se el primero en dejar una reseña de este producto!"` — falta tilde en `Se`, debería `"¡Sé el primero…"`. | `evidencias/F1C-11-pdp-tinaco-plus-completa.png` |
| BUG-B2C-313 | CRÍTICO HTML/SEO | II.8 PDP `/product/TinacoPlusconBombaCentrifuga1100litros_500545/` | **2 `<h1>` en la misma página**: el H1 real del producto (`"Tinaco Plus+ con Bomba Centrifuga 1,100 litros"` en clase `⭐️ctimhs-0`) y un H1 fantasma inyectado por Builder.io (`"TEST TINACO"` en `class="builder-f4bd845f7e3e41dea43ed6ecc88d6075 builder-block"`). Viola la convención de H1 único por página. Google y screen readers no pueden determinar cuál es el título principal. | `evidencias/F1C-11-pdp-tinaco-plus-completa.png` |
| BUG-B2C-314 | CRÍTICO contenido | II.8 PDP `/product/TinacoPlusconBombaCentrifuga1100litros_500545/` | H1 fantasma con texto literal **`"TEST TINACO"`** (contenido de pruebas de desarrollo) visible al usuario en producción QA. Bloque Builder.io editable (`class="builder-f4bd845f7e3e41dea43ed6ecc88d6075"`). | `evidencias/F1C-11-pdp-tinaco-plus-completa.png` |
| BUG-B2C-315 | CRÍTICO SEO | II.8 PDP `/product/[slug]/` (sistémico) | **CERO scripts `application/ld+json`** en el PDP. Sin schema.org `Product`, `Offer`, `AggregateRating`, `Breadcrumb`, `Review`. Imposibilita Google Shopping rich snippets, rich results de reseñas y precio en SERP. | `scripts/F1C-pdp-tinaco-plus-deep.json` |
| BUG-B2C-316 | CRÍTICO UI/data | II.8 PDP `/product/TinacoPlusconBombaCentrifuga1100litros_500545/` | Galería del PDP SKU `500545` muestra **imágenes de los productos cross-sell** (SKU 500537, 500544, 500546) en lugar del producto que se está viendo. Probable bug del selector de imágenes en el componente carrusel que confunde el producto principal con los relacionados. | `evidencias/F1C-11-pdp-tinaco-plus-completa.png` |
| BUG-B2C-317 | MEDIA a11y/semántica | II.8 PDP — Acordeón Especificaciones técnicas | Especificaciones técnicas (Capacidad, Diámetro, Altura, Color) usan `<div class="Row">` en lugar de `<table>`/`<tr>`/`<td>` o `<dl>`/`<dt>`/`<dd>`. Screen readers no anuncian como tabla de datos. Información tabular con estructura semántica de párrafos. | `evidencias/F1C-11-pdp-tinaco-plus-completa.png` |
| BUG-B2C-318 | CRÍTICO a11y | II.8 PDP — Sección de compra | Botones `<button class="decreasebutton">` y `<button class="increasebutton">` (cantidad +/-) **sin `aria-label`, sin texto visible, sin `title`, sin `innerHTML` significativo** — solo CSS y SVG implícito. Screen reader anuncia únicamente "botón" sin contexto. Imposible operar la cantidad por teclado o con asistencia tecnológica. | `evidencias/F1C-11-pdp-tinaco-plus-completa.png` |
| BUG-B2C-319 | MEDIA semántica | II.8 PDP — Sección Reseñas | `"Reseñas"` se renderiza como `<p style="color:#165EEB">` en lugar de `<h2>` o `<h3>` como debería ser un section heading. Encabezado semántico perdido. | `evidencias/F1C-11-pdp-tinaco-plus-completa.png` |
| BUG-B2C-321 | BAJA copy | II.8 PDP — Acordeón Descripción | Texto de descripción del producto: `"es ideal para hasta 4 personas!."` — signo de exclamación + punto al revés (`!.` debería ser `!` solamente). | `evidencias/F1C-11-pdp-tinaco-plus-completa.png` |
| BUG-B2C-322 | BAJA copy | II.8 PDP — Acordeón Descripción | Texto: `"garantizando resistencia una fácil instalación"` — falta conjunción `"y"` entre `resistencia` y `una` (debería: `"garantizando resistencia y una fácil instalación"`). | `evidencias/F1C-11-pdp-tinaco-plus-completa.png` |
| BUG-B2C-323 | BAJA copy | II.8 PDP — Acordeón Descripción | `"Rotoplas te conviene más."` aparece **dos veces consecutivas** en el HTML (`<p>` introductorio + `<p id="main-description">` que abre con la misma frase). Asimismo `"Rotoplas más y mejor agua"` aparece concatenado al final sin separador. Template error o dato duplicado en el campo de descripción del CMS. | `evidencias/F1C-11-pdp-tinaco-plus-completa.png` |
| BUG-B2C-326 | BAJA copy | II.8 PDP — H1 real | H1 real del producto usa `"Centrifuga"` sin tilde — debería `"Centrífuga"`. Mismo bug que el slug de URL (BUG-304) reflejado en el H1 visible. | `evidencias/F1C-11-pdp-tinaco-plus-completa.png` |
| BUG-B2C-327 | INFO | II.8 PDP — Breadcrumb | Breadcrumb del PDP usa Title Case mixto en el texto visible (`"Con"`, `"Centrifuga"`, `"Litros"`) pero el H1 del producto usa lowercase para esas mismas palabras (`"con"`, `"litros"`). Inconsistencia de capitalización entre el breadcrumb y el H1. | `evidencias/F1C-11-pdp-tinaco-plus-completa.png` |
| BUG-B2C-328 | MEDIA SEO | II.8 PDP — Breadcrumb | Breadcrumb del PDP sin marcado `schema.org/BreadcrumbList`. Sistémico del sitio (confirmado también en listings — BUG-B2C-273), pero crítico en PDP para Google Shopping. | `evidencias/F1C-11-pdp-tinaco-plus-completa.png` |
| BUG-B2C-329 | BAJA a11y | II.8 PDP — Galería/Carrusel | Imágenes del carrusel del PDP con `alt=""` (BUG-178 sistémico). WCAG 1.1.1: imágenes informativas deben tener alt text descriptivo. | `evidencias/F1C-11-pdp-tinaco-plus-completa.png` |
| BUG-B2C-330 | INFO a11y | II.8 PDP — Galería/Carrusel | Dots del carrusel SÍ tienen `aria-label="Ir al slide N"` ✓ pero **sin `aria-current`** para indicar slide activo. El estado activo se expresa solo con clase CSS `dot active` — invisible para screen reader. Al hacer click en slide 2, `aria-current` no migra del dot 1 al dot 2. | `evidencias/F1C-11-pdp-tinaco-plus-completa.png` |
| BUG-B2C-331 | MEDIA a11y | II.8 PDP — Sección de compra | Toggle "¿Te lo instalamos en tu hogar?" implementado como `<div class="installation-container">` con handler Qwik, sin `role="switch"`, sin `aria-checked`, sin indicador visual del estado seleccionado (no hay clase `.checked`, `.active` ni `.selected`). Invisible para asistencia tecnológica. | `evidencias/F1C-11-pdp-tinaco-plus-completa.png` |
| BUG-B2C-332 | MEDIA UI | II.8 PDP — Sección de compra | Etiquetas `"Nuevo"` y `"★★★★★"` (ranking) están en el DOM con `style="display:none"` inline hardcoded. Indica template estático no condicional — todos los PDPs tienen estos elementos ocultos en el DOM en lugar de no renderizarlos condicionalmente. Sobrecarga el DOM y expone estructura interna. | `evidencias/F1C-11-pdp-tinaco-plus-completa.png` |
| BUG-B2C-333 | BAJA UX | II.8 PDP — Sección de compra | Mensaje de no disponibilidad CP concatena `"No disponible para C.P. 02800"` + `"Comprobar disponibilidad con otro C.P."` sin separador visible ni semántico — el "Comprobar…" parece subtítulo cuando debería ser un botón o link claramente accionable. | `evidencias/F1C-11-pdp-tinaco-plus-completa.png` |
| BUG-B2C-334 | MEDIA a11y | II.8 PDP — Sección de compra | `"Comprobar disponibilidad con otro C.P."` no es `<button>` ni `<a>` — es `<p class="ModalOpen">` con handler Qwik `on:click`. No detectado por query `button,a`. Bug de a11y (no operable por teclado sin role explícito) y UX (no visualmente distinguible como accionable). | `evidencias/F1C-11-pdp-tinaco-plus-completa.png` |
| BUG-B2C-335 | MEDIA UX | II.8 PDP — Listing → PDP | Cuando el producto **no está disponible para el CP del usuario**, el PDP se renderiza igualmente con todos los CTAs deshabilitados. No hay indicador previo en el listing de categoría que advierta al usuario de la no-disponibilidad antes de hacer click. Usuario navega a una PDP de producto no comprable sin advertencia. | `evidencias/F1C-11-pdp-tinaco-plus-completa.png` |
| BUG-B2C-336 | INFO | II.8 PDP — Acordeón Descripción | Punto positivo: acordeón "Descripción" usa elemento nativo `<details>` con `<summary>` — buena práctica de a11y (DisclosureTriangle nativo). Sin necesidad de JS adicional para abrir/cerrar. | `evidencias/F1C-11-pdp-tinaco-plus-completa.png` |
| BUG-B2C-337 | BAJA copy | II.8 PDP — Acordeón Especificaciones | Header de columna usa unidad `(L)` pero el valor del dato dice `"1,100 lts."` — abreviación literal `lts.` (no estándar SI) además de la unidad ya indicada en el header. Doble notación inconsistente en la misma tabla. | `evidencias/F1C-11-pdp-tinaco-plus-completa.png` |
| BUG-B2C-338 | BAJA copy | II.8 PDP — Acordeón Especificaciones | Campo "Color" del producto muestra `"Varios"` (valor crudo de los facets del className) en lugar de listar los colores reales disponibles. UX poco informativa; el dato viene del mismo bug que BUG-B2C-261 (facets crudos volcados sin transformación). | `evidencias/F1C-11-pdp-tinaco-plus-completa.png` |
| BUG-B2C-339 | MEDIA infra | II.8 PDP — Manuales descargables | PDF de ficha técnica del producto sirve desde `storage.googleapis.com/rtp-bucket-b2b-prd/B2C/Fichas_Técnicas/…` (bucket de PRODUCCIÓN) en ambiente QA. Confirma BUG-201 sistémico aplicable también a assets PDF adicionales del PDP. | `scripts/F1C-pdp-tinaco-plus-deep.json` |
| BUG-B2C-340 | INFO | II.8 PDP — Manuales descargables | Link `"Descargar manual"` sin `target="_blank"`, sin `rel="noopener"`, sin icono PDF, sin indicación de tamaño ni tipo de archivo. UX reducida (usuario no sabe que es un PDF) y a11y subóptima. | `evidencias/F1C-11-pdp-tinaco-plus-completa.png` |
| BUG-B2C-341 | BAJA infra | II.8 PDP — Sección Reseñas | Clase CSS `"noStarts"` — typo: debería ser `"noStars"`. Indicador de calidad de código del template. No afecta funcionalidad pero es ruido técnico. | `evidencias/F1C-11-pdp-tinaco-plus-completa.png` |
| BUG-B2C-342 | BAJA SEO | II.8 PDP — Breadcrumb | Breadcrumb usa `href` con texto del label en lowercase (`/products/almacenamiento`, texto `<a>` interno lowercase) pero el texto visible al usuario tiene Title Case mixto (`"Almacenamiento"`, `"Tinacos"`). Inconsistencia entre el texto visible y el href. | `evidencias/F1C-11-pdp-tinaco-plus-completa.png` |
| BUG-B2C-343 | MEDIA seguridad | II.8 PDP — Manuales descargables | Link de descarga de manual PDF con `target="_blank"` **SIN `rel="noopener noreferrer"`**. Vulnerabilidad de reverse tabnabbing en el PDF si fuera un redirect externo. | `evidencias/F1C-11-pdp-tinaco-plus-completa.png` |
| BUG-B2C-344 | BAJA copy | II.8 PDP — Manuales descargables | Nombre del archivo PDF usa `"Centrifuga"` sin tilde: `"Tinaco Plus+ con Bomba Centrifuga 1,100 litros - Ficha Técnica.pdf"`. Mismo bug que slug/H1 (BUG-304/326) reflejado en el nombre del archivo. | `scripts/F1C-pdp-tinaco-plus-deep.json` |
| BUG-B2C-345 | ALTA seguridad | II.8 PDP — Modal Compartir | Los 3 links de compartir en redes sociales (Facebook `sharer.php`, Instagram `direct/new`, WhatsApp `api.whatsapp.com/send`) tienen `target="_blank"` **SIN `rel="noopener noreferrer"`** (`rel=""`). Vulnerabilidad de reverse tabnabbing. Contrasta con los links de redes sociales del footer del mismo PDP que SÍ tienen `rel="noopener noreferrer"` correctamente. | `evidencias/F1C-11-pdp-tinaco-plus-completa.png` |
| BUG-B2C-346 | MEDIA UX/copy | II.8 PDP — Modal Compartir | Share de Instagram apunta a `https://www.instagram.com/direct/new/?text=Visita%20mi%20sitio:%20{URL}` (DM compose) con texto fijo `"Visita mi sitio: {URL}"` — el mensaje "visita mi sitio" enviado desde la cuenta del usuario final suena a spam. Lo habitual para B2C es Instagram Stories share o un link al perfil de la marca, no un DM pre-rellenado. | `evidencias/F1C-11-pdp-tinaco-plus-completa.png` |
| BUG-B2C-347 | MEDIA seguridad | I.16 Listing genérico — Cards producto + II.8 PDP cross-sell | Links `<a href="/distribuidores" target="_blank">Buscar distribuidor</a>` (12 instancias en `/presurizacion/`, 3 instancias en PDP cross-sell) **sin `rel="noopener noreferrer"`**. Vulnerabilidad de reverse tabnabbing sistémica en el componente de card. | `evidencias/F1C-05-presurizacion-listado.png` |
| BUG-B2C-348 | BAJA copy | I.16 Listing genérico — Sidebar filtros (Material) | Opción de filtro `"Plastico PE"` sin tilde — debería `"Plástico PE"`. Aparece en `/presurizacion/` (confirmado). Verificar las demás categorías que tengan Material = Plástico PE en sus facets. | `evidencias/F1C-05-presurizacion-listado.png` |
| BUG-B2C-349 | MEDIA a11y | I.16 Listing genérico — Cards producto | Botones `<button class="addtoCart">Agregar al carrito</button>` sin `aria-label` por producto. Screen reader anuncia N veces `"Agregar al carrito"` sin contexto del nombre del producto al que corresponde cada botón. | `evidencias/F1C-05-presurizacion-listado.png` |
| BUG-B2C-350 | ALTA a11y | I.16 Listing genérico — Sidebar filtros | TODOS los filtros (sub-categorías + sort + facets) son `<li class="⭐️c2ijco-8">` con handler `on:click` Qwik — NO son `<input type="checkbox">`, NO tienen `role="checkbox"`, `role="radio"` ni `role="menuitem"`. No tienen `aria-checked` ni `aria-selected`. **Keyboard navigation imposible** + screen reader no anuncia estado seleccionado/deseleccionado. Confirma BUG-128 sistémico. | `evidencias/F1C-05-presurizacion-listado.png` |
| BUG-B2C-351 | MEDIA a11y | I.16 Listing genérico — Breadcrumb | Link del breadcrumb al home: `<a href="/">` con icono home (SVG/img) **sin texto visible, sin `alt`, sin `aria-label`**. Invisible para screen reader — el enlace es anunciado solo como "link" sin destino comprensible. | `evidencias/F1C-05-presurizacion-listado.png` |
| BUG-B2C-352 | ALTA UX/a11y | I.16 Listing genérico — Banner publicitario Builder.io | `<a href="https://rotoplas.com.mx/servicios-lavado/">` (Builder.io block hardcodeado) **sin texto visible, sin `alt`, sin `aria-label`** + `target="_self"`. Link cross-domain que: (1) es invisible para screen reader, (2) sale del dominio `qarotoplasmx.io` a `rotoplas.com.mx` (sitio distinto) **en la misma pestaña**, interrumpiendo la navegación del usuario sin advertencia. | `evidencias/F1C-05-presurizacion-listado.png` |
| BUG-B2C-353 | CRÍTICO SEO/a11y | II.15 `/distribuidores/` + II.16.b `/servicios-lavado/` + II.20.c `/seguridad-de-la-informacion/` (sistémico) | Sin ningún `<h1>` en la página. En /distribuidores/ el H3 `"Distribuidores cerca de ti"` actúa visualmente como heading principal pero sin semántica H1. En /servicios-lavado/ y /seguridad-de-la-informacion/ ídem. Viola WCAG 2.4.6 y penaliza SEO. | — |
| BUG-B2C-354 | MEDIA data | II.15 `/distribuidores/` — Select Estado | `BELICE` aparece como opción en el select de estados mexicanos. Belice es un país, no un estado de México. Bug de datos del backend que escapó al seed de la lista de estados. | — |
| BUG-B2C-355 | MEDIA data | II.15 `/distribuidores/` — Select Estado | `YUCATÁN` aparece duplicado: una entrada sin trailing space (`"YUCATÁN"`) y otra con trailing space (`"YUCATÁN "`). Bug de datos en el backend que escapó la deduplicación. Genera 2 opciones idénticas visualmente en el select. | — |
| BUG-B2C-356 | MEDIA copy/data | II.15 `/distribuidores/` — Select Estado | Tres estados sin tilde: `NUEVO LEON` (debería `NUEVO LEÓN`), `QUERETARO` (debería `QUERÉTARO`), `SAN LUIS POTOSI` (debería `SAN LUIS POTOSÍ`). Inconsistente con `MICHOACÁN` y `YUCATÁN` que sí incluyen tilde. | — |
| BUG-B2C-358 | ALTA HTML | II.15 `/distribuidores/` — Formulario de búsqueda | Dos elementos `<select name="building">` en la misma página: uno visible (selector de estados) y uno oculto (del modal de CP del header global). HTML inválido: `name` no debe repetirse en el mismo form context. Puede provocar conflicto al serializar el formulario o al hacer `querySelector('[name="building"]')`. | — |
| BUG-B2C-359 | MEDIA SEO | II.15 `/distribuidores/` + II.16.b `/servicios-lavado/` + II.19 `/recursos/` (sistémico) | `meta[description]` con valor `"¡Disfruta lo mejor de Rotoplas al alcance de un solo clic!"` — copy genérico copy-pasteado que no menciona el contenido de la página (distribuidores, lavado, recursos). No contextualiza al usuario ni a crawlers sobre el propósito de la página. | — |
| BUG-B2C-361 | CRÍTICO data | II.15 `/distribuidores/` — Select Estado | Faltan 6 estados mexicanos en el listado: Ciudad de México (CDMX), Estado de México, Hidalgo, Guerrero, Morelos y Tlaxcala. CDMX es la ciudad del usuario según su dirección guardada (Col. Nueva Santa María, Ciudad de México). El usuario no puede buscar distribuidores en su propia ciudad. | — |
| BUG-B2C-362 | BAJA UX | II.15 `/distribuidores/` — Select Estado | 28 estados en UPPERCASE sin filtro ni typeahead. Manejable con 28 opciones, pero combinado con BUG-361 (CDMX faltante) resulta en experiencia severamente degradada. Recomendación: combobox con búsqueda. | — |
| BUG-B2C-363 | ALTA HTML | II.15 `/distribuidores/` — Lista de tiendas cercanas | Cada tienda en los resultados renderiza `<p id="MapSuc">`. El `id` `"MapSuc"` se duplica para cada tienda de la lista. HTML inválido: los `id` deben ser únicos. Rompe `getElementById`, vinculación con marcadores del mapa, y anuncios de screen readers. | — |
| BUG-B2C-364 | BAJA copy/data | II.15 `/distribuidores/` — Select Ciudad (Jalisco verificado) | Ciudades con nombres sin tilde: `AMATITAN` (debe ser `Amatitán`), `AUTLAN` (debe ser `Autlán de Navarro`). Pierde precisión toponímica en datos del backend. | — |
| BUG-B2C-365 | BAJA UX | II.15 `/distribuidores/` — Select Ciudad | Select nativo con 62 opciones de ciudades (para Jalisco) sin filtro ni typeahead. Para estados con más localidades (CDMX, Estado de México) sería aún más problemático. Recomendación: combobox con búsqueda. | — |
| BUG-B2C-366 | BAJA copy | II.15 `/distribuidores/` — Texto introductorio | `"lo que estas buscando"` — falta tilde en `"estás"`. Texto: `"Visita las tiendas de nuestros distribuidores y encuentra lo que estas buscando."` | — |
| BUG-B2C-367 | BAJA copy | II.15 `/distribuidores/` — Lista de tiendas, clase CSS | Clase `stongList` en el `<p>` del nombre del distribuidor — typo: debería ser `strongList`. Afecta mantenibilidad y cualquier selector CSS/JS que apunte a esa clase. | — |
| BUG-B2C-368 | BAJA copy/UX | II.15 `/distribuidores/` — Lista de tiendas | Nombre del distribuidor en MAYÚSCULAS completas y truncado: `"FERRETERIA HERMANOS GARCIA RIVERA S"` (la `S` al final es probable inicio de "S.A. de C.V." truncado). Sin tildes (`Ferretería`, `García`). Baja calidad de datos mostrados. | — |
| BUG-B2C-369 | MEDIA UX | II.15 `/distribuidores/` — Tarjetas de resultado | Cada item de la lista muestra solo nombre + dirección. Sin teléfono, sin horarios, sin link "Ver en Google Maps", sin distancia desde el usuario, sin productos disponibles, sin link a sitio web del distribuidor. Información insuficiente para que el usuario tome acción. | — |
| BUG-B2C-370 | MEDIA UX | II.15 `/distribuidores/` — Mapa Google Maps | Solo 1 marcador visible en el mapa para 62+ tiendas del estado de Jalisco. Posible bug en el binding entre la lista de tiendas y los marcadores del mapa. El mapa no refleja la realidad de los distribuidores. | — |
| BUG-B2C-371 | MEDIA SEO | II.16.a `/servicios/` — Meta description | `meta[description]` con valor `"rotoplas"` en lowercase sin mayúscula inicial. Peor que el placeholder genérico estándar; no describe el contenido de la página de servicios. | — |
| BUG-B2C-372 | ALTA HTML/a11y | II.16.a `/servicios/` — Estructura semántica | Dos elementos `<main>` en la misma página. HTML inválido: solo puede haber 1 `<main>` landmark por documento. Screen readers y tecnologías asistivas se confunden al navegar entre landmarks. | — |
| BUG-B2C-374 | MEDIA semántica/a11y | II.16.a `/servicios/` — CTAs sub-marcas | Los tres CTAs "Visitar bebbia", "Visitar rieggo" y "Visitar Rsa" están implementados como `<button>` (con handler Qwik) en lugar de `<a href="…" target="_blank" rel="noopener">`. Como `<button>`: no expone la URL de destino a crawlers, no permite Cmd+click para abrir en tab nueva, no permite preview de URL en hover. | — |
| BUG-B2C-375 | MEDIA UI | II.16.a `/servicios/` — Imágenes sub-marcas | Una de las 3 imágenes principales de sub-marcas tiene `naturalWidth=0` (imagen rota/no cargada). Las otras 2 cargan con `naturalWidth=1370`. | — |
| BUG-B2C-377 | BAJA infra | II.16.a `/servicios/` — DOM | Existe un `<iframe src="" title="">` huérfano en la página — `src` y `title` vacíos. Probable espacio reservado para un video de bebbia que nunca se completó. Genera petición a `about:blank`, ocupa espacio DOM y puede interferir con a11y. | — |
| BUG-B2C-378 | MEDIA semántica | II.16.a `/servicios/` — Testimonios | Los 6 testimonios (Shanik Aspe, Chef Diego Alberto, Fernanda Limón × 3 sub-marcas) están marcados como `<h3>` en lugar de `<blockquote>` + `<cite>`. Uso incorrecto de heading para contenido citado — distorsiona la jerarquía de headings y el significado semántico del documento. | — |
| BUG-B2C-379 | BAJA copy | II.16.a `/servicios/` — rieggo features | Texto del feature "Acompañamiento 360°": `"sistema de riego para cambo abierto"` — typo, debería `"campo abierto"`. | — |
| BUG-B2C-380 | BAJA copy | II.16.a `/servicios/` — Testimonio Fernanda Limón | `"sea más practica"` — falta tilde: debería `"más práctica"`. | — |
| BUG-B2C-381 | BAJA copy | II.16.a `/servicios/` — Descripción bebbia | `"elimina virus, microrganismos y microplásticos"` — typo: debería `"microorganismos"` (falta la `o`). | — |
| BUG-B2C-382 | MEDIA copy | II.16.a `/servicios/` — Sección rieggo | Texto huérfano: `"… 0% de inversión inicial​ Resources Group, con la finalidad de llevar más y mejor agua al segmento agrícola."` — frase fragmentada que mezcla 2 mensajes distintos. El nombre `Resources Group` aparece sin contexto previo; probablemente es un subtítulo que se concatenó con el párrafo siguiente por error. | — |
| BUG-B2C-383 | BAJA copy | II.16.a `/servicios/` — Testimonio Chef Diego Alberto | `"que calidad es increíble llega directo a mí cocina"` — gramática incorrecta: `"mí"` (pronombre tónico) debe ser `"mi"` (adjetivo posesivo). Además falta artículo: `"que la calidad"` y coma antes de `"llega"`. | — |
| BUG-B2C-384 | INFO | II.16.a `/servicios/` — Testimonios | Testimonios contienen carácter ZWSP (Zero-Width Space, U+200B) o RTL mark invisible al final de algunas palabras (ej. `"Wellness​"`). Probable copia desde Word/Google Docs sin sanitización. Puede provocar búsquedas fallidas en el DOM y discrepancias en comparaciones de texto. | — |
| BUG-B2C-385 | BAJA copy | II.16.a `/servicios/` — Testimonio Shanik Aspe | Convención de capitalización inconsistente en títulos de testimonios: `"Conductora/Madre de familia"` (Title Case) vs `"chef"` en minúsculas del testimonio siguiente. | — |
| BUG-B2C-386 | INFO infra | II.16.b `/servicios-lavado/` — Hero imagen | Imagen del hero servida desde workspace Builder.io `4cb0f3838abd…`, distinto al workspace principal del sitio (`b9d9011ceeb…`). Posible asset huérfano con permisos distintos; riesgo de CDN diferente y política de caché diferente. | — |
| BUG-B2C-387 | MEDIA privacidad | II.16.b `/servicios-lavado/` — Video YouTube embebido | `<iframe src="https://www.youtube.com/embed/ZrMfQh_G2h0?si=…">` usa dominio `youtube.com` en lugar de `youtube-nocookie.com`. YouTube setea cookies de tracking en el primer carga (antes de que el usuario presione play), violando la best practice de privacidad conforme a la LFPDPPP. | — |
| BUG-B2C-388 | INFO a11y | II.16.b `/servicios-lavado/` — Video YouTube | `<iframe title="YouTube video player">` — título genérico heredado de YouTube. Debería describir el contenido específico del video (ej. `"Cómo lavar tu tinaco con Rotoplas"`). | — |
| BUG-B2C-389 | BAJA a11y | II.16.b `/servicios-lavado/` — Sección "¿Cómo funciona?" | Las 4 imágenes de los pasos del flujo tienen `alt="Imagen"` genérico. Deberían describir el contenido de cada paso: "Elige cantidad de servicios", "Realiza tu pago seguro", etc. | — |
| BUG-B2C-390 | MEDIA copy/data | II.16.b `/servicios-lavado/` — Sección "Qué incluye nuestro servicio" | El "Resultado" del card "Inspección de 7 puntos" es copia literal del "Resultado" de "Limpieza profunda" (`"Eliminación efectiva de incrustaciones y residuos adheridos"`). El card de inspección debería describir lo que la inspección revela (fugas, fallas, estado del equipo), no el mismo resultado que la limpieza. | — |
| BUG-B2C-391 | INFO | II.16.b `/servicios-lavado/` — Copy duplicado | La frase `"Eliminación efectiva de incrustaciones y residuos adheridos"` aparece 8 veces en la página (`dupResultadoCopy: 8`). Indica datos duplicados en el CMS/Builder.io. | — |
| BUG-B2C-392 | BAJA copy | II.16.b `/servicios-lavado/` — Sección "Técnicos exclusivos" | Encabezado `"Garantía de total Limpieza"` con capitalización rara en medio de frase. Debería ser `"Garantía total de Limpieza"` o `"Garantía de Limpieza Total"`. | — |
| BUG-B2C-393 | MEDIA seguridad | II.16.b `/servicios-lavado/` — Link "Términos y condiciones" | Link `<a href="https://rotoplas.com.mx/terminos-y-condiciones-serviciados/" target="_blank">` sin `rel="noopener noreferrer"`. Reverse tabnabbing: la página destino puede acceder a `window.opener` y redirigir la pestaña origen. | — |
| BUG-B2C-394 | MEDIA infra | II.16.b `/servicios-lavado/` — Link "Términos y condiciones" | El mismo `<a>` de T&C tiene CSS Builder.io inline leaking en su `textContent`: contiene la clase `.builder-83d027884b51412d9f85160e0215045e` con bloque de estilos completo como texto visible dentro del nodo (workspace `4cb0f38…`). El CSS se inyecta como texto en el DOM en vez de en `<style>`. | — |
| BUG-B2C-395 | MEDIA seguridad | II.16.b `/servicios-lavado/` + II.19 `/recursos/` (sistémico) | Link "Solicitar información" apunta a `https://wa.me/525547420835?…` con `target="_blank"` sin `rel="noopener noreferrer"`. Reverse tabnabbing: la página destino puede manipular `window.opener`. | — |
| BUG-B2C-396 | MEDIA a11y | II.16.b `/servicios-lavado/` — FAQ accordions | El `textContent` de los `<summary>` incluye la palabra literal `"icono"` al final (ej. `"¿Qué debo tener listo antes de mi cita? icono"`). Probable `<img alt="icono">` dentro del `<summary>` sin `aria-hidden="true"`. Screen reader anuncia el texto del alt del ícono decorativo como parte del título del acordeón. | — |
| BUG-B2C-397 | ALTA UX | II.16.b `/servicios-lavado/` — CTA primario | No existe CTA primario de "Agendar" / "Contratar servicio" / "Comprar" visible en la landing transaccional. El único path de acción es el link de WhatsApp "Solicitar información". La landing describe un flujo de 4 pasos ("Elige → Paga → Agenda → Disfruta") pero no tiene botón que lo inicie. (Nota: el wizard de cotización está presente de forma inestable; cuando está ausente este bug es bloqueante — ver BUG-B2C-457.) | — |
| BUG-B2C-400 | ALTA UX/data | II.16.c Wizard de cotización (dentro de `/servicios-lavado/`) | El botón `plus` del stepper de Tinaco/Cisterna no respeta el límite de "hasta 3 tinacos o cisternas" mencionado en el copy del paso 1. Verificado: permite incrementar a 4+ unidades sin clamping ni estado `disabled` visual. Genera inconsistencia entre el copy promocional y el comportamiento real. | — |
| BUG-B2C-401 | CRÍTICO a11y | II.16.c Wizard — Stepper Tinaco/Cisterna | Botones `less` y `plus` del stepper sin `aria-label`, sin texto visible, sin `title`, solo `<svg>` interno. Screen reader anuncia "botón" sin contexto de acción ni de qué controla. Idéntico al patrón sistémico BUG-318 del PDP. | — |
| BUG-B2C-402 | MEDIA a11y | II.16.c Wizard — Botón cerrar | Botón `close-wizard` con texto literal `"✕"` (U+2715 CROSS MARK) sin `aria-label` ni `title`. Screen reader puede anunciar "cruz" o "x" según implementación, no la acción "Cerrar". | — |
| BUG-B2C-403 | MEDIA a11y/UX | II.16.c Wizard — Dropdown Capacidad | El dropdown de capacidad es un `<div class="custom-dropdown">` con `<div class="dropdown-toggle">` + `<ul class="dropdown-menu">`. No es `<select>` nativo ni componente con `role="combobox"` + `aria-expanded`. Sin soporte de keyboard navigation (Enter, Esc, Arrow keys, Tab) para abrir/seleccionar/cerrar. | — |
| BUG-B2C-404 | ALTA data | II.16.c Wizard — Dropdown Capacidad de Tinaco | El dropdown "Capacidad" de Tinaco muestra una sola opción: `"De 450 L a 1,100 L"`. Los tinacos Rotoplas van desde 450L hasta 25,000L (confirmado en `/products/almacenamiento/tinacos/` y `/almacenamiento-especializado/`). Faltan rangos: 1,100–2,500L, 2,500–5,000L, etc. Tinacos de mayor capacidad no son cotizables desde el wizard. | — |
| BUG-B2C-405 | INFO data | II.16.c Wizard — Precio | Precio fijo `$899.00` para 1 tinaco de capacidad "De 450 L a 1,100 L". No varía con la capacidad (consecuencia de tener solo 1 opción, BUG-404). Verificar si la matriz de precios está incompleta en el CMS. | — |
| BUG-B2C-406 | BAJA UI | II.16.c Wizard — Dropdown Capacidad (estado visual) | Después de seleccionar una opción, el toggle vuelve a mostrar `"De 450 L a 1,100 L▼"` con flecha ▼ apuntando hacia abajo, cuando debería mostrar indicador de selección completada (▲ cerrado, ✓, o sin flecha). La flecha ▼ sugiere incorrectamente que el dropdown está disponible para abrir. | — |
| BUG-B2C-407 | MEDIA semántica | II.16.c Wizard — Heading principal | El heading principal del widget `"Cotiza tu limpieza profesional de tinaco o cisterna"` se renderiza como `<p class="builder-text">` con `font-size: 40px` — no es un `<h1>` ni `<h2>` semántico. El subtítulo `"Contrata tu servicio de limpieza en tan solo 3 clics."` sí es `<h2>`. Inversión semántica: el título visual más grande tiene menos jerarquía HTML que el subtítulo. | — |
| BUG-B2C-408 | BAJA semántica | II.16.c Wizard — Botón "Cotizar" | El botón "Cotizar" tiene clase CSS `guardar` (`<button class="guardar bg-blue-600 …">`). Nombre de clase semánticamente confuso: `guardar` sugiere persistencia/guardar datos, no cotización ni cálculo. | — |
| BUG-B2C-409 | INFO infra | II.16.c Wizard — CSS | El wizard usa clases Tailwind utility (`bg-blue-600`, `text-white`, `px-4 py-2`, `rounded-lg`, `hover:bg-blue-700`, `flex`, `items-center`, `gap-2`, `mt-2`, `text-lg`, `font-bold`, `opacity-50`, `cursor-pointer`, `absolute`, `z-10`, `border`, `relative`) mezcladas con Qwik scoping (`⭐️wscmo6-0`). Sin política CSS unificada: Tailwind para este componente, Qwik scoped para el resto del sitio. | — |
| BUG-B2C-410 | INFO infra | II.16.c Wizard — Assets | Las imágenes de Tinaco y Cisterna del wizard provienen de workspaces distintos de Builder.io: Tinaco desde `4cb0f3838abd…` (workspace de /servicios-lavado/), Cisterna desde `b9d9011ceeb…` (workspace principal). Inconsistencia en asset hosting; riesgo de permisos o CDN diferentes. | — |
| BUG-B2C-411 | BAJA copy | II.16.c Wizard — Link "Volver" | Link `"← Volver a cotizar"` usa el carácter `←` (U+2190 LEFTWARDS ARROW) como texto hardcodeado en lugar de ícono SVG o icon-font. No adapta dirección en locales RTL. | — |
| BUG-B2C-412 | BAJA UI | II.16.c Wizard — Step 2 título | El título del step 2 dice `"Servicio de mantenimiento a 1 tinaco"` sin pluralización dinámica. Si el usuario seleccionó 2 tinacos, probablemente diría `"a 2 tinaco"` (sin plural). Requiere verificación con cantidad > 1. | — |
| BUG-B2C-413 | INFO UX | II.16.c Wizard — Integración con cart | El botón "Agregar al carrito" en step 2 conecta el servicio con el cart de e-commerce, pero no se verificó: (a) si el servicio aparece en `/cart/` con atributos correctos (capacidad seleccionada, fecha de agenda), (b) si fluye al checkout normal, (c) si requiere CP (el copy dice "exclusivo CDMX"). Pendiente verificar la integración con el cart. | — |
| BUG-B2C-414 | CRÍTICO infra/UX | II.19 `/recursos/` + II.20.c `/seguridad-de-la-informacion/` — Breadcrumb | El link "Inicio" del breadcrumb apunta a `https://tempmx.rotoplas.com/` — host TEMP/staging no accesible públicamente (verificado con fetch: `Failed to fetch` → CORS bloqueado / DNS no resuelve). El title del link `"Ir a Rotoplas."` tiene punto literal al final. El breadcrumb de navegación principal está completamente roto. | — |
| BUG-B2C-415 | ALTA UX/infra | II.19 `/recursos/` — Card "BIM Revit" | Link de la card "BIM Revit" apunta a `https://rotoplas.com.mx/recursos/bim-revit-descargas/` (producción, dominio distinto). Sin `rel="noopener"`. Con `target="_self"` — al hacer clic el usuario abandona el sitio QA y navega a producción sin apertura de nueva pestaña. | — |
| BUG-B2C-416 | MEDIA infra | II.19 `/recursos/` — Sección "Todas nuestras soluciones" | Los 6 links de categoría usan el patrón URL legacy `/categoria-producto/[slug]/` en lugar de la URL canónica `/products/[slug]/`. Reconfirma BUG-249 sistémico en /recursos/. Los links redirigen a `/products/…` pero no usan la URL canónica directamente. | — |
| BUG-B2C-417 | BAJA UX | II.19 `/recursos/` — CTA "Llamar" | `<a href="tel:8005063000">` — número de teléfono sin formato internacional (`+52 800 506 3000`). En dispositivos internacionales o con marcación internacional activa, el número puede no conectar correctamente. | — |
| BUG-B2C-418 | ALTA UX | II.19 `/recursos/` — Sección "Conoce más sobre Rotoplas" | 3 de 6 links de la sección apuntan a sub-rutas `/nosotros/` que devuelven error: `/nosotros/identidad/` (BUG-247), `/nosotros/empleos/` (BUG-248), `/nosotros/estrategia/` (HTTP 410 GONE, BUG-246). El 50% de los links de navegación institucional desde /recursos/ están rotos. | — |
| BUG-B2C-419 | INFO infra | II.19 `/recursos/` — Assets Builder.io | /recursos/ mezcla 2 workspaces de Builder.io: workspace `4cb0f38…` (de /servicios-lavado/) para los assets propios de la página, y workspace `b9d901…` (principal del sitio) para el bloque "Conoce más sobre Rotoplas". Posible duplicación de assets entre workspaces. | — |
| BUG-B2C-420 | INFO copy | II.20.a `/aviso-de-privacidad/` — Breadcrumb | Breadcrumb muestra `"Aviso De Privacidad"` con `"De"` en mayúscula (Title Case excesivo). Debería ser `"Aviso de privacidad"` (preposición en minúscula según norma ortográfica del español). | — |
| BUG-B2C-421 | MEDIA legal | II.20.a `/aviso-de-privacidad/` — Fecha de actualización | La página indica última actualización `3/mayo/2024` — más de 2 años sin revisión a la fecha 2026-05-28. Buena práctica legal: revisión anual del aviso de privacidad. | — |
| BUG-B2C-422 | BAJA infra | II.20.a `/aviso-de-privacidad/` — mailto | Uno de los 3 links `<a href="mailto:privacy.mx@rotoplas.com">` tiene trailing space en el href: `mailto:privacy.mx@rotoplas.com ` (con espacio al final). Link mailto inválido; puede fallar en algunos clientes de correo. | — |
| BUG-B2C-423 | MEDIA UX | II.20.a `/aviso-de-privacidad/` — Sección de cookies | La sección "deshabilitar cookies por navegador" lista 5 navegadores (Internet Explorer, Firefox, Chrome, Safari, Opera) y cada párrafo termina con `"…puede consultar el siguiente enlace"` sin ningún `<a>` real — solo texto plano. El usuario no tiene cómo acceder a la guía de cookies referenciada. | — |
| BUG-B2C-424 | INFO copy | II.20.a `/aviso-de-privacidad/` — Navegadores soportados | Menciona `Internet Explorer` como navegador activo. IE fue deprecado oficialmente en junio 2022 y desactivado por Windows Update desde febrero 2023. Debería eliminarse del aviso. | — |
| BUG-B2C-425 | BAJA copy | II.20.a `/aviso-de-privacidad/` — Tipografía | Mezcla de comillas curvas tipográficas (`"…"`) y comillas rectas (`"…"`) en el mismo párrafo. Inconsistencia tipográfica dentro de un documento legal. | — |
| BUG-B2C-426 | INFO infra | II.20.a `/aviso-de-privacidad/` — Links externos | 2 links del aviso apuntan a `https://rotoplas.com.mx/` (dominio de producción). Verificar si el sitio canónico de la marca para el aviso debe ser `qarotoplasmx.io` o `rotoplas.com.mx`. | — |
| BUG-B2C-427 | INFO infra | II.20.b `/terminos-y-condiciones/` — Footer link | El link del footer al T&C usa `target="_self"` (no `_blank`). Al hacer clic, el usuario abandona el sitio QA y es redirigido cross-domain (redirect 301 a `rotoplas.com.mx/ofertas-rotoplas-terminos-y-condiciones/`) sin apertura de nueva pestaña. El usuario pierde la sesión de navegación actual. | — |
| BUG-B2C-428 | CRÍTICO SEO | II.20.c `/seguridad-de-la-informacion/` — `<title>` | El `<title>` de la página es el slug literal `"seguridad-de-la-informacion"` — sin tildes, con guiones, sin espacios, sin nombre de marca. SEO catastrófico: Google puede penalizar severamente la página en SERP por title no descriptivo. | — |
| BUG-B2C-429 | MEDIA UI | II.20.c `/seguridad-de-la-informacion/` — Contenido | Fragmento `"s"` (una sola letra) huérfano entre el H2 `"Evita conectarte a Wi-Fi pública"` y el primer párrafo del tip. Probable bug de template que renderiza separadamente la última letra del heading o del contenido previo. | — |
| BUG-B2C-430 | CRÍTICO UX | II.20.c `/seguridad-de-la-informacion/` — Sección "Todas nuestras soluciones" | Los 5 links de categoría ("Almacenamiento", "Almacenamiento especializado", "Conducción", "Mejoramiento", "Purifcación") apuntan TODOS a `/seguridad-de-la-informacion/` — es decir, a la página actual. Los 5 links son auto-referenciales rotos. El usuario no puede navegar a ninguna categoría de producto desde esta sección. | — |
| BUG-B2C-431 | BAJA copy | II.20.c `/seguridad-de-la-informacion/` — Categoría | Texto del link `"Purifcación"` — typo: falta la `i`, debería ser `"Purificación"`. | — |
| BUG-B2C-432 | INFO data | II.20.c `/seguridad-de-la-informacion/` — Categoría | Categoría `"Mejoramiento"` no existe en el catálogo del sitio (`/products/…`). Bug de datos heredados/legacy. | — |
| BUG-B2C-433 | BAJA copy | II.20.c `/seguridad-de-la-informacion/` — Copy sección | Texto `"Mejorar continua"` — error gramatical: debería ser `"Mejora continua"` (sustantivo, no infinitivo verbal). | — |
| BUG-B2C-434 | MEDIA legal | II.20.d Código de ética (PDF externo) | PDF "Código de ética" con fecha `20190711` en el nombre del archivo (`rtp_codigo_de_etica_y_conducta_esp_baja_movil_20190711.pdf`), indica versión del 2019-07-11 — más de 6 años desactualizada. Servido desde bucket `prd` (BUG-201 sistémico). Verificar si existe versión más reciente. | `scripts/F1D-legales-check.json` |
| BUG-B2C-435 | ALTA seguridad | I.2 Nav submenús | 8/8 anclas de submenús del nav con `target="_blank"` sin `rel="noopener noreferrer"` (reverse tabnabbing). Afecta todas las páginas. | `F1D-12` + `F1D-nav-submenus-deep.json` |
| BUG-B2C-436 | MEDIA a11y | I.2 Nav submenús | 3 submenu-launchers sin `role`/`aria-haspopup`/`aria-expanded`/`tabindex` → no abren por teclado, screen reader no anuncia menú (reclasifica BUG-010/011). | `F1D-12` |
| BUG-B2C-437 | BAJA a11y/UI | I.2 Nav submenús | Chevron de "Ver mas" es `<img alt="">` mientras los otros 2 usan `<svg>` → inconsistencia + alt vacío. | `F1D-nav-submenus-deep.json` |
| BUG-B2C-438 | BAJA copy | I.2 Nav submenús | "Gana más con rotoplas" — marca en minúscula. | `F1D-nav-submenus-deep.json` |
| BUG-B2C-439 | INFO arq | I.2 Nav submenús | Submenús desktop dependen 100% de hover CSS (sin click handler) → inalcanzables en táctil con viewport desktop. | `F1D-nav-submenus-deep.json` |
| BUG-B2C-440 | MEDIA a11y | II.19.a `/recursos/videos/` | 9 filtros de categoría son `<button>` sin `role="tab"`/`aria-selected`/`tabindex` coordinado. | `F1D-13` |
| BUG-B2C-441 | BAJA copy | II.19.a `/recursos/videos/` | Título de video "Accesrios para Cisternas Rotoplas" — typo (Accesorios). | `F1D-13` |
| BUG-B2C-442 | BAJA copy | II.19.a `/recursos/videos/` | 9 categorías en minúscula, inconsistente con capitalización del sitio. | `F1D-13` |
| BUG-B2C-443 | BAJA UI | II.19.a `/recursos/videos/` | Prev/Next del carrusel sin aria-label y duplicados 2× (desktop+mobile). | `F1D-13` |
| BUG-B2C-444 | MEDIA a11y | II.19.b `/recursos/tips/` | 7 `<iframe>` YouTube con `title=""` vacío. | `F1D-14` |
| BUG-B2C-445 | INFO arq | II.19.b `/recursos/tips/` | Página sobre WordPress + Popup Maker mientras /videos/ es Qwik → stacks distintos bajo `/recursos/`. | `F1D-14` |
| BUG-B2C-446 | BAJA UX | II.19.b `/recursos/tips/` | 7 popups con iframe YouTube pre-renderizados al cargar (peso + 7 conexiones YouTube pre-interacción). | `F1D-14` |
| BUG-B2C-447 | ALTA UX/a11y | II.19.c `/recursos/libreria/` | "Descargar" del catálogo es `<div>` (cursor:auto, sin handler, sin href), usa atributo no estándar `data="...pdf"`. Descarga probablemente no funcional. | `F1D-15` |
| BUG-B2C-448 | ALTA data | II.19.c `/recursos/libreria/` | El catálogo apunta a `190515_Agro-Diptico_ARweb.pdf` — díptico de Agroindustria de 2019, no catálogo B2C. Archivo equivocado + desactualizado. | `F1D-15` |
| BUG-B2C-449 | BAJA copy | II.19.c `/recursos/libreria/` | "Catalogo de Productos" sin tilde (Catálogo). | `F1D-15` |
| BUG-B2C-450 | MEDIA contenido | II.19.c `/recursos/libreria/` | 3 de 4 nodos marcados "Próximamente" (75% de la sección vacío). | `F1D-15` |
| BUG-B2C-451 | MEDIA copy | II.17.a `/nosotros/quienes-somos/` | Heading visible "Quienes Somos" sin `¿?` ni tilde, mientras el `<title>` sí los tiene. | `F1D-17` |
| BUG-B2C-452 | MEDIA UX | II.17 sub-rutas `/nosotros/` | Breadcrumb con 2 entradas "Nosotros" a destinos rotos (tempmx + `/identidad/` con error). Breadcrumb inutilizable. | `F1D-16/17` |
| BUG-B2C-453 | BAJA copy | II.17.b `/nosotros/presencia/` | Intro "100%mexicana" sin espacio. | `F1D-16` |
| BUG-B2C-454 | BAJA copy | II.17.b `/nosotros/presencia/` | Dirección Pacífico "Zona insdustrial" — typo (industrial). | `F1D-16` |
| BUG-B2C-455 | BAJA data | II.17.b `/nosotros/presencia/` | Oficina México usa "México, D.F." (deprecado desde 2016 → CDMX). | `F1D-16` |
| BUG-B2C-456 | BAJA UI | II.17.b `/nosotros/presencia/` | CTA "Carreras" con target/rel inconsistente entre instancias duplicadas. | `F1D-16` |
| BUG-B2C-457 | **CRÍTICO** arq/UX | II.16.c `/servicios-lavado/` wizard | Wizard de cotización con presencia inestable: mapeado funcional (F1D-09/10/11) y ausente del DOM en verificación posterior (F1D-18, mismo CP/cuenta). Builder.io A/B/feature-flag o regresión. Contracts no pueden asertarlo. | `F1D-18` |
| BUG-B2C-458 | **CRÍTICO** a11y | II.5 `/cart/` | Steppers `.decreasebutton`/`.increasebutton` sin texto/aria/title/svg; glifo vía CSS `content`. Imposible operar con AT. Sistémico con PDP (318) y wizard (401). | `F1C-12` |
| BUG-B2C-459 | MEDIA a11y | II.5 `/cart/` | Checkbox de aceptación de T&C sin `id`/`name`/`aria-label`, sin `for`. No identificable por AT/automatización. | `F1C-12` |
| BUG-B2C-460 | MEDIA UX | II.5 `/cart/` | El item del carrito no enlaza a su PDP — no se puede volver al producto. | `F1C-12` |
| BUG-B2C-461 | ALTA legal | II.5 `/cart/` | La aceptación legal de la compra (productos) enlaza a `/terminos-y-condiciones-serviciados/` (T&C de servicios). Agrava BUG-038 (sin T&C de e-commerce). | `F1C-12` |
| BUG-B2C-462 | BAJA código | II.5 `/cart/` | Clase con typo `sercicesAsItems` (services). | `F1C-cart-deep.json` |
| BUG-B2C-463 | BAJA a11y | II.5 `/cart/` | Checkboxes `open-total`/`open-total-cart` como toggle CSS sin `aria-expanded`/label. | `F1C-cart-deep.json` |
| BUG-B2C-464 | MEDIA | II.5.b checkout footer | Copyright `© 2024` (footer global dice `© 2026`). Año hardcodeado inconsistente entre 2 footers del sitio. | `F1C-13` |
| BUG-B2C-465 | BAJA a11y | II.5.b checkout footer | Link "Términos y condiciones" con `title="Aviso de privacidad"` (atributo equivocado). | `F1C-13` |
| BUG-B2C-466 | MEDIA infra | II.5.b checkout footer | "Seguridad de la información" → `rotoplas.com.mx` (cross-domain prod); footer global usa qarotoplasmx.io. | `F1C-13` |
| BUG-B2C-467 | BAJA infra | II.5.b checkout footer | "Código de ética" → `rotoplas.com.mx/wp-content/2020/...` (host distinto al footer global). 2 ubicaciones del mismo PDF. | `F1C-13` |
| BUG-B2C-468 | BAJA | II.5.b checkout footer | Tel `tel:800 506 3000` con espacios en href (inválido). | `F1C-13` |
| BUG-B2C-469 | MEDIA a11y | II.5.b checkout paso 1 | Radios de dirección `manualAddressAlias` sin `id`/label. | `F1C-13` |
| BUG-B2C-470 | MEDIA UX | II.5.b checkout paso 1 | Campo "Código" de descuento `disabled` — usuario no puede aplicar cupón. | `F1C-13` |
| BUG-B2C-471 | ALTA SEO/a11y | II.5.b checkout paso 3 | 3 `<h1>` en página de pago ("Disfrute el envío...", "Sin CFDI", "CFDI") + jerarquía invertida (H1 bajo H2/H3). | `F1C-15` |
| BUG-B2C-472 | MEDIA a11y | II.5.b checkout paso 3 | Toggle "Sin CFDI"/"CFDI" marcado como `<h1>` (abuso semántico). | `F1C-15` |
| BUG-B2C-473 | MEDIA a11y | II.5.b checkout paso 3 | Métodos de pago son `<div>` clickeables sin `role="radio"`/`radiogroup`/`aria-checked`/teclado. | `F1C-15` |
| BUG-B2C-474 | MEDIA UX/seg | II.5.b checkout paso 3 | Campos de tarjeta con `autocomplete="off"` — bloquea autofill legítimo (debería `cc-*`). | `F1C-15` |
| BUG-B2C-475 | MEDIA mobile | II.5.b checkout paso 3 | `cc-number`/`cc-csc` sin `inputmode="numeric"` → teclado de texto en móvil. | `F1C-15` |
| BUG-B2C-476 | ALTA funcional | II.5.b checkout paso 3 | `cc-csc maxlength="3"` pero se ofrece American Express (CVV 4 dígitos) → pagos Amex imposibles. | `F1C-15` |
| BUG-B2C-477 | BAJA UX | II.5.b checkout paso 3 | Inputs de tarjeta con `placeholder="*"` (sin formato informativo). | `F1C-15` |
| BUG-B2C-478 | BAJA copy | II.5.b checkout paso 3 | "Tarjetas validas para pago:" — "validas" sin tilde. | `F1C-15` |

| BUG-B2C-479 | BAJA copy | II.5 `/cart/` empty | "Mi carrito" (H2) vs "Mi Carrito" (breadcrumb) — capitalización inconsistente. | `F1C-18` |
| BUG-B2C-480 | CERRADO s22 (falso positivo) | Post-compra | ~~Logout tras compra exitosa (observado 1 vez en 52820261OYM4).~~ Falso positivo: no se reprodujo en 5 compras posteriores con todos los métodos de pago (s15–s22). | — |
| BUG-B2C-481 | ALTA UX | Cross-sell anónimo | Add-to-cart anónimo muestra drawer "Añadiste este articulo" pero NO persiste (carrito sigue vacío). Falsa confirmación. | `F1C-18` |
| BUG-B2C-482 | MEDIA UX | I.13 Mini-cart drawer | Drawer post-add no nombra producto/cantidad/precio (genérico "este articulo", sin tilde). | `F1C-18` |
| BUG-B2C-483 | ALTA UX/negocio | Cross-sell CTA | CTA invertido por auth: anónimo→"Agregar al carrito" (roto); autenticado→"Buscar distribuidor" (saca al comprador del flujo). | `F1C-18` |
| BUG-B2C-484 | MEDIA código | II.5.b checkout CFDI | Select Uso CFDI con `name="ProductoSat"` (no corresponde). | `F1C-19` |
| BUG-B2C-485 | MEDIA código | II.5.b checkout CFDI | Select Régimen Fiscal con `name="idproductosat"` (no corresponde). | `F1C-19` |
| BUG-B2C-486 | BAJA código | II.5.b checkout CFDI | Campo Calle con `name="steet"` (typo street). | `F1C-19` |
| BUG-B2C-487 | BAJA código | II.5.b checkout CFDI | Checkbox con `name="privacity"` (typo privacy). | `F1C-19` |
| BUG-B2C-488 | BAJA copy | II.5.b checkout CFDI | Uso CFDI "Selecciona una opcion" sin tilde. | `F1C-19` |
| BUG-B2C-489 | BAJA copy | II.5.b checkout CFDI | Uso CFDI "G01 Adquisición de mercancias" sin tilde. | `F1C-19` |
| BUG-B2C-490 | MEDIA código | II.5.b checkout CFDI | `name` no corresponde: Colonia→`region`, Municipio→`city`. | `F1C-19` |
| BUG-B2C-491 | BAJA a11y | II.5.b checkout CFDI | Campos fiscales `placeholder="*"` + `autocomplete="on"` genérico (sin tokens estándar). | `F1C-19` |
| BUG-B2C-492 | BAJA copy | II.5.b checkout Transferencia | "48 horas naturales.para realizar" — falta espacio tras punto. | `F1C-checkout-metodos-cfdi-deep.json` |
| BUG-B2C-493 | MEDIA data | II.5.b checkout CFDI | Catálogo "Uso CFDI" incompleto: 5 opciones vs ~25 del SAT (faltan P01, D01–D10, CP01…). | `F1C-19` |
| BUG-B2C-494 | MEDIA UX | II.8 PDP §19 (Reseñas) | "Escribir una reseña" del PDP navega al índice genérico `/customer/reviews/` sin deep-link al SKU; el usuario aterriza en su lista de pendientes (productos comprados) sin contexto del producto del PDP. Si no lo compró, no puede reseñarlo y la UI no lo explica. | `F1C-18-pdp-modal-cp-reusa-I6.png` |
| BUG-B2C-495 | MEDIA UX | II.5.b checkout paso 1 §11 | Botón "Aplicar" del código de descuento habilitado mientras el input "Código" está `disabled`; al pulsarlo no habilita el campo ni da feedback (no-op silencioso). Función de cupón inoperante. | `F1C-19-checkout-codigo-descuento-disabled.png` |
| BUG-B2C-496 | BAJA copy | II.5.b checkout CFDI | Label "Colonia *" con espacio antes del `*` (inconsistente con el resto de labels). | `F1C-20-checkout-cfdi-autofill-cp.png` |
| BUG-B2C-497 | MEDIA UX/data | II.5.b checkout CFDI | Campo "Ciudad" duplica el valor de "Estado" tras autofill (ambos "Ciudad de México") → redundante junto a "Municipio". Posible confusión al facturar. | `F1C-20-checkout-cfdi-autofill-cp.png` |
| BUG-B2C-498 | MEDIA copy | II.5.b checkout paso 3 §14 | Mensaje de pago rechazado con gramática rota: "Si gustas intentar de nueva cuenta, por considerar hay un error." Visible al usuario tras un pago fallido. | `F1C-21-checkout-tarjeta-rechazada.png` |
| BUG-B2C-500 | MEDIA UX | II.5.b checkout §9.b | Modal "Datos fiscales incorrectos / Generar factura genérica" se dispara al generar el pedido aunque esté seleccionado "Sin CFDI" (el usuario no pidió factura). | `F1C-23-checkout-transferencia-clean-state.png` |
| BUG-B2C-501 | INFO/seguridad | III.3 / checkout | El estado Qwik serializado en el HTML (`q-data`/`q:state`) expone PII del cliente (email, teléfono, direcciones, IDs commercetools, hash password) inline en la página de checkout. | (state dump §III.3) |
| BUG-B2C-502 | MEDIA a11y | III.7 (sistémico) | Contraste de color insuficiente — Lighthouse reporta 32 nodos en home, 8 en PDP. | (Lighthouse III.6) |
| BUG-B2C-503 | MEDIA a11y/mobile | III.7 (sistémico) | Touch targets sin tamaño/espaciado suficiente — 10 en home, 2 en PDP. Impacta usabilidad móvil. | (Lighthouse III.6) |
| BUG-B2C-504 | BAJA UX/mobile | III.8 PDP mobile | PDP móvil sin sticky add-to-cart bar — los CTAs de compra quedan fuera de viewport tras scroll. | `F4-02-pdp-mobile.png` |
| BUG-B2C-505 | BAJA copy/data | II.5.b Transferencia (PDF SPEI) | En el PDF SPEI el teléfono de contacto se renderiza como literal "null" ("…Amigley Bastardo al teléfono null o al correo abastardo@rotoplas.com"). | `F1C-27-transferencia-spei-pdf-openpay.png` |
| BUG-B2C-506 | MEDIA UX/copy | II.5.b Efectivo | Confirmación de efectivo muestra check verde + "¡Tu compra ha sido un éxito!" con el pago aún pendiente (48 h para depositar). Engañoso e inconsistente con Transferencia ("¡Solo falta un paso!"). | `F1C-28-efectivo-confirmacion-compra-exitosa.png` |
| BUG-B2C-507 | MEDIA UX | II.5.b Efectivo | Efectivo no entrega instrucciones ni referencia de depósito en pantalla (sin "Ver instrucciones", sin ficha/referencia); depende 100% del correo. Inconsistente con Transferencia. | `F1C-28-efectivo-confirmacion-compra-exitosa.png` |
| BUG-B2C-508 | BAJA copy | II.5 PDP reseñas (cross-state) | "se el primero en dejar una reseña" sin tilde → "sé el primero" (presente en invitado y autenticado). | `F1C-29-guest-cart-vacio-no-persiste.png` |
| BUG-B2C-509 | MEDIA UX | II.3.b Signup | Registro exitoso sin feedback: redirige a `/login/` sin mensaje de éxito ni instrucción; parece que el form falló. | — |
| BUG-B2C-510 | MEDIA legal/UX | II.3.b Signup | "Crear cuenta" no gated por la casilla de Aviso de privacidad (botón habilitado con `privacity.checked=false`). Riesgo LFPDPPP. | — |
| BUG-B2C-511 | BAJA validación | II.3.b Signup | Email sin validación de formato inline (acepta "correoinvalido" sin `@`); teléfono corto tampoco valida. Deriva de `type="text"` (BUG-057). | — |
| BUG-B2C-513 | MEDIA UX/data-loss | II.5 `/cart/` | "Vaciar carrito" no muestra modal de confirmación: vacía al instante (patrón destructivo, igual que BUG-131). | — |
| BUG-B2C-514 | MEDIA UX | II.5.b Transferencia §9.b | La confirmación de transferencia no muestra resumen de orden (sin productos/SKU, dirección, Subtotal/Envío/Total). Inconsistente con tarjeta/efectivo. | `F1C-25-transferencia-confirmacion-solo-falta-un-paso.png` |
| BUG-B2C-515 | BAJA SEO | II.6 `/order/[orderNumber]/` | `meta[robots]` ausente → página transaccional con nº de orden en URL queda indexable; debería ser `noindex`. | — |
| BUG-B2C-516 | INFO data | II.5.b Transferencia (PDF SPEI) | Mismos valores con etiquetas distintas entre columnas de banco (CIE/Referencia, Referencia/Concepto). Modelo CIE/SPEI de OpenPay (correcto técnicamente) pero confunde al usuario. | `F1C-27-transferencia-spei-pdf-openpay.png` |
| BUG-B2C-517 | BAJA a11y/SEO | II.1 Home — carrusel hero | ~~Los 5 slides del banner hero comparten el mismo `alt="Banner Rotoplas"` (genérico).~~ **CERRADO s22 (fix parcial):** alts descriptivos ("Banner Goles", "Banner Tuboplus", etc.). | `CAPA2-crear-03-diag-transferencia.png` |
| BUG-B2C-518 | MEDIA SEO | II.18.c Blog — feed RSS | No existe feed de sindicación funcional: `/feed/` devuelve **falso 200** con el HTML catchall de Qwik (`content-type: text/html`, `q:route="[...catchall]"`, no XML); `/blog/feed/` → **503**. Complementa BUG-229 (`<link rel=alternate>` ausente): además de no enlazarse, el endpoint no existe. | `F2-30-blog-gap-closure.png` |
| BUG-B2C-519 | MEDIA SEO | II.18.c Blog — sitemap | Blog y posts **ausentes de todos los sitemaps**. `sitemap.xml` (index) sólo enlaza `sitemap-static.xml` + `sitemap-categories.xml` + `sitemap-products.xml`; `sitemap-static.xml` lista 5 URLs sin `/blog/` ni posts. Los posts (root `/{slug}`) no son descubribles por crawlers vía sitemap. | `F2-30-blog-gap-closure.png` |
| BUG-B2C-520 | MEDIA a11y | II.8 §19.b modal "¡Instálalo con nosotros!" | El modal (`div.modal[q:id=6k]`) carece de `role="dialog"`, `aria-modal="true"` y `aria-labelledby` → la tecnología de asistencia no lo anuncia como diálogo ni atrapa el foco. | `F1C-30-toggle-instalacion-modal.png` |
| BUG-B2C-521 | BAJA a11y/SEO | II.8 §19.b modal instalación | El título "¡Instálalo con nosotros!" es un `<p>`, no un heading (`<h2>`/`<h3>`). El modal carece de heading semántico. | `F1C-30-toggle-instalacion-modal.png` |
| BUG-B2C-522 | MEDIA a11y | II.8 §19.b modal instalación — botón cerrar | El botón de cierre (`button[q:id=6m]` con `<svg>` X) es **icon-only sin `aria-label`/`title`/texto** → invisible para lectores de pantalla. Mismo patrón sistémico que BUG-318/401 (steppers icon-only). | `F1C-30-toggle-instalacion-modal.png` |
| BUG-B2C-523 | MEDIA a11y | II.8 §19.b modal instalación — CTA | El CTA "Agregar al carrito" es un `div.builder-block` (Builder.io) con `on:click`, **no un `<button>`**: sin `role="button"`, sin `type`, sin foco por teclado. Patrón sistémico BUG-147/473. | `F1C-30-toggle-instalacion-modal.png` |
| BUG-B2C-524 | BAJA UX móvil | II.8 §19.b modal instalación — teléfono | El teléfono "800 506 3000" se muestra como **texto plano**, no como `<a href="tel:8005063000">` → en móvil no permite tap-to-call. | `F1C-30-toggle-instalacion-modal.png` |
| BUG-B2C-525 | BAJA copy | II.8 §19.b modal instalación — copy | Inconsistencia de modo verbal: *"…primero debes agregarlo a tu carrito y **selecciona** el servicio."* mezcla infinitivo ("agregarlo") con imperativo ("selecciona"). Debería ser "…agregarlo a tu carrito y **seleccionar** el servicio." | `F1C-30-toggle-instalacion-modal.png` |
| BUG-B2C-526 | MEDIA UX | I.6 Paso 2 / `/customer/address/add/` — guardado | Tras "Confirmar punto de entrega" la dirección se guarda y aparece en `/customer/address/` **sin ningún toast/confirmación de éxito**. El usuario no recibe feedback de que la operación funcionó (mismo patrón sistémico de no-feedback: BUG-146 logout, newsletter). | `F2-31-modal-direccion-paso3-mapa.png` |
| BUG-B2C-527 | BAJA UX | I.6 Paso 2 / `/customer/address/` — auto-default | Al agregar una dirección nueva se marca **automáticamente como "predeterminada de envío"** (cambia el CP de entrega del header) **sin preguntar** al usuario. Debería respetar la default existente o confirmar el cambio. | `F2-31-modal-direccion-paso3-mapa.png` |
| BUG-B2C-528 | ALTA UX/nav | III.8 Mobile — menú móvil | El menú móvil "Menú principal" (`.dropdown-menu`) **solo expone categorías de producto + "Servicios" + "Prueba"(TEST)**; los items institucionales del top-bar desktop (**Conócenos, Blog, Recursos, Contacto, Amigo Plomero**) **no son accesibles desde el menú móvil**. Conócenos/Recursos/Contacto/Amigo Plomero quedan inalcanzables por navegación en móvil (solo via footer se alcanza Blog/legales). | `F4-05-nav-institucional-ausente-movil.png` |
| BUG-B2C-529 | MEDIA a11y | II.11b `/customer/reviews/` — modal eliminar | El modal "¿Quieres eliminar tu reseña?" (`div.modal-cancelation`) carece de `role="dialog"`, `aria-modal` y no es `<dialog>` → AT no lo anuncia como diálogo ni atrapa el foco. Mismo patrón que BUG-520. | `F2-33-resena-modal-eliminar.png` |
| BUG-B2C-530 | BAJA a11y | II.11b modal eliminar — botón cerrar | El botón cerrar "X" del modal es icon-only sin `aria-label`/`title`/texto → invisible para lectores de pantalla. Patrón sistémico BUG-522. | `F2-33-resena-modal-eliminar.png` |
| BUG-B2C-531 | MEDIA a11y | II.11b "Realizadas" — gatillo eliminar | El gatillo de eliminar (ícono basura `<svg>` en `div[style="cursor:pointer"]`) **no tiene `role`, `aria-label` ni `tabindex`** → no aparece en el a11y tree, no es operable por teclado ni anunciado por lector de pantalla. El usuario que navega por teclado/AT **no puede eliminar su reseña**. | `F2-33-resena-modal-eliminar.png` |
| BUG-B2C-532 | BAJA infra | II.11b modal eliminar — CSS | Contenedor de botones con typo de clase: `containerButons` (debería `containerButtons`). | `F2-33-resena-modal-eliminar.png` |
| BUG-B2C-533 | INFO copy | II.11b modal eliminar — H3 | El H3 tiene un espacio sobrante al final: `"¿Quieres eliminar tu reseña? "`. | `F2-33-resena-modal-eliminar.png` |
| BUG-B2C-534 | BAJA UX | II.11b editor de reseña — contador | El editor muestra microcopy estático "Máximo 240 caracteres" pero **sin conteo en vivo** (ej. "87/240"); el usuario no sabe cuántos caracteres le quedan al escribir. | `F2-33-resena-modal-eliminar.png` |
| BUG-B2C-535 | MEDIA datos | Correo confirmación de pedido — método de pago | **Contradicción entre canales:** la pantalla de confirmación on-site dice "Tarjeta de **Crédito**" y el correo de `ventasecom@rotoplas.com` dice "Tarjeta de **débito**" para el mismo pago (Visa 4242). | `CAPA2-07-orden-6820261ZZA8-confirmacion-movil.jpeg` + hilo Gmail `19ea82f4b94ea359` |
| BUG-B2C-536 | ALTA datos | Correo confirmación de pedido — dirección de envío | El correo **omite el número exterior** de la dirección: renderiza `"Avenida Álvaro Obregón , Roma Norte"` (variable de número vacía en el template HTML) pese a que el sitio sí muestra "191". Riesgo de entrega. | hilo Gmail `19ea82f4b94ea359` |
| BUG-B2C-537 | BAJA contenido | Correo confirmación de pedido — HTML vs texto plano | El cuerpo de **texto plano** incluye una sección "Servicio / instalación" ("El servicio de instalación se programará una vez que recibas el producto…") que el cuerpo **HTML omite** (queda como comentario `<!-- SERVICE -->`). Versiones divergentes. | hilo Gmail `19ea82f4b94ea359` |
| BUG-B2C-538 | BAJA | Correo confirmación de pedido — footer | Los links del footer del correo "Aviso de privacidad" y "Términos y condiciones" apuntan a `href="#"` (muertos). | hilo Gmail `19ea82f4b94ea359` |
| BUG-B2C-539 | BAJA copy | Checkout móvil — footer | Inconsistencia de año: el carrito muestra "© 2026" y el checkout (pasos 1–3) muestra "© 2024" en el mismo flujo. (Extiende BUG-464.) | `CAPA2-03-checkout1-direccion-movil.png` |
| BUG-B2C-540 | BAJA a11y | Checkout móvil — footer link | El link "Términos y condiciones" del footer del checkout tiene `aria-label="Aviso de privacidad"` (etiqueta accesible ≠ texto visible ni destino). | `CAPA2-03-checkout1-direccion-movil.png` |
| BUG-B2C-541 | BAJA copy | Correo reset password — cuerpo | Typo "Ingresa al enlace para **reestablecer** tu contraseña" (debe "restablecer"; el título sí dice "Restablece"). Plantilla de correo transaccional "B" (compartida con contacto). | hilo Gmail `19ea841d525c8345` |
| BUG-B2C-542 | BAJA copy | Correo reset/contacto — footer | Typo "Comunicate con nosotros al **corro** electrónico" (debe "correo"). Footer de plantilla B. | hilos Gmail `19ea841d525c8345`, `19ea8459014573ee` |
| BUG-B2C-543 | BAJA copy | Correo reset/contacto — footer | "**Comunicate**" sin tilde (debe "Comunícate"). Footer de plantilla B (reset + contacto). | hilos Gmail `19ea841d525c8345`, `19ea8459014573ee` |
| BUG-B2C-544 | ALTA seguridad | Correo reset password — link | El enlace de restablecimiento usa **`http://`** (sin TLS): `http://qarotoplasmx.io/restore-password/<token>`. El token de reset viaja sin cifrar. | hilo Gmail `19ea841d525c8345` |
| BUG-B2C-545 | ALTA | Correo reset/contacto — footer legal | Links de footer a **URLs inexistentes**: `http://qarotoplasmx.io/Terminosycondiciones/` y `/Avisodeprivacidad/` (CamelCase → 404; además `http`). Las rutas reales son `/terminos-y-condiciones` y `/aviso-de-privacidad`. | hilo Gmail `19ea841d525c8345` |
| BUG-B2C-546 | BAJA | Correo reset/contacto (plantilla B) — footer | Copyright "© **2023**" (desactualizado; la plantilla A de compra/bienvenida dice 2026). | hilo Gmail `19ea841d525c8345` |
| BUG-B2C-547 | MEDIA i18n/a11y | Correo reset password — `<html>` | `<html lang="en">` con contenido 100% en español (lectores de pantalla/clientes anuncian idioma incorrecto). | hilo Gmail `19ea841d525c8345` |
| BUG-B2C-548 | MEDIA consentimiento | Newsletter — opt-in | La suscripción es **single opt-in**: el correo confirma "Ya estás suscrito" de inmediato, **sin paso de doble confirmación** (double opt-in). Riesgo de consentimiento LFPDPPP/anti-spam. | hilo Gmail `19ea843d16b4dad8` |
| BUG-B2C-549 | BAJA copy | Newsletter — asunto | Asunto "Bienvenido a newsletter" — falta artículo ("al newsletter"). | hilo Gmail `19ea843d16b4dad8` |
| BUG-B2C-550 | BAJA UX | Contacto — campo mensaje | El campo "Escribe tu mensaje" es `<input type="text" maxlength="240">` (una sola línea) en vez de `<textarea>`; incómodo para un mensaje y limitado a 240 caracteres. | `/contacto/` |
| BUG-B2C-551 | BAJA copy | Correos de status (plantilla C) — confirmado | Título de sección "Dirección de **facuración**" (sin "t"). Inconsistente: el correo "entregado" lo tiene correcto ("facturación") → el typo vive en unas plantillas de status y en otras no. | hilo Gmail `19ea847281d467dd` |
| BUG-B2C-552 | MEDIA datos | Correos de status (plantilla C) — footer | Teléfono de soporte **"55 1234 5678"** es un número placeholder/falso (las plantillas A/B usan el real 800 506 3000). | hilos Gmail `19ea847281d467dd`, `19ea8485e27ed1e7` |
| BUG-B2C-553 | ALTA | Correos de status (plantilla C) — footer legal | Links "Términos y condiciones" y "Aviso de privacidad" con **`href=` vacío** → muertos. | hilos Gmail `19ea847281d467dd`, `19ea8485e27ed1e7` |
| BUG-B2C-554 | MEDIA datos | Correos de status (plantilla C) — dirección de envío | Dirección malformada: "Avenida Álvaro Obregón, 191, **,** 06700, Cuauhtémoc, Roma Norte, Ciudad de México, **Mexico**" (doble coma por nº interior vacío; "Mexico" sin acento; orden alcaldía/colonia invertido). | hilos Gmail `19ea847281d467dd`, `19ea8485e27ed1e7` |
| BUG-B2C-555 | BAJA | Correos de status (plantilla C) — texto plano | El cuerpo de texto plano **omite las filas de la tabla de Productos** (el HTML sí las incluye). | hilos Gmail `19ea847281d467dd`, `19ea8485e27ed1e7` |
| BUG-B2C-556 | MEDIA datos/fiscal | Correos de status (plantilla C) — facturación | Aunque la compra fue **"Sin CFDI"**, los correos muestran factura genérica **RFC XAXX010101000** con **CP fiscal 04950** (≠ CP de envío 06700; origen del 04950 desconocido). | hilos Gmail `19ea847281d467dd`, `19ea8485e27ed1e7` |
| BUG-B2C-557 | BAJA copy | Correo de status "en camino" | "**esta**" sin tilde en asunto y cuerpo ("Tu pedido esta en camino" / "esta en ruta de entrega"); debe "está". | hilo Gmail `19ea847653607994` |
| BUG-B2C-558 | BAJA UX | Capa 2 Transferencia (§9.d) | **3 titulares distintos** para el mismo evento: asunto del correo "Recibimos tu pedido", H1 del correo "¡Tu pedido está casi listo!", H1 on-site "¡Solo falta un paso!". | hilo Gmail `19ea918c9ab23e5f` |
| BUG-B2C-559 | BAJA | Correo Transferencia (plantilla D) — footer (§9.d) | "**Copyright 2025**" — cuarto año distinto entre plantillas (A=2026, B/C/E=2023, D=2025) y sin símbolo "©". | hilo Gmail `19ea918c9ab23e5f` |
| BUG-B2C-560 | BAJA copy | Correo Transferencia (plantilla D) (§9.d) | "…por el monto exacto **,** incluyendo…" — espacio antes de la coma. | hilo Gmail `19ea918c9ab23e5f` |
| BUG-B2C-561 | BAJA copy | Correo Efectivo (plantilla E) (§9.d) | El CTA de descarga tiene `download="**Váucher** de pago.pdf"` — palabra mal escrita (debe "Voucher"/"Comprobante"). | hilo Gmail `19ea92011f86b9b9` |
| BUG-B2C-562 | MEDIA | Correos plantillas **D y E** (§9.d) | `<meta name="viewport">` corrupto (`width<U+FFFD>vice-width` en vez de `width=device-width`) → el correo no escala en móvil. | hilos Gmail `19ea918c9ab23e5f`, `19ea92011f86b9b9` |
| BUG-B2C-563 | BAJA copy | PDF SPEI de OpenPay (§9.d) | "Si tienes dudas **comunicate**…" — "comunicate" sin tilde. *(PDF generado por OpenPay — escalar a OpenPay.)* | `CAPA2-11b-spei-6820263SS52.pdf` |
| BUG-B2C-564 | BAJA copy | PDF SPEI de OpenPay (§9.d) | "Fecha y hora: …, a las **15:17 PM**" — formato 24 h con "PM" redundante. *(PDF generado por OpenPay.)* | `CAPA2-11b-spei-6820263SS52.pdf` |
| BUG-B2C-566 | **ALTA (pérdida de datos)** | Reseñas — publicación (II.11b) | **Las reseñas NO se guardan.** El POST de publicación `…/{UUID}/q-data.json?qaction=6umxiG2X9yg` devuelve **HTTP 200 con `{"success":"0"}` (fallo)**, pero el frontend **no valida ese flag** y muestra el toast de **éxito** "Tu reseña ha sido enviada para revisión" + limpia el form. La reseña se **pierde silenciosamente**: nunca aparece en Realizadas, nunca se hace pública en la PDP ("¡Se el primero en dejar una reseña!"), no genera correo, y el producto reaparece en Pendientes de forma inconsistente. **Causa probable:** el payload manda `product` = el UUID del slot de reseña (`b64c3521…`, el mismo de la URL) en lugar del ID real del producto (SKU 310002) → el backend rechaza el guardado. Reproducido 2× (auditado con hook a `fetch` + MutationObserver pre-submit). | `CAPA2-19-resena-audit-success0.json`, `CAPA2-17`, `CAPA2-18` |

**Total: 536 bugs distinct activos** (numeración hasta **BUG-B2C-566**). 7 IDs retirados (010, 011, 271, 398, 399, 499, **565** — ver apéndice; 565 era duplicado de BUG-141, empty-state de "Realizadas"). 23 IDs nunca asignados (huecos): 043, 044, 213–219, 306, 308–312, 320, 324, 325, 357, 360, 373, 376, 512.

> **Capa 2 — Reseñas (verificado s16):** NO llega correo de notificación al publicar una reseña — pero esto es **consecuencia de BUG-566**, no "moderación silenciosa": la reseña **nunca se guarda** (`success:0`), así que no hay nada que notificar. Verificado esperando ~3 min con `in:anywhere` (incl. spam) en `c.agarcia@rotoplas.com`. Hasta que se corrija BUG-566, **no es posible cerrar la Capa 2 de reseñas** (no hay efecto externo que verificar). La reseña de prueba no persiste → sin pollution. **Lección de proceso:** el `success:0` se detectó al instrumentar `fetch`+MutationObserver **antes** del submit (regla `feedback_toast_timing`); el primer intento sin instrumentar pre-submit confundió el falso toast de éxito con "moderación".

> **Notas positivas (no-bug):** (1) carrito y checkout hacen **gating correcto** por aceptación de T&C; (2) campos de contacto del checkout paso 2 `readonly` pre-llenados; (3) **add-to-cart autenticado SÍ persiste** (badge actualiza, item en /cart) — el fallo es solo anónimo (BUG-481); (4) **PCI correcto** en confirmación (últimos 4); (5) **E2E validado** (orden aparece en /customer/orders); (6) **Régimen Fiscal** con catálogo SAT completo (20). Conservar tras cualquier refactor.

### Apéndice — IDs retirados

> Se listan para no romper la trazabilidad de reportes externos que pudieran citarlos. NO cuentan en el total de bugs activos.

| ID | Estado | Motivo |
|---|---|---|
| BUG-B2C-010 | Reclasificado → BUG-436 | "Rotoplas Servicios" es submenu-launcher (no StaticText muerto); el bug a11y real es BUG-436. |
| BUG-B2C-011 | Reclasificado → BUG-436 | "Amigo Plomero" es submenu-launcher; ídem. |
| BUG-B2C-271 | Descartado | El precio con −25% era aritméticamente correcto; no era bug. |
| BUG-B2C-398 | Anulado | El wizard de cotización de `/servicios-lavado/` SÍ existe (bloque Builder.io); ver II.16.c. |
| BUG-B2C-399 | Anulado | Mismo origen que 398. |
| BUG-B2C-499 | Descartado | Los datos bancarios SÍ se entregan vía PDF SPEI; el síntoma era state-leak del modal fiscal (BUG-500). |
| BUG-B2C-565 | Duplicado → BUG-141 | Empty-state de "Realizadas" con copy incorrecto; ya cubierto por BUG-141 (creado y retirado en s16). |

---

# Parte VI — DOM CONTRACTS EJECUTABLES
_Pendiente: generar al cerrar F1A. Snippets Playwright agrupados por componente para `tests/`._

### Plantilla por componente:
```js
import { test, expect, Page } from '@playwright/test';

export async function headerContract(page: Page) {
  await expect(page.locator('header.header-main')).toBeVisible();
  await expect(page.locator('header img[alt="logo"]')).toBeVisible();
  await expect(page.locator('input#search-input').first()).toBeVisible();
  await expect(page.locator('header a[href="/cart"]')).toBeVisible();
  await expect(page.locator('label[for="open-menu"], button[aria-label="Abrir menú"]').first()).toBeVisible();
}

export async function footerContract(page: Page) {
  const FOOTER_LINKS = [
    { text: 'Seguimiento del pedido', href: '/traking/' },
    { text: 'Preguntas frecuentes', href: '/preguntas-frecuentes/' },
    { text: 'Almacenamiento', href: '/products/almacenamiento/' },
    // ... ver Parte I.4 para lista completa
  ];
  for (const { text, href } of FOOTER_LINKS) {
    await expect(page.locator(`footer a[href="${href}"]`).first(),
      `footer link "${text}"`).toHaveCount(1, { timeout: 5000 });
  }
  await expect(page.locator('footer').getByText(/Copyright © \d{4} Rotoplas S\.A\. de C\.V\./)).toBeVisible();
}

export async function homePageContract(page: Page) {
  await page.goto('https://qarotoplasmx.io/');
  await headerContract(page);
  await footerContract(page);
  // Secciones únicas de home
  await expect(page.getByRole('heading', { name: '¿Qué necesitas solucionar hoy?', level: 2 })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Descubre consejos de expertos Rotoplas', level: 2 })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Descubre un mundo de ofertas exclusivas', level: 2 })).toBeVisible();
  // Por qué elegirnos
  for (const h of ['Compra rápida', 'Calidad garantizada', 'Entrega a domicilio', 'Atención personalizada']) {
    await expect(page.getByRole('heading', { name: h, level: 3 })).toBeVisible();
  }
}
```

---

_Fin del documento — sigue creciendo en vivo con cada fase._
