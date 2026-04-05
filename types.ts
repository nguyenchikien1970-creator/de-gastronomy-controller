export interface MonthlyData {
  id: string;
  month: string; // YYYY-MM
  
  // 1. Revenue (Warenumsatz)
  revenue_food: number;      // Speisen
  revenue_beverage: number;  // Getränke
  revenue_other: number;     // Sonstiges

  // 2. COGS (Warenkosten)
  cogs_food: number;
  cogs_beverage: number;
  cogs_other: number;

  // 3. Operating Costs (Betriebsbedingte Kosten)
  expense_personnel: number;       // Personalkosten
  expense_energy: number;          // Energiekosten
  expense_fees_consulting: number; // Gebühren, Beiträge, Versicherung, Beratung
  expense_operating: number;       // Betriebskosten (Other operating)
  expense_admin: number;           // Verwaltungskosten

  // 4. Asset Costs (Anlagebedingte Kosten)
  expense_maintenance: number;  // Instandhaltung
  expense_depreciation: number; // AfA / GWG
  expense_rent: number;         // Mieten & Pachten
  expense_leasing: number;      // Leasing
  expense_interest: number;     // Zinsen

  // 5. Taxes
  expense_taxes: number;        // Steuern
  vat_output?: number;          // Umsatzsteuer (Output VAT)
  vat_input?: number;           // Vorsteuer (Input VAT)
}

export interface ComputedKPIs {
  total_revenue: number;
  total_cogs: number;
  gross_profit: number; // Rohertrag
  gross_margin_pct: number;

  total_operating_costs: number; // Sum of group 3
  operating_result_1: number; // Betriebsergebnis 1 (EBITDA-ish)
  operating_result_1_margin: number;

  total_asset_costs: number; // Sum of group 4
  operating_result_2: number; // Betriebsergebnis 2 (EBIT-ish)
  operating_result_2_margin: number;

  net_profit: number; // Gewinn after taxes
  net_margin_pct: number;
  
  // Helpers
  personnel_cost_pct: number;
  rent_cost_pct: number;
  prime_cost: number;
  prime_cost_pct: number;

  // VAT (Umsatzsteuer) Analysis
  vat_output: number;  // Thuế đầu ra
  vat_input: number;   // Thuế đầu vào (Vorsteuer)
  vat_payable: number; // Thuế phải trả (Zahllast)
}

export type BenchmarkStatus = 'green' | 'yellow' | 'red';

export interface BenchmarkConfig {
  cogs_min: number;
  cogs_max: number;
  labor_min: number;
  labor_max: number;
  prime_min: number;
  prime_max: number;
  rent_max: number;
  ebitda_min: number;
}

export interface AIAnalysisResult {
  meta: any;
  diagnostics: Array<{
    metric: string;
    actual: number;
    target_or_range: string;
    status: string;
    impact_estimate_eur: number;
    explanation: string;
    recommended_actions: string[];
  }>;
  action_plan: {
    top_priorities: Array<{
      title: string;
      why: string;
      expected_impact_eur: number;
      difficulty: string;
      first_steps: string[];
    }>;
    quick_wins_14_days: string[];
  };
  questions_to_user: string[];
  break_even: {
    break_even_revenue: {
      ebitda_eur: number;
    }
  }
}