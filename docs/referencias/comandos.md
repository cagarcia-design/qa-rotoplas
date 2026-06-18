# Comandos

## Dashboard

```bash
npm run dashboard          # Abre http://127.0.0.1:4599
```

## Suites de checks

```bash
npm run check:b2c              # Todo
npm run check:b2c:health       # Solo @health (URLs 200)
npm run check:b2c:content      # Solo @content (render)
npm run check:b2c:anon         # Sin @auth (no requiere login)
npm run check:b2c:capa2        # Solo @capa2 (correos)
npm run check:b2c:capa2:auto   # Crear orden + verificar correos
```

## Auth

```bash
node setup-auth-b2c.js
B2C_USER=c.agarcia@rotoplas.com B2C_PASS=Rotoplas2026 node setup-auth-b2c.js
```

## Scripts individuales

```bash
node scripts/crear-orden-b2c.js               # Físico + tarjeta
CAPA2_TIPO=servicio node scripts/crear-orden-b2c.js
CAPA2_PAGO=debito node scripts/crear-orden-b2c.js
node scripts/ct-api.js --help                  # CT utils
node scripts/check-imap.js                     # Verificar IMAP
```

## CT API

```bash
node scripts/ct-api.js --b2c 6820261ZZA8       # Estado de orden
node scripts/ct-api.js --b2c-payment 6820261ZZA8  # Pagos
node scripts/ct-api.js --b2c-messages 6820261ZZA8  # Historial
```
