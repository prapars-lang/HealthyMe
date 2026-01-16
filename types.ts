
export enum UserRole {
  STUDENT = 'student',
  ADMIN = 'admin'
}

export interface User {
  id: string;
  username: string;
  fullname: string;
  role: UserRole;
  class: string;
  room: string;
  number: string;
  gender: string;
  created_at: string;
}

export interface HealthLog {
  id: string;
  user_id: string;
  date: string;
  missions: string; 
  mood: string;
  water_glasses: number;
  sleep_start: string;
  sleep_end: string;
  sleep_hours: number;
  exercise_activity: string;
  exercise_minutes: number;
  sickness: string;
  height: number;
  weight: number;
  bmi: number;
  steps: number;
  vegetable_score: number;
}

export interface AvatarData {
  user_id: string;
  avatar_name: string;
  level: number;
  exp: number;
  coin: number;
  equipped_item_id?: string;
  streak_count: number;
  base_emoji: string;
}

export interface Card {
  id: string;
  title: string;
  description: string;
  rarity: 'Common' | 'Rare' | 'Legendary';
  image: string;
  power_stats: {
    health: number;
    brain: number;
    energy: number;
  };
}

export interface UserCard {
  id: string;
  user_id: string;
  card_id: string;
  acquired_at: string;
}

export interface ShopReward {
  id: string;
  title: string;
  cost: number;
  stock: number;
  icon: string;
  description: string;
}

export interface RedemptionRecord {
  id: string;
  user_id: string;
  reward_id: string;
  status: 'pending' | 'completed';
  claimed_at: string;
  code: string;
}

export interface Item {
  id: string;
  item_name: string;
  type: string;
  price: number;
  effect: string;
  image: string;
}

export interface UserItem {
  id: string;
  user_id: string;
  item_id: string;
  is_equipped: boolean;
  acquired_at: string;
}

export interface Friend {
  id: string;
  user_id: string;
  friend_id: string;
  created_at: string;
}

export interface SocialAction {
  id: string;
  from_user_id: string;
  to_user_id: string;
  action_type: 'sticker' | 'heart';
  content: string;
  is_read: boolean;
  created_at: string;
}

// Added missing DailyQuest interface to fix import error in constants.ts
export interface DailyQuest {
  id: string;
  title: string;
  description: string;
  goal: number;
  type: string;
  reward: number;
  icon: string;
}
