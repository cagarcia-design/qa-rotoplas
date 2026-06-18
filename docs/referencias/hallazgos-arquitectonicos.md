# Hallazgos arquitectónicos del sitio B2C

## Framework — Qwik (Builder.io)

- **Resumability:** handlers cargan lazy al primer evento → clicks tempranos fallan. Usar click CDP real.
- **CSS scoping:** clases con prefijo emoji `⭐️` — NO bug, es convención.
- **CMS visual:** assets desde `cdn.builder.io`.

## Pila de tracking (carga sin consentimiento)

GA4, Google Ads, Facebook Pixel, Quantum Metric, Dialogflow — **BUG-006:** cargan ANTES de consentimiento.

## Tres CMS coexistiendo

1. **Builder.io** — layouts, cards, blog contenedor, nosotros
2. **commercetools** — catálogo, listings
3. **WordPress** — posts individuales del blog

## Cinco origins de imágenes

| Origin | Tipo |
|--------|------|
| `rtp-bucket-b2b-qa` | QA |
| `rtp-bucket-b2b-qas` | QA (typo) |
| `rtp-bucket-b2b-prd` | ⚠️ PROD en QA |
| `cdn.builder.io` | CMS |
| commercetools CDN | CT directo |

## Patrones sistémicos

- **Sin `<h1>` en contenido** (BUG-353) — solo H2/H3
- **Stepper sin aria-label** (BUG-318, 401) — PDP, servicios, cart
- **Cards sin `<a href>`** (BUG-147) — solo Qwik handler
- **Forms sin `<form>` tag** — inputs sueltos + botón submit
- **`required=false` global** — validación 100% JS
- **`type="text"` para email/phone** — sin keyboard mobile
