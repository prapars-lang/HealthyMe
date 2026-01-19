
import React, { useState, useEffect } from 'react';
import { dbService } from '../services/dbService';
import { User, ShopReward, AvatarData } from '../types';
// Added ShoppingCart to the imports from lucide-react
import { Coins, ShoppingBag, Gift, Check, Clock, X, Sparkles, History, Ticket, ClipboardList, ShoppingCart } from 'lucide-react';
import Swal from 'sweetalert2';

interface ShopProps { user: User; }

const Shop: React.FC<ShopProps> = ({ user }) => {
  const [rewards, setRewards] = useState<ShopReward[]>([]);
  const [avatar, setAvatar] = useState<AvatarData | null>(null);
  const [redemptions, setRedemptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'store' | 'history'>('store');

  const loadData = async () => {
    setLoading(true);
    try {
      const [shopItems, avatarData, userRedemptions] = await Promise.all([
        dbService.getShopRewards(),
        dbService.getAvatar(user.id),
        dbService.getUserRedemptions(user.id)
      ]);
      setRewards(shopItems);
      setAvatar(avatarData);
      setRedemptions(userRedemptions.sort((a,b) => new Date(b.claimed_at).getTime() - new Date(a.claimed_at).getTime()));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [user.id]);

  const handleRedeem = async (reward: ShopReward) => {
    if ((avatar?.coin || 0) < reward.cost) {
      Swal.fire('เหรียญไม่พอ!', 'พยายามบันทึกสุขภาพและทำควิซเพื่อสะสมเหรียญเพิ่มนะจ๊ะ', 'warning');
      return;
    }

    // Fix: Remove borderRadius property as it is not supported in SweetAlertOptions
    const result = await Swal.fire({
      title: 'ยืนยันการแลกรางวัล?',
      text: `ใช้ ${reward.cost} เหรียญ เพื่อแลก ${reward.title}`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'ยืนยันเลย!',
      cancelButtonText: 'เอาไว้ก่อน',
      confirmButtonColor: '#f59e0b',
    });

    if (result.isConfirmed) {
      try {
        const res = await dbService.redeemReward(user.id, reward);
        if (res.success) {
          // Fix: Remove borderRadius property as it is not supported in SweetAlertOptions
          await Swal.fire({
            title: 'แลกรางวัลสำเร็จ!',
            text: 'รับรหัสรางวัลได้ที่หน้า "ประวัติการแลก" แล้วนำไปแจ้งคุณครูได้เลย',
            icon: 'success',
          });
          loadData();
          setActiveTab('history');
        }
      } catch (e) {
        Swal.fire('ผิดพลาด', 'ไม่สามารถแลกรางวัลได้ในขณะนี้', 'error');
      }
    }
  };

  if (loading) return <div className="p-20 text-center animate-pulse"><ShoppingBag className="mx-auto text-amber-500 mb-4" size={48}/><p className="font-black text-amber-600 uppercase tracking-widest">กำลังเปิดร้านค้าฮีโร่...</p></div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-700 max-w-5xl mx-auto">
      <header className="bg-white rounded-[3rem] p-8 shadow-xl border-4 border-white flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-amber-50 rounded-full opacity-50"></div>
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600 text-3xl shadow-inner"><ShoppingBag /></div>
          <div>
            <h1 className="text-3xl font-black text-slate-800">Hero Shop</h1>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">ใช้เหรียญจากการทำความดีแลกรางวัลจริง</p>
          </div>
        </div>
        <div className="bg-amber-500 text-white px-8 py-4 rounded-[2rem] flex items-center gap-3 shadow-lg shadow-amber-100 relative z-10">
          <Coins size={24} className="animate-bounce" />
          <span className="text-2xl font-black">{avatar?.coin}</span>
          <span className="font-bold text-sm opacity-80 uppercase">Coins</span>
        </div>
      </header>

      <div className="flex bg-white/60 backdrop-blur-md p-1.5 rounded-[2rem] w-fit mx-auto shadow-sm border border-white">
        <button 
          onClick={() => setActiveTab('store')}
          className={`px-8 py-3 rounded-[1.5rem] text-sm font-black transition-all flex items-center gap-2 ${activeTab === 'store' ? 'bg-amber-500 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <ShoppingCart size={18}/> ร้านค้ารางวัล
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={`px-8 py-3 rounded-[1.5rem] text-sm font-black transition-all flex items-center gap-2 ${activeTab === 'history' ? 'bg-amber-500 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <History size={18}/> ประวัติการแลก ({redemptions.length})
        </button>
      </div>

      {activeTab === 'store' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {rewards.length > 0 ? rewards.map(reward => (
            <div key={reward.id} className="bg-white rounded-[3.5rem] p-8 shadow-xl border-4 border-white transition-all hover:scale-[1.03] flex flex-col items-center text-center relative overflow-hidden group">
              <div className="text-7xl mb-6 transform group-hover:scale-110 transition-transform duration-500">{reward.icon || '🎁'}</div>
              <h3 className="text-xl font-black text-slate-800 mb-2">{reward.title}</h3>
              <p className="text-slate-500 text-sm font-medium mb-6 leading-relaxed italic">"{reward.description}"</p>
              
              <div className="mt-auto w-full">
                <div className="flex justify-between items-center mb-4 px-4">
                   <span className="text-xs font-black text-slate-400 uppercase tracking-widest">ราคา</span>
                   <span className="flex items-center gap-1 text-amber-600 font-black"><Coins size={14}/> {reward.cost}</span>
                </div>
                <button 
                  onClick={() => handleRedeem(reward)}
                  className={`w-full py-4 rounded-2xl font-black shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${
                    (avatar?.coin || 0) >= reward.cost 
                    ? 'bg-emerald-500 text-white shadow-emerald-100' 
                    : 'bg-slate-100 text-slate-400 grayscale cursor-not-allowed'
                  }`}
                >
                  {(avatar?.coin || 0) >= reward.cost ? <Gift size={18}/> : <Clock size={18}/>}
                  {(avatar?.coin || 0) >= reward.cost ? 'แลกรางวัลเลย!' : 'เหรียญไม่พอ'}
                </button>
              </div>
              
              {reward.stock < 5 && (
                <div className="absolute top-6 left-6 bg-rose-100 text-rose-500 px-3 py-1 rounded-full text-[10px] font-black uppercase">
                  เหลือ {reward.stock} ชิ้น!
                </div>
              )}
            </div>
          )) : (
            <div className="col-span-full py-32 bg-white rounded-[4rem] text-center border-4 border-dashed border-slate-200">
               <div className="text-6xl mb-4 opacity-20">📦</div>
               <p className="font-black text-slate-300 uppercase tracking-widest italic">ยังไม่มีรางวัลวางขายในขณะนี้</p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-[3.5rem] p-8 shadow-xl border-4 border-white animate-in slide-in-from-right-4">
           <h3 className="text-2xl font-black text-slate-800 mb-8 flex items-center gap-3"><ClipboardList className="text-amber-500" /> รายการของรางวัลที่คุณแลก</h3>
           <div className="space-y-4">
              {redemptions.map((red, idx) => (
                <div key={idx} className={`p-6 rounded-3xl border-2 flex flex-col md:flex-row justify-between items-center gap-6 ${red.status === 'completed' ? 'bg-emerald-50/50 border-emerald-100' : 'bg-slate-50 border-slate-100'}`}>
                   <div className="flex items-center gap-6 w-full md:w-auto">
                      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-sm ${red.status === 'completed' ? 'bg-emerald-500 text-white' : 'bg-white text-slate-400 border border-slate-200'}`}>
                         {red.status === 'completed' ? <Check /> : <Ticket />}
                      </div>
                      <div>
                         <h4 className={`text-lg font-black ${red.status === 'completed' ? 'text-emerald-700' : 'text-slate-800'}`}>{red.reward_title}</h4>
                         <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">แลกเมื่อ: {new Date(red.claimed_at).toLocaleDateString('th-TH')}</p>
                      </div>
                   </div>

                   <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                      <div className="text-center">
                         <p className="text-[8px] font-black text-slate-400 uppercase">Redemption Code</p>
                         <p className="text-xl font-black text-amber-600 tracking-widest bg-white px-6 py-2 rounded-xl shadow-inner border border-amber-100">{red.code}</p>
                      </div>
                      <div className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest ${red.status === 'completed' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600 animate-pulse'}`}>
                         {red.status === 'completed' ? 'ได้รับแล้ว' : 'รอมอบรางวัล'}
                      </div>
                   </div>
                </div>
              ))}
              {redemptions.length === 0 && (
                <div className="py-20 text-center text-slate-300 font-black italic">คุณยังไม่เคยแลกของรางวัลใดๆ เลย มาสะสมเหรียญกันนะ!</div>
              )}
           </div>
           <div className="mt-10 p-6 bg-blue-50 rounded-3xl border-2 border-blue-100 flex items-center gap-4">
              <div className="text-3xl">💡</div>
              <p className="text-xs font-bold text-blue-700 leading-relaxed">
                **หมายเหตุ:** ให้นำรหัส (Redemption Code) ไปแจ้งคุณครูประจำชั้นเพื่อขอรับของรางวัลจริงนะครับ รหัสแต่ละรหัสสามารถใช้แลกได้เพียงครั้งเดียวเท่านั้น!
              </p>
           </div>
        </div>
      )}
    </div>
  );
};

export default Shop;
