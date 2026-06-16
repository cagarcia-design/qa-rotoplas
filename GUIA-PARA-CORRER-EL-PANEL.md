# Cómo correr el Panel QA de Rotoplas B2C en tu máquina

Guía paso a paso, pensada para alguien que **nunca ha usado una terminal**. No necesitas saber
programar. Solo seguir los pasos en orden. Calcula **20–30 minutos** la primera vez (la mayoría
es esperar descargas); después, arrancar el panel toma 10 segundos.

> **¿Qué es esto?** Un panel (una página local en tu navegador) que revisa que el sitio B2C de
> Rotoplas siga funcionando después de cada liberación: que cargue, que el login y el carrito
> sigan en pie, etc. Tú le picas un botón y te entrega un tablero de palomitas verde/rojo.

---

## Antes de empezar: lo que vas a instalar (y por qué)

El panel es un **programa**, no una página normal. Para que corra en tu máquina necesita dos
herramientas que se instalan **una sola vez**:

| Herramienta | Para qué sirve | ¿Cada cuándo? |
|---|---|---|
| **Node.js** | Es el "motor" que ejecuta el panel. Sin él, el programa no corre. | Una vez |
| **Git** *(opcional)* | Sirve para descargar el código y mantenerlo actualizado. Si prefieres, puedes bajar un ZIP en vez de usar Git. | Una vez |

Además necesitarás que **Jorge te pase las credenciales** (usuarios y contraseñas de prueba) — esas
se meten **dentro del panel**, no en ningún archivo. Lo vemos en el Paso 5.

---

## Paso 1 — Instalar Node.js

1. Entra a **https://nodejs.org**
2. Descarga el botón que dice **"LTS"** (es la versión estable y recomendada).
3. Abre el archivo descargado y dale **Siguiente → Siguiente → Instalar** (acepta todo por
   defecto, no cambies nada).
4. Cuando termine, **reinicia la computadora** (o al menos cierra todas las ventanas de terminal).

**¿Cómo sé que quedó bien?** Abre una terminal (ve el recuadro de abajo) y escribe esto, luego Enter:

```
node -v
```

Si te responde algo como `v20.11.0` (un número de versión), ✅ quedó. Si dice "no se reconoce el
comando", vuelve a instalar Node y reinicia.

> **¿Cómo abro una terminal en Windows?** Presiona la tecla **Windows**, escribe `PowerShell`,
> y abre **Windows PowerShell**. Es una ventana azul o negra donde escribes comandos.
> **En Mac:** abre la app **Terminal** (búscala con Spotlight, ⌘+Espacio → "Terminal").

---

## Paso 2 — Descargar el código del panel

Tienes **dos opciones**. La A es la más fácil si no quieres instalar Git.

### Opción A — Descargar un ZIP (lo más simple)
1. Pídele a Jorge el **link del repositorio** en GitHub.
2. Ábrelo, dale al botón verde **"Code"** → **"Download ZIP"**.
3. Descomprime el ZIP en un lugar fácil de encontrar, por ejemplo tu carpeta **Documentos**.
   Te quedará una carpeta llamada `rotoplas-qa` (o parecido).

### Opción B — Con GitHub Desktop (mejor para recibir actualizaciones)
1. Instala **GitHub Desktop** desde https://desktop.github.com (instalador normal, siguiente-siguiente).
2. Inicia sesión con la cuenta de GitHub que te indique Jorge.
3. Menú **File → Clone repository**, elige el repo `rotoplas-qa`, y dale **Clone**.
   Esto baja el código y, cuando haya cambios, podrás actualizar con un botón **"Pull"**.

> **Recomendación:** si esto lo vas a usar seguido, vale la pena la **Opción B** — así cuando
> Jorge mejore el panel, tú lo actualizas con un clic en vez de volver a bajar el ZIP.

---

## Paso 3 — Abrir la terminal DENTRO de la carpeta del proyecto

Esto es clave: la terminal tiene que estar "parada" dentro de la carpeta `rotoplas-qa`.

**La forma más fácil en Windows:**
1. Abre el **Explorador de archivos** y entra a la carpeta `rotoplas-qa`.
2. Haz **clic en la barra de dirección** (donde dice la ruta), borra lo que haya, escribe
   `powershell` y presiona **Enter**. Se abrirá una terminal ya ubicada en esa carpeta.

**Para comprobar que estás en el lugar correcto**, escribe esto y Enter:

```
dir
```

Debe aparecer una lista que incluye archivos como `package.json` y carpetas como `scripts` y
`tests`. Si los ves, ✅ estás en la carpeta correcta.

---

## Paso 4 — Instalar lo que el panel necesita (dos comandos)

Escribe estos **dos comandos, uno por uno** (espera a que termine cada uno antes del siguiente):

```
npm install
```

> **¿Qué hace?** Descarga las "piezas" que el panel usa por dentro (las librerías). Tarda unos
> minutos la primera vez y crea una carpeta `node_modules`. Es normal que salga mucho texto.

```
npx playwright install
```

> **¿Qué hace?** Descarga los **navegadores** que el panel usa para revisar el sitio (abre un
> Chrome "robot" por dentro). **Este paso es fácil de olvidar** — si no lo haces, los checks
> fallarán diciendo que no encuentra el navegador.

---

## Paso 5 — Arrancar el panel y configurar las credenciales

1. Arranca el panel con:

```
npm run dashboard
```

2. Verás un mensaje como `Panel QA B2C → http://127.0.0.1:4599`.
   **Abre ese link** en tu navegador (Chrome o Edge): http://127.0.0.1:4599

3. En el panel, despliega la tarjeta **"Configuración (credenciales)"** (la de arriba).
4. Llena los campos con los datos que te pasó Jorge. Como mínimo:
   - **Sesión B2C** (usuario y contraseña) — para revisar la parte que requiere login.
   - **Gmail + App Password** — solo si vas a verificar correos de pedido (opcional).
   - **Commercetools** — solo para estados de orden y correos (opcional).
5. Dale **"Guardar configuración"**. (Se guardan solo en tu máquina; nunca salen a internet.)
6. Dale **"Generar sesión B2C (login una vez)"** — esto inicia sesión con la cuenta de prueba y
   guarda la sesión para los checks autenticados. Se hace una sola vez (repítelo si expira).

> **Lo bueno:** la revisión básica del sitio (botón **"Revisar sitio"**) **funciona sin
> credenciales**. Las credenciales solo desbloquean las partes avanzadas (login, correos, órdenes).

---

## Paso 6 — Usarlo

- Pícale al botón grande **"Revisar sitio"**. En ~1 minuto verás el tablero: verde = todo en pie,
  rojo = algo se rompió (con la explicación de qué fue).
- Para revisar una sola zona, usa los mosaicos de **"Estructura crítica"**.
- El interruptor **"Entorno"** arriba a la derecha cambia entre **QA** (default) y **Producción**.
  En Producción solo se permiten revisiones de lectura; crear órdenes y correos quedan bloqueados.

**Para apagar el panel:** vuelve a la terminal y presiona **Ctrl + C**.

**Para volver a usarlo otro día:** solo repite el Paso 3 (abrir terminal en la carpeta) y el
comando `npm run dashboard`. Los Pasos 1, 2 y 4 NO se repiten.

---

## Si algo sale mal (problemas comunes)

| Lo que ves | Qué significa / cómo arreglarlo |
|---|---|
| `node` no se reconoce como comando | Node no quedó instalado o no reiniciaste. Repite el **Paso 1** y reinicia la PC. |
| `El puerto 4599 ya está en uso` | El panel ya está corriendo en otra ventana. Usa el link que ya tienes, o arranca en otro puerto: escribe `$env:DASH_PORT=4600; npm run dashboard` |
| Los checks fallan diciendo *"browser/executable not found"* | Faltó el navegador. Corre `npx playwright install` (Paso 4, segundo comando). |
| `npm install` da errores rojos | Revisa que tu internet funcione y vuelve a correrlo. Si persiste, mándale a Jorge el texto del error. |
| El panel abre pero "Revisar sitio" sale todo rojo de inmediato | Suele ser que faltó `npx playwright install`, o no hay internet hacia el sitio de QA. |
| No me deja la parte de login / carrito | Te falta generar la sesión: Paso 5, botón **"Generar sesión B2C"**. |

> **Regla de oro:** si te atoras, copia el **texto del error** de la terminal y pásaselo a Jorge.
> Con eso se diagnostica en segundos. No hace falta que entiendas el error — solo copiarlo.

---

## Resumen ultra-corto (para tenerlo a la mano)

```
# Una sola vez:
1) Instalar Node.js (nodejs.org, versión LTS) + reiniciar
2) Bajar el código (ZIP o GitHub Desktop)
3) Abrir terminal en la carpeta rotoplas-qa
4) npm install
5) npx playwright install

# Cada vez que quieras usarlo:
npm run dashboard      → abrir http://127.0.0.1:4599
# (configurar credenciales en la tarjeta "Configuración" la primera vez)
# (Ctrl + C para apagarlo)
```
