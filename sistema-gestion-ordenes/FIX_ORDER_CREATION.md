# 🔧 Solución: El sistema sigue creando dos órdenes

## Problema
El código tiene un bloque antiguo (líneas 307-392) que crea múltiples órdenes en un bucle `for (const device of devices)`.

## Solución Manual

**PASO 1**: Abre `sistema-gestion-ordenes/src/react/components/OrderForm.tsx`

**PASO 2**: Busca la línea 307 que dice:
```typescript
// Crear una orden por cada equipo
```

**PASO 3**: Elimina TODO el bloque desde la línea 307 hasta la línea 392 (aproximadamente) que incluye:
- `const createdOrders: any[] = [];`
- `for (const device of devices) { ... }`
- Todo el código dentro del bucle que crea órdenes

**PASO 4**: Reemplázalo con este código (que ya debería estar más abajo, pero si hay duplicado, elimínalo):

```typescript
// === CREAR UNA SOLA ORDEN CON TODOS LOS EQUIPOS ===
const firstDevice = devices[0];
const totalReplacementCost = devices.reduce((sum, d) => sum + d.replacementCost, 0);
const totalLaborCost = devices.reduce((sum, d) => sum + d.serviceValue, 0);
const totalRepairCost = totalReplacementCost + totalLaborCost;

const additionalDevices = devices.slice(1).map(device => ({
  device_type: device.deviceType || "iphone",
  device_model: device.deviceModel,
  device_serial_number: device.deviceSerial || null,
  device_unlock_code: device.unlockType === "code" ? device.deviceUnlockCode : null,
  device_unlock_pattern: device.unlockType === "pattern" && device.deviceUnlockPattern.length > 0 
    ? device.deviceUnlockPattern 
    : null,
  problem_description: device.problemDescription,
  checklist_data: device.checklistData || {},
  replacement_cost: device.replacementCost,
  labor_cost: device.serviceValue,
  selected_services: device.selectedServices.map(s => ({
    id: s.id,
    name: s.name,
    description: s.description || null,
    quantity: 1,
    unit_price: device.serviceValue,
    total_price: device.serviceValue,
  })),
}));

const orderData: any = {
  order_number: null,
  customer_id: selectedCustomer.id,
  technician_id: actualTechnicianId,
  sucursal_id: sucursalId,
  device_type: firstDevice.deviceType || "iphone",
  device_model: firstDevice.deviceModel,
  device_serial_number: firstDevice.deviceSerial || null,
  device_unlock_code: firstDevice.unlockType === "code" ? firstDevice.deviceUnlockCode : null,
  problem_description: firstDevice.problemDescription,
  checklist_data: firstDevice.checklistData,
  replacement_cost: totalReplacementCost,
  labor_cost: totalLaborCost,
  total_repair_cost: totalRepairCost,
  priority,
  commitment_date: commitmentDate || null,
  warranty_days: warrantyDays,
  status: "en_proceso",
  ...(additionalDevices.length > 0 ? { devices_data: additionalDevices } : {}),
};

if (firstDevice.unlockType === "pattern" && firstDevice.deviceUnlockPattern.length > 0) {
  orderData.device_unlock_pattern = firstDevice.deviceUnlockPattern;
}

const { data: order, error: orderError } = await supabase
  .from("work_orders")
  .insert(orderData)
  .select()
  .single();

if (orderError) throw orderError;

// Servicios del primer equipo
for (const service of firstDevice.selectedServices) {
  await supabase.from("order_services").insert({
    order_id: order.id,
    service_id: service.id,
    service_name: service.name,
    quantity: 1,
    unit_price: firstDevice.serviceValue,
    total_price: firstDevice.serviceValue,
    description: service.description || null,
  });
}

// Servicios de equipos adicionales
for (const additionalDevice of additionalDevices) {
  for (const service of additionalDevice.selected_services) {
    await supabase.from("order_services").insert({
      order_id: order.id,
      service_id: service.id,
      service_name: service.name,
      quantity: 1,
      unit_price: service.unit_price,
      total_price: service.total_price,
      description: service.description || null,
    });
  }
}

const createdOrders = [order];
```

**PASO 5**: Guarda el archivo (Ctrl+S)

**PASO 6**: Reinicia el servidor de desarrollo

## Verificación

Después de hacer los cambios, busca en el archivo:
- ❌ NO debe haber: `for (const device of devices) {` que cree órdenes
- ✅ SÍ debe haber: Solo UN `insert(orderData)` que cree una sola orden
- ✅ El botón debe decir: "Crear Orden (2 equipos)" cuando hay 2 equipos
- ✅ El alert debe decir: "Orden creada exitosamente con 2 equipos"
