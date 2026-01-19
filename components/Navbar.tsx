
import React from 'react';
import { User, UserRole } from '../types';
import { Bell, Award, Heart, Sparkles, Shield, Trophy } from 'lucide-react';

interface NavbarProps {
  user: User;
  viewMode?: 'student' | 'parent' | null;
  onLogout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ user, viewMode, onLogout }) => {
  return (
    <nav className="px-6 md:px-10 py-6 flex flex-col md:flex-row justify-between items-center sticky top-0 z-[40] bg-transparent gap-4">
      {/* Brand & Heroic Tagline Section */}
      <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8 w-full md:w-auto">
        {/* Title Group */}
        <div className="flex items-center gap-3 bg-white/60 backdrop-blur-md px-5 py-2.5 rounded-2xl border border-white shadow-sm">
          <div className={`p-2 rounded-xl ${viewMode === 'parent' ? 'bg-pink-100 text-pink-500' : user.role === UserRole.ADMIN ? 'bg-emerald-100 text-emerald-500' : 'bg-blue-100 text-blue-500'}`}>
            {viewMode === 'parent' ? <Heart size={18} /> : user.role === UserRole.ADMIN ? <Shield size={18} /> : <Trophy size={18} />}
          </div>
          <h2 className="font-black text-slate-800 text-sm md:text-base tracking-tight leading-none whitespace-nowrap">
            {viewMode === 'parent' ? 'Family Insights' : user.role === UserRole.ADMIN ? 'Research Control' : 'Hero Journey'}
          </h2>
        </div>

        {/* SINGLE ROW TAGLINE - BOLD & HEROIC */}
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="hidden lg:block h-[2px] w-8 bg-gradient-to-r from-blue-500/30 to-transparent rounded-full"></div>
          <p className="text-base md:text-lg font-black italic tracking-wide whitespace-nowrap text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-400 drop-shadow-sm">
            สุขภาพที่ดี เริ่มต้นที่ความสนุก!
          </p>
        </div>
      </div>
      
      {/* Action Stats */}
      <div className="flex items-center gap-4">
        <div className="hidden sm:flex bg-white/60 backdrop-blur-xl border border-white/80 px-6 py-2.5 rounded-[1.5rem] shadow-sm items-center gap-5">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Village Active</span>
          </div>
          <div className="h-4 w-[1px] bg-slate-200"></div>
          <div className="flex items-center gap-2 text-indigo-600">
            <Sparkles size={12} className="animate-spin" style={{ animationDuration: '4s' }} />
            <span className="text-[10px] font-black uppercase tracking-widest">AI Synchronized</span>
          </div>
        </div>

        <button className="p-3.5 bg-white shadow-md border border-slate-50 rounded-2xl text-slate-400 hover:text-blue-500 transition-all relative group active:scale-90">
          <Bell size={20} />
          <span className="absolute top-3 right-3 w-2 h-2 bg-rose-500 rounded-full border-2 border-white group-hover:animate-ping"></span>
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
