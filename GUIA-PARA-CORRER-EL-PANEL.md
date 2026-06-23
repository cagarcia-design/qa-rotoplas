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

> **Commercetools:** pide a Jorge el archivo `.env` y déjalo en la raíz del proyecto.
> No está en GitHub porque contiene secretos. Sin él, "Revisar sitio" funciona igual;
> solo el flujo de correos lo necesita.

## Correr

```
npm run dashboard
```

Abre http://127.0.0.1:4599. Para apagar: `Ctrl + C`.

Para actualizar a la última versión: `git pull` y vuelve a correr `npm install`.

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
| Puerto 4599 ocupado | El panel ya está corriendo: usa la pestaña que ya tienes abierta. |
| Checks en rojo con "browser not found" | Corre `npx playwright install chromium`. |
| Login o carrito se saltan (ámbar/omitido) | Falta sesión: abre **Ajustes ⚙ → Generar sesión B2C**, o corre `npm run auth:b2c`. |

Si un error te bloquea, copia el texto de la terminal y pásaselo a Jorge.
