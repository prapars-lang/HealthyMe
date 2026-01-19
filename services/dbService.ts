
import { initializeApp } from "firebase/app";
import { 
  getFirestore, collection, doc, setDoc, getDoc, getDocs, 
  query, where, updateDoc, increment, orderBy, limit, addDoc, 
  Timestamp, deleteDoc
} from "firebase/firestore";
import { 
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, 
  signOut 
} from "firebase/auth";
import { User, HealthLog, AvatarData, UserRole, ShopReward, RedemptionRecord, Card, UserCard } from '../types';
import { INITIAL_AVATAR, HEALTH_QUESTIONS } from '../constants';

const firebaseConfig = {
  apiKey: "AIzaSyBRiMYE1XmATwOyqNhxlWIoXknemhSshuQ",
  authDomain: "newagent-emkfqg.firebaseapp.com",
  databaseURL: "https://newagent-emkfqg.firebaseio.com",
  projectId: "newagent-emkfqg",
  storageBucket: "newagent-emkfqg.firebasestorage.app",
  messagingSenderId: "292629209527",
  appId: "1:292629209527:web:abb640a81d35733ec50832"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export const dbService = {
  // Auth
  register: async (userData: any): Promise<User> => {
    const email = `${userData.username}@khm.hero`;
    const userCredential = await createUserWithEmailAndPassword(auth, email, userData.password);
    const uid = userCredential.user.uid;
    const finalUser: User = {
      id: uid, username: userData.username, fullname: userData.fullname,
      role: UserRole.STUDENT, class: userData.class, room: userData.room,
      number: userData.number, gender: userData.gender, created_at: new Date().toISOString()
    };
    await setDoc(doc(db, "users", uid), finalUser);
    await setDoc(doc(db, "avatars", uid), { ...INITIAL_AVATAR(uid), avatar_name: `Hero-${userData.fullname}` });
    return finalUser;
  },

  login: async (username: string, password: string): Promise<User | null> => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, `${username}@khm.hero`, password);
      const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
      return userDoc.exists() ? (userDoc.data() as User) : null;
    } catch (e) { return null; }
  },

  logout: async () => { await signOut(auth); },

  // Stats
  getAvatar: async (userId: string): Promise<AvatarData> => {
    const avatarDoc = await getDoc(doc(db, "avatars", userId));
    return avatarDoc.exists() ? (avatarDoc.data() as AvatarData) : INITIAL_AVATAR(userId);
  },

  updateAvatarStats: async (userId: string, expGain: number) => {
    const avatarRef = doc(db, "avatars", userId);
    const snap = await getDoc(avatarRef);
    if (!snap.exists()) return;
    const data = snap.data();
    let lv = Number(data.level);
    let exp = Number(data.exp) + expGain;
    let coin = Number(data.coin) + Math.floor(expGain / 2);
    while (exp >= (lv * 100)) { exp -= (lv * 100); lv++; }
    await updateDoc(avatarRef, { level: lv, exp, coin });
  },

  updateBaseEmoji: async (userId: string, emoji: string) => {
    await updateDoc(doc(db, "avatars", userId), { base_emoji: emoji });
    return { success: true };
  },

  // Health Logs
  saveHealthLog: async (log: any) => {
    await addDoc(collection(db, "health_logs"), { ...log, created_at: Timestamp.now() });
    await dbService.updateAvatarStats(log.user_id, 10);
    const avatarRef = doc(db, "avatars", log.user_id);
    await updateDoc(avatarRef, { streak_count: increment(1) });
    return { success: true };
  },

  getAllHealthLogs: async (): Promise<any[]> => {
    const snap = await getDocs(collection(db, "health_logs"));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  // Cards
  getCards: async (): Promise<Card[]> => {
    const snap = await getDocs(collection(db, "cards"));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Card));
  },

  getUserCards: async (userId: string): Promise<UserCard[]> => {
    const q = query(collection(db, "user_cards"), where("user_id", "==", userId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as UserCard));
  },

  awardRandomCard: async (userId: string): Promise<{ success: boolean; card: Card }> => {
    const cards = await dbService.getCards();
    if (cards.length === 0) throw new Error("No cards in database");
    const randomCard = cards[Math.floor(Math.random() * cards.length)];
    await addDoc(collection(db, "user_cards"), {
      user_id: userId, card_id: randomCard.id, acquired_at: new Date().toISOString()
    });
    return { success: true, card: randomCard };
  },

  // Shop & Rewards (Admin & Student)
  getShopRewards: async () => {
    const snap = await getDocs(collection(db, "shop_rewards"));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as ShopReward));
  },

  saveShopReward: async (reward: Partial<ShopReward>) => {
    if (reward.id) {
      await setDoc(doc(db, "shop_rewards", reward.id), reward, { merge: true });
    } else {
      const newRef = doc(collection(db, "shop_rewards"));
      await setDoc(newRef, { ...reward, id: newRef.id });
    }
    return { success: true };
  },

  deleteShopReward: async (id: string) => {
    await deleteDoc(doc(db, "shop_rewards", id));
    return { success: true };
  },

  redeemReward: async (userId: string, reward: ShopReward) => {
    const avatarRef = doc(db, "avatars", userId);
    const snap = await getDoc(avatarRef);
    if (snap.data().coin < reward.cost) return { success: false, message: 'เหรียญไม่พอ' };

    await updateDoc(avatarRef, { coin: increment(-reward.cost) });
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    await addDoc(collection(db, "redemptions"), {
      user_id: userId,
      reward_id: reward.id,
      reward_title: reward.title,
      status: 'pending',
      claimed_at: new Date().toISOString(),
      code: code
    });
    return { success: true };
  },

  getUserRedemptions: async (userId: string): Promise<any[]> => {
    const q = query(collection(db, "redemptions"), where("user_id", "==", userId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  getRedemptions: async (): Promise<any[]> => {
    const snap = await getDocs(collection(db, "redemptions"));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  updateRedemptionStatus: async (id: string, status: string) => {
    await updateDoc(doc(db, "redemptions", id), { status });
    return { success: true };
  },

  // Others
  getBoxLogs: async (userId: string): Promise<any[]> => {
    const q = query(collection(db, "box_logs"), where("user_id", "==", userId));
    const snap = await getDocs(q);
    const logs = snap.docs.map(d => d.data());
    return logs.sort((a, b) => new Date(b.opened_at).getTime() - new Date(a.opened_at).getTime());
  },

  openMysteryBox: async (userId: string, itemName: string) => {
    const avatarRef = doc(db, "avatars", userId);
    const snap = await getDoc(avatarRef);
    if (snap.data().coin < 20) return { success: false, message: 'เหรียญไม่พอ' };
    await updateDoc(avatarRef, { coin: increment(-20) });
    await addDoc(collection(db, "box_logs"), {
      user_id: userId, item_name: itemName, opened_at: new Date().toISOString()
    });
    return { success: true };
  },

  getLeaderboard: async (className?: string): Promise<any[]> => {
    const q = query(collection(db, "avatars"), orderBy("level", "desc"), limit(20));
    const snap = await getDocs(q);
    const results = await Promise.all(snap.docs.map(async (d) => {
      const uDoc = await getDoc(doc(db, "users", d.data().user_id));
      if (!uDoc.exists() || (className && uDoc.data()?.class !== className)) return null;
      return { ...d.data(), fullname: uDoc.data()?.fullname, class: uDoc.data()?.class };
    }));
    return results.filter(r => r !== null);
  },

  getQuizPool: async (): Promise<any[]> => {
    const snap = await getDocs(collection(db, "quiz_questions"));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  checkConnection: async () => {
    try { await getDocs(query(collection(db, "cards"), limit(1))); return true; } catch (e) { return false; }
  },

  setupDatabase: async () => {
    const shopItems = [
      { id: 'R1', title: 'ขนมสุขภาพฟรี 1 ชิ้น', cost: 50, stock: 10, icon: '🍎', description: 'นำรหัสไปแลกที่คุณครูประจำชั้น' },
      { id: 'R2', title: 'ดินสอฮีโร่', cost: 30, stock: 20, icon: '✏️', description: 'เขียนลื่นเหมือนมีพลังวิเศษ' },
      { id: 'R3', title: 'บัตรข้ามการบ้าน 1 ครั้ง', cost: 200, stock: 5, icon: '🎫', description: 'ใช้เมื่อต้องการพักผ่อน (โปรดปรึกษาครู)' }
    ];
    for (const item of shopItems) {
      await setDoc(doc(db, "shop_rewards", item.id), item);
    }
    return { success: true };
  }
};
