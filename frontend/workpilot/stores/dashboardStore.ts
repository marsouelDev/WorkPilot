import { create } from "zustand";
import type { DashboardState, TimeRange } from "@/types/dashboardType";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const useDashboardStore = create<DashboardState>((set, get) => ({
  isAdmin: false,
  hasHydrated: false, // ✅ Unique déclaration — false au départ
  stats: null,
  tachesChart: [],
  projetsChart: [],
  usersChart: [],
  projetsRecents: [],
  usersRecents: [],
  range: "30d",
  isLoading: false,
  error: null,

  setRange: (range: TimeRange) => set({ range }),

  chargerDashboard: async (token: string, range?: TimeRange) => {
    const currentRange = range ?? get().range;
    set({ isLoading: true, error: null, range: currentRange });

    try {
      const res = await fetch(`${API_URL}/dashboard?range=${currentRange}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(
          (err as { message?: string }).message ?? `HTTP ${res.status}`,
        );
      }

      const data = await res.json();

      set({
        isAdmin: data.isAdmin ?? false,
        hasHydrated: true,
        stats: data.stats,
        tachesChart: data.tachesChart,
        projetsChart: data.projetsChart,
        usersChart: data.usersChart ?? [],
        projetsRecents: data.projetsRecents,
        usersRecents: data.usersRecents ?? [],
        range: data.range ?? currentRange,
        isLoading: false,
      });
    } catch (error) {
      set({
        hasHydrated: true,
        error: (error as Error).message,
        isLoading: false,
      });
    }
  },
}));
