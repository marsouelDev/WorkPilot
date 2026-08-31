import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

export type TimeRange = '7d' | '30d' | '90d' | '6m' | '1y' | 'all';

interface DashboardStats {
  totalProjets: number;
  attribuees: number;
  enRevue: number;
  terminees: number;
  totalPullRequests: number;
}

interface TacheChartPoint {
  date: string;
  attribuees: number;
  enRevue: number;
  terminees: number;
}

interface ProjetChartPoint {
  date: string;
  count: number;
}

interface ProjetRecent {
  id: number;
  titre: string;
  description: string | null;
  createdAt: string;
  totalTaches: number;
  tachesTerminees: number;
  progression: number;
}

interface DashboardData {
  stats: DashboardStats;
  tachesChart: TacheChartPoint[];
  projetsChart: ProjetChartPoint[];
  projetsRecents: ProjetRecent[];
  range?: TimeRange;
}

interface RawDashboardResult {
  get_dashboard_data: DashboardData | null;
}

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  async getDashboardData(
    userId: number,
    range: TimeRange = '30d',
  ): Promise<DashboardData> {
    const startTime = Date.now();

    try {
      const result = await this.databaseService.$queryRaw<RawDashboardResult[]>`
        SELECT get_dashboard_data(${userId}, ${range})::json
      `;

      if (!result || result.length === 0) {
        throw new NotFoundException(`Utilisateur ${userId} non trouvé`);
      }

      const data = result[0].get_dashboard_data;

      if (!data) {
        throw new NotFoundException(`Utilisateur ${userId} non trouvé`);
      }

      const duration = Date.now() - startTime;

      this.logger.log(
        `Dashboard user=${userId} range=${range} chargé en ${duration}ms`,
      );

      return data;
    } catch (error: unknown) {
      const duration = Date.now() - startTime;

      if (error instanceof NotFoundException) {
        throw error;
      }

      if (error instanceof Error) {
        this.logger.error(
          `Erreur dashboard user=${userId} range=${range} après ${duration}ms : ${error.message}`,
          error.stack,
        );

        if (error.message.includes('null value in column')) {
          throw new NotFoundException(`Utilisateur ${userId} non trouvé`);
        }

        throw new InternalServerErrorException(
          'Erreur lors du chargement du dashboard',
        );
      }

      this.logger.error(
        `Erreur inconnue dashboard user=${userId} range=${range} après ${duration}ms`,
      );

      throw new InternalServerErrorException(
        'Erreur inconnue lors du chargement du dashboard',
      );
    }
  }
}
