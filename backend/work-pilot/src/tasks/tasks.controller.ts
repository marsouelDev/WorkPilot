import {
  Controller,
  Post,
  Param,
  ParseIntPipe,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt.auth.guard';
import { TasksService } from './tasks.service';

interface RequestAvecUtilisateur extends Request {
  user: {
    id: number;
    email: string;
    nom: string;
    prenom: string;
    roleGlobal: string;
  };
}

@UseGuards(JwtAuthGuard)
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post(':id/choisir')
  async choisirTache(
    @Param('id', ParseIntPipe) tacheId: number,
    @Req() req: RequestAvecUtilisateur,
  ) {
    return this.tasksService.choisirTache(tacheId, req.user.id);
  }
}
