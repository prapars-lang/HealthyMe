
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { dbService } from '../services/dbService';
import { User } from '../types';
import { Wifi, WifiOff, Loader2, RefreshCw, HelpCircle, ShieldAlert, Key } from 'lucide-react';
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
    const status = await dbService.checkConnection();
    setIsConnected(status);
    setCheckingConn(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      // Admin Hardcoded Bypass
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
        setError('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง');
      }
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ Firebase');
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
      <div className="absolute top-6 right-6 flex items-center gap-2">
        {checkingConn ? (
          <Loader2 className="animate-spin text-slate-300" size={16} />
        ) : isConnected === true ? (
          <div className="flex items-center gap-1.5 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100">
            <Wifi className="text-emerald-500" size={12} />
            <span className="text-[10px] font-black text-emerald-600 uppercase">Firebase Online</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 bg-rose-50 px-2 py-1 rounded-full border border-rose-100">
            <WifiOff className="text-rose-500" size={12} />
            <span className="text-[10px] font-black text-rose-600 uppercase">Offline</span>
          </div>
        )}
      </div>

      <div className="text-center mb-8">
        <div className="w-24 h-24 bg-white rounded-[2.5rem] flex items-center justify-center mx-auto mb-4 shadow-xl p-2 border-4 border-slate-50">
          <img src="https://img5.pic.in.th/file/secure-sv1/-4c31bfe664e96786c.png" alt="Logo" className="w-full h-full object-contain" />
        </div>
        <h1 className={`text-3xl font-black text-${currentTheme.color === 'pink' ? 'pink' : currentTheme.color === 'emerald' ? 'emerald' : 'blue'}-600`}>{currentTheme.title}</h1>
      </div>

      <div className="flex bg-slate-100 p-1 rounded-2xl mb-8">
        <button onClick={() => setMode('student')} className={`flex-1 py-2 text-xs font-black rounded-xl transition-all ${mode === 'student' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400'}`}>นักเรียน</button>
        <button onClick={() => setMode('parent')} className={`flex-1 py-2 text-xs font-black rounded-xl transition-all ${mode === 'parent' ? 'bg-white shadow-sm text-pink-600' : 'text-slate-400'}`}>ผู้ปกครอง</button>
      </div>

      <form onSubmit={handleLogin} className="space-y-6">
        <div>
          <label className="block text-sm font-black text-slate-700 mb-2">ชื่อผู้ใช้ (Username)</label>
          <input
            type="text"
            className="w-full px-5 py-4 rounded-2xl border-2 border-slate-100 outline-none font-medium transition-all"
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
            className="w-full px-5 py-4 rounded-2xl border-2 border-slate-100 outline-none font-medium transition-all"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
          />
        </div>

        {error && (
          <div className="bg-red-50 border-2 border-red-100 p-4 rounded-2xl">
            <p className="text-red-500 text-[10px] font-bold">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || isConnected === false}
          className={`w-full ${mode === 'parent' ? 'bg-pink-500' : mode === 'admin' ? 'bg-emerald-500' : 'bg-blue-500'} text-white font-black py-4 rounded-2xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2`}
        >
          {loading ? <Loader2 className="animate-spin" /> : 'เข้าสู่หมู่บ้านเลย! 🚀'}
        </button>
      </form>

      <div className="mt-8 text-center">
        <p className="text-slate-500 font-medium text-sm">ยังไม่มีบัญชี? <Link to="/register" className="text-blue-500 font-black hover:underline">สร้างบัญชีใหม่</Link></p>
      </div>
    </div>
  );
};

export default Login;
