# Rediseño del panel QA B2C — Especificación + plan

> **Qué es este doc:** la fuente de verdad del **rediseño/reestructura del dashboard** (`scripts/dashboard.js`).
> Define la nueva arquitectura de información, las decisiones tomadas (con su porqué) y el plan de implementación por fases.
> **No** recopia el ADR del sistema de checks (eso vive en `overview.md` §F6) ni la cobertura (eso vive en `tests/contracts/b2c/COBERTURA.md`); los referencia.
>
> **Estado:** **IMPLEMENTADO (2026-06-23)** — F0–F7 entregados y verificados en vivo: F0, F1, F2, F4, F5 + evidencias organizadas + **F3 completo** (calidad transversal: errores/enlaces `6-xcut` + **Performance `8-perf` Lighthouse/CWV**) + **F7** (Catálogo/PDP a fondo `7-pdp-flujo`). El `scripts/dashboard.js` ya es el rediseño por área (mapa 7×4, secciones colapsadas por defecto como tarjetas, prereq strip, resumen salud+cobertura, drawer Investigar, modal Ajustes, galería de evidencias, **exportar Markdown · cancelar corrida · notificación · regenerar sesión contextual**). **Móvil** (columna completa, las 7 áreas) y **flujos de área** (buscador · soluciones · contacto) corribles por celda. Cobertura del mapa: **26/27 celdas** (solo resta Servicios Flujo = compra de servicio mutante). Pendiente de roadmap: faq acordeón/distribuidores · compra de servicio (mutante) · calidad transversal a11y/SEO/seguridad/visual. Ver §15 (estado por fase).
>
> _Historia: DISEÑO APROBADO 2026-06-19; la supuesta "plomería rota" fue un falso diagnóstico por leer un checkout stale — el repo activo estaba sano (§2)._
> **Origen:** sesión de arquitectura del 2026-06-19. El detonante fue una incoherencia notada por el usuario
> (validaciones disparejas y dispersas entre "home" y "pdp/categorías") que reveló un problema de fondo:
> **la UI creció por acreción, no por diseño** — varias taxonomías encimadas, conceptos duplicados, feedback fragmentado.

---

## 1. Principio rector

**Un solo eje organizador: por ÁREA del sitio.** Un único hogar por concepto. Las secciones del panel se separan por **naturaleza de la acción**, que es el único corte que no se encima:

1. **Monitorear** (solo lectura) — el mapa por área.
2. **Mutar** (crea datos reales) — barra cercada "Datos de prueba", QA-only.
3. **Investigar** (consulta) — panel contextual.
4. **Configurar** — modal de ajustes.

Se conserva el principio que ya funciona bien: **avance en vivo** (livebar sticky + lista de tests + cronómetro + "enciende cada celda" mientras corre).

---

## 2. Paso 0 — Verificación de entorno + prep (antes de tocar la UI)

**⚠️ Corrección 2026-06-19:** un diagnóstico inicial creyó la plomería rota (config / `capa2-run` / README desincronizados). Era un **espejismo**: se leyó un **checkout STALE** paralelo (`~/Documents/rotoplas-qa`, "Initial commit" 06-16, estructura vieja con `tests/contracts/b2c/`), no el repo activo.

**El repo ACTIVO es ESTE (`tickets/regresiones-smoke-b2c`)** — su `playwright.config.js` usa `testMatch:['**/*.spec.js']` sobre `tests/` aplanado (23 specs), `capa2-run.js` apunta bien a `tests/_email`, el README no tiene refs rotas y no existe `tests/contracts/`. **No hay plomería que arreglar.** Regla: trabajar SIEMPRE dentro de este repo; nunca tocar el checkout externo de `rotoplas-qa` (verificar con `git rev-parse --show-toplevel`).

Prep real que sí queda en el Paso 0:
- [ ] **`_targets.js` — slicing por área:** añadir campo `area` a cada `HEALTH_URL` para llenar la celda **"Responde" por área** (hoy health/content son monolíticos).
- [ ] **`COBERTURA.md`** no existe en el repo activo (solo estaba en el checkout stale) → recrearlo en `tests/COBERTURA.md` o quitar sus referencias.
- [ ] **Commit** del trabajo untracked — diferido por el usuario.

**Anti-flaky en la fuente (decisión del usuario):** antes de features de panel, auditar y **endurecer los specs flaky** (selectores/esperas) + evaluar **bajar workers** para reducir el *starve* de hidratación Qwik. Atacar la causa, no el síntoma. Ver §7.

---

## 3. Estructura de la página (una sola, scroll, orden de flujo)

```
┌ BARRA SUPERIOR ───────────────────────────────────────────┐
│ marca · ambiente [QA▾] · [▢ Ver navegador] · ⚙️ Ajustes    │
├ TIRA DE PREREQUISITOS (semáforo) ─────────────────────────┤
│ ● sesión B2C  ● IMAP  ● CT creds  ● sitio alcanzable       │
├ ACCIÓN MAESTRA ───────────────────────────────────────────┤
│ [ ▶ Revisar sitio ]   (solo lectura · enciende celdas)     │
│ ── livebar en vivo: Probando X · i/N · ✓✘– · ver detalle ──│
├ RESUMEN GLOBAL ───────────────────────────────────────────┤
│ Salud: ● 18  ✕ 1  ○ 3     Cobertura: 22/28 celdas · 6 ⏳    │
├ MAPA POR ÁREA (7 × 4) ────────────────────────────────────┤
│  (ver §4)                                                  │
│  Bugs conocidos vigilados: 4 (0 arreglados)               │
├ CALIDAD TRANSVERSAL ──────────────────────────────────────┤
│  Errores y enlaces ●   Performance ●   (ver §5)            │
├ DATOS DE PRUEBA  (cercado · QA-only) ─────────────────────┤
│  Pedido de prueba: crear → línea de tiempo (ver §6)        │
├ HISTORIAL ────────────────────────────────────────────────┤
│  últimas 15 corridas (lista simple)                        │
└───────────────────────────────────────────────────────────┘
   [ drawer "Investigar" se abre por encima, a la derecha ]
   [ modal "Ajustes" se abre desde ⚙️ ]
```

**Navegación:** una sola página scrolleable, sin pestañas ni sidebar. **Ambiente:** selector QA/Prod; en Prod se bloquean las mutaciones (guard `PROD_BLOCKED` en el servidor). **Ver navegador:** toggle global, **default headless**. **Visual:** se refina la estética sobre la identidad actual (azul Rotoplas), sin cambiar de lenguaje visual.

---

## 4. El mapa por área (corazón)

**7 áreas × 4 columnas.** Orden: lectura arriba, mutantes 🔒 abajo (pegadas a "Datos de prueba").

| # | Área | Responde | Estructura | Flujo | Móvil |
|---|---|---|---|---|---|
| 1 | **Header y Footer** *(ex "Cascarón global")* | — | `1-global-layout` ✓ (+ chatbot · newsletter · promo) | buscador busca ✓ | ✓ |
| 2 | **Home** | `/` ✓ | `1-home` ✓ | selector soluciones navega ✓ | ✓ |
| 3 | **Catálogo / PDP** | 7 categorías ✓ | `1-pdp` + `1-catalog` ✓ | `7-pdp-flujo` ✓ (galería · acordeones · CP) | ✓ |
| 4 | **Servicios** | hub + lavado ✓ | `1-servicios` + `1-servicio-lavado` ✓ | `7-servicios-flujo` ✓ (cotización → carrito) | ✓ |
| 5 | **Institucional / Contenido** | contacto/faq/distrib/legales + nosotros/blog/recursos ✓ | …`1-legales` + `1-contenido` ✓ | `9-flujo-areas` ✓ (contacto submit) · faq/distrib ⏳ | ✓ |
| 6 | **Compra (carrito → pago → post-venta)** 🔒 | cart/checkout1 + seguimiento ✓ | `2-cart-empty` + `2-money-path` + `2-seguimiento` ✓ | `3-money-path-purchase` ✓ *(mutante, candado)* | ✓ |
| 7 | **Mi cuenta** 🔒 | login/signup/forgot ✓ | `2-customer` + `2-pci-baseline` + `1-forms` ✓ | `1-login` ✓ *(mutante, candado)* | ✓ |

> **Cambios de taxonomía (s29):** 0-links salió de Estructura → transversal "Errores y enlaces" (`@xcut`); Seguimiento `/traking/` pasó de Mi cuenta → Compra (post-venta, anónimo); Nosotros/Blog/Recursos adoptados en Institucional/Contenido; `1-forms` se sumó a Estructura de Mi cuenta; Servicios Flujo encendido (wizard A/B pineado); cascarón profundizado (chatbot/newsletter/promo); bloqueos externos → centinelas `@bloqueo` (`9-centinelas`).

**Reglas del mapa:**

- **Estados de celda:** ✓ ok · ✕ falla · ○ omitido (auth/sesión) · ⏳ **pendiente** (sin prueba aún → link a `COBERTURA.md`) · gris (sin correr en esta sesión). Se **restaura** el último estado de cada celda al recargar (localStorage, como hoy con los pills).
- **Correr un área** = sus dimensiones de **lectura** (Responde + Estructura + Móvil) juntas. **El Flujo mutante NO** se corre con el área.
- **Flujo mutante** (Compra, Mi cuenta, y los futuros de Catálogo/Servicios/Institucional cuando muten) se dispara **aparte, con candado** (botón propio, QA-only, confirmación). La celda Flujo **refleja** el último resultado. Así "Revisar sitio" (maestro) queda **100% solo-lectura**.
- **"Revisar sitio"** corre todas las áreas en lectura y **enciende cada celda** en vivo (arregla el desconectado de hoy, donde el run global dejaba las zonas en "—").
- **Detalle inline:** al correr/clic en un área, su fila se expande ahí mismo con la **lista de tests** (✓/✕ + **motivo en español** + triage) y el **log técnico** colapsable.
- **Móvil:** columna **diseñada pero pendiente** (⏳) — está parqueada (`5-mobile` en `test.skip` WIP). Reactivar después (ver §9 roadmap).
- **Bugs conocidos vigilados:** línea **aparte** bajo el mapa (no carga las celdas): `Bugs conocidos vigilados: N (0 arreglados)`. Cubre los `bugConocido`/expected-fail: BUG-001 (Home sin H1), BUG-015 (logo no `<a>`), BUG-003 (Contacto→FAQ), BUG-119 (PCI PAN). Si uno **pasa** (se arregló) → avisar "cerrar ticket".

**Resumen global** (arriba del mapa): **Salud** (✓/✕/○ de la última corrida) + **Cobertura** (celdas con prueba / total · cuántas ⏳). Responde dos preguntas de un vistazo: *¿está sano este deploy?* y *¿cuánto del sitio cubrimos?*

---

## 5. Calidad transversal (sección nueva, site-wide)

No caben como columnas del mapa (lo harían ilegible). Van en su propia sección, una fila por categoría. **Alcance de este rediseño** (lo elegido por el usuario):

- **Errores y enlaces** — errores de consola JS nuevos por página · links a **destino correcto** (no solo 200; BUG-003 es justo un link 200 que va al lugar equivocado) · 404/catchall (BUG-518: `/feed/` da falso-200).
- **Performance** — Lighthouse / Core Web Vitals por página clave (Home, PDP). **Sin** regresión visual (descartada en esta ronda).

**Roadmap (no en esta ronda):** Accesibilidad (a11y) · SEO/meta · Seguridad (PII en red, cookies HttpOnly, headers) · Regresión visual. El baseline **PCI** (`2-pci-baseline`) ya existe y se refleja en "bugs vigilados".

---

## 6. Datos de prueba — "Pedido de prueba" (ciclo de vida)

Fusiona las dos tarjetas que hoy se duplican ("Crear orden" + "Correos"; `capa2-auto` ya crea una orden por dentro). Son el **mismo objeto en distintas etapas**. Vive en la **barra cercada** (QA-only, bloqueada en prod).

```
PEDIDO DE PRUEBA
  Crear:  [Tipo: físico/servicio ▾] [Pago: crédito/débito/transf/efectivo ▾] [▶ Crear]
          → nº de orden: 6XXXXXXXXX  [copiar] [🔎 Investigar esta orden]

  Línea de tiempo del pedido:
    Creada ● ── Confirmada ○ ── En camino ○ ── Punto de entrega ○ ── Entregada ✋
              [avanzar]        [avanzar]         [avanzar]            (gate manual)
              correo:          correo:           correo:
              "fue confirmado" "está en camino"  "en punto de entrega"
              ✓ llegó / ver inbox

  [▶ Pipeline auto]  (atajo: crear + transiciones reproducibles en secuencia,
                      pintando la línea de tiempo en vivo)
```

- **Avanzar estados:** mueve el estado vía CT (`ct-api`). Cablea a la UI el `move-state`/`STATE_MAP` que **el server ya tiene pero nunca expuso**.
- **Correo por paso:** muestra el asunto esperado (de `_email.js` `CORREO_REPRODUCIBLE`) y si llegó. Respeta el **contrato secuencial** (esperar el correo entre transiciones; disparar en ráfaga pierde correos).
- **Verificación de correos — ambos modos por igual:** si hay App Password (Modo B) → verificación **automática** por IMAP; si no (Modo A) → **checklist** con el asunto esperado + link directo al inbox de `ventasecom@rotoplas.com` para confirmar a ojo. El operador no depende de un agente.
- **Entregada** = gate manual (portal B2B + imagen de prueba de entrega; irreproducible vía CT por diseño — ver `_email.js`).

---

## 7. Estrategia anti-flaky

**Decisión: endurecer en la fuente primero.** El riesgo #1 del panel es la **confianza**: si grita rojos que no son regresiones, la suite se apaga.

**Fuentes de flaky de este sitio:** hidratación Qwik (CSR lazy), QuantumMetrics (nunca `networkidle`), A/B Builder.io (wizard BUG-457), nodos duplicados desktop/mobile (BUG-005), *starve* de lazy-render bajo 4 workers, 503 transitorio de infra.

**Ya mitigado (preservar en la reescritura):** `domcontentloaded`+settle · `scrollAlFondo` espera el footer real · `seedCobertura` (PDP determinista) · `mode:serial` en carrito compartido · `statusDe` reintenta transitorios · `retries:2` (red de seguridad) · el panel **deduplica** reintentos y distingue *flaky (recuperado)* de *roto*.

**Plan:**
1. **Endurecer specs flaky actuales** (Paso 0): auditar selectores/esperas frágiles; el residual conocido es footer + solución-finder de Home bajo carga → endurecer o **bajar workers**.
2. **El flaky no es verde feliz:** en el resumen cuenta como "pasó (con reintento)" pero se lista como **deuda visible**, no se celebra.
3. **Cuarentena** de lo inherentemente inestable y conocido (wizard A/B): marcar **esperado-flaky** sin esconderlo (sigue visible y contado).

**Roadmap (no en esta ronda):** vigilancia de reincidentes en el tiempo + causa probable por flaky.

---

## 8. Profundidad funcional priorizada: Catálogo / PDP a fondo

Llenar la celda **Flujo** de Catálogo/PDP (hoy ⏳), elevándola de N0 a N1:

- **add-to-cart real** — que "Agregar" agregue y **persista** (no solo que el botón exista).
- **galería** — que muestre *este* producto.
- **filtros / orden** de categoría funcionan.
- **acordeones** (descripción / especificaciones) abren.
- **disponibilidad por CP** — el modal resuelve y habilita la compra.

(Otras profundidades — Compra completa, Mi cuenta, Institucional interactivo — quedan en el roadmap §9.)

---

## 9. Roadmap (definido, fuera del alcance de esta ronda)

- **Móvil:** reactivar `5-mobile` (arreglar el check de overflow REAL en vez de `scrollWidth`; anclar la hamburguesa al svg/span interno; viewport 375 explícito). Llena la columna Móvil.
- **Calidad transversal:** a11y · SEO/meta · Seguridad (PII/cookies/headers) · Regresión visual.
- **Profundidad funcional:** Compra (total cuadra, tarjeta rechazada, transferencia/efectivo E2E, descuento, búsqueda→compra) · Mi cuenta (orders lista, address CRUD, cambiar contraseña) · Institucional (contacto submit, faq acordeón, distribuidores encadenado, newsletter).
- **Operación:** diff vs última corrida verde · corridas programadas post-deploy (CI ya existe apagado) + alertas · vigilancia de flaky en el tiempo.

---

## 10. Adiciones nuevas (todas, en alcance)

- **Ver capturas de evidencia** de la última corrida (el script ya las guarda en `evidencias/`; hoy no se ven) → endpoint del server + galería en la UI.
- **Enlace al reporte HTML de Playwright** (trace rico) además del log crudo.
- **Exportar/compartir resumen** en **Markdown** (pegar en Jira/Slack): áreas, salud, qué falló + motivo.
- **Cancelar** una corrida en curso + **notificación** del navegador al terminar una larga (compra E2E ~3 min).
- **Regenerar sesión B2C** contextual (ofrecerlo cuando un área `@auth` hace skip por sesión expirada).
- **Enlace a `COBERTURA.md` / roadmap** desde las celdas ⏳.
- **Tira de prerequisitos** (semáforo): sesión B2C válida · IMAP configurado · CT creds · sitio alcanzable. Explica skips/fallos *antes* de correr.

---

## 11. Investigar y Ajustes

- **Investigar (drawer contextual):** se abre sobre **cualquier** nº de orden (pegado o vía "Investigar esta orden") → estado / pagos / historial CT (`ct-api`) + bandeja de correos. No ocupa espacio fijo.
- **Ajustes (modal ⚙️):** recortado a **Sesión B2C** (`B2C_USER`/`B2C_PASS`) + **Gmail App Password** (`GMAIL_IMAP_*`). Fuera BrowserStack y API interna (no se usan aquí). Incluye **Generar sesión B2C** y **Probar IMAP**. Indicador de completitud.

---

## 12. Implementación — qué se preserva y qué se reescribe

**Reescritura limpia** del `PAGE` (HTML/CSS/JS de cliente) sobre el modelo por área.

**Se preserva** del server (probado y funcionando):
- SSE (`streamRun`), reporter `@@DASH` (`dash-reporter.js`), parsing de resumen.
- IMAP (`listEmails`), `ct-api` (estado/pagos/historial/move-state), `_email.js` (waitForEmail).
- `buildCommand`, `ALLOWLIST`/`ACTIONS`, `AREAS`, `STATE_MAP`, `PROD_BLOCKED`, `saveEnv`.

**Se extiende** el server con:
- Cableado de `move-state` a la UI (línea de tiempo del pedido).
- Slicing **área → URLs** para "Responde" (depende del Paso 0 en `_targets.js`).
- Endpoint de **evidencias** (listar/servir PNGs de `evidencias/`).
- Enlace al **reporte HTML** de Playwright.
- Run **por área en modo lectura** (Responde+Estructura+Móvil) vs **Flujo con candado** por separado.

> ⚠️ Gotcha conocido: el `PAGE` se carga en memoria al arrancar el server → tras editar, **reiniciar** `node scripts/dashboard.js` (no basta recargar el browser).

---

## 13. Plan por fases

| Fase | Alcance | Depende de |
|---|---|---|
| **F0 · Prep + anti-flaky en la fuente** | (plomería NO requerida — ver §2) · slicing área→URL en `_targets` · recrear `COBERTURA.md` en `tests/` · endurecer specs flaky / bajar workers · commit (diferido) | — |
| **F1 · Esqueleto UI** | Reescritura del `PAGE`: barra superior, prereq strip, acción maestra + livebar, resumen, secciones vacías. Preservar server | F0 |
| **F2 · Mapa por área** | 7×4 celdas, estados, ⏳ pendientes, detalle inline, restaurar estado, correr-área (lectura) + Flujo con candado, indicador bugs vigilados, server: run por área + move-state | F1 |
| **F3 · Calidad transversal** | Sección + specs nuevos: consola JS · links a destino · 404 · Lighthouse | F2 |
| **F4 · Datos de prueba** | "Pedido de prueba" ciclo de vida + línea de tiempo + move-state UI + correos (IMAP/Modo A) + pipeline auto | F2 |
| **F5 · Investigar + Ajustes** | Drawer contextual (cualquier nº) + integración con pedido creado · modal de ajustes recortado | F2 |
| **F6 · Adiciones** | Evidencia · reporte HTML · exportar markdown · cancelar+notificación · regenerar sesión contextual · enlace COBERTURA | F2 |
| **F7 · Profundidad Catálogo/PDP** | Specs N1: add-to-cart real · galería · filtros · acordeones · disponibilidad CP | F0 |

**Cadencia sugerida:** F0 es prep ligera (no hay plomería rota — ver §2). F1–F2 son el núcleo del rediseño. F3–F7 son incrementos componibles.

---

## 14. Registro de decisiones (trazable)

Cerradas con el usuario el 2026-06-19, vía preguntas estructuradas:

1. Eje primario: **por área del sitio** (rebanar lo transversal por área).
2. Dimensiones por área: **4 columnas** — Responde · Estructura · Flujo · Móvil.
3. Acciones mutantes: **barra global cercada** "Datos de prueba", QA-only.
4. Botón maestro: corre todo (lectura) y **enciende cada celda**.
5. Navegación: **una página**, secciones en orden de flujo.
6. Investigar: **panel contextual** (drawer), cualquier nº.
7. Ajustes: **modal desde engranaje**, recortado a B2C + Gmail.
8. Visual: **IA + estética pulida** sobre identidad actual.
9. Huecos: **marcar "pendiente"** ⏳ (roadmap + link COBERTURA).
10. Ejecución: clic corre **toda el área** (lectura); Flujo mutante aparte con candado.
11. Historial: **lista simple**.
12. Ambiente: **mantener QA/Prod**, prod = solo lectura.
13. Detalle: **inline bajo el área**.
14. Bugs vigilados: **indicador aparte**.
15. Resumen global: **salud + cobertura**.
16. Móvil: **columna pendiente** (parqueada).
17. Nombres: arreglar "Cascarón global" → **"Header y Footer"**; "Ruta del dinero" → **"Compra (carrito → pago)"**.
18. Crear orden ↔ Investigar: **enlace directo + búsqueda libre**.
19. "Ver navegador": **mantener, default headless**.
20. Crear orden + Correos: **fusionar en "Pedido de prueba"** con línea de tiempo (expone move-state).
21. Verificación de correos: **ambos modos** (IMAP auto / Modo A checklist).
22. Adiciones: **todas** (§10).
23. Prerequisitos: **tira semáforo**.
24. Orden de áreas: **lectura arriba, mutantes 🔒 abajo**.
25. Exportar: **Markdown**.
26. Calidad transversal: **Errores y enlaces + Performance** (sin visual; a11y/SEO/seguridad → roadmap).
27. Profundidad funcional: **Catálogo/PDP a fondo**.
28. Anti-flaky: **endurecer en la fuente primero**.
29. Implementación: **reescritura limpia** (preservar server). Paso 0 = prep ligera (slicing área en `_targets`, recrear `COBERTURA.md`); **no hay plomería rota** (era un checkout stale).
30. Este doc vive en **archivo propio** (no en el overview).

---

## 15. Estado por fase (implementación 2026-06-23)

| Fase | Estado | Notas |
|---|---|---|
| **F0 · Prep** | ✅ | `area` por HEALTH_URL + `healthUrls()` (slicing por `DASH_AREA`) + URL de Servicios; `tests/COBERTURA.md` recreado. |
| **F1 · Esqueleto UI** | ✅ | Barra superior (ambiente/ver navegador headless-default/⚙), prereq strip (semáforo: sitio/B2C/IMAP/CT), acción maestra + livebar sticky, resumen salud+cobertura. |
| **F2 · Mapa por área** | ✅ | 7×4 celdas con estados (✓/✕/○/⏳/—), correr-celda + correr-área (secuenciador) + "Revisar sitio" (master, lectura), Flujo mutante con candado, restaurar estado, bugs vigilados, detalle inline. Secciones **colapsadas por defecto** como tarjetas. |
| **F3 · Calidad transversal** | ✅ | "Errores y enlaces" = `6-xcut.contract.spec.js` (`@xcut`): excepciones JS no capturadas + baseline 404/catchall BUG-518. **Performance = `8-perf.contract.spec.js` (`@perf`): Lighthouse + Core Web Vitals (Home, PDP) vía `lighthouse`+`chrome-launcher` sobre el Chromium de Playwright (mobile).** Anti-flaky: categorías deterministas (a11y/bp/seo) con piso cercano al baseline fresco; perf-score + CWV solo con pisos de catástrofe; skip limpio si faltan deps. Cableado al panel (acción `perf`, on-demand, fuera del run rápido). Roadmap a11y/SEO/seguridad/visual queda para otra ronda. |
| **F4 · Datos de prueba** | ✅ | Pedido + línea de tiempo (avanzar estado vía `move-state` con los estados del contrato Capa 2) + correo esperado por paso + pipeline auto. Cercado QA-only. |
| **F5 · Investigar + Ajustes** | ✅ | Drawer Investigar (cualquier nº → ct-api estado/pagos/historial + correos IMAP) + modal Ajustes (B2C + Gmail, generar sesión, probar IMAP). |
| **F6 · Adiciones** | ✅ | Galería de **evidencias** organizadas + enlace al **reporte HTML** (s27) · **Exportar Markdown** (resumen áreas/salud/cobertura/fallos al portapapeles, `buildMarkdown`) · **Cancelar corrida** (botón en livebar → cierra el SSE → el server mata el proceso hijo; detiene la cola) · **Notificación del navegador** al terminar corridas largas (≥25 s) · **Regenerar sesión B2C contextual** (botón inline en el triage de skip `@auth`, solo QA) — todo verificado en vivo (s28). |
| **Flujos de área** | ◑ mayoría | `9-flujo-areas.contract.spec.js`: Header buscador → SRP (`@flheader`) · Home selector de soluciones → categoría (`@flhome`) · Institucional contacto valida submit vacío (`@flinst`). Cableados al panel (acciones `header-flujo`/`home-flujo`/`institucional-flujo`, tags por área sin substring `@flujo`). Verde + celdas encendidas en vivo (s28). Resta residual: faq acordeón (BUG-091) · distribuidores · compra de servicio (mutante, diferido). |
| **F7 · Catálogo/PDP a fondo** | ✅ | `7-pdp-flujo.contract.spec.js` (`@flujo`, N1): galería muestra ESTE producto (SKU 310002) · acordeones `<details>` abren · compra habilitada por CP (seed). El add-to-cart que PERSISTE vive en `2-money-path @auth`. Cableado al panel (acción `pdp-flujo`). Resta no bloqueante: filtros/orden de categoría. |
| **Móvil** | ✅ columna completa (7 áreas) | `5-mobile` con 9 tests verdes: Home (hamburguesa abre `.mobile-menu-content` vía `button[aria-label="Abrir menú"]`, desparqueado) · PDP/catálogo · footer global (cascarón) · servicios · contacto (institucional) · carrito (compra) · customer (mi cuenta, @auth). Todos verifican shell que renderiza + overflow REAL a 375px. **El panel corre Móvil por área** (acción `area-movil`, recorta `5-mobile` por título; `q()` cita patrones con espacios). Cobertura del mapa: **26/27 celdas** (solo resta Servicios Flujo = compra de servicio mutante). |

**Verificación en vivo (2026-06-23):** boot + endpoints, render sin errores JS de consola, Responde (slicing `DASH_AREA`) + Estructura por área en verde, secuenciador, drawer con datos reales de ct-api, galería con capturas reales, `@xcut` desde el panel (3 ok + baseline). Regresión anon **77 passed · 2 flaky · 0 fail**.

**Cierre F3 Performance (s28, 2026-06-23):** `8-perf` (`@perf`) corre Lighthouse 13 + chrome-launcher sobre el Chromium de Playwright (mobile). Verificado: **2 corridas seguidas verdes** con categorías deterministas idénticas run-to-run (Home a11y 89 · bp 58 · seo 100 ; PDP a11y 79 · bp 58 · seo 85) y perf-score estable (Home ~44 · PDP ~50), CWV bajo pisos de catástrofe. Panel: botón en la fila Performance + `/stream?action=perf` arma `--grep @perf`; excluido del run rápido y de "Revisar sitio". Baseline re-anclado a esta herramienta (los números s12 eran de DevTools MCP, no comparables).

**Cierre Móvil + F6 adiciones + flujos de área (s28, 2026-06-23):** verificado **interactivamente en el panel** (chrome-devtools): celda **Móvil** de Catálogo/PDP → corre → enciende verde; celda **Flujo** de Home → corre → verde; **Exportar Markdown** genera el resumen correcto; **Cancelar** detiene una corrida del maestro y resetea estado (`running=false`, livebar "Corrida cancelada"). Cobertura del mapa subió a **21/27 celdas**. (Tras completar la columna Móvil con las 5 áreas restantes y los 3 flujos de área: **26/27 celdas**; único ⏳ = Servicios Flujo mutante.) Regresión anon completa final: **96 passed · 1 flaky · 0 fail** (flaky preexistente de content, recuperado en retry).
