
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { User, UserRole } from './types';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import StudentHome from './pages/StudentHome';
import ParentHome from './pages/ParentHome';
import AdminDashboard from './pages/AdminDashboard';
import Navbar from './components/Navbar';

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
      <div className="min-h-screen flex flex-col bg-transparent">
        {user && <Navbar user={user} viewMode={viewMode} onLogout={handleLogout} />}
        <main className="flex-grow container mx-auto px-4 py-6">
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
              path="/admin" 
              element={user && user.role === UserRole.ADMIN ? <AdminDashboard /> : <Navigate to="/login" />} 
            />
          </Routes>
        </main>
        
        <footer className="bg-white/60 backdrop-blur-md p-6 text-center text-xs text-slate-500 mt-auto border-t border-white/20">
          <div className="flex justify-center gap-4 mb-2">
            <span className="bg-blue-100/50 text-blue-600 px-2 py-1 rounded">#EduTech</span>
            <span className="bg-pink-100/50 text-pink-600 px-2 py-1 rounded">#KidsHealth</span>
            <span className="bg-emerald-100/50 text-emerald-600 px-2 py-1 rounded">#SEL</span>
          </div>
          <p className="font-bold drop-shadow-sm">KidsHealthyMe v1.2 | นวัตกรรมเพื่อการวิจัยเทคโนโลยีการศึกษา</p>
        </footer>
      </div>
    </Router>
  );
};

export default App;
