import React, { useState, useEffect, useRef } from 'react';
import { MonthlyData } from '../types';
import { EMPTY_MONTH_DATA } from '../constants';
import { Save, Plus, Trash2, Calendar, ChevronRight, Upload, Download, FileJson, History, X } from 'lucide-react';

interface Props {
  dataList: MonthlyData[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onSave: (data: MonthlyData) => void;
  onDelete: (id: string) => void;
  onAddNew: () => void;
  onImport: (data: MonthlyData[]) => void;
}

const InputField = ({ label, subLabel, value, onChange, placeholder = "0", highlight = false }: any) => (
  <div className="flex flex-col space-y-1">
    <label className={`text-xs font-medium ${highlight ? 'text-blue-400' : 'text-gray-400'}`}>
      {label} <span className="text-gray-600 font-normal">({subLabel})</span>
    </label>
    <div className="relative">
      <input
        type="number"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value === '' ? 0 : parseFloat(e.target.value))}
        onWheel={(e) => e.currentTarget.blur()}
        className="w-full px-3 py-2 bg-[#1e232f] border border-gray-700 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm text-gray-100 placeholder-gray-600"
        placeholder={placeholder}
      />
    </div>
  </div>
);

const SectionHeader = ({ number, title, subTitle }: { number: string, title: string, subTitle: string }) => (
  <div className="col-span-1 md:col-span-3 mt-6 mb-2 border-b border-gray-800 pb-2 flex justify-between items-end">
    <h3 className="text-xs font-bold text-gray-200 uppercase tracking-wider">
      <span className="text-blue-500 mr-1">{number}.</span> {title} <span className="text-gray-500">({subTitle})</span>
    </h3>
  </div>
);

const InputForm: React.FC<Props> = ({ dataList, selectedId, onSelect, onSave, onDelete, onAddNew, onImport }) => {
  const [formData, setFormData] = useState<MonthlyData>(EMPTY_MONTH_DATA);
  const [showMenu, setShowMenu] = useState(false);
  const [showMobileHistory, setShowMobileHistory] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Logic to calculate VAT Output based on current form state
  const calculateVatOutput = (data: MonthlyData) => {
    const val = (
        (data.revenue_food || 0) * 0.07 + 
        (data.revenue_beverage || 0) * 0.19 + 
        (data.revenue_other || 0) * 0.19
    );
    return parseFloat(val.toFixed(2));
  };

  // Logic to calculate VAT Input based on current form state
  const calculateVatInput = (data: MonthlyData) => {
     const vat_cogs = 
        (data.cogs_food || 0) * 0.07 + 
        (data.cogs_beverage || 0) * 0.19 + 
        (data.cogs_other || 0) * 0.19;
    
     const total_ops = 
        (data.expense_personnel || 0) + 
        (data.expense_energy || 0) + 
        (data.expense_fees_consulting || 0) + 
        (data.expense_operating || 0) + 
        (data.expense_admin || 0);

     const total_assets = 
        (data.expense_maintenance || 0) + 
        (data.expense_depreciation || 0) + 
        (data.expense_rent || 0) + 
        (data.expense_leasing || 0) + 
        (data.expense_interest || 0);

     const taxable_overhead = (total_ops - (data.expense_personnel || 0)) + total_assets;
     const vat_overhead = taxable_overhead * 0.10; // Assumption 10% average

     const total = vat_cogs + vat_overhead;
     return parseFloat(total.toFixed(2));
  };

  useEffect(() => {
    if (selectedId) {
      const found = dataList.find(d => d.id === selectedId);
      if (found) {
          // Backward compatibility: If vat fields are missing, calculate them defaults
          const withDefaults = {
              ...found,
              vat_output: found.vat_output !== undefined ? found.vat_output : calculateVatOutput(found),
              vat_input: found.vat_input !== undefined ? found.vat_input : calculateVatInput(found)
          };
          setFormData(withDefaults);
      }
    } else {
      // If adding new, reset
      if (!formData.id || formData.id === '') {
         setFormData({ ...EMPTY_MONTH_DATA, id: crypto.randomUUID(), month: new Date().toISOString().slice(0, 7) });
      }
    }
  }, [selectedId, dataList]);

  // Reset form when clicking add new
  useEffect(() => {
      if(selectedId === null) {
          setFormData({ ...EMPTY_MONTH_DATA, id: crypto.randomUUID(), month: new Date().toISOString().slice(0, 7) });
      }
  }, [selectedId]);

  const handleChange = (field: keyof MonthlyData, value: any) => {
    setFormData(prev => {
        const newData = { ...prev, [field]: value };
        
        // Auto-update Taxes if related fields change
        const isRevenueField = ['revenue_food', 'revenue_beverage', 'revenue_other'].includes(field);
        if (isRevenueField) {
            newData.vat_output = calculateVatOutput(newData);
        }

        const isExpenseField = [
            'cogs_food', 'cogs_beverage', 'cogs_other',
            'expense_energy', 'expense_fees_consulting', 'expense_operating', 'expense_admin',
            'expense_maintenance', 'expense_depreciation', 'expense_rent', 'expense_leasing', 'expense_interest'
        ].includes(field);
        
        if (isExpenseField) {
            newData.vat_input = calculateVatInput(newData);
        }

        return newData;
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = e.target?.result as string;
        const parsed = JSON.parse(json);
        
        if (Array.isArray(parsed)) {
            // Simple validation
            const valid = parsed.every(item => item.id && item.month);
            if (valid) {
                onImport(parsed as MonthlyData[]);
            } else {
                alert("File không hợp lệ: Thiếu trường id hoặc month.");
            }
        } else {
            alert("File không đúng định dạng danh sách.");
        }
      } catch (err) {
        console.error(err);
        alert("Lỗi khi đọc file JSON.");
      }
      setShowMenu(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.readAsText(file);
  };

  const exportJSON = () => {
    const jsonString = JSON.stringify(dataList, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Backup_Data_${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setShowMenu(false);
  };

  const sortedList = [...dataList].sort((a, b) => b.month.localeCompare(a.month));

  const renderHistoryList = () => (
    <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
        {sortedList.length === 0 && (
        <div className="text-sm text-gray-600 text-center py-8">Chưa có dữ liệu</div>
        )}
        {sortedList.map(item => (
        <div 
            key={item.id}
            onClick={() => {
                onSelect(item.id);
                setShowMobileHistory(false); // Close mobile modal on select
            }}
            className={`p-3 rounded-md cursor-pointer border transition-all group flex justify-between items-center ${
            selectedId === item.id 
            ? 'bg-[#1c212e] border-blue-500/30 text-blue-400' 
            : 'bg-transparent border-transparent text-gray-400 hover:bg-[#1c212e] hover:text-gray-200'
            }`}
        >
            <div className="flex items-center gap-3">
            <Calendar size={16} className={selectedId === item.id ? 'text-blue-500' : 'text-gray-600'} />
            <div className="flex flex-col">
                <span className="text-sm font-medium">{item.month}</span>
                <span className="text-[10px] text-gray-600">
                    {((item.revenue_food + item.revenue_beverage + item.revenue_other) / 1000).toFixed(1)}k €
                </span>
            </div>
            </div>
            <ChevronRight size={14} className={`opacity-0 group-hover:opacity-100 transition-opacity ${selectedId === item.id ? 'opacity-100' : ''}`} />
        </div>
        ))}
    </div>
  );

  return (
    <div className="grid grid-cols-12 gap-6 h-[calc(100vh-140px)]">
      
      {/* Mobile History Modal Overlay */}
      {showMobileHistory && (
          <div className="fixed inset-0 z-50 bg-[#0f1117] flex flex-col md:hidden animate-in fade-in slide-in-from-bottom-4">
              <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-[#161922]">
                  <h3 className="text-gray-200 font-semibold text-sm">Lịch sử Nhập liệu</h3>
                  <button onClick={() => setShowMobileHistory(false)} className="text-gray-400 p-2">
                      <X size={24} />
                  </button>
              </div>
              {renderHistoryList()}
          </div>
      )}

      {/* Left Column: History List (Hidden on Mobile) */}
      <div className="hidden md:flex col-span-12 md:col-span-3 bg-[#11131b] border border-gray-800 rounded-lg flex-col overflow-hidden relative">
        <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-[#161922]">
          <h3 className="text-gray-200 font-semibold text-sm">Lịch sử</h3>
          <div className="relative">
            <button 
                onClick={() => setShowMenu(!showMenu)} 
                className="p-1.5 bg-blue-600 hover:bg-blue-500 rounded text-white transition-colors"
            >
                <Plus size={16} />
            </button>
            
            {showMenu && (
                <>
                <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)}></div>
                <div className="absolute right-0 mt-2 w-56 bg-[#1c212e] border border-gray-700 rounded-lg shadow-2xl z-50 py-1">
                    <button 
                        onClick={() => { onAddNew(); setShowMenu(false); }}
                        className="w-full text-left px-4 py-3 hover:bg-[#252a3b] text-sm text-gray-200 flex items-center gap-2"
                    >
                        <FileJson size={16} className="text-blue-400" />
                        Thêm tháng mới
                    </button>
                    <div className="border-t border-gray-700 my-1"></div>
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full text-left px-4 py-3 hover:bg-[#252a3b] text-sm text-gray-200 flex items-center gap-2"
                    >
                        <Upload size={16} className="text-green-400" />
                        Nhập dữ liệu (JSON)
                    </button>
                    <button 
                        onClick={exportJSON}
                        className="w-full text-left px-4 py-3 hover:bg-[#252a3b] text-sm text-gray-200 flex items-center gap-2"
                    >
                        <Download size={16} className="text-orange-400" />
                        Tải bản sao lưu (JSON)
                    </button>
                </div>
                </>
            )}
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                className="hidden" 
                accept=".json"
            />
          </div>
        </div>
        
        {renderHistoryList()}
      </div>

      {/* Right Column: Input Form (Full width on Mobile) */}
      <div className="col-span-12 md:col-span-9 bg-[#11131b] border border-gray-800 rounded-lg flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-800 bg-[#161922] flex justify-between items-center">
            <div className="flex items-center gap-3">
                 {/* Mobile History Toggle */}
                 <button 
                    onClick={() => setShowMobileHistory(true)}
                    className="md:hidden p-2 text-blue-400 bg-blue-400/10 rounded-md border border-blue-400/20"
                 >
                     <History size={20} />
                 </button>

                 <div>
                    <h2 className="text-lg font-bold text-gray-100 leading-tight">
                        {selectedId ? 'Sửa' : 'Mới'}
                    </h2>
                    <p className="text-[10px] md:text-xs text-gray-500 hidden sm:block">Nhập số liệu BWA (EUR)</p>
                 </div>
            </div>
            <div className="flex gap-2 md:gap-3">
                 {selectedId && (
                  <button 
                    onClick={() => onDelete(formData.id)}
                    className="px-2 md:px-3 py-1.5 text-red-400 hover:bg-red-400/10 rounded-md transition-colors text-xs md:text-sm font-medium flex items-center gap-1 md:gap-2 border border-transparent hover:border-red-400/20"
                  >
                    <Trash2 size={16} /> <span className="hidden sm:inline">Xóa</span>
                  </button>
                )}
                <button 
                  onClick={() => onSave(formData)}
                  className="px-3 md:px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-md shadow-lg shadow-blue-900/20 transition-all font-medium flex items-center gap-1 md:gap-2 text-xs md:text-sm"
                >
                  <Save size={16} /> Lưu <span className="hidden sm:inline">dữ liệu</span>
                </button>
            </div>
        </div>

        {/* Scrollable Form Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar relative">
          
          <div className="max-w-4xl mx-auto pb-10">
              {/* Date Input */}
              <div className="mb-6 md:mb-8 p-3 md:p-4 bg-[#1c212e] rounded-lg border border-gray-800 inline-block w-full md:w-auto">
                 <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Tháng báo cáo</label>
                 <input
                      type="month"
                      value={formData.month}
                      onChange={(e) => handleChange('month', e.target.value)}
                      className="bg-[#11131b] border border-gray-700 text-white rounded px-3 py-2 outline-none focus:border-blue-500 w-full md:w-auto"
                    />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
                
                {/* 1. Revenue */}
                <SectionHeader number="1" title="DOANH THU" subTitle="WARENUMSATZ" />
                <InputField label="Thực phẩm" subLabel="Speisen" value={formData.revenue_food} onChange={(v:number) => handleChange('revenue_food', v)} highlight />
                <InputField label="Đồ uống" subLabel="Getränke" value={formData.revenue_beverage} onChange={(v:number) => handleChange('revenue_beverage', v)} />
                <InputField label="Khác" subLabel="Sonstiges" value={formData.revenue_other} onChange={(v:number) => handleChange('revenue_other', v)} />
                
                {/* 2. COGS */}
                <SectionHeader number="2" title="GIÁ VỐN HÀNG BÁN" subTitle="WARENKOSTEN" />
                <InputField label="GV Thực phẩm" subLabel="WE Speisen" value={formData.cogs_food} onChange={(v:number) => handleChange('cogs_food', v)} />
                <InputField label="GV Đồ uống" subLabel="WE Getränke" value={formData.cogs_beverage} onChange={(v:number) => handleChange('cogs_beverage', v)} />
                <InputField label="GV Khác" subLabel="WE Sonstiges" value={formData.cogs_other} onChange={(v:number) => handleChange('cogs_other', v)} />

                {/* 3. Operating Costs */}
                <SectionHeader number="3" title="CHI PHÍ VẬN HÀNH" subTitle="BETRIEBSBEDINGTE KOSTEN" />
                <div className="md:col-span-1">
                     <InputField label="Nhân sự" subLabel="Personalkosten" value={formData.expense_personnel} onChange={(v:number) => handleChange('expense_personnel', v)} highlight />
                </div>
                <div className="md:col-span-2 grid grid-cols-2 gap-4">
                     <InputField label="Năng lượng" subLabel="Energie" value={formData.expense_energy} onChange={(v:number) => handleChange('expense_energy', v)} />
                     <InputField label="Phí/BH/TV" subLabel="Gebühren..." value={formData.expense_fees_consulting} onChange={(v:number) => handleChange('expense_fees_consulting', v)} />
                     <InputField label="CP Khác" subLabel="Betriebskost." value={formData.expense_operating} onChange={(v:number) => handleChange('expense_operating', v)} />
                     <InputField label="Hành chính" subLabel="Verwaltung" value={formData.expense_admin} onChange={(v:number) => handleChange('expense_admin', v)} />
                </div>

                {/* 4. Asset Costs */}
                <SectionHeader number="4" title="CHI PHÍ TÀI SẢN" subTitle="ANLAGEBEDINGTE KOSTEN" />
                <div className="md:col-span-3 grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                    <InputField label="Bảo trì" subLabel="Instandh." value={formData.expense_maintenance} onChange={(v:number) => handleChange('expense_maintenance', v)} />
                    <InputField label="Khấu hao" subLabel="AfA" value={formData.expense_depreciation} onChange={(v:number) => handleChange('expense_depreciation', v)} />
                    <InputField label="Tiền thuê" subLabel="Mieten" value={formData.expense_rent} onChange={(v:number) => handleChange('expense_rent', v)} />
                    <InputField label="Leasing" subLabel="Leasing" value={formData.expense_leasing} onChange={(v:number) => handleChange('expense_leasing', v)} />
                    <InputField label="Lãi vay" subLabel="Zinsen" value={formData.expense_interest} onChange={(v:number) => handleChange('expense_interest', v)} />
                </div>

                {/* 5. Taxes */}
                <SectionHeader number="5" title="THUẾ" subTitle="STEUERN" />
                <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                    <InputField label="Thuế TNDN" subLabel="Einkommensst." value={formData.expense_taxes} onChange={(v:number) => handleChange('expense_taxes', v)} />
                    <div className="grid grid-cols-2 gap-4 md:col-span-2">
                        <InputField label="Thuế Đầu ra" subLabel="Umsatzsteuer" value={formData.vat_output} onChange={(v:number) => handleChange('vat_output', v)} />
                        <InputField label="Thuế Đầu vào" subLabel="Vorsteuer" value={formData.vat_input} onChange={(v:number) => handleChange('vat_input', v)} />
                    </div>
                </div>
              </div>

               <div className="mt-8 text-center text-xs text-gray-600 font-medium italic">
                 App by Kiên MAMMAM Berlin
               </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InputForm;