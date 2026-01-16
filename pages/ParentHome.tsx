
import React, { useState, useEffect } from 'react';
import { User, AvatarData, HealthLog } from '../types';
import { dbService } from '../services/dbService';
import { getAICoachFeedback } from '../geminiService';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Heart, Activity, Moon, Utensils, Smile, TrendingUp, Info, Bell, Sparkles } from 'lucide-react';

interface ParentHomeProps {
  user: User;
}

const ParentHome: React.FC<ParentHomeProps> = ({ user }) => {
  const [logs, setLogs] = useState<HealthLog[]>([]);
  const [avatar, setAvatar] = useState<AvatarData | null>(null);
  const [loading, setLoading] = useState(true);
  const [parentFeedback, setParentFeedback] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [avatarData, allLogs] = await Promise.all([
          dbService.getAvatar(user.id),
          dbService.getAllHealthLogs()
        ]);
        
        const userLogs = allLogs.filter((l: any) => l.user_id === user.id);
        setLogs(userLogs);
        setAvatar(avatarData);

        if (userLogs.length > 0) {
          const lastLog = userLogs[userLogs.length - 1];
          // เรียกใช้ AI Coach สำหรับมุมมองผู้ปกครอง โดยส่งประวัติไปด้วย
          const feedback = await getAICoachFeedback(
            lastLog, 
            userLogs, 
            avatarData?.level || 1, 
            user.fullname, 
            true
          );
          setParentFeedback(feedback);
        }
      } catch (e) {
        console.error("Fetch data error", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user.id]);

  const chartData = logs.map(l => ({
    date: new Date(l.date).toLocaleDateString('th-TH', { day: '2-digit', month: 'short' }),
    steps: Number(l.steps),
    sleep: Number(l.sleep_hours),
    veggie: Number(l.vegetable_score)
  })).slice(-7);

  const moodData = [
    { name: 'มีความสุข', value: logs.filter(l => l.mood === 'happy').length, color: '#facc15' },
    { name: 'ปกติ', value: logs.filter(l => l.mood === 'normal').length, color: '#60a5fa' },
    { name: 'เศร้า', value: logs.filter(l => l.mood === 'sad').length, color: '#818cf8' },
    { name: 'หงุดหงิด', value: logs.filter(l => l.mood === 'angry').length, color: '#f87171' },
  ].filter(d => d.value > 0);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="w-16 h-16 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-pink-500 font-black uppercase tracking-widest">กำลังวิเคราะห์ข้อมูลเชิงลึก...</p>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-10">
      {/* Parent Header */}
      <header className="bg-gradient-to-r from-pink-500 to-rose-500 rounded-[3rem] p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-center gap-6 border-8 border-white">
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 bg-white/20 rounded-[2rem] flex items-center justify-center text-5xl shadow-inner border-2 border-white/30">
            🤱
          </div>
          <div>
            <h2 className="text-3xl font-black">รายงานของน้อง {user.fullname}</h2>
            <p className="opacity-80 font-medium">อัปเดตข้อมูลล่าสุดเมื่อ: {new Date().toLocaleDateString()}</p>
          </div>
        </div>
        <div className="bg-white/20 px-6 py-4 rounded-[2rem] backdrop-blur-md border border-white/30 text-center">
          <div className="text-xs font-black uppercase tracking-widest opacity-80 mb-1">ความก้าวหน้าอวตาร</div>
          <div className="text-2xl font-black">Level {avatar?.level || 1}</div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* AI Insight Box */}
        <section className="md:col-span-2 bg-white rounded-[3rem] p-8 shadow-sm border-2 border-pink-50 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-pink-50 rounded-full -mr-16 -mt-16 opacity-50"></div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
              <Bell className="text-pink-500" /> วิเคราะห์เชิงลึกโดย AI Coach
            </h3>
            <Sparkles className="text-pink-300" />
          </div>
          <div className="bg-pink-50 p-6 rounded-3xl border-l-8 border-pink-400 text-slate-700 italic font-medium leading-relaxed">
            "{parentFeedback || 'เริ่มบันทึกข้อมูลเพื่อรับคำแนะนำจาก AI Coach'}"
          </div>
        </section>

        {/* Quick Stats Card */}
        <section className="bg-white rounded-[3rem] p-8 shadow-sm border-2 border-indigo-50">
          <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
            <Heart className="text-rose-500" /> สรุปอารมณ์รวม
          </h3>
          <div className="h-48">
            {moodData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={moodData} innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value">
                    {moodData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : <div className="h-full flex items-center justify-center text-slate-400 text-sm italic">ยังไม่มีข้อมูลอารมณ์</div>}
          </div>
        </section>
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-8">
            <h3 className="font-black text-slate-700 flex items-center gap-2"><Activity className="text-blue-500" /> แนวโน้มการเคลื่อนไหว (7 วันล่าสุด)</h3>
            <div className="bg-blue-50 text-blue-600 text-[10px] font-black px-2 py-1 rounded-lg uppercase">Daily Steps</div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" />
                <YAxis hide />
                <Tooltip />
                <Line type="monotone" dataKey="steps" stroke="#3b82f6" strokeWidth={4} dot={{ r: 6, fill: '#3b82f6' }} activeDot={{ r: 10 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-8">
            <h3 className="font-black text-slate-700 flex items-center gap-2"><Moon className="text-indigo-500" /> พฤติกรรมการนอนหลับ</h3>
            <div className="bg-indigo-50 text-indigo-600 text-[10px] font-black px-2 py-1 rounded-lg uppercase">Hours</div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 12]} />
                <Tooltip />
                <Line type="step" dataKey="sleep" stroke="#818cf8" strokeWidth={4} dot={{ r: 6, fill: '#818cf8' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      {/* Recommendations Banner */}
      <section className="bg-emerald-500 rounded-[3rem] p-10 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-black/5 opacity-10"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
          <div className="p-5 bg-white/20 rounded-[2rem] text-4xl shadow-lg border border-white/20">🥗</div>
          <div className="flex-grow">
            <h3 className="text-2xl font-black mb-2 flex items-center justify-center md:justify-start gap-2">
              เคล็ดลับสุขภาพประจำสัปดาห์ <TrendingUp size={24} />
            </h3>
            <p className="font-medium opacity-90 leading-relaxed">
              จากการวิเคราะห์: น้อง {user.fullname} มีแนวโน้มอารมณ์ดีขึ้นเมื่อได้ออกกำลังกายมากกว่า 30 นาที 
              ลองพาไปเดินเล่นที่สวนสาธารณะในช่วงวันหยุดนี้ดูนะครับ!
            </p>
          </div>
          <button className="bg-white text-emerald-600 px-8 py-4 rounded-2xl font-black shadow-lg hover:scale-105 transition-transform active:scale-95 shrink-0">บทความแนะนำ</button>
        </div>
      </section>
    </div>
  );
};

export default ParentHome;
