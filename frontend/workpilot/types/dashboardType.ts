export type TimeRange = "7d" | "30d" | "90d" | "6m" | "1y" | "all";

export interface DashboardStats {
  totalProjets: number;
  totalUsers?: number;
  attribuees: number;
  enRevue: number;
  terminees: number;
  totalPullRequests: number;
}

export interface TacheChartPoint {
  date: string;
  attribuees: number;
  enRevue: number;
  terminees: number;
}

export interface CountChartPoint {
  date: string;
  count: number;
}

export interface ProjetRecent {
  id: number;
  titre: string;
  description: string | null;
  createdAt: string;
  createurNom?: string;
  totalTaches: number;
  tachesTerminees: number;
  progression: number;
}

export interface UserRecent {
  id: number;
  prenom: string;
  nom: string;
  email: string;
  createdAt: string;
  totalProjets: number;
  totalTaches: number;
}

export interface DashboardData {
  isAdmin: boolean;
  stats: DashboardStats;
  tachesChart: TacheChartPoint[];
  projetsChart: CountChartPoint[];
  usersChart: CountChartPoint[];
  projetsRecents: ProjetRecent[];
  usersRecents: UserRecent[];
  range: TimeRange;
}

export interface DashboardState {
  isAdmin: boolean;
  hasHydrated: boolean; 
  stats: DashboardStats | null;
  tachesChart: TacheChartPoint[];
  projetsChart: CountChartPoint[];
  usersChart: CountChartPoint[];
  projetsRecents: ProjetRecent[];
  usersRecents: UserRecent[];
  range: TimeRange;
  isLoading: boolean;
  error: string | null;
  chargerDashboard: (token: string, range?: TimeRange) => Promise<void>;
  setRange: (range: TimeRange) => void;
}
