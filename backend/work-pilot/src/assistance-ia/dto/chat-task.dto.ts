import { IsNotEmpty, IsString } from 'class-validator';

export class ChatTaskDto {
  @IsString()
  @IsNotEmpty()
  message!: string;
}
