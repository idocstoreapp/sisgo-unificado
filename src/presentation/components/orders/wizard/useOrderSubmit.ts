"use client";
import type { FormEvent } from "react";
import { supabase } from "@/lib/supabase";
import { useOrderWizard } from "./OrderWizardContext";

const MAX_DESCRIPTION_LENGTH = 500;

export function useOrderSubmit(onSaved: () => void) {
  const context = useOrderWizard();
  const {
    isSubmitting, loading, selectedCustomer, devices, setDevices,
    setIsSubmitting, setLoading, responsibleUserName, technicianId,
    setCreatedOrder, setCreatedOrderServices, setShowPDFPreview,
    priority, commitmentDate, warrantyDays
  } = context as any;

  const getDeviceServiceTotal = (device: any): number => {
    if (!device) return 0;
    return (device.selectedServices || []).reduce((sum: number, service: any) => {
      return sum + (device.servicePrices?.[service.id] || service.price || 0);
    }, 0);
  };

async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    
    // ProtecciÃ³n contra mÃºltiples submits
    if (isSubmitting || loading) {
      console.warn("Submit ya en progreso, ignorando llamada duplicada");
      return;
    }
    
    // Validar cliente
    if (!selectedCustomer) {
      alert("Por favor selecciona un cliente");
      return;
    }
    
    // Validar que todos los equipos tengan los campos obligatorios
    const invalidDevices: Array<{ equipo: string; campos: string[] }> = [];
    devices.forEach((device, index) => {
      const equipoNum = index + 1;
      const camposFaltantes: string[] = [];
      
      // Validar modelo del dispositivo (no vacÃ­o y no solo espacios)
      if (!device.deviceModel || !device.deviceModel.trim()) {
        camposFaltantes.push("Dispositivo (Marca y Modelo)");
      }
      
      // Validar descripciÃ³n del problema (no vacÃ­o y no solo espacios)
      if (!device.problemDescription || !device.problemDescription.trim()) {
        camposFaltantes.push("DescripciÃ³n del Problema");
      }
      
      // Validar descripciÃ³n no exceda el lÃ­mite
      if (device.problemDescription && device.problemDescription.length > MAX_DESCRIPTION_LENGTH) {
        camposFaltantes.push(`DescripciÃ³n excede ${MAX_DESCRIPTION_LENGTH} caracteres`);
      }
      
      // Validar servicios seleccionados
      if (!device.selectedServices || device.selectedServices.length === 0) {
        camposFaltantes.push("Servicios");
      }
      
      // Validar que cada servicio tenga un precio vÃ¡lido
      const serviciosSinPrecio: string[] = [];
      device.selectedServices.forEach(service => {
        const precio = device.servicePrices[service.id];
        if (!precio || precio <= 0 || isNaN(precio)) {
          serviciosSinPrecio.push(service.name);
        }
      });
      if (serviciosSinPrecio.length > 0) {
        camposFaltantes.push(`Precios de servicios: ${serviciosSinPrecio.join(", ")}`);
      }
      
      if (camposFaltantes.length > 0) {
        invalidDevices.push({
          equipo: `Equipo ${equipoNum}`,
          campos: camposFaltantes
        });
      }
    });
    
    if (invalidDevices.length > 0) {
      const mensaje = invalidDevices.map(item => 
        `${item.equipo}: ${item.campos.join(", ")}`
      ).join("\n");
      alert(`Por favor completa todos los campos obligatorios:\n\n${mensaje}`);
      return;
    }

    // Validar encargado responsable si es una sucursal
    let isBranchSession = false;
    if (typeof window !== 'undefined') {
      const branchSessionStr = localStorage.getItem('branchSession');
      if (branchSessionStr) {
        try {
          const branchSession = JSON.parse(branchSessionStr);
          if (branchSession.type === 'branch' && branchSession.branchId) {
            isBranchSession = true;
            // Es una sucursal - validar que se haya ingresado un nombre (puede ser de la lista o texto libre)
            if (!responsibleUserName || responsibleUserName.trim() === "") {
              alert("Por favor ingresa el nombre del responsable de recibir el equipo. Este campo es obligatorio para crear Ã³rdenes desde sucursales.");
              return;
            }
          }
        } catch (error) {
          console.error("Error validando sesiÃ³n de sucursal:", error);
        }
      }
    }

    // Validar checklist para cada equipo (ANTES de establecer estados de carga)
    const invalidChecklists: string[] = [];
    devices.forEach((device, index) => {
      const checklistItemNames = Object.keys(device.checklistData);
      if (checklistItemNames.length > 0) {
        const missingItems: string[] = [];
        checklistItemNames.forEach((itemName) => {
          const value = device.checklistData[itemName];
          if (!value || value === "") {
            missingItems.push(itemName);
          }
        });
        if (missingItems.length > 0) {
          invalidChecklists.push(`Equipo ${index + 1}: ${missingItems.join(", ")}`);
        }
      }
    });
    
    if (invalidChecklists.length > 0) {
      alert(`Por favor selecciona una opciÃ³n para todos los items del checklist.\n${invalidChecklists.join("\n")}`);
      return;
    }

    setIsSubmitting(true);
    setLoading(true);

    try {

      // Verificar si es una sucursal (no tiene usuario en auth.users)
      // Las sucursales tienen su sesiÃ³n guardada en localStorage
      let isBranch = false;
      let sucursalId: string | null = null;
      let companyId: string | null = null;
      let branchData = null;
      let actualTechnicianId: string | null = technicianId;

      // Verificar si hay sesiÃ³n de sucursal en localStorage
      if (typeof window !== 'undefined') {
        const branchSessionStr = localStorage.getItem('branchSession');
        if (branchSessionStr) {
          try {
            const branchSession = JSON.parse(branchSessionStr);
            if (branchSession.type === 'branch' && branchSession.branchId) {
              // Es una sucursal - usar el branchId como branch_id
              isBranch = true;
              sucursalId = branchSession.branchId;
              actualTechnicianId = null; // Las sucursales no tienen technician_id
              
              // Cargar datos completos de la sucursal
              const { data: branch, error: branchError } = await supabase
                .from("branches")
                .select("*, companies!inner(id)")
                .eq("id", sucursalId)
                .single();
              
              if (!branchError && branch) {
                branchData = branch;
                companyId = branch.companies?.id || branch.company_id;
              }
            }
          } catch (e) {
            console.error("Error parseando branchSession:", e);
          }
        }
      }

      // Si no es sucursal, obtener datos del usuario normal
      if (!isBranch) {
        const { data: tech, error: techError } = await supabase
          .from("users")
          .select("branch_id, company_id")
          .eq("id", technicianId)
          .maybeSingle(); // Usar maybeSingle en lugar de single para evitar error si no existe

        if (techError) {
          // Si el error es porque no existe el usuario, podrÃ­a ser una sucursal
          // Intentar verificar si es una sucursal por el ID
          const { data: branchCheck, error: branchCheckError } = await supabase
            .from("branches")
            .select("id")
            .eq("id", technicianId)
            .maybeSingle();
          
          if (!branchCheckError && branchCheck) {
            // Es una sucursal
            isBranch = true;
            sucursalId = technicianId;
            actualTechnicianId = null;
            
            // Cargar datos completos de la sucursal
            const { data: branch, error: branchError } = await supabase
              .from("branches")
              .select("*, companies!inner(id)")
              .eq("id", sucursalId)
              .single();
            
            if (!branchError && branch) {
              branchData = branch;
              companyId = branch.companies?.id || branch.company_id;
            }
          } else {
            throw techError;
          }
        } else {
          sucursalId = tech?.branch_id || null;
          companyId = tech?.company_id || null;
          
          // Cargar datos completos de la sucursal por separado
          if (sucursalId) {
            const { data: branch, error: branchError } = await supabase
              .from("branches")
              .select("*")
              .eq("id", sucursalId)
              .single();
            
            if (!branchError && branch) {
              branchData = branch;
            }
          }
        }
      }

      // === CREAR UNA SOLA ORDEN CON TODOS LOS EQUIPOS ===
      // El primer equipo es el principal (se almacena en campos normales)
      // Los equipos adicionales se almacenan en devices_data (JSONB)
      const firstDevice = devices[0];
      
      // Calcular totales combinados de todos los equipos
      const totalReplacementCost = devices.reduce((sum, d) => sum + d.replacementCost, 0);
      const totalLaborCost = devices.reduce((sum, d) => sum + getDeviceServiceTotal(d), 0);
      const totalRepairCost = totalReplacementCost + totalLaborCost;
      
      // Preparar equipos adicionales (desde el segundo en adelante) para almacenar en JSONB
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
        labor_cost: getDeviceServiceTotal(device),
        selected_services: device.selectedServices.map(s => ({
          id: s.id,
          name: s.name,
          description: s.description || null,
          quantity: 1,
          unit_price: device.servicePrices[s.id] || 0,
          total_price: device.servicePrices[s.id] || 0,
        })),
      }));

      // Preparar datos de inserciÃ³n para la orden Ãºnica
      // Generar nÃºmero de orden - FORMA EXPLÃ�CITA
      const year = new Date().getFullYear();
      const randomNum = Math.floor(Math.random() * 9000) + 1000;
      const orderNumber: string = "OT-" + year + "-" + randomNum;
      
      console.log("[OrderForm] Generando orderNumber:", orderNumber);
      
      const orderData: any = {
        company_id: companyId,
        business_type: "servicio_tecnico",
        order_number: orderNumber,
        customer_id: selectedCustomer.id,
        assigned_to: actualTechnicianId, // NULL para sucursales, technicianId para usuarios normales
        branch_id: sucursalId,
        // Datos del primer equipo (equipo principal) en metadata
        metadata: {
          device_type: firstDevice.deviceType || "iphone",
          device_model: firstDevice.deviceModel,
          device_serial_number: firstDevice.deviceSerial || null,
          device_unlock_code: firstDevice.unlockType === "code" ? firstDevice.deviceUnlockCode : null,
          device_unlock_pattern: firstDevice.unlockType === "pattern" && firstDevice.deviceUnlockPattern.length > 0 ? firstDevice.deviceUnlockPattern : null,
          problem_description: firstDevice.problemDescription,
          checklist_data: firstDevice.checklistData || {},
          // Equipos adicionales
          devices_data: additionalDevices.length > 0 ? additionalDevices : null,
        },
        // Totales combinados de todos los equipos
        replacement_cost: totalReplacementCost,
        labor_cost: totalLaborCost,
        total_cost: totalRepairCost,
        priority,
        commitment_date: commitmentDate || null,
        warranty_days: warrantyDays,
        status: "en_proceso",
        // Almacenar equipos adicionales en JSONB (si hay mÃ¡s de un equipo)
        // Nota: Si el campo devices_data no existe en la BD, simplemente no se guardarÃ¡
        // pero el cÃ³digo seguirÃ¡ funcionando con all_devices en memoria
        ...(additionalDevices.length > 0 ? { devices_data: additionalDevices } : {}),
        // Agregar nombre del encargado responsable
        // Si es sucursal, el campo debe estar presente (ya validado arriba)
        // Si no es sucursal, el campo puede ser NULL (opcional, no se agrega)
        ...(isBranchSession && responsibleUserName && responsibleUserName.trim() 
          ? { responsible_user_name: responsibleUserName.trim() } 
          : {}),
      };
      
      // ValidaciÃ³n final de seguridad: si es sucursal, el campo debe estar en orderData
      if (isBranchSession && !orderData.responsible_user_name) {
        console.error("[OrderForm] ERROR CRÃTICO: Es sucursal pero responsible_user_name no estÃ¡ en orderData");
        alert("Error: El nombre del encargado responsable es obligatorio. Por favor ingresa el nombre e intenta nuevamente.");
        return;
      }

      // Agregar device_unlock_pattern solo si existe la columna y hay un patrÃ³n
      if (firstDevice.unlockType === "pattern" && firstDevice.deviceUnlockPattern.length > 0) {
        orderData.device_unlock_pattern = firstDevice.deviceUnlockPattern;
      }

      // Asegurar que order_number estÃ© presente
      if (!orderData.order_number) {
        orderData.order_number = orderNumber;
      }

      // Crear la orden Ãºnica
      console.log("[OrderForm] Creando orden con datos:", {
        ...orderData,
        responsible_user_name: orderData.responsible_user_name || "NULL (no es sucursal)",
        isBranchSession
      });
      
      // Debug: verificar orderNumber
      console.log("[OrderForm] orderNumber:", orderNumber, "type:", typeof orderNumber);
      console.log("[OrderForm] orderData.order_number:", orderData.order_number);
      
      const { data: order, error: orderError } = await supabase
        .from("work_orders")
        .insert(orderData)
        .select()
        .single();

      if (orderError) {
        console.error("[OrderForm] Error al crear orden:", orderError);
        console.error("[OrderForm] Datos enviados:", orderData);
        throw orderError;
      }
      
      console.log("[OrderForm] Orden creada exitosamente:", {
        order_id: order.id,
        order_number: order.order_number,
        responsible_user_name: order.responsible_user_name || "NULL"
      });

      // Crear servicios de la orden para TODOS los equipos
      // Servicios del primer equipo
      console.log("[OrderForm] Guardando servicios del primer equipo:", {
        order_id: order.id,
        servicios_count: firstDevice.selectedServices.length,
        servicios: firstDevice.selectedServices.map(s => ({ id: s.id, name: s.name, price: firstDevice.servicePrices[s.id] || 0 })),
        servicePrices: firstDevice.servicePrices,
      });
      
      // Validar que hay servicios antes de guardar
      if (!firstDevice.selectedServices || firstDevice.selectedServices.length === 0) {
        console.warn("[OrderForm] ADVERTENCIA: El primer equipo no tiene servicios seleccionados. No se guardarÃ¡n servicios en order_services.");
      } else {
        for (const service of firstDevice.selectedServices) {
          const servicePrice = firstDevice.servicePrices[service.id] || 0;
          
          // Validar que el precio sea vÃ¡lido
          if (!servicePrice || servicePrice <= 0 || isNaN(servicePrice)) {
            console.error(`[OrderForm] Error: El servicio ${service.name} no tiene un precio vÃ¡lido (${servicePrice}). Saltando...`);
            continue;
          }
          
          const { data: insertedData, error: insertError } = await supabase.from("order_items").insert({
            order_id: order.id,
            
            name: service.name,
            quantity: 1,
            unit_price: servicePrice,
            total_price: servicePrice,
            // NOTA: La tabla order_services NO tiene columna 'description'
          }).select();
          
          if (insertError) {
            console.error(`[OrderForm] Error guardando servicio ${service.name}:`, insertError);
            // No lanzar error, solo registrar para no bloquear el proceso
          } else {
            console.log(`[OrderForm] Servicio guardado exitosamente: ${service.name} (precio: ${servicePrice})`, insertedData);
          }
        }
      }

      // Servicios de los equipos adicionales (almacenados en devices_data)
      for (const additionalDevice of additionalDevices) {
        for (const service of additionalDevice.selected_services) {
          await supabase.from("order_items").insert({
            order_id: order.id,
            
            name: service.name,
            quantity: 1,
            unit_price: service.unit_price,
            total_price: service.total_price,
            // NOTA: La tabla order_services NO tiene columna 'description'
          });
        }
      }

      const createdOrders = [order]; // Array con una sola orden

      // Usar la orden creada para la vista previa del PDF (una sola orden con todos los equipos)
      const createdOrder = createdOrders[0];
      
      // Preparar orden para vista previa con todos los equipos
      // DEBUG: Verificar servicios antes de construir all_devices
      console.log("[OrderForm] Construyendo all_devices. Total equipos:", devices.length);
      devices.forEach((device, index) => {
        console.log(`[OrderForm] Equipo ${index + 1}:`, {
          id: device.id,
          model: device.deviceModel,
          selectedServices_count: device.selectedServices.length,
          selectedServices: device.selectedServices,
          servicePrices: device.servicePrices,
        });
      });
      
      const orderWithRelations = {
        ...createdOrder,
        customer: selectedCustomer,
        sucursal: branchData,
        // Incluir informaciÃ³n de todos los equipos para el PDF
        all_devices: devices.map((device, index) => {
          const deviceServices = device.selectedServices.map(s => ({
            id: s.id,
            name: s.name,
            description: s.description || null,
            quantity: 1,
            unit_price: device.servicePrices[s.id] || 0,
            total_price: device.servicePrices[s.id] || 0,
          }));
          
          console.log(`[OrderForm] Equipo ${index + 1} - Servicios mapeados:`, deviceServices);
          
          return {
            index: index + 1,
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
            labor_cost: getDeviceServiceTotal(device),
            selected_services: deviceServices,
          };
        }),
      };
      
      console.log("[OrderForm] all_devices construido:", orderWithRelations.all_devices);
      
      // Construir orderServices para el PDF (todos los servicios de todos los equipos)
      // Incluir la descripciÃ³n del servicio para que no se repita la descripciÃ³n del problema
      const orderServicesForPDF: Array<{
        quantity: number;
        unit_price: number;
        total_price: number;
        service_name: string;
        description?: string | null;
      }> = [];
      
      // Agregar servicios de todos los equipos
      devices.forEach(device => {
        device.selectedServices.forEach(service => {
          const servicePrice = device.servicePrices[service.id] || 0;
          orderServicesForPDF.push({
            quantity: 1,
            unit_price: servicePrice,
            total_price: servicePrice,
            name: service.name,
            description: service.description || null,
          });
        });
      });
      
      // Mostrar Ã©xito inmediatamente
      // IMPORTANTE: Resetear isSubmitting ANTES de mostrar el preview para evitar duplicaciones
      setIsSubmitting(false);
      setLoading(false);
      
      setCreatedOrder(orderWithRelations);
      setCreatedOrderServices(orderServicesForPDF);
      setShowPDFPreview(true);
      const devicesCount = devices.length;
      alert(`Orden creada exitosamente con ${devicesCount} equipo${devicesCount === 1 ? '' : 's'}. Se abrirÃ¡ la vista previa del PDF.`);
      
      // Enviar email al cliente en segundo plano (no bloquear)
      // Usar setTimeout para que no bloquee la UI
      setTimeout(async () => {
        try {
          // Cargar datos actualizados de la sucursal por si fueron modificados
          let updatedBranchData = branchData;
          if (sucursalId) {
            const { data: updatedBranch } = await supabase
              .from("branches")
              .select("*")
              .eq("id", sucursalId)
              .single();
            
            if (updatedBranch) {
              updatedBranchData = updatedBranch;
            }
          }

          // Generar PDF con el mismo diseÃ±o que se usa en la vista previa (todos los equipos)
          // Recopilar todos los servicios de todos los equipos
          const allServices = devices.flatMap(device => device.selectedServices);
          
          const pdfBlob = await generatePDFBlob(
            {
              ...orderWithRelations,
              sucursal: updatedBranchData,
            },
            allServices,
            totalLaborCost, // Total de servicios de todos los equipos
            totalReplacementCost, // Total de repuestos de todos los equipos
            warrantyDays,
            firstDevice.checklistData, // Checklist del primer equipo (para compatibilidad)
            [], // notes vacÃ­o para nueva orden
            orderServicesForPDF // Pasar orderServices para que el PDF tenga la misma informaciÃ³n detallada
          );

          // Intentar subir PDF a Supabase Storage primero
          let pdfUrl: string | null = null;
          let pdfBase64: string | null = null;
          
          try {
            console.log("[ORDER FORM] Intentando subir PDF a Supabase Storage...");
            pdfUrl = await uploadPDFToStorage(pdfBlob, createdOrder.order_number);
            if (pdfUrl) {
              console.log("[ORDER FORM] PDF subido exitosamente a:", pdfUrl);
            } else {
              console.warn("[ORDER FORM] No se pudo subir PDF a Storage, usando base64 como fallback");
              // Si no se pudo subir, generar base64 como fallback
              pdfBase64 = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                  const base64 = (reader.result as string).split(',')[1];
                  resolve(base64);
                };
                reader.onerror = reject;
                reader.readAsDataURL(pdfBlob);
              });
            }
          } catch (uploadError) {
            console.warn("[ORDER FORM] Error subiendo PDF a Storage, intentando adjuntar:", uploadError);
            // Si falla la subida, convertir a base64 como fallback
            try {
              pdfBase64 = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                  const base64 = (reader.result as string).split(',')[1];
                  resolve(base64);
                };
                reader.onerror = reject;
                reader.readAsDataURL(pdfBlob);
              });
            } catch (base64Error) {
              console.error("[ORDER FORM] Error generando base64:", base64Error);
            }
          }
          
          // Asegurarse de que tenemos al menos uno de los dos
          if (!pdfUrl && !pdfBase64) {
            console.error("[ORDER FORM] No se pudo generar ni URL ni base64 del PDF");
            // Intentar generar base64 una vez mÃ¡s como Ãºltimo recurso
            try {
              pdfBase64 = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                  const base64 = (reader.result as string).split(',')[1];
                  resolve(base64);
                };
                reader.onerror = reject;
                reader.readAsDataURL(pdfBlob);
              });
            } catch (finalError) {
              console.error("[ORDER FORM] Error final generando base64:", finalError);
            }
          }

          // Evitar payloads demasiado grandes (Vercel devuelve 413 antes de ejecutar la funciÃ³n)
          // 2.5M chars base64 â‰ˆ 1.8MB binario, dejando margen para el resto del JSON
          const MAX_BASE64_PAYLOAD_LENGTH = 2_500_000;
          if (pdfBase64 && pdfBase64.length > MAX_BASE64_PAYLOAD_LENGTH) {
            console.warn("[ORDER FORM] PDF en base64 demasiado grande para enviar en request, se enviarÃ¡ email sin adjunto", {
              base64Length: pdfBase64.length,
              maxAllowed: MAX_BASE64_PAYLOAD_LENGTH,
            });
            pdfBase64 = null;
          }

          // Enviar email incluso sin PDF para no perder la notificaciÃ³n al cliente
          console.log("[ORDER FORM] Enviando email de creaciÃ³n de orden:", createdOrder.order_number);
          const emailResponse = await fetch('/api/send-order-email', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                to: selectedCustomer.email,
                customerName: selectedCustomer.name,
                orderNumber: createdOrder.order_number,
                pdfBase64: pdfBase64, // Puede ser null si se subiÃ³ a storage
                pdfUrl: pdfUrl, // URL del PDF si se subiÃ³ exitosamente
                branchName: updatedBranchData?.name || branchData?.name,
                branchEmail: updatedBranchData?.email || branchData?.email,
              }),
            });

            if (!emailResponse.ok) {
              let errorData: any = {};
              try {
                const text = await emailResponse.text();
                console.error("[ORDER FORM] Respuesta de error (texto):", text);
                if (text) {
                  try {
                    errorData = JSON.parse(text);
                  } catch (parseError) {
                    errorData = { error: text || 'Error desconocido', status: emailResponse.status };
                  }
                } else {
                  errorData = { error: `Error ${emailResponse.status}: ${emailResponse.statusText}`, status: emailResponse.status };
                }
              } catch (textError) {
                console.error("[ORDER FORM] Error leyendo respuesta:", textError);
                errorData = { error: `Error ${emailResponse.status}: ${emailResponse.statusText}`, status: emailResponse.status };
              }
              console.error("[ORDER FORM] Error enviando email:", errorData);
              // No mostrar alerta aquÃ­, solo loguear el error
            } else {
              let successData: any = {};
              try {
                const text = await emailResponse.text();
                if (text) {
                  try {
                    successData = JSON.parse(text);
                  } catch (parseError) {
                    successData = { message: text || 'Email enviado' };
                  }
                }
              } catch (textError) {
                console.error("[ORDER FORM] Error leyendo respuesta exitosa:", textError);
                successData = { message: 'Email enviado (sin respuesta del servidor)' };
              }
              console.log("[ORDER FORM] Email enviado exitosamente:", successData);
            }        } catch (emailError: any) {
          console.error("[ORDER FORM] ExcepciÃ³n al enviar email:", emailError);
          // No mostrar error al usuario, solo loguear
        }
      }, 100); // PequeÃ±o delay para no bloquear la UI
    } catch (error: any) {
      console.error("Error creando orden:", error);
      alert(`Error: ${error.message}`);
      // Asegurar que se reseteen los estados incluso en caso de error
      setShowPDFPreview(false);
      setCreatedOrder(null);
      setCreatedOrderServices([]);
    } finally {
      // Asegurar que siempre se reseteen los estados
      setLoading(false);
      setIsSubmitting(false);
    }
  }

  


  return { handleSubmit };
}

