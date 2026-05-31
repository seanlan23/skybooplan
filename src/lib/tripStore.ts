import { create } from 'zustand';
import type { Coordinates } from './types';

type TripState = {
  activePlaceId: string | null;
  activeDayNumber: number | null;
  focusTarget: Coordinates | null;   // map flies here
  setActivePlace: (id: string, coords: Coordinates) => void;
  setActiveDay: (dayNumber: number, coords: Coordinates) => void;
};

export const useTripStore = create<TripState>((set) => ({
  activePlaceId: null,
  activeDayNumber: null,
  focusTarget: null,
  setActivePlace: (id, coords) =>
    set({ activePlaceId: id, focusTarget: coords }),
  setActiveDay: (dayNumber, coords) =>
    set({ activeDayNumber: dayNumber, activePlaceId: null, focusTarget: coords }),
}));
