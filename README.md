# QA Rotoplas — Smoke Tests B2C

Suite autónoma de **pruebas de humo estructurales post-deploy** para `qarotoplasmx.io`.
Detecta regresiones de DOM en segundos: botones que desaparecen, links rotos, secciones que
dejan de renderizar. Todo corre con un panel web local, sin memorizar comandos.

## Setup (primera vez, ~10 min)

```bash
git clone https://github.com/cagarcia-design/qa-rotoplas.git
cd qa-rotoplas
npm install
npx playwright install chromium
```

## Uso diario

```bash
npm run dashboard               # Panel web local → http://127.0.0.1:4599 (RECOMENDADO)
npm run check:b2c               # Todo (health + contracts + content, ~1 min)
npm run check:b2c:anon          # Solo checks que NO requieren login
npm run report                  # Reporte HTML del último run
```

### Para la ruta autenticada (carrito/checkout)

Los tests con tag `@auth` necesitan una sesión guardada. Generarla **una vez**:

```bash
npm run auth:b2c                # Login → rotoplas-auth-b2c.json
```

Luego ya puedes correr `npm run check:b2c` completo (incluye carrito y checkout).

### Apuntar a otro ambiente (ej. producción)

```bash
B2C_BASE_URL=https://rotoplasmx.com npm run check:b2c
```

## Estructura del proyecto

```
├── README.md
├── GUIA-PARA-CORRER-EL-PANEL.md   ← Guía paso a paso para no-técnicos
├── package.json                    ← npm install && npm run dashboard
├── playwright.config.js            ← Configuración de Playwright
├── setup-auth-b2c.js               ← Login → rotoplas-auth-b2c.json
├── overview.md                     ← Documento vivo del ticket (CAs, estado)
├── bugs-b2c.md                     ← Inventario de bugs conocidos (574 bugs)
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
    ├── 1-global-layout.contract.spec.js ← Capa 1: header/nav/footer
    ├── 1-home.contract.spec.js      ← Capa 1: carrusel, soluciones
    ├── 1-pdp.contract.spec.js       ← Capa 1: plantilla PDP
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

- **Arquitectura completa:** `overview.md` (sección F6)
- **Cómo leer un ROJO:** `tests/contracts/b2c/README.md` (sección "Cómo se mantiene")
- **Cobertura de contratos:** `tests/contracts/b2c/COBERTURA.md`
- **Guía para no-técnicos:** `GUIA-PARA-CORRER-EL-PANEL.md`

## Requisitos

- Node.js 18+
- Playwright Chromium (`npx playwright install chromium`)
- [Opcional] `.env` con `CT_CLIENT_ID` y `CT_CLIENT_SECRET` para consultas vía API
- [Opcional] `.env` con `GMAIL_IMAP_USER` y `GMAIL_IMAP_PASS` para verificación de correos (Modo B)
