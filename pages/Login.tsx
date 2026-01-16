
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { dbService } from '../services/dbService';
import { User } from '../types';
import { Wifi, WifiOff, Loader2, RefreshCw, AlertCircle, ExternalLink, HelpCircle, ShieldAlert, Key } from 'lucide-react';
import Swal from 'sweetalert2';

interface LoginProps {
  onLogin: (user: User, mode?: 'student' | 'parent') => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [checkingConn, setCheckingConn] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  const queryParams = new URLSearchParams(location.search);
  const initialMode = queryParams.get('mode') as 'student' | 'parent' | 'admin' | null;
  const [mode, setMode] = useState<'student' | 'parent' | 'admin'>(initialMode || 'student');

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    setCheckingConn(true);
    setError('');
    const status = await dbService.checkConnection();
    setIsConnected(status);
    setCheckingConn(false);
  };

  const showTroubleshoot = () => {
    Swal.fire({
      title: 'คู่มือแก้ปัญหาการเชื่อมต่อ',
      html: `
        <div class="text-left text-sm space-y-4">
          <div class="bg-blue-50 p-4 rounded-2xl border border-blue-100">
            <p class="font-bold text-blue-700 mb-2">1. ปิด Ad-blocker หรือใช้เบราว์เซอร์อื่น</p>
            <p class="text-[11px] text-blue-600">เบราว์เซอร์อย่าง Brave หรือส่วนขยาย uBlock มักจะบล็อกบริการของ Google Apps Script อัตโนมัติ</p>
          </div>
          <div class="bg-amber-50 p-4 rounded-2xl border border-amber-100">
            <p class="font-bold text-amber-700 mb-2">2. เปิดหน้าเว็บสคริปต์ตรงๆ เพื่อกู้คืนสิทธิ์</p>
            <p class="text-[11px] text-amber-600">กดลิงก์ "เปิดลิงก์ตรวจสอบ" และหากเห็นข้อความ Authorization Required ให้กดปุ่มที่ Google แนะนำจนจบ</p>
          </div>
          <div class="bg-rose-50 p-4 rounded-2xl border border-rose-100">
            <p class="font-bold text-rose-700 mb-2">3. อย่าใช้โหมดไม่ระบุตัวตน (Incognito)</p>
            <p class="text-[11px] text-rose-600">โหมดนี้จะปิดกั้นการทำงานของ Third-party Scripts โดยพื้นฐาน</p>
          </div>
        </div>
      `,
      icon: 'info',
      confirmButtonText: 'รับทราบ',
      footer: `<a href="${dbService.getWebAppUrl()}" target="_blank" style="color: #3b82f6; font-weight: bold; font-size: 12px;">🔗 เปิดหน้า Google Script คลิกตรงนี้</a>`
    });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (username === 'admin' && password === '1722') {
        const adminUser = { id: 'admin', username: 'admin', fullname: 'ผู้ดูแลระบบ', role: 'admin' as any };
        onLogin(adminUser as User);
        navigate('/admin');
        return;
      }

      const user = await dbService.login(username, password);
      if (user) {
        onLogin(user, mode === 'parent' ? 'parent' : 'student');
        navigate('/home');
      } else {
        setError('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
      }
    } catch (err: any) {
      const msg = err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์';
      setError(msg);
      
      Swal.fire({
        title: 'การเชื่อมต่อถูกขัดขวาง!',
        html: `
          <div class="text-left text-sm space-y-3">
            <p class="font-bold text-red-500">บราวเซอร์บล็อกการรับข้อมูลจาก Google Script</p>
            <p class="text-[10px] text-slate-400 font-mono bg-slate-100 p-2 rounded">Code: ${err.name || 'ScriptBlocked'}</p>
            <div class="bg-blue-50 p-3 rounded-xl border border-blue-200 text-[11px] leading-relaxed">
              <strong>วิธีแก้ทันที:</strong><br/>
              1. ปิด Ad-blocker (uBlock, AdGuard)<br/>
              2. กดปุ่มด้านล่างเพื่อยืนยันสิทธิ์กับ Google
            </div>
          </div>
        `,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'เปิดลิงก์ตรวจสอบ',
        cancelButtonText: 'ยกเลิก',
        confirmButtonColor: '#3b82f6',
      }).then((result) => {
        if (result.isConfirmed) {
          window.open(dbService.getWebAppUrl(), '_blank');
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const modeThemes = {
    student: { color: "blue", title: "นักเรียนเข้าสู่ระบบ" },
    parent: { color: "pink", title: "ผู้ปกครองเข้าสู่ระบบ" },
    admin: { color: "emerald", title: "ผู้ดูแลเข้าสู่ระบบ" },
  };

  const currentTheme = modeThemes[mode];

  return (
    <div className="max-w-md mx-auto mt-10 p-8 bg-white rounded-[3rem] shadow-2xl border-8 border-white relative overflow-hidden">
      {/* Background Decor */}
      <div className={`absolute -top-10 -right-10 w-32 h-32 bg-${currentTheme.color === 'emerald' ? 'emerald' : currentTheme.color === 'pink' ? 'pink' : 'blue'}-50 rounded-full opacity-50`}></div>

      {/* Connection Indicator */}
      <div className="absolute top-6 right-6 flex items-center gap-2">
        <button onClick={showTroubleshoot} className="p-1.5 text-slate-300 hover:text-blue-400 transition-colors" title="วิธีแก้ปัญหา">
          <HelpCircle size={20} />
        </button>
        {checkingConn ? (
          <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-full border border-slate-100">
            <Loader2 className="animate-spin text-slate-300" size={12} />
          </div>
        ) : isConnected === true ? (
          <div className="flex items-center gap-1.5 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100">
            <Wifi className="text-emerald-500" size={12} />
            <span className="text-[10px] font-black text-emerald-600 uppercase">Online</span>
          </div>
        ) : (
          <button 
            onClick={checkConnection} 
            className="flex items-center gap-1.5 bg-rose-50 px-2 py-1 rounded-full border border-rose-100 hover:bg-rose-100 transition-colors"
          >
            <ShieldAlert className="text-rose-500" size={12} />
            <span className="text-[10px] font-black text-rose-600 uppercase">Blocked</span>
            <RefreshCw size={10} className="text-rose-400" />
          </button>
        )}
      </div>

      <div className="text-center mb-8 relative z-10">
        <div className="w-24 h-24 bg-white rounded-[2.5rem] flex items-center justify-center mx-auto mb-4 animate-bounce shadow-xl p-2 border-4 border-slate-50">
          <img 
            src="https://img5.pic.in.th/file/secure-sv1/-4c31bfe664e96786c.png" 
            alt="KidsHealthyMe Logo" 
            className="w-full h-full object-contain"
          />
        </div>
        <h1 className={`text-3xl font-black text-${currentTheme.color === 'pink' ? 'pink' : currentTheme.color === 'emerald' ? 'emerald' : 'blue'}-600`}>{currentTheme.title}</h1>
      </div>

      <div className="flex bg-slate-100 p-1 rounded-2xl mb-8 relative z-10">
        <button onClick={() => setMode('student')} className={`flex-1 py-2 text-xs font-black rounded-xl transition-all ${mode === 'student' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400'}`}>นักเรียน</button>
        <button onClick={() => setMode('parent')} className={`flex-1 py-2 text-xs font-black rounded-xl transition-all ${mode === 'parent' ? 'bg-white shadow-sm text-pink-600' : 'text-slate-400'}`}>ผู้ปกครอง</button>
      </div>

      <form onSubmit={handleLogin} className="space-y-6 relative z-10">
        <div>
          <label className="block text-sm font-black text-slate-700 mb-2">ชื่อผู้ใช้ (Username)</label>
          <input
            type="text"
            className="w-full px-5 py-4 rounded-2xl border-2 border-slate-100 focus:ring-4 focus:ring-blue-100 outline-none font-medium transition-all"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            disabled={loading}
          />
        </div>
        <div>
          <label className="block text-sm font-black text-slate-700 mb-2">รหัสผ่าน (Password)</label>
          <input
            type="password"
            className="w-full px-5 py-4 rounded-2xl border-2 border-slate-100 focus:ring-4 focus:ring-blue-100 outline-none font-medium transition-all"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
          />
        </div>

        {error && (
          <div className="bg-red-50 border-2 border-red-100 p-4 rounded-2xl space-y-2 animate-in slide-in-from-top-2">
            <p className="text-red-500 text-[10px] font-bold leading-tight">{error}</p>
            {error.includes('Blocked') && (
              <div className="flex gap-2">
                 <a href={dbService.getWebAppUrl()} target="_blank" className="flex items-center gap-1 text-[9px] font-black text-blue-600 bg-white px-2 py-1 rounded-lg border border-blue-100 shadow-sm hover:bg-blue-50">
                   <Key size={10} /> รีเซ็ตสิทธิ์ (Authorize)
                 </a>
                 <button type="button" onClick={showTroubleshoot} className="flex items-center gap-1 text-[9px] font-black text-slate-600 bg-white px-2 py-1 rounded-lg border border-slate-100 shadow-sm hover:bg-slate-50">
                   <HelpCircle size={10} /> คู่มือช่วยเหลือ
                 </button>
              </div>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || isConnected === false}
          className={`w-full ${mode === 'parent' ? 'bg-pink-500' : mode === 'admin' ? 'bg-emerald-500' : 'bg-blue-500'} text-white font-black py-4 rounded-2xl shadow-lg transition-all disabled:opacity-50 active:scale-95 flex items-center justify-center gap-2`}
        >
          {loading ? (
            <Loader2 className="animate-spin" size={20} />
          ) : isConnected === false ? (
            'การเชื่อมต่อถูกบล็อก 🚫'
          ) : (
            'เข้าสู่หมู่บ้านเลย! 🚀'
          )}
        </button>
      </form>

      <div className="mt-8 pt-6 border-t border-slate-100 text-center relative z-10">
        <p className="text-slate-500 font-medium text-sm">ยังไม่มีบัญชี? <Link to="/register" className="text-blue-500 font-black hover:underline">สร้างบัญชีใหม่</Link></p>
      </div>
    </div>
  );
};

export default Login;
