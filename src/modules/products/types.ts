export interface Product {
  id: number;
  name: string;
  category_id: number;
  description: string;
  price: string;
  unit: string;
  producer_id: number;
  available: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface CreateProductInput {
  name: string;
  category_id: number;
  description: string;
  price: string;
  unit: string;
  producer_id: number;
  available: boolean;
}

export interface UpdateProductInput extends Partial<CreateProductInput> {
  id: number;
}

export interface ProductsApiResponse {
  status: string;
  code: string;
  message: string;
  data: Product[];
}

export interface ProductApiResponse {
  status: string;
  code: string;
  message: string;
  data: Product;
}
