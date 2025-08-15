import { Controller, Post, Body, UseGuards, Put, Get, Param, Query } from '@nestjs/common';
import { MentorshipService } from './mentorship.service';
import { CreateMentorSettingsDto } from './dto/create-mentor-settings.dto';
import { UpdateMentorSettingsDto } from './dto/update-mentor-settings.dto';
import { CreateMentorshipRequestDto } from './dto/create-mentorship-request.dto';
import { UpdateMentorshipRequestDto } from './dto/update-mentorship-request.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetCurrentUser } from '../common/decorators/get-current-user.decorator';
import { SearchMentorDto } from './dto/search-mentor.dto';
import { CreateFeedbackDto } from './dto/create-feedback.dto';

@Controller('mentorship')
@UseGuards(JwtAuthGuard)
export class MentorshipController {
  constructor(private readonly mentorshipService: MentorshipService) {}

  @Post('settings')
  createMentorSettings(@GetCurrentUser('sub') userId: string, @Body() createMentorSettingsDto: CreateMentorSettingsDto) {
    return this.mentorshipService.createMentorSettings(userId, createMentorSettingsDto);
  }

  @Put('settings')
  updateMentorSettings(@GetCurrentUser('sub') userId: string, @Body() updateMentorSettingsDto: UpdateMentorSettingsDto) {
    return this.mentorshipService.updateMentorSettings(userId, updateMentorSettingsDto);
  }

  @Get('settings')
  getMentorSettings(@GetCurrentUser('sub') userId: string) {
    return this.mentorshipService.getMentorSettings(userId);
  }

  @Post('requests')
  createMentorshipRequest(@GetCurrentUser('sub') userId: string, @Body() createMentorshipRequestDto: CreateMentorshipRequestDto) {
    return this.mentorshipService.createMentorshipRequest(userId, createMentorshipRequestDto);
  }

  @Put('requests/:id')
  updateMentorshipRequest(
    @GetCurrentUser('sub') userId: string,
    @Param('id') requestId: string,
    @Body() updateMentorshipRequestDto: UpdateMentorshipRequestDto,
  ) {
    return this.mentorshipService.updateMentorshipRequest(userId, requestId, updateMentorshipRequestDto);
  }

  @Get('requests/mentor')
  getMentorshipRequestsForMentor(@GetCurrentUser('sub') userId: string) {
    return this.mentorshipService.getMentorshipRequestsForMentor(userId);
  }

  @Get('requests/mentee')
  getMentorshipRequestsForMentee(@GetCurrentUser('sub') userId: string) {
    return this.mentorshipService.getMentorshipRequestsForMentee(userId);
  }

  @Get('mentor')
  getMentorshipsForMentor(@GetCurrentUser('sub') userId: string) {
    return this.mentorshipService.getMentorshipsForMentor(userId);
  }

  @Get('mentee')
  getMentorshipsForMentee(@GetCurrentUser('sub') userId: string) {
    return this.mentorshipService.getMentorshipsForMentee(userId);
  }

  @Get('search')
  searchMentors(@Query() searchMentorDto: SearchMentorDto) {
    return this.mentorshipService.searchMentors(searchMentorDto);
  }

  @Post('feedback')
  createFeedback(@GetCurrentUser('sub') userId: string, @Body() createFeedbackDto: CreateFeedbackDto) {
    return this.mentorshipService.createFeedback(userId, createFeedbackDto);
  }

  @Get('feedback/:mentorId')
  getFeedbackForMentor(@Param('mentorId') mentorId: string) {
    return this.mentorshipService.getFeedbackForMentor(mentorId);
  }

  @Get('suggestions')
  getMentorSuggestions(@GetCurrentUser('sub') userId: string) {
    return this.mentorshipService.getMentorSuggestions(userId);
  }
}
