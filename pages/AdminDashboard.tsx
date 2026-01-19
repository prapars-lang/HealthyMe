
import React, { useMemo, useState, useEffect } from 'react';
import { dbService } from '../services/dbService';
import { getClassReport, getAICoachFeedback } from '../geminiService';
import { HealthLog, ShopReward, RedemptionRecord } from '../types';
import { EMOJI_POOL } from '../constants';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, AreaChart, Area, Cell, PieChart, Pie, Legend, CartesianGrid } from 'recharts';
import { Users, Activity, TrendingUp, RefreshCw, ShoppingBag, Brain, Search, BarChart3, Package, Check, Database, User as UserIcon, Heart, Plus, Edit2, Trash2, X, Ticket, Smile } from 'lucide-react';
import Swal from 'sweetalert2';

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'research' | 'individual' | 'shop' | 'system'>('overview');
  const [allLogs, setAllLogs] = useState<HealthLog[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [rewards, setRewards] = useState<ShopReward[]>([]);
  const [redemptions, setRedemptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [studentAiInsight, setStudentAiInsight] = useState<string>('');
  
  // Shop Edit State
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [editingReward, setEditingReward] = useState<Partial<ShopReward> | null>(null);
  const [isSavingReward, setIsSavingReward] = useState(false);
  const [redemptionSearch, setRedemptionSearch] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [logs, lead, shopItems, reds] = await Promise.all([
        dbService.getAllHealthLogs(),
        dbService.getLeaderboard(),
        dbService.getShopRewards(),
        dbService.getRedemptions()
      ]);
      setAllLogs(logs);
      setLeaderboard(lead);
      setRewards(shopItems);
      setRedemptions(reds);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const toSafeISO = (dateStr: any) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    try { return d.toISOString().split('T')[0]; } catch (e) { return null; }
  };

  const researchStats = useMemo(() => {
    const bmiBins = { 'ผอม': 0, 'ปกติ': 0, 'ท้วม': 0, 'อ้วน': 0 };
    const moodMap: Record<string, number> = { 'happy': 0, 'normal': 0, 'sad': 0, 'angry': 0, 'sleepy': 0 };
    const dailySteps: Record<string, { total: number, count: number }> = {};

    allLogs.forEach(log => {
      const bmi = Number(log.bmi);
      if (!isNaN(bmi) && bmi > 0) {
        if (bmi < 18.5) bmiBins['ผอม']++;
        else if (bmi < 23) bmiBins['ปกติ']++;
        else if (bmi < 25) bmiBins['ท้วม']++;
        else bmiBins['อ้วน']++;
      }
      if (log.mood && moodMap[log.mood] !== undefined) moodMap[log.mood]++;
      const safeDate = toSafeISO(log.date);
      if (safeDate) {
        if (!dailySteps[safeDate]) dailySteps[safeDate] = { total: 0, count: 0 };
        dailySteps[safeDate].total += (Number(log.steps) || 0);
        dailySteps[safeDate].count++;
      }
    });

    const trend = Object.entries(dailySteps)
      .map(([date, val]) => ({
        date: new Date(date).toLocaleDateString('th-TH', { day: '2-digit', month: 'short' }),
        avg: Math.round(val.total / val.count),
        raw: date
      }))
      .sort((a, b) => a.raw.localeCompare(b.raw))
      .slice(-14);

    return {
      bmi: Object.entries(bmiBins).map(([name, value]) => ({ name, value })),
      mood: Object.entries(moodMap).map(([name, value]) => ({ name, value })),
      trend
    };
  }, [allLogs]);

  const handleSaveReward = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReward) return;
    setIsSavingReward(true);
    try {
      await dbService.saveShopReward(editingReward);
      Swal.fire('สำเร็จ', 'บันทึกข้อมูลรางวัลเรียบร้อยแล้ว', 'success');
      setShowRewardModal(false);
      fetchData();
    } catch (e) {
      Swal.fire('ผิดพลาด', 'ไม่สามารถบันทึกข้อมูลได้', 'error');
    } finally {
      setIsSavingReward(false);
    }
  };

  const handleDeleteReward = async (id: string) => {
    const res = await Swal.fire({
      title: 'ยืนยันการลบ?',
      text: "คุณกำลังจะลบรางวัลนี้ออกจากร้านค้า",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'ลบเลย',
      cancelButtonText: 'ยกเลิก'
    });
    if (res.isConfirmed) {
      await dbService.deleteShopReward(id);
      fetchData();
    }
  };

  const filteredRedemptions = useMemo(() => {
    return redemptions.filter(r => {
      const student = leaderboard.find(u => u.user_id === r.user_id);
      const nameMatch = student?.fullname.toLowerCase().includes(redemptionSearch.toLowerCase());
      const codeMatch = r.code.toLowerCase().includes(redemptionSearch.toLowerCase());
      return nameMatch || codeMatch;
    }).sort((a, b) => new Date(b.claimed_at).getTime() - new Date(a.claimed_at).getTime());
  }, [redemptions, redemptionSearch, leaderboard]);

  // Emoji selection grid for reward icon
  const rewardEmojis = [...EMOJI_POOL.rewards, ...EMOJI_POOL.food];

  if (loading) return <div className="p-20 text-center"><RefreshCw className="animate-spin mx-auto text-blue-500 mb-4" size={48}/><p className="font-black text-blue-600 uppercase tracking-widest">กำลังประมวลผล Big Data...</p></div>;

  return (
    <div className="space-y-8 pb-10 max-w-7xl mx-auto">
      <header className="bg-white rounded-[3.5rem] p-10 shadow-xl border-8 border-slate-50 flex flex-col md:flex-row justify-between items-center gap-8">
        <div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tight leading-tight">Research & Analytics Hub</h1>
          <p className="text-slate-400 font-bold text-sm mt-1 uppercase tracking-widest">Village Health Intelligence System</p>
        </div>
        <button onClick={() => { setAnalyzing(true); getClassReport(allLogs, leaderboard.length).then(r => { Swal.fire('AI Research Report', r, 'info'); setAnalyzing(false); }); }} className="bg-blue-600 text-white font-black px-8 py-4 rounded-3xl flex items-center gap-2 shadow-lg hover:scale-105 transition-all">
          {analyzing ? <RefreshCw className="animate-spin" /> : <Brain />} AI วิเคราะห์ภาพรวมชั้นเรียน
        </button>
      </header>

      <div className="flex flex-wrap gap-2 bg-white/60 backdrop-blur-md p-2 rounded-[2.5rem] w-fit mx-auto shadow-sm border border-white">
        {(['overview', 'research', 'individual', 'shop', 'system'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-8 py-3.5 rounded-[1.8rem] text-sm font-black transition-all ${activeTab === tab ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>
            {tab === 'overview' ? 'สรุป' : tab === 'research' ? 'วิจัย Big Data' : tab === 'individual' ? 'รายบุคคล' : tab === 'shop' ? 'จัดการร้านค้า' : 'ระบบ'}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-in fade-in duration-500">
          <div className="bg-white p-8 rounded-[3rem] shadow-lg border-b-8 border-blue-100"><Users className="text-blue-500 mb-4" size={32}/><p className="text-4xl font-black text-slate-800">{leaderboard.length}</p><p className="text-xs font-bold text-slate-400 uppercase">นักเรียนทั้งหมด</p></div>
          <div className="bg-white p-8 rounded-[3rem] shadow-lg border-b-8 border-emerald-100"><Activity className="text-emerald-500 mb-4" size={32}/><p className="text-4xl font-black text-slate-800">{allLogs.length}</p><p className="text-xs font-bold text-slate-400 uppercase">บันทึกสะสม</p></div>
          <div className="bg-white p-8 rounded-[3rem] shadow-lg border-b-8 border-amber-100"><ShoppingBag className="text-amber-500 mb-4" size={32}/><p className="text-4xl font-black text-amber-500">{redemptions.filter(r=>r.status==='pending').length}</p><p className="text-xs font-bold text-slate-400 uppercase">รายการรอรับรางวัล</p></div>
          <div className="bg-white p-8 rounded-[3rem] shadow-lg border-b-8 border-rose-100"><Heart className="text-rose-500 mb-4" size={32}/><p className="text-4xl font-black text-slate-800">Active</p><p className="text-xs font-bold text-slate-400 uppercase">ระบบวิจัยอารมณ์</p></div>
        </div>
      )}

      {activeTab === 'research' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-500">
          <div className="bg-white p-10 rounded-[3.5rem] shadow-xl">
            <h3 className="text-xl font-black mb-8 flex items-center gap-2 text-blue-500 font-black"><BarChart3 /> สัดส่วน BMI ของนักเรียน (Big Data)</h3>
            <div className="h-80"><ResponsiveContainer width="100%" height="100%"><BarChart data={researchStats.bmi}><XAxis dataKey="name"/><Tooltip/><Bar dataKey="value" radius={[10,10,0,0]}>{researchStats.bmi.map((e,i)=><Cell key={i} fill={['#60a5fa','#34d399','#facc15','#f87171'][i%4]}/>)}</Bar></BarChart></ResponsiveContainer></div>
          </div>
          <div className="bg-white p-10 rounded-[3.5rem] shadow-xl">
            <h3 className="text-xl font-black mb-8 flex items-center gap-2 text-emerald-500 font-black"><TrendingUp /> แนวโน้มการขยับร่างกายเฉลี่ยรายวัน</h3>
            <div className="h-80"><ResponsiveContainer width="100%" height="100%"><AreaChart data={researchStats.trend}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="date"/><Tooltip/><Area type="monotone" dataKey="avg" stroke="#10b981" fill="#d1fae5" strokeWidth={4}/></AreaChart></ResponsiveContainer></div>
          </div>
        </div>
      )}

      {activeTab === 'individual' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <div className="lg:col-span-1 bg-white p-8 rounded-[3rem] shadow-xl flex flex-col max-h-[700px] border-l-8 border-blue-500">
              <h3 className="text-xl font-black mb-6 text-blue-500 flex items-center gap-2 font-black uppercase tracking-widest text-xs"><Search size={16}/> ค้นหาประวัตินักเรียน</h3>
              <div className="space-y-2 overflow-y-auto custom-scrollbar">
                {leaderboard.map(s => (
                  <button key={s.user_id} onClick={() => setSelectedStudentId(s.user_id)} className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all ${selectedStudentId === s.user_id ? 'bg-blue-500 text-white shadow-lg' : 'bg-slate-50 hover:bg-slate-100'}`}>
                    <div className="text-2xl">{s.base_emoji}</div><div className="text-left font-black text-sm truncate">{s.fullname}</div>
                  </button>
                ))}
              </div>
           </div>
           <div className="lg:col-span-2">
              {selectedStudentId ? (
                <div className="space-y-6">
                   <div className="bg-white p-10 rounded-[3.5rem] shadow-xl border-t-8 border-blue-500 animate-in slide-in-from-bottom-4">
                      <h2 className="text-3xl font-black text-slate-800">{leaderboard.find(u=>u.user_id===selectedStudentId)?.fullname}</h2>
                      <div className="bg-blue-50 p-6 rounded-[2.5rem] mt-6 border-l-8 border-blue-500 italic font-bold text-slate-700 leading-relaxed text-sm">
                         "{studentAiInsight || "AI กำลังวิเคราะห์พฤติกรรมสุขภาพ..."}"
                      </div>
                   </div>
                </div>
              ) : <div className="h-full bg-white rounded-[3.5rem] flex items-center justify-center p-20 text-slate-300 font-black italic shadow-inner">กรุณาเลือกนักเรียนจากรายชื่อทางซ้ายมือ</div>}
           </div>
        </div>
      )}

      {activeTab === 'shop' && (
        <div className="space-y-8 animate-in fade-in duration-500">
          {/* Section: Rewards Inventory */}
          <div className="bg-white p-10 rounded-[3.5rem] shadow-xl border-t-8 border-amber-500">
             <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3"><Package className="text-amber-500" /> คลังสินค้าในร้านค้า</h3>
                <button 
                  onClick={() => { setEditingReward({ icon: '🎁', cost: 50, stock: 10 }); setShowRewardModal(true); }}
                  className="bg-amber-500 text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2 shadow-lg hover:scale-105 active:scale-95 transition-all"
                >
                  <Plus size={20} /> เพิ่มสินค้าใหม่
                </button>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rewards.map(reward => (
                   <div key={reward.id} className="p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100 flex flex-col items-center text-center group">
                      <div className="text-5xl mb-4 p-4 bg-white rounded-3xl shadow-sm transition-transform group-hover:scale-110">{reward.icon}</div>
                      <h4 className="font-black text-slate-800 truncate w-full">{reward.title}</h4>
                      <div className="flex gap-4 mt-3">
                         <span className="text-xs font-black text-amber-600 bg-amber-50 px-3 py-1 rounded-full">{reward.cost} Coins</span>
                         <span className="text-xs font-black text-slate-400 bg-white px-3 py-1 rounded-full border border-slate-100">Stock: {reward.stock}</span>
                      </div>
                      <div className="flex gap-2 mt-6 w-full">
                         <button 
                            onClick={() => { setEditingReward(reward); setShowRewardModal(true); }}
                            className="flex-1 py-3 bg-white border border-slate-200 rounded-xl text-slate-600 font-bold text-xs flex items-center justify-center gap-1 hover:bg-slate-50"
                         >
                            <Edit2 size={14}/> แก้ไข
                         </button>
                         <button 
                            onClick={() => handleDeleteReward(reward.id)}
                            className="flex-1 py-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-500 font-bold text-xs flex items-center justify-center gap-1 hover:bg-rose-100"
                         >
                            <Trash2 size={14}/> ลบ
                         </button>
                      </div>
                   </div>
                ))}
             </div>
          </div>

          {/* Section: Redemptions Log */}
          <div className="bg-white p-10 rounded-[3.5rem] shadow-xl border-t-8 border-emerald-500">
             <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
                <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3"><Ticket className="text-emerald-500" /> ประวัติการแลกรางวัล</h3>
                <div className="relative w-full md:w-80">
                   <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                   <input 
                      type="text" 
                      placeholder="ค้นหารายชื่อหรือรหัส Code..."
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-100 font-bold text-sm"
                      value={redemptionSearch}
                      onChange={(e) => setRedemptionSearch(e.target.value)}
                   />
                </div>
             </div>

             <div className="overflow-x-auto">
                <table className="w-full text-left">
                   <thead>
                      <tr className="border-b border-slate-100">
                         <th className="pb-4 font-black text-slate-400 uppercase text-[10px] tracking-widest px-4">นักเรียน</th>
                         <th className="pb-4 font-black text-slate-400 uppercase text-[10px] tracking-widest px-4">ของรางวัล</th>
                         <th className="pb-4 font-black text-slate-400 uppercase text-[10px] tracking-widest px-4">รหัสแลก</th>
                         <th className="pb-4 font-black text-slate-400 uppercase text-[10px] tracking-widest px-4 text-center">สถานะ</th>
                         <th className="pb-4 font-black text-slate-400 uppercase text-[10px] tracking-widest px-4"></th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                      {filteredRedemptions.map(red => {
                         const student = leaderboard.find(u => u.user_id === red.user_id);
                         return (
                            <tr key={red.id} className="hover:bg-slate-50/50 transition-colors">
                               <td className="py-5 px-4">
                                  <div className="flex items-center gap-3">
                                     <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-xl shadow-sm border border-slate-50">{student?.base_emoji}</div>
                                     <span className="font-black text-slate-700 text-sm">{student?.fullname || 'Unknown'}</span>
                                  </div>
                               </td>
                               <td className="py-5 px-4 font-bold text-slate-600 text-sm">{red.reward_title}</td>
                               <td className="py-5 px-4"><span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-lg font-black text-sm tracking-widest">{red.code}</span></td>
                               <td className="py-5 px-4 text-center">
                                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${red.status === 'completed' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-50 text-amber-600 animate-pulse'}`}>
                                     {red.status === 'completed' ? 'ได้รับแล้ว' : 'รอรับรางวัล'}
                                  </span>
                               </td>
                               <td className="py-5 px-4 text-right">
                                  {red.status === 'pending' && (
                                     <button 
                                        onClick={() => dbService.updateRedemptionStatus(red.id, 'completed').then(fetchData)}
                                        className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2 rounded-xl text-[10px] font-black shadow-lg shadow-emerald-100 active:scale-95 transition-all"
                                     >
                                        ยืนยันมอบรางวัล
                                     </button>
                                  )}
                               </td>
                            </tr>
                         );
                      })}
                   </tbody>
                </table>
                {filteredRedemptions.length === 0 && (
                   <div className="py-20 text-center font-black text-slate-300 italic">ไม่พบข้อมูลการแลกรางวัล</div>
                )}
             </div>
          </div>
        </div>
      )}

      {activeTab === 'system' && (
        <div className="bg-white p-20 rounded-[4rem] shadow-xl text-center border-8 border-slate-50">
           <div className="w-24 h-24 bg-blue-50 rounded-[2.5rem] flex items-center justify-center text-blue-500 mx-auto mb-8 shadow-inner"><Database size={48}/></div>
           <h3 className="text-3xl font-black mb-4 text-slate-800 tracking-tight">System Initialization</h3>
           <button onClick={() => {
              Swal.fire({ title: 'กำลังนำเข้าข้อมูล...', text: 'กรุณาอย่าปิดหน้านี้', allowOutsideClick: false, didOpen: () => { Swal.showLoading(); }});
              dbService.setupDatabase().then(() => { Swal.fire('สำเร็จ!', 'นำเข้าข้อมูลเรียบร้อยแล้ว', 'success'); fetchData(); });
           }} className="bg-blue-600 text-white px-12 py-6 rounded-[2rem] font-black shadow-2xl hover:scale-105 transition-all flex items-center gap-3 mx-auto text-lg">
              <RefreshCw /> Setup Base Shop Data
           </button>
        </div>
      )}

      {/* Modal: Reward Editor */}
      {showRewardModal && editingReward && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in">
           <form onSubmit={handleSaveReward} className="bg-white rounded-[3.5rem] w-full max-w-2xl p-10 shadow-2xl animate-in zoom-in max-h-[90vh] overflow-y-auto no-scrollbar">
              <div className="flex justify-between items-center mb-8">
                 <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3"><Edit2 className="text-amber-500" /> {editingReward.id ? 'แก้ไขข้อมูลรางวัล' : 'เพิ่มรางวัลใหม่'}</h3>
                 <button type="button" onClick={() => setShowRewardModal(false)} className="p-2 bg-slate-100 rounded-full text-slate-400 hover:bg-slate-200"><X /></button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-6">
                    <div>
                       <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">ชื่อของรางวัล</label>
                       <input 
                         type="text" 
                         required
                         className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-amber-100 font-bold transition-all"
                         value={editingReward.title || ''}
                         onChange={e => setEditingReward({...editingReward, title: e.target.value})}
                         placeholder="เช่น สติ๊กเกอร์ฮีโร่"
                       />
                    </div>
                    <div className="flex gap-4">
                       <div className="flex-1">
                          <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">ราคา (Coins)</label>
                          <input 
                            type="number" 
                            required
                            className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-amber-100 font-bold transition-all"
                            value={editingReward.cost || ''}
                            onChange={e => setEditingReward({...editingReward, cost: Number(e.target.value)})}
                          />
                       </div>
                       <div className="flex-1">
                          <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">สต็อก</label>
                          <input 
                            type="number" 
                            required
                            className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-amber-100 font-bold transition-all"
                            value={editingReward.stock || ''}
                            onChange={e => setEditingReward({...editingReward, stock: Number(e.target.value)})}
                          />
                       </div>
                    </div>
                    <div>
                       <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">คำอธิบาย</label>
                       <textarea 
                         className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-amber-100 font-bold h-32 transition-all resize-none"
                         value={editingReward.description || ''}
                         onChange={e => setEditingReward({...editingReward, description: e.target.value})}
                         placeholder="ระบุเงื่อนไขการแลกรางวัล..."
                       />
                    </div>
                 </div>

                 <div className="space-y-6">
                    <div>
                       <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">เลือกไอคอน (Emoji)</label>
                       <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100">
                          <div className="flex items-center gap-4 mb-4">
                             <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center text-4xl shadow-sm border border-slate-200 shrink-0">
                                {editingReward.icon || '🎁'}
                             </div>
                             <div className="text-xs font-bold text-slate-400 italic">เลือกไอคอนที่เหมาะสมกับของรางวัลเพื่อให้เด็กๆ ตื่นเต้น!</div>
                          </div>
                          <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto no-scrollbar p-1">
                             {rewardEmojis.map((emoji, idx) => (
                                <button
                                   key={idx}
                                   type="button"
                                   onClick={() => setEditingReward({...editingReward, icon: emoji})}
                                   className={`aspect-square rounded-xl flex items-center justify-center text-2xl transition-all hover:scale-110 ${editingReward.icon === emoji ? 'bg-amber-500 text-white shadow-lg scale-110' : 'bg-white border border-slate-100 hover:bg-amber-50'}`}
                                >
                                   {emoji}
                                </button>
                             ))}
                          </div>
                       </div>
                    </div>
                 </div>
              </div>

              <div className="mt-10 flex gap-4">
                 <button type="button" onClick={() => setShowRewardModal(false)} className="flex-1 py-4 bg-slate-100 text-slate-500 font-black rounded-2xl hover:bg-slate-200 transition-all">ยกเลิก</button>
                 <button 
                  type="submit" 
                  disabled={isSavingReward}
                  className="flex-[2] py-4 bg-amber-500 text-white font-black rounded-2xl shadow-xl shadow-amber-100 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
                 >
                    {isSavingReward ? <RefreshCw className="animate-spin" /> : <Check />}
                    {isSavingReward ? 'กำลังบันทึก...' : 'บันทึกข้อมูลสินค้า'}
                 </button>
              </div>
           </form>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
