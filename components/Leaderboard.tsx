
import React, { useEffect, useState } from 'react';
import { dbService } from '../services/dbService';
import { Trophy, Star, Medal, Crown, TrendingUp } from 'lucide-react';

interface LeaderboardProps {
  className?: string;
  currentUserId?: string;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ className, currentUserId }) => {
  const [topUsers, setTopUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    dbService.getLeaderboard(className).then(data => {
      setTopUsers(data);
      setLoading(false);
    });
  }, [className]);

  const top3 = topUsers.slice(0, 3);
  const rest = topUsers.slice(3);

  return (
    <section className="bg-white rounded-[3rem] p-8 shadow-xl border-4 border-white relative overflow-hidden group">
      {/* Decor Background */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-50 rounded-full opacity-30 group-hover:scale-110 transition-transform"></div>
      
      <div className="flex flex-col md:flex-row items-center justify-between mb-10 gap-4 relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600 shadow-inner">
            <Trophy size={24} />
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-800">ทำเนียบฮีโร่สายสุขภาพ</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
              {className ? `อันดับยอดเยี่ยมประจำห้อง ${className}` : 'อันดับยอดเยี่ยมประจำหมู่บ้าน'}
            </p>
          </div>
        </div>
        <div className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border border-emerald-100 shadow-sm animate-pulse">
          <TrendingUp size={14} /> อัปเดตล่าสุดวันนี้
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center space-y-4">
           <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
           <p className="text-xs font-black text-slate-400 uppercase tracking-widest">กำลังดึงรายชื่อคนเก่ง...</p>
        </div>
      ) : topUsers.length === 0 ? (
        <div className="py-20 text-center text-slate-300 italic">ยังไม่มีรายชื่อฮีโร่ในขณะนี้</div>
      ) : (
        <div className="space-y-8 relative z-10">
          {/* Podium for Top 3 */}
          <div className="grid grid-cols-3 gap-4 items-end mb-12">
            {/* Rank 2 */}
            {top3[1] && (
              <div className="flex flex-col items-center">
                 <div className="relative mb-3">
                    <div className="w-16 h-16 bg-slate-100 rounded-[1.5rem] flex items-center justify-center text-4xl border-4 border-white shadow-lg overflow-hidden relative">
                       <span className="opacity-30">{top3[1].base_emoji}</span>
                       <div className="absolute inset-0 flex items-center justify-center bg-slate-200/40">🥈</div>
                    </div>
                    <div className="absolute -top-2 -right-2 bg-slate-400 text-white w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black border-2 border-white shadow-sm">2</div>
                 </div>
                 <div className="text-center">
                    <p className="text-xs font-black text-slate-700 truncate w-24">{top3[1].fullname}</p>
                    <p className="text-[9px] font-bold text-slate-400">LV.{top3[1].level}</p>
                 </div>
              </div>
            )}

            {/* Rank 1 */}
            {top3[0] && (
              <div className="flex flex-col items-center">
                 <div className="relative mb-4">
                    <div className="w-20 h-20 bg-amber-50 rounded-[2rem] flex items-center justify-center text-5xl border-4 border-white shadow-xl overflow-hidden relative transform -translate-y-4">
                       <span className="opacity-30">{top3[0].base_emoji}</span>
                       <div className="absolute inset-0 flex items-center justify-center bg-amber-100/40 animate-pulse">👑</div>
                    </div>
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-yellow-500 drop-shadow-sm"><Medal size={24} fill="currentColor" /></div>
                    <div className="absolute -top-4 -right-2 bg-amber-500 text-white w-8 h-8 rounded-full flex items-center justify-center text-xs font-black border-4 border-white shadow-lg">1</div>
                 </div>
                 <div className="text-center -translate-y-2">
                    <p className="text-sm font-black text-slate-800 truncate w-28">{top3[0].fullname}</p>
                    <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mt-0.5">Legendary Hero</p>
                 </div>
              </div>
            )}

            {/* Rank 3 */}
            {top3[2] && (
              <div className="flex flex-col items-center">
                 <div className="relative mb-3">
                    <div className="w-16 h-16 bg-orange-50 rounded-[1.5rem] flex items-center justify-center text-4xl border-4 border-white shadow-lg overflow-hidden relative">
                       <span className="opacity-30">{top3[2].base_emoji}</span>
                       <div className="absolute inset-0 flex items-center justify-center bg-orange-100/40">🥉</div>
                    </div>
                    <div className="absolute -top-2 -right-2 bg-orange-400 text-white w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black border-2 border-white shadow-sm">3</div>
                 </div>
                 <div className="text-center">
                    <p className="text-xs font-black text-slate-700 truncate w-24">{top3[2].fullname}</p>
                    <p className="text-[9px] font-bold text-slate-400">LV.{top3[2].level}</p>
                 </div>
              </div>
            )}
          </div>

          {/* Table for 4-10 */}
          <div className="space-y-3">
            {rest.map((u, i) => (
              <div 
                key={u.user_id} 
                className={`flex items-center gap-4 p-4 rounded-[2rem] transition-all border-2 ${u.user_id === currentUserId ? 'bg-blue-50 border-blue-200 shadow-md shadow-blue-50 translate-x-1' : 'bg-slate-50 border-transparent hover:bg-white hover:border-slate-100'}`}
              >
                <div className="w-10 h-10 rounded-2xl bg-white border-2 border-slate-100 flex items-center justify-center font-black text-slate-400 text-sm shadow-sm">
                  {i + 4}
                </div>
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-2xl border-2 border-slate-50 shadow-inner">
                   {u.base_emoji}
                </div>
                <div className="flex-grow">
                  <div className="flex items-center gap-2">
                    <p className="font-black text-sm text-slate-700">{u.fullname}</p>
                    {u.user_id === currentUserId && <span className="bg-blue-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-tighter">You</span>}
                  </div>
                  <div className="flex gap-2 items-center mt-1">
                    <span className="bg-white text-[9px] font-black text-slate-400 px-2 py-0.5 rounded-full border border-slate-100">LEVEL {u.level}</span>
                    <span className="bg-white text-[9px] font-black text-blue-400 px-2 py-0.5 rounded-full border border-blue-50 uppercase tracking-widest">{u.class}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1.5 text-blue-500 bg-white px-3 py-1.5 rounded-2xl shadow-sm border border-blue-50">
                    <Star size={14} fill="currentColor" />
                    <span className="font-black text-xs">{u.exp}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {topUsers.length > 5 && (
            <p className="text-center py-4 text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em]">สะสมแต้มให้ครบเพื่อขึ้นทำเนียบคนเก่ง!</p>
          )}
        </div>
      )}
    </section>
  );
};

export default Leaderboard;
