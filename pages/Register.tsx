
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { dbService } from '../services/dbService';
import { User } from '../types';
import Swal from 'sweetalert2';

interface RegisterProps {
  onLogin: (user: User) => void;
}

const Register: React.FC<RegisterProps> = ({ onLogin }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    fullname: '',
    class: 'ป.1',
    room: '1',
    number: '',
    gender: 'ชาย'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    Swal.fire({
      title: 'กำลังสร้างตัวละครใหม่...',
      text: 'กรุณารอสักครู่เพื่อเชื่อมต่อกับหมู่บ้านสุขภาพ',
      allowOutsideClick: false,
      showConfirmButton: false,
      willOpen: () => {
        Swal.showLoading();
      }
    });
    
    try {
      const newUser = await dbService.register(formData);
      
      Swal.fire({
        title: 'ยินดีต้อนรับฮีโร่ใหม่!',
        text: 'สมัครสมาชิกสำเร็จแล้ว ไปเริ่มสะสมพลังกันเลย',
        icon: 'success',
        confirmButtonText: 'ลุยเลย! 🚀',
        confirmButtonColor: '#06b6d4',
      });

      onLogin(newUser);
      navigate('/home');
    } catch (err: any) {
      Swal.fire({
        title: 'อ๊ะ! เกิดข้อผิดพลาด',
        text: err.message || "ไม่สามารถเชื่อมต่อ Google Sheets ได้ในขณะนี้",
        icon: 'error',
        confirmButtonText: 'ตกลง',
        confirmButtonColor: '#ef4444',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8 bg-white rounded-[3rem] shadow-xl border-8 border-white">
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg p-2 border border-slate-50">
          <img 
            src="https://img5.pic.in.th/file/secure-sv1/-4c31bfe664e96786c.png" 
            alt="KidsHealthyMe Logo" 
            className="w-full h-full object-contain"
          />
        </div>
        <h1 className="text-3xl font-black text-cyan-600">สมัครสมาชิก KidsHealthyMe</h1>
        <p className="text-slate-500 mt-2 font-medium">เริ่มต้นการดูแลสุขภาพแสนสนุกไปพร้อมกัน</p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="col-span-full md:col-span-1">
          <label className="block text-sm font-black text-slate-700 mb-2">ชื่อ-นามสกุล</label>
          <input
            type="text"
            className="w-full px-5 py-4 rounded-2xl border-2 border-slate-100 focus:ring-4 focus:ring-cyan-100 outline-none font-medium transition-all"
            value={formData.fullname}
            onChange={(e) => setFormData({...formData, fullname: e.target.value})}
            required
            disabled={loading}
          />
        </div>
        
        <div>
          <label className="block text-sm font-black text-slate-700 mb-2">เพศ</label>
          <select 
             className="w-full px-5 py-4 rounded-2xl border-2 border-slate-100 outline-none font-medium"
             value={formData.gender}
             onChange={(e) => setFormData({...formData, gender: e.target.value})}
             disabled={loading}
          >
            <option>ชาย</option>
            <option>หญิง</option>
            <option>อื่นๆ</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-black text-slate-700 mb-2">ชั้นปี</label>
          <select 
             className="w-full px-5 py-4 rounded-2xl border-2 border-slate-100 outline-none font-medium"
             value={formData.class}
             onChange={(e) => setFormData({...formData, class: e.target.value})}
             disabled={loading}
          >
            <option>ป.1</option><option>ป.2</option><option>ป.3</option>
            <option>ป.4</option><option>ป.5</option><option>ป.6</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-black text-slate-700 mb-2">ห้อง</label>
          <input
            type="text"
            placeholder="1"
            className="w-full px-5 py-4 rounded-2xl border-2 border-slate-100 focus:ring-4 focus:ring-cyan-100 outline-none font-medium transition-all"
            value={formData.room}
            onChange={(e) => setFormData({...formData, room: e.target.value})}
            required
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm font-black text-slate-700 mb-2">เลขที่</label>
          <input
            type="number"
            placeholder="12"
            className="w-full px-5 py-4 rounded-2xl border-2 border-slate-100 focus:ring-4 focus:ring-cyan-100 outline-none font-medium transition-all"
            value={formData.number}
            onChange={(e) => setFormData({...formData, number: e.target.value})}
            required
            disabled={loading}
          />
        </div>

        <div className="col-span-full border-t border-slate-100 pt-6 mt-2">
          <h3 className="font-black text-slate-700 mb-4 text-center uppercase tracking-widest text-xs">ข้อมูลการเข้าใช้</h3>
        </div>

        <div>
          <label className="block text-sm font-black text-slate-700 mb-2">ชื่อผู้ใช้ (Username)</label>
          <input
            type="text"
            className="w-full px-5 py-4 rounded-2xl border-2 border-slate-100 focus:ring-4 focus:ring-blue-100 outline-none font-medium transition-all"
            value={formData.username}
            onChange={(e) => setFormData({...formData, username: e.target.value})}
            required
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm font-black text-slate-700 mb-2">รหัสผ่าน (Password)</label>
          <input
            type="password"
            className="w-full px-5 py-4 rounded-2xl border-2 border-slate-100 focus:ring-4 focus:ring-blue-100 outline-none font-medium transition-all"
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            required
            disabled={loading}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`col-span-full mt-6 ${loading ? 'bg-slate-300' : 'bg-cyan-500 hover:bg-cyan-600'} text-white font-black py-5 rounded-[2rem] shadow-xl transition-all active:scale-[0.98] flex justify-center items-center gap-2`}
        >
          {loading ? 'กำลังเชื่อมต่อ...' : 'สมัครสมาชิกและเริ่มบันทึก! ✨'}
        </button>
      </form>

      <p className="mt-8 text-center text-slate-500 font-medium">
        มีบัญชีอยู่แล้ว? <Link to="/login" className="text-cyan-500 font-black hover:underline">เข้าสู่ระบบตรงนี้</Link>
      </p>
    </div>
  );
};

export default Register;
