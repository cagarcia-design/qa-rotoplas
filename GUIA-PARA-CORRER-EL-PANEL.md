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

En **Configuración (credenciales)**, captura lo tuyo y guarda:

- **Sesión B2C** — usuario y contraseña de tu cuenta de pruebas.
- **Gmail** — buzón + App Password (16 caracteres), solo si vas a verificar correos.

Después pulsa **Generar sesión B2C** para habilitar los checks de carrito, checkout y
cuenta (hace login una vez y guarda la sesión).

## Las tres tarjetas

| Tarjeta | Qué hace |
|---|---|
| **Checks estructurales** | "Revisar sitio" corre todo: que las páginas carguen y rendericen, los links, y la estructura crítica (~1 min). |
| **Correos transaccionales** | Crea una orden de prueba y verifica que lleguen los correos. Requiere Gmail App Password. Solo en QA. |
| **Crear orden** | Crea una orden de prueba sin verificar correos. Solo en QA. |

El selector de arriba a la derecha cambia entre **QA** y **Producción**. En producción
solo corren los checks de lectura; crear orden y correos quedan deshabilitados.

## Si algo falla

| Síntoma | Qué hacer |
|---|---|
| `node` no se reconoce | Node no quedó instalado, o no reiniciaste la terminal. |
| Puerto 4599 ocupado | El panel ya está corriendo: usa la pestaña que ya tienes abierta. |
| Checks en rojo con "browser not found" | Corre `npx playwright install chromium`. |
| Login o carrito se saltan (ámbar) | Falta sesión: pulsa "Generar sesión B2C" o corre `npm run auth:b2c`. |

Si un error te bloquea, copia el texto de la terminal y pásaselo a Jorge.
