// Producer Types
export interface Producer {
  id: number;
  name: string;
  created_at?: string;
  updated_at?: string;
}

export interface ProducersApiResponse {
  status: string;
  code: string;
  message: string;
  data: Producer[];
}

// Category Types
export interface Category {
  id: number;
  name: string;
  created_at?: string;
  updated_at?: string;
}

export interface CategoriesApiResponse {
  status: string;
  code: string;
  message: string;
  data: Category[];
}
