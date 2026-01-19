
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, ShoppingBag, Briefcase, BookOpen, Brain, 
  Users, LayoutDashboard, FileText, Settings, 
  LogOut, Menu, X, Heart, Shield, Layers, Activity,
  Database, ChevronRight, User as UserIcon
} from 'lucide-react';
import { User, UserRole } from '../types';

interface SidebarProps {
  user: User;
  viewMode: 'student' | 'parent' | null;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ user, viewMode, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const isAdmin = user.role === UserRole.ADMIN;
  const isParent = viewMode === 'parent';

  const menuItems = {
    student: [
      { path: '/home', label: 'แดชบอร์ด', icon: <Home size={22} />, color: 'text-blue-500' },
      { path: '/cards', label: 'สมุดสะสมการ์ด', icon: <Layers size={22} />, color: 'text-purple-500' },
      { path: '/shop', label: 'ร้านค้าฮีโร่', icon: <ShoppingBag size={22} />, color: 'text-amber-500' },
      { path: '/inventory', label: 'ไอเทมของฉัน', icon: <Briefcase size={22} />, color: 'text-indigo-500' },
      { path: '/friends', label: 'เพื่อนร่วมทาง', icon: <Users size={22} />, color: 'text-emerald-500' },
    ],
    parent: [
      { path: '/home', label: 'กราฟสุขภาพ', icon: <LayoutDashboard size={22} />, color: 'text-pink-500' },
      { path: '/reports', label: 'ประวัติย้อนหลัง', icon: <FileText size={22} />, color: 'text-rose-500' },
      { path: '/ai-coach', label: 'ปรึกษา AI', icon: <Heart size={22} />, color: 'text-pink-600' },
    ],
    admin: [
      { path: '/admin', label: 'ภาพรวมวิจัย', icon: <Activity size={22} />, color: 'text-emerald-500' },
      { path: '/admin?tab=research', label: 'Big Data', icon: <Database size={22} />, color: 'text-blue-500' },
      { path: '/admin?tab=shop', label: 'คลังสินค้า', icon: <ShoppingBag size={22} />, color: 'text-amber-500' },
      { path: '/admin?tab=system', label: 'จัดการระบบ', icon: <Settings size={22} />, color: 'text-indigo-500' },
    ]
  };

  const activeMenu = isAdmin ? menuItems.admin : isParent ? menuItems.parent : menuItems.student;

  const NavLink: React.FC<{ item: any; isMobile?: boolean }> = ({ item, isMobile = false }) => {
    const isActive = location.pathname === item.path || (location.pathname + location.search) === item.path;
    const activeColor = isAdmin ? 'bg-emerald-500' : isParent ? 'bg-pink-500' : 'bg-blue-600';
    
    return (
      <Link
        to={item.path}
        onClick={() => setIsOpen(false)}
        className={`group relative flex items-center transition-all duration-500 active:scale-95 ${
          isMobile 
            ? 'w-full gap-5 px-7 py-5 rounded-[2.2rem]' 
            : 'w-14 h-14 justify-center rounded-2xl'
        } ${
          isActive 
            ? `${activeColor} text-white shadow-xl shadow-black/10`
            : 'text-slate-400 hover:bg-white/90 hover:text-slate-800'
        }`}
      >
        <div className={`${isActive ? 'text-white' : item.color} group-hover:scale-110 transition-transform flex-shrink-0`}>
          {item.icon}
        </div>

        {isMobile && (
          <span className="font-black text-base tracking-tight flex-grow">{item.label}</span>
        )}
        
        {isMobile && isActive && (
          <ChevronRight size={20} className="opacity-50" />
        )}
        
        {!isMobile && (
          <div className="absolute left-20 px-4 py-2.5 bg-slate-900/95 backdrop-blur-md text-white text-[10px] font-black rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-[100] shadow-2xl translate-x-[-15px] group-hover:translate-x-0">
            {item.label}
            <div className="absolute left-[-4px] top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-slate-900 rotate-45"></div>
          </div>
        )}
      </Link>
    );
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className={`lg:hidden fixed bottom-10 right-8 z-[100] p-6 rounded-[2.5rem] shadow-2xl border-4 border-white transition-all active:scale-90 flex items-center gap-3 group overflow-hidden ${
          isAdmin ? 'bg-emerald-500' : isParent ? 'bg-pink-500' : 'bg-blue-600'
        } text-white`}
      >
        <Menu size={28} strokeWidth={3} className="group-hover:rotate-12 transition-transform" />
        <span className="font-black text-xs uppercase tracking-[0.2em]">เมนู</span>
      </button>

      <div 
        className={`lg:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[110] transition-opacity duration-700 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsOpen(false)}
      />

      <aside className={`lg:hidden fixed top-0 left-0 h-screen w-[320px] bg-white/95 backdrop-blur-3xl z-[120] transition-transform duration-700 border-r-4 border-white shadow-2xl rounded-r-[4rem] p-8 flex flex-col ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-white rounded-2xl p-2 shadow-lg border border-slate-50">
                <img src="https://img5.pic.in.th/file/secure-sv1/-4c31bfe664e96786c.png" alt="Logo" className="w-full h-full object-contain" />
             </div>
             <div>
               <h3 className="font-black text-slate-800 text-xl tracking-tighter">KidsHealthy</h3>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Village Edition</p>
             </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="p-3 bg-slate-100 text-slate-400 rounded-2xl">
            <X size={24} />
          </button>
        </div>

        <nav className="flex-grow space-y-3 overflow-y-auto no-scrollbar pr-2">
           {activeMenu.map((item, idx) => (
             <NavLink key={idx} item={item} isMobile={true} />
           ))}
        </nav>

        <div className="mt-8 pt-8 border-t-2 border-slate-100 space-y-5">
           <button 
             onClick={onLogout}
             className="w-full py-5 rounded-[2.2rem] bg-rose-50 text-rose-500 font-black text-sm flex items-center justify-center gap-3 shadow-sm"
           >
             <LogOut size={22} /> ออกจากหมู่บ้าน
           </button>
        </div>
      </aside>

      <aside className="hidden lg:flex fixed top-0 left-0 h-screen w-[100px] z-[90] items-center justify-center pointer-events-none">
        <div className="h-[94%] w-18 bg-white/45 backdrop-blur-2xl border-2 border-white/70 shadow-[0_15px_50px_rgba(0,0,0,0.08)] rounded-[3.5rem] flex flex-col items-center py-10 pointer-events-auto relative">
          <Link to="/" className="mb-14 w-14 h-14 bg-white rounded-2xl p-2.5 shadow-md border border-white hover:rotate-12 hover:scale-110 transition-all group">
            <img src="https://img5.pic.in.th/file/secure-sv1/-4c31bfe664e96786c.png" alt="Logo" className="w-full h-full object-contain" />
          </Link>
          <nav className="flex-grow flex flex-col gap-6 overflow-y-auto no-scrollbar items-center w-full px-3">
            {activeMenu.map((item, idx) => (
              <NavLink key={idx} item={item} />
            ))}
          </nav>
          <div className="mt-auto flex flex-col items-center gap-6 pt-8 border-t border-white/50 w-full">
            <button 
              onClick={onLogout}
              className="p-4 rounded-2xl text-rose-500 hover:bg-rose-50 transition-all active:scale-90 group"
              title="ออกจากหมู่บ้าน"
            >
              <LogOut size={24} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
