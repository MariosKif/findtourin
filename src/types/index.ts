export interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'agency' | 'admin';
  phone?: string | null;
  website?: string | null;
  company_name?: string | null;
  company_desc?: string | null;
  avatar_url?: string | null;
  is_verified: boolean;
  stripe_customer_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface TourImage {
  url: string;
  storage_path: string;
  position: number;
  alt_text?: string | null;
}

export interface Tour {
  id: string;
  agency_id: string;
  name: string;
  slug: string;
  description: string;
  country: string;
  city: string;
  departure_country?: string | null;
  departure_city?: string | null;
  price: number;
  currency: string;
  start_date?: string | null;
  end_date?: string | null;
  duration_days?: number | null;
  max_participants?: number | null;
  category: string;
  contact_email?: string | null;
  contact_phone?: string | null;
  contact_website?: string | null;
  status: string;
  stripe_payment_id?: string | null;
  images: TourImage[];
  view_count: number;
  created_at: string;
  updated_at: string;
}

export interface Favourite {
  id: string;
  user_id: string;
  tour_id: string;
  created_at: string;
}

export interface Payment {
  id: string;
  agency_id: string;
  tour_id: string;
  stripe_session_id?: string | null;
  stripe_payment_intent?: string | null;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export type TourWithImages = Tour & {
  thumbnail: string | null;
};

export type UserRole = 'user' | 'agency' | 'admin';
export type TourStatus = 'pending_payment' | 'active' | 'inactive' | 'deleted';
export type PaymentStatus = 'pending' | 'completed' | 'failed';
