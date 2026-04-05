import React, { useState } from 'react';
import { ShieldCheck, Mail, KeyRound, Loader2, ChefHat } from 'lucide-react';

interface LoginPageProps {
  onLogin: (email: string) => void;
}

const ACCESS_CODE = 'Kien-MAMMAM-Berlin';

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Vui lòng nhập địa chỉ email hợp lệ.');
      triggerShake();
      return;
    }

    // Validate access code
    if (code !== ACCESS_CODE) {
      setError('Mã truy cập không đúng. Vui lòng kiểm tra lại.');
      triggerShake();
      return;
    }

    setLoading(true);

    // Gửi log đăng nhập (fire-and-forget, không block user)
    fetch('/api/log-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
      }),
    }).catch(() => {}); // Bỏ qua lỗi - không ảnh hưởng đăng nhập

    // Simulate brief loading for premium feel
    await new Promise(resolve => setTimeout(resolve, 800));
    onLogin(email);
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  return (
    <div className="min-h-screen bg-[#0a0c14] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-blue-600/8 via-transparent to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }}></div>
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-purple-600/8 via-transparent to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s' }}></div>
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-gradient-to-bl from-indigo-500/5 via-transparent to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s' }}></div>
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
        backgroundSize: '60px 60px'
      }}></div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo & Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/20 mb-6 shadow-lg shadow-blue-500/10">
            <ChefHat size={40} className="text-blue-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
            Quản lý Nhà hàng
          </h1>
          <p className="text-gray-400 text-sm">
            DE Gastronomy Controller • Kiên MAMMAM Berlin
          </p>
        </div>

        {/* Login Card */}
        <div className={`bg-[#11131b]/80 backdrop-blur-xl rounded-2xl border border-gray-800/60 p-8 shadow-2xl shadow-black/40 transition-transform ${shake ? 'animate-shake' : ''}`}>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <ShieldCheck size={22} className="text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-100">Đăng nhập</h2>
              <p className="text-xs text-gray-500">Nhập thông tin để truy cập hệ thống</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label htmlFor="login-email" className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(null); }}
                  placeholder="your@email.com"
                  className="w-full bg-[#0d0f17] border border-gray-700/60 rounded-xl py-3 pl-11 pr-4 text-gray-100 placeholder-gray-600 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 transition-all text-sm"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Access Code */}
            <div>
              <label htmlFor="login-code" className="block text-sm font-medium text-gray-300 mb-2">
                Mã truy cập
              </label>
              <div className="relative">
                <KeyRound size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  id="login-code"
                  type="text"
                  value={code}
                  onChange={(e) => { setCode(e.target.value); setError(null); }}
                  placeholder="Nhập mã truy cập..."
                  className="w-full bg-[#0d0f17] border border-gray-700/60 rounded-xl py-3 pl-11 pr-4 text-gray-100 placeholder-gray-600 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 transition-all text-sm"
                  required
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm flex items-center gap-2 animate-fadeIn">
                <ShieldCheck size={16} className="flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-blue-600/20 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Đang xác thực...
                </>
              ) : (
                'Truy cập hệ thống'
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-xs text-gray-600">
            🔒 Dữ liệu được lưu cục bộ trên trình duyệt. Không tải lên máy chủ.
          </p>
        </div>
      </div>

      {/* Shake animation */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default LoginPage;
