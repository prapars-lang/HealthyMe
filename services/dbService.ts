
import { User, HealthLog, AvatarData, UserRole, Item, UserItem, ShopReward, RedemptionRecord, SocialAction, Card, UserCard } from '../types';
import { INITIAL_AVATAR, ITEMS_SHOP } from '../constants';

const SPREADSHEET_ID = '1Y_qsmBerbRpPQdIo5ct0xni0VLoIQJ-C-r9FfRNM7Q8';
const GAS_WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbzEcivzG_NZDpCbE-4806SbZmhKklgjGO2sfXjqQfujEQ5dTpR3YeJpz0y6bOrUAhQZCw/exec';

export const dbService = {
  getSpreadsheetId: () => SPREADSHEET_ID,
  getWebAppUrl: () => GAS_WEBAPP_URL,

  checkConnection: async (): Promise<boolean> => {
    try {
      const res = await dbService.callJSONP('ping', {});
      return res && res.success === true;
    } catch (e) {
      return false;
    }
  },

  callJSONP: (action: string, data: any): Promise<any> => {
    return new Promise((resolve, reject) => {
      const callbackName = 'khm_api_cb_' + Math.floor(Math.random() * 100000);
      const script = document.createElement('script');
      
      const timeoutId = setTimeout(() => {
        cleanup();
        reject(new Error(`[Timeout] เซิร์ฟเวอร์ตอบสนองช้าเกินไปขณะทำ: ${action}`));
      }, 30000);

      const cleanup = () => {
        clearTimeout(timeoutId);
        if (script.parentNode) script.parentNode.removeChild(script);
        delete (window as any)[callbackName];
      };

      (window as any)[callbackName] = (response: any) => {
        cleanup();
        if (response && response.success === false) {
          reject(new Error(response.message || "เซิร์ฟเวอร์แจ้งข้อผิดพลาด"));
        } else {
          resolve(response);
        }
      };

      try {
        const payload = encodeURIComponent(JSON.stringify(data || {}));
        const fullUrl = `${GAS_WEBAPP_URL}?action=${action}&callback=${callbackName}&payload=${payload}&v=${Date.now()}`;
        script.src = fullUrl;
        script.async = true;
        script.setAttribute('crossorigin', 'anonymous');
        script.onerror = () => {
          cleanup();
          reject(new Error(`Network Error: ไม่สามารถเชื่อมต่อกับ Action "${action}" ได้`));
        };
        document.head.appendChild(script);
      } catch (err: any) {
        cleanup();
        reject(err);
      }
    });
  },

  register: async (userData: Partial<User>) => {
    const result = await dbService.callJSONP('registerUser', userData);
    return { ...userData, id: result.userId, role: UserRole.STUDENT } as User;
  },

  login: async (username: string, password: string): Promise<User | null> => {
    const result = await dbService.callJSONP('loginUser', { username, password });
    return result && result.success ? result.user : null;
  },

  getAvatar: async (userId: string): Promise<AvatarData> => {
    try {
      const remote = await dbService.callJSONP('getAvatarData', { userId });
      if (remote && remote.success) {
        return {
          user_id: userId,
          avatar_name: remote.avatar_name,
          level: Number(remote.level),
          exp: Number(remote.exp),
          coin: Number(remote.coin),
          equipped_item_id: remote.equipped_item_id,
          streak_count: Number(remote.streak_count || 0),
          base_emoji: remote.base_emoji || '🧑‍🚀'
        };
      }
    } catch (e) {}
    return INITIAL_AVATAR(userId);
  },

  getCards: async (): Promise<Card[]> => {
    const res = await dbService.callJSONP('getCards', {});
    return res.cards || [];
  },

  getUserCards: async (userId: string): Promise<UserCard[]> => {
    const res = await dbService.callJSONP('getUserCards', { userId });
    return res.userCards || [];
  },

  awardRandomCard: async (userId: string): Promise<{ success: boolean; card: Card }> => {
    return await dbService.callJSONP('awardRandomCard', { userId });
  },

  saveHealthLog: async (log: Omit<HealthLog, 'id'>) => {
    return await dbService.callJSONP('saveHealthLog', log);
  },

  getQuizPool: async (): Promise<any[]> => {
    const res = await dbService.callJSONP('getQuizPool', {});
    return res.data || [];
  },

  updateAvatarStats: async (userId: string, expGain: number) => {
    return await dbService.callJSONP('updateAvatarStats', { userId, expGain });
  },

  getLeaderboard: async (className?: string): Promise<any[]> => {
    const res = await dbService.callJSONP('getLeaderboardData', { className });
    return res.data || [];
  },

  getShopRewards: async (): Promise<ShopReward[]> => {
    const res = await dbService.callJSONP('getShopRewards', {});
    return res.rewards || [];
  },

  redeemReward: async (userId: string, rewardId: string, cost: number) => {
    return await dbService.callJSONP('redeemReward', { userId, rewardId, cost });
  },

  getRedemptions: async (userId?: string): Promise<RedemptionRecord[]> => {
    const res = await dbService.callJSONP('getRedemptions', { userId });
    return res.redemptions || [];
  },

  getAllHealthLogs: async (): Promise<any[]> => {
    const res = await dbService.callJSONP('getAllHealthLogs', {});
    return res.data || [];
  },

  getUserItems: async (userId: string): Promise<UserItem[]> => {
    const res = await dbService.callJSONP('getUserItems', { userId });
    return res.items || [];
  },

  equipItem: async (userId: string, itemId: string) => {
    return await dbService.callJSONP('equipItem', { userId, itemId });
  },

  updateBaseEmoji: async (userId: string, emoji: string) => {
    return await dbService.callJSONP('updateBaseEmoji', { userId, emoji });
  },

  openMysteryBox: async (userId: string, itemName: string) => {
    return await dbService.callJSONP('openMysteryBox', { userId, itemName });
  },

  getBoxLogs: async (userId: string): Promise<any[]> => {
    const res = await dbService.callJSONP('getBoxLogs', { userId });
    return res.logs || [];
  },

  getFriends: async (userId: string): Promise<any[]> => {
    const res = await dbService.callJSONP('getFriends', { userId });
    return res.friends || [];
  },

  addFriend: async (userId: string, friendId: string) => {
    return await dbService.callJSONP('addFriend', { userId, friendId });
  },

  sendSocialAction: async (action: Omit<SocialAction, 'id' | 'is_read' | 'created_at'>) => {
    return await dbService.callJSONP('sendSocialAction', action);
  },

  getSocialActions: async (userId: string): Promise<SocialAction[]> => {
    const res = await dbService.callJSONP('getSocialActions', { userId });
    return res.actions || [];
  },

  markActionsAsRead: async (userId: string) => {
    return await dbService.callJSONP('markActionsAsRead', { userId });
  },

  saveBulkQuiz: async (questions: any[]) => {
    return await dbService.callJSONP('saveBulkQuiz', { questions });
  },

  updateRedemptionStatus: async (id: string, status: string) => {
    return await dbService.callJSONP('updateRedemptionStatus', { id, status });
  },

  deleteShopReward: async (id: string) => {
    return await dbService.callJSONP('deleteShopReward', { id });
  },

  saveShopReward: async (reward: Partial<ShopReward>) => {
    return await dbService.callJSONP('saveShopReward', reward);
  },

  deleteQuizQuestion: async (id: string) => {
    return await dbService.callJSONP('deleteQuizQuestion', { id });
  },

  broadcastReward: async (exp: number, coin: number) => {
    return await dbService.callJSONP('broadcastReward', { exp, coin });
  },

  saveCard: async (card: Partial<Card>) => {
    return await dbService.callJSONP('saveCard', card);
  },

  deleteCard: async (id: string) => {
    return await dbService.callJSONP('deleteCard', { id });
  }
};
