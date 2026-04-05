import React from 'react';
import { MonthlyData } from '../types';
import { calculateKPIs, getBenchmarkStatus } from '../services/calcService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import { TrendingUp, AlertCircle, Edit2, Wallet, Users, ShoppingBag, Activity } from 'lucide-react';
import Simulator from './Simulator';

interface Props {
  data: MonthlyData[];
  onEdit: (monthId: string) => void;
}

const KPICard = ({ title, value, subValue, status, icon: Icon }: any) => {
  const statusStyles = {
    green: 'text-green-400 bg-green-400/10 border-green-400/20',
    yellow: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
    red: 'text-red-400 bg-red-400/10 border-red-400/20',
    neutral: 'text-gray-300 bg-[#1e232f] border-gray-700'
  }[status || 'neutral'];

  return (
    <div className={`p-5 rounded-xl border ${statusStyles} flex flex-col relative overflow-hidden`}>
      <div className="flex justify-between items-start z-10">
        <div>
           <span className="text-xs font-semibold uppercase opacity-70 mb-1 block tracking-wider">{title}</span>
           <div className="text-2xl font-bold tracking-tight text-gray-100">{value}</div>
           {subValue && <div className="text-sm font-medium opacity-60 mt-1">{subValue}</div>}
        </div>
        {Icon && <Icon className="opacity-20 absolute right-4 top-4" size={48} />}
      </div>
    </div>
  );
};

const Dashboard: React.FC<Props> = ({ data, onEdit }) => {
  // Sort data by date
  const sortedData = [...data].sort((a, b) => a.month.localeCompare(b.month));
  
  // Calculate KPIs for all months for charts
  const chartData = sortedData.map(d => {
    const kpis = calculateKPIs(d);
    return {
      month: d.month,
      Revenue: kpis.total_revenue,
      COGS: kpis.total_cogs,
      Labor: d.expense_personnel,
      EBITDA: kpis.operating_result_1, // Using BE1 as EBITDA proxy
      PrimeCostPct: kpis.prime_cost_pct
    };
  });

  // Most recent month for KPI cards
  const currentMonth = sortedData[sortedData.length - 1];
  const kpis = currentMonth ? calculateKPIs(currentMonth) : null;

  if (!kpis) return (
    <div className="flex flex-col items-center justify-center h-64 text-gray-500 border border-gray-800 rounded-xl bg-[#11131b]">
      <AlertCircle size={48} className="mb-2 opacity-50" />
      <p>Chưa có dữ liệu. Vui lòng nhập tháng đầu tiên.</p>
    </div>
  );

  return (
    <div className="space-y-6 pb-6">
      
      {/* What-If Simulator (On Top) */}
      <div className="mb-8">
        <Simulator baseData={currentMonth} />
      </div>

      {/* Top Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard 
          title="Doanh thu" 
          value={`${kpis.total_revenue.toLocaleString('de-DE')} €`} 
          subValue={currentMonth.month}
          status="neutral"
          icon={Wallet}
        />
        <KPICard 
          title="Prime Cost" 
          value={`${kpis.prime_cost_pct.toFixed(1)}%`} 
          subValue={`${kpis.prime_cost.toLocaleString('de-DE')} €`}
          status={getBenchmarkStatus(kpis.prime_cost_pct, 'prime')}
          icon={Activity}
        />
        <KPICard 
          title="Giá vốn (COGS)" 
          value={`${((kpis.total_cogs / kpis.total_revenue) * 100).toFixed(1)}%`} 
          status={getBenchmarkStatus((kpis.total_cogs / kpis.total_revenue) * 100, 'cogs')}
          icon={ShoppingBag}
        />
        <KPICard 
          title="BE 1 (EBITDA)" 
          value={`${kpis.operating_result_1_margin.toFixed(1)}%`} 
          subValue={`${kpis.operating_result_1.toLocaleString('de-DE')} €`}
          status={getBenchmarkStatus(kpis.operating_result_1_margin, 'ebitda')}
          icon={TrendingUp}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#11131b] p-5 rounded-xl border border-gray-800 shadow-sm h-80">
          <h3 className="text-sm font-bold text-gray-300 mb-4 flex items-center gap-2">
            <TrendingUp size={16} className="text-blue-500" /> Doanh thu vs Prime Costs
          </h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
              <XAxis dataKey="month" tick={{fontSize: 12, fill: '#94a3b8'}} axisLine={false} tickLine={false} />
              <YAxis tick={{fontSize: 12, fill: '#94a3b8'}} axisLine={false} tickLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#f1f5f9' }}
                formatter={(value: number) => value.toLocaleString('de-DE') + ' €'} 
              />
              <Legend />
              <Bar dataKey="Revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="COGS" stackId="a" fill="#f97316" />
              <Bar dataKey="Labor" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-[#11131b] p-5 rounded-xl border border-gray-800 shadow-sm h-80">
          <h3 className="text-sm font-bold text-gray-300 mb-4">EBITDA (BE1) Trend</h3>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
              <XAxis dataKey="month" tick={{fontSize: 12, fill: '#94a3b8'}} axisLine={false} tickLine={false} />
              <YAxis tick={{fontSize: 12, fill: '#94a3b8'}} axisLine={false} tickLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#f1f5f9' }}
                formatter={(value: number) => value.toLocaleString('de-DE') + ' €'} 
              />
              <Line type="monotone" dataKey="EBITDA" stroke="#10b981" strokeWidth={3} dot={{r: 4, fill: '#10b981'}} activeDot={{r: 6}} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-[#11131b] rounded-xl border border-gray-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#1a1d26] text-gray-400 font-semibold border-b border-gray-800">
              <tr>
                <th className="px-4 py-3">Tháng</th>
                <th className="px-4 py-3 text-right">Doanh thu</th>
                <th className="px-4 py-3 text-right">Giá vốn</th>
                <th className="px-4 py-3 text-right">Nhân sự</th>
                <th className="px-4 py-3 text-right">BE 1 (EBITDA)</th>
                <th className="px-4 py-3 text-right">Lợi nhuận</th>
                <th className="px-4 py-3 text-center">Sửa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {sortedData.map(d => {
                const k = calculateKPIs(d);
                return (
                  <tr key={d.id} className="hover:bg-[#1a1d26] transition-colors text-gray-300">
                    <td className="px-4 py-3 font-medium text-gray-100">{d.month}</td>
                    <td className="px-4 py-3 text-right">{k.total_revenue.toLocaleString('de-DE')} €</td>
                    <td className="px-4 py-3 text-right text-orange-400">
                      {k.total_cogs.toLocaleString('de-DE')} € <span className="text-xs opacity-60">({((k.total_cogs/k.total_revenue)*100).toFixed(0)}%)</span>
                    </td>
                    <td className="px-4 py-3 text-right text-red-400">
                      {d.expense_personnel.toLocaleString('de-DE')} € <span className="text-xs opacity-60">({k.personnel_cost_pct.toFixed(0)}%)</span>
                    </td>
                    <td className={`px-4 py-3 text-right font-bold ${k.operating_result_1 >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {k.operating_result_1.toLocaleString('de-DE')} €
                    </td>
                    <td className="px-4 py-3 text-right text-gray-400">{k.net_profit.toLocaleString('de-DE')} €</td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => onEdit(d.id)} className="text-blue-400 hover:text-blue-300 p-1">
                        <Edit2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="text-center text-xs text-gray-600 font-medium italic mt-8">
        App by Kiên MAMMAM Berlin
      </div>
    </div>
  );
};

export default Dashboard;