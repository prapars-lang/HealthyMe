
import React, { useState, useEffect, useMemo } from 'react';
import { dbService } from '../services/dbService';
import { Card, UserCard, User } from '../types';
import { Sparkles, Search, Filter, Lock, Trophy, Info, X } from 'lucide-react';
import Swal from 'sweetalert2';

interface CardCollectionProps { user: User; }

const CardCollection: React.FC<CardCollectionProps> = ({ user }) => {
  const [allCards, setAllCards] = useState<Card[]>([]);
  const [userCards, setUserCards] = useState<UserCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'All' | 'Common' | 'Rare' | 'Legendary'>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [cards, myCards] = await Promise.all([
          dbService.getCards(),
          dbService.getUserCards(user.id)
        ]);
        setAllCards(cards);
        setUserCards(myCards);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user.id]);

  const ownedCardIds = useMemo(() => new Set(userCards.map(uc => uc.card_id)), [userCards]);

  const filteredCards = useMemo(() => {
    return allCards.filter(card => {
      const matchFilter = filter === 'All' || card.rarity === filter;
      const matchSearch = card.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          card.id.toLowerCase().includes(searchTerm.toLowerCase());
      return matchFilter && matchSearch;
    });
  }, [allCards, filter, searchTerm]);

  if (loading) return <div className="p-20 text-center"><div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div><p className="font-black text-blue-600">กำลังเปิดสมุดสะสมการ์ด...</p></div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <header className="bg-white rounded-[3rem] p-8 shadow-xl border-4 border-white flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center text-purple-600 text-3xl shadow-inner">🎴</div>
          <div>
            <h1 className="text-3xl font-black text-slate-800">Card Binder</h1>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">สะสมพลังได้ {ownedCardIds.size} / {allCards.length} ใบ</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {(['All', 'Common', 'Rare', 'Legendary'] as const).map(r => (
            <button 
              key={r} 
              onClick={() => setFilter(r)}
              className={`px-5 py-2 rounded-xl text-xs font-black transition-all ${filter === r ? 'bg-purple-600 text-white shadow-lg' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
            >
              {r === 'All' ? 'ทั้งหมด' : r}
            </button>
          ))}
        </div>
      </header>

      <div className="relative">
        <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300"><Search size={20}/></div>
        <input 
          type="text" 
          placeholder="ค้นหาชื่อการ์ด หรือ รหัส (C1, C2...)"
          className="w-full bg-white px-14 py-5 rounded-[2rem] border-4 border-white shadow-sm font-bold outline-none focus:ring-4 focus:ring-purple-100 transition-all"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
        {filteredCards.map(card => {
          const isOwned = ownedCardIds.has(card.id);
          const rarityStyles = {
            Common: 'border-blue-100 from-blue-400 to-emerald-400',
            Rare: 'border-indigo-200 from-indigo-500 to-purple-600',
            Legendary: 'border-yellow-200 from-yellow-400 via-orange-500 to-rose-600'
          };

          return (
            <div 
              key={card.id} 
              onClick={() => isOwned && setSelectedCard(card)}
              className={`group relative aspect-[3/4] rounded-[2rem] border-4 p-3 flex flex-col items-center justify-between cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-md overflow-hidden ${
                isOwned ? `bg-gradient-to-br ${rarityStyles[card.rarity]}` : 'bg-slate-100 border-slate-200 opacity-60 grayscale'
              }`}
            >
              {!isOwned && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/5 z-10">
                   <Lock className="text-slate-400 opacity-40" size={48} />
                </div>
              )}

              <div className="w-full flex justify-between items-center relative z-10">
                 <span className={`text-[8px] font-black ${isOwned ? 'text-white/50' : 'text-slate-300'}`}>{card.id}</span>
                 {isOwned && card.rarity === 'Legendary' && <Sparkles className="text-yellow-200 animate-pulse" size={12}/>}
              </div>

              <div className={`w-full h-[60%] rounded-xl overflow-hidden border border-white/20 shadow-inner flex items-center justify-center ${isOwned ? 'bg-black/10' : 'bg-slate-200'}`}>
                {card.image.startsWith('http') ? (
                  <img src={card.image} className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <span className="text-4xl">{card.image}</span>
                )}
              </div>

              <div className="text-center w-full z-10">
                <p className={`text-[10px] font-black truncate px-1 ${isOwned ? 'text-white' : 'text-slate-400'}`}>{card.title}</p>
                <p className={`text-[7px] font-bold uppercase tracking-widest mt-0.5 ${isOwned ? 'text-white/70' : 'text-slate-300'}`}>{card.rarity}</p>
              </div>

              {isOwned && (
                 <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none"></div>
              )}
            </div>
          );
        })}
      </div>

      {filteredCards.length === 0 && (
        <div className="py-20 text-center text-slate-300 font-black italic">ไม่พบการ์ดที่คุณค้นหา</div>
      )}

      {selectedCard && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in">
           <div className="bg-white rounded-[3.5rem] w-full max-w-sm p-8 shadow-2xl relative animate-in zoom-in">
              <button onClick={() => setSelectedCard(null)} className="absolute top-6 right-6 p-2 bg-slate-100 rounded-full text-slate-400"><X /></button>
              
              <div className={`w-full aspect-[3/4] rounded-[2.5rem] p-6 border-8 mb-6 flex flex-col items-center justify-between relative overflow-hidden ${
                selectedCard.rarity === 'Legendary' ? 'bg-gradient-to-br from-yellow-400 to-rose-600 border-yellow-100' : 
                selectedCard.rarity === 'Rare' ? 'bg-gradient-to-br from-indigo-500 to-purple-600 border-indigo-100' : 
                'bg-gradient-to-br from-blue-400 to-emerald-500 border-blue-50'
              }`}>
                 <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
                 <div className="text-8xl p-6 bg-white/20 rounded-[2rem] backdrop-blur-md shadow-inner border border-white/30 overflow-hidden w-full h-56 flex items-center justify-center">
                    {selectedCard.image.startsWith('http') ? <img src={selectedCard.image} className="w-full h-full object-cover" /> : selectedCard.image}
                 </div>
                 <div className="text-center text-white">
                    <h4 className="text-2xl font-black drop-shadow-md">{selectedCard.title}</h4>
                    <p className="text-xs font-bold opacity-80 mt-1 uppercase tracking-[0.2em]">{selectedCard.rarity}</p>
                 </div>
                 <div className="grid grid-cols-3 gap-2 w-full">
                    <div className="bg-black/20 rounded-xl p-2 text-center text-white"><p className="text-[8px] font-black opacity-60">HP</p><p className="font-black text-sm">{selectedCard.power_stats.health}</p></div>
                    <div className="bg-black/20 rounded-xl p-2 text-center text-white"><p className="text-[8px] font-black opacity-60">INT</p><p className="font-black text-sm">{selectedCard.power_stats.brain}</p></div>
                    <div className="bg-black/20 rounded-xl p-2 text-center text-white"><p className="text-[8px] font-black opacity-60">ENG</p><p className="font-black text-sm">{selectedCard.power_stats.energy}</p></div>
                 </div>
              </div>

              <div className="text-center space-y-4">
                 <p className="text-slate-500 font-bold italic">"{selectedCard.description}"</p>
                 <button onClick={() => setSelectedCard(null)} className="w-full bg-slate-800 text-white font-black py-4 rounded-2xl shadow-xl">ปิดหน้าต่าง</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default CardCollection;
