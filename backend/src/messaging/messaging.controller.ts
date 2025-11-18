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

/**
 * Controller for handling messaging-related HTTP requests.
 * All endpoints are protected by JWT authentication.
 */
@UseGuards(JwtAuthGuard)
@Controller('messages')
export class MessagingController {
  constructor(private readonly messagingService: MessagingService) { }

  /**
   * Sends a new message from the current user to a specified recipient.
   * @param senderId - The ID of the authenticated user sending the message.
   * @param dto - The data transfer object containing recipient ID and message content.
   * @returns A promise that resolves to the created message.
   */
  @Post()
  sendMessage(
    @GetCurrentUser('userId') senderId: string,
    @Body() dto: CreateMessageDto,
  ) {
    return this.messagingService.sendMessage(senderId, dto);
  }

  /**
   * Retrieves the conversation history between the current user and another specified user.
   * Supports pagination for fetching messages.
   * @param userId - The ID of the authenticated user.
   * @param otherUserId - The ID of the other user in the conversation.
   * @param dto - Data transfer object for filtering messages (e.g., pagination).
   * @returns A promise that resolves to an object containing messages and pagination details.
   */
  @Get('conversation/:otherUserId')
  getConversation(
    @GetCurrentUser('userId') userId: string,
    @Param('otherUserId') otherUserId: string,
    @Query() dto: FilterMessagesDto,
  ) {
    return this.messagingService.getConversation(userId, otherUserId, dto);
  }

  /**
   * Retrieves a list of all conversations the current user is part of.
   * Each conversation includes the last message and the other participant's details.
   * @param userId - The ID of the authenticated user.
   * @returns A promise that resolves to an array of conversation summaries.
   */
  @Get('conversations/all')
  getAllConversations(@GetCurrentUser('userId') userId: string) {
    return this.messagingService.getAllConversations(userId);
  }

  /**
   * Syncs messages for offline users.
   * Retrieves all messages sent after the specified timestamp.
   * @param userId - The ID of the authenticated user.
   * @param lastMessageTimestamp - ISO timestamp of the last message the user has.
   * @returns A promise that resolves to an array of new messages.
   */
  @Get('sync')
  syncMessages(
    @GetCurrentUser('userId') userId: string,
    @Query('lastMessageTimestamp') lastMessageTimestamp: string,
  ) {
    const timestamp = lastMessageTimestamp
      ? new Date(lastMessageTimestamp)
      : new Date(0); // Beginning of time if not provided

    return this.messagingService.syncMessages(userId, timestamp);
  }
}
