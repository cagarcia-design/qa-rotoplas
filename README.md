# QA Rotoplas — Smoke Tests B2C

Suite autónoma de **pruebas de humo estructurales post-deploy** para el sitio B2C en
**QA** (`qarotoplasmx.io`) y **Producción** (`rotoplas.com.mx`). Detecta regresiones de
DOM en segundos: botones que desaparecen, links rotos, secciones que dejan de renderizar.
Todo corre con un panel web local, sin memorizar comandos.

## Setup (primera vez, ~10 min)

```bash
git clone https://github.com/cagarcia-design/qa-rotoplas.git
cd qa-rotoplas
npm install        # instala dependencias y descarga Chromium (postinstall)
```

> `npm install` ya descarga el navegador (Chromium) por el `postinstall`. Si por alguna
> razón faltara, córrelo a mano: `npx playwright install chromium`.

## Uso diario

```bash
npm run dashboard               # Panel web local → http://127.0.0.1:4599 (RECOMENDADO)
npm run check:b2c               # Run rápido SIN efectos secundarios (health + contracts + content)
npm run check:b2c:anon          # Solo checks que NO requieren login
npm run report                  # Reporte HTML del último run
```

### Checks profundos ON-DEMAND (hacen efectos reales — fuera del run rápido)

```bash
npm run check:b2c:purchase      # Compra E2E real (login→checkout→Pagar) → nº de orden. QA-only.
npm run check:b2c:login         # Login camino feliz: credenciales válidas → sesión. QA-only.
npm run check:b2c:forms:email   # Forms con efecto: forgot-password → correo de reset (QA+prod).
```

> Estos crean datos/correos reales y por eso NO entran en `check:b2c` (tienen tag `@smoke`).
> La verificación de que el correo LLEGÓ es por agente (Gmail MCP, Modo A): el spec hace el
> submit + imprime `@@EMAIL_EXPECT {to,subjectRe,sinceTs}` y el agente/dashboard confirma el
> arribo. Con App Password de Gmail (`GMAIL_IMAP_PASS`) la verificación corre autónoma por IMAP.

### Para la ruta autenticada (carrito/checkout)

Los tests con tag `@auth` necesitan una sesión guardada. Generarla **una vez**:

```bash
npm run auth:b2c                # Login → rotoplas-auth-b2c.json
```

Luego ya puedes correr `npm run check:b2c` completo (incluye carrito y checkout).

### Apuntar a otro ambiente (ej. producción)

Desde el **panel**: usa el selector de ambiente arriba a la derecha (**QA / Producción**).
En producción solo corren los checks de lectura; crear orden y correos quedan deshabilitados.

Desde la **CLI**:

```bash
B2C_BASE_URL=https://rotoplas.com.mx npm run check:b2c
```

## Estructura del proyecto

```
├── README.md
├── GUIA-PARA-CORRER-EL-PANEL.md   ← Guía paso a paso para no-técnicos
├── package.json                    ← npm install && npm run dashboard
├── playwright.config.js            ← Configuración de Playwright
├── setup-auth-b2c.js               ← Login → rotoplas-auth-b2c.json
├── overview.md                     ← Documento vivo del ticket (CAs, estado)
├── bugs-b2c.md                     ← Inventario de bugs conocidos (~551 bugs)
├── inventario-ctas.md              ← Mapeo DOM exhaustivo del sitio
├── scripts/
│   ├── dashboard.js                ← Panel web local (servidor HTTP)
│   ├── dash-reporter.js            ← Reporter Playwright para el panel
│   ├── crear-orden-b2c.js          ← Crea órdenes de prueba por UI
│   ├── capa2-run.js                ← Pipeline CT → correo (autónomo)
│   ├── check-imap.js               ← Verifica conexión IMAP
│   └── ct-api.js                   ← Cliente Commercetools API
└── tests/
    ├── _helpers.js                  ← Helpers compartidos (irA, seedCobertura…)
    ├── _targets.js                  ← URLs, producto de prueba, fixture CP
    ├── _email.js                    ← Verificación de correos (IMAP)
    ├── 0-health.contract.spec.js    ← Capa 0: ¿las URLs dan 200?
    ├── 0-links.contract.spec.js     ← Capa 0: ¿links del footer funcionan?
    ├── 1-content.contract.spec.js   ← Capa 1: ¿renderiza contenido real?
    ├── 1-catalog.contract.spec.js   ← Capa 1 (N1): categorías LISTAN productos + PDP alcanzable
    ├── 1-global-layout.contract.spec.js ← Capa 1: header/nav/footer
    ├── 1-home.contract.spec.js      ← Capa 1: carrusel, soluciones
    ├── 1-pdp.contract.spec.js       ← Capa 1: plantilla PDP
    ├── 1-login.smoke.spec.js        ← Capa 2 (N2) @smoke: login válido → sesión (QA-only)
    ├── 2-pci-baseline.contract.spec.js ← Baseline PCI @auth: guard BUG-119 (PAN expuesto)
    ├── 3-money-path-purchase.smoke.spec.js ← Capa 2 (N2) @smoke: compra E2E → nº de orden (QA-only)
    ├── 4-forms-email.smoke.spec.js  ← Capa 2 (N2) @email: submit + el correo SALE
    ├── 1-forms.contract.spec.js     ← Capa 1: formularios (login, signup…)
    ├── 1-contacto.contract.spec.js  ← Capa 1: página de contacto
    ├── 1-faq.contract.spec.js       ← Capa 1: FAQs
    ├── 1-distribuidores.contract.spec.js ← Capa 1: distribuidores
    ├── 1-legales.contract.spec.js   ← Capa 1: páginas legales
    ├── 1-servicios.contract.spec.js ← Capa 1: página de servicios
    ├── 1-servicio-lavado.contract.spec.js ← Capa 1: wizard cotización lavado
    ├── 2-cart-empty.contract.spec.js ← Capa 1 @auth: carrito vacío
    ├── 2-customer.contract.spec.js   ← Capa 1 @auth: /customer y subpáginas
    ├── 2-money-path.contract.spec.js ← Capa 1 @auth: PDP → carrito → checkout
    └── 3-capa2-pipeline.contract.spec.js ← Capa 2: pipeline CT → correo
```

## Documentación de referencia

- **Arquitectura completa + historial de sesiones:** `overview.md` (ADR en sección F6)
- **Inventario DOM exhaustivo del sitio:** `inventario-ctas.md`
- **Bugs conocidos (baseline):** `bugs-b2c.md`
- **Guía para correr el panel:** `GUIA-PARA-CORRER-EL-PANEL.md`

## Requisitos

- Node.js 18+
- Chromium de Playwright (lo baja `npm install` vía postinstall)
- [Opcional] `.env` con las 6 llaves `CT_*` (Commercetools) para estados de orden y correos.
  **No se captura en el panel; viene del `.env` compartido en privado** (gitignored).
- [Opcional] `.env` con `GMAIL_IMAP_USER` y `GMAIL_IMAP_PASS` para verificación de correos (Modo B)
