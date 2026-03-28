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
      company_name?: string | null;
      company_desc?: string | null;
      avatar_url?: string | null;
      is_verified?: boolean;
      stripe_customer_id?: string | null;
      created_at?: string;
    };
  }
}
