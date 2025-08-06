import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Query,
  Param,
} from '@nestjs/common';
import { MessagingService } from './messaging.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { GetCurrentUser } from 'src/common/decorators/get-current-user.decorator';
import { CreateMessageDto } from './dto/create-message.dto';
import { FilterMessagesDto } from './dto/filter-messages.dto';

@UseGuards(JwtAuthGuard)
@Controller('messages')
export class MessagingController {
  constructor(private readonly messagingService: MessagingService) {}

  @Post()
  sendMessage(
    @GetCurrentUser('userId') senderId: string,
    @Body() dto: CreateMessageDto,
  ) {
    return this.messagingService.sendMessage(senderId, dto);
  }

  @Get('conversation/:otherUserId')
  getConversation(
    @GetCurrentUser('userId') userId: string,
    @Param('otherUserId') otherUserId: string,
    @Query() dto: FilterMessagesDto,
  ) {
    return this.messagingService.getConversation(userId, otherUserId, dto);
  }

  @Get('conversations/all')
  getAllConversations(@GetCurrentUser('userId') userId: string) {
    return this.messagingService.getAllConversations(userId);
  }
}
