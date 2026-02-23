// Full Producer Type mit allen Feldern
export interface Producer {
  id: number;
  name: string;
  description: string;
  address: string;
  latitude: string;
  longitude: string;
  phone: string;
  email: string;
  website: string;
  image_url: string;
  unique_url: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  categories: {
    id: number;
    name: string;
    unique_url: string;
    created_at?: string;
    updated_at?: string;
  }[];
  products: {
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
    category?: {
      id: number;
      name: string;
      unique_url: string;
      created_at: string;
      updated_at: string;
    };
  }[];
}

export interface CreateProducerInput {
  name: string;
  description: string;
  address: string;
  latitude: string;
  longitude: string;
  phone: string;
  email: string;
  website: string;
  image_url?: string;
}

export interface UpdateProducerInput extends Partial<CreateProducerInput> {
  id: number;
}

export interface ProducersApiResponse {
  status: string;
  code: string;
  message: string;
  data: Producer[];
}

export interface ProducerApiResponse {
  status: string;
  code: string;
  message: string;
  data: Producer;
}
