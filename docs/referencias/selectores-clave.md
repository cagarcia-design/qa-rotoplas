# Selectores clave del sitio B2C

## Checkout — DIT-310

| Elemento | Anclaje |
|----------|---------|
| Checkbox "Alguien más recibirá mi pedido" | `input[type="checkbox"]` índice 3; a11y: `checkbox "Alguien más recibirá mi pedido"` |
| Campo "Nombre de la persona que recibe" | `input[placeholder*="recibe"]` |
| Maxlength | 100 caracteres (verificado via DOM) |

## Atención: Qwik

El sitio usa **Qwik (Builder.io)**:
- Handlers `on:click="q-XXX.js#..."` cargan lazy → click CDP real necesario
- Clases CSS con prefijo emoji `⭐️` — es normal, NO bug
- `.click()` programático NO funciona para sincronizar signals Qwik

## Regla de selectores (contracts)

Jerarquía obligatoria:
1. Roles ARIA + texto accesible (`getByRole`)
2. Texto visible / `href` de producto
3. `data-testid` si existe
4. **PROHIBIDO:** clases hash, IDs generados, `q-*.js`

## Disponibilidad por CP

Vive en `localStorage` como `coverage_<CP>`. Los contracts la siembran vía `seedCobertura()` antes de navegar.
