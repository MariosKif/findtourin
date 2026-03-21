import type { UserDoc, TourDoc, TourImage, PaymentDoc, ContactMessageDoc, FavouriteDoc } from '../lib/firestore';

export type User = UserDoc & { id: string };
export type Tour = TourDoc & { id: string };
export type { TourImage };
export type Payment = PaymentDoc & { id: string };
export type ContactMessage = ContactMessageDoc & { id: string };
export type Favourite = FavouriteDoc & { id: string };

export type TourWithImages = Tour & {
  thumbnail: string | null;
};

export type UserRole = 'user' | 'agency' | 'admin';
export type TourStatus = 'pending_payment' | 'active' | 'inactive' | 'deleted';
export type PaymentStatus = 'pending' | 'completed' | 'failed';
