# Cómo correr el Panel QA de Rotoplas B2C

Guía para alguien que **nunca ha usado una terminal**. Calcula **20-30 min** la primera vez (la mayoría es esperar descargas). Después, arrancar toma **10 segundos**.

> **¿Qué es?** Un panel en tu navegador que revisa automáticamente que el sitio `qarotoplasmx.io` siga funcionando tras cada liberación. Tú picas un botón y ves palomitas: verde = bien, rojo = algo se rompió.

---

## Solo una vez

### 1. Instalar Node.js

1. Entra a https://nodejs.org
2. Descarga la versión **LTS** (botón izquierdo)
3. Abre el archivo, dale **Siguiente → Siguiente → Instalar** (no cambies nada)
4. Reinicia la computadora

**Verifica:** Abre PowerShell (tecla Windows → escribe `PowerShell`), escribe `node -v` y Enter. Debe responder algo como `v20.11.0`.

---

### 2. Descargar el proyecto

**Opción A — ZIP (más fácil):**
1. Entra a https://github.com/cagarcia-design/qa-rotoplas
2. Botón verde **Code → Download ZIP**
3. Descomprime el ZIP. Te queda una carpeta `qa-rotoplas`.

**Opción B — GitHub Desktop (recibir actualizaciones):**
1. Instala GitHub Desktop desde https://desktop.github.com
2. Menú **File → Clone repository →** pega `cagarcia-design/qa-rotoplas` → **Clone**.

---

### 3. Instalar dependencias

Abre la terminal **dentro** de la carpeta `qa-rotoplas`:
- En Windows: entra a la carpeta, haz clic en la barra de dirección, escribe `powershell` y Enter.

Ejecuta estos **dos comandos, uno por uno** (cada uno tarda unos minutos):

```
npm install
npx playwright install chromium
```

---

### 4. Generar la sesión de login (solo si necesitas carrito/checkout)

```
npm run auth:b2c
```

Esto abre un navegador, inicia sesión con la cuenta de prueba y guarda la sesión. Sin este paso, los checks que revisan login y carrito se saltan. El resto del panel funciona sin esto.

---

## Cada vez que quieras usarlo

Abre terminal en la carpeta `qa-rotoplas` y escribe:

```
npm run dashboard
```

Abre en tu navegador http://127.0.0.1:4599

**Para apagar:** Ctrl + C en la terminal.

---

## El panel

Tiene tres secciones:

| Tarjeta | ¿Qué hace? |
|---|---|
| **Checks estructurales** | Revisa que el sitio cargue, que el login, carrito y páginas clave funcionen. El botón **"Revisar sitio"** corre todo junto (~1 min). |
| **Correos transaccionales** | Crea una orden de prueba y verifica que lleguen los correos de confirmación (requiere credenciales de Gmail). |
| **Crear orden** | Solo crea una orden de prueba sin verificar correos. Útil para pruebas rápidas. |

> **Sin credenciales, "Revisar sitio" y "Crear orden" funcionan.** Los correos requieren credenciales de Gmail que te pasa Jorge.

---

## Problemas comunes

| Síntoma | Solución |
|---|---|
| `node` no se reconoce | Node no se instaló. Repite el Paso 1 y reinicia. |
| `El puerto 4599 ya está en uso` | El panel ya está corriendo. Usa el link que ya tienes abierto. |
| Checks fallan con "browser not found" | Faltó `npx playwright install chromium` (Paso 3, segundo comando). |
| `npm install` da error | Revisa tu internet y vuelve a intentar. Si persiste, pásale el error a Jorge. |
| Todo sale rojo de inmediato | Probablemente faltó el navegador o no hay internet. Revisa ambos. |
| No funciona login/carrito | Corre `npm run auth:b2c` de nuevo (la sesión expira cada pocos días). |

> **Regla de oro:** si algo falla, copia el texto rojo de la terminal y mándaselo a Jorge. No necesitas entenderlo.

---

## Resumen

```
# Primera vez:
1. Instalar Node.js (nodejs.org, LTS)
2. Bajar el código (ZIP de GitHub)
3. npm install
4. npx playwright install chromium
5. npm run auth:b2c

# Diario:
npm run dashboard   →   http://127.0.0.1:4599
```
