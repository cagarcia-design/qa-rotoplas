/**
 * ct-api.js — Cliente Commercetools para verificación de efectos externos en QA
 *
 * Uso desde tests Playwright:
 *   const ct = require('../../scripts/ct-api');
 *   const orden = await ct.getOrderByNumber('692026AIGZN');
 *   expect(orden.orderState).toBe('Open');
 *
 * Uso CLI:
 *   node scripts/ct-api.js <orderNumber>
 *   node scripts/ct-api.js --email <email>
 *   node scripts/ct-api.js --payment <orderNumber>
 *   node scripts/ct-api.js --inventory <sku>
 *   node scripts/ct-api.js --discounts
 *   node scripts/ct-api.js --messages <orderNumber>
 *   node scripts/ct-api.js --set-status <orderNumber> <idEstatus>
 *   node scripts/ct-api.js --cart <cartId>
 *   node scripts/ct-api.js --b2c <orderNumber>
 *   node scripts/ct-api.js --b2c-set-state <orderNumber> <orderState>
 *   node scripts/ct-api.js --b2c-set-shipment <orderNumber> <shipmentState>
 *   node scripts/ct-api.js --b2c-set-payment <orderNumber> <paymentState>
 */

require('dotenv').config();

const PROJECT_KEY   = process.env.CT_PROJECT_KEY;
const API_HOST      = process.env.CT_API_HOST;
const AUTH_URL      = process.env.CT_AUTH_URL;
const CLIENT_ID     = process.env.CT_CLIENT_ID;
const CLIENT_SECRET = process.env.CT_CLIENT_SECRET;
const SCOPES        = process.env.CT_SCOPES;

let _cachedToken = null;
let _tokenExpiry = 0;

// ─── Auth ────────────────────────────────────────────────────────────────────

async function getToken() {
  if (_cachedToken && Date.now() < _tokenExpiry) return _cachedToken;
  const res = await fetch(`${AUTH_URL}/oauth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64'),
    },
    body: `grant_type=client_credentials&scope=${encodeURIComponent(SCOPES)}`,
  });
  if (!res.ok) throw new Error(`CT auth falló: ${res.status} ${await res.text()}`);
  const data = await res.json();
  _cachedToken = data.access_token;
  _tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
  return _cachedToken;
}

async function ctGet(path) {
  const token = await getToken();
  const res = await fetch(`${API_HOST}/${PROJECT_KEY}${path}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`CT GET ${path} → ${res.status}: ${body}`);
  }
  return res.json();
}

// ─── Órdenes ─────────────────────────────────────────────────────────────────

async function getOrderByNumber(orderNumber) {
  const data = await ctGet(`/orders?where=orderNumber%3D%22${encodeURIComponent(orderNumber)}%22&limit=1`);
  if (!data.results?.length) throw new Error(`Orden no encontrada: ${orderNumber}`);
  return data.results[0];
}

async function getOrderById(uuid) {
  return ctGet(`/orders/${uuid}`);
}

async function getOrderStatus(orderNumber) {
  const order = await getOrderByNumber(orderNumber);
  return {
    orderNumber:   order.orderNumber,
    orderState:    order.orderState,
    paymentState:  order.paymentState,
    shipmentState: order.shipmentState,
    totalMXN:      (order.totalPrice.centAmount / 100).toFixed(2),
    createdAt:     order.createdAt,
    customerEmail: order.customerEmail,
    discountCodes: order.discountCodes?.map(d => d.discountCode?.obj?.code || d.discountCode?.id) || [],
    discountMXN:   order.lineItems?.reduce((acc, li) => {
      const disc = li.discountedPricePerQuantity?.reduce((s, d) =>
        s + d.discountedPrice?.includedDiscounts?.reduce((s2, id) =>
          s2 + (id.discountedAmount?.centAmount || 0), 0) || 0, 0) || 0;
      return acc + disc * li.quantity;
    }, 0) / 100,
    items: order.lineItems.map(li => ({
      name:     li.name?.['es-MX'] || li.name?.es || Object.values(li.name || {})[0],
      sku:      li.variant?.sku,
      qty:      li.quantity,
      priceMXN: ((li.price?.value?.centAmount || 0) / 100).toFixed(2),
    })),
  };
}

async function verifyOrderExists(orderNumber) {
  try {
    const order = await getOrderByNumber(orderNumber);
    return { exists: true, orderState: order.orderState, id: order.id };
  } catch {
    return { exists: false };
  }
}

// ─── Clientes ────────────────────────────────────────────────────────────────

async function getCustomerByEmail(email) {
  const data = await ctGet(`/customers?where=email%3D%22${encodeURIComponent(email)}%22&limit=1`);
  if (!data.results?.length) throw new Error(`Cliente no encontrado: ${email}`);
  return data.results[0];
}

async function getCustomerOrders(email, limit = 10) {
  const customer = await getCustomerByEmail(email);
  const data = await ctGet(`/orders?where=customerId%3D%22${customer.id}%22&limit=${limit}&sort=createdAt+desc`);
  return data.results;
}

// ─── Pagos ───────────────────────────────────────────────────────────────────

/**
 * Devuelve los pagos asociados a una orden.
 * Útil para verificar que OpenPay registró el cobro correctamente.
 */
async function getOrderPayments(orderNumber) {
  const order = await getOrderByNumber(orderNumber);
  if (!order.paymentInfo?.payments?.length) return [];

  const payments = await Promise.all(
    order.paymentInfo.payments.map(ref => ctGet(`/payments/${ref.id}`))
  );

  return payments.map(p => ({
    id:            p.id,
    method:        p.paymentMethodInfo?.method,
    paymentMethod: p.paymentMethodInfo?.name?.['es-MX'] || p.paymentMethodInfo?.method,
    interfaceId:   p.interfaceId,
    amountMXN:     (p.amountPlanned?.centAmount / 100).toFixed(2),
    status:        p.paymentStatus?.interfaceCode || p.paymentStatus?.interfaceText,
    transactions:  p.transactions?.map(t => ({
      type:       t.type,
      state:      t.state,
      amountMXN:  (t.amount?.centAmount / 100).toFixed(2),
      interactionId: t.interactionId,
      timestamp:  t.timestamp,
    })),
  }));
}

// ─── Inventario ──────────────────────────────────────────────────────────────

/**
 * Verifica stock disponible de un SKU.
 * Útil para confirmar que el stock decrementó después de un checkout.
 */
async function getInventoryBySku(sku) {
  const data = await ctGet(`/inventory?where=sku%3D%22${encodeURIComponent(sku)}%22`);
  return data.results.map(entry => ({
    sku:                entry.sku,
    availableQuantity:  entry.availableQuantity,
    quantityOnStock:    entry.quantityOnStock,
    reservedQuantity:   entry.quantityOnStock - entry.availableQuantity,
    channel:            entry.supplyChannel?.id,
  }));
}

// ─── Descuentos ──────────────────────────────────────────────────────────────

/**
 * Lista los cart discounts activos. Útil para EPS-197/206 —
 * verificar reglas de descuento por canal/nivel de cliente.
 */
async function getCartDiscounts(limit = 20) {
  const data = await ctGet(`/cart-discounts?limit=${limit}&sort=createdAt+desc`);
  return data.results.map(d => ({
    id:          d.id,
    name:        d.name?.['es-MX'] || d.name?.es || Object.values(d.name || {})[0],
    isActive:    d.isActive,
    cartPredicate: d.cartPredicate,
    value:       d.value,
    sortOrder:   d.sortOrder,
    validFrom:   d.validFrom,
    validUntil:  d.validUntil,
  }));
}

/**
 * Verifica los descuentos aplicados en una orden específica.
 * Devuelve código, nombre y monto ahorrado por cada descuento.
 */
async function getOrderDiscounts(orderNumber) {
  const order = await getOrderByNumber(orderNumber);
  const result = {
    orderNumber,
    discountCodes: [],
    lineItemDiscounts: [],
    totalDiscountMXN: 0,
  };

  // Códigos de descuento usados
  if (order.discountCodes?.length) {
    result.discountCodes = await Promise.all(
      order.discountCodes.map(async ref => {
        const dc = await ctGet(`/discount-codes/${ref.discountCode.id}`);
        return { code: dc.code, state: ref.state, name: dc.name?.['es-MX'] };
      })
    );
  }

  // Descuentos por línea de producto
  for (const li of order.lineItems) {
    if (!li.discountedPricePerQuantity?.length) continue;
    for (const dppq of li.discountedPricePerQuantity) {
      for (const id of dppq.discountedPrice?.includedDiscounts || []) {
        const discountMXN = (id.discountedAmount?.centAmount / 100) * li.quantity;
        result.lineItemDiscounts.push({
          item:        li.name?.['es-MX'] || Object.values(li.name || {})[0],
          sku:         li.variant?.sku,
          discountMXN: discountMXN.toFixed(2),
          discountId:  id.discount?.id,
        });
        result.totalDiscountMXN += discountMXN;
      }
    }
  }
  result.totalDiscountMXN = result.totalDiscountMXN.toFixed(2);
  return result;
}

// ─── Mensajes / Audit trail ──────────────────────────────────────────────────

/**
 * Historial completo de cambios de estado de una orden.
 * Útil para verificar que las transiciones ocurrieron correctamente.
 */
async function getOrderMessages(orderNumber) {
  const order = await getOrderByNumber(orderNumber);
  const data = await ctGet(
    `/messages?where=resource(id%3D%22${order.id}%22)&sort=createdAt+asc&limit=50`
  );
  return data.results.map(m => ({
    type:      m.type,
    createdAt: m.createdAt,
    ...(m.orderState    && { orderState: m.orderState }),
    ...(m.paymentState  && { paymentState: m.paymentState }),
    ...(m.shipmentState && { shipmentState: m.shipmentState }),
    ...(m.name          && { name: m.name }),
    ...(m.value         && { value: m.value }),
  }));
}

// ─── B2B2C — Órdenes en b2c-store ────────────────────────────────────────────

const B2B2C_STORE_KEY = 'b2c-store';

/**
 * Mapeo de valores CT nativos → etiqueta en español (tal como los muestra la UI B2B2C).
 * Extraído del bundle q-rCbmexQw.js (objeto `pl`).
 */
const B2B2C_ORDER_STATE_LABELS = {
  Open:      'Abierto',
  Confirmed: 'Confirmado',
  Complete:  'Completo',
  Cancelled: 'Cancelado',
};

const B2B2C_SHIPMENT_STATE_LABELS = {
  Backorder: 'Devolución',
  Delayed:   'Retardo',
  Delivered: 'Entregado',
  Partial:   'Parcial',
  Pending:   'En Punto de Entrega',
  Ready:     'Listo',
  Shipped:   'En camino',
};

const B2B2C_PAYMENT_STATE_LABELS = {
  Paid:    'Pagado',
  Pending: 'Pendiente',
  Failed:  'Fallido',
};

async function getB2COrderByNumber(orderNumber) {
  const data = await ctGet(
    `/in-store/key=${B2B2C_STORE_KEY}/orders?where=orderNumber%3D%22${encodeURIComponent(orderNumber)}%22&limit=1`
  );
  if (!data.results?.length) throw new Error(`Orden B2B2C no encontrada: ${orderNumber}`);
  return data.results[0];
}

async function getB2COrderStatus(orderNumber) {
  const order = await getB2COrderByNumber(orderNumber);
  return {
    orderNumber:        order.orderNumber,
    orderState:         order.orderState,
    orderStateLabel:    B2B2C_ORDER_STATE_LABELS[order.orderState] || order.orderState,
    paymentState:       order.paymentState,
    paymentStateLabel:  B2B2C_PAYMENT_STATE_LABELS[order.paymentState] || order.paymentState,
    shipmentState:      order.shipmentState,
    shipmentStateLabel: B2B2C_SHIPMENT_STATE_LABELS[order.shipmentState] || order.shipmentState,
    totalMXN:           (order.totalPrice.centAmount / 100).toFixed(2),
    createdAt:          order.createdAt,
    customerEmail:      order.customerEmail,
    items: order.lineItems.map(li => ({
      name:     li.name?.['es-MX'] || Object.values(li.name || {})[0],
      sku:      li.variant?.sku,
      qty:      li.quantity,
      priceMXN: ((li.price?.value?.centAmount || 0) / 100).toFixed(2),
    })),
  };
}

async function getB2CCustomerOrders(email, limit = 10) {
  const customer = await getCustomerByEmail(email);
  const data = await ctGet(
    `/in-store/key=${B2B2C_STORE_KEY}/orders?where=customerId%3D%22${customer.id}%22&limit=${limit}&sort=createdAt+desc`
  );
  return data.results;
}

async function getB2COrderPayments(orderNumber) {
  const order = await getB2COrderByNumber(orderNumber);
  if (!order.paymentInfo?.payments?.length) return [];
  const payments = await Promise.all(
    order.paymentInfo.payments.map(ref => ctGet(`/payments/${ref.id}`))
  );
  return payments.map(p => ({
    id:           p.id,
    method:       p.paymentMethodInfo?.method,
    interfaceId:  p.interfaceId,
    amountMXN:    (p.amountPlanned?.centAmount / 100).toFixed(2),
    status:       p.paymentStatus?.interfaceCode || p.paymentStatus?.interfaceText,
    transactions: p.transactions?.map(t => ({
      type:      t.type,
      state:     t.state,
      amountMXN: (t.amount?.centAmount / 100).toFixed(2),
      timestamp: t.timestamp,
    })),
  }));
}

async function getB2COrderMessages(orderNumber) {
  const order = await getB2COrderByNumber(orderNumber);
  const data = await ctGet(
    `/messages?where=resource(id%3D%22${order.id}%22)&sort=createdAt+asc&limit=50`
  );
  return data.results.map(m => ({
    type:      m.type,
    createdAt: m.createdAt,
    ...(m.orderState    && { orderState: m.orderState }),
    ...(m.paymentState  && { paymentState: m.paymentState }),
    ...(m.shipmentState && { shipmentState: m.shipmentState }),
  }));
}

/**
 * Cambia el orderState de una orden B2B2C directamente en CT.
 * @param {string} orderNumber
 * @param {'Open'|'Confirmed'|'Complete'|'Cancelled'} state
 */
async function setB2COrderState(orderNumber, state) {
  if (!B2B2C_ORDER_STATE_LABELS[state]) {
    throw new Error(`orderState inválido: ${state}. Válidos: ${Object.keys(B2B2C_ORDER_STATE_LABELS).join(', ')}`);
  }
  const order = await getB2COrderByNumber(orderNumber);
  const token = await getToken();
  const res = await fetch(`${API_HOST}/${PROJECT_KEY}/in-store/key=${B2B2C_STORE_KEY}/orders/${order.id}`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      version: order.version,
      actions: [{ action: 'changeOrderState', orderState: state }],
    }),
  });
  if (!res.ok) throw new Error(`setB2COrderState falló: ${res.status} ${await res.text()}`);
  return { orderNumber, orderState: state, label: B2B2C_ORDER_STATE_LABELS[state], success: true };
}

/**
 * Cambia el shipmentState de una orden B2B2C.
 * @param {string} orderNumber
 * @param {'Backorder'|'Delayed'|'Delivered'|'Partial'|'Pending'|'Ready'|'Shipped'} state
 */
async function setB2CShipmentState(orderNumber, state) {
  if (!B2B2C_SHIPMENT_STATE_LABELS[state]) {
    throw new Error(`shipmentState inválido: ${state}. Válidos: ${Object.keys(B2B2C_SHIPMENT_STATE_LABELS).join(', ')}`);
  }
  const order = await getB2COrderByNumber(orderNumber);
  const token = await getToken();
  const res = await fetch(`${API_HOST}/${PROJECT_KEY}/in-store/key=${B2B2C_STORE_KEY}/orders/${order.id}`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      version: order.version,
      actions: [{ action: 'changeShipmentState', shipmentState: state }],
    }),
  });
  if (!res.ok) throw new Error(`setB2CShipmentState falló: ${res.status} ${await res.text()}`);
  return { orderNumber, shipmentState: state, label: B2B2C_SHIPMENT_STATE_LABELS[state], success: true };
}

/**
 * Cambia el paymentState de una orden B2B2C.
 * @param {string} orderNumber
 * @param {'Paid'|'Pending'|'Failed'} state
 */
async function setB2CPaymentState(orderNumber, state) {
  if (!B2B2C_PAYMENT_STATE_LABELS[state]) {
    throw new Error(`paymentState inválido: ${state}. Válidos: ${Object.keys(B2B2C_PAYMENT_STATE_LABELS).join(', ')}`);
  }
  const order = await getB2COrderByNumber(orderNumber);
  const token = await getToken();
  const res = await fetch(`${API_HOST}/${PROJECT_KEY}/in-store/key=${B2B2C_STORE_KEY}/orders/${order.id}`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      version: order.version,
      actions: [{ action: 'changePaymentState', paymentState: state }],
    }),
  });
  if (!res.ok) throw new Error(`setB2CPaymentState falló: ${res.status} ${await res.text()}`);
  return { orderNumber, paymentState: state, label: B2B2C_PAYMENT_STATE_LABELS[state], success: true };
}

// ─── Estado de orden B2B (solo B2B — campo custom idEstatus) ─────────────────

/**
 * Mapa de estados B2B. idEstatus es el valor que lee el frontend para
 * mostrar "En Proceso", "En Camino", etc.
 */
const B2B_ESTADOS = {
  10: 'Verificación SAC',
  20: 'Liberado',
  40: 'En Proceso',
  50: 'Facturado Parcial',
  60: 'En Camino',
  70: 'Completo',
};

const B2B_ORDER_TYPE_ID = '6569250c-5de1-475b-b222-f7ad595e9ea0';

/**
 * Cambia el idEstatus de una orden B2B directamente en Commercetools.
 * Útil para preparar test data sin intervención manual en SAP.
 *
 * SOLO funciona en B2B (campo Descripcion-estatus es específico del proyecto B2B).
 * NO dispara cambios en SAP — solo afecta la UI del sitio B2B QA.
 *
 * @param {string} orderNumber  - Ej: '692026AIGZN'
 * @param {number} idEstatus    - 10 | 20 | 40 | 50 | 60 | 70
 * @param {object} opts         - { sucursalId?, company? }
 */
async function setOrderStatus(orderNumber, idEstatus, opts = {}) {
  if (!B2B_ESTADOS[idEstatus]) {
    throw new Error(`idEstatus inválido: ${idEstatus}. Válidos: ${Object.keys(B2B_ESTADOS).join(', ')}`);
  }

  const order = await getOrderByNumber(orderNumber);
  const token = await getToken();

  const existingFields = order.custom?.fields || {};
  const newDescripcion = JSON.stringify([{
    idOrden: `34_${orderNumber}_${opts.sucursalId || '130020498'}`,
    estatus: 'Abierto',
    idEstatus,
    dateEstatusChanged: new Date().toISOString(),
    company: opts.company || 'GRUPO FERREBAÑOS MAYORISTAS',
    sucursalId: opts.sucursalId || '130020498',
  }]);

  const actions = order.custom?.type
    // Ya tiene el tipo: solo actualizar el campo
    ? [{ action: 'setCustomField', name: 'Descripcion-estatus', value: newDescripcion }]
    // Sin tipo: asignar tipo + todos los campos necesarios
    : [{
        action: 'setCustomType',
        type: { typeId: 'type', id: B2B_ORDER_TYPE_ID },
        fields: {
          'Descripcion-estatus': newDescripcion,
          'order-source':   existingFields['order-source']   || 'b2b',
          'payment-method': existingFields['payment-method'] || 'tarjetaCredito',
        },
      }];

  const res = await fetch(`${API_HOST}/${PROJECT_KEY}/orders/${order.id}`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ version: order.version, actions }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`setOrderStatus falló: ${res.status} ${body}`);
  }

  return {
    orderNumber,
    idEstatus,
    label: B2B_ESTADOS[idEstatus],
    success: true,
  };
}

// ─── Carritos ────────────────────────────────────────────────────────────────

async function getCart(cartId) {
  return ctGet(`/carts/${cartId}`);
}

async function getActiveCartForCustomer(email) {
  const customer = await getCustomerByEmail(email);
  const data = await ctGet(
    `/carts?where=customerId%3D%22${customer.id}%22%20and%20cartState%3D%22Active%22&limit=1`
  );
  return data.results[0] || null;
}

// ─── Productos ───────────────────────────────────────────────────────────────

async function getProductBySku(sku) {
  const data = await ctGet(
    `/product-projections/search?filter=variants.sku:"${encodeURIComponent(sku)}"&limit=1`
  );
  if (!data.results?.length) throw new Error(`SKU no encontrado: ${sku}`);
  const p = data.results[0];
  const variant = [p.masterVariant, ...(p.variants || [])].find(v => v.sku === sku) || p.masterVariant;
  return {
    id:          p.id,
    name:        p.name?.['es-MX'] || Object.values(p.name || {})[0],
    sku:         variant.sku,
    priceMXN:    variant.prices?.[0] ? (variant.prices[0].value.centAmount / 100).toFixed(2) : null,
    attributes:  Object.fromEntries((variant.attributes || []).map(a => [a.name, a.value])),
  };
}

// ─── Exports ─────────────────────────────────────────────────────────────────

module.exports = {
  getToken,
  // Órdenes
  getOrderByNumber, getOrderById, getOrderStatus, verifyOrderExists,
  // Clientes
  getCustomerByEmail, getCustomerOrders,
  // Pagos
  getOrderPayments,
  // Inventario
  getInventoryBySku,
  // Descuentos
  getCartDiscounts, getOrderDiscounts,
  // Mensajes / audit
  getOrderMessages,
  // Carritos
  getCart, getActiveCartForCustomer,
  // Productos
  getProductBySku,
  // Estado B2B (solo B2B)
  setOrderStatus, B2B_ESTADOS,
  // B2B2C (b2c-store)
  getB2COrderByNumber, getB2COrderStatus,
  getB2CCustomerOrders, getB2COrderPayments, getB2COrderMessages,
  setB2COrderState, setB2CShipmentState, setB2CPaymentState,
  B2B2C_ORDER_STATE_LABELS, B2B2C_SHIPMENT_STATE_LABELS, B2B2C_PAYMENT_STATE_LABELS,
};

// ─── CLI ─────────────────────────────────────────────────────────────────────

if (require.main === module) {
  (async () => {
    const args = process.argv.slice(2);


    const HELP = `
Uso: node scripts/ct-api.js <comando> [valor]

Comandos B2B:
  <orderNumber>              Estado completo de una orden B2B (ej: 692026AIGZN)
  --email    <email>         Últimas 5 órdenes de un cliente
  --payment  <orderNumber>   Pagos y transacciones OpenPay de una orden
  --messages <orderNumber>   Historial de cambios de estado de una orden
  --discounts                Lista de cart discounts activos
  --discount <orderNumber>   Descuentos aplicados en una orden (EPS-206)
  --inventory <sku>          Stock disponible de un SKU
  --product  <sku>           Datos de producto por SKU
  --cart     <email>         Carrito activo de un cliente
  --set-status <orderN> <id> Cambiar idEstatus B2B (10|20|40|50|60|70)

Comandos B2B2C (b2c-store):
  --b2c          <orderNumber>      Estado completo de una orden B2B2C
  --b2c-orders   <email>            Últimas 5 órdenes B2B2C de un cliente
  --b2c-payment  <orderNumber>      Pagos de una orden B2B2C
  --b2c-messages <orderNumber>      Historial de cambios de estado B2B2C
  --b2c-set-state <orderN> <state>  orderState: Open|Confirmed|Complete|Cancelled
  --b2c-set-shipment <orderN> <s>   shipmentState: Backorder|Delayed|Delivered|Partial|Pending|Ready|Shipped
  --b2c-set-payment <orderN> <s>    paymentState: Paid|Pending|Failed
`;

    if (!args.length || args[0] === '--help') { console.log(HELP); process.exit(0); }

    const [flag, value] = args;

    if (flag === '--email') {
      const orders = await getCustomerOrders(value, 5);
      console.log(`\nÚltimas ${orders.length} órdenes de ${value}:\n`);
      orders.forEach(o => {
        const total = (o.totalPrice.centAmount / 100).toFixed(2);
        console.log(`  ${o.orderNumber}  ${o.orderState.padEnd(12)}  $${total} MXN  ${o.createdAt.slice(0, 10)}`);
      });

    } else if (flag === '--payment') {
      const payments = await getOrderPayments(value);
      console.log('\n' + JSON.stringify(payments, null, 2));

    } else if (flag === '--messages') {
      const msgs = await getOrderMessages(value);
      console.log(`\nHistorial de orden ${value}:\n`);
      msgs.forEach(m => {
        const extras = Object.entries(m).filter(([k]) => !['type','createdAt'].includes(k)).map(([k,v]) => `${k}=${JSON.stringify(v)}`).join('  ');
        console.log(`  ${m.createdAt.slice(0,19)}  ${m.type.padEnd(35)}  ${extras}`);
      });

    } else if (flag === '--discounts') {
      const discounts = await getCartDiscounts(20);
      console.log('\nCart Discounts activos:\n');
      discounts.filter(d => d.isActive).forEach(d => {
        console.log(`  [${d.isActive ? 'ON ' : 'OFF'}]  ${(d.name || '').padEnd(40)}  ${JSON.stringify(d.value)}`);
      });

    } else if (flag === '--discount') {
      const result = await getOrderDiscounts(value);
      console.log('\n' + JSON.stringify(result, null, 2));

    } else if (flag === '--inventory') {
      const inv = await getInventoryBySku(value);
      console.log('\n' + JSON.stringify(inv, null, 2));

    } else if (flag === '--product') {
      const product = await getProductBySku(value);
      console.log('\n' + JSON.stringify(product, null, 2));

    } else if (flag === '--cart') {
      const cart = await getActiveCartForCustomer(value);
      if (!cart) { console.log('No hay carrito activo.'); }
      else {
        console.log(`\nCarrito activo (${cart.id}):`);
        cart.lineItems.forEach(li => {
          const name = li.name?.['es-MX'] || Object.values(li.name || {})[0];
          console.log(`  ${li.variant?.sku}  ${name}  x${li.quantity}`);
        });
      }

    } else if (flag === '--set-status') {
      const idEstatus = parseInt(args[2]);
      const result = await setOrderStatus(value, idEstatus);
      console.log(`\n✓ ${result.orderNumber} → ${result.label} (idEstatus ${result.idEstatus})`);

    } else if (flag === '--b2c') {
      const status = await getB2COrderStatus(value);
      console.log('\n' + JSON.stringify(status, null, 2));

    } else if (flag === '--b2c-orders') {
      const orders = await getB2CCustomerOrders(value, 5);
      console.log(`\nÚltimas ${orders.length} órdenes B2B2C de ${value}:\n`);
      orders.forEach(o => {
        const total = (o.totalPrice.centAmount / 100).toFixed(2);
        const ship = o.shipmentState ? ` / ${o.shipmentState}` : '';
        console.log(`  ${o.orderNumber}  ${(o.orderState + ship).padEnd(25)}  $${total} MXN  ${o.createdAt.slice(0, 10)}`);
      });

    } else if (flag === '--b2c-payment') {
      const payments = await getB2COrderPayments(value);
      console.log('\n' + JSON.stringify(payments, null, 2));

    } else if (flag === '--b2c-messages') {
      const msgs = await getB2COrderMessages(value);
      console.log(`\nHistorial B2B2C ${value}:\n`);
      msgs.forEach(m => {
        const extras = Object.entries(m).filter(([k]) => !['type','createdAt'].includes(k)).map(([k,v]) => `${k}=${v}`).join('  ');
        console.log(`  ${m.createdAt.slice(0,19)}  ${m.type.padEnd(35)}  ${extras}`);
      });

    } else if (flag === '--b2c-set-state') {
      const result = await setB2COrderState(value, args[2]);
      console.log(`\n✓ B2B2C ${result.orderNumber} → orderState: ${result.orderState} (${result.label})`);

    } else if (flag === '--b2c-set-shipment') {
      const result = await setB2CShipmentState(value, args[2]);
      console.log(`\n✓ B2B2C ${result.orderNumber} → shipmentState: ${result.shipmentState} (${result.label})`);

    } else if (flag === '--b2c-set-payment') {
      const result = await setB2CPaymentState(value, args[2]);
      console.log(`\n✓ B2B2C ${result.orderNumber} → paymentState: ${result.paymentState} (${result.label})`);

    } else {
      // Asumir que es un orderNumber
      const status = await getOrderStatus(flag);
      console.log('\n' + JSON.stringify(status, null, 2));
    }
  })().catch(e => { console.error(e.message); process.exit(1); });
}
