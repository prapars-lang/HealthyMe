
import React, { useState, useEffect, useMemo } from 'react';
import { dbService } from '../services/dbService';
import { User, Friend, AvatarData, SocialAction } from '../types';
import { Users, Search, UserPlus, Heart, Sparkles, Star, ChevronRight, Info, RefreshCw, X, Bell, CheckCheck, TrendingUp, UserCheck, MessageCircle } from 'lucide-react';
import Swal from 'sweetalert2';

interface FriendsProps { user: User; }

const Friends: React.FC<FriendsProps> = ({ user }) => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [avatars, setAvatars] = useState<Record<string, AvatarData>>({});
  const [socialActions, setSocialActions] = useState<SocialAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'my-friends' | 'find-friends' | 'activity'>('my-friends');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [friendList, users, actions] = await Promise.all([
        dbService.getFriends(user.id),
        dbService.getAllUsers(),
        dbService.getSocialActions(user.id)
      ]);
      setFriends(friendList);
      setAllUsers(users.filter(u => u && u.id !== user.id));
      setSocialActions(actions);

      // OPTIMIZATION: ดึงเฉพาะ Avatar ที่จำเป็น
      const friendIds = friendList.map(f => f.friend_id);
      const actionUserIds = actions.map(a => a.from_user_id);
      const necessaryIds = [...new Set([user.id, ...friendIds, ...actionUserIds])];
      
      const avatarMap: Record<string, AvatarData> = {};
      await Promise.all(necessaryIds.map(async id => {
        if (id) {
          const avData = await dbService.getAvatar(id);
          if (avData) avatarMap[id] = avData;
        }
      }));
      setAvatars(avatarMap);
    } catch (e) {
      console.error("Friends Page Fetch Error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [user.id]);

  const friendIdsSet = useMemo(() => new Set(friends.map(f => f.friend_id)), [friends]);

  const filteredMyFriends = useMemo(() => {
    const term = (searchTerm || '').toLowerCase();
    return friends.filter(f => {
      const friendUser = allUsers.find(u => u && u.id === f.friend_id);
      if (!friendUser || !friendUser.fullname) return false;
      return friendUser.fullname.toLowerCase().includes(term);
    });
  }, [friends, allUsers, searchTerm]);

  const filteredFindFriends = useMemo(() => {
    const term = (searchTerm || '').toLowerCase();
    return allUsers.filter(u => {
      if (!u || !u.fullname) return false;
      return !friendIdsSet.has(u.id) && u.fullname.toLowerCase().includes(term);
    }).slice(0, 20);
  }, [allUsers, friendIdsSet, searchTerm]);

  const unreadCount = useMemo(() => socialActions.filter(a => !a.is_read).length, [socialActions]);

  const handleAddFriend = async (friendId: string) => {
    try {
      const res = await dbService.addFriend(user.id, friendId);
      if (res.success) {
        Swal.fire({
          title: 'เพิ่มเพื่อนสำเร็จ!',
          text: 'คุณได้เพิ่มเพื่อนใหม่เข้าสู่หมู่บ้านแล้ว',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false
        });
        fetchData();
      } else {
        Swal.fire('แจ้งเตือน', res.message || 'ไม่สามารถเพิ่มเพื่อนได้', 'info');
      }
    } catch (e) {
      Swal.fire('ผิดพลาด', 'ไม่สามารถเพิ่มเพื่อนได้ในขณะนี้', 'error');
    }
  };

  const handleSendHeart = async (friendId: string, name: string) => {
    try {
      await dbService.sendSocialAction({
        from_user_id: user.id,
        to_user_id: friendId,
        action_type: 'heart',
        content: 'ส่งหัวใจให้เพื่อนสุขภาพดี'
      });
      Swal.fire({
        title: `ส่งหัวใจให้ ${name || 'เพื่อน'}! ❤️`,
        text: 'หัวใจของคุณถูกส่งไปหาเพื่อนแล้ว',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await dbService.markSocialActionsRead(user.id);
      setSocialActions(prev => prev.map(a => ({ ...a, is_read: true })));
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return (
    <div className="p-20 text-center animate-pulse">
      <RefreshCw className="mx-auto text-emerald-500 mb-4 animate-spin" size={48}/>
      <p className="font-black text-emerald-600 uppercase tracking-widest">กำลังเชื่อมต่อหมู่บ้าน...</p>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700 pb-20">
      <header className="bg-white rounded-[3.5rem] p-10 shadow-xl border-4 border-white flex flex-col md:flex-row justify-between items-center gap-8 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-emerald-50 rounded-full opacity-50"></div>
        <div className="flex items-center gap-6 relative z-10">
          <div className="w-20 h-20 bg-emerald-100 rounded-[2rem] flex items-center justify-center text-emerald-600 text-4xl shadow-inner border-2 border-white"><Users /></div>
          <div>
            <h1 className="text-4xl font-black text-slate-800 tracking-tight">Village Social</h1>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.2em] mt-2">ศูนย์รวมมิตรภาพและพลังสุขภาพ</p>
          </div>
        </div>
        <div className="flex gap-4 relative z-10">
           <div className="bg-white px-8 py-4 rounded-[2rem] border-2 border-slate-50 shadow-sm text-center">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Friends</p>
             <p className="text-3xl font-black text-emerald-600 leading-none">{friends.length}</p>
           </div>
           <div className="bg-rose-500 px-8 py-4 rounded-[2rem] text-white shadow-lg shadow-rose-100 text-center">
             <p className="text-[10px] font-black opacity-60 uppercase tracking-widest mb-1">Notifications</p>
             <p className="text-3xl font-black leading-none">{unreadCount}</p>
           </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Main Content Area */}
        <div className="lg:col-span-8 space-y-6">
           {/* Tabs and Search */}
           <div className="bg-white p-6 rounded-[3rem] shadow-lg border-4 border-white space-y-6">
              <div className="relative">
                 <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300"><Search size={22}/></div>
                 <input 
                   type="text" 
                   placeholder="ค้นหาชื่อฮีโร่ในหมู่บ้าน..."
                   className="w-full bg-slate-50 px-16 py-5 rounded-[2.2rem] border-2 border-transparent focus:border-emerald-500 focus:bg-white shadow-inner font-bold outline-none transition-all"
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                 />
              </div>

              <div className="flex flex-wrap gap-2 p-1.5 bg-slate-100 rounded-[2rem] w-full sm:w-fit">
                 <button 
                   onClick={() => setActiveTab('my-friends')}
                   className={`flex-1 sm:flex-none px-8 py-3.5 rounded-[1.6rem] text-sm font-black transition-all flex items-center justify-center gap-2 ${activeTab === 'my-friends' ? 'bg-white text-emerald-600 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
                 >
                   <UserCheck size={18}/> เพื่อนของฉัน
                 </button>
                 <button 
                   onClick={() => setActiveTab('find-friends')}
                   className={`flex-1 sm:flex-none px-8 py-3.5 rounded-[1.6rem] text-sm font-black transition-all flex items-center justify-center gap-2 ${activeTab === 'find-friends' ? 'bg-white text-emerald-600 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
                 >
                   <UserPlus size={18}/> หาเพื่อนใหม่
                 </button>
                 <button 
                   onClick={() => { setActiveTab('activity'); handleMarkAllRead(); }}
                   className={`flex-1 sm:flex-none px-8 py-3.5 rounded-[1.6rem] text-sm font-black transition-all flex items-center justify-center gap-2 relative ${activeTab === 'activity' ? 'bg-rose-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-700'}`}
                 >
                   <Bell size={18}/> แจ้งเตือน {unreadCount > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[8px] rounded-full border-2 border-white flex items-center justify-center animate-bounce">{unreadCount}</span>}
                 </button>
              </div>
           </div>

           {/* List Display */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activeTab === 'my-friends' && (
                filteredMyFriends.length > 0 ? filteredMyFriends.map(f => {
                  const friendUser = allUsers.find(u => u && u.id === f.friend_id);
                  const avatar = avatars[f.friend_id] || { base_emoji: '👤', level: 1 };
                  if (!friendUser) return null;
                  return (
                    <div key={f.id} className="bg-white p-8 rounded-[3rem] shadow-xl border-4 border-white flex flex-col items-center gap-4 transition-all hover:scale-[1.03] group relative overflow-hidden">
                       <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-full -mr-12 -mt-12 opacity-40"></div>
                       <div className="text-6xl bg-gradient-to-tr from-slate-50 to-emerald-50 w-24 h-24 rounded-[2rem] flex items-center justify-center shadow-inner relative z-10 border-2 border-white">
                          {avatar.base_emoji}
                          <div className="absolute -bottom-2 -right-2 bg-emerald-600 text-white w-10 h-10 rounded-2xl text-xs font-black flex items-center justify-center border-4 border-white shadow-lg">{avatar.level}</div>
                       </div>
                       <div className="text-center relative z-10 w-full">
                          <p className="font-black text-slate-800 text-lg truncate leading-tight">{friendUser.fullname}</p>
                          <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] mt-2">Class {friendUser.class}</p>
                          <div className="mt-6 flex gap-2 justify-center">
                             <button 
                               onClick={() => handleSendHeart(f.friend_id, friendUser.fullname)}
                               className="flex-1 py-3.5 bg-rose-50 text-rose-500 rounded-2xl hover:bg-rose-100 active:scale-95 transition-all flex items-center justify-center gap-2 border border-rose-100 shadow-sm"
                             >
                               <Heart size={18} fill="currentColor"/> <span className="text-[11px] font-black uppercase">ส่งพลังใจ</span>
                             </button>
                          </div>
                       </div>
                    </div>
                  );
                }) : (
                  <div className="col-span-full py-32 bg-white rounded-[4rem] text-center border-4 border-dashed border-slate-200">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mx-auto mb-6"><Users size={40}/></div>
                    <p className="font-black text-slate-400 uppercase tracking-[0.2em]">ยังไม่มีเพื่อนร่วมทางในขณะนี้</p>
                    <button onClick={() => setActiveTab('find-friends')} className="mt-6 bg-emerald-100 text-emerald-600 px-8 py-3 rounded-2xl font-black text-xs hover:bg-emerald-200 transition-all uppercase">ไปค้นหาฮีโร่ใหม่กัน! 🚀</button>
                  </div>
                )
              )}

              {activeTab === 'find-friends' && (
                filteredFindFriends.length > 0 ? filteredFindFriends.map(u => {
                  return (
                    <div key={u.id} className="bg-white p-8 rounded-[3rem] shadow-xl border-4 border-white flex items-center gap-6 transition-all hover:scale-[1.02] hover:shadow-2xl">
                       <div className="text-5xl bg-slate-50 w-20 h-20 rounded-[1.8rem] flex items-center justify-center shadow-inner border-2 border-white shrink-0">
                          {avatars[u.id]?.base_emoji || '👤'}
                       </div>
                       <div className="flex-grow overflow-hidden">
                          <p className="font-black text-slate-800 text-base truncate leading-none mb-1">{u.fullname}</p>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Class {u.class}</p>
                          <button 
                            onClick={() => handleAddFriend(u.id)}
                            className="mt-4 px-6 py-2.5 bg-emerald-500 text-white rounded-2xl text-[10px] font-black flex items-center gap-2 active:scale-95 transition-all shadow-lg shadow-emerald-100"
                          >
                             <UserPlus size={16}/> เพิ่มเพื่อน
                          </button>
                       </div>
                    </div>
                  );
                }) : (
                  <div className="col-span-full py-32 bg-white rounded-[4rem] text-center border-4 border-dashed border-slate-200">
                    <Info className="mx-auto text-slate-200 mb-4" size={48}/>
                    <p className="font-black text-slate-400 uppercase tracking-widest italic">ไม่พบฮีโร่คนใหม่ที่คุณค้นหา</p>
                  </div>
                )
              )}

              {activeTab === 'activity' && (
                <div className="col-span-full space-y-4">
                  {socialActions.length > 0 ? socialActions.map(action => {
                    const fromUser = allUsers.find(u => u && u.id === action.from_user_id);
                    const fromAvatar = avatars[action.from_user_id] || { base_emoji: '👤' };
                    return (
                      <div key={action.id} className={`bg-white p-6 rounded-[2.5rem] shadow-md border-4 transition-all flex items-center gap-5 ${!action.is_read ? 'border-rose-400 bg-rose-50/10' : 'border-white'}`}>
                        <div className="text-4xl w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center shadow-inner shrink-0">
                          {fromAvatar.base_emoji}
                        </div>
                        <div className="flex-grow">
                          <p className="text-sm font-bold text-slate-600 leading-tight">
                            <span className="font-black text-slate-800 text-base">{fromUser?.fullname || 'ใครบางคน'}</span> <br/>
                            {action.action_type === 'heart' ? 'ส่งหัวใจ ❤️ เพื่อบอกว่าเก่งมาก!' : 'ส่งสติกเกอร์ให้กำลังใจคุณ ✨'}
                          </p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase mt-2 tracking-widest">
                            {new Date(action.created_at).toLocaleString('th-TH', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                          </p>
                        </div>
                        {!action.is_read && <div className="w-4 h-4 bg-rose-500 rounded-full border-4 border-white animate-pulse"></div>}
                      </div>
                    );
                  }) : (
                    <div className="py-32 bg-white rounded-[4rem] text-center border-4 border-dashed border-slate-200 w-full">
                       <Bell className="mx-auto text-slate-100 mb-6" size={64}/>
                       <p className="font-black text-slate-400 uppercase tracking-[0.2em]">ยังไม่มีความเคลื่อนไหวในขณะนี้</p>
                    </div>
                  )}
                </div>
              )}
           </div>
        </div>

        {/* Village Heartbeat (Activity) */}
        <div className="lg:col-span-4 space-y-8">
           <div className="bg-white rounded-[3.5rem] p-8 shadow-xl border-4 border-white relative overflow-hidden">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black text-slate-800 flex items-center gap-3"><TrendingUp size={24} className="text-emerald-500"/> ความเคลื่อนไหว</h3>
                <Sparkles className="text-yellow-400" size={20}/>
              </div>
              
              <div className="space-y-6">
                 {socialActions.slice(0, 5).map((action, i) => {
                   const fromUser = allUsers.find(u => u && u.id === action.from_user_id);
                   return (
                     <div key={i} className="flex gap-4 items-start group">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-xl shrink-0 group-hover:scale-110 transition-transform">
                          {avatars[action.from_user_id]?.base_emoji || '👤'}
                        </div>
                        <div className="flex-grow pb-4 border-b border-slate-50">
                           <p className="text-xs font-bold text-slate-600 leading-tight">
                             <span className="font-black text-slate-800">{fromUser?.fullname || 'เพื่อนฮีโร่'}</span>
                             <span className="opacity-70"> {action.action_type === 'heart' ? 'ส่งใจ ❤️' : 'ทักทาย ✨'}</span>
                           </p>
                           <p className="text-[9px] font-black text-slate-300 uppercase mt-1">{new Date(action.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                        </div>
                     </div>
                   );
                 })}
                 {socialActions.length === 0 && (
                   <p className="text-center text-slate-300 font-black italic py-10 text-xs">หมู่บ้านกำลังพักผ่อน...</p>
                 )}
              </div>
              
              <button 
                onClick={() => setActiveTab('activity')}
                className="w-full mt-6 py-4 bg-slate-50 rounded-2xl text-[11px] font-black text-slate-500 uppercase tracking-widest hover:bg-emerald-50 hover:text-emerald-600 transition-all flex items-center justify-center gap-2"
              >
                 ดูทั้งหมด <ChevronRight size={14}/>
              </button>
           </div>

           <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-[3.5rem] p-10 text-white shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-125 transition-transform duration-700"></div>
              <MessageCircle className="mb-6 text-emerald-200" size={32} />
              <h3 className="text-2xl font-black mb-4 tracking-tight leading-tight">หมู่บ้านสุขภาพดี <br/> มิตรภาพสร้างพลัง!</h3>
              <p className="text-sm font-medium opacity-80 mb-8 leading-relaxed italic">"เพื่อนร่วมทางจะช่วยให้เรามีกำลังใจในการดูแลตัวเองได้ดียิ่งขึ้น"</p>
              <div className="space-y-3">
                 <div className="flex items-center gap-3 bg-white/10 p-3 rounded-2xl border border-white/10">
                    <Star className="text-yellow-300" size={16} fill="currentColor"/>
                    <span className="text-[10px] font-black uppercase tracking-widest">ส่งหัวใจ +5 Points</span>
                 </div>
                 <div className="flex items-center gap-3 bg-white/10 p-3 rounded-2xl border border-white/10">
                    <Heart className="text-rose-300" size={16} fill="currentColor"/>
                    <span className="text-[10px] font-black uppercase tracking-widest">รับพลัง +10 EXP</span>
                 </div>
              </div>
           </div>
           
           {activeTab === 'activity' && unreadCount > 0 && (
             <button 
               onClick={handleMarkAllRead}
               className="w-full py-5 bg-white border-4 border-rose-100 text-rose-500 rounded-[2.5rem] font-black text-sm flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all animate-in slide-in-from-bottom-4"
             >
                <CheckCheck size={22}/> อ่านแจ้งเตือนทั้งหมดแล้ว
             </button>
           )}
        </div>
      </div>
    </div>
  );
};

export default Friends;
