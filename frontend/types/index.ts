export interface Category {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface OKR {
  id: number;
  objective: string;
  category_id: number;
  category?: Category;
  created_at: string;
  updated_at: string;
}

export interface KeyResult {
  id: number;
  okr_id: number;
  title: string;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface RoadmapCategory {
  id: number;
  roadmap_id: number;
  category: string;
  items: RoadmapItem[];
}

export interface RoadmapItem {
  id: number;
  category_id: number;
  title: string;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface Roadmap {
  id: number;
  key_result_id: number;
  topic: string;
  categories: RoadmapCategory[];
  created_at: string;
  updated_at: string;
}

export interface CreateCategoryRequest {
  name: string;
}

export interface CreateOKRRequest {
  objective: string;
  category_id: number;
}

export interface UpdateOKRRequest {
  objective: string;
  category_id: number;
}

export interface UpdateKeyResultRequest {
  title: string;
  completed: boolean;
}

