/**
 * Report DTOs - Data structures for all report types
 */

// ==================== EXECUTIVE SUMMARY ====================

export interface ExecutiveSummaryDTO {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  totalQuotes: number;
  approvedQuotes: number;
  totalProducts: number;
  lowStockProducts: number;
  totalTables: number;
  occupiedTables: number;
  currentMonthRevenue: number;
  previousMonthRevenue: number;
  revenueGrowth: number; // percentage
}

// ==================== FINANCIAL REPORT ====================

export interface FinancialReportDTO {
  period: "week" | "month" | "year";
  startDate: Date;
  endDate: Date;
  totalIncome: number;
  totalExpenses: number;
  totalCommissions: number;
  netProfit: number;
  monthlyBreakdown: MonthlyFinancialData[];
  incomeBySource: IncomeBySource[];
}

export interface MonthlyFinancialData {
  month: string;
  income: number;
  expenses: number;
  profit: number;
}

export interface IncomeBySource {
  source: string;
  amount: number;
  percentage: number;
}

// ==================== ORDERS REPORT ====================

export interface OrdersReportDTO {
  period: "week" | "month" | "year";
  startDate: Date;
  endDate: Date;
  totalOrders: number;
  pendingOrders: number;
  inProgressOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  averageCompletionTime: number; // days
  totalRevenue: number;
  averageOrderValue: number;
  ordersByStatus: OrderStatusCount[];
  ordersByDay: DailyOrderData[];
  topServices: TopServiceData[];
}

export interface OrderStatusCount {
  status: string;
  count: number;
  percentage: number;
}

export interface DailyOrderData {
  date: string;
  count: number;
  revenue: number;
}

export interface TopServiceData {
  serviceName: string;
  count: number;
  revenue: number;
}

// ==================== INVENTORY REPORT ====================

export interface InventoryReportDTO {
  totalProducts: number;
  activeProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  totalStockValue: number;
  productsByCategory: CategoryData[];
  stockMovements: StockMovementData[];
  lowStockAlerts: LowStockAlert[];
}

export interface CategoryData {
  category: string;
  count: number;
  totalStock: number;
  totalValue: number;
}

export interface StockMovementData {
  date: string;
  incoming: number;
  outgoing: number;
  netChange: number;
}

export interface LowStockAlert {
  productId: string;
  productName: string;
  currentStock: number;
  minStock: number;
  deficit: number;
}

// ==================== QUOTES REPORT ====================

export interface QuotesReportDTO {
  totalQuotes: number;
  draftsCount: number;
  sentCount: number;
  approvedCount: number;
  rejectedCount: number;
  conversionRate: number; // percentage
  totalQuoteValue: number;
  approvedValue: number;
  quotesByStatus: QuoteStatusData[];
  quotesByMonth: MonthlyQuoteData[];
}

export interface QuoteStatusData {
  status: string;
  count: number;
  totalValue: number;
}

export interface MonthlyQuoteData {
  month: string;
  count: number;
  totalValue: number;
  approvedCount: number;
}

// ==================== RESTAURANT REPORT ====================

export interface RestaurantReportDTO {
  totalTables: number;
  availableTables: number;
  occupiedTables: number;
  occupancyRate: number; // percentage
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  averageTableTurnover: number; // minutes
  ordersByStatus: RestaurantOrderStatusData[];
  popularDishes: PopularDishData[];
  revenueByHour: HourlyRevenueData[];
}

export interface RestaurantOrderStatusData {
  status: string;
  count: number;
  revenue: number;
}

export interface PopularDishData {
  dishName: string;
  count: number;
  revenue: number;
  percentage: number;
}

export interface HourlyRevenueData {
  hour: string;
  revenue: number;
  orderCount: number;
}
