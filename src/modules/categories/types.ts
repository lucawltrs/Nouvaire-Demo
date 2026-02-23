export interface Category {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface CreateCategoryInput {
  name: string;
}

export interface UpdateCategoryInput extends Partial<CreateCategoryInput> {
  id: number;
}

export interface CategoriesApiResponse {
  status: string;
  code: string;
  message: string;
  data: Category[];
}

export interface CategoryApiResponse {
  status: string;
  code: string;
  message: string;
  data: Category;
}
