
import React, { useState, useEffect, useMemo } from 'react';
import { dbService } from '../services/dbService';
import { User, AvatarData, UserItem, Item } from '../types';
import { ITEMS_SHOP } from '../constants';
import { Briefcase, Sparkles, Check, ChevronRight, Package, Info, X, Zap } from 'lucide-react';
import Swal from 'sweetalert2';

interface InventoryProps { user: User; }

const Inventory: React.FC<InventoryProps> = ({ user }) => {
  const [avatar, setAvatar] = useState<AvatarData | null>(null);
  const [userItems, setUserItems] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [avatarData, items] = await Promise.all([
        dbService.getAvatar(user.id),
        dbService.getUserItems(user.id)
      ]);
      setAvatar(avatarData);
      setUserItems(items);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [user.id]);

  const ownedItems = useMemo(() => {
    // รวมข้อมูลจาก ITEMS_SHOP กับ userItems
    return userItems.map(ui => {
      const shopItem = ITEMS_SHOP.find(i => i.id === ui.item_id);
      return {
        ...ui,
        details: shopItem || { 
          id: ui.item_id, 
          item_name: 'Unknown Item', 
          type: 'Mystery', 
          price: 0, 
          effect: 'ความลับ...', 
          image: '🎁' 
        }
      };
    });
  }, [userItems]);

  const handleEquip = async (itemId: string) => {
    try {
      await dbService.equipItem(user.id, itemId);
      setAvatar(prev => prev ? { ...prev, equipped_item_id: itemId } : null);
      Swal.fire({
        title: 'สวมใส่สำเร็จ!',
        text: 'ไอเทมนี้จะช่วยเพิ่มพลังให้คุณในการผจญภัย',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      });
    } catch (e) {
      Swal.fire('ผิดพลาด', 'ไม่สามารถสวมใส่ไอเทมได้', 'error');
    }
  };

  const selectedItem = useMemo(() => 
    ownedItems.find(i => i.item_id === selectedItemId), 
  [ownedItems, selectedItemId]);

  if (loading) return (
    <div className="p-20 text-center animate-pulse">
      <Briefcase className="mx-auto text-indigo-500 mb-4" size={48}/>
      <p className="font-black text-indigo-600 uppercase tracking-widest">กำลังจัดระเบียบกระเป๋า...</p>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-700">
      <header className="bg-white rounded-[3rem] p-8 shadow-xl border-4 border-white flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden">
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-indigo-50 rounded-full opacity-50"></div>
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 text-3xl shadow-inner"><Briefcase /></div>
          <div>
            <h1 className="text-3xl font-black text-slate-800">My Inventory</h1>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">คลังสมบัติและไอเทมเสริมพลังของคุณ</p>
          </div>
        </div>
        <div className="bg-white/60 backdrop-blur-md px-6 py-3 rounded-2xl border border-white flex items-center gap-4 shadow-sm relative z-10">
           <div className="text-center">
             <p className="text-[10px] font-black text-slate-400 uppercase leading-none mb-1">Items Collected</p>
             <p className="text-2xl font-black text-indigo-600 leading-none">{ownedItems.length}</p>
           </div>
           <div className="h-8 w-[1px] bg-slate-100"></div>
           <div className="text-center">
             <p className="text-[10px] font-black text-slate-400 uppercase leading-none mb-1">Equipped</p>
             <p className="text-2xl font-black text-emerald-500 leading-none">{avatar?.equipped_item_id ? '1' : '0'}</p>
           </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Item List */}
        <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-4">
           {ownedItems.length > 0 ? ownedItems.map((item, idx) => (
             <button 
               key={idx}
               onClick={() => setSelectedItemId(item.item_id)}
               className={`relative p-6 rounded-[2.5rem] border-4 transition-all active:scale-95 group flex flex-col items-center ${
                 selectedItemId === item.item_id 
                 ? 'bg-indigo-50 border-indigo-500 shadow-xl scale-105' 
                 : 'bg-white border-white shadow-md hover:border-indigo-100'
               }`}
             >
                {avatar?.equipped_item_id === item.item_id && (
                  <div className="absolute -top-2 -right-2 bg-emerald-500 text-white p-2 rounded-full shadow-lg border-2 border-white animate-in zoom-in">
                    <Check size={14} strokeWidth={4} />
                  </div>
                )}
                <div className="text-6xl mb-4 transform group-hover:rotate-6 transition-transform">{item.details.image}</div>
                <p className="font-black text-slate-800 text-xs truncate w-full text-center">{item.details.item_name}</p>
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">{item.details.type}</span>
             </button>
           )) : (
             <div className="col-span-full py-32 bg-white/50 rounded-[4rem] text-center border-4 border-dashed border-slate-200">
                <Package className="mx-auto text-slate-200 mb-4" size={64}/>
                <p className="font-black text-slate-300 uppercase tracking-widest italic">ยังไม่มีไอเทมในกระเป๋าเลย...</p>
                <p className="text-[10px] font-bold text-slate-400 mt-2">เปิด Mystery Box หรือซื้อของในร้านค้าดูสิ!</p>
             </div>
           )}
        </div>

        {/* Item Detail Panel */}
        <div className="bg-white rounded-[3.5rem] p-10 shadow-xl border-4 border-white h-fit sticky top-24">
           {selectedItem ? (
             <div className="flex flex-col items-center text-center animate-in slide-in-from-right-4">
                <div className="text-8xl mb-8 p-10 bg-indigo-50 rounded-[3rem] shadow-inner border border-indigo-100 relative group">
                   <div className="absolute inset-0 bg-indigo-400/5 rounded-[3rem] animate-pulse"></div>
                   <span className="relative z-10">{selectedItem.details.image}</span>
                </div>
                
                <h3 className="text-2xl font-black text-slate-800 mb-2">{selectedItem.details.item_name}</h3>
                <div className="bg-indigo-100 text-indigo-600 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-6">
                   {selectedItem.details.type}
                </div>
                
                <div className="w-full bg-slate-50 p-6 rounded-3xl border border-slate-100 mb-8">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center justify-center gap-2">
                     <Zap size={12} className="text-indigo-500"/> พลังแฝงของไอเทม
                   </p>
                   <p className="text-sm font-bold text-slate-600 italic">"{selectedItem.details.effect}"</p>
                </div>

                <div className="w-full space-y-4">
                   {avatar?.equipped_item_id === selectedItem.item_id ? (
                     <div className="py-5 bg-emerald-50 text-emerald-600 rounded-2xl font-black flex items-center justify-center gap-3 border-2 border-emerald-100">
                        <Check /> กำลังสวมใส่
                     </div>
                   ) : (
                     <button 
                       onClick={() => handleEquip(selectedItem.item_id)}
                       className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-100 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-3"
                     >
                        <Sparkles size={20}/> สวมใส่ไอเทมนี้
                     </button>
                   )}
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">ได้รับเมื่อ: {new Date(selectedItem.acquired_at).toLocaleDateString('th-TH')}</p>
                </div>
             </div>
           ) : (
             <div className="flex flex-col items-center justify-center text-center py-20">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-6">
                   <Info size={40}/>
                </div>
                <h3 className="text-xl font-black text-slate-400">เลือกไอเทมเพื่อดูรายละเอียด</h3>
                <p className="text-xs font-medium text-slate-300 mt-2 max-w-[200px]">คุณสามารถสวมใส่ไอเทมเพื่อความสวยงามและเพิ่มพลังได้!</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default Inventory;
