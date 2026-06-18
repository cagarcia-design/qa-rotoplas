# Sesión 3 — F1B mapeo estructural AUTENTICADO

**Fecha:** 2026-05-27 | **+86 bugs (total 145)**

Header autenticado, /customer, /customer/orders, /customer/address, /customer/reviews, logout.

## Bugs críticos

- **BUG-119 PCI:** 6 dígitos del PAN expuestos (violación PCI-DSS 3.4)
- **BUG-131:** Eliminar dirección sin confirmación
- **BUG-144:** 404 sistémico (cualquier URL inexistente = 200 con error)
