import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { AssistanceIaService } from './assistance-ia.service';
import { ChatTaskDto } from './dto/chat-task.dto';
import { JwtAuthGuard } from '../auth/guards/jwt.auth.guard';

/** Type personnalisé pour req.user */
interface RequestAvecUtilisateur extends Request {
  user: { id: number; email: string; role: string };
}

@Controller('assistance-ia')
export class AssistanceIaController {
  constructor(private readonly assistanceIaService: AssistanceIaService) {}

  @UseGuards(JwtAuthGuard)
  @Get('tasks/:taskId')
  async getTaskAi(
    @Param('taskId', ParseIntPipe) taskId: number,
    @Req() req: RequestAvecUtilisateur,
  ) {
    return this.assistanceIaService.getTaskContent(taskId, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('tasks/:taskId/messages')
  async getTaskMessages(
    @Param('taskId', ParseIntPipe) taskId: number,
    @Req() req: RequestAvecUtilisateur,
  ) {
    return this.assistanceIaService.getTaskMessages(taskId, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('tasks/:taskId/chat')
  async chat(
    @Param('taskId', ParseIntPipe) taskId: number,
    @Body() dto: ChatTaskDto,
    @Req() req: RequestAvecUtilisateur,
  ) {
    return this.assistanceIaService.chatWithTask(
      taskId,
      req.user.id,
      dto.message,
      dto.images,
      dto.projectStructure,
      dto.relevantFiles,
    );
  }
}
