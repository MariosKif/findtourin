import type { InferSelectModel } from 'drizzle-orm';
import type { profiles, tours, tourImages, payments, contactMessages, favourites } from '../lib/db/schema';

export type User = InferSelectModel<typeof profiles>;
export type Tour = InferSelectModel<typeof tours>;
export type TourImage = InferSelectModel<typeof tourImages>;
export type Payment = InferSelectModel<typeof payments>;
export type ContactMessage = InferSelectModel<typeof contactMessages>;
export type Favourite = InferSelectModel<typeof favourites>;

export type TourWithImages = Tour & {
  images: TourImage[];
  thumbnail: string | null;
};

export type UserRole = 'user' | 'agency' | 'admin';
export type TourStatus = 'pending_payment' | 'active' | 'inactive' | 'deleted';
export type PaymentStatus = 'pending' | 'completed' | 'failed';
