
import React, { useMemo, useState, useEffect } from 'react';
import { dbService } from '../services/dbService';
import { getClassReport, generateQuizQuestions, getAICoachFeedback } from '../geminiService';
import { ShopReward, RedemptionRecord, HealthLog, AvatarData, Card } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area, Cell, PieChart, Pie } from 'recharts';
import { Users, Activity, TrendingUp, RefreshCw, ShoppingBag, Plus, Trash2, Check, Clock, X, Brain, AlertCircle, Eye, Info, Sparkles, Gift, Save as SaveIcon, BookOpen, UploadCloud, Wand2, Search, BarChart3, ShieldCheck, Server, Edit2, Package, User as UserIcon, Calendar, Heart, MessageSquare, LayoutGrid, Database, Eraser, Layers } from 'lucide-react';
import Swal from 'sweetalert2';

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'research' | 'individual' | 'shop' | 'cards' | 'quiz' | 'system'>('overview');
  const [allLogs, setAllLogs] = useState<HealthLog[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [rewards, setRewards] = useState<ShopReward[]>([]);
  const [redemptions, setRedemptions] = useState<RedemptionRecord[]>([]);
  const [quizPool, setQuizPool] = useState<any[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);
  
  // States for Individual Report
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [studentAvatar, setStudentAvatar] = useState<AvatarData | null>(null);
  const [studentLogs, setStudentLogs] = useState<HealthLog[]>([]);
  const [studentAiInsight, setStudentAiInsight] = useState<string>('');

  const [bulkInput, setBulkInput] = useState('');
  const [aiTopic, setAiTopic] = useState('');
  const [searchQuiz, setSearchQuiz] = useState('');

  // Form State for Rewards
  const [rewardForm, setRewardForm] = useState<Partial<ShopReward>>({
    title: '', cost: 50, stock: 10, icon: '🎁', description: ''
  });
  const [isEditingReward, setIsEditingReward] = useState(false);

  // Form State for Cards
  const [cardForm, setCardForm] = useState<Partial<Card>>({
    title: '', description: '', rarity: 'Common', image: '🥦', power_stats: { health: 5, brain: 5, energy: 5 }
  });
  const [isEditingCard, setIsEditingCard] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [logs, users, shopItems, allRedemptions, questions, allCards] = await Promise.all([
        dbService.getAllHealthLogs(),
        dbService.getLeaderboard(),
        dbService.getShopRewards(),
        dbService.getRedemptions(),
        dbService.getQuizPool(),
        dbService.getCards()
      ]);
      setAllLogs(logs);
      setLeaderboard(users);
      setRewards(shopItems);
      setRedemptions(allRedemptions);
      setQuizPool(questions);
      setCards(allCards);
    } catch (e) {
      console.error("Fetch admin data error", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Fetch individual student details when ID changes
  useEffect(() => {
    if (activeTab === 'individual' && selectedStudentId) {
      const fetchStudentDetails = async () => {
        const student = leaderboard.find(u => u.user_id === selectedStudentId);
        const logs = allLogs.filter(l => l.user_id === selectedStudentId);
        setStudentLogs(logs);
        
        try {
          const avatar = await dbService.getAvatar(selectedStudentId);
          setStudentAvatar(avatar);
          if (logs.length > 0) {
             const feedback = await getAICoachFeedback(logs[logs.length-1], logs, avatar.level, student.fullname, true);
             setStudentAiInsight(feedback);
          }
        } catch (e) {}
      };
      fetchStudentDetails();
    }
  }, [selectedStudentId, activeTab, leaderboard, allLogs]);

  // --- AI & QUIZ FUNCTIONS ---
  const handleAIQuestionGenerate = async () => {
    if (!aiTopic.trim()) {
      Swal.fire('ระบุหัวข้อก่อนจ้า', 'คุณครูอยากให้ AI ช่วยออกข้อสอบเรื่องอะไรครับ?', 'info');
      return;
    }
    setGeneratingAI(true);
    try {
      const aiResponse = await generateQuizQuestions(aiTopic, 5);
      if (aiResponse) {
        setBulkInput(prev => prev + (prev ? '\n' : '') + aiResponse);
        Swal.fire({ 
          title: 'AI ร่างข้อสอบสำเร็จ!', 
          text: 'สร้างคำถามให้แล้ว 5 ข้อ สามารถแก้ไขเพิ่มเติมได้ที่กล่อง Bulk Add', 
          icon: 'success', 
          toast: true, 
          position: 'top-end', 
          timer: 3000,
          showConfirmButton: false
        });
      }
    } catch (e: any) {
      Swal.fire('เกิดข้อผิดพลาด', e.message, 'error');
    } finally {
      setGeneratingAI(false);
    }
  };

  const handleBulkAddQuiz = async () => {
    const rawLines = bulkInput.trim().split('\n').filter(line => line.trim());
    if (rawLines.length === 0) {
      Swal.fire('ไม่มีข้อมูล', 'กรุณาระบุคำถาม หรือใช้ AI ช่วยร่างข้อสอบก่อนครับ', 'warning');
      return;
    }

    const allQuestions = rawLines.map((line, index) => {
      const parts = line.split('|').map(s => s.trim());
      if (parts.length < 6) return null;
      return { 
        question: parts[0], 
        option1: parts[1], 
        option2: parts[2], 
        option3: parts[3], 
        option4: parts[4], 
        answer: parseInt(parts[5]), 
        icon: parts[6] || '❓' 
      };
    }).filter(q => q !== null);

    if (allQuestions.length === 0) {
      Swal.fire('ข้อมูลไม่ถูกต้อง', 'กรุณาตรวจสอบรูปแบบข้อมูล: คำถาม | ต1 | ต2 | ต3 | ต4 | คำตอบ(0-3)', 'error');
      return;
    }

    const confirm = await Swal.fire({
      title: 'ยืนยันการบันทึก?',
      text: `ตรวจพบคำถามที่ถูกต้อง ${allQuestions.length} ข้อ บันทึกลงฐานข้อมูลใช่หรือไม่?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'บันทึกทั้งหมด',
      cancelButtonText: 'ตรวจสอบอีกครั้ง'
    });

    if (confirm.isConfirmed) {
      setSyncing(true);
      try {
        Swal.fire({ title: 'กำลังบันทึก...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
        await dbService.saveBulkQuiz(allQuestions);
        Swal.fire('สำเร็จ!', 'บันทึกคำถามทั้งหมดเรียบร้อยแล้ว', 'success');
        setBulkInput('');
        fetchData();
      } catch (e: any) {
        Swal.fire('ล้มเหลว', e.message, 'error');
      } finally { setSyncing(false); }
    }
  };

  const handleUpdateRedemptionStatus = async (id: string, status: string) => {
    setSyncing(true);
    try {
      await dbService.updateRedemptionStatus(id, status);
      Swal.fire('สำเร็จ!', 'อัปเดตสถานะแล้ว', 'success');
      fetchData();
    } catch (e: any) {
      Swal.fire('ล้มเหลว', e.message, 'error');
    } finally {
      setSyncing(false);
    }
  };

  const handleEditReward = (reward: ShopReward) => {
    setRewardForm(reward);
    setIsEditingReward(true);
  };

  const handleDeleteReward = async (id: string) => {
    const confirm = await Swal.fire({
      title: 'ยืนยันการลบ?',
      text: "คุณจะไม่สามารถกู้คืนข้อมูลนี้ได้",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ลบเลย',
      cancelButtonText: 'ยกเลิก'
    });
    if (confirm.isConfirmed) {
      setSyncing(true);
      try {
        await dbService.deleteShopReward(id);
        Swal.fire('ลบแล้ว!', 'ลบของรางวัลเรียบร้อย', 'success');
        fetchData();
      } catch (e: any) {
        Swal.fire('ล้มเหลว', e.message, 'error');
      } finally {
        setSyncing(false);
      }
    }
  };

  const handleSaveReward = async () => {
    if (!rewardForm.title) {
      Swal.fire('ข้อมูลไม่ครบ', 'กรุณาระบุชื่อของรางวัล', 'warning');
      return;
    }
    setSyncing(true);
    try {
      await dbService.saveShopReward(rewardForm);
      Swal.fire('สำเร็จ!', 'บันทึกของรางวัลแล้ว', 'success');
      setRewardForm({ title: '', cost: 50, stock: 10, icon: '🎁', description: '' });
      setIsEditingReward(false);
      fetchData();
    } catch (e: any) {
      Swal.fire('ล้มเหลว', e.message, 'error');
    } finally {
      setSyncing(false);
    }
  };

  // --- CARD FUNCTIONS ---
  const handleEditCard = (card: Card) => {
    setCardForm(card);
    setIsEditingCard(true);
  };

  const handleDeleteCard = async (id: string) => {
    const confirm = await Swal.fire({
      title: 'ยืนยันการลบการ์ด?',
      text: "คุณจะไม่สามารถกู้คืนการ์ดใบนี้ได้",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ลบเลย',
      cancelButtonText: 'ยกเลิก'
    });
    if (confirm.isConfirmed) {
      setSyncing(true);
      try {
        await dbService.deleteCard(id);
        Swal.fire('ลบแล้ว!', 'ลบการ์ดเรียบร้อย', 'success');
        fetchData();
      } catch (e: any) {
        Swal.fire('ล้มเหลว', e.message, 'error');
      } finally {
        setSyncing(false);
      }
    }
  };

  const handleSaveCard = async () => {
    if (!cardForm.title) {
      Swal.fire('ข้อมูลไม่ครบ', 'กรุณาระบุชื่อการ์ด', 'warning');
      return;
    }
    setSyncing(true);
    try {
      await dbService.saveCard(cardForm);
      Swal.fire('สำเร็จ!', 'บันทึกการ์ดเรียบร้อยแล้ว', 'success');
      setCardForm({ title: '', description: '', rarity: 'Common', image: '🥦', power_stats: { health: 5, brain: 5, energy: 5 } });
      setIsEditingCard(false);
      fetchData();
    } catch (e: any) {
      Swal.fire('ล้มเหลว', e.message, 'error');
    } finally {
      setSyncing(false);
    }
  };

  const handleDeleteQuiz = async (id: string) => {
    const confirm = await Swal.fire({
      title: 'ยืนยันการลบคำถาม?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ลบเลย'
    });
    if (confirm.isConfirmed) {
      setSyncing(true);
      try {
        await dbService.deleteQuizQuestion(id);
        Swal.fire('ลบแล้ว!', 'ลบคำถามเรียบร้อย', 'success');
        fetchData();
      } catch (e: any) {
        Swal.fire('ล้มเหลว', e.message, 'error');
      } finally {
        setSyncing(false);
      }
    }
  };

  const handleSetupDatabase = async () => {
    setSyncing(true);
    try {
      await dbService.callJSONP('setupDatabase', {});
      Swal.fire('สำเร็จ!', 'จัดการโครงสร้าง Database เรียบร้อยแล้ว', 'success');
    } catch (e: any) {
      Swal.fire('ล้มเหลว', e.message, 'error');
    } finally {
      setSyncing(false);
    }
  };

  // --- RESEARCH DATA LOGIC ---
  const sicknessAlerts = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return allLogs.filter(log => {
      const logDate = new Date(log.date).toISOString().split('T')[0];
      return logDate === todayStr && log.sickness && log.sickness.trim().length > 0;
    });
  }, [allLogs]);

  const researchStats = useMemo(() => {
    const bmiBins = { 'ผอม': 0, 'ปกติ': 0, 'ท้วม': 0, 'อ้วน': 0 };
    const moodCounts: Record<string, number> = { 'happy': 0, 'normal': 0, 'sad': 0, 'angry': 0 };
    
    allLogs.forEach(log => {
      const bmi = Number(log.bmi);
      if (bmi < 18.5) bmiBins['ผอม']++;
      else if (bmi < 23) bmiBins['ปกติ']++;
      else if (bmi < 25) bmiBins['ท้วม']++;
      else bmiBins['อ้วน']++;
      if (moodCounts[log.mood] !== undefined) moodCounts[log.mood]++;
    });

    return { 
      bmi: Object.entries(bmiBins).map(([name, value]) => ({ name, value })),
      mood: [
        { name: 'มีความสุข', value: moodCounts.happy, color: '#facc15' },
        { name: 'ปกติ', value: moodCounts.normal, color: '#60a5fa' },
        { name: 'เศร้า', value: moodCounts.sad, color: '#818cf8' },
        { name: 'หงุดหงิด', value: moodCounts.angry, color: '#f87171' }
      ]
    };
  }, [allLogs]);

  const renderIndividualReport = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-500">
       <section className="bg-white p-8 rounded-[3rem] shadow-xl border-4 border-slate-50">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
             <div>
                <h3 className="text-2xl font-black text-slate-800 flex items-center gap-2"><UserIcon className="text-blue-500" /> รายงานรายบุคคล</h3>
                <p className="text-sm font-bold text-slate-400">เลือกนักเรียนเพื่อดูประวัติสุขภาพเชิงลึก</p>
             </div>
             <div className="relative w-full md:w-80">
                <select 
                  className="w-full pl-6 pr-10 py-4 bg-slate-50 rounded-2xl outline-none font-black text-slate-700 border-2 border-transparent focus:border-blue-400 transition-all appearance-none"
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                >
                  <option value="">เลือกนักเรียน...</option>
                  {leaderboard.map(u => (
                    <option key={u.user_id} value={u.user_id}>{u.fullname} ({u.class})</option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400"><LayoutGrid size={20} /></div>
             </div>
          </div>

          {!selectedStudentId ? (
            <div className="py-20 text-center flex flex-col items-center gap-4 opacity-30">
               <div className="text-8xl">🔍</div>
               <p className="font-black italic">กรุณาเลือกรายชื่อนักเรียนจากด้านบน</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
               <div className="space-y-6">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-[2.5rem] border-2 border-blue-100 flex flex-col items-center">
                     <div className="w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center text-5xl shadow-lg border-4 border-white mb-4">
                        {studentAvatar?.base_emoji || '🧑‍🚀'}
                     </div>
                     <h4 className="text-xl font-black text-slate-800">{leaderboard.find(u => u.user_id === selectedStudentId)?.fullname}</h4>
                     <p className="text-xs font-black text-blue-500 uppercase tracking-widest mt-1">Level {studentAvatar?.level}</p>
                     
                     <div className="grid grid-cols-2 gap-4 w-full mt-6">
                        <div className="bg-white p-4 rounded-2xl text-center shadow-sm">
                           <p className="text-[10px] font-black text-slate-400 uppercase">เหรียญ</p>
                           <p className="text-lg font-black text-amber-500">{studentAvatar?.coin}</p>
                        </div>
                        <div className="bg-white p-4 rounded-2xl text-center shadow-sm">
                           <p className="text-[10px] font-black text-slate-400 uppercase">Streak</p>
                           <p className="text-lg font-black text-orange-500">{studentAvatar?.streak_count} วัน</p>
                        </div>
                     </div>
                  </div>

                  <div className="bg-white p-6 rounded-[2rem] border-2 border-slate-50 shadow-sm">
                     <h5 className="font-black text-slate-800 mb-4 flex items-center gap-2"><Sparkles className="text-amber-500" size={18}/> AI Insight สำหรับครู</h5>
                     <p className="text-xs font-medium text-slate-600 italic leading-relaxed">
                        "{studentAiInsight || "กำลังวิเคราะห์ข้อมูล..."}"
                     </p>
                  </div>
               </div>

               <div className="lg:col-span-2 space-y-6">
                  <div className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-50 shadow-sm">
                     <h5 className="font-black text-slate-800 mb-6 flex items-center gap-2"><TrendingUp className="text-emerald-500" /> แนวโน้มจำนวนก้าว (7 วันล่าสุด)</h5>
                     <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                           <AreaChart data={studentLogs.slice(-7).map(l => ({ date: new Date(l.date).toLocaleDateString('th-TH', {day:'2-digit', month:'short'}), steps: Number(l.steps) }))}>
                              <defs>
                                <linearGradient id="colorStepsInd" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                              <XAxis dataKey="date" fontSize={10} />
                              <YAxis fontSize={10} />
                              <Tooltip />
                              <Area type="monotone" dataKey="steps" stroke="#10b981" fillOpacity={1} fill="url(#colorStepsInd)" strokeWidth={3} />
                           </AreaChart>
                        </ResponsiveContainer>
                     </div>
                  </div>

                  <div className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-50 shadow-sm overflow-hidden">
                     <h5 className="font-black text-slate-800 mb-6 flex items-center gap-2"><Calendar className="text-blue-500" /> ประวัติการบันทึก</h5>
                     <div className="max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                        <table className="w-full text-left text-sm">
                           <thead className="sticky top-0 bg-white border-b-2 border-slate-50 text-[10px] font-black text-slate-400 uppercase">
                              <tr>
                                 <th className="pb-3 px-2">วันที่</th>
                                 <th className="pb-3 px-2">อารมณ์</th>
                                 <th className="pb-3 px-2">ก้าว</th>
                                 <th className="pb-3 px-2">นอน (ชม.)</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-slate-50 font-bold text-slate-600">
                              {studentLogs.slice().reverse().map(l => (
                                 <tr key={l.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="py-3 px-2 whitespace-nowrap">{new Date(l.date).toLocaleDateString('th-TH')}</td>
                                    <td className="py-3 px-2">{l.mood === 'happy' ? '😀' : l.mood === 'normal' ? '😐' : '😟'}</td>
                                    <td className="py-3 px-2">{l.steps}</td>
                                    <td className="py-3 px-2">{l.sleep_hours}</td>
                                 </tr>
                              ))}
                           </tbody>
                        </table>
                        {studentLogs.length === 0 && <p className="text-center py-10 text-slate-300 italic">ยังไม่มีข้อมูลการบันทึก</p>}
                     </div>
                  </div>
               </div>
            </div>
          )}
       </section>
    </div>
  );

  const handleAIAnalysis = async () => {
    setAnalyzing(true);
    try {
      const report = await getClassReport(allLogs, leaderboard.length);
      Swal.fire({ title: 'รายงาน AI ภาพรวมชั้นเรียน', html: `<div class="text-left text-sm font-medium leading-relaxed">${report.replace(/\n/g, '<br/>')}</div>`, icon: 'info' });
    } catch (e) { Swal.fire('ล้มเหลว', 'AI ไม่ว่างในขณะนี้', 'error'); }
    finally { setAnalyzing(false); }
  };

  const handleBroadcast = async () => {
    const { value: v } = await Swal.fire({
      title: 'แจกรางวัลทั้งชั้น 🎁',
      html: '<input id="exp" type="number" placeholder="EXP" class="swal2-input" value="100"><input id="coin" type="number" placeholder="เหรียญ" class="swal2-input" value="20">',
      preConfirm: () => ({ exp: (document.getElementById('exp') as HTMLInputElement).value, coin: (document.getElementById('coin') as HTMLInputElement).value })
    });
    if (v) {
      setSyncing(true);
      await dbService.broadcastReward(Number(v.exp), Number(v.coin));
      Swal.fire('แจกแล้ว!', 'นักเรียนทุกคนได้รับรางวัล', 'success');
      setSyncing(false);
      fetchData();
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20 gap-4">
      <RefreshCw className="animate-spin text-blue-500" size={64} />
      <p className="font-black text-blue-600 animate-pulse uppercase text-sm">กำลังโหลดศูนย์ควบคุม...</p>
    </div>
  );

  return (
    <div className="space-y-8 pb-10 max-w-7xl mx-auto">
      <header className="bg-white rounded-[3.5rem] p-10 shadow-xl border-8 border-slate-50 flex flex-col md:flex-row justify-between items-center gap-8 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full opacity-20 -mr-20 -mt-20 group-hover:scale-110 transition-transform"></div>
        <div className="relative z-10 text-center md:text-left">
          <div className="flex items-center gap-3 mb-3 justify-center md:justify-start">
             <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg"><UserIcon size={24} /></div>
             <span className="bg-blue-50 text-blue-600 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Administrator</span>
          </div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tight">KidsHealthyMe Command</h1>
          <p className="text-slate-400 font-bold text-sm mt-1">Research & Gamification Hub</p>
        </div>
        
        <div className="flex flex-wrap justify-center gap-4 relative z-10">
           <button onClick={handleBroadcast} className="bg-amber-400 text-white font-black px-8 py-4 rounded-[2rem] flex items-center gap-2 shadow-lg hover:translate-y-[-2px] transition-all active:scale-95">
             <Gift size={20} /> แจกรางวัลทั้งชั้น
           </button>
           <button onClick={handleAIAnalysis} disabled={analyzing} className="bg-blue-600 text-white font-black px-8 py-4 rounded-[2rem] flex items-center gap-2 shadow-lg hover:translate-y-[-2px] transition-all active:scale-95 disabled:opacity-50">
             {analyzing ? <RefreshCw className="animate-spin" size={20} /> : <Brain size={20} />} AI วิเคราะห์ภาพรวม
           </button>
        </div>
      </header>

      <div className="flex flex-wrap gap-2 bg-white/60 backdrop-blur-md p-2 rounded-[2.5rem] w-fit mx-auto shadow-sm border border-white">
        {(['overview', 'research', 'individual', 'shop', 'cards', 'quiz', 'system'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-8 py-3.5 rounded-[1.8rem] text-sm font-black transition-all ${activeTab === tab ? 'bg-blue-600 text-white shadow-lg scale-105' : 'text-slate-400 hover:text-slate-600 hover:bg-white'}`}
          >
            {tab === 'overview' ? 'ภาพรวม' : 
             tab === 'research' ? 'วิจัย (Big Data)' : 
             tab === 'individual' ? 'รายงานรายบุคคล' :
             tab === 'shop' ? 'จัดการร้านค้า' :
             tab === 'cards' ? 'จัดการการ์ด' :
             tab === 'quiz' ? 'คลังควิซ' : 'ตั้งค่า'}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-in fade-in duration-500">
           <div className="bg-white p-8 rounded-[3rem] shadow-lg border border-slate-50 flex flex-col justify-between hover:border-blue-200 transition-colors group">
              <Users className="text-blue-500 mb-6 group-hover:scale-110 transition-transform" size={32}/>
              <div><p className="text-xs font-black text-slate-400 uppercase">นักเรียน</p><p className="text-4xl font-black text-slate-800">{leaderboard.length} คน</p></div>
           </div>
           <div className="bg-white p-8 rounded-[3rem] shadow-lg border border-slate-50 flex flex-col justify-between hover:border-rose-200 transition-colors group">
              <Activity className="text-rose-500 mb-6 group-hover:scale-110 transition-transform" size={32}/>
              <div><p className="text-xs font-black text-slate-400 uppercase">บันทึกสะสม</p><p className="text-4xl font-black text-slate-800">{allLogs.length} ครั้ง</p></div>
           </div>
           <div className="bg-white p-8 rounded-[3rem] shadow-lg border border-slate-50 flex flex-col justify-between hover:border-amber-200 transition-colors group">
              <ShoppingBag className="text-amber-500 mb-6 group-hover:scale-110 transition-transform" size={32}/>
              <div><p className="text-xs font-black text-slate-400 uppercase">รอรับของ</p><p className="text-4xl font-black text-amber-500">{redemptions.filter(r => r.status === 'pending').length}</p></div>
           </div>
           <div className={`p-8 rounded-[3rem] shadow-lg border transition-all ${sicknessAlerts.length > 0 ? 'bg-red-500 text-white' : 'bg-white text-slate-800'}`}>
              <AlertCircle className={`mb-6 ${sicknessAlerts.length > 0 ? 'text-white animate-pulse' : 'text-slate-300'}`} size={32}/>
              <div><p className="text-xs font-black uppercase">แจ้งป่วยวันนี้</p><p className="text-4xl font-black">{sicknessAlerts.length} คน</p></div>
           </div>

           <div className="lg:col-span-4 bg-white rounded-[3.5rem] p-10 shadow-xl border border-slate-50">
              <h3 className="text-2xl font-black text-slate-800 mb-8 flex items-center gap-3"><TrendingUp className="text-emerald-500" /> นักเรียนที่มีเลเวลสูงสุด (Top 10)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                 {leaderboard.map((u, i) => (
                   <div key={i} className="bg-slate-50 p-6 rounded-[2rem] border-2 border-transparent hover:border-blue-200 transition-all flex flex-col items-center">
                      <div className="text-3xl mb-3">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '⭐'}</div>
                      <div className="font-black text-slate-800 text-center truncate w-full">{u.fullname}</div>
                      <div className="text-xs font-bold text-blue-500">Level {u.level}</div>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      )}

      {activeTab === 'research' && (
        <div className="space-y-8 animate-in fade-in duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
             <section className="bg-white p-10 rounded-[3.5rem] shadow-xl border border-slate-50">
                <h3 className="text-2xl font-black mb-8 text-slate-800 flex items-center gap-2"><BarChart3 className="text-blue-500" /> BMI Distribution (ห้องเรียน)</h3>
                <div className="h-80">
                   <ResponsiveContainer width="100%" height="100%">
                     <BarChart data={researchStats.bmi}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                           {researchStats.bmi.map((e, i) => <Cell key={i} fill={['#60a5fa', '#10b981', '#f59e0b', '#ef4444'][i % 4]}/>)}
                        </Bar>
                     </BarChart>
                   </ResponsiveContainer>
                </div>
             </section>

             <section className="bg-white p-10 rounded-[3.5rem] shadow-xl border border-slate-50">
                <h3 className="text-2xl font-black mb-8 text-slate-800 flex items-center gap-2"><MessageSquare className="text-amber-500" /> อารมณ์นักเรียน (Big Data)</h3>
                <div className="h-80">
                   <ResponsiveContainer width="100%" height="100%">
                     <PieChart>
                       <Pie data={researchStats.mood} innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                         {researchStats.mood.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                       </Pie>
                       <Tooltip />
                     </PieChart>
                   </ResponsiveContainer>
                </div>
             </section>
          </div>
        </div>
      )}

      {activeTab === 'individual' && renderIndividualReport()}

      {activeTab === 'shop' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in slide-in-from-bottom-6 duration-500">
           <div className="lg:col-span-2 space-y-8">
              <section className="bg-white p-10 rounded-[3.5rem] shadow-xl border border-slate-50">
                 <h3 className="text-2xl font-black mb-8 flex items-center gap-3"><Clock className="text-amber-500" /> คำขอแลกของรางวัลล่าสุด</h3>
                 <div className="space-y-4">
                    {redemptions.map(r => (
                       <div key={r.id} className="bg-slate-50 p-6 rounded-[2rem] flex justify-between items-center group hover:bg-white hover:shadow-md transition-all">
                          <div className="flex items-center gap-4">
                             <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-black ${r.status === 'completed' ? 'bg-emerald-500' : 'bg-amber-500'}`}>
                                {r.status === 'completed' ? <Check size={20}/> : <Clock size={20}/>}
                             </div>
                             <div>
                                <p className="font-black text-slate-700">Code: {r.code}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                  โดย {leaderboard.find(u => u.user_id === r.user_id)?.fullname || 'ไม่ทราบชื่อ'} | 
                                  ของรางวัล: {rewards.find(reward => reward.id === r.reward_id)?.title || 'ไม่พบรายการ'}
                                </p>
                             </div>
                          </div>
                          <div className="flex gap-2">
                             {r.status === 'pending' && (
                               <button onClick={() => handleUpdateRedemptionStatus(r.id, 'completed')} className="bg-emerald-500 text-white px-6 py-2 rounded-xl text-xs font-black shadow-md hover:bg-emerald-600">อนุมัติ</button>
                             )}
                             <button className="p-2 text-slate-300 hover:text-red-500"><Trash2 size={18}/></button>
                          </div>
                       </div>
                    ))}
                 </div>
              </section>

              <section className="bg-white p-10 rounded-[3.5rem] shadow-xl border border-slate-50">
                <h3 className="text-2xl font-black mb-8 flex items-center gap-3"><Package className="text-blue-500" /> รายการของรางวัลในคลัง</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {rewards.map(reward => (
                    <div key={reward.id} className="bg-slate-50 p-5 rounded-[2rem] border-2 border-transparent hover:border-blue-100 transition-all flex justify-between items-center group">
                      <div className="flex items-center gap-4">
                        <div className="text-4xl">{reward.icon}</div>
                        <div>
                          <p className="font-black text-slate-700">{reward.title}</p>
                          <div className="flex gap-3 mt-1">
                            <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full uppercase">{reward.cost} Coins</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEditReward(reward)} className="p-2 bg-white text-blue-500 rounded-xl shadow-sm hover:bg-blue-50"><Edit2 size={14}/></button>
                        <button onClick={() => handleDeleteReward(reward.id)} className="p-2 bg-white text-red-500 rounded-xl shadow-sm hover:bg-red-50"><Trash2 size={14}/></button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
           </div>
           
           <div className="space-y-8">
              <section className="bg-white p-8 rounded-[3.5rem] shadow-xl border-4 border-amber-50 sticky top-24">
                 <h3 className="text-xl font-black mb-6 flex items-center gap-3 text-amber-600">
                   {isEditingReward ? <Edit2 size={20} /> : <Plus size={20} />} 
                   {isEditingReward ? 'แก้ไขของรางวัล' : 'เพิ่มของรางวัลใหม่'}
                 </h3>
                 <div className="space-y-5">
                    <input 
                      type="text" placeholder="ชื่อของรางวัล..." 
                      className="w-full px-5 py-4 bg-slate-50 rounded-2xl outline-none font-bold text-sm"
                      value={rewardForm.title} onChange={(e) => setRewardForm({...rewardForm, title: e.target.value})}
                    />
                    <div className="grid grid-cols-2 gap-4">
                       <input 
                         type="number" placeholder="ราคา"
                         className="w-full px-5 py-4 bg-slate-50 rounded-2xl outline-none font-bold text-sm"
                         value={rewardForm.cost} onChange={(e) => setRewardForm({...rewardForm, cost: Number(e.target.value)})}
                       />
                       <input 
                         type="number" placeholder="สต็อก"
                         className="w-full px-5 py-4 bg-slate-50 rounded-2xl outline-none font-bold text-sm"
                         value={rewardForm.stock} onChange={(e) => setRewardForm({...rewardForm, stock: Number(e.target.value)})}
                       />
                    </div>
                    <button onClick={handleSaveReward} className="w-full py-4 bg-amber-500 text-white rounded-2xl font-black flex items-center justify-center gap-2">
                       <SaveIcon size={20}/> บันทึก
                    </button>
                 </div>
              </section>
           </div>
        </div>
      )}

      {activeTab === 'cards' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in slide-in-from-bottom-6 duration-500">
          <div className="lg:col-span-2 space-y-8">
            <section className="bg-white p-10 rounded-[3.5rem] shadow-xl border border-slate-50">
              <h3 className="text-2xl font-black mb-8 flex items-center gap-3"><Layers className="text-indigo-500" /> คลังการ์ดฮีโร่ทั้งหมด</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {cards.map(card => (
                  <div key={card.id} className="bg-slate-50 p-6 rounded-[2.5rem] border-2 border-transparent hover:border-indigo-100 transition-all flex flex-col group relative overflow-hidden">
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEditCard(card)} className="p-2 bg-white text-indigo-500 rounded-xl shadow-sm hover:bg-indigo-50"><Edit2 size={14}/></button>
                      <button onClick={() => handleDeleteCard(card.id)} className="p-2 bg-white text-red-500 rounded-xl shadow-sm hover:bg-red-50"><Trash2 size={14}/></button>
                    </div>
                    <div className="flex items-center gap-4 mb-4">
                      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-4xl shadow-sm ${card.rarity === 'Legendary' ? 'bg-amber-100' : card.rarity === 'Rare' ? 'bg-indigo-100' : 'bg-blue-100'}`}>
                        {card.image.startsWith('http') ? <img src={card.image} className="w-full h-full object-cover rounded-2xl" /> : card.image}
                      </div>
                      <div>
                        <p className="font-black text-slate-800">{card.title}</p>
                        <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${card.rarity === 'Legendary' ? 'bg-amber-500 text-white' : card.rarity === 'Rare' ? 'bg-indigo-500 text-white' : 'bg-blue-500 text-white'}`}>
                          {card.rarity}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs font-bold text-slate-400 mb-4 h-8 overflow-hidden line-clamp-2">{card.description}</p>
                    <div className="grid grid-cols-3 gap-2">
                       <div className="bg-white rounded-xl p-2 text-center border border-slate-100">
                          <p className="text-[7px] font-black text-slate-400 uppercase">Health</p>
                          <p className="text-xs font-black text-emerald-500">{card.power_stats.health}</p>
                       </div>
                       <div className="bg-white rounded-xl p-2 text-center border border-slate-100">
                          <p className="text-[7px] font-black text-slate-400 uppercase">Brain</p>
                          <p className="text-xs font-black text-blue-500">{card.power_stats.brain}</p>
                       </div>
                       <div className="bg-white rounded-xl p-2 text-center border border-slate-100">
                          <p className="text-[7px] font-black text-slate-400 uppercase">Energy</p>
                          <p className="text-xs font-black text-orange-500">{card.power_stats.energy}</p>
                       </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="space-y-8">
            <section className="bg-white p-8 rounded-[3.5rem] shadow-xl border-4 border-indigo-50 sticky top-24">
              <h3 className="text-xl font-black mb-6 flex items-center gap-3 text-indigo-600">
                {isEditingCard ? <Edit2 size={20} /> : <Plus size={20} />} 
                {isEditingCard ? 'แก้ไขการ์ด' : 'สร้างการ์ดใหม่'}
              </h3>
              <div className="space-y-5">
                <input 
                  type="text" placeholder="ชื่อฮีโร่บนการ์ด..." 
                  className="w-full px-5 py-4 bg-slate-50 rounded-2xl outline-none font-bold text-sm"
                  value={cardForm.title} onChange={(e) => setCardForm({...cardForm, title: e.target.value})}
                />
                <textarea 
                  placeholder="คำอธิบายพลัง..." 
                  className="w-full px-5 py-4 bg-slate-50 rounded-2xl outline-none font-bold text-sm h-24"
                  value={cardForm.description} onChange={(e) => setCardForm({...cardForm, description: e.target.value})}
                />
                <div className="grid grid-cols-2 gap-4">
                  <select 
                    className="w-full px-5 py-4 bg-slate-50 rounded-2xl outline-none font-bold text-sm"
                    value={cardForm.rarity} onChange={(e) => setCardForm({...cardForm, rarity: e.target.value as any})}
                  >
                    <option value="Common">Common</option>
                    <option value="Rare">Rare</option>
                    <option value="Legendary">Legendary</option>
                  </select>
                  <input 
                    type="text" placeholder="Emoji หรือ Image URL" 
                    className="w-full px-5 py-4 bg-slate-50 rounded-2xl outline-none font-bold text-sm"
                    value={cardForm.image} onChange={(e) => setCardForm({...cardForm, image: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                   <div>
                      <label className="text-[9px] font-black text-slate-400 px-1 uppercase">HP</label>
                      <input type="number" className="w-full px-3 py-2 bg-slate-50 rounded-xl font-bold" value={cardForm.power_stats?.health} onChange={(e) => setCardForm({...cardForm, power_stats: {...cardForm.power_stats!, health: Number(e.target.value)}})} />
                   </div>
                   <div>
                      <label className="text-[9px] font-black text-slate-400 px-1 uppercase">INT</label>
                      <input type="number" className="w-full px-3 py-2 bg-slate-50 rounded-xl font-bold" value={cardForm.power_stats?.brain} onChange={(e) => setCardForm({...cardForm, power_stats: {...cardForm.power_stats!, brain: Number(e.target.value)}})} />
                   </div>
                   <div>
                      <label className="text-[9px] font-black text-slate-400 px-1 uppercase">ENG</label>
                      <input type="number" className="w-full px-3 py-2 bg-slate-50 rounded-xl font-bold" value={cardForm.power_stats?.energy} onChange={(e) => setCardForm({...cardForm, power_stats: {...cardForm.power_stats!, energy: Number(e.target.value)}})} />
                   </div>
                </div>
                <button onClick={handleSaveCard} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black flex items-center justify-center gap-2">
                   <SaveIcon size={20}/> บันทึกการ์ด
                </button>
                {isEditingCard && (
                  <button onClick={() => { setIsEditingCard(false); setCardForm({ title: '', description: '', rarity: 'Common', image: '🥦', power_stats: { health: 5, brain: 5, energy: 5 } }); }} className="w-full py-2 text-slate-400 font-bold text-xs">ยกเลิกการแก้ไข</button>
                )}
              </div>
            </section>
          </div>
        </div>
      )}

      {activeTab === 'quiz' && (
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-500">
            <div className="lg:col-span-2 space-y-6">
               <section className="bg-white p-10 rounded-[3.5rem] shadow-xl border-t-8 border-indigo-500 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-5"><Brain size={120} /></div>
                  <h3 className="text-2xl font-black mb-6 flex items-center gap-3 relative z-10"><Brain className="text-indigo-500" /> AI Quiz Architect</h3>
                  <p className="text-xs font-bold text-slate-400 mb-4 relative z-10">ป้อนหัวข้อที่คุณครูต้องการ แล้วให้ AI ช่วยร่างคำถาม 5 ข้อพร้อมตัวเลือกและเฉลย</p>
                  <div className="flex gap-4 relative z-10">
                     <input 
                       type="text" placeholder="หัวข้อ (เช่น การล้างมือ, วิตามิน, การนอนหลับ)..." 
                       className="flex-grow px-6 py-4 bg-slate-50 rounded-2xl outline-none font-bold text-slate-700 border-2 border-transparent focus:border-indigo-400 transition-all shadow-inner"
                       value={aiTopic} onChange={(e) => setAiTopic(e.target.value)}
                       disabled={generatingAI}
                     />
                     <button 
                        onClick={handleAIQuestionGenerate} 
                        disabled={generatingAI || !aiTopic}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl font-black shadow-lg shadow-indigo-100 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                     >
                        {generatingAI ? <RefreshCw className="animate-spin" size={20} /> : <Wand2 size={20} />}
                        {generatingAI ? 'กำลังร่าง...' : 'ร่างควิซ'}
                     </button>
                  </div>
               </section>

               <section className="bg-white p-10 rounded-[3.5rem] shadow-xl max-h-[600px] flex flex-col">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-black flex items-center gap-3"><BookOpen className="text-blue-500" /> คลังคำถาม ({quizPool.length})</h3>
                    <div className="relative">
                       <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                       <input 
                         type="text" 
                         placeholder="ค้นหาคำถาม..." 
                         className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none focus:border-blue-300"
                         value={searchQuiz}
                         onChange={(e) => setSearchQuiz(e.target.value)}
                       />
                    </div>
                  </div>
                  <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar space-y-3">
                     {quizPool.filter(q => q.question.toLowerCase().includes(searchQuiz.toLowerCase())).length > 0 ? (
                       quizPool.filter(q => q.question.toLowerCase().includes(searchQuiz.toLowerCase())).map(q => (
                          <div key={q.id} className="p-4 bg-slate-50 rounded-2xl flex justify-between items-center group hover:bg-blue-50 transition-all border border-transparent hover:border-blue-100 shadow-sm">
                             <div className="flex items-center gap-4">
                                <div className="text-3xl bg-white p-2 rounded-xl shadow-sm">{q.icon || '❓'}</div>
                                <div>
                                   <p className="font-black text-slate-700">{q.question}</p>
                                   <div className="flex gap-2 mt-1">
                                      <span className="text-[9px] bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full font-black uppercase tracking-widest">เฉลย: ข้อ {parseInt(q.answer) + 1}</span>
                                      <span className="text-[9px] bg-slate-200 text-slate-500 px-2 py-0.5 rounded-full font-black uppercase tracking-widest">ID: {q.id}</span>
                                   </div>
                                </div>
                             </div>
                             <button onClick={() => handleDeleteQuiz(q.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={20}/></button>
                          </div>
                       ))
                     ) : (
                       <div className="py-20 text-center text-slate-300 italic flex flex-col items-center">
                          <Search size={48} className="mb-4 opacity-20" />
                          ไม่พบข้อมูลคำถาม
                       </div>
                     )}
                  </div>
               </section>
            </div>

            <section className="bg-white p-8 rounded-[3.5rem] shadow-xl border-4 border-blue-50 h-fit sticky top-24 flex flex-col">
               <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-black flex items-center gap-2"><UploadCloud className="text-blue-500" /> Bulk Add / Edit</h3>
                  <button onClick={() => setBulkInput('')} className="p-2 text-slate-300 hover:text-red-400" title="ล้างข้อมูล"><Eraser size={18}/></button>
               </div>
               <p className="text-[10px] font-bold text-slate-400 mb-4 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                  รูปแบบ: <br/>
                  <code className="text-blue-600">คำถาม | ต1 | ต2 | ต3 | ต4 | เฉลย(0-3) | ไอคอน</code>
               </p>
               <textarea 
                  className="w-full h-80 p-5 bg-slate-50 rounded-[2rem] outline-none font-bold text-xs text-slate-600 border-2 border-transparent focus:border-blue-300 transition-all shadow-inner resize-none"
                  placeholder="ตัวอย่าง: แปรงฟันวันละกี่ครั้ง? | 1 | 2 | 3 | 0 | 1 | 🪥"
                  value={bulkInput} onChange={(e) => setBulkInput(e.target.value)}
                  disabled={syncing}
               />
               
               <div className="mt-6 space-y-3">
                  <div className="flex justify-between px-2">
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">พร้อมบันทึก</span>
                     <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{bulkInput.trim().split('\n').filter(l => l.trim()).length} รายการ</span>
                  </div>
                  <button 
                    onClick={handleBulkAddQuiz} 
                    disabled={syncing || !bulkInput.trim()}
                    className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-[2rem] font-black shadow-xl shadow-blue-100 transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {syncing ? <RefreshCw className="animate-spin" /> : <SaveIcon />}
                    บันทึกลงฐานข้อมูล
                  </button>
               </div>
            </section>
         </div>
      )}

      {activeTab === 'system' && (
         <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in duration-500">
            <section className="bg-white p-10 rounded-[3.5rem] shadow-xl">
               <h3 className="text-2xl font-black mb-6 flex items-center gap-2"><Database className="text-blue-500" /> Database Management</h3>
               <button onClick={handleSetupDatabase} className="w-full py-5 bg-blue-600 text-white rounded-[2rem] font-black shadow-lg flex items-center justify-center gap-3">
                  <ShieldCheck size={24} /> Initialize / Fix Database
               </button>
            </section>
            <section className="bg-white p-10 rounded-[3.5rem] shadow-xl">
               <h3 className="text-2xl font-black mb-6 flex items-center gap-2"><Server className="text-emerald-500" /> Server Status</h3>
               <div className="space-y-4">
                  <div className="flex justify-between p-4 bg-emerald-50 rounded-2xl font-black text-emerald-600">
                     <span>Connection</span>
                     <span>Online</span>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl text-xs font-medium text-slate-400">
                     Spreadsheet ID: {dbService.getSpreadsheetId()}
                  </div>
               </div>
            </section>
         </div>
      )}
    </div>
  );
};

export default AdminDashboard;
