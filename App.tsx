
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { User, UserRole } from './types';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import StudentHome from './pages/StudentHome';
import ParentHome from './pages/ParentHome';
import AdminDashboard from './pages/AdminDashboard';
import CardCollection from './pages/CardCollection';
import HealthBoardGame from './pages/HealthBoardGame';
import Shop from './pages/Shop';
import Inventory from './pages/Inventory';
import Friends from './pages/Friends';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [viewMode, setViewMode] = useState<'student' | 'parent' | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('khm_current_user');
    const savedMode = localStorage.getItem('khm_view_mode');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    if (savedMode) {
      setViewMode(savedMode as 'student' | 'parent');
    }
  }, []);

  const handleLogin = (u: User, mode?: 'student' | 'parent') => {
    setUser(u);
    localStorage.setItem('khm_current_user', JSON.stringify(u));
    if (mode) {
      setViewMode(mode);
      localStorage.setItem('khm_view_mode', mode);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setViewMode(null);
    localStorage.removeItem('khm_current_user');
    localStorage.removeItem('khm_view_mode');
  };

  return (
    <Router>
      <div className="min-h-screen flex bg-transparent overflow-x-hidden relative">
        {user && (
          <Sidebar 
            user={user} 
            viewMode={viewMode} 
            onLogout={handleLogout} 
          />
        )}
        
        <div className={`flex-grow flex flex-col min-w-0 transition-all duration-700 ${user ? 'lg:pl-[100px]' : ''}`}>
          {user && <Navbar user={user} viewMode={viewMode} onLogout={handleLogout} />}
          
          <main className={`flex-grow container mx-auto px-6 py-10 ${!user ? 'max-w-6xl' : ''}`}>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login onLogin={handleLogin} />} />
              <Route path="/register" element={<Register onLogin={handleLogin} />} />
              
              <Route 
                path="/home" 
                element={
                  user ? (
                    user.role === UserRole.ADMIN ? <Navigate to="/admin" /> : 
                    viewMode === 'parent' ? <ParentHome user={user} /> : <StudentHome user={user} />
                  ) : <Navigate to="/login" />
                } 
              />

              <Route 
                path="/cards" 
                element={user ? <CardCollection user={user} /> : <Navigate to="/login" />} 
              />

              <Route 
                path="/game" 
                element={user ? <HealthBoardGame user={user} /> : <Navigate to="/login" />} 
              />

              <Route 
                path="/shop" 
                element={user ? <Shop user={user} /> : <Navigate to="/login" />} 
              />

              <Route 
                path="/inventory" 
                element={user ? <Inventory user={user} /> : <Navigate to="/login" />} 
              />

              <Route 
                path="/friends" 
                element={user ? <Friends user={user} /> : <Navigate to="/login" />} 
              />
              
              <Route 
                path="/admin" 
                element={user && user.role === UserRole.ADMIN ? <AdminDashboard /> : <Navigate to="/login" />} 
              />
              <Route path="*" element={<Navigate to="/home" />} />
            </Routes>
          </main>
          
          <footer className="bg-white/60 backdrop-blur-md h-[60px] flex items-center justify-center px-4 text-[9px] md:text-[11px] text-slate-500 mt-auto border-t border-white/20 overflow-hidden shrink-0">
            <div className="flex items-center gap-3 md:gap-6 whitespace-nowrap">
              <div className="hidden sm:flex items-center gap-2 opacity-60 font-black">
                <span className="text-blue-600">#AI_EDUTECH</span>
                <span className="text-pink-600">#WELLBEING</span>
                <span className="text-emerald-600">#RESEARCH</span>
              </div>
              <div className="hidden sm:block h-3 w-[1px] bg-slate-300"></div>
              <p className="font-black tracking-tight uppercase leading-none">
                KidsHealthyMe v1.5 | HealthyMe : นวัตกรรมเกมสุขภาพเพื่อเสริมสร้างความรอบรู้และปรับเปลี่ยนพฤติกรรมสุขภาพที่พึงประสงค์ของนักเรียนวัยเรียน
              </p>
            </div>
          </footer>
        </div>
      </div>
    </Router>
  );
};

export default App;
