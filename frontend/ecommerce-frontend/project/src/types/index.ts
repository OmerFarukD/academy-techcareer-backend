export interface Category {
  id: number;
  name: string;
}

export interface ProductImage {
  id: number;
  product_id: number;
  image_url: string;
  created_at: string;
}

export interface Product {
  id: number;
  name: string;
  description: string | null;
  price: number;
  category_id: number | null;
  images: ProductImage[];
}

export interface CartItem {
  id?: number;
  productId: number;
  quantity: number;
  product: Product;
}

export interface User {
  id: number;
  email: string;
  is_active: boolean;
  role_id: number;
}

export interface OrderItem {
  id: number;
  product_id: number;
  quantity: number;
  price: number;
}

export interface Order {
  id: number;
  user_id: number;
  total_price: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  created_at: string;
  items: OrderItem[];
}

export interface AuthToken {
  access_token: string;
  token_type: string;
}
