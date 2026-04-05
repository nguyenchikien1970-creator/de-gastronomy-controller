import React from 'react';
import { MonthlyData } from '../types';
import { calculateKPIs } from '../services/calcService';
import { AlertCircle } from 'lucide-react';

interface Props {
  data: MonthlyData[];
  selectedMonthId?: string;
}

const Row = ({ label, deLabel, value, pct, isTotal = false, isHeader = false, isSubHeader = false }: any) => {
    if (isHeader) {
        return (
            <div className="grid grid-cols-12 py-2 px-4 bg-[#1c212e] border-b border-gray-700 font-bold text-gray-300 text-sm">
                <div className="col-span-6">{label}</div>
                <div className="col-span-3 text-right">Giá trị (€)</div>
                <div className="col-span-3 text-right">{pct !== undefined ? '%' : ''}</div>
            </div>
        )
    }
    if (isSubHeader) {
         return (
            <div className="grid grid-cols-12 py-2 px-4 bg-[#161922] border-b border-gray-800 text-xs font-bold text-blue-400 uppercase tracking-wider mt-4">
                <div className="col-span-12">{label} <span className="text-gray-600 ml-2">{deLabel}</span></div>
            </div>
        )
    }

    return (
        <div className={`grid grid-cols-12 py-2 px-4 border-b border-gray-800/50 text-sm hover:bg-[#161922] transition-colors ${isTotal ? 'font-bold bg-[#1c212e]/50 text-gray-100' : 'text-gray-400'}`}>
            <div className="col-span-6 flex flex-col">
                <span>{label}</span>
                <span className="text-[10px] text-gray-600">{deLabel}</span>
            </div>
            <div className="col-span-3 text-right font-mono">{value.toLocaleString('de-DE', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
            <div className="col-span-3 text-right font-mono text-gray-500">{pct !== undefined && pct !== null ? pct.toFixed(1) + '%' : ''}</div>
        </div>
    );
}

const PnLTable: React.FC<Props> = ({ data, selectedMonthId }) => {
    // Default to latest month if none selected
    const sortedData = [...data].sort((a, b) => b.month.localeCompare(a.month));
    const activeData = selectedMonthId 
        ? data.find(d => d.id === selectedMonthId) 
        : sortedData[0];

    if (!activeData) return (
         <div className="flex flex-col items-center justify-center h-64 text-gray-500 border border-gray-800 rounded-xl bg-[#11131b]">
            <AlertCircle size={48} className="mb-2 opacity-50" />
            <p>Chưa có dữ liệu.</p>
        </div>
    );

    const k = calculateKPIs(activeData);
    
    // Helper to calc % of Revenue
    const pct = (val: number) => k.total_revenue > 0 ? (val / k.total_revenue) * 100 : 0;

    return (
        <div className="pb-8">
            <div className="bg-[#11131b] border border-gray-800 rounded-xl overflow-hidden shadow-sm max-w-4xl mx-auto mb-4">
                <div className="p-4 bg-[#161922] border-b border-gray-800 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-gray-100">Bảng Kết Quả Kinh Doanh (BWA)</h2>
                    <div className="text-sm font-medium text-blue-400 bg-blue-400/10 px-3 py-1 rounded-full border border-blue-400/20">
                        Tháng {activeData.month}
                    </div>
                </div>
                
                <div className="flex flex-col">
                    <Row isHeader />

                    {/* 1. Revenue */}
                    <Row isSubHeader label="1. Doanh thu" deLabel="(Warenumsatz)" />
                    <Row label="Thực phẩm" deLabel="Speisen (7% Tax)" value={activeData.revenue_food} pct={pct(activeData.revenue_food)} />
                    <Row label="Đồ uống" deLabel="Getränke (19% Tax)" value={activeData.revenue_beverage} pct={pct(activeData.revenue_beverage)} />
                    <Row label="Khác" deLabel="Sonstiges" value={activeData.revenue_other} pct={pct(activeData.revenue_other)} />
                    <Row label="Tổng Doanh Thu" deLabel="Betriebsumsatz" value={k.total_revenue} pct={100} isTotal />

                    {/* 2. COGS */}
                    <Row isSubHeader label="2. Giá vốn" deLabel="(Warenkosten)" />
                    <Row label="GV Thực phẩm" deLabel="Wareneinsatz Speisen" value={activeData.cogs_food} pct={pct(activeData.cogs_food)} />
                    <Row label="GV Đồ uống" deLabel="Wareneinsatz Getränke" value={activeData.cogs_beverage} pct={pct(activeData.cogs_beverage)} />
                    <Row label="GV Khác" deLabel="Wareneinsatz Sonstiges" value={activeData.cogs_other} pct={pct(activeData.cogs_other)} />
                    <Row label="Tổng Giá Vốn" deLabel="Gesamte Warenkosten" value={k.total_cogs} pct={pct(k.total_cogs)} isTotal />

                    {/* Gross Profit */}
                    <div className="py-3 px-4 bg-[#1c212e] border-y border-gray-700 flex justify-between items-center mt-2 mb-2">
                        <span className="font-bold text-lg text-white">Lợi nhuận gộp</span>
                        <div className="text-right">
                            <span className="font-bold text-xl text-green-400 block">{k.gross_profit.toLocaleString('de-DE')} €</span>
                            <span className="text-xs text-gray-400">{k.gross_margin_pct.toFixed(1)}%</span>
                        </div>
                    </div>

                    {/* 3. Operating Costs */}
                    <Row isSubHeader label="3. Chi phí vận hành" deLabel="(Betriebsbedingte Kosten)" />
                    <Row label="Nhân sự" deLabel="Personalkosten (No VAT)" value={activeData.expense_personnel} pct={pct(activeData.expense_personnel)} />
                    <Row label="Năng lượng" deLabel="Energiekosten" value={activeData.expense_energy} pct={pct(activeData.expense_energy)} />
                    <Row label="Phí, BH, Tư vấn" deLabel="Gebühren, Vers., Beiträge..." value={activeData.expense_fees_consulting} pct={pct(activeData.expense_fees_consulting)} />
                    <Row label="CP Hoạt động khác" deLabel="Betriebskosten" value={activeData.expense_operating} pct={pct(activeData.expense_operating)} />
                    <Row label="Hành chính/Quản lý" deLabel="Verwaltungskosten" value={activeData.expense_admin} pct={pct(activeData.expense_admin)} />
                    <Row label="Tổng CP Vận hành" deLabel="Gesamt" value={k.total_operating_costs} pct={pct(k.total_operating_costs)} isTotal />

                    {/* Result 1 */}
                    <div className="py-2 px-4 bg-[#1c212e]/30 border-y border-gray-800 flex justify-between items-center">
                        <span className="font-bold text-gray-200">Kết quả vận hành 1</span>
                        <div className="text-right">
                            <span className={`font-bold block ${k.operating_result_1 >= 0 ? 'text-blue-400' : 'text-red-400'}`}>{k.operating_result_1.toLocaleString('de-DE')} €</span>
                            <span className="text-xs text-gray-500">{k.operating_result_1_margin.toFixed(1)}%</span>
                        </div>
                    </div>

                    {/* 4. Asset Costs */}
                    <Row isSubHeader label="4. Chi phí tài sản" deLabel="(Anlagebedingte Kosten)" />
                    <Row label="Bảo trì" deLabel="Instandhaltung" value={activeData.expense_maintenance} pct={pct(activeData.expense_maintenance)} />
                    <Row label="Khấu hao" deLabel="AfA" value={activeData.expense_depreciation} pct={pct(activeData.expense_depreciation)} />
                    <Row label="Tiền thuê" deLabel="Mieten & Pachten" value={activeData.expense_rent} pct={pct(activeData.expense_rent)} />
                    <Row label="Cho thuê tài chính" deLabel="Leasing" value={activeData.expense_leasing} pct={pct(activeData.expense_leasing)} />
                    <Row label="Lãi vay" deLabel="Zinsen" value={activeData.expense_interest} pct={pct(activeData.expense_interest)} />
                    <Row label="Tổng CP Tài sản" deLabel="Gesamt" value={k.total_asset_costs} pct={pct(k.total_asset_costs)} isTotal />

                    {/* Result 2 */}
                    <div className="py-2 px-4 bg-[#1c212e]/30 border-y border-gray-800 flex justify-between items-center">
                        <span className="font-bold text-gray-200">Lợi nhuận trước thuế</span>
                        <div className="text-right">
                            <span className={`font-bold block ${k.operating_result_2 >= 0 ? 'text-blue-400' : 'text-red-400'}`}>{k.operating_result_2.toLocaleString('de-DE')} €</span>
                            <span className="text-xs text-gray-500">{k.operating_result_2_margin.toFixed(1)}%</span>
                        </div>
                    </div>

                    {/* 5. Income Taxes */}
                    <Row isSubHeader label="5. Thuế Thu Nhập" deLabel="(Einkommensteuer)" />
                    <Row label="Thuế TNDN" deLabel="Steuern vom Einkommen und Ertrag" value={activeData.expense_taxes} pct={pct(activeData.expense_taxes)} />

                    {/* --- VAT SECTION --- */}
                    <div className="mt-6 border-t border-gray-700 bg-[#161922]/50">
                        <div className="py-2 px-4 bg-[#1c212e] text-xs font-bold text-gray-400 uppercase tracking-wider flex justify-between items-center">
                            <span>TÍNH TOÁN THUẾ GTGT (UMSATZSTEUER)</span>
                            <span className="text-[10px] text-gray-500 normal-case">Dùng để khấu trừ lợi nhuận</span>
                        </div>
                        
                        {/* Output VAT */}
                        <div className="grid grid-cols-12 py-2 px-4 border-b border-gray-800/50 text-sm text-gray-400">
                            <div className="col-span-9">
                                Thuế đầu ra (Umsatzsteuer) <br/>
                                <span className="text-[10px] text-gray-600">7% Thực phẩm + 19% Đồ uống</span>
                            </div>
                            <div className="col-span-3 text-right text-gray-300">
                                {k.vat_output.toLocaleString('de-DE', {minimumFractionDigits: 2, maximumFractionDigits: 2})} €
                            </div>
                        </div>

                        {/* Input VAT */}
                        <div className="grid grid-cols-12 py-2 px-4 border-b border-gray-800/50 text-sm text-gray-400">
                            <div className="col-span-9">
                                (-) Thuế đầu vào (Vorsteuer) <br/>
                                <span className="text-[10px] text-gray-600">GV (7%/19%) + Chi phí (~10% avg)</span>
                            </div>
                            <div className="col-span-3 text-right text-red-400">
                                - {k.vat_input.toLocaleString('de-DE', {minimumFractionDigits: 2, maximumFractionDigits: 2})} €
                            </div>
                        </div>

                        {/* Payable */}
                        <div className="grid grid-cols-12 py-2 px-4 border-t border-gray-800 text-sm font-semibold">
                            <div className="col-span-9 text-gray-300">
                                Thuế phải trả (Zahllast)
                            </div>
                            <div className="col-span-3 text-right text-white">
                                {k.vat_payable.toLocaleString('de-DE', {minimumFractionDigits: 2, maximumFractionDigits: 2})} €
                            </div>
                        </div>
                    </div>

                    {/* Net Profit (Bottom Line) */}
                    <div className="py-6 px-4 bg-gradient-to-r from-[#1c212e] to-[#252a3b] border-t-2 border-blue-500/50 flex justify-between items-center mt-2">
                        <div>
                            <span className="font-bold text-xl text-white block">Lợi nhuận sau thuế</span>
                            <span className="text-xs text-gray-400 font-normal">
                                = (Kết quả 2 - Thuế TNDN - Thuế phải trả)
                            </span>
                        </div>
                        <div className="text-right">
                            <span className={`font-bold text-3xl block ${k.net_profit >= 0 ? 'text-green-400' : 'text-red-500'}`}>{k.net_profit.toLocaleString('de-DE')} €</span>
                            <span className="text-sm text-gray-400">{k.net_margin_pct.toFixed(1)}%</span>
                        </div>
                    </div>

                </div>
            </div>
            <div className="text-center text-xs text-gray-600 font-medium italic">
                App by Kiên MAMMAM Berlin
            </div>
        </div>
    );
};

export default PnLTable;