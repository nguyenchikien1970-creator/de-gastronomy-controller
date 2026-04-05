import { GoogleGenAI } from "@google/genai";
import { MonthlyData, ComputedKPIs, AIAnalysisResult, RestaurantProfile } from '../types';
import { AI_SYSTEM_INSTRUCTION } from '../constants';
import { calculateBreakEven } from './calcService';

const MODEL_NAME = 'gemini-3-flash-preview';

/**
 * Chuẩn bị payload gửi cho Gemini
 */
const buildPayload = (monthData: MonthlyData, kpis: ComputedKPIs, breakEvenEUR: number, profile?: RestaurantProfile | null) => {
  return {
    mode: "analysis",
    response_language: "vi",
    country: "DE",
    restaurant_profile: profile ? {
      city: profile.city,
      district: profile.district,
      cuisine_type: profile.cuisineType,
      area_m2: profile.areaM2,
      seats_indoor: profile.seatsIndoor,
      seats_outdoor: profile.seatsOutdoor,
      restaurant_class: profile.restaurantClass === 'budget' ? 'Bình dân' : profile.restaurantClass === 'mid' ? 'Trung cấp' : 'Cao cấp',
    } : undefined,
    revenue_period: {
      period: "monthly",
      total_revenue_eur: kpis.total_revenue,
      revenue_food: monthData.revenue_food,
      revenue_beverage: monthData.revenue_beverage,
    },
    costs_period: {
      cogs_total_eur: kpis.total_cogs,
      cogs_food: monthData.cogs_food,
      cogs_beverage: monthData.cogs_beverage,
      labor_total_eur: monthData.expense_personnel,
      rent_lease_eur: monthData.expense_rent,
      energy_eur: monthData.expense_energy,
      operating_result_1_eur: kpis.operating_result_1,
      operating_result_2_eur: kpis.operating_result_2,
      net_profit_eur: kpis.net_profit
    },
    computed_metrics: {
      break_even_ebitda_eur: breakEvenEUR
    },
    constraints: {
      goal: "Optimize Betriebsergebnis 1 (EBITDA) and analyze Cost Structure",
      risk_tolerance: "medium"
    }
  };
};

/**
 * MODE 1: Gọi Gemini SDK trực tiếp từ browser (chỉ cho local dev)
 */
const analyzeWithSDK = async (payload: any, apiKey: string): Promise<AIAnalysisResult | null> => {
  const ai = new GoogleGenAI({ apiKey });

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: JSON.stringify(payload),
    config: {
      systemInstruction: AI_SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
    }
  });

  const text = response.text;
  if (!text) return null;
  return JSON.parse(text) as AIAnalysisResult;
};

/**
 * MODE 2: Gọi qua API route /api/analyze (cho production - API key an toàn trên server)
 */
const analyzeWithAPIRoute = async (payload: any): Promise<AIAnalysisResult | null> => {
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ payload }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Lỗi kết nối server.' }));
    throw new Error(err.error || `Server error: ${response.status}`);
  }

  return await response.json() as AIAnalysisResult;
};

/**
 * Entry point: tự chọn mode phù hợp (local SDK hoặc API route)
 */
export const analyzeRestaurantData = async (
  monthData: MonthlyData,
  kpis: ComputedKPIs,
  profile?: RestaurantProfile | null
): Promise<AIAnalysisResult | null> => {
  // Tính break-even chính xác ở client (không để AI hallucinate)
  const breakEvenCalc = calculateBreakEven(monthData, kpis);
  const payload = buildPayload(monthData, kpis, breakEvenCalc.ebitda_eur, profile);

  let result: AIAnalysisResult | null;

  // Kiểm tra API key trong browser (chỉ có khi chạy local với .env.local)
  const apiKey = process.env.API_KEY;
  const hasLocalKey = apiKey && apiKey !== 'undefined' && apiKey !== '' && apiKey !== 'PLACEHOLDER_API_KEY';

  if (hasLocalKey) {
    // Local dev: dùng SDK trực tiếp (nhanh hơn)
    result = await analyzeWithSDK(payload, apiKey as string);
  } else {
    // Production (Vercel): gọi qua API route (bảo mật key)
    result = await analyzeWithAPIRoute(payload);
  }

  if (!result) return null;

  // Ghi đè break-even bằng phép tính chính xác (tránh AI sai số)
  if (!result.break_even) {
    result.break_even = { break_even_revenue: { ebitda_eur: 0 } };
  }
  result.break_even.break_even_revenue.ebitda_eur = breakEvenCalc.ebitda_eur;

  return result;
};