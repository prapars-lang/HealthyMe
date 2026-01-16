
import React, { useState, useEffect } from 'react';
import { User, AvatarData, HealthLog, Item, UserItem, ShopReward, RedemptionRecord, SocialAction, Card, UserCard } from '../types';
import { dbService } from '../services/dbService';
import { getAICoachFeedback } from '../geminiService';
import { ITEMS_SHOP, EMOJI_POOL, ENCOURAGING_STICKERS } from '../constants';
import { Zap, Coins, Plus, Box as BoxIcon, CheckCircle, Brain, Briefcase, Flame, ShoppingCart, Sparkles, X, User as UserIcon, MessageCircle, RefreshCw, Gift, Users, Heart, Send, Search, BookOpen, Layers, Shield, Sword, Activity, Lock } from 'lucide-react';
import HealthLogForm from '../components/HealthLogForm';
import HealthQuiz from '../components/MiniGame';
import Leaderboard from '../components/Leaderboard';
import Swal from 'sweetalert2';

interface StudentHomeProps {
  user: User;
}

const StudentHome: React.FC<StudentHomeProps> = ({ user }) => {
  const [avatar, setAvatar] = useState<AvatarData | null>(null);
  const [userItems, setUserItems] = useState<UserItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showGame, setShowGame] = useState(false);
  const [showBox, setShowBox] = useState(false);
  const [showBackpack, setShowBackpack] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showFriends, setShowFriends] = useState(false);
  const [showCards, setShowCards] = useState(false);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  
  const [rewards, setRewards] = useState<ShopReward[]>([]);
  const [myRedemptions, setMyRedemptions] = useState<RedemptionRecord[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [socialActions, setSocialActions] = useState<SocialAction[]>([]);
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [allCards, setAllCards] = useState<Card[]>([]);
  const [myCards, setMyCards] = useState<UserCard[]>([]);
  
  const [loadingData, setLoadingData] = useState(true);
  const [savingHealth, setSavingHealth] = useState(false);
  const [isAlreadyLogged, setIsAlreadyLogged] = useState(false);
  const [isBoxAlreadyOpened, setIsBoxAlreadyOpened] = useState(false);
  const [userLogs, setUserLogs] = useState<HealthLog[]>([]);
  const [todayLog, setTodayLog] = useState<HealthLog | null>(null);
  const [openingBox, setOpeningBox] = useState(false);
  const [aiInsight, setAiInsight] = useState<string>('');
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [wonItem, setWonItem] = useState<Item | null>(null);

  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    refreshData();
  }, [user.id]);

  const refreshData = async () => {
    setLoadingData(true);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const [avatarData, allLogs, boxLogs, items, shopItems, userClaims, friendsList, actions, allUsers, cards, userCards] = await Promise.all([
        dbService.getAvatar(user.id),
        dbService.getAllHealthLogs(),
        dbService.getBoxLogs(user.id),
        dbService.getUserItems(user.id),
        dbService.getShopRewards(),
        dbService.getRedemptions(user.id),
        dbService.getFriends(user.id),
        dbService.getSocialActions(user.id),
        dbService.getLeaderboard(user.class),
        dbService.getCards(),
        dbService.getUserCards(user.id)
      ]);
      
      setAvatar(avatarData);
      setUserItems(items);
      setRewards(shopItems);
      setMyRedemptions(userClaims);
      setFriends(friendsList);
      setSocialActions(actions);
      setAllStudents(allUsers.filter(u => u.user_id !== user.id));
      setAllCards(cards);
      setMyCards(userCards);
      
      const myLogs = allLogs.filter((l: any) => l.user_id === user.id);
      setUserLogs(myLogs);
      
      const foundTodayLog = myLogs.find((l: any) => 
        new Date(l.date).toISOString().split('T')[0] === todayStr
      );
      setTodayLog(foundTodayLog || null);
      setIsAlreadyLogged(!!foundTodayLog);

      const hasTodayBox = boxLogs.some((l: any) => 
        new Date(l[2]).toISOString().split('T')[0] === todayStr
      );
      setIsBoxAlreadyOpened(hasTodayBox);

      fetchAiInsight(foundTodayLog || null, myLogs, avatarData?.level || 1);
    } catch (e) {
      console.error("Refresh data error", e);
    } finally {
      setLoadingData(false);
    }
  };

  const fetchAiInsight = async (current: HealthLog | null, history: HealthLog[], level: number) => {
    setLoadingInsight(true);
    try {
      const feedback = await getAICoachFeedback(current, history, level, user.fullname);
      setAiInsight(feedback);
    } catch (e) {
      setAiInsight("ยินดีต้อนรับกลับมาครับฮีโร่! มาเริ่มบันทึกสุขภาพกันเถอะ ✨");
    } finally {
      setLoadingInsight(false);
    }
  };

  const handleHealthSave = async (log: any) => {
    setSavingHealth(true);
    try {
      const result = await dbService.saveHealthLog(log);
      if (!result.success) {
        Swal.fire({ title: 'โอ๊ะ!', text: result.message, icon: 'info' });
        setShowForm(false);
        return;
      }
      setShowForm(false);
      Swal.fire({ title: 'สำเร็จ!', text: `บันทึกข้อมูลแล้ว ได้รับ EXP และเหรียญ!`, icon: 'success', timer: 3000 });
      await refreshData();
    } catch (err: any) {
      Swal.fire({ title: 'ผิดพลาด', text: err.message, icon: 'error' });
    } finally {
      setSavingHealth(false);
    }
  };

  const handleOpenMysteryBox = async () => {
    if (openingBox || isBoxAlreadyOpened) return;
    if ((avatar?.coin || 0) < 20) {
      Swal.fire('เหรียญไม่พอ!', 'ต้องใช้ 20 เหรียญในการเปิดกล่องสุ่มนะจ๊ะ', 'warning');
      return;
    }
    setOpeningBox(true);
    setWonItem(null);
    setTimeout(async () => {
      try {
        const randomItem = ITEMS_SHOP[Math.floor(Math.random() * ITEMS_SHOP.length)];
        const res = await dbService.openMysteryBox(user.id, randomItem.id);
        if (res.success) {
          setWonItem(randomItem);
          await refreshData();
        }
      } catch (e) {
        Swal.fire('โอ๊ะ!', 'กล่องสมบัติล็อคแน่นเกินไป ลองใหม่อีกครั้งนะ', 'error');
        setShowBox(false);
      } finally {
        setOpeningBox(false);
      }
    }, 2000);
  };

  const handleMarkAsRead = async () => {
    if (socialActions.filter(a => !a.is_read).length > 0) {
      await dbService.markActionsAsRead(user.id);
      setSocialActions(prev => prev.map(a => ({...a, is_read: true})));
    }
  };

  const handleChangeBaseEmoji = async (emoji: string) => {
    try {
      const res = await dbService.updateBaseEmoji(user.id, emoji);
      if (res.success) {
        setAvatar(prev => prev ? { ...prev, base_emoji: emoji } : null);
        setShowEmojiPicker(false);
        Swal.fire({ title: 'สำเร็จ!', text: 'เปลี่ยนตัวละครแล้ว', icon: 'success', timer: 2000, showConfirmButton: false });
      }
    } catch (e) {
      Swal.fire('ผิดพลาด', 'ไม่สามารถเปลี่ยนตัวละครได้', 'error');
    }
  };

  const handleAddFriend = async (friendId: string) => {
    try {
      const res = await dbService.addFriend(user.id, friendId);
      if (res.success) {
        Swal.fire({ title: 'สำเร็จ!', text: 'เพิ่มเพื่อนแล้ว', icon: 'success', timer: 2000, showConfirmButton: false });
        await refreshData();
      }
    } catch (e: any) {
      Swal.fire('ผิดพลาด', e.message || 'ไม่สามารถเพิ่มเพื่อนได้', 'error');
    }
  };

  const handleEquip = async (itemId: string) => {
    try {
      const res = await dbService.equipItem(user.id, itemId);
      if (res.success) {
        await refreshData();
        Swal.fire({ title: 'สำเร็จ!', text: 'ปรับปรุงสถานะไอเทมแล้ว', icon: 'success', timer: 1500, showConfirmButton: false });
      }
    } catch (e) {
      Swal.fire('ผิดพลาด', 'ไม่สามารถปรับเปลี่ยนไอเทมได้', 'error');
    }
  };

  const handleRedeem = async (reward: ShopReward) => {
    const confirm = await Swal.fire({
      title: 'ยืนยันการแลกรางวัล?',
      text: `คุณต้องการใช้ ${reward.cost} เหรียญ เพื่อแลก ${reward.title} ใช่หรือไม่?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'ยืนยัน',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#f59e0b'
    });

    if (confirm.isConfirmed) {
      try {
        const res = await dbService.redeemReward(user.id, reward.id, reward.cost);
        if (res.success) {
          Swal.fire('สำเร็จ!', 'แลกรางวัลเรียบร้อยแล้ว ตรวจสอบ Code ได้ที่ประวัติการแลก', 'success');
          await refreshData();
        }
      } catch (e: any) {
        Swal.fire('ผิดพลาด', e.message || 'ไม่สามารถแลกรางวัลได้', 'error');
      }
    }
  };

  const expPercentage = avatar ? (avatar.exp / (avatar.level * 100)) * 100 : 0;
  const unreadCount = socialActions.filter(a => !a.is_read).length;
  const equippedItem = ITEMS_SHOP.find(i => String(i.id) === String(avatar?.equipped_item_id));

  return (
    <div className="space-y-8 pb-24 max-w-4xl mx-auto">
      {/* Profile Section */}
      <section className="bg-white rounded-[2.5rem] p-8 shadow-xl border-4 border-white relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity"><Zap size={160} /></div>
        <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
          <div className="relative">
            <button onClick={() => setShowEmojiPicker(true)} className="w-32 h-32 bg-gradient-to-tr from-yellow-100 to-orange-200 rounded-[2.5rem] flex items-center justify-center text-6xl border-4 border-white shadow-xl transform transition-all hover:scale-105 active:scale-95 relative overflow-hidden">
               <span className={`${equippedItem ? 'opacity-30 scale-75 translate-y-3' : 'opacity-100'}`}>{avatar?.base_emoji || '🧑‍🚀'}</span>
               {equippedItem && <span className="absolute inset-0 flex items-center justify-center text-5xl animate-bounce" style={{ animationDuration: '3s' }}>{equippedItem.image}</span>}
               <div className="absolute inset-0 bg-black/0 hover:bg-black/10 flex items-center justify-center opacity-0 hover:opacity-100 transition-all"><UserIcon className="text-white" size={32} /></div>
            </button>
            {avatar?.streak_count && avatar.streak_count > 0 && <div className="absolute -top-2 -left-2 bg-orange-500 text-white px-3 py-1 rounded-full flex items-center gap-1 text-xs font-black border-2 border-white shadow-lg animate-bounce"><Flame size={14} fill="white" /> {avatar.streak_count} วันติด!</div>}
            <div className="absolute -bottom-2 -right-2 bg-blue-600 text-white w-10 h-10 rounded-2xl flex items-center justify-center font-black border-4 border-white text-sm shadow-lg">{avatar?.level}</div>
          </div>
          <div className="flex-grow w-full text-center md:text-left">
            <h2 className="text-3xl font-black text-slate-800 mb-1 tracking-tight">ฮีโร่ {user.fullname}</h2>
            <div className="flex flex-wrap items-center gap-2 justify-center md:justify-start mb-6">
              <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Class {user.class}</span>
              <div className="bg-amber-100 px-3 py-1 rounded-full flex items-center gap-1 text-[10px] font-black text-amber-600 uppercase tracking-widest"><Coins size={12} /> {avatar?.coin}</div>
              {equippedItem && <div className="bg-emerald-100 text-emerald-600 px-3 py-1 rounded-full flex items-center gap-1 text-[10px] font-black uppercase animate-pulse"><Sparkles size={12} /> {equippedItem.effect}</div>}
            </div>
            <div className="space-y-2">
               <div className="flex justify-between text-[10px] font-black text-blue-900/40 uppercase tracking-widest px-1"><span>LV.{avatar?.level} EXP</span><span>{avatar?.exp} / {avatar?.level ? avatar.level * 100 : 100}</span></div>
               <div className="relative w-full h-4 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${expPercentage}%` }}></div></div>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => { setShowFriends(true); handleMarkAsRead(); }} className="relative bg-white shadow-lg p-4 rounded-3xl border-2 border-slate-50 hover:bg-slate-50 transition-all active:scale-90">
              <Users className="text-blue-500" size={28} />
              {unreadCount > 0 && <span className="absolute -top-2 -right-2 bg-rose-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black border-2 border-white animate-bounce">{unreadCount}</span>}
            </button>
            <button onClick={() => setShowCards(true)} className="bg-white shadow-lg p-4 rounded-3xl border-2 border-slate-50 hover:bg-slate-50 transition-all active:scale-90">
              <Layers className="text-indigo-500" size={28} />
            </button>
          </div>
        </div>
      </section>

      {/* Main Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <button onClick={() => !isAlreadyLogged && setShowForm(true)} disabled={isAlreadyLogged} className={`${isAlreadyLogged ? 'bg-emerald-50 text-emerald-600 border-2 border-emerald-100' : 'bg-blue-500 text-white shadow-xl'} p-6 rounded-[2.5rem] transition-all flex flex-col items-center gap-2 group active:scale-95`}>
          <div className={`p-4 ${isAlreadyLogged ? 'bg-emerald-100' : 'bg-white/20'} rounded-2xl group-hover:scale-110 transition-transform`}>{isAlreadyLogged ? <CheckCircle size={32} /> : <Plus size={32} strokeWidth={3} />}</div>
          <span className="font-black text-sm">{isAlreadyLogged ? 'บันทึกแล้ว' : 'บันทึกสุขภาพ'}</span>
        </button>
        <button onClick={() => setShowGame(true)} className="bg-purple-500 p-6 rounded-[2.5rem] shadow-xl transition-all flex flex-col items-center gap-2 text-white group active:scale-95"><div className="p-4 bg-white/20 rounded-2xl group-hover:scale-110 transition-transform"><Brain size={32} /></div><span className="font-black text-sm">ควิซสมองไว</span></button>
        <button onClick={() => setShowShop(true)} className="bg-amber-500 p-6 rounded-[2.5rem] shadow-xl transition-all flex flex-col items-center gap-2 text-white group active:scale-95"><div className="p-4 bg-white/20 rounded-2xl group-hover:scale-110 transition-transform"><ShoppingCart size={32} /></div><span className="font-black text-sm">Hero Shop</span></button>
        <button onClick={() => setShowCards(true)} className="bg-indigo-600 p-6 rounded-[2.5rem] shadow-xl transition-all flex flex-col items-center gap-2 text-white group active:scale-95"><div className="p-4 bg-white/20 rounded-2xl group-hover:scale-110 transition-transform"><BookOpen size={32} /></div><span className="font-black text-sm">สมุดการ์ด</span></button>
        <button onClick={() => setShowBox(true)} disabled={isBoxAlreadyOpened} className={`${isBoxAlreadyOpened ? 'bg-orange-300 opacity-60' : 'bg-orange-500 shadow-xl'} p-6 rounded-[2.5rem] transition-all flex flex-col items-center gap-2 text-white group active:scale-95`}><div className="p-4 bg-white/20 rounded-2xl group-hover:scale-110 transition-transform"><BoxIcon size={32} /></div><span className="font-black text-sm">{isBoxAlreadyOpened ? 'เปิดแล้ววันนี้' : 'Mystery Box'}</span></button>
        <button onClick={() => setShowBackpack(true)} className="bg-indigo-500 p-6 rounded-[2.5rem] shadow-xl transition-all flex flex-col items-center gap-2 text-white group active:scale-95"><div className="p-4 bg-white/20 rounded-2xl group-hover:scale-110 transition-transform relative"><Briefcase size={32} /></div><span className="font-black text-sm">ไอเทม</span></button>
      </div>

      <Leaderboard className={user.class} currentUserId={user.id} />

      {/* Hero Card Binder Modal */}
      {showCards && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xl">
           <div className="bg-[#1e1e2e] rounded-[3.5rem] w-full max-w-5xl max-h-[90vh] flex flex-col shadow-[0_0_100px_rgba(79,70,229,0.3)] border-[12px] border-[#2d2d3d] animate-in zoom-in duration-300 overflow-hidden relative">
              {/* Binder Rings Decor */}
              <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col gap-10 opacity-20 pointer-events-none">
                 {[1,2,3,4,5].map(i => <div key={i} className="w-8 h-8 rounded-full border-4 border-white"></div>)}
              </div>

              <div className="p-10 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-[#2d2d3d] to-[#1e1e2e]">
                 <div>
                    <h3 className="text-3xl font-black flex items-center gap-3 text-indigo-400 italic"><Layers size={32} /> HERO CARD BINDER</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-1">สมุดสะสมการ์ดพลังสุขภาพประจำตัว</p>
                 </div>
                 <div className="flex items-center gap-6">
                    <div className="bg-white/5 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10 text-sm font-black text-indigo-300 flex items-center gap-3">
                       <Zap size={16} /> การ์ดที่ครอบครอง: {myCards.length} / {allCards.length}
                    </div>
                    <button onClick={() => { setShowCards(false); setSelectedCard(null); }} className="p-3 text-slate-400 hover:text-white transition-colors hover:rotate-90"><X size={24}/></button>
                 </div>
              </div>
              
              <div className="flex-grow overflow-y-auto p-12 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 custom-scrollbar bg-[#161621]">
                 {allCards.map(card => {
                    const hasCard = myCards.some(mc => mc.card_id === card.id);
                    const isLegendary = card.rarity === 'Legendary';
                    const isRare = card.rarity === 'Rare';
                    
                    return (
                       <div 
                         key={card.id} 
                         onClick={() => hasCard && setSelectedCard(card)}
                         className={`group relative aspect-[3/4] rounded-[1.5rem] p-3 flex flex-col items-center transition-all duration-500 ${hasCard ? 'cursor-pointer hover:scale-105 active:scale-95 shadow-2xl hover:z-10' : 'opacity-40 grayscale'}`}
                       >
                          {/* Card Background Layer */}
                          <div className={`absolute inset-0 rounded-[1.5rem] border-4 ${hasCard ? (isLegendary ? 'bg-gradient-to-br from-amber-400 via-orange-500 to-rose-600 border-yellow-200 shadow-[0_0_20px_rgba(245,158,11,0.3)]' : isRare ? 'bg-gradient-to-br from-indigo-500 to-purple-600 border-indigo-300 shadow-[0_0_20px_rgba(99,102,241,0.3)]' : 'bg-gradient-to-br from-blue-400 to-emerald-500 border-blue-200 shadow-[0_0_20px_rgba(59,130,246,0.3)]') : 'bg-slate-800 border-slate-700'}`}></div>
                          
                          {/* Shiny Effect for Legendaries */}
                          {hasCard && isLegendary && <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none rounded-[1.5rem]"></div>}

                          <div className="relative z-10 w-full h-full flex flex-col">
                             <div className="flex justify-between items-center mb-1">
                                <span className="text-[7px] font-black text-white/60 uppercase tracking-tighter">{card.id}</span>
                                {hasCard ? (
                                   <div className="bg-white/20 px-2 py-0.5 rounded-full text-[6px] font-black text-white uppercase">{card.rarity}</div>
                                ) : <Lock size={8} className="text-white/40" />}
                             </div>

                             <div className="flex-grow bg-black/10 rounded-xl flex items-center justify-center text-5xl shadow-inner mb-3 overflow-hidden border border-white/10 relative">
                                {hasCard ? (
                                   card.image.startsWith('http') ? <img src={card.image} className="w-full h-full object-cover" /> : <span className="drop-shadow-lg">{card.image}</span>
                                ) : <div className="text-white/10 flex flex-col items-center gap-2"><Lock size={32}/><p className="text-[8px] font-black">LOCKED</p></div>}
                             </div>

                             <div className="text-center">
                                <h4 className={`font-black text-[10px] leading-none mb-2 ${hasCard ? 'text-white' : 'text-slate-500'}`}>{hasCard ? card.title : '?????'}</h4>
                                {hasCard && (
                                   <div className="grid grid-cols-3 gap-1 px-1">
                                      <div className="bg-black/20 rounded-md py-1 flex flex-col items-center">
                                         <p className="text-[4px] font-black text-white/50 uppercase">HP</p>
                                         <p className="text-[7px] font-black text-white">{card.power_stats.health}</p>
                                      </div>
                                      <div className="bg-black/20 rounded-md py-1 flex flex-col items-center">
                                         <p className="text-[4px] font-black text-white/50 uppercase">INT</p>
                                         <p className="text-[7px] font-black text-white">{card.power_stats.brain}</p>
                                      </div>
                                      <div className="bg-black/20 rounded-md py-1 flex flex-col items-center">
                                         <p className="text-[4px] font-black text-white/50 uppercase">ENG</p>
                                         <p className="text-[7px] font-black text-white">{card.power_stats.energy}</p>
                                      </div>
                                   </div>
                                )}
                             </div>
                          </div>
                       </div>
                    );
                 })}
              </div>
           </div>
           
           {/* Card Detail Modal (Overlay) */}
           {selectedCard && (
             <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/80 animate-in fade-in duration-300">
                <div className="bg-white rounded-[3rem] w-full max-w-2xl overflow-hidden shadow-[0_0_80px_rgba(255,255,255,0.2)] animate-in zoom-in slide-in-from-bottom-12 duration-500 flex flex-col md:flex-row">
                   <div className={`md:w-1/2 p-8 flex items-center justify-center ${selectedCard.rarity === 'Legendary' ? 'bg-amber-500' : selectedCard.rarity === 'Rare' ? 'bg-indigo-500' : 'bg-blue-500'}`}>
                      <div className="w-full aspect-[3/4] bg-white rounded-[2rem] shadow-2xl p-4 border-[10px] border-white/20 relative overflow-hidden group">
                         <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-black/20"></div>
                         <div className="relative z-10 w-full h-full bg-slate-100 rounded-xl overflow-hidden flex items-center justify-center text-9xl shadow-inner">
                           {selectedCard.image.startsWith('http') ? <img src={selectedCard.image} className="w-full h-full object-cover" /> : selectedCard.image}
                         </div>
                         <div className="absolute top-4 left-4 z-20 bg-white/80 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black uppercase shadow-sm">{selectedCard.rarity}</div>
                      </div>
                   </div>
                   <div className="md:w-1/2 p-10 space-y-8 bg-slate-50">
                      <div className="flex justify-between items-start">
                         <div>
                            <h2 className="text-3xl font-black text-slate-800 tracking-tight">{selectedCard.title}</h2>
                            <p className="text-xs font-black text-blue-500 uppercase tracking-widest mt-1">Hero Card ID: {selectedCard.id}</p>
                         </div>
                         <button onClick={() => setSelectedCard(null)} className="p-2 text-slate-300 hover:text-slate-500 transition-colors"><X /></button>
                      </div>
                      
                      <p className="text-sm font-bold text-slate-500 leading-relaxed italic border-l-4 border-slate-200 pl-4">
                         "{selectedCard.description}"
                      </p>

                      <div className="grid grid-cols-1 gap-4">
                         <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-3"><div className="p-2 bg-rose-50 rounded-xl text-rose-500"><Heart size={20} /></div><span className="font-black text-slate-700">Health (พลังกาย)</span></div>
                            <span className="text-2xl font-black text-rose-500">{selectedCard.power_stats.health}</span>
                         </div>
                         <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-3"><div className="p-2 bg-blue-50 rounded-xl text-blue-500"><Brain size={20} /></div><span className="font-black text-slate-700">Brain (สติปัญญา)</span></div>
                            <span className="text-2xl font-black text-blue-500">{selectedCard.power_stats.brain}</span>
                         </div>
                         <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-3"><div className="p-2 bg-orange-50 rounded-xl text-orange-500"><Zap size={20} /></div><span className="font-black text-slate-700">Energy (พลังงาน)</span></div>
                            <span className="text-2xl font-black text-orange-500">{selectedCard.power_stats.energy}</span>
                         </div>
                      </div>
                      
                      <button onClick={() => setSelectedCard(null)} className="w-full py-4 bg-slate-800 text-white rounded-2xl font-black shadow-lg hover:bg-slate-900 transition-all active:scale-95">ปิดรายละเอียด</button>
                   </div>
                </div>
             </div>
           )}
        </div>
      )}

      {/* Emoji Picker Modal */}
      {showEmojiPicker && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
           <div className="bg-white rounded-[3rem] w-full max-w-lg p-10 shadow-2xl border-8 border-white animate-in zoom-in duration-300">
              <div className="flex justify-between items-center mb-8">
                 <h3 className="text-2xl font-black text-slate-800">เปลี่ยนตัวละคร</h3>
                 <button onClick={() => setShowEmojiPicker(false)} className="p-2 text-slate-300 hover:text-slate-600"><X /></button>
              </div>
              <div className="grid grid-cols-4 gap-4 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                 {EMOJI_POOL.heroes.map(emoji => (
                    <button 
                      key={emoji} 
                      onClick={() => handleChangeBaseEmoji(emoji)}
                      className={`text-4xl p-4 bg-slate-50 rounded-2xl hover:bg-blue-50 transition-all hover:scale-110 active:scale-90 border-2 ${avatar?.base_emoji === emoji ? 'border-blue-500 shadow-md' : 'border-transparent'}`}
                    >
                       {emoji}
                    </button>
                 ))}
              </div>
           </div>
        </div>
      )}

      {/* Friends Hub Modal */}
      {showFriends && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
           <div className="bg-white rounded-[3.5rem] w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl border-8 border-white animate-in zoom-in duration-300 overflow-hidden">
              <div className="p-8 border-b flex justify-between items-center bg-blue-50">
                 <div><h3 className="text-2xl font-black flex items-center gap-2"><Users className="text-blue-500" /> Friends Hub</h3></div>
                 <button onClick={() => setShowFriends(false)} className="p-3 text-slate-400 hover:text-slate-600"><X /></button>
              </div>
              <div className="flex-grow overflow-hidden flex flex-col md:flex-row">
                 <div className="md:w-1/2 border-r overflow-y-auto p-6 space-y-4 custom-scrollbar">
                    {friends.length > 0 ? friends.map(f => (
                      <div key={f.user_id} className="p-4 bg-slate-50 rounded-[2rem] flex items-center gap-4 group hover:bg-blue-50 transition-all">
                         <div className="text-3xl bg-white p-2 rounded-2xl shadow-sm">{f.base_emoji}</div>
                         <div className="flex-grow"><p className="font-black text-slate-700 text-sm truncate">{f.fullname}</p><p className="text-[10px] font-black text-blue-500">Level {f.level}</p></div>
                      </div>
                    )) : <div className="py-10 text-center opacity-30 italic font-bold">ยังไม่มีเพื่อนเบย...</div>}
                 </div>
                 <div className="md:w-1/2 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-slate-50/50">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">นักเรียนในชั้น</h4>
                    {allStudents.map(s => {
                       const isFriend = friends.some(f => f.user_id === s.user_id);
                       return (
                         <div key={s.user_id} className="p-4 bg-white rounded-[2rem] flex items-center justify-between gap-4 border border-slate-100 shadow-sm">
                            <div className="flex items-center gap-3">
                               <div className="text-2xl">{s.base_emoji}</div>
                               <div><p className="font-black text-slate-700 text-[11px] truncate w-24">{s.fullname}</p><p className="text-[9px] font-bold text-slate-400">LV.{s.level}</p></div>
                            </div>
                            {isFriend ? <span className="text-[9px] font-black text-emerald-500 bg-emerald-50 px-2 py-1 rounded-lg">เพื่อนแล้ว</span> : <button onClick={() => handleAddFriend(s.user_id)} className="bg-blue-600 text-white p-2 rounded-xl shadow-md active:scale-90"><Plus size={14} /></button>}
                         </div>
                       );
                    })}
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Other Modals */}
      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-xl"><HealthLogForm userId={user.id} onSave={handleHealthSave} onCancel={() => setShowForm(false)} isSaving={savingHealth} /></div>
        </div>
      )}
      {showGame && (
        <div className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-md flex flex-col p-4 items-center justify-center"><HealthQuiz userId={user.id} onEnd={(score) => { dbService.updateAvatarStats(user.id, score); setShowGame(false); refreshData(); }} /></div>
      )}
      {showBox && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
           <div className="bg-white rounded-[3rem] w-full max-w-md p-10 shadow-2xl border-8 border-white animate-in zoom-in flex flex-col items-center">
              <div className="flex justify-between w-full mb-6"><h3 className="text-2xl font-black text-slate-800">Mystery Box</h3><button onClick={() => { setShowBox(false); setWonItem(null); }} className="p-2 text-slate-400 hover:text-slate-600"><X /></button></div>
              {!wonItem ? (
                <div className="text-center space-y-8 w-full py-6">
                   <div className={`text-9xl mb-4 transition-all duration-500 ${openingBox ? 'animate-bounce' : 'animate-wiggle'}`}>🎁</div>
                   <button onClick={handleOpenMysteryBox} disabled={openingBox} className="w-full bg-orange-500 text-white font-black py-5 rounded-[2rem] shadow-xl flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50">{openingBox ? <RefreshCw className="animate-spin" /> : <Sparkles />} {openingBox ? 'กำลังเปิดกล่อง...' : 'เปิดกล่องเลย!'}</button>
                </div>
              ) : (
                <div className="text-center space-y-8 w-full py-6 animate-in zoom-in duration-500">
                   <div className="text-9xl relative z-10 animate-bounce">{wonItem.image}</div>
                   <h4 className="text-2xl font-black text-emerald-600">ยินดีด้วย! คุณได้รับ "{wonItem.item_name}"</h4>
                   <button onClick={() => { setShowBox(false); setWonItem(null); }} className="w-full bg-emerald-500 text-white font-black py-5 rounded-[2rem] active:scale-95">เก็บเข้ากระเป๋า</button>
                </div>
              )}
           </div>
        </div>
      )}

      {/* Backpack / Item Inventory Modal */}
      {showBackpack && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
           <div className="bg-white rounded-[3.5rem] w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl border-8 border-white animate-in zoom-in duration-300 overflow-hidden">
              <div className="p-8 border-b flex justify-between items-center bg-indigo-50">
                 <div>
                    <h3 className="text-2xl font-black flex items-center gap-2"><Briefcase className="text-indigo-500" /> Backpack ของฮีโร่</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">ไอเทมที่ได้จากการเปิด Mystery Box</p>
                 </div>
                 <button onClick={() => setShowBackpack(false)} className="p-3 text-slate-400 hover:text-slate-600"><X /></button>
              </div>
              <div className="flex-grow overflow-y-auto p-8 grid grid-cols-2 md:grid-cols-4 gap-6 custom-scrollbar bg-slate-50">
                 {userItems.length > 0 ? userItems.map((ui, i) => {
                    const item = ITEMS_SHOP.find(it => it.id === ui.item_id);
                    if (!item) return null;
                    const isEquipped = avatar?.equipped_item_id === String(item.id);
                    return (
                       <div key={i} className={`bg-white p-6 rounded-[2rem] flex flex-col items-center text-center shadow-sm border-2 transition-all group ${isEquipped ? 'border-indigo-400 bg-indigo-50/30' : 'border-transparent'}`}>
                          <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">{item.image}</div>
                          <h4 className="font-black text-sm text-slate-800 mb-1 leading-tight">{item.item_name}</h4>
                          <p className="text-[8px] font-bold text-indigo-500 uppercase tracking-tighter mb-4">{item.effect}</p>
                          <button onClick={() => handleEquip(item.id)} className={`w-full py-2 rounded-xl text-[10px] font-black transition-all ${isEquipped ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400 hover:bg-indigo-100 hover:text-indigo-600'}`}>{isEquipped ? 'ถอดออก' : 'สวมใส่'}</button>
                       </div>
                    );
                 }) : <div className="col-span-full py-20 text-center text-slate-300 italic">กระเป๋ายังว่างเปล่า...</div>}
              </div>
           </div>
        </div>
      )}

      {/* Hero Shop Modal */}
      {showShop && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
           <div className="bg-white rounded-[3.5rem] w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl border-8 border-white animate-in zoom-in duration-300 overflow-hidden">
              <div className="p-8 border-b flex justify-between items-center bg-amber-50">
                 <div className="flex items-center gap-4">
                    <div className="p-4 bg-white rounded-2xl shadow-sm text-amber-500"><ShoppingCart size={32} /></div>
                    <div>
                       <h3 className="text-2xl font-black text-slate-800">Hero Shop</h3>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">แลกเปลี่ยนเหรียญเป็นของรางวัลจริง</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-4">
                    <div className="bg-white px-6 py-3 rounded-2xl shadow-inner border border-amber-100 flex items-center gap-2 font-black text-amber-600">
                       <Coins size={20} /> {avatar?.coin}
                    </div>
                    <button onClick={() => setShowShop(false)} className="p-3 text-slate-400 hover:text-slate-600"><X /></button>
                 </div>
              </div>
              <div className="flex-grow overflow-hidden flex flex-col md:flex-row">
                 <div className="md:w-2/3 overflow-y-auto p-10 grid grid-cols-1 sm:grid-cols-2 gap-6 custom-scrollbar bg-slate-50/30">
                    {rewards.map(reward => (
                       <div key={reward.id} className="bg-white p-6 rounded-[2.5rem] shadow-sm border-2 border-slate-50 flex flex-col items-center text-center group hover:border-amber-400 transition-all">
                          <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">{reward.icon}</div>
                          <h4 className="font-black text-lg text-slate-800 mb-1">{reward.title}</h4>
                          <p className="text-xs font-bold text-slate-400 mb-4 h-8">{reward.description}</p>
                          <div className="w-full flex justify-between items-center bg-slate-50 p-4 rounded-2xl">
                             <div className="text-left">
                                <p className="text-[8px] font-black text-slate-300 uppercase">ราคา</p>
                                <p className="font-black text-amber-600 flex items-center gap-1">{reward.cost} <Coins size={12} /></p>
                             </div>
                             <button 
                                onClick={() => handleRedeem(reward)} 
                                disabled={(avatar?.coin || 0) < reward.cost}
                                className="bg-amber-500 text-white px-6 py-2 rounded-xl text-xs font-black shadow-md hover:brightness-110 disabled:grayscale transition-all active:scale-95"
                             >
                                แลกเลย!
                             </button>
                          </div>
                       </div>
                    ))}
                 </div>
                 <div className="md:w-1/3 border-l overflow-y-auto p-8 bg-white custom-scrollbar">
                    <h4 className="font-black text-slate-800 mb-6 flex items-center gap-2"><RefreshCw size={18} className="text-blue-500" /> ประวัติการแลก</h4>
                    <div className="space-y-4">
                       {myRedemptions.length > 0 ? myRedemptions.map(r => {
                          const item = rewards.find(it => it.id === r.reward_id);
                          return (
                             <div key={r.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 group relative">
                                <div className="flex items-center gap-3">
                                   <div className="text-2xl">{item?.icon || '🎁'}</div>
                                   <div>
                                      <p className="font-black text-slate-700 text-[11px] truncate w-32">{item?.title || 'รายการแลก'}</p>
                                      <p className="text-[9px] font-black text-blue-500">Code: {r.code}</p>
                                   </div>
                                </div>
                                <div className={`mt-3 px-3 py-1 rounded-full text-[8px] font-black uppercase text-center ${r.status === 'completed' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                                   {r.status === 'completed' ? 'รับแล้ว ✅' : 'รอรับ ⏳'}
                                </div>
                             </div>
                          );
                       }) : <div className="py-20 text-center text-slate-300 italic text-sm">ยังไม่มีประวัติการแลก</div>}
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default StudentHome;
