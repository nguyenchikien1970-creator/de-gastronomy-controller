import React, { useState, useMemo } from 'react';
import { MonthlyData } from '../types';
import { calculateKPIs, getBenchmarkStatus } from '../services/calcService';
import { RefreshCw } from 'lucide-react';

interface Props {
  baseData: MonthlyData;
}

const Slider = ({ label, value, onChange, min = 80, max = 120 }: any) => (
  <div className="mb-6">
    <div className="flex justify-between mb-2">
      <label className="text-sm font-medium text-gray-400">{label}</label>
      <span className={`text-sm font-bold ${value !== 100 ? 'text-blue-400' : 'text-gray-500'}`}>
        {value}%
      </span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      value={value}
      onChange={(e) => onChange(parseInt(e.target.value))}
      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
    />
  </div>
);

const Simulator: React.FC<Props> = ({ baseData }) => {
  const [salesMult, setSalesMult] = useState(100);
  const [cogsMult, setCogsMult] = useState(100);
  const [laborMult, setLaborMult] = useState(100);

  const simulatedData = useMemo(() => {
    return {
      ...baseData,
      // Scale revenues
      revenue_food: baseData.revenue_food * (salesMult / 100),
      revenue_beverage: baseData.revenue_beverage * (salesMult / 100),
      revenue_other: baseData.revenue_other * (salesMult / 100),
      
      // Scale COGS (affected by both sales volume and efficiency slider)
      cogs_food: baseData.cogs_food * (salesMult / 100) * (cogsMult / 100),
      cogs_beverage: baseData.cogs_beverage * (salesMult / 100) * (cogsMult / 100),
      cogs_other: baseData.cogs_other * (salesMult / 100) * (cogsMult / 100),

      // Scale Labor
      expense_personnel: baseData.expense_personnel * (laborMult / 100),
      
      // Rent is fixed (Anlagebedingte Kosten -> Fixed)
      expense_rent: baseData.expense_rent,
    };
  }, [baseData, salesMult, cogsMult, laborMult]);

  const kpis = calculateKPIs(simulatedData);
  const baseKpis = calculateKPIs(baseData);

  const getDiff = (current: number, base: number) => {
    const diff = current - base;
    const sign = diff > 0 ? '+' : '';
    return `${sign}${diff.toLocaleString('de-DE', { maximumFractionDigits: 0 })} €`;
  };

  const profitStatus = kpis.net_profit >= 0 ? 'green' : 'red';
  const statusColor = {
    green: 'bg-green-400/10 text-green-400 border-green-400/20',
    yellow: 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20',
    red: 'bg-red-400/10 text-red-400 border-red-400/20',
  }[profitStatus];

  return (
    <div className="bg-[#11131b] rounded-xl shadow-sm border border-gray-800 p-6 w-full">
      <div className="flex items-center gap-2 mb-6 border-b border-gray-800 pb-4">
        <RefreshCw size={20} className="text-blue-500" />
        <h2 className="text-lg font-bold text-gray-100">Mô phỏng Giả Định</h2>
        <span className="text-xs text-gray-500 ml-2 font-normal">(Điều chỉnh để xem tác động lợi nhuận)</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="space-y-4">
          <Slider label="Khối lượng bán" value={salesMult} onChange={setSalesMult} min={50} max={150} />
          <Slider label="Hiệu quả giá vốn" value={cogsMult} onChange={setCogsMult} min={80} max={120} />
          <Slider label="Chi phí nhân sự" value={laborMult} onChange={setLaborMult} min={80} max={120} />
          
          <button 
            onClick={() => {
              setSalesMult(100); setCogsMult(100); setLaborMult(100);
            }}
            className="text-xs text-blue-400 hover:text-blue-300 font-medium underline mt-2"
          >
            Đặt lại gốc
          </button>
        </div>

        <div className="bg-[#161922] rounded-xl p-6 flex flex-col justify-center border border-gray-800">
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-4 tracking-wider">Kết quả mô phỏng</h3>
            
            <div className="space-y-6">
                <div className="flex justify-between items-end border-b border-gray-800 pb-2">
                    <span className="text-gray-400">Tổng doanh thu</span>
                    <div className="text-right">
                        <div className="font-bold text-gray-100 text-lg">{kpis.total_revenue.toLocaleString('de-DE')} €</div>
                        <div className={`text-xs ${kpis.total_revenue >= baseKpis.total_revenue ? 'text-green-500' : 'text-red-500'}`}>
                            {getDiff(kpis.total_revenue, baseKpis.total_revenue)}
                        </div>
                    </div>
                </div>

                <div className="flex justify-between items-end border-b border-gray-800 pb-2">
                    <span className="text-gray-400">Chi phí chính %</span>
                    <div className="text-right">
                        <div className="font-bold text-gray-100 text-lg">{kpis.prime_cost_pct.toFixed(1)}%</div>
                         <div className={`text-xs ${kpis.prime_cost_pct <= baseKpis.prime_cost_pct ? 'text-green-500' : 'text-red-500'}`}>
                            {(kpis.prime_cost_pct - baseKpis.prime_cost_pct).toFixed(1)}%
                        </div>
                    </div>
                </div>

                 <div className={`flex justify-between items-center p-4 rounded-lg border ${statusColor} mt-4`}>
                    <span className="font-semibold">Lợi nhuận</span>
                    <div className="text-right">
                        <div className="font-bold text-2xl">{kpis.net_profit.toLocaleString('de-DE')} €</div>
                        <div className="text-sm opacity-80">{kpis.net_margin_pct.toFixed(1)}%</div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Simulator;