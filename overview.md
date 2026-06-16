# Regresiones-Smoke B2C — Mapeo exhaustivo de qarotoplasmx.io

> **Jira URL:** N/A (iniciativa interna, gemela del trabajo realizado en `tickets/regresiones-smoke/` para B2B)
> **Última sesión:** s24 — 2026-06-15. Dashboard: **Checks fusionados** (Health+Content → "¿Responden y renderizan?", 33 tests) + **Estructura crítica como rejilla compacta de 7 zonas** (vista primaria) + **tira fija de estado en vivo** (visible al scrollear) + **bloque de info de orden creada** (nº + Ver estado/pagos/historial vía ct-api). **Login TECLEADO real** en la compra (`crear-orden-b2c.js` default `B2C_LOGIN_MODE=type` → orden `6162026BCY8L`). Bug de herramienta arreglado (`@health|@content` pipe de shell). **Diagnóstico de profundidad de contracts → `tests/contracts/b2c/COBERTURA.md`** (mayoría N0 forma; hueco caro = money-path no completa la compra). **0 bugs del sitio. SIN COMMIT** (todo untracked).
> **Fecha de inicio:** 2026-05-27
> **Trigger:** Replicar para el sitio B2C la auditoría profunda que se hizo al B2B, generando DOM contracts post-deploy + inventario navegable

---

## Problema

El sitio B2C (`qarotoplasmx.io`) carece de una suite automática post-deploy que detecte regresiones de DOM (botones que desaparecen, links que cambian de `href`, secciones que ya no renderizan). En B2B se descubrió tarde que el botón "Cambiar contraseña" había desaparecido de `/account`; necesitamos cerrar esa misma brecha en B2C antes de que un bug equivalente llegue a producción.

---

## Estrategia

Ejercicio en 7 fases, replicando el patrón de B2B:

| Fase | Alcance | Estado |
|---|---|---|
| **F0** | Setup ticket + verificación URL + framework detection | ✅ CERRADA (2026-05-27) |
| **F1A** | Mapeo estructural ANÓNIMO (home, login, signup, forgot, contacto, FAQs, traking, header/footer global) | ✅ CERRADA (2026-05-27) |
| **F1B** | Mapeo estructural AUTENTICADO (/customer, /customer/orders, /customer/address, /customer/reviews, header autenticado, logout) | ✅ CERRADA (2026-05-27 sesión 2) |
| **F1C** | Catálogo EXHAUSTIVO — todas las categorías + PDPs | ✅ **CERRADA** (s5–s8). 8/8 categorías + 3 sub-cat + PDP representativa + I.16 Listing genérico + add-to-cart. **PDP gap-closure CERRADO (s8):** los 3 "modales" (Compartir/Reseña/CP) reusan componentes o navegan, ninguno es modal propio (II.8 §19). |
| **F1D** | Contenido marketing (blog, nosotros, distribuidores, servicios, recursos, legales) | ✅ **CERRADA** (s6–s7) — 8 páginas deep + gap-closure s7: nav submenús (I.2), 3 sub-recursos (videos/tips/librería), 2 sub-rutas /nosotros/ (presencia + quiénes-somos). Único pendiente externo: BIM Revit (cross-domain) + wizard cotización inestable (BUG-457). |
| **F2** | Gap closure: toasts, modales, drawers, validaciones, network polling | 🟢 **CERRADA** (s7–s8) — mini-cart drawer, toggle CFDI, métodos pago, modales PDP (s8), código descuento, network polling (III.3). |
| **F3** | Flujos transaccionales happy path E2E (signup, login, checkout x métodos) | ✅ **CERRADA** — Checkout E2E con tarjeta (orden 52820261OYM4), Transferencia (6520265MD5Y → confirmación "¡Solo falta un paso!" → PDF SPEI OpenPay), Efectivo (652026BIL00), tarjeta rechazada, CFDI + autofill por CP, y signup E2E. |
| **F4** | Mobile testing emulado (iPhone 12, 390x844, mobile:true) | ✅ **CERRADA core** (s8) — home/PDP/cart/customer sin overflow X, menú móvil, sticky CTA ausente (BUG-504). III.8. Pendiente menor: Lighthouse mobile + checkout móvil. |
| **F5** | Auditorías globales (WhatsApp, AG Grid, console, network) | ✅ **CERRADA** (s8) — III.2 consola, III.3 red/PII, III.4 chatbot, III.5 (no AG Grid), III.6 Lighthouse, III.7 a11y. |
| **F6** | DOM contracts ejecutables (Playwright) — `tests/contracts/b2c/` | 🔄 **EN CURSO (s14, 2026-06-07)** — ADR de arquitectura abajo. Cut 1: Capa 0 health + Capa 1 contracts anónimos, manual on-demand. **Matriz B2B↔B2C (antes Parte V) DESCARTADA el 2026-06-07.** |
| **F7** | Inventario consolidado de bugs + handoff final | ✅ **CERRADA (2026-06-05, s10)** — ruido meta eliminado; Parte IV = tabla maestra de bugs (**505 activos** al cierre s13; 487 al cierre F7; 6 retirados; 23 huecos); 37 punteros en recaps grandes + descripciones inline conservadas para contexto local; jerarquía de headings corregida (101 cambios); pendientes reales → overview; no-pérdida verificada vs git baseline (`scripts/F7-verify-bugs.js`). |

**Cadencia:** checkpoint al cerrar cada fase grande (acordado con el usuario).

---

## Pendientes de mapeo abiertos (consolidado)

> Gaps reales con profundidad faltante, verificados contra el inventario el 2026-06-05. Los demás avisos "Pendiente F2" que estaban dispersos en el inventario ya habían sido cubiertos en sesiones posteriores (la nota nunca se borró) y se eliminan en la limpieza F7. **Este es el único lugar donde viven los pendientes de QA.**

1. ~~**I.10 Newsletter** — submit con email **válido** → endpoint POST + double opt-in.~~ **✅ CERRADO (s11).** POST `?qfunc=WMuxo3zKEsY` mapeado (200, body vacío, sin toast). Double opt-in bloqueado por Capa 2.
2. ~~**I.11 Chatbot Silvia** — enviar un mensaje real al NLU y mapear respuesta/quick-replies.~~ **✅ CERRADO (s12).** Shadow DOM cerrado (`shadowRoot=null`) pero **el a11y tree lo expone** → se interactúa por `uid` en DevTools. Round-trip verificado: "¿Qué tinaco para 4 personas?" → recomendación correcta (Tinaco Tricapa 750L / 1100L) + quick-reply de precio. **El NLU funciona.** BUG-050 reconfirmado/agravado (el "error fantasma" **persiste durante la conversación exitosa** → falso error fijo). Evidencia `F2-32`.
3. ~~**I.14.d / II.14 Contacto** — submit con datos **válidos** → toast/redirect/endpoint POST de éxito + validación de email malformado y teléfono < 10 dígitos.~~ **✅ CERRADO (s11).** Toast: `"Se ha enviado tu información, pronto te contactaremos"`. Endpoint POST Qwik qfunc. Email malformado y teléfono corto validados. Efecto colateral: modal I.6 se abre por CP, no bloquea submit.
4. ~~**I.6 Modal dirección** — validaciones inline del **Paso 2** + toast post-guardado + qfunc disponibilidad.~~ **✅ CERRADO (s12).** Paso 2 **sin validación inline**: gating-disable del CTA "Ubicar en el mapa" hasta Calle+NúmExt+CP+Colonia+Ciudad+Estado+alias. **Autofill por CP confirmado** (06700 → Colonia "Roma Norte"/Ciudad/Estado vía Sepomex `?qfunc`). 3er paso = mapa en ruta propia `/customer/address/add/` → "Confirmar punto de entrega". **Guardado SILENCIOSO sin toast (BUG-526)** + auto-default sin preguntar (BUG-527). Evidencia `F2-31`.
5. **Capa 2 — correos** — **CERRADA para pagos (s16, 2026-06-08).** Cuenta `c.agarcia@rotoplas.com`, remitente `ventasecom@rotoplas.com`. **✅ VERIFICADOS:** bienvenida, confirmación de pedido (tarjeta, `6820261ZZA8`), reset de contraseña, newsletter, contacto auto-reply, 4 correos de status (confirmado/en camino/punto de entrega/entregado), **+ Transferencia/SPEI (`6820263SS52`, plantilla D + PDF SPEI)** y **+ Efectivo (`6820266FJM8`, plantilla E + voucher PayNet)** — 5 plantillas con defectos (BUG-535–564, ver Cierres s15/s16). **🚫 Reseñas: NO cerrable** — la publicación está rota (**BUG-566 ALTA**: `success:0` + falso toast; la reseña no persiste, así que no hay correo que verificar). **Fuera de alcance B2C:** correos de **status 30 (Cancelada) y 50 (Facturación Parcial)** — por decisión del usuario aplican a B2B, no se rastrean aquí.
6. **III.8 Mobile** — **✅ CERRADO (s12):** (a) Lighthouse `device:mobile` Home 89/58/100/33 · PDP 77/58/92/33 estable vs desktop (III.6); (b) **nav institucional AUSENTE del menú móvil** — Conócenos/Blog/Recursos/Contacto/Amigo Plomero no accesibles desde el menú móvil (solo categorías + "Servicios" + "Prueba"TEST) → **BUG-528 (ALTA)**, evidencia `F4-05`. **Residual checkout móvil 3 pasos: ✅ CERRADO (s15)** — mapeado a fondo en `/checkout/[1-3]/` sin overflow X; reconfirma BUG-461/471/476/495 en móvil; +BUG-539/540. Evidencias `CAPA2-03/04/05`.
7. **BUG-480** — **CERRADO s22 (falso positivo).** Tras múltiples compras con tarjeta/débito/transferencia/efectivo (s15–s22, órdenes `6820261ZZA8`, `6152026V42G2`, `6152026JTCVP`, `6152026YWVEB`, `61520269J0V3`) la sesión "Jorge Rotoplas" quedó intacta en TODAS. El logout post-compra NO se reproduce — fue un falso positivo.
8. **F6** — DOM contracts ejecutables en `tests/` (la ruta histórica `tests/contracts/b2c/` se aplanó; corregido s25). **LISTOS:** health, links, content, global-layout, home, pdp, servicio-lavado wizard, forms, contacto, faq, distribuidores, legales, servicios, **`/customer` `@auth`**, money-path `@auth`, cart-empty `@auth`, capa2-pipeline. **Apta para producción (s25):** slug de PDP por ambiente, footer T&C tolerante al slash, y `@auth` hace *skip* limpio sin sesión → verde vs prod (68 passed · 11 skipped · 0 fallos). **Pendiente:** smoke journeys `@smoke` (completar compra E2E), cross-cutting `@xcut` (consola/links), contracts móviles, activar CI. *(La matriz B2B↔B2C — antes Parte V — fue descartada por decisión del usuario el 2026-06-07.)*

> **Capa 2 autónoma — estado al cierre s18 (2026-06-11):** el check `@capa2` corre desatendido
> vía `npm run check:b2c:capa2:auto` (crea orden por UI con `scripts/crear-orden-b2c.js` +
> mueve estados + verifica correos). **Pieza 1 (crear orden) y Pieza 2 (pipeline CT→correo)
> CERRADAS y probadas** (`6102026LQSK7`, `6112026ZRLFF`). **Único bloqueador para 100%
> desatendido: el App Password de Gmail** (`GMAIL_IMAP_PASS`) — la contraseña normal no sirve
> para IMAP. Sin él, la verificación de correo se hace en Modo A (Gmail MCP). **Incógnita de
> `Delivered`→"entregado" RESUELTA (s18):** requiere el portal B2B + imagen de prueba de entrega;
> irreproducible vía CT por diseño → fuera del check. Detalle: "Sesión 18" abajo + `evidencias/CAPA2-pipeline-6102026LQSK7.md`.

### Gaps menores por sección (rescatados del inventario en la limpieza F7)

> Estos pendientes vivían como notas "Pendiente Fx" dentro del inventario; se mueven aquí (único hogar de pendientes) al pointerizar esas secciones. Verificados como **realmente abiertos** al 2026-06-05 (no estaban ya cubiertos por sesiones posteriores).

- ~~**I.7 Widget verificación CP** — ubicar en qué sección de la home se muestra, mapear el botón submit y qué retorna (modal de dirección / toast / lista).~~ **✅ CERRADO (s11).** Modal completo mapeado: banner trigger `#zipCodeCoverageHeader`, `<dialog modal>`, input CP, botón "Buscar por código postal", botón "Escribir dirección".
- ~~**I.14.a Login** — validaciones inline, mensajes de error y comportamiento del Enter key (el redirect post-login exitoso ya está verificado por el uso E2E).~~ **✅ CERRADO (s11).** Validaciones mapeadas (vacío, email malformado). Error: `"Introduce una dirección de correo electrónico válida..."`. Handler Qwik `q-CmT-bS6_.js#s_7s0GKaBtn2k`.
- ~~**I.14.c Forgot password** — submit con email válido (registrado y no registrado) → toast/redirect/endpoint POST; probar email > 30 chars (BUG-064) y email malformado.~~ **✅ PARCIAL (s11).** Vacío y email malformado mapeados (mismo error que login). BUG-064 confirmado (`maxlength=30`). Email válido (registrado/no registrado) depende de Capa 2.
- ~~**II.6 Confirmación** — mapear la vista de "Imprimir" del comprobante de orden.~~ **✅ CERRADO (s11).** Botón con handler Qwik `q-YL4W09wm.js#s_Gg3po6hi4ok` que llama `window.print()` → diálogo nativo de impresión del navegador. Sin PDF ni nueva pestaña.
- **II.8 PDP toggle instalación** — **✅ MAPEADO (s12):** el toggle "¿Te lo instalamos en tu hogar?" (`div.installation-container` on:click, BUG-331) **NO recalcula precio inline** — abre el modal **"¡Instálalo con nosotros!"** (anatomía deep en §19.b: sin role=dialog, título `<p>`, cerrar icon-only sin aria, CTA `<div>` no button, tel texto plano, copy modo-verbal → BUG-520–525). *Sub-paso OMITIDO por decisión del usuario:* el recálculo + persistencia del add-on en el cart requiere un SKU instalable en stock; los 4 tinacos-con-bomba están "No disponible" en 02800 y 06700 (límite de datos de QA, no de herramienta).
- ~~**II.11b Reseñas** — publicar una reseña real (rating + texto) → toast/redirect; ver el modal "¿Quieres eliminar tu reseña?"; verificar paginación.~~ **✅ CERRADO E2E (s13, 2026-06-07).** Publicación real ejecutada y luego eliminada (sin data pollution) sobre "Base para tinaco GDPV" SKU 310002. **Publicar:** POST qaction `/customer/reviews/{UUID}/q-data.json?qaction=6umxiG2X9yg` → toast **"Tu reseña ha sido enviada para revisión"** (modelo de moderación) → aparece en "Realizadas" con rating ★★★★☆. **Eliminar:** gatillo basura → modal "¿Quieres eliminar tu reseña?" (botones "Eliminar"=secondary / "Cancelar"=primary) → POST qaction `…?qaction=nz27VmKylew` → toast **"Reseña eliminada"**. Gating rating→publicar correcto. **6 bugs nuevos (BUG-529–534)** a11y/UX del modal+widget+contador; confirmados en vivo BUG-138/140/141/143. Evidencia `F2-33`. **⚠️ REGRESIÓN/CORRECCIÓN s16 (2026-06-08):** auditado con hook a `fetch`, el MISMO POST (`qaction=6umxiG2X9yg`) devuelve **HTTP 200 con `{"success":"0"}` (fallo)** y la reseña **NO persiste** (nunca en Realizadas/PDP, sin correo) — el toast de "éxito" es falso → **BUG-566 (ALTA)**. Lo que s13 leyó como "aparece en Realizadas" era UI optimista, no persistencia real. La funcionalidad de reseñas está **rota de extremo a extremo** hasta corregir BUG-566.
- **II.16.c Wizard cotización-lavado** — **✅ FLUJO PRINCIPAL CERRADO (s20, 2026-06-11).** Resuelto el bloqueo de "no se encontraba el wizard": **el trigger "Cotizar lavado" es una `<img>` (no botón de texto)** → se localiza por eje imagen+handler, se abre con click CDP real y aparece `.modal-wizard` (corrige la doc previa que lo creía "inline sin trigger"). **RESUELVE el pendiente #3:** el servicio **SÍ es comprable** E2E — wizard → cantidad+capacidad → "Cotizar" ($899 client-side) → "Agregar al carrito" → cart line-item `.service-card` **"Mantenimiento Tinaco" SKU 452308** → T&C → "Iniciar compra" → checkout estándar → pago. Mapeo deep en inventario II.16.c §0/§9 + evidencias `F2-servicio-lavado-*`. +4 bugs (BUG-567 trigger imagen a11y, 568 modal sin role=dialog, 569 detalles placeholder, 570 servicio sin imagen). **Sub-casos aún abiertos** (no bloqueantes para el plan): Cisterna sola y Tinaco+Cisterna, CP fuera de CDMX, "← Volver a cotizar" (¿preserva estado?), y BUG-457 sigue vivo (presencia A/B inestable → en contracts pinear `builderVisitorId` o tratar el trigger como condicional).
- ~~**II.18 Blog** — paginación `?page=2`, listing por categoría `/category/{slug}`, feed, `article:modified_time`.~~ **✅ CERRADO (s12).** Paginación off-by-one **sistémica** (blog + `/category/`); `/category/{slug}` mapeada deep (filtra bien, sin H1, title genérico, posts root `/{slug}` con `<a>` reales → BUG-147 NO aplica al blog); **feed RSS inexistente** (`/feed/` falso-200 catchall, `/blog/feed/` 503, blog ausente de sitemaps → BUG-518/519); `modified_time="Thu Jan 01 1970"` **sistémico** (2/2 posts) + formato JS-Date inválido (BUG-231 ampliado, BUG-227 corregido). Evidencia `F2-30`. *Queda BUG-012 (3 URLs del blog) como bug abierto, ya documentado.*
- ~~**II.1 Home — Hero banners** — identificar links de cada banner del carrusel, posición, auto-rotate y controles de navegación.~~ **✅ CERRADO (s11).** 5 slides, 0 links (banners no clickeables), dots nav `"Ir al slide 1..5"`, contenedor `.⭐️7y6rwi-1.banner`, Qwik-managed sin jQuery/slick. Nuevo BUG-B2C-517 (alt genérico en 5 slides).
- ~~**II.17 Nosotros — sub-páginas** — verificar H1 de `/nosotros/quienes-somos/` y `/nosotros/presencia/`; verificar `src` del `<iframe>` de video embebido.~~ **✅ CERRADO (s11).** H1s verificados (ausentes en ambas → BUG-353). Iframe en `/nosotros/` es `<iframe style="display:none">` de tracking GTM, NO un video de YouTube. No existe video embebido en esta página.

---

## F6 — ADR: Sistema de checks post-liberación B2C (2026-06-07, sesión 14)

> **Architecture Decision Record.** Este es el "por qué" del sistema de pruebas automáticas que vive en `tests/contracts/b2c/`. Si una sesión futura toca esos archivos, lee esto primero. Decidido con el usuario el 2026-06-07.
>
> **Trigger real:** al usuario le pidieron hacer "checks de ambiente después de liberaciones". Una regresión ya se le escapó. Esto automatiza ese check.

### Qué es y qué NO es

Lo que la industria llama esto con precisión: **pruebas de humo estructurales post-deploy + synthetic monitoring**. **NO** es "contract testing" estilo Pact (eso son contratos API entre microservicios). Internamente lo llamamos "DOM contracts" por herencia del B2B, pero al hablar con devs, decir "pruebas de humo estructurales", no "contracts" (evita confusión con Pact).

**El trabajo de un contract:** detectar *cambios* contra el estado actual del sitio — un elemento crítico que desaparece, un `href` que cambia, una sección que deja de renderizar. **NO** valida precios, stock, fechas ni pixeles (eso es E2E / datos / visual).

### Arquitectura en capas (de más barata a más cara)

| Capa | Tag | Pregunta | Estado |
|---|---|---|---|
| **0 · Health** | `@health` | ¿Las URLs críticas dan 200, no 5xx/404? | Cut 1 |
| **1 · Contracts DOM** | `@contract` | ¿La estructura crítica sigue ahí? | Cut 1 — **núcleo anti-regresión** |
| **2 · Smoke journeys E2E** | `@smoke` | ¿login→cart→checkout todavía se puede? | Diferido (fase 2) |
| **3 · Cross-cutting** | `@xcut` | ¿Errores de consola/links nuevos? | Diferido |

Comandos: `npm run check:b2c` (todo), `npm run check:b2c:health` (solo `@health`).

### Decisiones de diseño (las que cargan peso)

1. **Selector stability es la decisión #1.** El sitio es Qwik: genera clases hash (`.⭐️7y6rwi-1`, `q-CmT-bS6_.js`) que **cambian en cada build**. Un contract atado a un hash se pone rojo en el próximo deploy SIN regresión real → falsos rojos → la suite se apaga → volvemos al problema original. **Jerarquía obligatoria de selectores:** (1) roles ARIA + texto accesible `getByRole`, (2) texto visible / `href` de producto, (3) `data-testid` si existe. **PROHIBIDO** clases hash, IDs generados, `q-*.js`. Por esto el inventario (lleno de selectores frágiles, escritos para *documentar*) NO se copia tal cual: cada aserción se re-deriva a un anclaje estable.

2. **Baseline ejecutable (no "sitio ideal").** El sitio tiene 505 bugs conocidos (ej. BUG-353: sin H1 sistémico). Un contract que asercione "H1 presente" falla desde el día 1 por un bug viejo → ruido. Regla: **asertar lo que HOY funciona y es crítico**; los bugs conocidos relevantes se marcan `test.fixme`/expected-fail para que el contract avise si un bug **se arregla** (cerrarlo) o **empeora**. El inventario de 505 bugs se vuelve el baseline; los contracts son el candado sobre sus invariantes.

3. **Filtro de criticidad.** Solo se asercióna lo que, si se rompe, es incidente P1: login, "Añadir al carrito", checkout alcanzable, precio visible, nav, footer legal. **NO** cada microcopy/alt/tilde (eso es del inventario). El inventario es exhaustivo a propósito; el contract es selectivo a propósito.

4. **Base URL por env var.** `B2C_BASE_URL` (default `https://qarotoplasmx.io`). Permite apuntar la MISMA suite a prod tras un deploy sin tocar código.

5. **Anónimo primero.** ~80% del valor (layout, home, PDP, cart, checkout paso 1) es público → no depende de sesión → no se rompe por auth expirado. Los contracts de `/customer` (requieren storageState B2C de la cuenta `andrei.garcia`, que expira) van en tanda aparte, aislados.

6. **Imitar al USUARIO REAL, sistemáticamente (decisión del usuario, s21).** Todo lo que el panel (`dashboard.js`) y los scripts ejecutan debe reproducir, lo más fiel y sistemáticamente posible, **las acciones de un usuario real recorriendo el sitio por la UI** — NUNCA atajos por API para lo que un cliente haría a mano. Ejemplos concretos ya aplicados: la creación de orden recorre PDP → carrito → checkout 3 pasos → pago con clicks CDP reales (no inyecta el SKU al cart vía API); el servicio de lavado recorre el wizard imagen-trigger → steppers → capacidad → Cotizar → Agregar al carrito (no inserta el SKU 452308 directo); el cambio de estados por CT API se usa SOLO para lo que un usuario no puede hacer (avanzar fulfillment). **Por qué:** un check que toma atajos puede pasar en verde mientras el camino real del cliente está roto — el valor del check es exactamente cubrir lo que el usuario vive. Corolario: cuando un selector falla, primero se inspecciona el DOM real (probe) y se ancla a lo visible (cuidando BUG-005, nodos duplicados desktop/mobile), nunca se "arregla" debilitando la aserción.

### Fuentes de flakiness de ESTE sitio y su mitigación

| Fuente | Mitigación |
|---|---|
| **A/B testing (Builder.io)** — BUG-457 mostró presencia inestable del wizard | Asertar solo invariantes presentes en TODAS las variantes; cuarentenar componentes A/B'd |
| Hidratación Qwik (CSR) | `domcontentloaded` + settle; `expect.toBeVisible` con auto-retry; nunca `waitForTimeout` solo |
| QuantumMetrics polling | **Jamás** `networkidle` (cuelga) |
| Disponibilidad volátil de producto (el Tinaco 500545 ya no surte 02800) | Asertar la **plantilla** de PDP, no un SKU fijo |

### Flujo de triage cuando un check se pone ROJO

1. Verde → ambiente sano. 2. Rojo → reporte da nombre + screenshot + trace (on-failure). Clasificar en 4 cajas:
- **Regresión real** → reportar bug (el caso de oro: lo atrapaste).
- **Cambio intencional** → actualizar el contract (en `_targets.js`, un solo lugar) + commit. El git log = historial de "qué prometía el sitio".
- **Flaky** (A/B, timing) → endurecer selector o cuarentenar.
- **Bug conocido cambió** → actualizar baseline.

### Riesgos que pueden REDIRIGIR el trabajo (radar)

1. **Componente crítico sin anclaje estable** (todo hash) → escalar a dev que agregue `data-testid`. Dependencia externa nueva.
2. **Mucho A/B en lo crítico** → menos aserciones pero blindadas; redefinir alcance.
3. **QA estructuralmente distinto de prod** → decidir cuál ambiente es fuente de verdad del contract.

### Alcance del Cut 1 (acordado: solo B2C, manual on-demand, sin CI activo)

Capa 0 (health) + Capa 1 (contracts anónimos: global layout → home → PDP → cart/checkout). CI: se deja un `.yml` de GitHub Actions **listo pero apagado** para enchufar cuando exista pipeline. Diferido: smoke journeys E2E, cross-cutting, contracts móviles, contracts autenticados.

### Ubicación de archivos (regla de doble ubicación del proyecto)

Fuente de verdad: `tests/contracts/b2c/` (suite reutilizable, agrupada por función). Copia/puntero en el ticket: este overview + handoff. Specs: `*.contract.spec.js`. Helpers: `_helpers.js`, `_targets.js`.

### Hallazgos técnicos durante la construcción (sesión 14, verificados en vivo con DevTools)

Estos hallazgos surgieron al construir los contracts y son **load-bearing para automatizar el sitio** (no son bugs nuevos; son mecánica del sitio que cualquier automatización futura debe conocer).

1. **La disponibilidad por CP vive en `localStorage`, no en cookie de sesión.** Al resolver un CP, el sitio guarda `coverage_<CP>` (un mapa `SKU → {coverage, cp, id_sucursal, id_distribuidor, costo_envio}`) y `user_addr` (objeto de dirección). Un contexto limpio de Playwright **no los tiene** → la PDP muestra "Verifica disponibilidad" y deshabilita la compra. **Solución para contracts:** sembrar el mínimo (solo el SKU bajo prueba) vía `page.addInitScript` antes de navegar → PDP determinista sin caminar el modal I.6. Fixture en `tests/contracts/b2c/_targets.js` (`COBERTURA_SEED`), helper `seedCobertura()` en `_helpers.js`.
2. **El precio renderiza en clases legibles estables** (no solo hash Qwik): `.dynamic-price`, `.current-price-row`, `.split-price` conviven con el scope `⭐️…`. El precio principal de la PDP es `.dynamic-price.variant-larger`. Son anclajes usables; los cross-sell repiten `.dynamic-price` → scoping con `.first()` o `variant-larger`.
3. **El "doble H1 / TEST TINACO" (BUG-313/314) es específico del SKU 500545**, no sistémico de toda PDP: "Base para tinaco GDPV" (SKU 310002) tiene **un solo H1 limpio**. El bug viene del bloque Builder.io editable de ese producto, no de la plantilla.
4. **Cart + Checkout están gated por autenticación** (consecuencia de BUG-481): el add-to-cart anónimo no persiste. Por tanto los contracts de `/cart/` y `/checkout/*` **requieren un `storageState` B2C autenticado** (cuenta `andrei.garcia@xideral.co`, sin bot detection) — no se pueden cubrir anónimos. Pendiente: crear `setup-auth-b2c.js` análogo a `setup-auth.js`. Hasta entonces, el Cut 1 cubre Capa 0 + cascarón + Home + PDP (todo anónimo).

### Estado de implementación F6 (sesión 14)

| Archivo | Capa | Estado |
|---|---|---|
| `0-health.contract.spec.js` | 0 Health | ✅ 15/15 — home, login, signup, 7 categorías, PDP, cart, checkout, traking, contacto |
| `0-links.contract.spec.js` | 0 Health | ✅ link-check del cascarón: 18 links internos de header/footer → 200 (12 externos reportados, no verificados). Automatiza "revisar footer". |
| `1-global-layout.contract.spec.js` | 1 Contract | ✅ 5/5 (incl. 2 baseline expected-fail: BUG-015, BUG-003) |
| `1-home.contract.spec.js` | 1 Contract | ✅ 3/3 (incl. 1 baseline: BUG-001). **s21: re-anclado el hero** — el sitio cambió los alts genéricos "Banner Rotoplas" por descriptivos ("Banner Goles/Tuboplus/…", posible fix BUG-517) → ahora ancla `img.responsive-image[alt^="Banner"]:visible`. |
| `1-content.contract.spec.js` | 1 Content `@content` | ✅ **15/15 (s21)** — 1 ancla por URL de HEALTH_URLS (title no vacío + header visible). Cierra "200 ≠ renderizó". `npm run check:b2c:content`. |
| `1-pdp.contract.spec.js` | 1 Contract | ✅ 4/4 (seed cobertura → determinista) |
| `1-servicio-lavado.contract.spec.js` | 1 Contract `@contract` | ✅ **3/3 (s21)** — wizard de cotización: trigger imagen + apertura modal + Cotizar→precio+Agregar al carrito. Presencia condicional (SKIP) por BUG-457. Ancla `img[class*="banner-desk"][src*="a634cf17"]` (evita dups mobile BUG-005). |
| `2-money-path.contract.spec.js` | 1 Contract `@auth` | ✅ 4/4 (autenticado: PDP→cart→checkout p1) |

**Total Cut 1: 32 tests, suite VERDE** (`npm run check:b2c` → 30 passed + 2 flaky-recuperados-en-reintento, 0 failed). Flakiness atacada por causa raíz en varios frentes: lazy-render de Qwik → `scrollAlFondo()` (espera el footer); disponibilidad por CP en localStorage → `seedCobertura()`; estado compartido bajo paralelismo → `mode:'serial'` en la ruta autenticada; race UI-optimista/backend del cart → `asegurarItemEnCarrito`; 503 transitorio de infra → reintento de códigos transitorios en `statusDe`. **Residual:** footer y solución-finder de la home montan perezoso y bajo carga de 4 workers ocasionalmente tardan → `retries:2` a nivel proyecto los absorbe (el reporte los marca **flaky**, visible). Mitigación alterna posible: bajar workers del proyecto.

### Auth B2C + scripts (sesión 14)

- `setup-auth-b2c.js` (raíz) — login `andrei.garcia@xideral.co` (sin bot detection) → `rotoplas-auth-b2c.json` (gitignored vía `rotoplas-auth*.json`). Correr cuando expire la sesión.
- Comandos: `check:b2c` (todo), `check:b2c:health`, `check:b2c:contracts`, **`check:b2c:anon`** (sin `@auth`, no requiere login — útil en CI sin secretos).
- CI listo-apagado: `.github/workflows/check-b2c.yml` (manual `workflow_dispatch`; disparadores auto comentados; ruta `@auth` requiere secretos `B2C_USER`/`B2C_PASS`).
- Doc operativa + pitch a stakeholders: `tests/contracts/b2c/README.md`.

### Sesión 24 (2026-06-15) — Dashboard: rediseño Checks + login tecleado real + diagnóstico de profundidad

Sesión larga de UX/funcional del panel (`scripts/dashboard.js`) + flujo de compra (`scripts/crear-orden-b2c.js`) + **diagnóstico de profundidad de los contracts** (nuevo doc). **0 bugs nuevos del sitio** (sigue **BUG-B2C-574**). 1 bug de herramienta encontrado y arreglado. **Sin commit** (todo untracked: `dashboard.js`, `crear-orden-b2c.js`, `dash-reporter.js` de s23, + nuevo `tests/contracts/b2c/COBERTURA.md`). Orden quemada: **`6162026BCY8L`** (login tecleado E2E).

**1. Checks merge — "¿Responden y renderizan?" (decisión del usuario):** Health (200) y Contenido mínimo iteran la **misma lista** (`HEALTH_URLS`, 16 URLs) y content es estrictamente más fuerte → se **fusionaron en un solo check en capas** (acción `responde`, `--grep "@health|@content"` = **33 tests**: 16 health + 1 link-check + 16 content). El 200 es el paso rápido interno; el render real es la prueba que vale; el triage sigue separando *ambiente* (200 falla) vs *render* (200 ok, contenido no). Se eliminó la fila 200-only del panel.

**2. Estructura crítica → vista por ZONA primaria + compacta (#4 del usuario):** "Estructura crítica" pasó de un solo check `@contract` a un **encabezado con "Correr todas" + 7 zonas siempre visibles**. Server: mapa `AREAS` (7 zonas → archivos de spec) + acción `'area'` (corre por ruta de spec + `--grep @contract`), expuesto en `/config`. Cliente: las 7 zonas se pintan como **rejilla compacta de mosaicos** (2 col, `.zona-grid`): pill de estado + nombre + 🔒 si `@auth`; el borde del mosaico espeja el estado. Zonas: *Cascarón global* (`1-global-layout`) · *Home* · *Catálogo/PDP* · *Servicios* (`1-servicios`,`1-servicio-lavado`) · *Ruta del dinero* 🔒 (`2-cart-empty`,`2-money-path`) · *Mi cuenta* 🔒 (`2-customer`) · *Institucional* (`1-contacto`,`1-faq`,`1-distribuidores`,`1-legales`). Texto verboso recortado (sin nombres de archivo monoespaciados en las filas). Triage de **skip** distingue *falta sesión* (`@auth`) de *falta App Password* (correos). Refactor: el "último estado" se indexa **por pill (`data-st`)**, no por acción → cada zona restaura el suyo.

**3. Tira FIJA de estado en vivo (`livebar`, queja del usuario "scrolleo mucho"):** barra sticky bajo el header que aparece al correr cualquier cosa y muestra **test/paso actual + i/N + ✓/✘/– + "ver detalle"** — visible corras donde corras; se colorea con el veredicto y se auto-oculta a los 4 s. Espeja el panel en vivo activo (`window._activeLive`). Verificada estando scrolleado al fondo.

**4. Bloque de info de la orden creada:** al terminar `crear-orden` el panel **captura el nº** (`CAPA2_ORDER=`/`orden creada: X`) y muestra un bloque verde con el número + **copiar** + **Ver estado / Ver pagos / Ver historial** (consultan `ct-api.js --b2c|--b2c-payment|--b2c-messages`). Esas 3 acciones existían en `ACTIONS` pero **nunca estaban cableadas a la UI**. Persiste la última orden en `localStorage`. Probado con `6152026JTCVP` → CT real (Open/Paid/$1751.60/SKU 310002).

**5. Login TECLEADO real en la compra (pedido explícito del usuario):** `crear-orden-b2c.js` ahora por **default** (`B2C_LOGIN_MODE=type`) arranca SIN cookies y **teclea email+password en `/login`** como un usuario real (`loginUI()`, el B2C no tiene bot detection). El modo `session` (storageState rápido) queda para CI. Verificado E2E headless: tecleó credenciales → login → carrito → checkout 3 pasos → tarjeta 4242 → Pagar → **orden `6162026BCY8L`** (exit 0). Copia de ticket sincronizada.

**6. Limpieza:** acción muerta `anon` eliminada del ALLOWLIST.

**7. 🐛 Bug de herramienta encontrado y arreglado:** el patrón `@health|@content` con `shell:true` rompía el comando (el `|` lo interpretaba el shell como **pipe** → 0 tests). Fix: **entrecomillar** los valores de `--grep` con metacaracteres en `buildCommand`. De paso arregla el mismo bug latente que tenía la acción `anon`.

**8. Diagnóstico de profundidad de contracts → `tests/contracts/b2c/COBERTURA.md` (NUEVO):** se leyeron los 17 contracts y se cruzaron contra el inventario, calificando **nivel de profundidad** (N0 forma / N1 comportamiento / N2 efecto real) y qué de la **estructura/flujo** del inventario NO cubre cada uno (sin frame de bugs, corrección del usuario). Hallazgo: la **mayoría son N0** (verifican que renderice, no que funcione); solo `1-servicio-lavado` es N1 completo y `3-capa2` es N2 (gateado). **Hueco más caro:** `2-money-path` recorre PDP→carrito→checkout 1/2/3 pero **nunca pulsa "Pagar"** (se queda a un paso del dinero). Profundización priorizada en el doc.

**Pendientes REALES para la próxima sesión (prioridad):**
1. **Profundizar `2-money-path` → completar la compra** (el #1 del diagnóstico): elevar `crear-orden-b2c.js` (login tecleado→pago→`/order/`, ya funciona) a un contract que verifique el nº de orden. Barato y alto valor.
2. **Mejoras del panel deferidas** (el usuario las pospuso, no descartó): #1 conteo flaky en vivo (over-cuenta un retry reabsorbido), #2 roll-up del pill "Estructura crítica" (agregue las 7 zonas), #6 progreso paso N/total en la tira para flujos de pasos.
3. Resto del diagnóstico (`COBERTURA.md`): pdp add-to-cart real + galería; content/categoría verifica productos listados; forms camino feliz de login.
4. **Contracts móviles 375px** (sigue abierto desde s23).
5. **Commit** de todo lo untracked en rama.
6. (Heredados) fix `agregarServicioLavado()` headless; guard baseline PCI; anotar técnica del reporter en `tasks/lessons.md`.

### Sesión 23 (2026-06-15) — Dashboard: ejecución EN VIVO (lista de tests) + colapsables + historial + fix false-progress

Sesión de UX del panel (`scripts/dashboard.js`), enfocada en hacerlo **más amigable durante las ejecuciones** y en su diseño. **0 bugs nuevos del sitio** (sigue **BUG-B2C-574** como próximo ID). Todo verificado en vivo contra el panel local. **Sin commit** (el archivo `scripts/dashboard.js` sigue untracked, igual que al inicio).

**1. Reporter propio + vista de ejecución EN VIVO (lo más pedido):** nuevo **`scripts/dash-reporter.js`** — reporter de Playwright que emite una línea JSON `@@DASH {…}` por evento (`start{total}` · `begin{title,suite}` · `end{title,suite,status,ms,error}`). Las corridas Playwright del panel ahora usan `--reporter=./scripts/dash-reporter.js,list` (el `list` queda para el log técnico crudo). Con eso, el flujo de **Checks** dejó de mostrar un checklist genérico y ahora pinta una **lista de pruebas en vivo**:
- **Barra de progreso real `i/N`** + **cronómetro `mm:ss`** + **semáforo en vivo** (`✓ N en pie · ✘ N rotos · – N omitidos`) que cuenta mientras corre.
- **Cabecera "Probando: X"** con el test en curso (evento `begin`).
- **Una fila por test** con su **título legible en español** (el reporter quita el tag `@health`/`@contract`), su duración, y **—si falla— el motivo del error inline** (clic para expandir). Esto responde directamente a lo que pidió el usuario: *saber en vivo qué prueba, si pasó y por qué no.*
- *Por qué un reporter propio y no parsear el `list`:* en modo no-TTY (lo que da `spawn`) el `list` **solo imprime al terminar cada test** y vuelca los errores todos juntos al final, sin atarlos a su test → no habría "qué corre ahora" ni motivo por-test. La API del reporter (`onTestBegin`/`onTestEnd.error`) sí lo da. Detalle en `tasks/lessons.md` (pendiente de anotar) + técnica reusable.

**2. Fix del avance-en-falso del checklist (cierra pendiente #2 de s21):** el paso "Procesando el pago" de `FLOWS.orden` matcheaba `método de pago:`, línea que el script imprime **al elegir** el método (antes del pago real) → encendía el paso de más. Re-anclado a `procesando pago|capturada|generar pedido (` y el cierre a `✓ orden creada`. (El flujo de crear-orden/correos conserva el checklist; solo Checks usa la lista de tests.)

**3. Secciones colapsables** (`localStorage` `dashCollapseV1`): cada tarjeta se pliega/expande desde su cabecera (chevron). **Checks estructurales abierto por default**, Correos / Crear orden / Historial plegados. Estado recordado entre recargas. **Auto-expansión de la tarjeta objetivo al correrla** → nunca disparas un check cuyo resultado quede oculto.

**4. Historial de corridas** (`localStorage` `dashHistoryV1` cap 15 + `dashLastV1`): nueva tarjeta **"Historial reciente"** que lista las últimas corridas (acción · resultado con conteos · hora). Al recargar, **restaura el último estado de cada pill** de check (con tooltip de fecha). Botón "borrar historial". Es memoria de regresión local: ver si algo que ayer estaba en pie hoy se rompió, sin re-correr.

**5. Verificación REAL (sin adornos):**
- ✅ `node --check` de `dashboard.js` + `dash-reporter.js`; **JS del cliente emitido** validado con `new Function` sobre el HTML servido (no sobre los bytes crudos — el `PAGE` es template literal, `\\(` → `\(`).
- ✅ **Health corrido E2E por el endpoint SSE:** 17 tests (16 URLs + 1 link-check), **17 `begin` + 17 `end` todos `passed`**, títulos humanizados (`Home → 200`, `Capa 0 — URLs críticas responden 200`), `ms` por test. La UI pintó barra verde **17/17**, semáforo **✓17**, cronómetro 0:25, lista con `PDP (plantilla) → 200 835ms`.
- ✅ Historial registró `Health · ✓ 17 en pie · HH:MM`; pill de Health → "OK"; defaults de colapso correctos en arranque limpio (Checks abierto, resto plegado).
- ⚠️ **Gotcha anotado:** `node scripts/dashboard.js` **carga el `PAGE` en memoria al arrancar** → tras editar el archivo hay que **reiniciar el server** (no basta recargar el browser). Un server viejo (s22) ya ocupaba el puerto 4599 y servía HTML stale → mi proceso moría por `EADDRINUSE`; se mata el PID del puerto y se relanza.

**6. Decisiones tomadas con el usuario (vía AskUserQuestion) para PRÓXIMAS sesiones — NO implementadas aún:**
- **Diseño (eje 2):** sin onboarding · solo tema claro · historial con mini-registro (✅ hecho) · **secciones colapsables (✅ hecho)**.
- **Cobertura de contracts a priorizar → MÓVIL (375px):** re-correr los contracts críticos (home, PDP, cart, checkout) en viewport móvil. La mayoría de usuarios B2C entran desde celular y hoy no hay cobertura móvil (Cut 1 la excluyó a propósito; choca con la regla de proyecto "mobile obligatorio"). Cuidado al implementarlo: contracts con selectores desktop (nav en hamburguesa) pueden fallar en 375px → distinguir *test que necesita selector mobile-aware* de *bug real del sitio* (el inventario ya tiene BUG-528 nav institucional ausente del menú móvil, BUG-504 sin sticky CTA).
- **Dashboard: desglosar "Estructura crítica" por área** (cada área con su pill). **Mapa de áreas propuesto (7)**, ejecutando por archivo de spec: *Cascarón global* (`1-global-layout`) · *Home* (`1-home`) · *Catálogo/PDP* (`1-pdp`) · *Servicios* (`1-servicios`, `1-servicio-lavado`) · *Ruta del dinero* `@auth` (`2-cart-empty`, `2-money-path`) · *Mi cuenta* `@auth` (`2-customer`) · *Institucional* (`1-contacto`, `1-faq`, `1-distribuidores`, `1-legales`). **Nota:** las áreas `@auth` necesitan `rotoplas-auth-b2c.json`; sin sesión hacen skip → el triage debe explicarlo.
- **Ambiente:** mantener **solo QA** (no exponer prod). **Tendencia/alertas:** nada por ahora.

**7. Hallazgos de cobertura/doc detectados al revisar contracts (para retomar):**
- **7 specs existen pero el dashboard no los expone como check propio** (`1-contacto`, `1-faq`, `1-distribuidores`, `1-legales`, `1-servicios`, `2-cart-empty`, `2-customer`) — corren dentro de "Estructura crítica" (`@contract`) pero sin visibilidad propia → lo resuelve el desglose por área de arriba.
- La **ruta del dinero rápida llega solo a checkout paso 1** (no a orden creada); la compra completa solo está en Capa 2 / manual.
- **Bugs PCI (BUG-119, BUG-571: exposición de dígitos del PAN) sin guard baseline** que avise si reaparecen/empeoran → candidato barato y de alto valor (expected-fail).
- **Drift de doc del README** ("43 tests / 15 URLs") corregido esta sesión a lo real (health = 16 URLs + link-check; suite ≈ 79 tests por s22).
- Tags verificados: `@forms @contract` en `1-forms`; `@contract @auth` en `2-cart-empty`/`2-customer`/`2-money-path`; el resto solo `@contract`.

**Archivos (sin commit):** NUEVO `scripts/dash-reporter.js` · MODIFICADO `scripts/dashboard.js`. (Copias de ticket de scripts: `dashboard.js`/`dash-reporter.js` son tooling global → viven en `scripts/`; no requieren copia en `tickets/[id]/scripts/`.)

**Pendientes REALES para la próxima sesión (prioridad):**
1. Implementar **desglose por área** en el dashboard (mapa de 7 áreas arriba; ejecutar por archivo de spec, manejar skip de `@auth`).
2. Implementar **contracts móviles 375px** (nuevo project Playwright o subset @mobile; triagear fallos test-vs-bug).
3. (Heredados de s21/s22, fuera de esta sesión) fix `agregarServicioLavado()` headless + correr servicio/débito/transferencia/efectivo headless + verificar/cerrar BUG-517 + commit en rama.

### ✅ Sesión 22 (2026-06-15) — Dashboard rediseñado + 8 contracts nuevos + bugs cerrados + scripts headless

Sesión de consolidación. Se cerraron los 5 pendientes críticos de s21, se rediseñó el dashboard (español neutro, fusión de tarjetas, tooltips de archivos, timestamp, resumen de errores), se crearon 8 nuevos specs de contrato (P0+P1+P2), se cerraron BUG-517 (fix parcial: alts del hero descriptivos) y BUG-480 (falso positivo: logout post-compra no reproducible en 5 compras), y se corrió `crear-orden:b2c` headless para los 4 métodos de pago físico + servicio.

**Scripts corregidos:** `agregarServicioLavado()` (selector `img[class*="banner-desk"]` + retry loop) · `.method-card` → `.check-card` en checkout · `vaciarCarrito()` al inicio · regexes del dashboard anclados a frases inequívocas.

**Nuevos contracts:** `1-forms` (8 tests, P0) · `2-cart-empty` (2 tests, P0) · `1-contacto` (2 tests, P1) · `1-distribuidores` (3 tests, P1) · `2-customer` (3 tests, P1, skip si sesión expirada) · `1-faq` (3 tests, P2) · `1-legales` (2 tests, P2) · `1-servicios` (2 tests, P2) · `2-money-path` extendido a checkout/2 y /3 (+2 tests).

**Suite: 79 tests, 18 specs, 73 passed + 3 skipped + 1 flaky + 3 expected-fail.** `_targets.js`: `/forgot-password/` agregado a HEALTH_URLS (16 URLs). Dashboard: 3 tarjetas, fila Formularios nueva, Suite anónima eliminada. README sincronizado.

**Órdenes quemadas:** `6152026V42G2` (servicio) · `6152026JTCVP` (débito) · `6152026YWVEB` (transferencia) · `61520269J0V3` (efectivo).

**Archivos modificados (sin commit):** `scripts/crear-orden-b2c.js`, `scripts/dashboard.js`, `tests/contracts/b2c/*`, `tickets/regresiones-smoke-b2c/*`, `package.json`.

### Sesión 21 (2026-06-15) — Contract del wizard + content-check + dashboard explicativo (split órdenes, pill omitido, actividad en vivo, triage)

Sesión de cierre de los pendientes de F6/dashboard que dejó s19/s20. **Todo verificado en vivo** contra qarotoplasmx.io. **0 bugs nuevos del sitio** (próximo ID sigue **BUG-B2C-574**); 1 hallazgo POSITIVO (alts del hero mejorados → posible fix parcial BUG-517, a verificar/cerrar).

**1. Contract del wizard de servicio — `tests/contracts/b2c/1-servicio-lavado.contract.spec.js` (3/3 verde):** vigila la puerta de compra del servicio (trigger imagen "Cotizar lavado" + apertura del modal + Cotizar→precio+"Agregar al carrito"). **Presencia condicional (SKIP, no FAIL) por BUG-457** (variante A/B) pineando `builderVisitorId`. **Root cause de un cuelgue inicial (investigado con probe DOM, no adivinado):** `img[src*="a634cf17"]` matchea **4 nodos** — 3 copias `banner-mobile` OCULTAS + 1 `banner-desk` visible (BUG-005) → `.first()` agarraba la oculta → `toBeVisible` expiraba con retries (minutos). Fix: anclar `img[class*="banner-desk"][src*="a634cf17"]` (único visible) + reintento de click para la hidratación Qwik bajo carga. Receta del recorrido espejada del inventario II.16.c #9.

**2. Content-check — `1-content.contract.spec.js` (15/15 verde), nueva fila Capa 1 (`@content`):** por cada URL de `HEALTH_URLS` verifica **1 ancla estable** (title no vacío + header visible) → cierra el hueco "**200 ≠ renderizó**" que mordió en s19 (Health 200 pero un elemento crítico no montó). Data-driven sobre la misma fuente única → se mantiene solo. NO asercióna H1 (BUG-353 sistémico). Comando `npm run check:b2c:content`.

**3. Dashboard rediseñado a "explicativo" (`scripts/dashboard.js`) — interpretando lo pedido por el usuario:**
- **Split de creación de órdenes en 3 bloques (decisión d, s19):** "Flujo completo de correos" (capa2-auto) · **"Crear orden"** (selects **Tipo** físico/servicio + **Método de pago** crédito/débito/transferencia/efectivo, validados por allowlist, pasados por env al script) · **"Revisar correos"** (lista el inbox de ventasecom por IMAP en Modo B, o link en Modo A).
- **Pill ámbar "omitido" (decisión b):** el backend parsea el resumen Playwright (`X skipped / 0 passed`) → un run 100% skipped (ej. `@capa2` en Modo A sin App Password) ya **no** se pinta verde engañoso, sino ámbar "omitido".
- **Content-check como fila nueva (decisión a):** "Contenido mínimo" en la tarjeta de Checks estructurales.
- **Actividad EN VIVO (pedido del usuario):** cada acción muestra una tira amigable con **paso actual (spinner) + checklist que se va llenando** ("Sesión iniciada ✓ → Producto en el carrito ✓ → Procesando el pago…"), traduciendo el log crudo a lenguaje humano. El detalle técnico crudo queda en "ver detalle técnico" (colapsable).
- **Triage explicativo de un ROJO (pedido del usuario "¿es bug o cambió un selector?"):** al fallar, el panel clasifica por la CAPA que falló y muestra **Qué falló / Causa probable / Qué hacer** — Health rojo = ambiente (URL caída); Contenido rojo = render roto real (no selector); Estructura roja = regresión probable (selectores estables por diseño) o cambio intencional → actualizar el contract. + mini-explicador estático "¿cómo leer un rojo?". Define la var CSS `--warn` que faltaba.

**4. Script `crear-orden-b2c.js` extendido a método de pago (`CAPA2_PAGO`):** crédito (4242) · débito (4111) · transferencia/efectivo (selecciona `.method-card` → "Generar pedido", con detección del guard de transferencia pendiente). El servicio fuerza tarjeta (solo admite Tarjeta, s20). Comandos `npm run crear-orden:b2c:{debito,transferencia,efectivo,servicio}`. Imita al usuario real (decisión de diseño #6 arriba).

> ⚠️ **ESTADO REAL DE VERIFICACIÓN (honesto, 2026-06-15) — NO sobre-afirmar:**
> - ✅ **Físico + crédito:** funciona headless (probado en s18 `6112026ZRLFF`, s19 `6112026EJXTJ`).
> - 🔴 **Servicio (cualquier pago): ROTO headless.** En la primera corrida real (vía el botón "Crear orden" del dashboard) **falló con "trigger Cotizar lavado ausente (BUG-457)"**. **Causa raíz NO es el A/B:** `agregarServicioLavado()` ancla `img[src*="a634cf17"].first()`, que agarra la copia **mobile OCULTA** (BUG-005) → `isVisible()=false` → lanza el error. **Es el mismo bug que ya arreglé en el contract pero NO propagué al script.** Fix pendiente: anclar `img[class*="banner-desk"][src*="a634cf17"]` (igual que `1-servicio-lavado.contract.spec.js`).
> - ❓ **Débito / transferencia / efectivo (físico): NO corridos headless.** Implementados por la UI real (selectores del flujo verificados E2E en vivo s9/s16), pero el script extremo-a-extremo **sin ejecutar todavía** → no afirmar que funcionan hasta correrlos.

**5. Verificación REAL hecha esta sesión (sin adornos):**
- ✅ Suite `@contract|@content` corrida 3× → **34/34 verde** (wizard endurecido contra flakiness bajo carga: hover qvisible + 4 reintentos de click + `.modal-content-wizard`).
- ✅ Dashboard: UI renderiza sin errores JS; Health corrido en vivo → OK con actividad en vivo ("15 verificación(es) OK"); split de órdenes, pill, triage y explicador visibles.
- 🔴 **Botón "Crear orden" tipo servicio: FALLÓ en vivo** (ver punto 4). Lo dejé cableado al dashboard **sin haberlo corrido headless antes** — gap propio.
- 🐛 **Bug del propio dashboard descubierto en esa corrida:** el checklist de actividad en vivo **avanzó en falso** (marcó "Procesando el pago" y todos los pasos previos ✓) porque el regex de paso `/creando orden/` matcheó la línea de arranque `creando orden tipo: servicio`. El script en realidad murió en el 2º renglón. **Fix pendiente:** anclar los regexes a frases inequívocas de cada paso (no subcadenas del log de arranque).

**Pendientes REALES de esta sesión (orden de prioridad):**
1. 🔴 Fix `agregarServicioLavado()` (selector visible) + **correr `crear-orden:b2c:servicio` headless y probar que crea orden**.
2. 🐛 Fix regexes de la actividad en vivo (false-progress).
3. ❓ Correr headless débito/transferencia/efectivo (físico) y confirmar orden.
4. Verificar/cerrar BUG-517 (alts del hero mejorados).
5. Commit (en rama) — **NO commitear hasta que servicio funcione headless** (no congelar un flujo roto como si estuviera listo).

### Sesión 20 (2026-06-11) — Servicio de lavado E2E: wizard + compra + agendado + correos (resuelve pendiente #3)

Sesión de mapeo profundo **en vivo** del flujo completo de **compra de un servicio** (`/servicios-lavado/`), cerrando el HALLAZGO CRÍTICO de s19 (¿el servicio es compra o solo cotización?). **+7 bugs nuevos (BUG-B2C-567→573, total 543, próximo 574).** Orden de prueba quemada: **`6122026VSX6C`** (Mantenimiento Tinaco, SKU 452308, $899, tarjeta sandbox 4242, Sin CFDI, cuenta c.agarcia).

**1. Desbloqueo "no se encontraba el wizard" (root cause):** el trigger **"Cotizar lavado" es una `<img class="banner-desk" alt="Imagen Desktop">`** (Builder.io, src `…a634cf17…`, ~243×84, handler Qwik `on:click`), **sin `role=button` ni texto** → las búsquedas por texto/`getByRole` lo omitían. Se localiza por el eje imagen+handler+tamaño y se abre con click CDP real → aparece `.modal-wizard` (corrige la doc previa que lo creía "inline sin trigger"). Técnica homologada escrita en `.claude/rules/tests.md`, `tasks/lessons.md` L-014, memoria `reference_b2c_wizard_lavado_trigger`, y MEMORY.md. **BUG-457 sigue vivo** (variante A/B; pinear `builderVisitorId` para fijar la variante con wizard).

**2. RESUELTO pendiente #3 — el servicio SÍ es comprable E2E:** wizard (cantidad Tinaco + Capacidad "De 450 L a 1,100 L", única opción) → "Cotizar" (**$899 client-side, sin red**) → "Agregar al carrito" → mini-cart → `/cart` line-item **`.service-card` "Mantenimiento Tinaco" SKU 452308** → T&C → "Iniciar compra" → **checkout estándar 3 pasos** (Dirección→Información→Pago, idéntico a producto físico) → **pago con 4242** → orden **`6122026VSX6C`** ("¡Tu compra ha sido un éxito!"). **Solo método de pago: Tarjeta de crédito/débito** (no aparecieron transferencia/efectivo pese a <$5k). Mapeo deep en inventario **II.16.c §0/§9**.

**3. Agendado del servicio (`/booking/`) — investigado a profundidad:** el agendado **NO se hace al comprar**; el detalle de orden (`/customer/orders/{n}/`) lo gatea: *"se programará una vez que recibas el producto. Recibirás una notificación para agendar la cita"*. **Solo cuando `shipmentState→Delivered`** (avanzado por CT API) aparece el CTA **"Agendar limpieza"** → **`/booking/{orderNumber}-{sku}-0`** (`Número de servicio: 6122026VSX6C-452308-0`). El flujo `/booking` = picker de **fecha/hora** (slots `.hour-card.date-card`, franjas 08-12 y 13-18, zona `America/Mexico_City`) + "Confirmar" / "Saltar cita". **Cita confirmada E2E** (POST `…?qaction=uEmyv6ZhUxg` 200 → "Instalación programada con éxito, Junio 12 08:00-12:00"). Mapeo deep en inventario **II.16.d**.

**4. Correos (Capa 2) del servicio:** la compra dispara los **mismos correos que un producto físico** ("Tu pedido está en proceso" plantilla A + "Tu pedido fue confirmado") — **sin nada específico de servicio ni link de agendado**. **El correo de "agendar cita" NO se dispara por CT API** (gate de fulfillment real = portal B2B + imagen, igual que el correo "entregado" de s18). **El correo de confirmación de cita que la UI promete tampoco se observó** tras confirmar por UI (→ BUG-573, reconfirmar).

**5. Bugs nuevos (567→573):** 567 trigger imagen sin role/alt · 568 modal sin role=dialog/aria-modal/focus-trap · 569 detalles del servicio con copy placeholder "…mtto detalle 1-5" (cart + booking) · 570 servicio sin imagen ("No image available") · 571 **PCI: detalle de orden expone 6 dígitos del PAN** (`**********424242` vs `**** 4242` en confirmación) · 572 copy "instalación" vs "limpieza/lavado" en todo el flujo de agendado · 573 correo de confirmación de cita prometido y no observado.

**6. Tooling construido (s20):** `scripts/crear-orden-b2c.js` **extendido a tipo servicio** — refactor en `conSesion()` + `checkoutYPagar()` compartido + `agregarServicioLavado()` (recorre el wizard por UI: pin `builderVisitorId` vía `addInitScript` → trigger `img[src*="a634cf17"]` → +Tinaco → capacidad → Cotizar → Agregar al carrito). CLI despacha por `CAPA2_TIPO=servicio`; comando `npm run crear-orden:b2c:servicio`. Sintaxis verificada + copia de ticket sincronizada. **NO ejecutado headless aún** (probado E2E solo por DevTools en vivo → orden `6122026VSX6C`).

**Pendiente del flujo (no bloqueante):** reconfirmar BUG-573 (¿llega tarde el correo de cita?), "Saltar cita"→Portal del cliente (mapear), Cisterna sola / Tinaco+Cisterna, CP fuera de CDMX. **Tareas abiertas para próxima sesión:** (a) correr `crear-orden:b2c:servicio` headless para validar el script extendido; (b) **contract estructural del wizard** en `tests/contracts/b2c/` (tag `@contract`, anclar trigger por `img[src*="a634cf17"]`, pinear `builderVisitorId`, tratar presencia como condicional por BUG-457) — **NO construido aún**; (c) botón "crear orden servicio" en el panel `dashboard.js`. El agendado requiere estado Delivered (vía CT API para QA).

### Sesión 19 (2026-06-11) — Panel/dashboard rediseñado + test profundo en vivo + plan de creación de órdenes

Sesión enfocada en el **panel web local** (`scripts/dashboard.js`, `npm run dashboard` → `http://127.0.0.1:4599`): rediseño visual, test funcional profundo y un plan nuevo de creación de órdenes pedido por el usuario. **0 bugs nuevos del sitio** (próximo ID sigue **BUG-B2C-567**); sí se corrigió un bug de la propia herramienta.

**1. Panel rediseñado (capa visual nueva, backend intacto):**
- Estética **Branded Rotoplas** (azul `#009FE3`, fondo claro, tipografía Archivo + IBM Plex Sans/Mono) — hecho con el skill `frontend-design`.
- **DOS tarjetas** (decisión del usuario: solo conservar 2 grupos): **"Checks estructurales"** (filas: Health · Estructura crítica · Suite anónima + hero **"Revisar sitio"** que corre todo) y **"Correos de pedido"** (un botón "Probar flujo de correos").
- **Resultados** = palomita de estado por check (idle/corriendo/OK/revisar) + **log técnico colapsable** ("ver detalle técnico", SSE en vivo con coloreado). Toggle **"Ver navegador"** (headed/headless) → el log imprime `(con ventana)`/`(sin ventana)`. Footer "siempre QA, nunca producción".
- **Backend SIN cambios de fondo** (server HTTP + SSE + ALLOWLIST + IMAP). Cambios concretos: **+ acción `check-all`** (`--grep-invert @capa2` = el hero "Revisar sitio"); **`/config` ahora expone `healthCount`** (lee `HEALTH_URLS.length` de `_targets.js` → **conteo dinámico**, ya no se desfasa).
- **Renombres intuitivos** (jerga → funcional, decisión del usuario): "Capa 2" → **"Correos de pedido"**; "Contracts DOM" → **"Estructura crítica"**.
- Las acciones de **CT utils / move-state / order-status / ver-correos / check-imap siguen en el ALLOWLIST del backend pero NO se renderizan** en la UI (el usuario pidió solo Checks + Correos). Reactivarlas = volver a pintar sus botones.

**2. Test profundo en vivo (verificado con screenshots, Chrome extension):**
- **Health → OK.** `@health` = **16 tests = 15 URLs (`HEALTH_URLS`) + 1 link-check del cascarón** (`0-links` también es `@health`). (Aclara la confusión "8 vs más": el "8" era una etiqueta vieja del mockup; el real es 15 + link-check.)
- **"Revisar sitio" (check-all) → OK final.** Durante la corrida, `1-pdp` falló UN intento (el precio `.dynamic-price.variant-larger` no renderizó) y `retries:2` lo reabsorbió → veredicto verde. **Evidencia viva de "200 ≠ funcional"**: Health dio 200 en todo pero un elemento crítico no renderizó en un intento.
- **"Correos de pedido" → creó orden `6112026EJXTJ`** (headless), pero las **2 verificaciones de correo `@capa2` quedaron `SKIPPED`** (Modo A, sin App Password). **Semántica clave a recordar:** en Modo A el pill verde de "Correos de pedido" significa **"corrió sin fallar", NO "correos verificados"**. El único bloqueador real de la verificación de correo desatendida sigue siendo el **App Password de Gmail (Modo B)** — solo lo puede generar el usuario (2FA en `c.agarcia@rotoplas.com` → myaccount.google.com/apppasswords → `GMAIL_IMAP_PASS` en `.env`).

**3. Bug de la herramienta corregido:** la fila Health decía "8 URLs" (heredado del mockup) → ahora **dinámico = 15**.

**4. PLAN pedido por el usuario (PENDIENTE de construir):** reestructurar la creación de órdenes en el panel en TRES bloques:
- (a) **Flujo completo** (lo actual: crear orden + mover estados + verificar correos).
- (b) **Sección aparte "Crear orden"** (solo crear, sin mover estados) con opciones de:
  - **Tipo:** producto **físico** (como hoy) **+ servicio de LAVADO/CISTERNA** (NUEVO).
  - **Método de pago:** crédito (default) **+ débito + transferencia + efectivo** (efectivo *solo < $5k* — límite por confirmar).
- (c) **Sección "Revisar correos"** (leer el inbox de `ventasecom`).

**5. HALLAZGO CRÍTICO — el "servicio de lavado/cisterna" NO es una compra estándar (verificación EN CURSO):**
- `/servicios-lavado/` es un **wizard de COTIZACIÓN**, no un checkout. Pasos confirmados en vivo: *"1. Elige hasta 3 tinacos/cisternas · 2. Personaliza la capacidad · 3. Cotiza: precio al instante"*. UI: steppers **Tinaco / Cisterna** (+/−) → al subir a 1 aparece dropdown **"Capacidad"** → botón **"Cotizar"** (no "Comprar"; disabled hasta elegir capacidad).
- **PENDIENTE confirmar (me detuve aquí por orden del usuario):** si tras "Cotizar" hay un camino a **carrito/checkout/pago** (a favor: el "Resumen del pedido" del checkout SÍ tiene una línea **"Servicios: 0"**; BUG-461 = el carrito de productos enlaza T&C *de servicios*) **o si solo entrega un presupuesto/contacto** (lead). 
- **Implicación para el plan:** si es solo cotización, "comprar un servicio con tarjeta/débito/etc." **no existe** como flujo → sería otra sección ("Solicitar cotización de lavado"), NO "crear orden". **No prometer la compra de servicio hasta confirmar este punto.**
- Nota: `/products/servicios/` = 8 productos, pero son **tinacos con "instalación incluida"** (producto físico + instalación), NO el servicio de lavado.

**6. Estado del script de creación de órdenes (`scripts/crear-orden-b2c.js`) para el build futuro:** hoy SOLO hace **producto físico** (BASE-PARA-TINACO, SKU 310002) **+ tarjeta crédito 4242 + Sin CFDI**. Tiene un parámetro a medias `CAPA2_PRODUCT_SLUG` (slug del producto) pero **NO parametriza método de pago** (siempre "Pagar" con tarjeta). Para el plan (4) hay que extender: selección de método en checkout/3 (Qwik → click CDP real), tarjeta débito = `4111 1111 1111 1111`, transferencia/efectivo = botón **"Generar pedido"** (no "Pagar") → SPEI PDF / voucher PayNet (flujos ya mapeados E2E en s9/s16, ver inventario §II.5.b y §9.d).

**7. Decisiones ABIERTAS (esperan respuesta del usuario):**
- (a) Construir **content-check** como nueva fila de Capa 1 ("Páginas · contenido mínimo": 1 ancla estable por URL — title/H1/landmark — para las URLs que hoy solo reciben ping 200; **sin engordar Health**, que debe seguir barato/rápido).
- (b) Pill **"omitido" (ámbar)** cuando un run es 100% `skipped` (parsear "X skipped / 0 passed"), en vez del verde engañoso actual.
- (c) **Commitear** `scripts/dashboard.js` (cambios sin commitear al cierre de s19).
- (d) El split de creación de órdenes (punto 4) + métodos de pago + flujo de servicio, **una vez resuelto el punto 5**.

**Órdenes quemadas s19:** `6112026EJXTJ`. **Archivos tocados:** `scripts/dashboard.js` (rediseño visual + acción `check-all` + `healthCount` dinámico + renames). `dashboard-mockups/` = mockups exploratorios previos (4 diseños + 4 layouts, referencia de estilo). Cuenta de creación de orden: `c.agarcia` vía `rotoplas-auth-b2c-capa2.json`.

### Sesión 18 (2026-06-11) — Capa 2 autónoma: Pieza 1 automatizada + pipeline E2E + IMAP plumbing

Cerró los 3 pendientes que dejó la s17 para que `@capa2` corra **desatendido**: (1) IMAP Modo B,
(2) automatizar la creación de orden (Pieza 1), (3) correr el pipeline CT→correo sobre la orden
fresca. Todo verificado en vivo. **No se registraron bugs nuevos** (próximo ID sigue **BUG-B2C-567**).

**(3) Pipeline CT→correo sobre `6102026LQSK7` — E2E en una sola orden (Modo A):**
- ✅ `Confirmed`→"confirmado" (~4 s) · ✅ `Shipped`→"en camino" (~3 s). Reconfirma s17.
- 🔎 **CORRIGE s17:** "punto de entrega" SÍ es reproducible vía CT — el trigger es
  `shipmentState→Pending` (label CT "En Punto de Entrega"), **NO `Ready`** (s17 movió el estado
  equivocado). Disparó en ~2 s. Candidato a asertarse en el check tras 2ª confirmación.
- ✅ **`Delivered`→"entregado" — INCÓGNITA RESUELTA** (retest aislado, orden `6112026B6IX5`:
  Shipped→Delivered directo sin Pending, espera 60 s, "entregado" NO llegó). **Root cause
  (confirmado por el usuario):** avanzar a "Entregado" se hace desde el **portal B2B** (según el
  distribuidor asignado) y el portal **exige subir una imagen de prueba de entrega (PNG/JPG)**
  antes de permitir el avance. El correo dispara sobre ese evento real de fulfillment (con la
  imagen), no sobre el cambio crudo de `shipmentState` en CT. **No es bug ni flaky: gate de
  proceso.** → `Delivered` queda fuera de `@capa2` **por diseño** (irreproducible vía CT solo).
- Evidencia: `evidencias/CAPA2-pipeline-6102026LQSK7.md`. Mapa corregido en `_email.js`
  (`CORREO_REPRODUCIBLE` + nuevo `CORREO_REPRODUCIBLE_CANDIDATO` + root cause de Delivered).

**(2) Pieza 1 AUTOMATIZADA — `scripts/crear-orden-b2c.js`:** checkout B2C E2E headless (Playwright)
como `c.agarcia@rotoplas.com` → login (storageState dedicado `rotoplas-auth-b2c-capa2.json`) →
PDP `BASE-PARA-TINACO` (SKU 310002, comprable para su dirección default Oficina/CP 03100) →
carrito (acepta T&C con **click CDP real**) → checkout 3 pasos → tarjeta sandbox 4242 → "Pagar" →
captura el `orderNumber` de `/order/[n]/`. Imprime `CAPA2_ORDER=…` a stdout. **Probado en vivo →
orden `6112026ZRLFF`** (Open, Paid, $3,103.20) + **correo de creación verificado** (~3 s).
- Quirk resuelto: el B2C **duplica nodos desktop/mobile** y oculta uno (BUG-B2C-005) → `.first()`
  agarra la copia oculta y cuelga. Helper `clickVisible()` recorre las copias y clickea la visible.
- **Prueba E2E sobre la orden AUTO-creada:** `6112026ZRLFF` recorrió el pipeline completo —
  Confirmed→"confirmado" (02:24:22, ~3 s) + Shipped→"en camino" (02:24:41, ~2 s). Cierra el lazo
  crear→transicionar→correo en una orden generada por el script.

**Wiring autónomo — `scripts/capa2-run.js`** (`npm run check:b2c:capa2:auto`): crea la orden fresca
(Pieza 1) y corre el spec `@capa2` con `CAPA2_ORDER` ya seteado (env propagado antes de spawnear
Playwright → evita el problema de `globalSetup` entre procesos). Sin IMAP, imprime las instrucciones
de Modo A y el spec hace **skip honesto** (no inventa verde). Verificado.

**(1) IMAP Modo B — plumbing COMPLETO, bloqueado solo en el App Password:** `imapflow` instalado;
`scripts/check-imap.js` (`npm run check:imap`) valida la conexión; bloque `GMAIL_IMAP_*` añadido a
`.env`; README §Capa 2 documenta el setup. **⛔ Bloqueador real:** Gmail/Workspace **rechaza IMAP
con la contraseña normal** (`Rotoplas2026` → error `Application-specific password required`). Se
necesita un **App Password de 16 caracteres** (generable solo desde la cuenta Google, con 2FA, en
<https://myaccount.google.com/apppasswords>). Al pegarlo en `GMAIL_IMAP_PASS`, `check:b2c:capa2:auto`
queda 100% desatendido. Hasta entonces, la verificación de correo se hace en **Modo A** (Gmail MCP).

**Estado de los 3 pendientes s17:** (1) IMAP → plumbing listo, falta App Password (usuario);
(2) Pieza 1 → **CERRADO** (script + wiring + probado); (3) pipeline sobre orden fresca → **CERRADO**
(probado en 2 órdenes: `6102026LQSK7` y la auto-creada `6112026ZRLFF`). **Comandos nuevos:**
`check:b2c:capa2:auto`, `check:imap`, `crear-orden:b2c`. **Órdenes consumidas (no reusar):**
`6102026LQSK7`, `6112026ZRLFF` (estados quemados).

**Panel web local — `scripts/dashboard.js` (`npm run dashboard` → http://127.0.0.1:4599):** superficie
única clickeable para correr todo el sistema (Capa 2 + checks + utilidades CT) sin memorizar comandos,
pensada para demo y uso diario. Server Node sin deps externas (http + child_process), bind solo a
`127.0.0.1`, **logs en vivo por SSE**, toggle headed/headless (default headed), verificación de correo
adaptativa (IMAP Modo B si hay App Password, si no link a Gmail Modo A). Ambiente fijo QA. Seguridad:
acciones en allowlist + inputs validados (orden alfanumérica, estados de catálogo). **Probado a fondo
(ver `evidencias/CAPA2-dashboard-pruebas.md`):** 12 acciones operativas, validación/seguridad (inyección
y acción/estado fuera de catálogo → 400), las 3 suites Playwright por el panel (health/contracts/anon),
crear-orden + move-state mutantes, y click-through real del front-end. Mockups de diseño en
`dashboard-mockups/` (4 temas de color + 4 estructuras — **decisión de layout PENDIENTE**: el usuario
aprobó los colores Rotoplas pero quiere otra arquitectura; abrir `index-layouts.html` para elegir A–D).

### Sesión 17 (2026-06-10) — Capa 2 pipeline CT→correo: helper + spec @capa2 + proof

**Mejoras al Cut 1:** se saneó `_targets.js` (eliminados `GLOBAL`/`CONTRACTS`/`PAGINAS` —
config muerta nunca importada; los selectores viven co-localizados en cada spec). Suite
sigue verde (28 passed anónimos).

**Capa 2 arrancada (tarea: check orquestado `@capa2`):**
- **Helper `tests/contracts/b2c/_email.js`** — interfaz `waitForEmail({subject, sinceTs,
  bodyIncludes, timeout})` con polling. Backing IMAP (Modo B, autónomo) protegido por
  `GMAIL_IMAP_USER/PASS`; sin creds → skip. Modo A = el agente verifica con Gmail MCP.
- **Spec `3-capa2-pipeline.contract.spec.js`** (`@capa2`, tier lento aislado) — mueve status
  con `ct-api` + verifica correo con `waitForEmail`, secuencial. Comando `check:b2c:capa2`;
  `@capa2` excluido de las suites rápidas (`--grep-invert`).
- **Prueba Modo A en vivo (2 órdenes, evidencia `evidencias/CAPA2-modoA-proof-682026ZF0AN.md`):**
  - ✅ **Causación CT→correo PROBADA** (~4 s): `Confirmed`→"confirmado", `Shipped`→"en camino".
  - ⚠️ **Disparo secuencial obligatorio** — el microservicio notifica-una-vez por estado;
    en ráfaga se pierden correos. El check usa orden fresca + espera entre transiciones.
  - ❌ **`Ready`/`Delivered` NO disparan** "punto de entrega"/"entregado" en órdenes B2C
    `682026…` vía CT (sí existen en serie `692026`, posible B2B/fulfillment real). Fuera
    del check para evitar falsos rojos. Trigger real: incógnita abierta.
  - ✅ **Duplicados de correo = FALSO POSITIVO** (control: 1 transición → 1 correo, x2 órdenes).
    No se registró bug.
- ✅ **Pieza 1 (crear orden por UI) PROBADA E2E** — checkout completo con `chrome-devtools`
  como `c.agarcia@rotoplas.com` → orden **`6102026LQSK7`** (Tinaco Plus+ 2,500 L, SKU 500475,
  $7,372.61, tarjeta sandbox 4242, "Sin CFDI"). Éxito en `/order/6102026LQSK7/` ("¡Tu compra
  ha sido un éxito!", PCI enmascara `**** 4242`). **Correo de creación VERIFICADO** ("en
  proceso", 23:03:23). Evidencias `CAPA2-UI-*.png`. La orden queda FRESCA para el pipeline CT.
- **Pendiente para que `@capa2` corra verde DESATENDIDO:** (1) credenciales IMAP (Modo B) —
  `GMAIL_IMAP_USER/PASS` + `npm i imapflow` — o seguir en Modo A (agente); (2) automatizar la
  Pieza 1 en el spec (hoy se crea por UI a mano; el spec consume `CAPA2_ORDER=<orden Open>`);
  (3) correr el pipeline CT→correo sobre `6102026LQSK7` (Confirmed→Shipped, ya proba­dos
  reproducibles) para cerrar el E2E completo en una sola orden.

### Alcance y límites del Cut 1 (qué vigila / qué NO)

La suite es un **detector de humo estructural**, no un inspector de correctitud. **SÍ** vigila: server responde (200), presencia/visibilidad de elementos load-bearing de la ruta crítica, persistencia real del add-to-cart, gating de T&C, alcance del checkout p1. **NO** vigila: corrección de valores (precio/total correctos), lo visual/pixeles, completar la compra/crear orden (sería Capa 2), comportamiento profundo (stepper recalcula, pago, cupones, búsqueda), móvil/otros browsers, áreas de cuenta, y los 505 bugs (solo 3 como baseline). Evolución natural: **Capa 2 smoke E2E** (completar compra + verificar orden) y Capa 3 (consola/links).

---

## ✅ F7 — Limpieza del inventario (COMPLETADA 2026-06-05)

> **Ejecutada en las sesiones 10–11.** El `inventario-ctas.md` pasó de 7241 a ~6976 líneas: se eliminó el "ruido meta" (correcciones entre agentes, marcadores de sesión, checklists tachados, numeración provisional), se consolidó **Parte IV como tabla maestra única de 487 bugs** (001→516; 6 retirados en apéndice; 23 huecos) y se reemplazaron las listas de bugs duplicadas de recaps grandes por **37 punteros** `→ detalle en Parte IV`, conservando los datos load-bearing (copy verbatim, selectores, hrefs, DOM contracts).
>
> **No-pérdida verificada** contra el backup git `6199d5a` (todo el detalle aún inline): los 490 IDs que existían siguen presentes; 0 duplicados; 0 extras. Script reproducible: `scripts/F7-verify-bugs.js`.
>
> **Auditoría final (sesión 11, 2026-06-05):** corregida jerarquía de headings (101 cambios: I.1.b, I.15, Matriz URLs, II.7.1–II.7.8, II.19.a–II.19.c), eliminados residuos de fecha y metadata contradictoria, migrados 6 pendientes residuales al overview, y actualizados los claims de estado.
>
> ### Formato mixto: decisión de diseño (no pendiente)
>
> Las **descripciones inline de bugs locales** (1–3 bugs co-localizados con su dato estructural en customer pages, FAQs, contacto, tracking, etc.) se conservan a propósito: aportan contexto legible sin ir a Parte IV. Los **punteros** (`→ detalle en Parte IV`) se usan solo en recaps grandes (catálogo §7 de 5–23 filas, wizard, blog, legales). **Esto es intencional, no un defecto.** La Parte IV sigue siendo superconjunto de todos los bugs.

> *El playbook que sigue documenta el procedimiento que se aplicó (referencia histórica del método).*

### El principio que rige todo (leer primero)

> **El inventario describe el sitio como ES hoy. El overview cuenta cómo llegamos a saberlo.**

Es decir: el inventario debe leerse como si lo hubiera escrito **una sola persona, de una vez, en presente**, describiendo el estado actual del sitio y sus bugs. Todo lo que sea "narrativa de proceso" (qué sesión corrigió a cuál, qué se creyó antes, qué se reservó para después) **no pertenece al inventario** → se mueve a este overview (que sí es un log cronológico) o se borra si no aporta.

### Qué es "ruido meta" y cómo encontrarlo

El agente debe **barrer el inventario buscando estos patrones** (con Grep) y limpiar cada aparición según la regla:

| Tipo de ruido | Cómo encontrarlo (grep) | Qué hacer |
|---|---|---|
| Bugs anulados / reclasificados | `ANULADO`, `anulado`, `reclasific` | Borrar el bug de su sección y de la tabla. Si el ID pudo salir en un reporte externo, dejar **una sola línea** en un apéndice "IDs retirados" al final de Parte IV. El hallazgo correcto que lo reemplazó se queda (en limpio, sin narrar la corrección). |
| Correcciones de proceso entre agentes | `Corrección de`, `🛠`, `mi pas`, `mi pasada`, `tras señalamiento`, `corregido` | Borrar la narrativa. Dejar solo el estado final correcto. Si hay una lección reutilizable, resumirla en `tasks/lessons.md`. |
| Referencias a sesiones/fases en el cuerpo | `sesión [0-9]`, `RECTIFICADO en`, `Re-confirmado en`, `Confirmar en F1`, `(deep — F1` | Quitar la referencia temporal. "✅ MAPEADO (deep — F1D.5)" → "✅ MAPEADO". El hecho se queda; el "cuándo/quién" se va. |
| Numeración provisional | `043`, `044`, `reservad`, `renumerar`, `Reconciliación` | Resolver de una vez (ver decisión de Parte IV abajo) y borrar las notas de "pendiente renumerar". |
| Totales de bugs viejos intercalados | `Total.*bugs`, `[0-9]{3} bugs` | Debe existir **un solo** total, al final de Parte IV. Borrar los totales intermedios de sesiones viejas. |

### Procedimiento ordenado (hacer en este orden)

1. **Leer este overview completo primero** — para entender qué es estado real vs. narrativa, antes de tocar nada.
2. **Barrer y limpiar por tipo de ruido** (tabla de arriba), una pasada por patrón. No improvisar: seguir la regla de cada fila.
3. **Resolver la arquitectura de la Parte IV** (decisión pendiente, ver abajo) — es el cambio más grande.
4. **Unificar encabezados y voz**: todos los `## II.x` con el mismo formato; quitar emojis de proceso; presente verbal.
5. **Verificar que no se perdió información** (paso final obligatorio, ver abajo).

### Decisión de arquitectura pendiente — Parte IV (tabla de bugs)

Hoy la tabla consolidada de Parte IV cubre **BUG-001→250 + 435→493**; los **BUG-251→434** solo viven inline en sus secciones (II.7.3–II.20). Hay que elegir UNA de dos opciones y aplicarla completa:
- **(A) Tabla única completa:** migrar los 251→434 a la tabla → Parte IV se vuelve el índice maestro de los ~469 bugs.
- **(B) Inline como fuente única:** eliminar la tabla parcial y que cada bug viva solo en su sección, con un índice ligero.

Recomendación: **(A)** si se quiere un handoff a dev con una sola lista priorizable; **(B)** si se prefiere mantenibilidad (un solo lugar por bug). Elegir y dejarlo consistente.

### Reglas que NO se pueden violar (para no romper el documento)

- **Nunca borrar un hallazgo, dato o evidencia real** — solo se borra la *narrativa sobre cómo se descubrió*. Ante la duda, conservar el dato.
- **No tocar los bloques "Cierre sesión N" de este overview** — son el log histórico legítimo y deben quedar intactos.
- **No renumerar bugs** salvo que se decida explícitamente; romper IDs ya citados causa más daño que el hueco.
- **Mantener las "notas positivas (no-bug)"** — el inventario debe registrar qué funciona bien, no solo los defectos.

### Verificación final (obligatoria al terminar)

- El conteo de bugs distinct debe ser igual antes y después de la limpieza (salvo los anulados, que se restan a propósito y quedan listados en "IDs retirados").
- Un grep de los patrones de ruido de la tabla de arriba debe volver **vacío** (o solo coincidir dentro de los bloques "Cierre sesión N" del overview, que no se tocan).
- Releer 3 secciones al azar del inventario: deben leerse en presente, sin mencionar sesiones ni correcciones.

---

## Ambiente y credenciales

- **URL QA:** `https://qarotoplasmx.io`
- **URL Producción:** `https://rotoplas.com.mx` (verificada s25, 2026-06-16; la suite corre en prod en modo lectura — el dashboard la selecciona con el chip de ambiente).
- **Commercetools:** las 6 llaves `CT_*` **NO se capturan en la UI del panel** (s25) — vienen del `.env` (un API Client compartido en privado, gitignored). `dotenv` las carga al arrancar; `ct-api.js` las lee directo. No son derivables de una sesión del Merchant Center.
- **Cuenta PRIMARIA (desde 2026-06-08):** `c.agarcia@rotoplas.com` / `Rotoplas2026` — "Jorge Rotoplas". **Su inbox se lee con el Gmail MCP → habilita Capa 2 (correos transaccionales):** confirmación de pedido, instrucciones SPEI, reset de contraseña, double opt-in newsletter, auto-reply de contacto. Remitente transaccional B2C: `ventasecom@rotoplas.com` (correo de bienvenida ya verificado el 2026-06-08).
- **Cuenta legacy:** `andrei.garcia@xideral.co` / `Rotoplas2027` — sigue válida pero su inbox (Xideral) NO es accesible aquí; usar solo para flujos que no requieran verificar correo.
- **Sin bot detection** (a diferencia de B2B) — login directo con native value setter, sin `storageState` ni `--disable-blink-features=AutomationControlled`
- **Tarjetas sandbox OpenPay:** mismas que B2B — `4242 4242 4242 4242` aprueba, `4000 0000 0000 0002` rechaza. CVV `123`, vence `12/26`.

---

## Hallazgos arquitectónicos críticos (2026-05-27)

### Framework — Qwik (Builder.io)

Detectado por atributos `q:id`, `q:key`, `q:sstyle` y `on:click="q-DmrdHLKF.js#s_DXXgbBCMguQ[0 1 2]"` en el DOM.

- **Implicación QA:** Qwik usa **resumability** en vez de hidratación. Los handlers se cargan lazy al primer evento. Esto significa que un click inmediato puede dispararse antes de que el handler esté listo — **explica posibles flaky tests con clicks tempranos**.
- **CSS scoping:** las clases generadas tienen prefijo emoji `⭐️` (ej. `⭐️c79o2-0`). NO es un bug visual ni un encoding roto — es la convención de Qwik para CSS scoping a nivel componente. Marca con `[class*="-0"]` o atributos `data-*` son contratos más estables.
- **CMS visual:** el logo y otros assets se sirven desde `cdn.builder.io` → el contenido editorial es manejable desde Builder.io.

### Pila de tracking detectada

Ya cargado en `/` antes de cualquier consentimiento:
- Google Tag Manager + Google Analytics 4 (`G-VL8QZDP9KQ`)
- Google Ads conversion tags (867789465, 11514895263)
- Facebook Pixel (`1111221477251547`)
- Quantum Metric session replay (`quantum-rotoplasb2b2c.js`)
- Dialogflow Messenger (`df-messenger.js`)

**Observación QA:** revisar si existe banner de cookies y si trackea ANTES de consentimiento (posible bug GDPR/LFPDPPP).

---

## Bugs preliminares detectados en F0 (home anónima)

| ID | Severidad | Descripción | Ubicación |
|---|---|---|---|
| **BUG-B2C-001** | MEDIA | Home `/` no tiene `<h1>` — solo H2s. Penaliza SEO y accesibilidad (lectores de pantalla esperan H1). | `https://qarotoplasmx.io/` |
| **BUG-B2C-002** | BAJA | Header texto "Añadiste este articulo a tu carrito" — falta tilde en "artículo". | Header global, `header.header-main` |
| **BUG-B2C-003** | BAJA | Footer link "Contacto" apunta a `/preguntas-frecuentes` en vez de `/contacto/`. El item de al lado "Déjanos un mensaje" sí va a `/contacto/`. Probable copy/paste error en CMS. | Footer global, sección Contacto |
| **BUG-B2C-004** | BAJA | Newsletter footer placeholder "Compartenos un email" — falta tilde en "Compártenos". | Footer global, input email |
| **BUG-B2C-005** | INFO | Footer DOM duplica todos los links 2x (variante desktop + mobile lado a lado en HTML, mostradas con CSS responsive). Pesa el bundle y duplica work del DOM diffing. | Footer global |
| **BUG-B2C-006** | ALTA (privacidad) | Scripts de tracking (GA4, Facebook Pixel, Google Ads, Quantum Metric) cargan en home antes de cualquier consentimiento de cookies visible. Verificar conformidad LFPDPPP. | Global, GTM |

> Numeración B2C: secuencia independiente desde **BUG-B2C-001**. No se mezcla con la numeración B2B (BUG-NEW-001, etc.).

---

## Páginas confirmadas vía footer + scope inicial

### Transaccionales / cuenta
- `/` — Home
- `/cart` — Carrito
- `/login` — Login
- `/signup` — (por verificar) Registro
- `/traking/` — Seguimiento del pedido (link del footer; nota: nombre con typo "traking" en vez de "tracking")
- `/preguntas-frecuentes/` — FAQ
- `/contacto/` — Formulario de contacto

### Catálogo (categorías top-level)
- `/products/almacenamiento/`
- `/products/almacenamiento-especializado/`
- `/products/presurizacion/`
- `/products/purificacion/`
- `/products/tratamiento/`
- `/products/calentamiento` *(sin `/` final — inconsistente con el resto)*
- `/products/conduccion/`

### Servicios / institucional
- `/distribuidores/` — Ubicación distribuidores
- `/servicios/` — Servicios por contratación
- `/blog/` — Blog

### Legales
- `/aviso-de-privacidad`
- `/terminos-y-condiciones`
- `/seguridad-de-la-informacion/`
- PDF externo: `rtp_codigo_de_etica_y_conducta_esp_baja_movil_20190711.pdf`

### Externos (`target="_blank"`)
- `https://b2bdistribuidores.rotoplas.com/login` — portal B2B
- `https://quiero-ser-distribuidor.rotoplas.com.mx/` — captación distribuidores
- `https://rotoplas.com/` — corporativo
- `https://rotoplas.com/sustentabilidad/`
- `https://agroindustria.rotoplas.com.mx/`
- `https://rotoplas.com/careers/`
- PDF: `certification_pci_dss_rotoplas.pdf`
- Redes sociales: Facebook, Instagram, YouTube, LinkedIn (URLs específicas en inventario)

---

## Reglas críticas de la sesión (heredadas del proyecto)

- Escribir hallazgos al inventario en el momento — NO acumular en contexto.
- Screenshots a disco siempre en `tickets/regresiones-smoke-b2c/evidencias/` con naming `F<fase>-<num>-<descripcion>.png`.
- Acentos correctos (á é í ó ú ñ ¿ ¡) en todo texto generado.
- Inspeccionar DOM real antes de escribir cualquier selector.
- Probar autenticado Y como invitado en cada flujo.
- Mobile testing obligatorio (al menos un TC por flujo en 390x844).
- Prohibido subagentes.

---

## Archivos clave

- `tickets/regresiones-smoke-b2c/overview.md` — este documento
- `tickets/regresiones-smoke-b2c/inventario-ctas.md` — inventario consolidado (documento vivo)
- `tickets/regresiones-smoke-b2c/evidencias/` — screenshots numerados por fase
- `tickets/regresiones-smoke/inventario-ctas.md` — referencia B2B equivalente

---

## ✅ Cierre sesión 25 — Suite apta para PRODUCCIÓN + UI del panel + onboarding (2026-06-16)

Sesión enfocada en **correr las validaciones contra producción desde el dashboard**, dejar la
suite verde en prod, pulir la UI del panel y resolver el onboarding (clone + credenciales).
**Sin bugs nuevos del sitio** (los hallazgos fueron de la propia suite/herramienta, no de prod).

**Producción habilitada (`rotoplas.com.mx`):**
- Corrida inicial vs prod arrojó 7 "rotos" → triage con DOM en vivo: **0 eran regresiones de prod**, todos *contract drift* o ambientales.
- **Fixes (commit `b26ba04`):**
  - `dashboard.js`: URL de prod corregida (estaba `rotoplasmx.com`, que no existe → `rotoplas.com.mx`).
  - `_targets.js`: **slug de PDP por ambiente** — el slug QA `/product/BASE-PARA-TINACO/` en prod redirige a `/producto-no-disponible/` (200, pero no es PDP); prod usa `/product/Base-para-tinaco_310002/`.
  - `1-global-layout`: footer T&C **tolerante al slash** (prod sirve `/terminos-y-condiciones/`).
  - `2-money-path` + `2-cart-empty`: `@auth` hace **skip limpio** si no existe `rotoplas-auth-b2c.json` (antes erraba "Error reading storage state").
- **Resultado vs prod:** **68 passed · 11 skipped · 0 fallos** (los 3 `✘` del baseline `bugConocido` son expected-fail). Verificado por CLI y en el dashboard ("Todo en pie").

**UI del panel (commit `b26ba04`):**
- "¿Responden y renderizan?" y "Formularios" ahora son **mosaicos `.zona`** iguales a "Estructura crítica".
- **Todas las secciones colapsadas por defecto**; el auto-expand al correr ya no persiste.
- Fix de bug latente: `restorePills` borraba el contenido del hero al restaurar el estado de "check-all" (se restaura con `setHero`).

**Onboarding / distribución (commits `ae4a9d6`, `201307f`, `8bb1337`):**
- `package.json`: **`postinstall: playwright install chromium`** → un clon nuevo queda listo con solo `npm install` (verificado con un clone real desde GitHub).
- **Commercetools fuera de la UI de credenciales** — sus 6 `CT_*` vienen del `.env` (no de una sesión del Merchant Center; el `client_secret` no es derivable de un login). `dotenv` las carga y `saveEnv` las preserva. La UI ahora solo pide lo que cada usuario llena con SU cuenta: Sesión B2C + Gmail.
- `.env` copiado del proyecto padre → CT funcionando local (token HTTP 200 verificado).
- `GUIA-PARA-CORRER-EL-PANEL.md` reescrita concisa y al día.

**Documentación (s25):** README corregido (URL prod, conteo de bugs 574→~551, referencias muertas a `tests/contracts/b2c/README.md` y `COBERTURA.md` eliminadas, chromium ahora vía postinstall); overview actualizado (este cierre + Ambiente + pendiente #8 con ruta `tests/`).

**Gaps abiertos al cierre s25** (ver lista consolidada arriba, #8): smoke journeys `@smoke`, cross-cutting `@xcut`, contracts móviles, CI. **Onboarding:** `GMAIL_IMAP_PASS` (App Password) sigue faltando → correos en Modo A; `B2C_USER/B2C_PASS` no están en el `.env` → `@auth` se salta hasta generar sesión. **Sitio:** BUG-B2C-566 (reseñas rotas) sigue abierto. **Próximo bug ID: BUG-B2C-567.**

---

## ✅ Cierre sesión 16 — Capa 2 de pagos (SPEI/Efectivo) cerrada + reseñas ROTAS (2026-06-08)

Sesión enfocada en **cerrar los gaps de Capa 2** que quedaban: instrucciones de pago por **Transferencia (SPEI)** y **Efectivo**, y la **notificación de reseñas**. Cuenta `c.agarcia@rotoplas.com` (inbox legible). **+8 bugs nuevos (558–564, 566), total 528 → 536 distinct activos** (numeración hasta **BUG-B2C-566**, próximo **567**; el 565 se retiró por duplicar a BUG-141). Detalle exhaustivo (campo por campo) en inventario **§9.d**.

**Capa 2 PAGOS — CERRADA (efecto externo verificado):**
- **Transferencia** (orden `6820263SS52`): on-site "¡Solo falta un paso!" + "Ver instrucciones" → PDF SPEI de OpenPay (CIE 1411217, ref 26466998854628135203, CLABE sandbox, BBVA, $1,751.60) + **correo "Recibimos tu pedido"** (plantilla **D**, `ventasecom@rotoplas.com`, hilo `19ea918c9ab23e5f`). Llega en segundos.
- **Efectivo** (orden `6820266FJM8`): on-site "¡Tu compra ha sido un éxito!" (sin instrucciones on-site) + **correo "Tu pedido está en proceso"** (plantilla **E**, hilo `19ea92011f86b9b9`) con CTA "Descarga tu Orden de pago" → **voucher PayNet** (ref 1010 1006 5763 9519, tiendas 7-Eleven/Walmart/etc.).
- **Ahora hay 5 plantillas de correo**: A (tarjeta/bienvenida ©2026), B (reset/contacto ©2023), C (status ©2023), **D (SPEI ©2025)**, **E (efectivo ©2023)** — todas `lang=en`. Fragmentación de plantillas = deuda de fondo.
- Bugs nuevos correos/PDFs: **558** (3 titulares distintos transferencia), **559** (©2025 4º año), **560** (espacio antes de coma), **561** ("Váucher"), **562 MEDIA** (`<meta viewport>` corrupto en D y E → no escala en móvil), **563/564** (PDF SPEI OpenPay: "comunicate" sin tilde, "15:17 PM"). Reconfirmados: 545, 547, 552, 554, 555, 556. Extiende **505** (teléfono roto también en voucher PayNet). INFO entorno: comercio OpenPay sandbox "Amigley Bastardo" + `abastardo@rotoplas.com` (config a verificar en prod).

**Reseñas — FUNCIONALIDAD ROTA (hallazgo principal de la sesión):**
- **BUG-B2C-566 (ALTA, pérdida de datos):** publicar una reseña **NO la guarda**. El POST `…/{UUID}/q-data.json?qaction=6umxiG2X9yg` responde **HTTP 200 con `{"success":"0"}`** (fallo), pero el frontend **ignora el flag** y muestra el toast de **éxito** "Tu reseña ha sido enviada para revisión". La reseña se **pierde silenciosamente**: nunca en Realizadas, nunca pública en la PDP, sin correo. **Causa probable:** el payload manda `product` = UUID del slot de reseña en lugar del ID real del producto. Reproducido 2×, auditado con hook `fetch`+MutationObserver pre-submit. Evidencia `CAPA2-19-resena-audit-success0.json`.
- **Empty-state de "Realizadas" con copy incorrecto** ("Aún no has adquirido productos para dejar una reseña") → ya estaba documentado como **BUG-141** (reconfirmado; no es bug nuevo).
- **Capa 2 reseñas NO cerrable** hasta corregir BUG-566 (no hay efecto externo que verificar: ni persistencia ni correo).
- **Lección de proceso:** el `success:0` se detectó al instrumentar la red + toast **antes** del submit (regla `feedback_toast_timing`). El primer intento sin instrumentar pre-submit confundió el falso toast de éxito con "moderación silenciosa" → se perdió tiempo. Regla reforzada.

**Status 30 (Cancelada) y 50 (Facturación Parcial) — FUERA DE ALCANCE B2C:** por decisión del usuario, estos estatus **no se consideran** para este proyecto/tracking B2C (aplican más a B2B). No se buscarán sus correos.

**Limpieza L-012/L-013:** se eliminó la afirmación falsa de que el pago E2E "requiere gesto humano/Playwright y no funciona por CDP" (overview + MEMORY.md). No era cierta.

**Evidencias s16:** `CAPA2-09`…`CAPA2-19` (incl. PDFs `CAPA2-11b` SPEI y `CAPA2-15b` PayNet, y el audit JSON `CAPA2-19`). **Próximo bug ID: BUG-B2C-567.**

---

## ✅ Cierre sesión 15 — Capa 2 DESBLOQUEADA: compra con tarjeta E2E + correo verificado (2026-06-08)

Primera sesión con **inbox legible** (cuenta primaria nueva `c.agarcia@rotoplas.com` / `Rotoplas2026`, "Jorge Rotoplas"). Se ejecutó la compra con tarjeta E2E **en viewport móvil (390×844)** y se **verificó el efecto externo real (Capa 2)** de toda la cadena de correos transaccionales. **+23 bugs nuevos (535–557), total 505 → 528 distinct activos** (numeración hasta **BUG-B2C-557**, próximo **558**). **Capa 2 VERIFICADA en:** bienvenida, confirmación de compra (tarjeta), reset password, newsletter, contacto auto-reply, y 4 correos de cambio de status (confirmado/en camino/punto de entrega/entregado). **3 plantillas de correo** distintas con defectos propios (detalle abajo). Pendiente de Capa 2: SPEI (transferencia/efectivo) y moderación de reseña.

**E2E compra con tarjeta — CERRADO con Capa 2 (orden `6820261ZZA8`):**
- Flujo móvil: PDP "Base para tinaco GDPV" SKU 310002 ($1,551.60, −10%) → cart → checkout 3 pasos (`/checkout/1/` Dirección · `/2/` Información · `/3/` Pago) → pago Visa sandbox 4242 + "Sin CFDI". Total $1,751.60 (subtotal $1,551.60 + envío $200). Ruta éxito `/order/6820261ZZA8/` ("¡Tu compra ha sido un éxito!").
- **Capa 2 — correo de confirmación VERIFICADO.** De `ventasecom@rotoplas.com` → `c.agarcia@rotoplas.com`, asunto "Tu pedido está en proceso", llegó ~segundos tras la compra. Nº de orden, dirección, producto (SKU 310002 ×1), totales y CTA `/traking/6820261ZZA8` correctos. Evidencia: hilo Gmail `19ea82f4b94ea359` + `CAPA2-07`.
- **BUG-480 (logout-tras-compra) NO se reprodujo:** sesión "Jorge Rotoplas" intacta en la confirmación y en `/customer/orders`. La orden **persiste** en `/customer/orders` (estado "Abierto", "Solicitar factura antes del 8 de julio 2026"). Evidencia `CAPA2-08`.

**Bugs nuevos del correo de confirmación (mapeo profundo del HTML + texto plano del hilo `19ea82f4b94ea359`):**
- **BUG-B2C-535 (MEDIA):** método de pago **contradictorio entre canales** — la pantalla de confirmación on-site dice "Tarjeta de **Crédito**" y el correo dice "Tarjeta de **débito**" para el mismo pago (4242).
- **BUG-B2C-536 (ALTA):** la **dirección de envío del correo OMITE el número exterior** — renderiza "Avenida Álvaro Obregón **,** Roma Norte" (sin "191"), pese a que el sitio sí lo muestra. Riesgo de entrega. (El template HTML tiene `Avenida Álvaro Obregón ,` con la variable de número vacía.)
- **BUG-B2C-537 (BAJA):** **divergencia HTML vs texto-plano** del correo — el cuerpo de texto plano incluye una sección "Servicio / instalación" ("El servicio de instalación se programará una vez que recibas el producto…") que el cuerpo HTML **omite** (queda solo como comentario `<!-- SERVICE -->`).
- **BUG-B2C-538 (BAJA):** **links del footer del correo muertos** — "Aviso de privacidad" y "Términos y condiciones" apuntan a `href="#"`.
- **BUG-B2C-539 (BAJA):** **inconsistencia de año en el footer del checkout móvil** — el carrito muestra "© 2026" y el checkout (pasos 1–3) muestra "© 2024". (Extiende BUG-464: el ©2024 convive con un ©2026 en otra vista del mismo flujo.)
- **BUG-B2C-540 (BAJA, a11y):** en el footer del checkout, el link "Términos y condiciones" tiene `aria-label="Aviso de privacidad"` (etiqueta accesible no coincide con texto ni destino).

**Reconfirmados en el checkout MÓVIL (residual #6 — layout 3 pasos — CERRADO, sin overflow X):** BUG-461 (gating de compra → T&C de `/terminos-y-condiciones-serviciados`), BUG-476 (`cc-csc` `maxLength=3` bloquea Amex pese a anunciarlo), BUG-471 (múltiples H1 ocultos en el DOM de cada paso), BUG-495 (campo "Código" de descuento `disabled`). Positivos: PCI correcto (enmascara últimos 4), stepper claro `Dirección · Información · Pago`, campos de contacto `readonly` desde la cuenta, gating T&C correcto.

**Tanda de correos Capa 2 — reset / newsletter / contacto (todos VERIFICADOS llegando a `c.agarcia@rotoplas.com`, +BUG-541–550):**
- **Reset de contraseña** (`/forgot-password` → "Enviar correo") → correo "Restablecer tu contraseña" (hilo `19ea841d525c8345`). **No se clicó el link** (para no invalidar la credencial). Plantilla de correo transaccional **"B"** plagada: BUG-541 (typo "reestablecer"), 542 ("corro electrónico"), 543 ("Comunicate" sin tilde), **544 (ALTA seguridad: link de reset por `http://`)**, **545 (ALTA: footer legal a URLs CamelCase inexistentes `/Terminosycondiciones/` y `/Avisodeprivacidad/`)**, 546 (© 2023), 547 (MEDIA: `<html lang="en">` con contenido español).
- **Newsletter** (footer home, "Suscribirse") → correo "Bienvenido a newsletter" (hilo `19ea843d16b4dad8`). **BUG-548 (MEDIA consentimiento): es single opt-in** ("Ya estás suscrito" inmediato, sin doble confirmación). BUG-549 (copy "Bienvenido a newsletter" sin "al"). Reconfirma BUG-004 (placeholder "Compartenos" sin tilde).
- **Contacto** (`/contacto/` con datos válidos + tipo "Asesoría de Ventas") → auto-reply "Hemos recibido tu mensaje" (hilo `19ea8459014573ee`): _"Gracias por tu mensaje… No es necesario que contestes a este correo."_ Reusa el footer de plantilla B (BUG-542/543/546). +BUG-550 (campo mensaje es `<input>` no `<textarea>`).
- **Dos plantillas de correo distintas:** **A** (compra/bienvenida) = footer © 2026, `lang="es"`; **B** (reset/contacto) = footer © 2023, `lang="en"`, links legales rotos. Conviene unificar.
- **⏳ Pendiente de Capa 2:** instrucciones **SPEI** (transferencia/efectivo — requiere otra compra), notificación de **moderación de reseña**, y los **correos por cambio de status** (20→70, el usuario moverá la orden 6820261ZZA8 — ver tarea/"mapeo por status").

**Correos por cambio de status (orden `6820261ZZA8`, el usuario la movió en backend) — Capa 2 status, +BUG-551–557.** Plantilla de correo **"C"** (notificaciones de status), una por transición, todas de `ventasecom@rotoplas.com` con CTA "Ver mi pedido" → `/traking/6820261ZZA8`. Mapeados a fondo (HTML+texto plano de los hilos):

| Correo (subject) | Copy de status | Hilo Gmail |
|---|---|---|
| "Tu pedido fue confirmado" | "Estamos preparando tus productos, pronto estarán listos para ser enviados." | `19ea847281d467dd` |
| "Tu pedido **esta** en camino" | "Tu pedido **esta** en ruta de entrega y lo recibirás hoy." | `19ea847653607994` |
| "Tu pedido está en punto de entrega" | "Un repartidor se encuentra en la dirección de entrega con tu pedido listo." | `19ea847b25ddbc23` |
| "Tu pedido fue entregado" | "Tu pedido ha sido entregado con éxito." | `19ea8485e27ed1e7` |

Bugs de la plantilla C (compartidos salvo donde se indica):
- **BUG-551 (BAJA copy):** título "Dirección de **facuración**" (sin "t") en el correo "confirmado". **Inconsistente:** el correo "entregado" lo tiene bien ("facturación") → mismo defecto vive en unas plantillas de status y en otras no.
- **BUG-552 (MEDIA datos):** teléfono de soporte **"55 1234 5678"** = número placeholder/falso (las plantillas A/B usan el real 800 506 3000).
- **BUG-553 (ALTA):** footer "Términos y condiciones" y "Aviso de privacidad" con **`href=` vacío** → links muertos.
- **BUG-554 (MEDIA datos):** dirección de envío malformada **"Avenida Álvaro Obregón, 191, **,** 06700, Cuauhtémoc, Roma Norte, … Mexico"** (doble coma por nº interior vacío; "Mexico" sin acento; orden alcaldía/colonia invertido).
- **BUG-555 (BAJA):** el **texto plano omite las filas de la tabla de Productos** (el HTML sí las trae).
- **BUG-556 (MEDIA datos/fiscal):** aunque la compra fue **"Sin CFDI"**, los correos de status muestran **factura genérica RFC XAXX010101000 con CP fiscal 04950** (≠ CP de envío 06700; origen del 04950 desconocido).
- **BUG-557 (BAJA copy):** correo "en camino" — **"esta"** sin tilde en asunto y cuerpo (debe "está").
- Reconfirma en cada status: BUG-535 (débito), 546 (© 2023), 547 (`lang="en"`). Positivo: footer "Comunícate" correcto (≠ plantilla B). Sin CTA de reseña en "entregado".
- **Nota:** no se observaron correos para status 30 (Cancelada) ni 50 (Facturación Parcial) — confirmar si esas transiciones no notifican o no se ejecutaron.

**Tres plantillas de correo distintas en total:** A (compra/bienvenida, ©2026 `lang=es`), B (reset/contacto, ©2023 `lang=en`, legal CamelCase rota), C (status, ©2023 `lang=en`, legal `href` vacío, tel falso). Recomendación de dev: unificar plantilla, `lang`, footer legal y año.

**Datos clave reutilizables:** cuenta `c.agarcia@rotoplas.com` ya tiene dirección "Casa / Avenida Álvaro Obregón 191, Roma Norte, 06700" + cobertura sembrada en `localStorage` (incluye SKU 310002). Remitente transaccional B2C: `ventasecom@rotoplas.com`.

**Próximo bug ID: BUG-B2C-551.**

---

## ✅ Cierre sesión 13 — Reseña E2E en vivo + descarte de la matriz (2026-06-07)

Sesión con dos frentes: (1) **mapeo E2E en vivo del flujo de reseñas** (el último gap "PARCIAL" de la lista) y (2) **limpieza documental** — descarte de la matriz B2B↔B2C + verificación de no-desactualizados. **+6 bugs nuevos (529–534), total 499 → 505 distinct activos** (numeración hasta **BUG-B2C-534**, próximo **535**).

**Comprensión asistida por 3 subagentes Haiku read-only** (autorizado por el usuario, anulando puntualmente la regla anti-subagentes): auditoría de desactualizados del overview, extracción del estado de reseñas + límites de la Parte V, e integridad del conteo de bugs (confirmó 505 IDs en cuerpo, 6 retirados, 23 huecos, ruido meta residual ~0).

**Reseña E2E (II.11b) — CERRADO con DevTools en vivo (cuenta Jorge García, "Base para tinaco GDPV" SKU 310002):**
- **Widget de estrellas (editor):** `div.StartContainer` + 5× `<span>` `cursor:pointer` sin `role`/`aria-label`/`tabindex` (se exponen como `StaticText "☆"`); al seleccionar N → `★` clase `active` color `rgb(255,184,0)`. Gating publicar correcto (disabled hasta ≥1 estrella). Contador estático sin conteo en vivo → **BUG-534**.
- **Publicar:** POST qaction `/customer/reviews/{UUID}/q-data.json?qaction=6umxiG2X9yg` → toast **"Tu reseña ha sido enviada para revisión"** (moderación) → aparece en "Realizadas" con ★★★★☆.
- **Eliminar:** gatillo basura (icon-only sin role/aria/tabindex → **BUG-531**, requiere click real CDP) → modal `div.modal-cancelation` sin role=dialog/aria-modal (**BUG-529**), X sin aria-label (**BUG-530**), typo `containerButons` (**BUG-532**), H3 con espacio sobrante (**BUG-533**), botones "Eliminar"(secondary)/"Cancelar"(primary, acción segura primaria = positivo) → POST qaction `…?qaction=nz27VmKylew` → toast **"Reseña eliminada"**. Confirmados en vivo BUG-138/140/141/143. Evidencia `F2-33`. **Data de prueba eliminada** (sin pollution).

**Matriz B2B↔B2C DESCARTADA:** la Parte V del inventario era solo un esqueleto con placeholders `_por verificar_`; el usuario decidió que no aporta a este equipo. Eliminada del inventario (sección + índice navegable + intro 6→5 partes + nota inline en II.8) y de los pendientes del overview. Se conserva la etiqueta "Parte VI" (DOM contracts) para no romper referencias internas. **F6 = solo Parte VI ahora.**

**Verificación de no-desactualizados:** el conteo se reconcilió a 505 (la tabla F7 decía "487" pre-s12); cookies/BUG-006 y banner promo ya estaban cerrados en el inventario (no figuran como pendientes vivos, solo en bloques históricos s9 que no se tocan).

**Próximo bug ID: BUG-B2C-535.**

---

## ✅ Cierre sesión 12 — Gap-closure con DevTools en vivo (2026-06-07)

Sesión dedicada a **cerrar huecos de mapeo abiertos usando DevTools MCP contra el sitio en vivo** (sesión autenticada Jorge García / andrei.garcia@xideral.co). **+11 bugs nuevos (517–528 con 512 hueco), total 487 → 499 distinct activos** (numeración hasta **BUG-B2C-528**, próximo **529**).

**Cerrados:**
1. **II.18.c Blog deep** — paginación off-by-one **sistémica** (blog + `/category/`); `/category/{slug}` mapeada (filtra bien, sin H1, title genérico, posts en raíz `/{slug}` con `<a>` reales → BUG-147 NO aplica al blog); **feed RSS inexistente** (`/feed/` falso-200 catchall Qwik, `/blog/feed/` 503, blog ausente de los 3 sitemaps → **BUG-518/519**); `article:modified_time="Thu Jan 01 1970"` **sistémico** (2/2) + formato JS-Date inválido (BUG-231 ampliado, BUG-227 corregido). Evidencia `F2-30`.
2. **III.6/III.8 Lighthouse mobile** — Home 89/58/100/33, PDP 77/58/92/33; estable vs desktop, sin regresión móvil. Evidencia `F4-04`.
3. **II.8 §19.b Toggle instalación** — abre modal **"¡Instálalo con nosotros!"** (NO recalcula precio inline); anatomía deep con selectores/handlers/copy → **BUG-520–525** (sin role=dialog, título `<p>`, cerrar icon-only sin aria, CTA `<div>`, tel texto plano, copy modo-verbal). Evidencia `F1C-30`. *Persistencia del add-on omitida por decisión del usuario:* los 4 tinacos-con-bomba (únicos con toggle) están "No disponible" en 02800 y 06700 → límite de datos de stock QA.
4. **I.6 Paso 2** — sin validación inline (gating-disable hasta Calle+NúmExt+CP+Colonia+Ciudad+Estado+alias); **autofill por CP confirmado** (06700→"Roma Norte" vía Sepomex `?qfunc`); 3er paso = mapa en ruta propia `/customer/address/add/` → "Confirmar punto de entrega"; **guardado SILENCIOSO** (BUG-526) + auto-default sin preguntar (BUG-527). Evidencia `F2-31`. *(Se creó la dirección "Oficina/Roma Norte 06700" como subproducto; "Casa/02800" restaurada como predeterminada al cerrar.)*
5. **III.8 nav móvil** — **items institucionales AUSENTES del menú móvil** (Conócenos/Blog/Recursos/Contacto/Amigo Plomero) → solo categorías + "Servicios" + "Prueba"(TEST) → **BUG-528 (ALTA)**. Evidencia `F4-05`.
6. **I.11 Chatbot Silvia** — **NLU funciona**: round-trip real verificado (recomendación de tinaco correcta + quick-reply). Shadow DOM cerrado pero accesible vía a11y tree/uid. **BUG-050 reconfirmado/agravado** (error fantasma persiste durante la conversación exitosa). Evidencia `F2-32`.

**Bloqueados que siguen abiertos:** Capa 2 correos (sin inbox); BUG-480 logout-tras-compra (requiere compra tarjeta exitosa); persistencia add-on instalación (sin SKU instalable en stock QA); checkout móvil de 3 pasos (residual menor, requiere SKU en cart); **F6** (Parte V matriz + Parte VI DOM contracts → `tests/contracts/b2c/`).

**Próximo bug ID: BUG-B2C-529.**

---

## ✅ Cierre sesión 10 — Limpieza F7 del inventario (2026-06-05)

Pasada única de limpieza que convierte `inventario-ctas.md` en un documento de una sola voz, en presente. **Sin tocar el sitio** (transformación documental); Parte IV verificada como superconjunto antes de borrar cualquier inline.

**Hecho:**
- **Parte IV cerrada:** total único **487 bugs distinct activos** (numeración hasta BUG-B2C-516; 6 retirados: 010, 011, 271, 398, 399, 499 → apéndice "IDs retirados"; 23 huecos, incluidos 213–219 que nunca existieron). El conteo previo "494/491" era erróneo (no contaba el hueco 213–219).
- **37 punteros** `→ detalle en Parte IV` reemplazando listas de bugs duplicadas en Parte I (I.1–I.16), Parte II (home, signup, catálogo §7, wizard PDP §6, II.17–II.20) y catálogo. Datos load-bearing conservados in-context.
- **Ruido eliminado:** badges de estado, "sesión N", "RECTIFICADO/🛠/Corrección", checklists `[x]`/`[ ]`, "Pendiente Fx", refs de fase en celdas de Parte IV (BUG-034/131/210/212/413). Grep de ruido limpio (salvo `_Pendiente F6._` legítimo en Parte V).
- **Estructura:** sin dobles `---`, índice navegable 1:1 con el cuerpo, sin headers de tabla huérfanos, wizard II.16.c renumerado 1→10 contiguo, `/forgot-password/` reducido a puntero a I.14.c.
- **Pendientes preservados:** los gaps reales que vivían como notas "Pendiente Fx" en el inventario se rescataron al overview → "Gaps menores por sección" (I.7 widget CP, login inline, forgot submit, vista Imprimir, toggle instalación PDP, publicar reseña, sub-casos wizard BUG-457, blog profundo).

**Verificación de no-pérdida:** `node scripts/F7-verify-bugs.js` → 490 IDs del backup todos presentes, 487 activos, 0 duplicados, 0 extras. ✅

**Método:** 4 subagentes read-only barrieron el archivo por rangos disjuntos y devolvieron specs de edición exactos; las escrituras se aplicaron en serie (un solo archivo → escrituras paralelas lo corromperían). El `Edit` por match exacto actuó de red de seguridad.

**Decisión:** las tablas de bug de 1–3 filas co-locadas con su dato estructural (ej. BUG-276 junto a image-origins) se conservan inline; solo se pointerizaron las recap grandes. Parte IV tiene ambas. Pointerizar el resto queda como opción de uniformidad 100% (no urgente, sin pérdida).

**Pendiente del proyecto:** F6 (Parte V matriz + Parte VI DOM contracts) + los gaps menores del overview + Capa 2 correos (bloqueada por inbox).

---

## ✅ Cierre sesión 9 — Gap-closure transaccional deep (Transferencia + Efectivo + Signup + Guest + F2 parcial) (2026-06-04)

Sesión de cierre de gaps de mapeo con profundidad total (meta + headings + cada botón/link/handler + copy verbatim + DOM contracts). **+12 bugs nuevos (505–516), BUG-499 descartado.**

**Transferencia E2E (orden 6520265MD5Y) — §9.b deep:**
- Guard liberado: `642026G8FS4` avanzó a "En camino" (pago validado backend).
- Confirmación **`/order/[n]/` "¡Solo falta un paso!"** (distinta a tarjeta) → CTA **"Ver instrucciones"** abre **PDF SPEI de OpenPay** (pestaña nueva) con datos bancarios completos. Mapeo deep: meta (title/desc placeholder, **robots ausente BUG-515**), headings (H2 modal I.6 preceden H1 → jerarquía invertida), 4 botones con handlers Qwik, PDF SPEI campo por campo.
- **BUG-499 DESCARTADO** (datos sí se entregan; el fallo s8 fue el state-leak del modal fiscal). **BUG-500 = state-leak** (modal fiscal solo si se tocó CFDI). **BUG-505** teléfono "null" en PDF. **BUG-514** confirmación sin resumen de orden (productos/dirección/totales). **BUG-516** etiquetas SPEI ambiguas (CIE vs Referencia).

**Efectivo E2E (orden 652026BIL00) — §9.c deep:** reutiliza la pantalla de éxito estándar (II.6) — H1 **"¡Tu compra ha sido un éxito!"** + resumen de orden COMPLETO. **BUG-506** mensaje "éxito" con pago pendiente (engañoso vs transferencia). **BUG-507** sin instrucciones/referencia en pantalla (solo correo). Copy "48 horas naturales para" correcto (typo BUG-492 es exclusivo de transferencia).

**Signup E2E (cuenta creada) — §II.3.b:** registro funciona (login inmediato, sin gate de verificación de correo). **BUG-509** sin feedback de éxito (redirige a /login silencioso). **BUG-510** "Crear cuenta" no gated por casilla de privacidad. **BUG-511** email sin validación de formato inline. Reglas de password validadas (positivo).

**Cross-state invitado — §II.5 cross-state:** tabla comparativa auth vs guest (header, banner ubicación, "Disponibilidad por zona", reseñas sin botón). **BUG-481 extendido a sistémico** (add-to-cart anónimo no persiste, en PDP principal + cross-sell → checkout inalcanzable sin sesión). **BUG-508** "se el primero" → "sé el primero".

**F2 parcial:** **Vaciar carrito sin modal de confirmación (BUG-513**, patrón BUG-131). Stepper +/- recalcula + envío gratis a $2,000 (§12, positivo). Login fallido → "Usuario o contraseña incorrectos" (positivo). Contacto submit vacío → "Este es un campo requerido". Newsletter: campo se limpia pero **sin toast de feedback** (a documentar). **Logout** redirige a /login (BUG-146). **BUG-480 logout-tras-compra NO se reprodujo** (sesión persiste tras transferencia y efectivo).

**Evidencias nuevas:** `F1C-24` (estatus 642), `F1C-25/26/27` (transferencia: confirmación/modal/PDF SPEI), `F1C-28` (efectivo confirmación), `F1C-29` (guest cart vacío).

**Próximo bug ID: BUG-B2C-517.**

### Pendientes F2 que faltan mapear DEEP (próxima continuación)
- **Modal I.6 dirección** ("Cambiar"/"Comprobar disponibilidad con otro CP"): validaciones inline + autofill por CP + endpoint POST + mapa Google interactivo.
- **Chatbot Silvia** (Dialogflow): enviar mensaje real, mapear respuesta, quick-replies, persistencia, shadow DOM.
- **Banner de cookies + gating de trackers (BUG-006):** limpiar storage, recargar, capturar si GA4/FB Pixel/Quantum disparan ANTES del consentimiento; comportamiento del botón "Acepto".
- **Newsletter:** endpoint POST + double opt-in (el campo se limpia sin feedback visible).
- **Contacto:** submit VÁLIDO → toast/redirect/endpoint.
- **Banner promo close-promo:** ¿el dismiss persiste en localStorage o reaparece al recargar?
- Luego: **F6 contracts** + **F7 limpieza**.

---

## ✅ Cierre sesión 8 — Gap-closure transaccional + F4 mobile + F5 auditorías (2026-06-04)

### Resumen ejecutivo

Sesión dedicada a **cerrar los huecos pendientes que dejó la sesión 7**: modales del PDP, los 4 huecos del checkout, F4 mobile y las auditorías globales F5 (Parte III). Se cerraron 6 de los 9 frentes; el de **Transferencia/Efectivo quedó parcialmente bloqueado por un guard de negocio + validación backend** (ver abajo). **+11 bugs nuevos (BUG-B2C-494 → 504)** → total **480 IDs distinct** (máx 504), **95 evidencias**.

> ⚠️ Nota para la limpieza (F7): los prefijos de evidencia **F1C-18 y F1C-19 colisionan** — la sesión 7 ya los usó (`F1C-18-cart-empty-state.png`, `F1C-19-checkout-cfdi-fiscal.png`) y la sesión 8 los reusó con otro sufijo (`F1C-18-pdp-modal-cp-reusa-I6.png`, `F1C-19-checkout-codigo-descuento-disabled.png`). Ambos archivos existen y las referencias en el inventario usan el nombre completo, así que nada se rompe, pero conviene normalizar la numeración en la pasada de limpieza.

### Frentes cerrados

| # | Frente | Resultado | Sección inventario |
|---|---|---|---|
| 1 | **PDP gap-closure (modales)** | Los 3 "modales" NO son modales propios: **Compartir** = reveal inline de 3 `<a>` sin `rel` (BUG-345 confirmado en vivo); **Cambio CP** = reusa componente I.6; **Escribir reseña** = navega a `/customer/reviews/` sin deep-link (BUG-494). B2C **no tiene** Compra Rápida. | II.8 §18–19 |
| 2 | **Código de descuento** | Inoperante: input `disabled` permanente + "Aplicar" no-op silencioso (BUG-470/495). | II.5.b §11 |
| 3 | **CFDI autofill por C.P.** | **Funciona** (positivo): CP 02800 → Colonia "Nueva Santa María" + Municipio "Azcapotzalco". | II.5.b §12 |
| 4 | **Tarjeta rechazada** (`4000…0002`) | Mapeada: error inline, sin crear orden, copy roto (BUG-498). Modal fiscal "Datos fiscales incorrectos" se dispara aun con "Sin CFDI" (BUG-500). | II.5.b §14 |
| 5 | **F4 Mobile (390×844)** | Home/PDP/cart/customer sin overflow X; menú "Menú principal" con 9 categorías; PDP sin sticky add-to-cart (BUG-504). | III.8 |
| 6 | **F5 Auditorías (Parte III)** | III.2 consola limpia; III.3 red (tracking dominante + PII en estado Qwik BUG-501 + proveedor Kushki vs OpenPay); III.5 **B2C no usa AG Grid**; III.6 Lighthouse (Home A11y 83/BP 58/SEO 100; PDP 77/58/92); III.7 a11y (contraste BUG-502, target-size BUG-503). | III.2–III.8 |
| 7 | **BUG-480 logout** | **NO se reprodujo** tras el pedido de transferencia (sesión se mantuvo). Posiblemente específico del path de tarjeta o intermitente. | Parte IV |

### Frente parcial / bloqueado — Transferencia y Efectivo (BUG-499/500)

- **Transferencia "Generar pedido"** crea la orden server-side (**No. de pedido 642026G8FS4**, $1,751.60, POST 200 + GA `purchase`) **pero NO muestra los datos bancarios** (CLABE/cuenta/referencia) prometidos — ni en checkout (overlay "Procesando" + modal fiscal) ni en el detalle de la orden. → **BUG-499 (ALTA, a confirmar)**.
- **Guard de negocio confirmado** (por el usuario): no se puede generar un nuevo pedido por transferencia con uno pendiente — toast *"Por favor completa la transferencia que tienes pendiente del pedido anterior para habilitar esta opción."* (positivo). Esto bloqueó la 2ª corrida limpia.
- **Estado:** el usuario simuló el pago en OpenPay; el pedido 642026G8FS4 sigue **"Orden en proceso"** (la validación/cambio de estatus depende de backend/SAP manual — ver "Qué NO automatizar" en CLAUDE.md). **Pendiente para próxima sesión:** una vez validado el pago (libera el guard), reintentar transferencia limpia para confirmar/descartar BUG-499 y mapear la pantalla de **instrucciones de Efectivo** (mismo path "Generar pedido").

### Frentes pendientes (no iniciados esta sesión)

- **F6** — Matriz comparativa B2B↔B2C (Parte V) + DOM contracts ejecutables (Parte VI). *(Pendiente)*
- **F7** — limpieza del inventario + reconciliación tabla Parte IV (migrar 251–434). ✅ **COMPLETADA (sesiones 10–11, 2026-06-05).** Ver bloque F7 arriba.

### Evidencias nuevas (verificadas en disco)

`F1C-18` (modal CP=I.6), `F1C-19` (código descuento disabled), `F1C-20` (CFDI autofill), `F1C-21` (tarjeta rechazada), `F1C-22`/`F1C-23` (transferencia), `F4-01` (menú móvil), `F4-02` (PDP móvil), `F4-03` (cart móvil).

### Próximo bug ID: **BUG-B2C-505**

---

## ✅ Cierre sesión 7 — Gap-closure F1D: nav submenús + sub-páginas (2026-05-28)

### Resumen ejecutivo

Cierre de los **gaps reales que la sesión 6 dejó** dentro de F1D, con la profundidad homogénea del resto del documento (meta, headings, DOM, links, expandibles, comportamiento esperado, contracts). Se descubrió además 1 sub-ruta funcional no conocida y 1 hallazgo crítico de inestabilidad de contenido.

### Gaps cerrados

| # | Gap | Sección | Bugs | Evidencia |
|---|---|---|---|---|
| 1 | **Nav submenús expandibles** (Rotoplas Servicios, Amigo Plomero, Ver mas) | I.2 §Submenús | BUG-435–439 + **corrige BUG-010/011** | F1D-12 |
| 2 | **`/recursos/videos/`** (9 categorías, carrusel, Qwik) | II.19.a | BUG-440–443 | F1D-13 |
| 3 | **`/recursos/tips/`** (8 tips, WordPress + Popup Maker) | II.19.b | BUG-444–446 | F1D-14 |
| 4 | **`/recursos/libreria/`** (catálogo + 3 "Próximamente", WordPress) | II.19.c | BUG-447–450 | F1D-15 |
| 5 | **`/nosotros/quienes-somos/`** (descubierta: 2ª sub-ruta funcional) | II.17.a | BUG-451 | F1D-17 |
| 6 | **`/nosotros/presencia/`** (8 oficinas MX + Latam) | II.17.b | BUG-452–456 | F1D-16 |
| 7 | **Wizard cotización `/servicios-lavado/`** | II.16.c | **BUG-457** | F1D-18 |

### Hallazgos clave

1. **BUG-010/011 eran incorrectos** — los items "Rotoplas Servicios"/"Amigo Plomero" del nav NO son StaticText muertos: son **submenu-launchers** con 8 links externos (revelados en hover). El a11y snapshot no los exponía por falta de `role`/`aria-haspopup`. Anulados y reclasificados → BUG-436. Los 8 links externos van con `target="_blank"` **sin `rel="noopener"`** (BUG-435, afecta todas las páginas).
2. **`/nosotros/quienes-somos/` existe y funciona** (200) — el inventario solo conocía `/presencia/`. Ahora son 2 las sub-rutas funcionales; `/estrategia` (410), `/identidad/` y `/empleos/` (error) siguen rotas.
3. **`/recursos/` mezcla 2 stacks** (Qwik en /videos/, WordPress en /tips/ y /libreria/) y **3 convenciones de breadcrumb** distintas en el mismo árbol.
4. **BUG-457 CRÍTICO — wizard de cotización con presencia inestable:** la sesión 6 lo mapeó funcional con evidencia (flujo $899 + cart); en esta verificación (reload + scroll completo, mismo CP CDMX + cuenta) **está ausente del DOM**. Builder.io A/B/feature-flag o regresión. Los 5 pendientes del wizard (Cisterna, combo, cart, CP no-CDMX, volver) quedan **BLOQUEADOS** hasta confirmar con dev. Contracts no pueden asertar el wizard.

### Estado de bugs al cierre sesión 7

> ℹ️ **Total FINAL de la sesión 7: 469 bugs distinct (máx BUG-493, próximo BUG-494).** Las cifras intermedias abajo (433, 454) son sub-totales del progreso cronológico de la sesión, no el total actual.

**Sub-total tras gap-closure F1D: 433 bugs distinct** (máx **BUG-B2C-457**). **+23** (435–457), 1 CRÍTICO (BUG-457), 2 ALTA (BUG-435, 447/448). **BUG-010/011 anulados** (reclasificados).

### Deuda de documentación (CRÍTICA, diferida)

> Acordado con el usuario: el inventario acumuló **ruido meta entre sesiones** (notas de corrección/contradicción interlineadas). Se hará una **pasada de limpieza completa al terminar el mapeo** — registrada en el bloque "🔴 DEUDA DE DOCUMENTACIÓN" al inicio de este overview + tarea de F7. En el mapeo de esta sesión se aplicó ya la convención limpia (presente, estado actual) para no añadir más deuda; el único meta nuevo intencional es el status de BUG-457 (necesario para los contracts) y el marcador de anulación de BUG-010/011.

### F1D — estado real tras gap-closure

**F1D cerrada al 100% de lo mapeable.** Lo no mapeado restante es por causa externa, no por gap:
- `/recursos/bim-revit-descargas/` → cross-domain a `rotoplas.com.mx` (fuera de scope QA, BUG-415).
- Pendientes del wizard (Cisterna/combo/cart/CP/volver) → bloqueados por BUG-457 (wizard ausente).

### Continuación — II.5 `/cart/` mapeado deep (misma sesión)

Tras cerrar F1D se mapeó el **carrito** (II.5), núcleo transaccional que era placeholder. Mapeado con 1 item real (Tamboplas 250L, SKU 500040). Hallazgos: BUG-458 (steppers vacíos, CRÍTICO a11y — completa el patrón sistémico PDP+wizard+cart), BUG-459 (checkbox T&C sin id/name/aria), BUG-460 (item sin link a PDP), **BUG-461 ALTA legal** (T&C de la compra linkea a términos de *servicios*, agrava BUG-038), BUG-462/463. **Positivo:** gating correcto de "Iniciar compra" por aceptación de T&C. Evidencia `F1C-12`, dump `F1C-cart-deep.json`.

### Continuación — II.5.b `/checkout/[1-3]/` mapeado deep (misma sesión, sin pago real)

Tras /cart se mapeó el **checkout completo de 3 pasos** (Dirección → Información → Pago), avanzando el funnel con el item real **sin completar pago ni colocar orden**. Layout propio (header/footer minimalista). **15 bugs nuevos (464–478)**:
- **BUG-476 ALTA funcional:** `cc-csc maxlength=3` pero se ofrece Amex (CVV 4 dígitos) → pagos Amex imposibles.
- **BUG-471 ALTA SEO/a11y:** 3 H1 en la página de pago + jerarquía invertida (toggle CFDI como H1).
- **BUG-464:** footer checkout `© 2024` vs footer global `© 2026`.
- BUG-473 métodos de pago como `<div>` (no radios), BUG-474 `autocomplete=off` bloquea autofill tarjeta, BUG-475 sin inputmode numeric, BUG-466/467 legal cross-domain a prod, BUG-470 código descuento disabled.
- **Positivo:** gating de "Pagar" por T&C + campos de contacto readonly. Evidencias F1C-13/14/15, dump `F1C-checkout-deep.json`.

### Continuación — II.6 confirmación de compra `/order/[n]/` (pago sandbox autorizado)

Con autorización del usuario se completó un **pago sandbox** (tarjeta 4242, Sin CFDI) → **orden de prueba 52820261OYM4** colocada en QA. Checkout E2E con tarjeta **CERRADO**.
- **Ruta real de éxito: `/order/[orderNumber]/`** (no `/checkoutfinished/`, que es ruta muerta → error, BUG-034/144).
- **4 hallazgos POSITIVOS:** (1) **PCI correcto — tarjeta enmascarada a últimos 4** (`**** 4242`), contraste directo con BUG-119 de B2B (6 dígitos); (2) **H1 real** "¡Tu compra ha sido un éxito!"; (3) carrito se vacía tras compra; (4) confirmación completa (No. pedido, email, dirección, pago).
- Sin bugs nuevos en la confirmación (página limpia). Evidencias F1C-16/17, dump `F1C-order-confirmacion-deep.json`.
- **Carrito ahora vacío** (la compra lo vació) — disponible para mapear empty state.

Pendientes del checkout: métodos Transferencia/Efectivo, toggle CFDI (campos fiscales), código descuento, tarjeta rechazada (4000…0002), verificar orden en `/customer/orders`.

### (Sub-checkpoint intermedio — SUPERADO)

> Esta nota era el "Cómo retomar" tras mapear el checkout (sub-total 454). **Superada** por las continuaciones posteriores de la misma sesión (order/empty/add-to-cart/métodos/CFDI). El estado final y el "Cómo retomar" vigente están al **final del bloque de sesión 7** (total 469, próximo BUG-494).
4. Pendientes del carrito: empty state, modal "Vaciar carrito" (¿confirma?), stepper +/- recálculo.
5. (resuelto) empty state + add-to-cart + métodos pago + CFDI mapeados — ver continuación abajo.

### Continuación — empty cart + F1C.10 + métodos pago + CFDI + E2E validado (misma sesión)

Cerrados los huecos restantes del núcleo transaccional:
- **Empty state del carrito** (II.5 §8): "Tu carrito está vacío" + ilustración + "Ver productos". Verificado que "Iniciar compra"/"Vaciar carrito" se ocultan.
- **F1C.10 add-to-cart CERRADO:** autenticado **persiste** (badge empty→1, item en /cart); **anónimo da falsa confirmación** (drawer "Añadiste..." pero no persiste → **BUG-481**).
- **Métodos de pago** (II.5.b §9): Transferencia y Efectivo ocultan el form de tarjeta y cambian el botón a "Generar pedido" (48h para transferencia).
- **Toggle CFDI** (II.5.b §10): form fiscal de 14 campos mapeado completo (Uso CFDI 5 opciones, Régimen Fiscal 20 — catálogo SAT completo). Bugs de naming (`ProductoSat`/`idproductosat`/`steet`/`privacity`/`region`/`city`) + catálogo Uso CFDI incompleto (BUG-493).
- **E2E validado:** orden 52820261OYM4 aparece en /customer/orders.
- **+15 bugs (479–493)**, 1 CRÍTICO (**BUG-480 logout tras compra**), 2 ALTA (481 add anónimo, 483 cross-sell CTA invertido).

**Total: 469 bugs distinct** (máx BUG-493). Próximo ID: **BUG-B2C-494**. Carrito con 1 item (Tamboplas) tras re-login.

### Pendientes que quedan (huecos restantes)

- Código de descuento (campo disabled en los 3 pasos — ¿cuándo se habilita?)
- Pantallas de instrucciones post "Generar pedido" (Transferencia datos bancarios / Efectivo referencia)
- Tarjeta rechazada `4000…0002` → pantalla de error de pago
- CFDI: autofill Colonia/Estado/Municipio por C.P. (select `building`)
- **BUG-480 reproducibilidad:** confirmar si el logout-tras-compra es consistente (sin repetir compra)
- PDP gap-closure (modal Compartir/Reseña/CP), Compra Rápida, cross-state mobile, F5/F6
- **Pasada de limpieza** ✅ COMPLETADA (sesiones 10–11). Ver bloque F7 arriba.
- PDP gap-closure: la sonda de s7 re-confirmó share sin `rel` (BUG-345), CP modal `.ModalOpen` (BUG-334), toggle instalación (BUG-331); **los modales (Compartir/Reseña editor/CP) NO se abrieron** — siguen pendientes

---

## ✅ Cierre sesión 6 — F1D contenido marketing COMPLETO (2026-05-28)

### Resumen ejecutivo

Sesión enfocada en **cerrar F1D** (las 4 secciones de contenido marketing que quedaban pendientes de las sesiones 4 y 5), con mapeo deep exhaustivo de cada página: meta tags, estructura semántica, todos los selects/inputs/botones/links con su comportamiento esperado, image origins y bugs con ID propio. **F1D queda CERRADA al 100%.**

> ⚠️ La sesión anterior se cortó (límite de uso) tras escribir el contenido al `inventario-ctas.md` pero **antes de actualizar este overview**. Esta entrada reconstruye el cierre a partir del inventario ya escrito (II.15, II.16, II.19, II.20 + bugs 353–434).

### F1D — Cierre completo de contenido marketing (4 secciones nuevas deep)

| Sub-fase | Página | Sección inventario | Bugs nuevos clave | Estado |
|---|---|---|---|---|
| **F1D.3** | `/distribuidores/` | II.15 | BUG-353, 354, 355, 356, 358, 361, 362, 366 — buscador de distribuidores con Google Maps + 2 selects encadenados (estado→ciudad) | ✅ deep |
| **F1D.4** | `/servicios/` + `/servicios-lavado/` | II.16 | incluye BUG-401 (stepper a11y sistémico) + cross-domain Builder.io | ✅ deep |
| **F1D.5** | `/recursos/` | II.19 | BUG-414 (breadcrump a `tempmx.rotoplas.com` roto), 415, 416, 417, 418, 419 — hub de 4 categorías + "Conoce más" 3/6 links rotos | ✅ deep |
| **F1D.6** | Legales (`/aviso-de-privacidad/`, `/seguridad-de-la-informacion/`, `/terminos-y-condiciones`) | II.20 | BUG-420 a 434 — title=slug crudo, 5 links auto-referenciales, T&C cross-domain | ✅ deep |

### Bugs CRÍTICOS nuevos de la sesión 6

| BUG | Página | Hallazgo |
|---|---|---|
| **BUG-B2C-353** | /distribuidores/ (+ sistémico en legales/recursos) | Página sin `<h1>` — solo H3. Reconfirma patrón sistémico de ausencia de H1 en todo el sitio. |
| **BUG-B2C-361** | /distribuidores/ select Estado | **Faltan 6 estados mexicanos** incluida **CDMX** (donde vive el usuario). Imposible buscar distribuidor en la propia ciudad. + BELICE listado como estado (es país) + YUCATÁN duplicado. |
| **BUG-B2C-401** | /servicios/ stepper | Botones `less`/`plus` sin aria-label/texto/title/innerHTML (solo SVG). **Idéntico a BUG-318 del PDP → bug sistémico del stepper en todo el sitio.** |
| **BUG-B2C-414** | /recursos/ + /seguridad-de-la-informacion/ breadcrumb | Link "Inicio" del breadcrumb apunta a `https://tempmx.rotoplas.com/` — **host TEMP/staging NO público** (fetch falla). Breadcrumb home roto. Sistémico en páginas Builder.io. |
| **BUG-B2C-428** | /seguridad-de-la-informacion/ | `<title>` es el slug crudo literal `"seguridad-de-la-informacion"` (sin tildes, con guiones, sin espacios). SEO catastrófico. |
| **BUG-B2C-430** | /seguridad-de-la-informacion/ | Sección "Todas nuestras soluciones": **5 links de categoría TODOS apuntan a la propia página** (auto-referenciales rotos). |

### Hallazgos arquitectónicos notables sesión 6

1. **BUG-353 (sin H1) es 100% sistémico** — confirmado en distribuidores, recursos, aviso-de-privacidad y seguridad-de-la-información. Ninguna página de contenido marketing tiene H1 real, solo H2/H3.
2. **`tempmx.rotoplas.com` (host TEMP/staging) filtrado a producción QA** — el breadcrumb "Inicio" de las páginas Builder.io apunta a un host no público (BUG-414). Sugiere que el contenido se editó apuntando a un entorno temporal que quedó hardcodeado.
3. **Stepper a11y roto es sistémico** — BUG-401 (servicios) == BUG-318 (PDP): botones +/- sin ningún atributo accesible en todo el sitio.
4. **T&C generales del e-commerce siguen sin existir** (BUG-037/038 reconfirmados) — `/terminos-y-condiciones` redirige cross-domain a T&C de promo. Bloqueador legal persistente.
5. **2 workspaces de Builder.io mezclados** en /recursos/ (BUG-419) — assets del sitio principal (`b9d901…`) + workspace de servicios-lavado (`4cb0f38…`).
6. **Mezcla de buckets/dominios en links de footer y CTAs** — BUG-249 (`/categoria-producto/` legacy), BUG-395 (`_blank` sin `rel="noopener"`), BUG-201 (bucket prd) reconfirmados en /recursos/ y legales.

### Estado de bugs al cierre sesión 6

**Total acumulado: 410 bugs distinct** (máximo ID BUG-B2C-434). **+76 bugs nuevos en sesión 6** (rango 353–434, con gaps reservados).

### Evidencias generadas en sesión 6 (verificadas en disco)

- `F1D-04-distribuidores-listado.png` — /distribuidores/ inicial
- `F1D-05-distribuidores-jalisco-resultados.png` — resultados tras seleccionar estado Jalisco
- `F1D-06-servicios.png` — /servicios/ full-page
- `F1D-07-servicios-lavado.png` — /servicios-lavado/ full-page
- `F1D-08-recursos.png` — /recursos/ full-page
- `F1D-09-cotiza-widget-inicial.png` — widget de cotización (servicios-lavado) estado inicial
- `F1D-10-cotiza-widget-tinaco1.png` — widget cotización con selección
- `F1D-11-cotiza-resultado.png` — resultado de cotización

### Scripts JSON generados en sesión 6 (verificados en disco)

- `F1D-distribuidores-deep.json` — meta + selects estado/ciudad + Maps embebido
- `F1D-servicios-deep.json` + `F1D-servicios-lavado-deep.json` + `F1D-servicios-lavado-cotizar-search.json`
- `F1D-cotiza-*.json` (6 archivos: widget-anatomy, widget-tree, capacidad, flow, interactivo, resultado) — flujo completo del widget de cotización de servicios-lavado
- `F1D-recursos-deep.json` — meta + H1 + 4 categorías + 6 legacy links + 6 conoce-más + tel/wa CTAs + verificación HEAD sub-recursos
- `F1D-legales-check.json` — verificación HEAD/GET de 6 URLs legales

### Pendientes prioritarios para próxima sesión (sin cambios mayores vs sesión 5)

**Tier S — cerrar F1C:**
1. **F1C.10** add-to-cart con MutationObserver (necesita producto con disponibilidad en CP — cambiar a 06600 CDMX centro)
2. Verificar Comprar ahora / Agregar a carrito en PDP con CP válido
3. Click cross-sell card del PDP → URL destino

**Tier A — gap closure PDP (heredado sesión 5):**
4. Modal "Compartir", "Escribir reseña", toggle "¿Te lo instalamos?", modal cambio de CP

**Tier B — cross-state:**
5. Re-probar TODO como **invitado** (sin auth)
6. Re-probar TODO en **mobile** (390×844)

**Tier C — cierre:**
7. F2 Gap closure (toasts, modales, validaciones)
8. F3 Checkout E2E sandbox
9. F5 Lighthouse + console por página
10. F6 Matriz B2B↔B2C + DOM contracts Parte VI
11. F7 Renumerar bugs 043+044, lista priorizada dev, handoff final

### Cómo retomar la próxima sesión

1. **Leer:** `CLAUDE.md` (regla mapeo exhaustivo) → este overview → `inventario-ctas.md` (II.15, II.16, II.19, II.20 nuevas + Parte IV bugs 353–434).
2. **Cargar herramientas:** `ToolSearch select:TaskCreate,TaskUpdate,TaskList,mcp__chrome-devtools__*`
3. **Próximo bug ID: BUG-B2C-435** (043 y 044 siguen reservados para renumerar en F7).
4. **Próximo prefijo de evidencia:** `F1C-12-...` (add-to-cart) o el que corresponda a la fase elegida.
5. **Browser:** login directo `andrei.garcia@xideral.co / Rotoplas2027` (sin bot detection).

---

## ✅ Cierre sesión 5 — F1C catálogo terminado (listings) + PDP representativa (2026-05-28)

### Resumen ejecutivo

Sesión enfocada en cerrar el catálogo `/products/[categoria]/` completo + descubrir el patrón de routing PDP + mapear PDP representativa con **matriz exhaustiva de cada botón y cada link y su comportamiento esperado** (cumplió regla absoluta del usuario sobre exhaustividad).

**Acuerdo de profundidad ajustado (2026-05-28):** para las 6 categorías nuevas (Presurización, Purificación, Tratamiento, Calentamiento, Conducción, Servicios) se mapean los datos clave (meta + H1 + filtros + paginación + card template + image origins + bugs) sin enumerar producto por producto. La matriz exhaustiva de botones+links del componente listing vive en **Parte I.16** y se referencia desde cada categoría.

### F1C — Cierre completo de listings (8 categorías top + 3 sub)

| Sub-fase | Categoría | Productos / páginas | Bugs nuevos | Evidencia |
|---|---|---|---|---|
| **II.7.3** | `/products/presurizacion/` | 24 / 1 | BUG-251 a 273 (23 bugs) | F1C-05 |
| **II.7.4** | `/products/purificacion/` + sub `/purificadores-de-agua/` | 15+5 / 1 c/u | BUG-274 a 284 (11 bugs) | F1C-06 |
| **II.7.5** | `/products/tratamiento/` | 12 / 1 | BUG-285 a 288 | F1C-07 |
| **II.7.6** | `/products/calentamiento/` | 6 / 1 | BUG-289 a 293 + redirect `/calentamiento` → `/calentamiento/` confirmado | F1C-08 |
| **II.7.7** | `/products/conduccion/` | **652 / 28** (único con paginación) | BUG-294 a 298 | F1C-09 |
| **II.7.8** | `/products/servicios/` | 8 / 1 | BUG-299 a 303 (banner roto + 14 JSX leaks SVG + naming mismatch) | F1C-10 |

### F1C.9 — PDP representativa: `Tinaco Plus+ con Bomba Centrifuga 1,100 litros` (SKU 500545)

**URL patrón descubierto:** PDPs viven en `/product/[NombreCamelCase]_[SKU]/`, NO bajo `/products/[categoria]/[slug]/`. Verificado via `/sitemap-products.xml` → 947 productos indexados.

**Mapeo exhaustivo** documentado en II.8 con:
- Meta tags reales ✓ (las PDP sí tienen `<title>` y description específicos, contraste con listings)
- H1 doble: producto legítimo + **fantasma `"TEST TINACO"`** (BUG-313/314 CRÍTICO — contenido de pruebas Builder.io en producción)
- Sin `application/ld+json` schema.org Product (BUG-315 CRÍTICO SEO)
- Galería contamina con imágenes de cross-sell (BUG-316 CRÍTICO data)
- 15 botones + 71 links con matriz exhaustiva de comportamiento esperado
- Acordeón "Descripción" + "Especificaciones técnicas" con `<details>` nativos ✓
- Especificaciones técnicas como `<div>` no `<table>` (BUG-317)
- Botones cantidad +/- sin aria-label, sin texto, sin title (BUG-318 CRÍTICO a11y)
- 3 share links (FB sharer, Instagram DM, WhatsApp) sin `rel="noopener"` (BUG-345 seguridad)
- Toggle "¿Te lo instalamos en tu hogar?" es `<div>` plano sin estado visible (BUG-331)
- Link "Comprobar disponibilidad con otro CP" es `<p class="ModalOpen">` (BUG-334)
- Cross-sell cards sin `<a href>` (BUG-147 sistémico reincide)
- Reseñas: `<p>` no heading (BUG-319) + clase typo `noStarts` (BUG-341)

**Verificado interactivamente:** click en dot 2 del carrusel migra clase `active` ✓ pero **sin migrar `aria-current`** (BUG-330 a11y).

### I.16 — Componente Listing genérico (NUEVO en Parte I)

Documenta UNA VEZ la matriz exhaustiva del componente listing compartido por las 8 categorías:
- 20 botones / 76 links / 22 `<li>` filtros con comportamiento esperado
- Sidebar de filtros con `<li>` Qwik (BUG-350 sistémico a11y)
- Cards de producto con click en `<div>` intermedio sin label (BUG-147)
- Nuevo botón "Aplicar" en sidebar de filtros (sólo mobile drawer)
- Banner publicitario Builder.io cross-domain a `rotoplas.com.mx/servicios-lavado/` (BUG-352)
- Breadcrumb home icon sin alt (BUG-351)
- 12 instancias de "Buscar distribuidor" con `_blank` sin `rel="noopener"` (BUG-347 sistémico)

### Bugs totales — Estado al cierre sesión 5

**Total acumulado: ~352 bugs** (de 243 al cierre sesión 4 = +109 nuevos en esta sesión, de los cuales **5 son CRÍTICOS** del PDP).

Top CRÍTICOS nuevos sesión 5:
- **BUG-313** PDP con doble H1 (producto + fantasma "TEST TINACO")
- **BUG-314** Contenido literal `"TEST TINACO"` en producción QA via Builder.io
- **BUG-315** PDP sin schema.org JSON-LD Product (rich snippets imposibles)
- **BUG-316** Galería PDP muestra imágenes de productos cross-sell (data contamination)
- **BUG-318** Botones cantidad +/- del PDP sin aria/texto/title — imposible operar con AT

### Hallazgos arquitectónicos notables sesión 5

1. **Routing PDP:** `/product/[CamelCase]_[SKU]/` (con excepciones de slug humano sin SKU para algunos productos de mascotas).
2. **947 productos en sitemap** (vs ~310 visibles en suma de categorías listings) — discrepancia importante. Hay productos NO mostrados en categorías que sí están en sitemap.
3. **Builder.io edita contenido del PDP** — el H1 fantasma `"TEST TINACO"` proviene de un bloque editable del CMS visible en producción.
4. **PDPs SÍ tienen meta tags reales** (single page) — sólo los **listings** (categorías) usan placeholder `"Rotoplas"`. La excepción "buena" entre listings es `/products/calentamiento/` y `/products/servicios/`.
5. **Patrón de discount por familia/categoría** — sistémico:
   - Presurización: -25% mayoritario, mezcla
   - Purificación: -20% completo
   - Tratamiento: -10% biodigestores
   - Calentamiento: 0% (sin descuento)
   - Conducción: mezcla -19% a -25%
   - Servicios: mezcla -9% a -20%
6. **Image origins inconsistentes a nivel de categoría:**
   - Purificación, calentamiento, conducción, servicios: **0 imágenes desde bucket QA correcto** (`rtp-bucket-b2b-qa`)
   - Servicios: 100% Builder.io + commercetools (sin gcs)
   - Tratamiento: única con presencia del bucket qa correcto (8 de 24 imágenes)

### Evidencias generadas en sesión 5

- `F1C-05-presurizacion-listado.png` a `F1C-10-servicios-listado.png` — 6 full-pages de listings
- `F1C-11-pdp-tinaco-plus-completa.png` — PDP full-page con acordeones abiertos
- `scripts/F1C-presurizacion-deep.json` a `scripts/F1C-servicios-deep.json` — 6 dumps de categorías
- `scripts/F1C-pdp-tinaco-plus-deep.json` — extracción inicial PDP
- `scripts/F1C-pdp-expanded-deep.json` — acordeones expandidos
- `scripts/F1C-pdp-all-buttons-links.json` — **15 buttons + 71 links del PDP**
- `scripts/F1C-pdp-interactivos.json` — verificaciones interactivas (dot click, toggle, share btn)
- `scripts/F1C-listing-all-elements.json` — **20 buttons + 76 links + 22 filterLis del listing genérico**

### Pendientes prioritarios para próxima sesión

**Tier S — completar F1C:**
1. **F1C.10** add-to-cart con MutationObserver para capturar toast (necesita producto con disponibilidad en CP 02800 o cambiar CP)
2. Cambiar CP a uno con disponibilidad (ej. 06600 CDMX centro) y validar Comprar ahora / Agregar a carrito en PDP
3. Verificar click en cross-sell card del PDP → URL destino

**Tier S — completar F1D:**
4. `/distribuidores/` — mapa interactivo
5. `/servicios/` + `/servicios-lavado/` (cross-domain referenciado por banner Builder.io del listing)
6. `/recursos/` — catálogo de descargas
7. Legales — `/aviso-de-privacidad/`, `/seguridad-de-la-informacion/`, BUG-212 sobre `/terminos-y-condiciones`

**Tier A — gap closure PDP:**
8. Click "Compartir" → mapear modal de share completo
9. Click "Escribir reseña" → verificar redirect/modal/login requirement
10. Activar toggle "¿Te lo instalamos en tu hogar?" → verificar cambio de precio
11. Modal de cambio de CP (cargado lazy) → mapear inputs+CTAs completos

**Tier B — verificaciones cross-state:**
12. Re-probar todo como **invitado** (sin auth) — verificar diferencias en headers, precios, CTAs
13. Re-probar todo en **mobile** (390×844) — verificar gallery, drawer de filtros, sticky bottom-bar CTAs

**Tier C:**
14. F2 Gap closure — banner Builder.io cross-domain en listings (debería estar?)
15. F3 Checkout E2E — signup → producto disponible → checkout sandbox
16. F5 Auditorías Lighthouse + console errors por página
17. F6 Matriz B2B↔B2C + DOM contracts en Parte VI
18. F7 Cierre: renumerar bugs 043+044, lista priorizada dev

### Cómo retomar la próxima sesión

1. **Leer en orden:**
   - `CLAUDE.md` (regla "Mapeo exhaustivo NUNCA simplificar" — incluye cada link, cada botón, cada comportamiento esperado)
   - Este overview
   - `inventario-ctas.md`:
     - **Parte I.16** componente listing (compartido)
     - **II.7.3 a II.7.8** (deltas específicos de las 6 categorías nuevas)
     - **II.8** PDP completa con matriz exhaustiva
     - **Parte IV** bugs (BUG-251 → BUG-352)

2. **Cargar herramientas:** `ToolSearch select:TaskCreate,TaskUpdate,TaskList,mcp__chrome-devtools__*`

3. **Browser:** sesión actual del Chrome ya autenticada como Jorge García. Si expira → re-login directo.

4. **Convenciones a respetar:**
   - **Próximo bug ID: BUG-B2C-353** (043 y 044 siguen reservados para renumerar en F7)
   - Próximo prefijo de evidencia: `F1C-12-...` (PDP siguiente) o `F1D-04-...`
   - **Profundidad total para CADA mapeo de botón/link/comportamiento** — sin excepciones
   - Live writing al `inventario-ctas.md` INMEDIATAMENTE
   - Cada bug con ID propio, no agrupar

---

## 🔄 Cierre sesión 4 — F1C parcial + F1D parcial (2026-05-27)

### Resumen ejecutivo

Sesión enfocada en **mapeo deep estructural** del catálogo (F1C) y contenido marketing (F1D), siguiendo la regla de **profundidad TOTAL sin simplificar nada** (excepto el listado completo de productos individuales por categoría, lo cual se acordó explícitamente).

### F1C — Catálogo (parcial — 4 secciones deep cerradas)

| Sub-sección | Estado | Productos | Bugs nuevos |
|---|---|---|---|
| **II.7 umbrella** (patrones globales: card anatomy, filtros, paginación, footer integrity) | ✅ deep | — | — |
| **II.7.1 `/products/almacenamiento/`** | ✅ deep | 84 (4 págs × 24, última 12) | meta tags completos, headings, card anatomy con q:ids, image bucket inconsistency `rtp-bucket-b2b-qas` |
| **II.7.1 captadores-pluviales** | ✅ deep | 3 | bucket `rtp-bucket-b2b-prd` (prod en QA), `data-tooltip` presente, className con `\n` literales |
| **II.7.1 tinacos** | ✅ deep | ~48 (2 págs) | **CINCO origins de imágenes**, "Tinaco Plus+" sin distinción visible, geo-locked Tuxtla, Builder.io placeholder compartido por 5 productos |
| **II.7.2 `/products/almacenamiento-especializado/`** | ✅ deep | 168 (7 págs) | H1 sin espacio "Almacenamientoespecializado", 16 truncados de 24, JSX leaks, alt vacío sistémico, og:* placeholders |
| **`/products/mascotas/`** | ✅ deep | 0 (vacía) | H1 vacío, empty state copy de búsqueda, no incluida en footer Productos |
| Resto de categorías (presurización, purificación + sub, tratamiento, calentamiento, conducción, servicios) | ⏸️ Pausado | — | Barrido inicial estructural con fetch HEAD hecho en `scripts/F1C-all-categories-structural.json` — confirma 7/9 con title genérico, conduccion con 28 páginas, servicios con 7 JSX leaks |

### F1D — Contenido marketing (parcial — 2 secciones deep cerradas)

| Sub-sección | Estado | Bugs nuevos |
|---|---|---|
| **F1D.0 barrido inicial** | ✅ verificado | 11 URLs probadas — confirmado BUG-037/038 (`/terminos-y-condiciones` redirige cross-domain a rotoplas.com.mx) |
| **II.18 `/blog/` listing** | ✅ deep | 10 posts mapeados, sin H1, posts en `<div>` no `<article>`, fechas inconsistentes (May 21 2025 vs mayo 21, 2025), paginación off-by-one, categorías sin tilde |
| **II.18.b post individual** | ✅ deep | Blog montado sobre WORDPRESS (`wp-block-heading`) — 3 CMS coexistiendo, `article:modified_time = 1970`, sin H1, sin fecha visible, sin autor visible, sin social share, "Artículos relacionados" muestra productos |
| **II.17 `/nosotros/`** | ✅ deep | Meta `key1=value1` placeholders literales, 4 CTAs duplicados con target inconsistente, `/nosotros/estrategia` HTTP 410, `/nosotros/identidad/` y `/nosotros/empleos/` con "Ha ocurrido un error", URLs legacy `/categoria-producto/` |
| `/distribuidores/`, `/servicios/` + `/servicios-lavado/`, `/recursos/`, legales | ⏸️ Pendiente | — |

### Bugs totales — Estado al cierre sesión 4

**Total acumulado: 243 bugs**
- **23 CRÍTICO** (era 7 al inicio sesión 4)
- 9 ALTA (era 4)
- 2 ALTA-privacidad/legal
- 80 MEDIA (era 40)
- 103 BAJA (era 78)
- 26 INFO (era 15)

**+98 bugs nuevos en esta sesión.**

### Top hallazgos CRÍTICOS nuevos de la sesión 4

| BUG | Severidad | Hallazgo |
|---|---|---|
| **BUG-147** | CRÍTICO SEO/a11y | Cards de producto SIN `<a href>` — navegación PDP solo via Qwik handler (rompe SEO + Cmd+click + screen readers) |
| **BUG-148** | CRÍTICO SSR | JSX comments `{/* Cabeza */}{/* Cuerpo */}` leaked al usuario en 8+ productos |
| **BUG-149** | CRÍTICO copy | Producto "cisterna 10,000lts equipada PLP" muestra nombre interno "PLP/DESC" concatenado |
| **BUG-161** | CRÍTICO SEO | Todas las subcategorías heredan H1 del parent (`"Almacenamiento"` en /tinacos/ y /captadores-pluviales/) |
| **BUG-170** | CRÍTICO SEO | `/products/mascotas/` H1 vacío |
| **BUG-171** | CRÍTICO producto | `/products/mascotas/` con 0 productos (categoría vacía) |
| **BUG-178** | CRÍTICO a11y | TODAS las imágenes de cards tienen `alt=""` sistémico |
| **BUG-201** | CRÍTICO infra | Bucket de PRODUCCIÓN sirviendo imágenes en QA |
| **BUG-208** | CRÍTICO infra | 5 origins distintos sirviendo imágenes en una sola página (qa, qas, prd, builder.io, commercetools) |
| **BUG-222** | CRÍTICO SEO/a11y | `/blog/` sin H1 propio |
| **BUG-230** | CRÍTICO SEO/a11y | Posts individuales sin H1 visible |
| **BUG-241** | CRÍTICO SEO | `/nosotros/` con `meta key1=value1, key2=value2` placeholders literales en producción |
| **BUG-246** | CRÍTICO link roto | `/nosotros/estrategia` HTTP 410 GONE (4 links lo apuntan) |
| **BUG-247** | CRÍTICO link roto | `/nosotros/identidad/` muestra "Ha ocurrido un error" |
| **BUG-248** | CRÍTICO link roto | `/nosotros/empleos/` muestra "Ha ocurrido un error" |

### Hallazgos arquitectónicos notables sesión 4

1. **Tres CMS coexistiendo en el sitio:**
   - **Builder.io** (layouts globales, cards, /blog/ contenedor, /nosotros/ secciones)
   - **commercetools** (catálogo de productos, listings de categorías)
   - **WordPress** (contenido individual de posts del blog, con clase `wp-block-heading`)
   - Cada uno con su modelo de fechas, autoría, slugs, categorización — explica las inconsistencias documentadas.

2. **Cinco origins de imágenes coexisten:**
   - `storage.googleapis.com/rtp-bucket-b2b-qa/...`
   - `storage.googleapis.com/rtp-bucket-b2b-qas/...` (con "s" extra)
   - `storage.googleapis.com/rtp-bucket-b2b-prd/...` ⚠️ producción en QA
   - `cdn.builder.io/api/v1/image/...` (CMS Builder.io)
   - `images.cdn.us-central1.gcp.commercetools.com/...` (commercetools CDN directo)

3. **Qwik resumability lag** — primer click en paginación falla silenciosamente, navegación via URL `?page=N` SI funciona.

4. **Filtros sin a11y semántico:** `<li>` con handlers Qwik en lugar de `<input type="checkbox">` o `<button>`. Keyboard nav no funciona.

5. **className del article con `\n` literales** — atributo HTML técnicamente válido pero rompe selectores CSS, parsers estrictos, getByClass.

6. **`data-tooltip` inconsistente** — algunos productos lo tienen (con nombre completo del producto), otros no.

7. **Subcategorías tienen el nombre correcto en H4 `filter-title`** pero NO en H1 — el dato existe en el DOM mal asignado al nivel incorrecto.

8. **URLs legacy en /nosotros/** — `/categoria-producto/{slug}/` redirige a `/products/{slug}/` (duplicate content para Google).

### Evidencias generadas en sesión 4

- `F1C-01-almacenamiento-listado-inicial.png` — listing /almacenamiento/ pág 1
- `F1C-02-almacenamiento-jsx-leak-cisterna-1200.png` — JSX leak visible
- `F1C-03-mascotas-vacia.png` — categoría vacía
- `F1C-04-almacenamiento-especializado-listado.png` — listing con 7 páginas + H1 sin espacio
- `F1D-01-blog-vacio.png` — listing /blog/ (a pesar del nombre, sí tiene posts; archivo así nombrado por mi diagnóstico inicial incorrecto)
- `F1D-02-post-individual-transformacion.png` — post individual con anatomía WordPress
- `F1D-03-nosotros-listado.png` — /nosotros/ con 4 secciones

### Scripts JSON generados (data persistente para contracts)

- `F1C-almacenamiento-products-dump.json` — sample inicial productos pág 1
- `F1C-almacenamiento-filters-dump.json` — filtros estructura
- `F1C-almacenamiento-filter-items.json` — filtros items completos
- `F1C-almacenamiento-all-pages.json` — 84 productos de las 4 páginas
- `F1C-almacenamiento-full-deep.json` — extracción deep
- `F1C-almacenamiento-especializado-full.json` — extracción deep
- `F1C-captadores-pluviales-deep.json` — extracción deep
- `F1C-tinacos-deep.json` — extracción deep (incluyendo identificación de 5 buckets)
- `F1C-all-categories-structural.json` — barrido inicial de las 9 categorías
- `F1D-url-verification.json` — verificación de 14 URLs de marketing
- `F1D-blog-deep.json` — extracción deep listing blog
- `F1D-blog-cards-deep-v2.json` — anatomía de 10 post cards
- `F1D-blog-post-individual.json` — extracción deep post individual
- `F1D-nosotros-deep.json` — extracción deep /nosotros/

### Pendientes prioritarios para próxima sesión

**Tier S — completar F1C (catálogo deep):**
1. **F1C.3 Presurización** (24 productos pág 1)
2. **F1C.4 Purificación + purificadores-de-agua** (15 + 5 productos)
3. **F1C.5 Tratamiento** (12 productos)
4. **F1C.6 Calentamiento** (6 productos — único con title/meta correctos)
5. **F1C.7 Conducción** (672 productos en 28 páginas — la más grande)
6. **F1C.8 Servicios** (8 productos, 7 con JSX leak — el más roto)
7. **F1C.9 PDPs** — abrir 1 PDP por categoría y mapear (galería, variantes, precio, CTA, reseñas, FAQs producto)
8. **F1C.10 Add to cart** con MutationObserver para capturar toast

**Tier A — completar F1D (marketing):**
9. **F1D.3 `/distribuidores/`** — mapa interactivo, filtros geo
10. **F1D.4 `/servicios/` + `/servicios-lavado/`** — packages, cotización
11. **F1D.5 `/recursos/`** — catálogo de descargas
12. **F1D.6 Legales** — `/aviso-de-privacidad/`, `/seguridad-de-la-informacion/`, y reconfirmar BUG-212 sobre `/terminos-y-condiciones`

**Tier B — verificaciones cross-state:**
13. **F1C.GUEST** — re-verificar categorías + páginas marketing como usuario invitado
14. **F1C.MOBILE** — viewport 390×844, re-verificar todo

**Tier C — cierre:**
15. **F2 Gap closure** — toasts, modales, validaciones de forms
16. **F3 Checkout E2E** — signup → producto → checkout con tarjeta sandbox
17. **F5 Auditorías globales** — Lighthouse, console, network, WhatsApp/Silvia
18. **F6 Matriz B2B↔B2C + DOM contracts ejecutables** Playwright
19. **F7 Renumerar bugs (043+044 reservados), consolidación final, handoff dev**

### Cómo retomar la próxima sesión

1. **Leer en orden:**
   - `CLAUDE.md` (especial atención a "Mapeo exhaustivo NUNCA simplificar")
   - Este `overview.md`
   - `inventario-ctas.md` Parte IV — los **243 bugs** documentados
   - `inventario-ctas.md` Parte II — las páginas mapeadas (especialmente II.7 umbrella, II.7.1, II.7.2, II.17, II.18)

2. **Cargar herramientas:** `ToolSearch select:TaskCreate,TaskUpdate,TaskList,mcp__chrome-devtools__*`

3. **Browser:** abrir `https://qarotoplasmx.io/` con DevTools MCP. Login con `andrei.garcia@xideral.co / Rotoplas2027`.

4. **Convenciones a respetar:**
   - Próximo bug ID: **BUG-B2C-251** (043 y 044 siguen reservados para renumerar en F7)
   - Próximo prefijo de evidencia: `F1C-05-...` (siguiente categoría) o `F1D-04-...` (siguiente sub-página marketing)
   - **Profundidad total no negociable** — la única simplificación acordada es no listar producto por producto en categorías grandes
   - Live writing al `inventario-ctas.md` INMEDIATAMENTE en su sección correspondiente
   - Cada bug con ID propio, no agrupar

5. **Sesión activa de Chrome:** está autenticada como Jorge García / andrei.garcia@xideral.co. Si expira → re-login directo (sin bot detection).

---

## ✅ Cierre F1B — Resumen ejecutivo (2026-05-27, sesión 3)

### Sub-fases completadas

| Sub-fase | Páginas/componentes mapeados | Bugs nuevos | Evidencias |
|---|---|---|---|
| **F1B.1** | I.1.b Header autenticado + I.15 Sidebar customer (DOM contract completo) | +2 (BUG-B2C-099, 100) | F1B-01 |
| **F1B.2** | II.9 `/customer` (Mis datos) + sub-vista editar contacto + modal password (3 secciones) | +10 (BUG-B2C-101 a 110) | F1B-02 a F1B-05 |
| **F1B.3** | II.10 `/customer/orders` (5 pág × 5 = 21 pedidos) + II.10.b detalle pedido con stepper 5 estados | +13 (BUG-B2C-111 a 123) | F1B-06 a F1B-08 |
| **F1B.4** | II.11 `/customer/address` (listado + edit + add + mapa confirmación + delete) | +10 (BUG-B2C-124 a 133) | F1B-09 a F1B-14 |
| **F1B.5** | II.11b `/customer/reviews` (tab Pendientes con 5 cards + tab Realizadas vacío + editor) | +10 (BUG-B2C-134 a 143) | F1B-15 a F1B-17 |
| **F1B.6** | Re-verificación BUG-034 con auth + verificación 404 sistémico | +1 (BUG-B2C-144) | F1B-18 |
| **F1B.7** | Logout (redirect, cookies, feedback) | +2 (BUG-B2C-145, 146) | F1B-19 |

**Cierre F1B: total acumulado de bugs = 145** (**7 CRÍTICO**, 4 ALTA, 1 ALTA-privacidad, 40 MEDIA, 78 BAJA, 15 INFO).

### Bugs CRÍTICOS descubiertos en F1B

| ID | Página | Resumen |
|---|---|---|
| **BUG-B2C-119** | `/customer/orders/{id}` | **Datos de pago muestran 6 dígitos del PAN** (`**********424242` en vez de `**********4242`) → **violación PCI-DSS 3.4**. Riesgo legal y operativo. |
| **BUG-B2C-131** | `/customer/address` botón eliminar | Click "Eliminar {alias}" **borra dirección instantáneamente sin modal de confirmación**. Descubierto en vivo: borré la dirección del usuario y tuve que recrearla. Posibilidad de data loss masivo por taps accidentales. |
| **BUG-B2C-144** | Routing global (404) | **CUALQUIER URL inexistente devuelve HTML 200 + "Ha ocurrido un error"** en vez de HTTP 404. Sistémico. Google indexa páginas de error como contenido válido. Las "11 rutas autenticadas" del BUG-034 son simplemente URLs inexistentes (refinamiento del bug original). |

### Hallazgos arquitectónicos clave (F1B)

1. **URLs reales del área de cuenta:** `/customer`, `/customer/orders`, `/customer/address`, `/customer/reviews` (NO `/mi-cuenta/`, `/account/`, `/mis-pedidos/`, `/orders/` — todas estas son URLs inexistentes que devuelven el error genérico de BUG-144).
2. **Patrón inconsistente de validación entre forms del sitio:**
   - `/customer` modal password → botón disabled hasta llenar (UX correcto)
   - `/contacto/`, `/signup/`, `/forgot-password/`, `/traking/` → permiten submit vacío y muestran error inline
   - **Falta política única de validación.**
3. **Forms sistemáticamente sin `<form>` tag** — inputs sueltos + `<button type="submit">`. Enter no submitea, autofill agrupado roto.
4. **Forms sistemáticamente con `required=false`** en HTML, validación 100% JS — frágil si Qwik no hidrata.
5. **Inconsistencia delete:**
   - Reseñas → SÍ tiene modal "¿Quieres eliminar tu reseña?" (H3 hidden detectado)
   - Direcciones → NO tiene confirmación (BUG-131 crítico)
   - Política coherente debe aplicar a TODO destructive action.
6. **Logout no da feedback** y redirige a `/login/` (esperado: home).
7. **Cookie de sesión es HttpOnly ✅** — buena práctica de seguridad confirmada.
8. **Stepper de pedido tiene 5 estados:** En proceso → Confirmado → En camino → En punto de entrega → Entregado. Pero el listado de pedidos los muestra como "Abierto" (label inconsistente — BUG-122).

### Componentes documentados en Parte I durante F1B

- `I.1.b` Header autenticado (dropdown + dirección guardada + badge cart)
- `I.15` Sidebar área customer (4 links + logout, duplicados con `menuMovil` + `menuDEsk`)

### Páginas documentadas en Parte II durante F1B

- `II.9` `/customer` (Mis datos + Mis datos fiscales + Otros)
- `II.10` `/customer/orders` (listado paginado)
- `II.10.b` `/customer/orders/{orderNumber}` (detalle con stepper)
- `II.11` `/customer/address` (listado + edit + add + mapa)
- `II.11b` `/customer/reviews` (Pendientes + Realizadas + editor)

### Convenciones validadas

- DOM contracts Playwright generados por componente y por página.
- Inspección DOM exhaustiva con los **12 ejes mínimos** integrados a CLAUDE.md + skill (regla agregada en esta sesión tras omisión de botón "Eliminar" icono-only).
- Recovery protocol confirmado: dirección eliminada accidentalmente → recreada manualmente con datos originales.

### Recovery realizado

Tras click accidental en "Eliminar Casa" (sin modal de confirmación → BUG-B2C-131), la dirección guardada del usuario fue borrada. La recreé manualmente con todos los datos originales (Camarones 155k, Nueva Santa María, Azcapotzalco, Ciudad de México, C.P. 02800, alias "Casa"). Verificada visible en `/customer/address`.

---

## 🔄 Handoff — Estado al cierre sesión 3 (2026-05-27)

### Lo entregado

- **F0, F1A, F1B completamente cerradas.**
- **145 bugs documentados** (de 0 al inicio del ticket), 7 CRÍTICOS.
- **Inventario:** 6 partes estructuradas (I Componentes 16 mapeados + II Páginas 11 mapeadas + IV Bugs + V/VI placeholders).
- **Dump JSON paralelo:** `tickets/regresiones-smoke-b2c/scripts/faqs-dump-completo.json` con las 56 FAQs completas.
- **19 evidencias F1A** + **19 evidencias F1B** = 38 screenshots en disco.
- **Regla "Mapeo exhaustivo NUNCA simplificar"** integrada a CLAUDE.md proyecto + skill global.
- **Regla "Inspección DOM 12 ejes mínimos"** integrada (lección permanente tras omisión de botón icono-only).
- **Protocolo "Acciones destructivas durante mapeo"** integrado.

### Lo pendiente — orden recomendado para próxima sesión

**Tier S — Core flows transaccionales:**

1. **F1C — Catálogo EXHAUSTIVO** (9 categorías × subcategorías × PDPs):
   - `/products/almacenamiento/` (+ subcategoría `/captadores-pluviales/`, `/tinacos/`)
   - `/products/almacenamiento-especializado/`
   - `/products/presurizacion/`
   - `/products/purificacion/` (+ `/purificadores-de-agua/`)
   - `/products/tratamiento/`
   - `/products/calentamiento` *(sin `/` final — BUG-007 ya documentado)*
   - `/products/conduccion/`
   - `/products/mascotas/`
   - `/products/servicios/`
   - PDP representativa por categoría (galería, selector variantes, precio, CTA add to cart, reseñas, FAQs producto).
2. **F3 — Checkout E2E con métodos de pago:**
   - Signup → producto al cart → checkout completo con tarjeta sandbox 4242 (verificar comportamiento BUG-119 en checkout también)
   - Otros métodos si están disponibles (transferencia, OXXO, efectivo)

**Tier A — Contenido marketing + gap closure:**

3. **F1D — Páginas contenido:** `/blog/` + posts, `/nosotros/`, `/distribuidores/`, `/servicios/`, `/servicios-lavado/`, `/recursos/`, legales (`/aviso-de-privacidad`, `/seguridad-de-la-informacion/`).
4. **F2 — Gap closure:**
   - Form signup completo (CON datos reales válidos) para mapear flujo de registro exitoso + endpoint
   - Form contacto completo
   - Modal "¿Quieres eliminar tu reseña?" (publicar reseña primero, luego eliminar para capturar modal)
   - Toast post-add-to-cart capturar con MutationObserver
   - Banner cookies: comportamiento al Acepto + verificar si efectivamente bloquea trackers (BUG-006)

**Tier B — Cobertura mobile + auditorías:**

5. **F4 — Mobile (iPhone 12 emulado, 390×844):**
   - Re-validar home, login, signup, cart, checkout, /customer/* en mobile
   - Hamburger menú móvil (verificar si los links `menuMovil` se muestran via CSS responsive)
6. **F5 — Auditorías globales:**
   - Console errors por página
   - Network polling/heartbeat con DevTools MCP
   - Lighthouse (Performance, A11y, SEO, Best Practices) en home + PDP + cart
   - WhatsApp/Silvia chatbot por página (presencia + comportamiento)

**Tier C — Cierre:**

7. **F6 — Matriz B2B↔B2C + DOM contracts ejecutables Playwright** en Parte V y VI del inventario.
8. **F7 — Renumerar bugs 043 + 044 (reservados), consolidación final, lista priorizada para equipo dev.**

### Cómo retomar la sesión

1. **Leer en orden:**
   - `CLAUDE.md` — reglas (especial atención a "Mapeo exhaustivo NUNCA simplificar" + "Inspección DOM 12 ejes")
   - Este `overview.md`
   - `tickets/regresiones-smoke-b2c/inventario-ctas.md` — especialmente Parte IV (145 bugs) y Parte II (las 11 páginas mapeadas)
   - `tickets/regresiones-smoke-b2c/scripts/faqs-dump-completo.json` si vas a tocar FAQs
2. **Cargar herramientas:** `ToolSearch select:TaskCreate,TaskUpdate,TaskList,mcp__chrome-devtools__*`
3. **Browser:** abrir `https://qarotoplasmx.io/` con DevTools MCP. NO requiere `storageState`.
4. **Login B2B2C QA:** `andrei.garcia@xideral.co / Rotoplas2027` (sin bot detection).
5. **Convención live writing:** cada hallazgo al inventario en su Parte correspondiente, INMEDIATAMENTE.
6. **Convención bugs:** próximo número es **BUG-B2C-147** (043, 044 siguen reservados).
7. **Convención evidencias:** próximo prefijo de fase: `F1C-01-...` (F1C catálogo) o el que corresponda a la sub-fase elegida.

### Riesgos / bloqueadores conocidos

- **BUG-119 PCI-DSS** — bloqueador legal SERIO. Validar con equipo seguridad antes de continuar.
- **BUG-131 delete sin confirmación** — usuarios con datos reales corren riesgo. Pendiente fix antes de cualquier release.
- **BUG-144 routing 404 sistémico** — afecta SEO de toda la indexación. Pendiente fix infra.
- **BUG-091 acordeones FAQ no expanden** — pendiente confirmar con click humano real (no programático). Si se reproduce, las 56 FAQs son inaccesibles en producción.

---

## ✅ Cierre F1A — Resumen ejecutivo (2026-05-27, segunda sesión)

### Sub-fases completadas

| Sub-fase | Páginas/componentes | Bugs nuevos | Evidencias |
|---|---|---|---|
| **F1A.3** | I.14.c Form `/forgot-password/` | +5 (BUG-B2C-062 a 066) | F1A-12, F1A-13 |
| **F1A.4a** | I.14.d Form `/contacto/` + página II.14 | +9 (BUG-B2C-067 a 075) | F1A-14, F1A-15 |
| **F1A.4b** | II.13 `/preguntas-frecuentes/` (5 tabs, 56 FAQs, arquitectura JS) | +15 (BUG-B2C-076 a 090, 091-093) | F1A-16 a F1A-22 + `scripts/faqs-dump-completo.json` |
| **F1A.4c** | II.12 `/traking/` vs `/tracking/` | +5 (BUG-B2C-094 a 098) | F1A-23, F1A-24, F1A-25 |

**Cierre F1A: total 96 bugs documentados** (4 CRÍTICO, 4 ALTA, 1 ALTA-privacidad, 27 MEDIA, 51 BAJA, 9 INFO).

### Bugs CRÍTICOS descubiertos en esta sesión

| ID | Página | Resumen |
|---|---|---|
| **BUG-B2C-091** | `/preguntas-frecuentes/` acordeones | Click no expande respuestas — listeners JS inactivos. Las 56 FAQs son inaccesibles si se confirma con click humano real. |
| **BUG-B2C-097** | `/tracking/` (bien escrito) | Devuelve "Ha ocurrido un error". Solo `/traking/` (typo) funciona. El typo está fosilizado como URL canónica oficial. |
| **BUG-B2C-094** | `/traking/` form | Input para número de pedido tiene `name="password"` — confunde password managers, a11y tools, autofill. |
| Heredados | — | BUG-034 (11 rutas autenticadas dan error en lugar de redirect), BUG-056 (`/registro/` roto) |

### Hallazgos arquitectónicos relevantes (no del código del sitio)

1. **Forms NO usan `<form>` element** — patrón sistémico en `/contacto/`, `/traking/`, posiblemente más. Inputs sueltos + `<button type="submit">` con handler Qwik. Implicaciones: Enter no submitea, autofill agrupado roto.
2. **Pattern de `required=false` global** — todos los inputs con asterisco visual `*` tienen `required=false` en HTML. Validación 100% JS — frágil si Qwik no hidrata.
3. **`type="text"` para email/phone** — confirmado en signup, contacto, forgot-password. Bloquea keyboard mobile + validación HTML5.
4. **Acordeones de FAQ son JS vanilla** (no Qwik) con race condition probable contra la hidratación. Tab IDs internos incluyen residuo "serviciados" (era módulo B2B2C).
5. **Title genérico "Rotoplas"** en todas las páginas auditadas excepto `/preguntas-frecuentes/`. Penaliza SEO.

### Convenciones validadas para próximas sesiones

- Live writing al `inventario-ctas.md` en su Parte correspondiente.
- Dumps JSON paralelos en `tickets/regresiones-smoke-b2c/scripts/` para data masiva (ej. `faqs-dump-completo.json`).
- Naming evidencias: `F<fase>-<num>-<descripcion>.png` (próximo prefijo: `F1B-01-...`).
- Numeración bugs consecutiva: **próximo es BUG-B2C-099**. IDs 043 y 044 siguen reservados para renumerar en F7.

---

## 🔄 Handoff — Estado al cierre de sesión 2026-05-27 (sesión inicial)

### Lo hecho

**Setup completo (F0):** estructura de carpetas, framework identificado (Qwik + Builder.io), 2 documentos vivos creados.

**F1A — Mapeo estructural anónimo (cerrada parcial):**
- **Componentes globales mapeados al 100%** en `inventario-ctas.md` Parte I:
  - I.1 Header global (anónimo)
  - I.2 Nav superior (top-bar)
  - I.3 Mega-menú lateral (drawer) — 9 categorías + sub-categorías
  - I.4 Footer global (6 columnas con todos sus links verificados)
  - I.5 Barra promocional close-promo
  - I.6 Modal "Verifica disponibilidad de entrega" / "Agregar dirección" (2 pasos, 8 campos)
  - I.7 Widget verificación CP
  - I.8 Carrusel de productos (genérico — 5 slides)
  - I.9 Tarjeta de producto (con badges descuento / + vendido / segmentación de precio)
  - I.10 Newsletter signup
  - I.11 Chatbot Silvia (Dialogflow CX — agent UUID + config completa)
  - I.13 Mini-cart drawer
  - I.14.a Form Login
  - I.14.b Form Signup (7 inputs + checkbox)
- **Página completa:** II.1 Home anónima `/`
- **Páginas autenticación:** II.2 `/login/`, II.3 `/signup/`
- **22 URLs verificadas** con fetch HEAD + follow redirect (matriz en Parte II tras II.20)
- **11 evidencias** en `tickets/regresiones-smoke-b2c/evidencias/`
- **59 bugs documentados** (numerados BUG-B2C-001 a BUG-B2C-061, con 043+044 pendientes de renumerar)

**Hallazgos arquitectónicos clave (no del código del sitio):**
- Framework: **Qwik (Builder.io CMS)** — implicaciones para selectores documentadas en inventario.
- CSS scoping con prefijo emoji `⭐️` es legítimo de Qwik, NO bug.
- Handlers `on:click="q-XXX.js#..."` cargan lazy → flaky test risk con clicks tempranos.
- Web Components con shadow DOM (chatbot) → mapear vía DevTools snapshot, no JS shadowRoot.

### Top 5 bugs de impacto inmediato (atender primero)

| ID | Severidad | Por qué urgente |
|---|---|---|
| **BUG-B2C-006** | ALTA privacidad | 6 trackers GA4/FB Pixel/Quantum Metric/Ads cargan ANTES de consentimiento. Riesgo LFPDPPP. |
| **BUG-B2C-034** | **CRÍTICO** | 11 rutas autenticadas (`/mi-cuenta/`, `/account/`, `/mis-pedidos/`, `/orders/`, `/checkoutfinished/`, `/wishlist/`, etc.) devuelven HTML 200 con H1 "Ha ocurrido un error" en lugar de redirect a `/login/`. Google indexa pages de error. |
| **BUG-B2C-037+038** | ALTA UX+legal | Link footer "Términos y condiciones" redirige silenciosamente cross-domain a `rotoplas.com.mx/ofertas-rotoplas-terminos-y-condiciones/` (T&C de promo Hot Sale Mayo 2026, no T&C generales). **El sitio no tiene T&C generales del e-commerce.** |
| **BUG-B2C-056** | **CRÍTICO** | `/registro/` devuelve "Ha ocurrido un error" cuando `/signup/` funciona. Si un link interno aún apunta a `/registro/`, el signup queda inaccesible. |
| **BUG-B2C-060** | MEDIA seg | Inputs de signup con asterisco tienen `required=false` en HTML — validación solo JS. Si Qwik falla la hidratación, form se envía vacío al backend. |

### Lo pendiente (orden recomendado para próxima sesión)

**Cierre F1A (faltan 2 sub-tareas):**
1. **F1A.3 cierre** — `/forgot-password/` form completo (URL canónica confirmada).
2. **F1A.4** — `/contacto/`, `/preguntas-frecuentes/` (verificar H1 "Contáctanos" raro — BUG-B2C-036), `/traking/` vs `/tracking/` (descubrir cuál es canónica y resolver duplicación).

**Tier S — atacar después de cerrar F1A:**
3. **F1B — Páginas autenticadas:** login con `andrei.garcia@xideral.co / Rotoplas2027` (sin bot detection, login directo). Mapear `/mi-cuenta/`, `/mis-pedidos/`, sub-rutas, sidebar autenticado, header autenticado (¿cambia "Inicia sesión o regístrate" por dropdown de usuario?). Verificar `/account/` y `/orders/` post-login (¿siguen siendo duplicados es↔en?).
4. **F1C — Catálogo EXHAUSTIVO:** cada categoría (`/products/almacenamiento/`, `/products/almacenamiento-especializado/`, `/products/presurizacion/`, `/products/purificacion/`, `/products/tratamiento/`, `/products/calentamiento/`, `/products/conduccion/`, `/products/mascotas/`, `/products/servicios/`) + cada subcategoría (`captadores-pluviales/`, `tinacos/`, `purificadores-de-agua/`) + PDP representativos. **Decisión usuario: exhaustivo total, no muestra.**
5. **F3 — Checkout transaccional:** registrar con `/signup/`, agregar producto, completar checkout con cada método de pago disponible (sandbox OpenPay `4242 4242 4242 4242` / `123` / `12/26`). Mapear copy post-pago.

**Tier A:**
6. **F1D — Contenido marketing:** `/blog/`, `/blog/[post-slug]`, `/nosotros/`, `/distribuidores/`, `/servicios/`, `/servicios-lavado/`, `/recursos/`, `/aviso-de-privacidad/`, `/seguridad-de-la-informacion/`.
7. **F2 — Gap closure:** abrir cada modal/toast/drawer y mapear comportamientos completos (especialmente: validaciones de login/signup/contacto, toast post-add-to-cart, post-newsletter, post-form-submit).
8. **F4 — Mobile testing:** emular iPhone 12 (390×844, mobile:true) y re-validar home + login + signup + cart + checkout. Verificar hamburger mobile (`button[aria-label="Abrir menú"]`).

**Tier B (cierre):**
9. **F5 — Auditorías globales:** tabla WhatsApp/Silvia por página, console errors, network polling, AG Grid (si aplica), Lighthouse.
10. **F6 — Matriz B2B vs B2C** + DOM contracts ejecutables (Playwright snippets agrupados por componente).
11. **F7 — Renumerar bugs (043+044 disponibles), consolidar handoff final, actualizar overview con estado final.**

### Cómo retomar la sesión

1. **Leer en orden:**
   - `CLAUDE.md` (reglas del proyecto)
   - Este overview
   - `tickets/regresiones-smoke-b2c/inventario-ctas.md` — especialmente **Parte IV (bugs)** y la **matriz de URLs verificadas** (en Parte II tras II.20).
2. **Cargar herramientas:** `ToolSearch select:TaskCreate,TaskUpdate,TaskList,mcp__chrome-devtools__navigate_page,...` (lista en mensaje inicial del usuario).
3. **Browser:** abrir `https://qarotoplasmx.io/` con DevTools MCP. NO requiere `storageState` (sin bot detection). Login directo cuando aplique.
4. **Convención live writing:** cada hallazgo se escribe al inventario INMEDIATAMENTE en su Parte correspondiente. Nunca acumular en contexto.
5. **Convención de bugs:** numerar consecutivos desde **BUG-B2C-062** en adelante (043+044 quedan disponibles para renumerar al cierre F7).
6. **Convención de evidencias:** `tickets/regresiones-smoke-b2c/evidencias/F<fase>-<num>-<descripcion>.png`. Próximo prefijo: `F1A-12-...` o `F1B-01-...`.
7. **Estructura del inventario (NO cambiar):** Híbrido en 6 partes: I Componentes / II Páginas / III Auditorías / IV Bugs / V Matriz B2B vs B2C / VI Contracts. Estructura aprobada por usuario el 2026-05-27.

### Riesgos / bloqueadores conocidos

- **`/registro/` rota** — si el equipo Dev no la repara, BUG-B2C-056 queda pendiente de re-verificación cada sesión hasta que esté reparada.
- **Trackers pre-consent** (BUG-B2C-006) — depende del equipo legal validar si necesita banner.
- **T&C inexistentes para e-commerce** (BUG-B2C-038) — bloqueador legal serio. No puede QA cerrar sin esto resuelto.

---
