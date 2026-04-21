/**
 * Utilidades para calcular métricas y semanas
 */

import { startOfWeek, endOfWeek, addWeeks, format, isWithinInterval, startOfMonth, endOfMonth } from "date-fns";

/**
 * Calcula todas las semanas (sábado a viernes) dentro de un rango de fechas
 * @param startDate - Fecha de inicio del rango
 * @param endDate - Fecha de fin del rango
 * @returns Array de objetos con { weekNumber, weekStart, weekEnd, label }
 */
export function getWeeksInRange(startDate: Date, endDate: Date): Array<{
  weekNumber: number;
  weekStart: Date;
  weekEnd: Date;
  label: string;
}> {
  const weeks: Array<{
    weekNumber: number;
    weekStart: Date;
    weekEnd: Date;
    label: string;
  }> = [];

  // Validar que las fechas sean válidas
  if (!startDate || !endDate || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    console.error("[getWeeksInRange] Fechas inválidas:", { startDate, endDate });
    return [];
  }

  // Validar que la fecha de inicio sea anterior a la de fin
  if (startDate > endDate) {
    console.error("[getWeeksInRange] Fecha de inicio posterior a fecha de fin:", { startDate, endDate });
    return [];
  }

  // Encontrar el primer sábado dentro o antes del rango
  let currentDate = new Date(startDate);
  const dayOfWeek = currentDate.getDay(); // 0 = domingo, 6 = sábado
  
  // Calcular días hasta el sábado anterior (o el mismo si es sábado)
  let daysToSaturday = 0;
  if (dayOfWeek === 6) {
    // Ya es sábado
    daysToSaturday = 0;
  } else if (dayOfWeek === 0) {
    // Es domingo, retroceder 1 día
    daysToSaturday = 1;
  } else {
    // Es lunes (1) a viernes (5), retroceder (dayOfWeek + 1) días
    daysToSaturday = dayOfWeek + 1;
  }
  
  let weekStart = new Date(currentDate);
  weekStart.setDate(weekStart.getDate() - daysToSaturday);
  weekStart.setHours(0, 0, 0, 0);
  
  let weekNumber = 1;
  
  // Generar semanas hasta cubrir el rango
  while (weekStart <= endDate) {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6); // Viernes (6 días después del sábado)
    weekEnd.setHours(23, 59, 59, 999);
    
    // Solo incluir semanas que se solapan con el rango
    if (isWithinInterval(weekStart, { start: startDate, end: endDate }) ||
        isWithinInterval(weekEnd, { start: startDate, end: endDate }) ||
        (weekStart <= startDate && weekEnd >= endDate)) {
      
      weeks.push({
        weekNumber,
        weekStart: new Date(weekStart),
        weekEnd: new Date(weekEnd),
        label: `Semana ${weekNumber} (${format(weekStart, 'dd/MM')} - ${format(weekEnd, 'dd/MM')})`
      });
    }
    
    // Avanzar a la siguiente semana (sábado)
    weekStart = addWeeks(weekStart, 1);
    weekNumber++;
    
    // Prevenir loops infinitos
    if (weekNumber > 100) break;
  }
  
  return weeks;
}

/**
 * Obtiene el rango de fechas para un mes específico
 * @param year - Año
 * @param month - Mes (1-12)
 * @returns Objeto con start y end del mes
 */
export function getMonthRange(year: number, month: number): { start: Date; end: Date } {
  const date = new Date(year, month - 1, 1);
  return {
    start: startOfMonth(date),
    end: endOfMonth(date)
  };
}

/**
 * Obtiene el mes anterior al mes actual
 * @param date - Fecha de referencia (default: hoy)
 * @returns Objeto con year y month del mes anterior
 */
export function getPreviousMonth(date: Date = new Date()): { year: number; month: number } {
  const prevDate = new Date(date);
  prevDate.setMonth(prevDate.getMonth() - 1);
  return {
    year: prevDate.getFullYear(),
    month: prevDate.getMonth() + 1
  };
}

/**
 * Formatea una fecha para usar en inputs de tipo date
 * @param date - Fecha a formatear
 * @returns String en formato YYYY-MM-DD
 */
export function formatDateForInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
