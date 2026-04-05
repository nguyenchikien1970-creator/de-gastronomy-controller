import { MonthlyData, ComputedKPIs, BenchmarkConfig, BenchmarkStatus } from '../types';
import { DEFAULT_BENCHMARKS } from '../constants';

export const calculateKPIs = (data: MonthlyData): ComputedKPIs => {
  // 1. Revenue
  const total_revenue = (data.revenue_food || 0) + (data.revenue_beverage || 0) + (data.revenue_other || 0);
  
  // 2. COGS
  const total_cogs = (data.cogs_food || 0) + (data.cogs_beverage || 0) + (data.cogs_other || 0);
  
  // Gross Profit (Rohertrag)
  const gross_profit = total_revenue - total_cogs;
  const gross_margin_pct = total_revenue > 0 ? (gross_profit / total_revenue) * 100 : 0;

  // 3. Operating Costs (Betriebsbedingte Kosten)
  const total_operating_costs = 
    (data.expense_personnel || 0) + 
    (data.expense_energy || 0) + 
    (data.expense_fees_consulting || 0) + 
    (data.expense_operating || 0) + 
    (data.expense_admin || 0);

  // Operating Result 1 (Betriebsergebnis 1) ~ EBITDA
  const operating_result_1 = gross_profit - total_operating_costs;
  const operating_result_1_margin = total_revenue > 0 ? (operating_result_1 / total_revenue) * 100 : 0;

  // 4. Asset Costs (Anlagebedingte Kosten)
  const total_asset_costs = 
    (data.expense_maintenance || 0) + 
    (data.expense_depreciation || 0) + 
    (data.expense_rent || 0) + 
    (data.expense_leasing || 0) + 
    (data.expense_interest || 0);

  // Operating Result 2 (Betriebsergebnis 2) ~ EBIT
  const operating_result_2 = operating_result_1 - total_asset_costs;
  const operating_result_2_margin = total_revenue > 0 ? (operating_result_2 / total_revenue) * 100 : 0;

  // Helpers
  const personnel_cost_pct = total_revenue > 0 ? ((data.expense_personnel || 0) / total_revenue) * 100 : 0;
  const rent_cost_pct = total_revenue > 0 ? ((data.expense_rent || 0) / total_revenue) * 100 : 0;
  
  // Prime Cost = COGS + Personnel
  const prime_cost = total_cogs + (data.expense_personnel || 0);
  const prime_cost_pct = total_revenue > 0 ? (prime_cost / total_revenue) * 100 : 0;

  // --- VAT Calculation (Umsatzsteuer) ---
  
  let vat_output = 0;
  let vat_input = 0;

  // Check if manual VAT values are provided (prefer manual inputs from form)
  if (data.vat_output !== undefined && data.vat_output !== null) {
      vat_output = data.vat_output;
  } else {
      // Fallback calculation for legacy data or if not set
      const vat_out_food = (data.revenue_food || 0) * 0.07;
      const vat_out_bev = (data.revenue_beverage || 0) * 0.19;
      const vat_out_other = (data.revenue_other || 0) * 0.19;
      vat_output = vat_out_food + vat_out_bev + vat_out_other;
  }

  if (data.vat_input !== undefined && data.vat_input !== null) {
      vat_input = data.vat_input;
  } else {
      // Fallback calculation
      const vat_in_cogs_food = (data.cogs_food || 0) * 0.07;
      const vat_in_cogs_bev = (data.cogs_beverage || 0) * 0.19;
      const vat_in_cogs_other = (data.cogs_other || 0) * 0.19; 
      
      const overheads_subject_to_vat = 
        (total_operating_costs - (data.expense_personnel || 0)) + 
        total_asset_costs;
      const vat_in_overheads = overheads_subject_to_vat * 0.10; 

      vat_input = vat_in_cogs_food + vat_in_cogs_bev + vat_in_cogs_other + vat_in_overheads;
  }

  // Payable (Zahllast)
  const vat_payable = vat_output - vat_input;

  // 5. Net Profit (Gewinn)
  // Per user request: Net Profit = Operating Result 2 - Income Taxes - VAT Payable
  const net_profit = operating_result_2 - (data.expense_taxes || 0) - vat_payable;
  const net_margin_pct = total_revenue > 0 ? (net_profit / total_revenue) * 100 : 0;

  return {
    total_revenue,
    total_cogs,
    gross_profit,
    gross_margin_pct,
    total_operating_costs,
    operating_result_1,
    operating_result_1_margin,
    total_asset_costs,
    operating_result_2,
    operating_result_2_margin,
    net_profit,
    net_margin_pct,
    personnel_cost_pct,
    rent_cost_pct,
    prime_cost,
    prime_cost_pct,
    vat_output,
    vat_input,
    vat_payable
  };
};

export const calculateBreakEven = (data: MonthlyData, kpis: ComputedKPIs) => {
  // Break-Even Lợi nhuận (Net Profit = 0)
  // Formula: Revenue = TotalFixedCosts / CM_Ratio
  // 
  // Cách tính:
  // 1. Chi phí biến đổi = COGS (tỷ lệ thuận với doanh thu)
  // 2. Tỷ lệ biên lợi nhuận gộp (CM Ratio) = Gross Profit / Revenue
  // 3. Tổng chi phí cố định = Operating + Asset + Taxes + VAT Payable
  // 4. Điểm hòa vốn = Tổng chi phí cố định / CM Ratio
  
  const revenue = kpis.total_revenue;
  const gross_profit = kpis.gross_profit;

  if (revenue <= 0 || gross_profit <= 0) {
      return { ebitda_eur: 0 };
  }

  const cm_ratio = gross_profit / revenue;
  
  // Safety check for extremely low margin to prevent infinity
  if (cm_ratio < 0.01) return { ebitda_eur: 0 };

  // Tổng TẤT CẢ chi phí (ngoài COGS):
  // - Group 3: Chi phí vận hành (nhân sự, năng lượng, phí, hoạt động, hành chính)
  // - Group 4: Chi phí tài sản (bảo trì, khấu hao, tiền thuê, leasing, lãi vay)
  // - Group 5: Thuế thu nhập
  // - VAT: Thuế GTGT phải trả (Zahllast)
  const total_all_costs = 
    kpis.total_operating_costs +   // Group 3
    kpis.total_asset_costs +       // Group 4
    (data.expense_taxes || 0) +    // Group 5
    Math.max(0, kpis.vat_payable); // VAT Zahllast (chỉ tính nếu dương)

  // BEP (Net Profit = 0)
  const bep_net_profit = total_all_costs / cm_ratio;

  return { ebitda_eur: Math.round(bep_net_profit) };
};

export const getBenchmarkStatus = (
  value: number,
  type: 'cogs' | 'labor' | 'prime' | 'rent' | 'ebitda',
  config: BenchmarkConfig = DEFAULT_BENCHMARKS
): BenchmarkStatus => {
  switch (type) {
    case 'cogs':
      if (value <= config.cogs_max) return 'green';
      if (value <= config.cogs_max + 3) return 'yellow';
      return 'red';
    case 'labor':
      if (value <= config.labor_max) return 'green';
      if (value <= config.labor_max + 3) return 'yellow';
      return 'red';
    case 'prime':
      if (value <= config.prime_max) return 'green';
      if (value <= config.prime_max + 5) return 'yellow';
      return 'red';
    case 'rent':
      if (value <= config.rent_max) return 'green';
      if (value <= config.rent_max + 2) return 'yellow';
      return 'red';
    case 'ebitda':
      if (value >= config.ebitda_min) return 'green';
      if (value >= 5) return 'yellow';
      return 'red';
    default:
      return 'yellow';
  }
};