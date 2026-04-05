import React, { useState, useEffect } from 'react';
import { loadAllData, saveAllData } from './services/storageService';
import { MonthlyData, AIAnalysisResult, RestaurantProfile } from './types';
import Dashboard from './components/Dashboard';
import InputForm from './components/InputForm';
import AIReport from './components/AIReport';
import PnLTable from './components/PnLTable';
import LoginPage from './components/LoginPage';
import RestaurantSetup from './components/RestaurantSetup';
import { LayoutDashboard, FileText, Download, ChefHat, ShieldAlert, Table2, Menu, X, LogOut } from 'lucide-react';
import { calculateKPIs } from './services/calcService';

type Tab = 'input' | 'pnl' | 'dashboard' | 'ai';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('auth_session') !== null;
  });
  const [userEmail, setUserEmail] = useState<string>(() => {
    return localStorage.getItem('auth_email') || '';
  });
  const [data, setData] = useState<MonthlyData[]>([]);
  const [currentTab, setCurrentTab] = useState<Tab>('input');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<AIAnalysisResult | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [restaurantProfile, setRestaurantProfile] = useState<RestaurantProfile | null>(() => {
    const saved = localStorage.getItem('restaurant_profile');
    return saved ? JSON.parse(saved) : null;
  });

  const handleLogin = (email: string) => {
    localStorage.setItem('auth_session', 'true');
    localStorage.setItem('auth_email', email);
    setIsAuthenticated(true);
    setUserEmail(email);
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_session');
    localStorage.removeItem('auth_email');
    setIsAuthenticated(false);
    setUserEmail('');
  };

  const handleSetupComplete = (profile: RestaurantProfile) => {
    localStorage.setItem('restaurant_profile', JSON.stringify(profile));
    setRestaurantProfile(profile);
  };

  useEffect(() => {
    const stored = loadAllData();
    if (stored.length > 0) {
      setData(stored);
    }
  }, []);

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  // Show restaurant setup if no profile
  if (!restaurantProfile) {
    return <RestaurantSetup onComplete={handleSetupComplete} />;
  }


  const handleSaveMonth = (monthData: MonthlyData) => {
    let newData;
    const exists = data.find(d => d.id === monthData.id);
    if (exists) {
      newData = data.map(d => d.id === monthData.id ? monthData : d);
    } else {
      newData = [...data, monthData];
    }
    setData(newData);
    saveAllData(newData);
    setEditingId(monthData.id); 
    setAiResult(null);
  };

  const handleDeleteMonth = (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa tháng này?')) {
      const newData = data.filter(d => d.id !== id);
      setData(newData);
      saveAllData(newData);
      setEditingId(null);
      setAiResult(null);
    }
  };

  const handleImportData = (importedData: MonthlyData[]) => {
    const currentMap = new Map<string, MonthlyData>();
    data.forEach(d => currentMap.set(d.id, d));
    importedData.forEach(d => currentMap.set(d.id, d));
    
    const newData = Array.from(currentMap.values());
    setData(newData);
    saveAllData(newData);
    alert(`Đã nhập thành công ${importedData.length} bản ghi.`);
  };

  const handleEditRequest = (id: string) => {
    setEditingId(id);
    setCurrentTab('input');
  };

  const handleAddNew = () => {
    setEditingId(null);
    setCurrentTab('input');
  };

  const handleTabChange = (tab: Tab) => {
    setCurrentTab(tab);
    setMobileMenuOpen(false); // Close menu on mobile when tab changes
  };

  const exportPnLExcel = () => {
    const sortedData = [...data].sort((a, b) => a.month.localeCompare(b.month));
    const n = (val: number | undefined) => (val || 0).toFixed(2).replace('.', ',');

    const calculatedData = sortedData.map(d => ({
        raw: d,
        kpis: calculateKPIs(d)
    }));

    const rowsDef = [
        { label: '1. TỔNG DOANH THU', getValue: (d: any) => d.kpis.total_revenue },
        { label: '   - Thực phẩm (Speisen)', getValue: (d: any) => d.raw.revenue_food },
        { label: '   - Đồ uống (Getränke)', getValue: (d: any) => d.raw.revenue_beverage },
        { label: '   - Khác (Sonstiges)', getValue: (d: any) => d.raw.revenue_other },
        { label: '', getValue: () => '' },
        { label: '2. TỔNG GIÁ VỐN', getValue: (d: any) => d.kpis.total_cogs },
        { label: '   - GV Thực phẩm', getValue: (d: any) => d.raw.cogs_food },
        { label: '   - GV Đồ uống', getValue: (d: any) => d.raw.cogs_beverage },
        { label: '   - GV Khác', getValue: (d: any) => d.raw.cogs_other },
        { label: 'LỢI NHUẬN GỘP', getValue: (d: any) => d.kpis.gross_profit },
        { label: '', getValue: () => '' },
        { label: '3. CHI PHÍ VẬN HÀNH', getValue: (d: any) => d.kpis.total_operating_costs },
        { label: '   - Nhân sự (Personal)', getValue: (d: any) => d.raw.expense_personnel },
        { label: '   - Năng lượng', getValue: (d: any) => d.raw.expense_energy },
        { label: '   - Phí/BH/Tư vấn', getValue: (d: any) => d.raw.expense_fees_consulting },
        { label: '   - Vận hành khác', getValue: (d: any) => d.raw.expense_operating },
        { label: '   - Hành chính/Quản lý', getValue: (d: any) => d.raw.expense_admin },
        { label: 'EBITDA (Kết quả 1)', getValue: (d: any) => d.kpis.operating_result_1 },
        { label: '', getValue: () => '' },
        { label: '4. CHI PHÍ TÀI SẢN', getValue: (d: any) => d.kpis.total_asset_costs },
        { label: '   - Bảo trì', getValue: (d: any) => d.raw.expense_maintenance },
        { label: '   - Khấu hao (AfA)', getValue: (d: any) => d.raw.expense_depreciation },
        { label: '   - Tiền thuê (Miete)', getValue: (d: any) => d.raw.expense_rent },
        { label: '   - Leasing', getValue: (d: any) => d.raw.expense_leasing },
        { label: '   - Lãi vay', getValue: (d: any) => d.raw.expense_interest },
        { label: 'EBIT (Kết quả 2)', getValue: (d: any) => d.kpis.operating_result_2 },
        { label: '', getValue: () => '' },
        { label: '5. THUẾ', getValue: () => '' },
        { label: '   - Thuế TNDN', getValue: (d: any) => d.raw.expense_taxes },
        { label: '   - Thuế GTGT Đầu ra', getValue: (d: any) => d.kpis.vat_output },
        { label: '   - Thuế GTGT Đầu vào', getValue: (d: any) => d.kpis.vat_input },
        { label: '   - Thuế GTGT Phải nộp', getValue: (d: any) => d.kpis.vat_payable },
        { label: '', getValue: () => '' },
        { label: 'LỢI NHUẬN RÒNG (NET)', getValue: (d: any) => d.kpis.net_profit },
    ];

    const headerRow = ['Danh mục', ...sortedData.map(d => d.month)];
    const dataRows = rowsDef.map(def => {
        const rowValues = calculatedData.map(d => {
            const val = def.getValue(d);
            return typeof val === 'number' ? n(val) : val;
        });
        return [def.label, ...rowValues].join(';');
    });

    const csvContent = '\uFEFF' + [headerRow.join(';'), ...dataRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BWA_Detailed_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
  };

  const exportDashboardWord = () => {
    const sortedData = [...data].sort((a, b) => b.month.localeCompare(a.month)); 
    
    let htmlContent = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>Tổng Quan Nhà Hàng</title>
      <style>
        body { font-family: 'Calibri', sans-serif; }
        h1 { color: #1e3a8a; text-align: center; }
        h2 { color: #1e40af; border-bottom: 1px solid #ccc; margin-top: 20px; }
        table { border-collapse: collapse; width: 100%; margin-top: 10px; }
        th { background-color: #f1f5f9; border: 1px solid #94a3b8; padding: 8px; text-align: center; }
        td { border: 1px solid #cbd5e1; padding: 8px; text-align: right; }
        .text-left { text-align: left; }
        .text-center { text-align: center; }
        .font-bold { font-weight: bold; }
        .text-green { color: #15803d; }
        .text-red { color: #b91c1c; }
        .footer { margin-top: 50px; text-align: center; font-size: 10pt; color: #666; font-style: italic; }
      </style>
    </head>
    <body>
      <h1>BÁO CÁO TỔNG QUAN</h1>
      <p style="text-align: center">Ngày xuất: ${new Date().toLocaleDateString('vi-VN')}</p>
      
      <h2>1. Dữ liệu Lịch sử (Tổng hợp)</h2>
      <table>
        <thead>
          <tr>
            <th>Tháng</th>
            <th>Doanh thu (€)</th>
            <th>Giá vốn (€)</th>
            <th>Nhân sự (€)</th>
            <th>EBITDA (€)</th>
            <th>Lợi nhuận Net (€)</th>
          </tr>
        </thead>
        <tbody>`;
    
    sortedData.forEach(d => {
        const k = calculateKPIs(d);
        htmlContent += `
          <tr>
            <td class="text-center font-bold">${d.month}</td>
            <td>${k.total_revenue.toLocaleString('de-DE')}</td>
            <td>${k.total_cogs.toLocaleString('de-DE')}</td>
            <td>${d.expense_personnel.toLocaleString('de-DE')}</td>
            <td class="${k.operating_result_1 >= 0 ? 'text-green' : 'text-red'} font-bold">${k.operating_result_1.toLocaleString('de-DE')}</td>
            <td>${k.net_profit.toLocaleString('de-DE')}</td>
          </tr>
        `;
    });

    htmlContent += `
        </tbody>
      </table>
      <div class="footer">App by Kiên MAMMAM Berlin</div>
    </body>
    </html>`;

    const blob = new Blob([htmlContent], { type: 'application/msword' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TongQuan_Dashboard_${new Date().toISOString().slice(0,10)}.doc`;
    a.click();
  };

  const exportAIWord = () => {
    if (!aiResult) {
        alert("Chưa có dữ liệu AI. Vui lòng tạo báo cáo trước.");
        return;
    }

    const activeMonthName = editingId 
        ? data.find(d => d.id === editingId)?.month 
        : (data.length > 0 ? [...data].sort((a,b) => b.month.localeCompare(a.month))[0].month : "N/A");

    let htmlContent = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>Trợ lý AI được tạo bởi Kiên MAMMAM Berlin</title>
      <style>
        body { font-family: 'Calibri', sans-serif; }
        h1 { color: #581c87; text-align: center; }
        h2 { color: #6b21a8; margin-top: 25px; border-bottom: 2px solid #e9d5ff; padding-bottom: 5px; }
        h3 { color: #7e22ce; margin-top: 15px; }
        .metric-box { border: 1px solid #ccc; padding: 10px; margin-bottom: 10px; background-color: #faf5ff; }
        .green { color: #15803d; font-weight: bold; }
        .yellow { color: #a16207; font-weight: bold; }
        .red { color: #b91c1c; font-weight: bold; }
        ul { margin-top: 5px; }
        li { margin-bottom: 5px; }
        .impact { font-weight: bold; color: #333; }
        .footer { margin-top: 50px; text-align: center; font-size: 10pt; color: #666; font-style: italic; }
      </style>
    </head>
    <body>
      <h1>BÁO CÁO: AI TƯ VẤN (KIÊN MAMMAM BERLIN)</h1>
      <p style="text-align: center">Tháng phân tích: <b>${activeMonthName}</b></p>

      <h2>1. Phát hiện chính (Key Diagnostics)</h2>
    `;

    aiResult.diagnostics.forEach(d => {
        let colorClass = d.status === 'green' ? 'green' : (d.status === 'red' ? 'red' : 'yellow');
        htmlContent += `
        <div class="metric-box">
            <p><span style="font-size: 14pt;">${d.metric}</span> - <span class="${colorClass}">${d.status.toUpperCase()}</span></p>
            <p><b>Thực tế:</b> ${d.actual.toFixed(1)}% | <b>Mục tiêu:</b> ${d.target_or_range}</p>
            <p>${d.explanation}</p>
            ${d.impact_estimate_eur !== 0 ? `<p class="impact">Tác động tài chính: ${d.impact_estimate_eur > 0 ? '+' : ''}${d.impact_estimate_eur.toLocaleString('de-DE')} €</p>` : ''}
        </div>`;
    });

    htmlContent += `<h2>2. Kế hoạch ngắn hạn (14-30 ngày)</h2><ul>`;
    aiResult.action_plan.quick_wins_14_days.forEach(action => {
        htmlContent += `<li>${action}</li>`;
    });
    htmlContent += `</ul>`;

    htmlContent += `<h2>3. Kế hoạch dài hạn (3-6 tháng)</h2>`;
    aiResult.action_plan.top_priorities.forEach(p => {
        htmlContent += `
        <h3>${p.title} (${p.difficulty})</h3>
        <p><i>${p.why}</i></p>
        <p>Dự kiến tác động: <b>${p.expected_impact_eur.toLocaleString('de-DE')} €</b></p>
        `;
    });

    htmlContent += `
      <h2>4. Điểm hòa vốn</h2>
      <p>Doanh thu cần đạt để Lợi nhuận = 0: <b style="font-size: 14pt; color: #1e40af">${aiResult.break_even.break_even_revenue.ebitda_eur.toLocaleString('de-DE')} €</b></p>
      
      <div class="footer">App by Kiên MAMMAM Berlin</div>
    </body>
    </html>
    `;

    const blob = new Blob([htmlContent], { type: 'application/msword' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AI_Report_${activeMonthName}.doc`;
    a.click();
  };

  const handleExport = () => {
      if (currentTab === 'pnl') exportPnLExcel();
      if (currentTab === 'dashboard') exportDashboardWord();
      if (currentTab === 'ai') exportAIWord();
  };

  const getExportLabel = () => {
      if (currentTab === 'pnl') return "Xuất dữ liệu dạng bảng";
      return "Xuất dữ liệu dạng Text";
  };

  const activeMonthData = editingId 
    ? data.find(d => d.id === editingId) 
    : (data.length > 0 ? data.sort((a,b) => b.month.localeCompare(a.month))[0] : undefined);

  return (
    <div className="flex h-screen bg-[#0f1117] text-gray-300 font-sans overflow-hidden">
      
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-30 md:hidden backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 w-64 bg-[#0f1117] border-r border-gray-800 flex flex-col flex-shrink-0 z-40 transform transition-transform duration-300 ease-in-out ${
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      } md:relative md:translate-x-0`}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-800">
           <div className="flex flex-col">
              <span className="font-bold text-blue-500 text-lg leading-none">Quản lý Nhà hàng</span>
              <span className="text-xs text-gray-500 mt-1">Phân tích số liệu</span>
           </div>
           {/* Close button for mobile */}
           <button onClick={() => setMobileMenuOpen(false)} className="md:hidden text-gray-400">
             <X size={24} />
           </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {/* 1. INPUT */}
          <button 
                onClick={() => { handleAddNew(); setMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                currentTab === 'input' ? 'bg-blue-600/10 text-blue-400' : 'text-gray-400 hover:bg-[#161922] hover:text-gray-200'
                }`}
            >
                <FileText size={20} />
                Nhập dữ liệu
            </button>
          
          {/* 2. PNL */}
           <button 
            onClick={() => handleTabChange('pnl')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              currentTab === 'pnl' ? 'bg-[#1c212e] text-blue-400' : 'text-gray-400 hover:bg-[#161922] hover:text-gray-200'
            }`}
          >
            <Table2 size={20} />
            Bảng tính toán
          </button>
          
          {/* 3. DASHBOARD */}
          <button 
            onClick={() => handleTabChange('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              currentTab === 'dashboard' ? 'bg-[#1c212e] text-blue-400' : 'text-gray-400 hover:bg-[#161922] hover:text-gray-200'
            }`}
          >
            <LayoutDashboard size={20} />
            Tổng Quan
          </button>
           
          {/* 4. AI */}
           <button 
            onClick={() => handleTabChange('ai')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              currentTab === 'ai' ? 'bg-[#1c212e] text-purple-400' : 'text-gray-400 hover:bg-[#161922] hover:text-gray-200'
            }`}
          >
            <ChefHat size={20} />
            AI Tư Vấn
          </button>
        </nav>

        <div className="p-4 border-t border-gray-800">
           <div className="bg-[#161922] rounded-lg p-3 border border-gray-800">
              <div className="flex items-center gap-2 mb-2 text-gray-400">
                 <ShieldAlert size={14} />
                 <span className="text-xs font-bold uppercase">Chế độ bảo mật</span>
              </div>
              <p className="text-[10px] text-gray-500 leading-relaxed">
                 Dữ liệu được lưu cục bộ trên trình duyệt. Không tải lên máy chủ.
              </p>
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#0f1117]">
         <div className="h-16 flex items-center justify-between px-4 md:px-8 border-b border-gray-800 bg-[#0f1117]">
            <div className="flex items-center gap-3">
                {/* Mobile Menu Button */}
                <button 
                  onClick={() => setMobileMenuOpen(true)}
                  className="md:hidden text-gray-300 hover:text-white"
                >
                   <Menu size={24} />
                </button>

                <h1 className="text-lg md:text-xl font-bold text-white capitalize truncate max-w-[200px] md:max-w-none">
                    {currentTab === 'dashboard' && 'Tổng Quan'}
                    {currentTab === 'pnl' && 'Bảng tính toán (BWA)'}
                    {currentTab === 'input' && 'Nhập liệu'}
                    {currentTab === 'ai' && 'AI Tư Vấn (Kiên MAMMAM Berlin)'}
                </h1>
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-500">
                <span className="hidden lg:inline">Hỗ trợ bởi Gemini</span>
                
                {currentTab !== 'input' && (
                    <button 
                        onClick={handleExport} 
                        className="flex items-center gap-2 text-gray-300 hover:text-white hover:bg-[#1c212e] px-3 py-1.5 rounded border border-gray-700 transition-colors"
                    >
                        {currentTab === 'pnl' ? <Download size={18} /> : <FileText size={18} />}
                        <span className="hidden md:inline font-medium">{getExportLabel()}</span>
                    </button>
                )}

                {/* User info & Logout */}
                <div className="flex items-center gap-2 ml-2 pl-2 border-l border-gray-700/50">
                    <span className="hidden md:inline text-gray-400 text-xs truncate max-w-[150px]">{userEmail}</span>
                    <button
                        onClick={handleLogout}
                        title="Đăng xuất"
                        className="flex items-center gap-1.5 text-gray-400 hover:text-red-400 hover:bg-red-400/10 px-2 py-1.5 rounded transition-colors"
                    >
                        <LogOut size={16} />
                        <span className="hidden lg:inline text-xs">Thoát</span>
                    </button>
                </div>
            </div>
         </div>

         <div className="flex-1 overflow-auto p-4 md:p-8 pb-24 md:pb-8 custom-scrollbar">
            <div className="max-w-7xl mx-auto h-full flex flex-col">
                <div className="flex-1">
                    {currentTab === 'dashboard' && (
                        <Dashboard data={data} onEdit={handleEditRequest} />
                    )}

                    {currentTab === 'pnl' && (
                        <PnLTable data={data} selectedMonthId={editingId || undefined} />
                    )}

                    {currentTab === 'input' && (
                        <InputForm 
                            dataList={data}
                            selectedId={editingId}
                            onSelect={(id) => setEditingId(id)}
                            onSave={handleSaveMonth}
                            onDelete={handleDeleteMonth}
                            onAddNew={() => setEditingId(null)}
                            onImport={handleImportData}
                        />
                    )}

                    {currentTab === 'ai' && (
                        <div className="max-w-5xl mx-auto">
                            {activeMonthData ? (
                                <AIReport 
                                    data={activeMonthData} 
                                    result={aiResult}
                                    onResult={setAiResult}
                                    profile={restaurantProfile}
                                />
                            ) : (
                                <div className="text-center py-20 text-gray-500 border border-gray-800 rounded-xl bg-[#11131b]">
                                    Vui lòng nhập dữ liệu tháng trước khi sử dụng AI.
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
         </div>
      </main>

      {/* Mobile Bottom Tab Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0f1117]/95 backdrop-blur-md border-t border-gray-800 z-50 safe-area-bottom">
        <div className="flex justify-around items-center h-16">
          <button
            onClick={() => handleTabChange('input')}
            className={`flex flex-col items-center justify-center gap-1 flex-1 py-2 transition-colors ${
              currentTab === 'input' ? 'text-blue-400' : 'text-gray-500'
            }`}
          >
            <FileText size={20} />
            <span className="text-[10px] font-medium">Nhập liệu</span>
          </button>
          <button
            onClick={() => handleTabChange('pnl')}
            className={`flex flex-col items-center justify-center gap-1 flex-1 py-2 transition-colors ${
              currentTab === 'pnl' ? 'text-blue-400' : 'text-gray-500'
            }`}
          >
            <Table2 size={20} />
            <span className="text-[10px] font-medium">Bảng tính</span>
          </button>
          <button
            onClick={() => handleTabChange('dashboard')}
            className={`flex flex-col items-center justify-center gap-1 flex-1 py-2 transition-colors ${
              currentTab === 'dashboard' ? 'text-blue-400' : 'text-gray-500'
            }`}
          >
            <LayoutDashboard size={20} />
            <span className="text-[10px] font-medium">Tổng quan</span>
          </button>
          <button
            onClick={() => handleTabChange('ai')}
            className={`flex flex-col items-center justify-center gap-1 flex-1 py-2 transition-colors ${
              currentTab === 'ai' ? 'text-purple-400' : 'text-gray-500'
            }`}
          >
            <ChefHat size={20} />
            <span className="text-[10px] font-medium">AI Tư vấn</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default App;