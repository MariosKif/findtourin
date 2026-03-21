/// <reference path="../.astro/types.d.ts" />

declare namespace App {
  interface Locals {
    user?: {
      id: string;
      email: string;
      name: string;
      role: string;
      phone?: string | null;
      website?: string | null;
      companyName?: string | null;
      companyDesc?: string | null;
      avatarUrl?: string | null;
      isVerified?: boolean;
      stripeCustomerId?: string | null;
      createdAt?: string;
    };
  }
}
