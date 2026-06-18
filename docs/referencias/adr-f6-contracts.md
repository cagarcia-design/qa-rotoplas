# ADR F6 — Sistema de checks post-liberación B2C

> **Architecture Decision Record.** Fecha: 2026-06-07, sesión 14.

## Qué es y qué NO es

Pruebas de humo estructurales post-deploy + synthetic monitoring. **NO** es contract testing estilo Pact.

**Trabajo:** detectar cambios en elementos críticos del sitio. **NO** valida precios, stock ni pixeles.

## Arquitectura en capas

| Capa | Tag | Pregunta | Estado |
|------|-----|----------|--------|
| 0 Health | `@health` | ¿URLs dan 200? | Cut 1 |
| 1 Contracts DOM | `@contract` | ¿Estructura crítica sigue ahí? | Cut 1 |
| 2 Smoke E2E | `@smoke` | ¿Flujo login→cart→checkout funciona? | Diferido |
| 3 Cross-cutting | `@xcut` | ¿Errores de consola/links? | Diferido |

## Decisiones de diseño

1. **Selector stability:** prohibido clases hash, IDs generados, `q-*.js`. Jerarquía: roles ARIA → texto → `data-testid`
2. **Baseline ejecutable:** asertar lo que HOY funciona. Bugs conocidos → `test.fixme`
3. **Filtro de criticidad:** solo P1: login, add-to-cart, checkout, nav, footer legal
4. **Base URL por env var:** `B2C_BASE_URL` (default qarotoplasmx.io)
5. **Anónimo primero:** ~80% público; `@auth` en tanda aparte
6. **Imitar usuario real:** nunca atajos por API

## Mitigación de flakiness

| Fuente | Mitigación |
|--------|-----------|
| A/B testing (BUG-457) | Asertar solo invariantes presentes en TODAS las variantes |
| Hidratación Qwik | `domcontentloaded` + settle; `expect.toBeVisible` con auto-retry |
| QuantumMetrics polling | Jamás `networkidle` |
| Disponibilidad volátil | Asertar plantilla PDP, no SKU fijo |

## Triage de rojo

1. ¿Regresión real? → bug
2. ¿Cambio intencional? → actualizar `_targets.js`
3. ¿Flaky? → endurecer selector
4. ¿Bug conocido cambió? → actualizar baseline
