export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Category {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Reward {
  coins: number;
  xp: number;
}

export interface Goal {
  id: number;
  title: string;
  description: string;
  category_id: number;
  category?: Category;
  difficulty: Difficulty;
  /** "YYYY-MM-DD" */
  target_date: string | null;
  completed_at: string | null;
  milestones_total: number;
  milestones_completed: number;
  rewards: { per_milestone: Reward; on_complete: Reward };
  created_at: string;
  updated_at: string;
}

export interface GoalRequest {
  title: string;
  description: string;
  category_id: number;
  difficulty: Difficulty;
  target_date: string | null;
}

export interface Milestone {
  id: number;
  goal_id: number;
  title: string;
  completed: boolean;
  /** "YYYY-MM-DD" */
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface MilestoneWithGoal extends Milestone {
  goal_title: string;
  goal_difficulty: Difficulty;
  goal_target_date: string | null;
  goal_completed_at: string | null;
  reward: Reward;
}

export interface ShopReward {
  id: number;
  name: string;
  description: string;
  icon: string;
  cost: number;
  created_at: string;
  updated_at: string;
}

export interface ShopRewardRequest {
  name: string;
  description: string;
  icon: string;
  cost: number;
}

export interface Wallet {
  coins: number;
  total_earned: number;
  total_spent: number;
  purchases: number;
  level: number;
  total_xp: number;
  xp_into_level: number;
  xp_for_next_level: number;
  xp_to_next_level: number;
  progress_percent: number;
}

export type TransactionType =
  | 'milestone_completed'
  | 'milestone_reopened'
  | 'goal_completed'
  | 'goal_reopened'
  | 'reward_purchased';

export interface WalletTransaction {
  id: number;
  type: TransactionType;
  coins: number;
  xp: number;
  description: string;
  goal_id: number | null;
  milestone_id: number | null;
  reward_id: number | null;
  created_at: string;
}

export interface ProgressResult {
  change: Reward;
  level_up: boolean;
  wallet: Wallet;
  goal?: Goal;
  milestone?: Milestone;
}

export interface PurchaseResult {
  reward: ShopReward;
  transaction: WalletTransaction;
  wallet: Wallet;
}

export interface DifficultyRule {
  difficulty: Difficulty;
  label: string;
  milestone_reward: Reward;
  goal_reward: Reward;
}
