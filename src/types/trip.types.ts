import type { Itinerary } from '@/lib/types';

export type TripRow = {
  id: string;
  user_id: string;
  title: string;
  destination: string;
  itinerary: Itinerary;
  created_at: string;
  pdf_unlocked: boolean;
  payment_id: string | null;
};

export type TripInsert = Pick<TripRow, 'title' | 'destination' | 'itinerary'>;
