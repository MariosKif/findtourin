import { adminDb } from './firebase';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

// Collection references
export const usersCol = () => adminDb.collection('users');
export const toursCol = () => adminDb.collection('tours');
export const favouritesCol = () => adminDb.collection('favourites');
export const paymentsCol = () => adminDb.collection('payments');
export const contactMessagesCol = () => adminDb.collection('contactMessages');

// Type definitions
export interface UserDoc {
  email: string;
  name: string;
  role: 'user' | 'agency' | 'admin';
  phone?: string | null;
  website?: string | null;
  companyName?: string | null;
  companyDesc?: string | null;
  avatarUrl?: string | null;
  isVerified: boolean;
  stripeCustomerId?: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface TourImage {
  url: string;
  storagePath: string;
  position: number;
  altText?: string | null;
}

export interface TourDoc {
  agencyId: string;
  name: string;
  slug: string;
  description: string;
  country: string;
  city: string;
  departureCountry?: string | null;
  departureCity?: string | null;
  price: number;
  currency: string;
  startDate?: Timestamp | null;
  endDate?: Timestamp | null;
  durationDays?: number | null;
  maxParticipants?: number | null;
  category: string;
  contactEmail?: string | null;
  contactPhone?: string | null;
  contactWebsite?: string | null;
  status: string;
  stripePaymentId?: string | null;
  images: TourImage[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface FavouriteDoc {
  userId: string;
  tourId: string;
  createdAt: Timestamp;
}

export interface PaymentDoc {
  agencyId: string;
  tourId: string;
  stripeSessionId?: string | null;
  stripePaymentIntent?: string | null;
  amount: number;
  currency: string;
  status: string;
  createdAt: Timestamp;
}

export interface ContactMessageDoc {
  name: string;
  email: string;
  subject: string;
  message: string;
  isRead: boolean;
  createdAt: Timestamp;
}

// Helper to convert Firestore doc to plain object with id
export function docToObj<T>(doc: FirebaseFirestore.DocumentSnapshot): (T & { id: string }) | null {
  if (!doc.exists) return null;
  const data = doc.data()!;
  // Convert Timestamps to Date strings for JSON serialization
  const converted: Record<string, any> = { id: doc.id };
  for (const [key, value] of Object.entries(data)) {
    if (value instanceof Timestamp) {
      converted[key] = value.toDate().toISOString();
    } else {
      converted[key] = value;
    }
  }
  return converted as T & { id: string };
}

export function docsToArray<T>(snapshot: FirebaseFirestore.QuerySnapshot): (T & { id: string })[] {
  return snapshot.docs.map(doc => docToObj<T>(doc)!);
}

export { FieldValue, Timestamp };
