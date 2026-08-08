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
import { AssistanceIaService } from './assistance-ia.service';
import { ChatTaskDto } from './dto/chat-task.dto';
import { JwtAuthGuard } from '../auth/guards/jwt.auth.guard';

@Controller('assistance-ia')
export class AssistanceIaController {
  constructor(private readonly AssistanceIaService: AssistanceIaService) {}

  @UseGuards(JwtAuthGuard)
  @Get('tasks/:taskId')
  async getTaskAi(
    @Param('taskId', ParseIntPipe) taskId: number,
    @Req() req: any,
  ) {
    return this.AssistanceIaService.getTaskContent(taskId, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('tasks/:taskId/chat')
  async chat(
    @Param('taskId', ParseIntPipe) taskId: number,
    @Body() dto: ChatTaskDto,
    @Req() req: any,
  ) {
    return this.AssistanceIaService.chatWithTask(
      taskId,
      req.user.id,
      dto.message,
    );
  }
}
