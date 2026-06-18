# Regresiones-Smoke B2C — qarotoplasmx.io

**Iniciativa interna** (gemela de `tickets/regresiones-smoke/` B2B)  
**Inicio:** 2026-05-27 | **Trigger:** Replicar auditoría profunda B2B al sitio B2C

---

## Estado actual

| Fase | Estado |
|------|--------|
| F0 — Setup + framework detection | ✅ CERRADA |
| F1A — Mapeo anónimo | ✅ CERRADA |
| F1B — Mapeo autenticado | ✅ CERRADA |
| F1C — Catálogo exhaustivo | ✅ CERRADA |
| F1D — Contenido marketing | ✅ CERRADA |
| F2 — Gap closure (modales, toasts, validaciones) | ✅ CERRADA |
| F3 — Flujos transaccionales E2E | ✅ CERRADA |
| F4 — Mobile testing | ✅ CERRADA |
| F5 — Auditorías globales | ✅ CERRADA |
| **F6 — DOM contracts ejecutables** | 🔄 **EN CURSO** |
| F7 — Inventario + bugs | ✅ CERRADA |

**Total bugs:** ~551 activos → `bugs-b2c.md`  
**Próximo ID:** BUG-B2C-567

---

## Pendientes reales

- [ ] **F6:** Activar CI (.yml listo pero apagado)
- [ ] **F6:** Contracts móviles (375px)
- [ ] **F6:** Smoke journeys `@smoke` (completar compra E2E)
- [ ] **F6:** Cross-cutting `@xcut` (consola/links)
- [ ] **Capa 2:** App Password de Gmail (`GMAIL_IMAP_PASS`) para checks autónomos
- [ ] **Sitio:** BUG-566 (reseñas rotas, ALTA)
- [ ] **Sitio:** BUG-457 (wizard cotización presencia inestable)

---

## Referencias rápidas

| Qué | Dónde |
|-----|-------|
| **Este documento** | `overview.md` (raíz) |
| **Bitácora de sesiones** | `docs/sesiones/s01.md` … `docs/sesiones/s25.md` |
| **Referencias técnicas** | `docs/referencias/ambientes.md`, `comandos.md`, `selectores-clave.md` |
| **ADR Arquitectura contracts** | `docs/referencias/adr-f6-contracts.md` |
| **Bugs** | `bugs-b2c.md` (551 activos) |
| **Inventario navegable** | `inventario-ctas.md` (mapeo completo) |
| **Guía dashboard** | `GUIA-PARA-CORRER-EL-PANEL.md` |
| **Dashboard** | `npm run dashboard` → http://127.0.0.1:4599 |
| **Evidencias** | `evidencias/` |
| **Tests Playwright** | `tests/` |

### Ambiente

- **QA:** `https://qarotoplasmx.io`
- **Prod:** `https://rotoplas.com.mx` (solo lectura)
- **Cuenta principal:** `c.agarcia@rotoplas.com` / `Rotoplas2026`
- **Correos:** `ventasecom@rotoplas.com`

### Comandos base

```bash
npm run dashboard          # Panel web (puerto 4599)
npm run check:b2c          # Suite completa
npm run check:b2c:health   # URLs 200
npm run check:b2c:content  # Render real
npm run check:b2c:anon     # Sin login
npm run check:b2c:capa2:auto  # Crear orden + correos
```

---

## Archivos clave

| Tipo | Ruta |
|------|------|
| Este archivo | `overview.md` |
| Bitácora | `docs/sesiones/` (24 archivos) |
| Referencias | `docs/referencias/` |
| Bugs | `bugs-b2c.md` |
| Inventario | `inventario-ctas.md` |
| Dashboard | `scripts/dashboard.js` |
| Crear orden | `scripts/crear-orden-b2c.js` |
| Reporter | `scripts/dash-reporter.js` |
| Evidencias | `evidencias/` |
