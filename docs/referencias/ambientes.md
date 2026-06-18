# Ambientes y credenciales

## URLs

| Ambiente | URL | Uso |
|----------|-----|-----|
| QA | `https://qarotoplasmx.io` | Principal (B2C QA) |
| Producción | `https://rotoplas.com.mx` | Verificaciones post-deploy (solo lectura) |

## Cuentas de prueba

| Cuenta | Contraseña | Tipo | Inbox |
|--------|-----------|-------|-------|
| `c.agarcia@rotoplas.com` | `Rotoplas2026` | PRIMARIA — Jorge Rotoplas | Legible vía Gmail MCP ✅ |
| `andrei.garcia@xideral.co` | `Rotoplas2027` | LEGACY — cuenta anterior | NO accesible (Xideral) |

## Comandos rápidos

```bash
npm run dashboard              # Panel web (puerto 4599)
npm run check:b2c              # Suite completa
npm run check:b2c:health       # URLs 200
npm run check:b2c:content      # Render real
npm run check:b2c:anon         # Sin login
npm run check:b2c:capa2        # Solo correos
npm run check:b2c:capa2:auto   # Crear orden + correos
npm run crear-orden:b2c        # Orden física + tarjeta
npm run crear-orden:b2c:debito
npm run crear-orden:b2c:transferencia
npm run crear-orden:b2c:efectivo
npm run crear-orden:b2c:servicio
node setup-auth-b2c.js         # Generar sesión B2C
npm run check:imap             # Verificar IMAP
```

## Tarjetas sandbox OpenPay

| Tarjeta | Comportamiento |
|---------|---------------|
| `4242 4242 4242 4242` | Aprueba |
| `4000 0000 0000 0002` | Rechaza |
| CVV `123`, vence `12/26` | |

## Remitente transaccional

`ventasecom@rotoplas.com` — todos los correos de pedido B2C
