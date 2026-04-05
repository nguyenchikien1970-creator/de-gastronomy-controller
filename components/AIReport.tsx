import React, { useState } from 'react';
import { MonthlyData } from '../types';
import { calculateKPIs } from '../services/calcService';
import { analyzeRestaurantData } from '../services/geminiService';
import { AIAnalysisResult } from '../types';
import { BrainCircuit, Loader2, CheckCircle2, AlertTriangle, Target, Lightbulb, TrendingUp } from 'lucide-react';

interface Props {
  data: MonthlyData;
  result: AIAnalysisResult | null;
  onResult: (result: AIAnalysisResult) => void;
}

const AIReport: React.FC<Props> = ({ data, result, onResult }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
        // Chỉ kiểm tra AI Studio key khi chạy trong môi trường AI Studio
        if (!process.env.API_KEY && (window as any).aistudio) {
             const hasKey = await (window as any).aistudio.hasSelectedApiKey();
             if(!hasKey) {
                 await (window as any).aistudio.openSelectKey();
                 setLoading(false);
                 return;
             }
        }

      const kpis = calculateKPIs(data);
      const analysis = await analyzeRestaurantData(data, kpis);
      if (analysis) {
        onResult(analysis);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate insights');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'green': return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'yellow': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'red': return 'text-red-400 bg-red-400/10 border-red-400/20';
      default: return 'text-gray-400 bg-gray-800 border-gray-700';
    }
  };

  return (
    <div className="bg-[#11131b] rounded-xl shadow-sm border border-gray-800 p-6 pb-8">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
            <BrainCircuit size={32} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-100">AI Tư Vấn</h2>
            <p className="text-sm text-gray-400">Chuyên gia F&B (20 năm kinh nghiệm) • Tháng {data.month}</p>
          </div>
        </div>
        
        {!result && (
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg shadow-lg shadow-purple-900/20 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="animate-spin" /> : <Lightbulb size={20} />}
            Phân Tích Ngay
          </button>
        )}
        {result && (
            <button
            onClick={handleGenerate}
            disabled={loading}
            className="px-4 py-2 text-sm text-gray-400 hover:bg-gray-800 rounded-lg transition-colors border border-gray-700"
          >
            Phân tích lại
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-400/10 text-red-400 p-4 rounded-lg mb-6 flex items-center gap-2 border border-red-400/20">
          <AlertTriangle size={20} />
          {error}
        </div>
      )}

      {result && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* Key Diagnostics */}
          <div>
            <h3 className="text-lg font-bold text-gray-200 mb-4 flex items-center gap-2">
              <Target size={20} className="text-blue-500" /> Phát hiện chính
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {result.diagnostics.map((diag, idx) => (
                <div key={idx} className={`p-4 rounded-xl border ${getStatusColor(diag.status)}`}>
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-lg">{diag.metric}</span>
                    <span className="text-xs font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
                      {diag.status}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm mb-2 opacity-80">
                    <span>Thực tế: {diag.actual.toFixed(1)}%</span>
                    <span>Mục tiêu: {diag.target_or_range}</span>
                  </div>
                  <p className="text-sm leading-relaxed mb-3 opacity-90">{diag.explanation}</p>
                  {diag.impact_estimate_eur !== 0 && (
                     <div className="text-sm font-bold flex items-center gap-1">
                        Tác động: {diag.impact_estimate_eur > 0 ? '+' : ''}{diag.impact_estimate_eur.toLocaleString('de-DE')} €
                     </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Action Plan (Short Term) */}
          <div>
            <h3 className="text-lg font-bold text-gray-200 mb-4 flex items-center gap-2">
              <TrendingUp size={20} className="text-green-500" /> Kế hoạch ngắn hạn (14 - 30 ngày)
            </h3>
            <div className="bg-green-400/5 border border-green-400/20 rounded-xl p-6">
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {result.action_plan.quick_wins_14_days.map((action, i) => (
                        <li key={i} className="flex items-start gap-3 p-2 hover:bg-white/5 rounded transition-colors">
                            <CheckCircle2 size={18} className="text-green-500 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-300 font-medium text-sm">{action}</span>
                        </li>
                    ))}
                </ul>
            </div>
          </div>

            {/* Break Even & Priorities (Long Term) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#161922] rounded-xl p-5 border border-gray-800">
                    <h4 className="font-bold text-gray-200 mb-4">Kế hoạch dài hạn (3 - 6 tháng)</h4>
                    <ul className="space-y-4">
                        {result.action_plan.top_priorities.map((p, i) => (
                            <li key={i} className="border-b border-gray-800 last:border-0 pb-3 last:pb-0">
                                <div className="font-semibold text-blue-400 mb-1 flex justify-between">
                                    {p.title}
                                    <span className="text-xs text-gray-500 border border-gray-700 px-2 rounded">{p.difficulty}</span>
                                </div>
                                <div className="text-sm text-gray-400">{p.why}</div>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="flex flex-col gap-6">
                     <div className="bg-blue-500/10 rounded-xl p-5 border border-blue-500/20 flex-1">
                        <h4 className="font-bold text-blue-400 mb-3">Điểm hòa vốn (Break-Even)</h4>
                        <p className="text-sm text-blue-300 mb-2">Doanh thu cần đạt để EBITDA = 0:</p>
                        <div className="text-3xl font-bold text-blue-100">
                            {result.break_even.break_even_revenue.ebitda_eur.toLocaleString('de-DE')} €
                        </div>
                    </div>
                    
                    <div className="bg-[#1c212e] rounded-xl p-5 border border-gray-700 flex-1">
                        <h4 className="font-bold text-gray-300 mb-2 text-sm uppercase">Lời khuyên chuyên gia</h4>
                        <p className="text-xs text-gray-500 italic">
                            "Với 20 năm kinh nghiệm, tôi khuyên bạn nên tập trung xử lý các chỉ số 'RED' trong phần phát hiện chính trước tiên. Tiền nằm ở đó."
                        </p>
                    </div>
                </div>
            </div>
            
            <div className="text-center text-xs text-gray-600 font-medium italic mt-8">
                App by Kiên MAMMAM Berlin
            </div>
        </div>
      )}
    </div>
  );
};

export default AIReport;