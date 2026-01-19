
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
import Shop from './pages/Shop';
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
                path="/shop" 
                element={user ? <Shop user={user} /> : <Navigate to="/login" />} 
              />
              
              <Route 
                path="/admin" 
                element={user && user.role === UserRole.ADMIN ? <AdminDashboard /> : <Navigate to="/login" />} 
              />
              <Route path="*" element={<Navigate to="/home" />} />
            </Routes>
          </main>
          
          <footer className="bg-white/40 backdrop-blur-md p-10 text-center text-[11px] text-slate-400 mt-auto border-t border-white/20">
            <div className="flex justify-center gap-8 mb-6 opacity-60 grayscale hover:grayscale-0 transition-all">
              <span className="bg-blue-100 text-blue-600 px-4 py-1.5 rounded-full font-black">#AI_EDUTECH</span>
              <span className="bg-pink-100 text-pink-600 px-4 py-1.5 rounded-full font-black">#WELLBEING</span>
              <span className="bg-emerald-100 text-emerald-600 px-4 py-1.5 rounded-full font-black">#RESEARCH</span>
            </div>
            <p className="font-black tracking-[0.3em] uppercase">KidsHealthyMe v1.5 | Designed for Science & Happiness</p>
          </footer>
        </div>
      </div>
    </Router>
  );
};

export default App;
