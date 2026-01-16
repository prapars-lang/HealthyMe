
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout, Heart, Shield, GraduationCap, ArrowRight, Star, Sparkles } from 'lucide-react';

const Landing: React.FC = () => {
  const navigate = useNavigate();

  const features = [
    {
      role: "นักเรียน",
      title: "เล่นสนุก สะสมพลังสุขภาพ",
      desc: "บันทึกก้าวเดิน กินผัก นอนหลับ เพื่อเพิ่มเลเวลอวตารและสุ่มรับไอเทมสุดเจ๋ง!",
      icon: "🧑‍🚀",
      color: "from-blue-400 to-cyan-400",
      btnText: "เข้าสู่หมู่บ้านสุขภาพ",
      action: () => navigate('/login?mode=student')
    },
    {
      role: "ผู้ปกครอง",
      title: "ติดตามการเติบโตของลูกรัก",
      desc: "ดูรายงานสุขภาพแนวโน้มรายสัปดาห์ และรับคำแนะนำจาก AI Coach ในการดูแลลูก",
      icon: "💖",
      color: "from-pink-400 to-rose-400",
      btnText: "ดูแลสุขภาพลูก",
      action: () => navigate('/login?mode=parent')
    },
    {
      role: "คุณครู / นักวิจัย",
      title: "ฐานข้อมูลเพื่อการวิจัย",
      desc: "วิเคราะห์พฤติกรรมสุขภาพระดับชั้นเรียน และติดตามความฉลาดทางอารมณ์ (SEL)",
      icon: "🏫",
      color: "from-emerald-400 to-teal-500",
      btnText: "แดชบอร์ดจัดการ",
      action: () => navigate('/login?mode=admin')
    }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-16 py-10 px-4">
      {/* Hero Section */}
      <section className="text-center space-y-6">
        <div className="w-32 h-32 bg-white rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-2xl p-3 border-4 border-slate-50 transform hover:scale-110 transition-transform">
          <img 
            src="https://img5.pic.in.th/file/secure-sv1/-4c31bfe664e96786c.png" 
            alt="KidsHealthyMe Logo" 
            className="w-full h-full object-contain"
          />
        </div>
        <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-blue-100 animate-bounce">
          <Sparkles className="text-yellow-400" size={18} />
          <span className="text-blue-600 font-bold text-sm">ยินดีต้อนรับสู่ KidsHealthyMe</span>
        </div>
        <h1 className="text-5xl md:text-7xl font-black text-slate-800 tracking-tight leading-tight">
          สุขภาพที่ดี <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500">
            เริ่มต้นที่ความสนุก!
          </span>
        </h1>
        <p className="text-slate-500 text-lg md:text-xl max-w-2xl mx-auto font-medium">
          แพลตฟอร์มสะสมแต้มสุขภาพสำหรับเด็กประถม ที่จะเปลี่ยนการกินผักและออกกำลังกายให้เป็นภารกิจสุดท้าทาย
        </p>
      </section>

      {/* Role Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {features.map((f, i) => (
          <div 
            key={i}
            className="group relative bg-white p-8 rounded-[3rem] shadow-xl border-4 border-white transition-all hover:scale-[1.03] hover:shadow-2xl flex flex-col h-full"
          >
            <div className={`w-20 h-20 rounded-3xl bg-gradient-to-br ${f.color} flex items-center justify-center text-4xl shadow-lg mb-6 group-hover:rotate-6 transition-transform`}>
              {f.icon}
            </div>
            <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">{f.role}</div>
            <h3 className="text-2xl font-black text-slate-800 mb-4">{f.title}</h3>
            <p className="text-slate-500 font-medium mb-8 flex-grow">{f.desc}</p>
            <button 
              onClick={f.action}
              className={`w-full py-4 rounded-2xl bg-gradient-to-r ${f.color} text-white font-black flex items-center justify-center gap-2 shadow-md hover:brightness-110 transition-all`}
            >
              {f.btnText} <ArrowRight size={20} />
            </button>
          </div>
        ))}
      </div>

      {/* Trust & Stats */}
      <section className="bg-white/50 backdrop-blur-sm rounded-[3rem] p-10 border-2 border-dashed border-slate-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-3xl font-black text-blue-500 mb-1">6000+</div>
            <div className="text-xs font-bold text-slate-400 uppercase">เป้าหมายก้าวเดิน</div>
          </div>
          <div>
            <div className="text-3xl font-black text-pink-500 mb-1">100%</div>
            <div className="text-xs font-bold text-slate-400 uppercase">ข้อมูลปลอดภัย</div>
          </div>
          <div>
            <div className="text-3xl font-black text-emerald-500 mb-1">AI</div>
            <div className="text-xs font-bold text-slate-400 uppercase">โค้ชส่วนตัว</div>
          </div>
          <div>
            <div className="text-3xl font-black text-purple-500 mb-1">SEL</div>
            <div className="text-xs font-bold text-slate-400 uppercase">ติดตามอารมณ์</div>
          </div>
        </div>
      </section>

      {/* Footer Banner */}
      <div className="relative h-48 rounded-[3rem] overflow-hidden shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-90"></div>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6 text-center">
          <h2 className="text-3xl font-black mb-4">พร้อมจะสร้างสุขภาพที่ดีหรือยัง?</h2>
          <button onClick={() => navigate('/register')} className="bg-white text-blue-600 px-8 py-3 rounded-full font-black shadow-lg hover:bg-blue-50 transition-colors">
            สมัครสมาชิกฮีโร่ใหม่ ✨
          </button>
        </div>
      </div>
    </div>
  );
};

export default Landing;
