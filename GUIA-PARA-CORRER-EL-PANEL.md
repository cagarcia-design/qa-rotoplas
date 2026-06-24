# Correr el Panel QA de Rotoplas B2C

Panel local que revisa que el sitio siga en pie tras cada liberación, en **QA**
(`qarotoplasmx.io`) y **Producción** (`rotoplas.com.mx`).

## Requisitos

**Node.js LTS** — descárgalo de https://nodejs.org, instálalo y reinicia la terminal.
Verifica con `node -v` (debe responder una versión).

## Instalación (una sola vez)

```
git clone https://github.com/cagarcia-design/qa-rotoplas.git
cd qa-rotoplas
npm install
```

`npm install` también descarga el navegador que usan los checks (Chromium). No hay paso extra.

> **Commercetools:** solicita el archivo `.env` al responsable del proyecto y déjalo en la raíz.
>
## Correr

```
npm run dashboard
```

Abre el navegador solo en http://127.0.0.1:4599 (si no, ábrelo a mano). Para apagar: `Ctrl + C`.

> **Actualizar** (ícono de flecha circular ↻ en el header, junto al engranaje ⚙): un clic ejecuta `git pull` + `npm install` **y reinicia el panel** para aplicar los cambios — la página se recarga sola. Si falla, el mensaje explica la causa (sin conexión, conflicto, etc.) en lenguaje claro.
>
> **Reiniciar** (ícono de encendido ⏻, al lado): reinicia el panel sin actualizar — útil si algo se ve raro. La página se recarga sola cuando vuelve.
>
> Comandos manuales de respaldo: `git pull` + `npm install`.

## Configurar tu cuenta (dentro del panel)

Pulsa el **engranaje ⚙ (arriba a la derecha)** para abrir **Ajustes** y captura lo tuyo:

- **Sesión B2C** — usuario y contraseña de tu cuenta de pruebas.
- **Gmail** — buzón + App Password (16 caracteres), solo si vas a verificar correos.

Guarda y pulsa **Generar sesión B2C** (en el mismo Ajustes) para habilitar los checks de
carrito, checkout y cuenta — hace login una vez y guarda la sesión. La **tira de
prerequisitos** de arriba (semáforo: sitio · sesión B2C · correos · Commercetools) te dice
de un vistazo qué falta antes de correr.

## Cómo se ve el panel

Es **una sola página por ÁREA del sitio**. Las secciones arrancan **colapsadas** (clic para
abrir). De arriba hacia abajo:

| Sección | Qué hace |
|---|---|
| **Revisar sitio** (botón maestro) | Corre la revisión de **lectura** de todo el sitio, área por área, y enciende cada celda. No muta datos (~1–2 min). |
| **Resumen** | Salud (✓/✕/○ de la última corrida) + Cobertura del mapa (cuántas celdas tienen prueba). |
| **Mapa por área** | 7 áreas (Header/Footer, Home, Catálogo/PDP, Servicios, Institucional, Compra 🔒, Mi cuenta 🔒) × 4 columnas: **Responde** (carga + renderiza), **Estructura** (elementos críticos), **Flujo** (que funcione, 🔒 muta), **Móvil**. Clic en una celda la corre; **"Correr área"** corre su lectura. ⏳ = pendiente. |
| **Calidad transversal** | "Errores y enlaces" (excepciones JS + 404), Performance (roadmap), PCI. |
| **Evidencias de la última revisión** | Galería de capturas que dejan las corridas, por área. |
| **Datos de prueba** (🔒 QA-only) | Crea un pedido de prueba, avanza sus estados (línea de tiempo) y verifica los correos. |
| **Historial** | Las últimas corridas en este navegador. |

También hay un **Investigar** (se abre sobre cualquier número de orden → estado, pagos,
historial y correos) y el **Ajustes ⚙** ya mencionado.

El selector de arriba a la derecha cambia entre **QA** y **Producción**. En producción solo
corren los checks de lectura; los Datos de prueba (crear orden, mover estado, correos) quedan
deshabilitados.

## Si algo falla

| Síntoma | Qué hacer |
|---|---|
| `node` no se reconoce | Node no quedó instalado, o no reiniciaste la terminal. |
| Puerto 4599 ocupado | Ya se resuelve solo: al arrancar, el panel **reemplaza** cualquier instancia anterior pegada al puerto, así que `npm run dashboard` siempre te da el panel actual. Si aun así fallara, usa otro puerto: `DASH_PORT=4600 npm run dashboard`. |
| Checks en rojo con "browser not found" | Corre `npx playwright install chromium`. |
| Login o carrito se saltan (ámbar/omitido) | Falta sesión: abre **Ajustes ⚙ → Generar sesión B2C**, o corre `npm run auth:b2c`. |
| Botón **Actualizar** da error | El mensaje en pantalla explica la causa. Lo más común: **sin internet** (revisa conexión / VPN) o **archivos ocupados** (cierra VS Code u otras terminales abiertas en esta carpeta y reintenta). Si aparece "cambios locales" o "conflicto", resuélvelo con git (guarda o descarta los cambios locales); el panel sigue funcionando con la versión actual. |
| Tras actualizar, algo se ve raro | Pulsa **Reiniciar** (⏻ en el header): recarga el panel con el código nuevo. Si aun así persiste, apaga (`Ctrl + C`) y enciende (`npm run dashboard`). |

Si un error te bloquea, copia el texto de la terminal para diagnosticarlo.
