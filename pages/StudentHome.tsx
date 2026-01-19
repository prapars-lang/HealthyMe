
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, AvatarData, HealthLog } from '../types';
import { dbService } from '../services/dbService';
import { getAICoachFeedback } from '../geminiService';
import { ITEMS_SHOP, EMOJI_POOL } from '../constants';
import { Coins, Plus, Box as BoxIcon, CheckCircle, Brain, Briefcase, ShoppingCart, Sparkles, X, RefreshCw, Lock, Clock, Heart, Activity, Layers, Flame, Edit3 } from 'lucide-react';
import HealthLogForm from '../components/HealthLogForm';
import HealthQuiz from '../components/MiniGame';
import Leaderboard from '../components/Leaderboard';
import Swal from 'sweetalert2';

interface StudentHomeProps { user: User; }

const StudentHome: React.FC<StudentHomeProps> = ({ user }) => {
  const navigate = useNavigate();
  const [avatar, setAvatar] = useState<AvatarData | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showGame, setShowGame] = useState(false);
  const [showBox, setShowBox] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isBoxLocked, setIsBoxLocked] = useState(false);
  const [daysUntilNextBox, setDaysUntilNextBox] = useState(0);
  const [isAlreadyLogged, setIsAlreadyLogged] = useState(false);
  const [openingBox, setOpeningBox] = useState(false);
  const [aiInsight, setAiInsight] = useState<string>('');
  const [wonItem, setWonItem] = useState<any | null>(null);

  useEffect(() => { refreshData(); }, [user.id]);

  const refreshData = async () => {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const [avatarData, allLogs, boxLogs] = await Promise.all([
        dbService.getAvatar(user.id),
        dbService.getAllHealthLogs(),
        dbService.getBoxLogs(user.id)
      ]);
      setAvatar(avatarData);
      
      const myLogs = allLogs.filter((l: any) => l.user_id === user.id);
      setIsAlreadyLogged(myLogs.some((l: any) => l.date?.startsWith(todayStr)));

      if (boxLogs.length > 0) {
        const lastOpen = new Date(boxLogs[0].opened_at);
        const now = new Date();
        const diffTime = now.getTime() - lastOpen.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays < 7) {
          setIsBoxLocked(true);
          setDaysUntilNextBox(7 - diffDays);
        } else {
          setIsBoxLocked(false);
        }
      }

      getAICoachFeedback(null, myLogs, avatarData?.level || 1, user.fullname).then(setAiInsight);
    } catch (e) { console.error(e); }
  };

  const handleChangeEmoji = async (emoji: string) => {
    await dbService.updateBaseEmoji(user.id, emoji);
    setAvatar(prev => prev ? { ...prev, base_emoji: emoji } : null);
    setShowEmojiPicker(false);
    Swal.fire({ title: 'ร่างฮีโร่ใหม่!', text: 'คุณเปลี่ยนร่างฮีโร่สำเร็จแล้ว', icon: 'success', timer: 1500, showConfirmButton: false });
  };

  const handleOpenMysteryBox = async () => {
    if (openingBox || isBoxLocked) return;
    if ((avatar?.coin || 0) < 20) { Swal.fire('เหรียญไม่พอ!', 'ต้องใช้ 20 เหรียญนะจ๊ะ', 'warning'); return; }
    
    setOpeningBox(true);
    setTimeout(async () => {
      const randomItem = ITEMS_SHOP[Math.floor(Math.random() * ITEMS_SHOP.length)];
      const res = await dbService.openMysteryBox(user.id, randomItem.id);
      if (res.success) {
        setWonItem(randomItem);
        refreshData();
      }
      setOpeningBox(false);
    }, 2000);
  };

  const nextLvExp = (avatar?.level || 1) * 100;
  const progress = ((avatar?.exp || 0) / nextLvExp) * 100;

  return (
    <div className="space-y-8 pb-24 max-w-4xl mx-auto">
      <section className="bg-white rounded-[2.5rem] p-8 shadow-xl border-4 border-white flex flex-col md:flex-row items-center gap-8 relative overflow-hidden group">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-50 rounded-full opacity-50 group-hover:scale-110 transition-transform"></div>
        
        <div className="relative z-10">
          <div className="relative group/avatar">
            <div className="w-32 h-32 bg-gradient-to-tr from-blue-100 to-indigo-50 rounded-[2.5rem] flex items-center justify-center text-6xl shadow-xl transition-all group-hover/avatar:scale-105">
              {avatar?.base_emoji || '🧑‍🚀'}
            </div>
            <button 
              onClick={() => setShowEmojiPicker(true)}
              className="absolute -top-2 -left-2 bg-white text-blue-500 p-2 rounded-xl shadow-md border border-blue-50 opacity-0 group-hover/avatar:opacity-100 transition-all hover:scale-110"
            >
              <Edit3 size={16} />
            </button>
            <div className="absolute -bottom-2 -right-2 bg-blue-600 text-white w-10 h-10 rounded-2xl flex items-center justify-center font-black border-4 border-white text-sm shadow-lg">
              {avatar?.level}
            </div>
          </div>
        </div>

        <div className="flex-grow text-center md:text-left relative z-10 w-full">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-4">
            <div>
              <h2 className="text-3xl font-black text-slate-800 tracking-tight leading-tight">ฮีโร่ {user.fullname}</h2>
              <div className="flex gap-2 justify-center md:justify-start mt-2">
                <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-[10px] font-black uppercase">คลาส {user.class}</span>
                <div className="bg-amber-100 px-3 py-1 rounded-full flex items-center gap-1 text-[10px] font-black text-amber-600 shadow-sm"><Coins size={12} /> {avatar?.coin} Coins</div>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-orange-50 px-4 py-2 rounded-2xl border border-orange-100 self-center md:self-start shadow-sm">
              <Flame size={20} className="text-orange-500 animate-pulse" />
              <div>
                <p className="text-[8px] font-black text-orange-400 uppercase leading-none">Streak</p>
                <p className="text-xl font-black text-orange-600 leading-tight">{avatar?.streak_count || 0} Days</p>
              </div>
            </div>
          </div>

          <div className="space-y-2 mt-4">
            <div className="flex justify-between items-end">
              <p className="text-[10px] font-black text-slate-400 uppercase">Energy Progress</p>
              <p className="text-[10px] font-black text-blue-500 uppercase">{avatar?.exp} / {nextLvExp} EXP</p>
            </div>
            <div className="h-4 bg-slate-100 rounded-full overflow-hidden border-2 border-white shadow-inner">
              <div className="h-full bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500 transition-all duration-1000" style={{ width: `${progress}%` }}></div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Coach Card */}
      <div className="bg-white/60 backdrop-blur-md p-6 rounded-[2.5rem] border-4 border-white shadow-lg flex items-start gap-4 animate-in slide-in-from-bottom-4">
        <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-2xl shrink-0 shadow-sm">🤖</div>
        <p className="text-sm font-bold text-slate-600 italic leading-relaxed">"{aiInsight || 'พี่หมอกำลังเตรียมคำแนะนำให้ครับ...'}"</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <button onClick={() => !isAlreadyLogged && setShowForm(true)} disabled={isAlreadyLogged} className={`${isAlreadyLogged ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-blue-600 text-white shadow-blue-200'} p-6 rounded-[2.5rem] shadow-xl border-4 border-white flex flex-col items-center gap-2 active:scale-95 transition-all`}>
          <div className="p-4 bg-white/20 rounded-2xl">{isAlreadyLogged ? <CheckCircle size={32} /> : <Plus size={32} />}</div>
          <span className="font-black text-xs uppercase">{isAlreadyLogged ? 'บันทึกแล้ว' : 'บันทึกสุขภาพ'}</span>
        </button>
        <button onClick={() => navigate('/cards')} className="bg-purple-600 p-6 rounded-[2.5rem] shadow-xl border-4 border-white flex flex-col items-center gap-2 text-white shadow-purple-200 active:scale-95 transition-all">
          <div className="p-4 bg-white/20 rounded-2xl"><Layers size={32} /></div>
          <span className="font-black text-xs uppercase">สมุดสะสมการ์ด</span>
        </button>
        <button onClick={() => setShowGame(true)} className="bg-rose-500 p-6 rounded-[2.5rem] shadow-xl border-4 border-white flex flex-col items-center gap-2 text-white shadow-rose-200 active:scale-95 transition-all">
          <div className="p-4 bg-white/20 rounded-2xl"><Brain size={32} /></div>
          <span className="font-black text-xs uppercase">ควิซสมองไว</span>
        </button>
        <button onClick={() => setShowBox(true)} className={`${isBoxLocked ? 'bg-slate-300' : 'bg-orange-500 shadow-orange-200 shadow-xl'} p-6 rounded-[2.5rem] border-4 border-white flex flex-col items-center gap-2 text-white active:scale-95 transition-all`}>
          <div className="p-4 bg-white/20 rounded-2xl relative"><BoxIcon size={32} />{isBoxLocked && <Lock className="absolute top-0 right-0 text-slate-800" size={16}/>}</div>
          <span className="font-black text-[10px] uppercase">{isBoxLocked ? `อีก ${daysUntilNextBox} วัน` : 'Mystery Box'}</span>
        </button>
      </div>

      <Leaderboard className={user.class} currentUserId={user.id} />

      {/* Emoji Picker Modal */}
      {showEmojiPicker && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
           <div className="bg-white rounded-[3rem] w-full max-w-lg p-10 shadow-2xl animate-in zoom-in">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3"><Edit3 className="text-blue-500"/> เปลี่ยนร่างฮีโร่</h3>
                <button onClick={() => setShowEmojiPicker(false)} className="p-2 bg-slate-100 rounded-full text-slate-400 hover:bg-slate-200"><X size={20}/></button>
              </div>
              <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-6">เลือกตัวตนใหม่ที่สะท้อนพลังของคุณ</p>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 max-h-[400px] overflow-y-auto no-scrollbar p-2">
                {EMOJI_POOL.heroes.map((emoji, idx) => (
                  <button 
                    key={idx} 
                    onClick={() => handleChangeEmoji(emoji)}
                    className={`aspect-square rounded-2xl flex items-center justify-center text-4xl transition-all hover:scale-110 active:scale-90 ${avatar?.base_emoji === emoji ? 'bg-blue-600 shadow-lg scale-110 border-4 border-blue-200' : 'bg-slate-50 border-2 border-transparent hover:border-blue-100'}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
           </div>
        </div>
      )}

      {showBox && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
           <div className="bg-white rounded-[3rem] w-full max-w-md p-10 shadow-2xl flex flex-col items-center text-center animate-in zoom-in">
              <div className="flex justify-between w-full mb-6"><h3 className="text-2xl font-black text-slate-800">Mystery Box</h3><button onClick={() => { setShowBox(false); setWonItem(null); }} className="p-2 bg-slate-100 rounded-full text-slate-400 hover:bg-slate-200"><X size={20}/></button></div>
              {isBoxLocked ? (
                <div className="space-y-4 py-6">
                   <Clock className="w-16 h-16 text-slate-300 mx-auto" />
                   <p className="font-black text-slate-500 text-sm">ฮีโร่สามารถเปิดกล่องสมบัติได้ 1 ครั้งต่อสัปดาห์เท่านั้น <br/> อีก <strong>{daysUntilNextBox} วัน</strong> มาลองใหม่นะ!</p>
                </div>
              ) : !wonItem ? (
                <div className="space-y-6 w-full py-6">
                   <div className={`text-9xl ${openingBox ? 'animate-wiggle' : 'animate-bounce'}`}>🎁</div>
                   <button onClick={handleOpenMysteryBox} disabled={openingBox} className="w-full bg-orange-500 text-white font-black py-5 rounded-[2rem] shadow-xl flex items-center justify-center gap-3 active:scale-95">
                     {openingBox ? <RefreshCw className="animate-spin" /> : <Sparkles />} {openingBox ? 'กำลังลุ้น...' : 'เปิดกล่อง (20 Coins)'}
                   </button>
                </div>
              ) : (
                <div className="space-y-6 w-full py-6 animate-in zoom-in">
                   <div className="text-9xl animate-bounce">{wonItem.image}</div>
                   <h4 className="text-2xl font-black text-emerald-600">ได้รับ "{wonItem.item_name}"</h4>
                   <p className="text-slate-400 font-bold italic">"{wonItem.effect}"</p>
                   <button onClick={() => { setShowBox(false); setWonItem(null); }} className="w-full bg-emerald-500 text-white font-black py-5 rounded-[2rem] shadow-lg active:scale-95">เก็บเข้ากระเป๋าเลย!</button>
                </div>
              )}
           </div>
        </div>
      )}

      {showForm && <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"><HealthLogForm userId={user.id} onSave={(log)=>dbService.saveHealthLog(log).then(()=>{setShowForm(false); refreshData();})} onCancel={()=>setShowForm(false)}/></div>}
      {showGame && <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"><HealthQuiz userId={user.id} onEnd={()=>{setShowGame(false); refreshData();}}/></div>}
    </div>
  );
};

export default StudentHome;
