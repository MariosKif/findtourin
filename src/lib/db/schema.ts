import { pgTable, uuid, text, varchar, boolean, timestamp, numeric, integer, index, uniqueIndex } from 'drizzle-orm/pg-core';

export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  role: varchar('role', { length: 20 }).notNull().default('user'),
  phone: varchar('phone', { length: 50 }),
  website: varchar('website', { length: 500 }),
  companyName: varchar('company_name', { length: 255 }),
  companyDesc: text('company_desc'),
  avatarUrl: text('avatar_url'),
  isVerified: boolean('is_verified').notNull().default(false),
  stripeCustomerId: varchar('stripe_customer_id', { length: 255 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const tours = pgTable('tours', {
  id: uuid('id').defaultRandom().primaryKey(),
  agencyId: uuid('agency_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 300 }).notNull().unique(),
  description: text('description').notNull(),
  country: varchar('country', { length: 100 }).notNull(),
  city: varchar('city', { length: 100 }).notNull(),
  departureCountry: varchar('departure_country', { length: 100 }),
  departureCity: varchar('departure_city', { length: 100 }),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).notNull().default('EUR'),
  startDate: timestamp('start_date'),
  endDate: timestamp('end_date'),
  durationDays: integer('duration_days'),
  maxParticipants: integer('max_participants'),
  category: varchar('category', { length: 100 }).notNull(),
  contactEmail: varchar('contact_email', { length: 255 }),
  contactPhone: varchar('contact_phone', { length: 50 }),
  contactWebsite: varchar('contact_website', { length: 500 }),
  status: varchar('status', { length: 20 }).notNull().default('pending_payment'),
  stripePaymentId: varchar('stripe_payment_id', { length: 255 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => [
  index('tours_agency_id_idx').on(table.agencyId),
  index('tours_status_idx').on(table.status),
  index('tours_category_idx').on(table.category),
  index('tours_country_idx').on(table.country),
  index('tours_departure_country_idx').on(table.departureCountry),
]);

export const tourImages = pgTable('tour_images', {
  id: uuid('id').defaultRandom().primaryKey(),
  tourId: uuid('tour_id').notNull().references(() => tours.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  publicId: varchar('public_id', { length: 255 }).notNull(),
  position: integer('position').notNull().default(0),
  altText: varchar('alt_text', { length: 255 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => [
  index('tour_images_tour_id_idx').on(table.tourId),
]);

export const payments = pgTable('payments', {
  id: uuid('id').defaultRandom().primaryKey(),
  agencyId: uuid('agency_id').notNull().references(() => profiles.id),
  tourId: uuid('tour_id').notNull().references(() => tours.id),
  stripeSessionId: varchar('stripe_session_id', { length: 255 }).unique(),
  stripePaymentIntent: varchar('stripe_payment_intent', { length: 255 }),
  amount: integer('amount').notNull(),
  currency: varchar('currency', { length: 3 }).notNull().default('EUR'),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const contactMessages = pgTable('contact_messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  subject: varchar('subject', { length: 500 }).notNull(),
  message: text('message').notNull(),
  isRead: boolean('is_read').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const favourites = pgTable('favourites', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  tourId: uuid('tour_id').notNull().references(() => tours.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => [
  index('favourites_user_id_idx').on(table.userId),
  uniqueIndex('favourites_user_tour_idx').on(table.userId, table.tourId),
]);
