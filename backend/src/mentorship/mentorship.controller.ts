import { Controller, Post, Body, UseGuards, Put, Get, Param, Query, Delete } from '@nestjs/common';
import { MentorshipService } from './mentorship.service';
import { CreateMentorSettingsDto } from './dto/create-mentor-settings.dto';
import { UpdateMentorSettingsDto } from './dto/update-mentor-settings.dto';
import { CreateMentorshipRequestDto } from './dto/create-mentorship-request.dto';
import { UpdateMentorshipRequestDto } from './dto/update-mentorship-request.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetCurrentUser } from '../common/decorators/get-current-user.decorator';
import { SearchMentorDto } from './dto/search-mentor.dto';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { CreateMentorshipListingDto } from './dto/create-mentorship-listing.dto';
import { UpdateMentorshipListingDto } from './dto/update-mentorship-listing.dto';
import { ApplyToMentorshipListingDto } from './dto/apply-to-mentorship-listing.dto';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';
import { UpdateMentorshipProgressDto } from './dto/update-mentorship-progress.dto';
import { CreateMeetingDto } from './dto/create-meeting.dto';
import { UpdateMeetingDto } from './dto/update-meeting.dto';
import { CreateAgreementDto } from './dto/create-agreement.dto';
import { UpdateAgreementDto } from './dto/update-agreement.dto';

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
  createFeedback(@GetCurrentUser('sub') authorId: string, @Body() createFeedbackDto: CreateFeedbackDto) {
    return this.mentorshipService.createFeedback(authorId, createFeedbackDto);
  }

  @Get('feedback/mentor/:mentorId')
  getFeedbackForMentor(@Param('mentorId') mentorId: string) {
    return this.mentorshipService.getFeedbackForMentor(mentorId);
  }

  @Get('feedback/mentee/:menteeId')
  getFeedbackForMentee(@Param('menteeId') menteeId: string) {
    return this.mentorshipService.getFeedbackForMentee(menteeId);
  }

  @Get('suggestions')
  getMentorSuggestions(@GetCurrentUser('sub') userId: string) {
    return this.mentorshipService.getMentorSuggestions(userId);
  }

  @Post('listings')
  createMentorshipListing(
    @GetCurrentUser('sub') userId: string,
    @Body() createMentorshipListingDto: CreateMentorshipListingDto,
  ) {
    return this.mentorshipService.createMentorshipListing(userId, createMentorshipListingDto);
  }

  @Get('listings')
  getMentorshipListings() {
    return this.mentorshipService.getMentorshipListings();
  }

  @Get('listings/:id')
  getMentorshipListing(@Param('id') listingId: string) {
    return this.mentorshipService.getMentorshipListing(listingId);
  }

  @Put('listings/:id')
  updateMentorshipListing(
    @Param('id') listingId: string,
    @Body() updateMentorshipListingDto: UpdateMentorshipListingDto,
  ) {
    return this.mentorshipService.updateMentorshipListing(listingId, updateMentorshipListingDto);
  }

  @Delete('listings/:id')
  deleteMentorshipListing(@Param('id') listingId: string) {
    return this.mentorshipService.deleteMentorshipListing(listingId);
  }

  @Post('listings/:id/apply')
  applyToMentorshipListing(
    @GetCurrentUser('sub') userId: string,
    @Param('id') listingId: string,
    @Body() applyToMentorshipListingDto: ApplyToMentorshipListingDto,
  ) {
    return this.mentorshipService.applyToMentorshipListing(userId, listingId, applyToMentorshipListingDto);
  }

  @Get('listings/:id/applications')
  getMentorshipApplications(@Param('id') listingId: string) {
    return this.mentorshipService.getMentorshipApplications(listingId);
  }

  @Put('applications/:id/accept')
  acceptMentorshipApplication(@Param('id') applicationId: string) {
    return this.mentorshipService.acceptMentorshipApplication(applicationId);
  }

  @Put('applications/:id/reject')
  rejectMentorshipApplication(@Param('id') applicationId: string) {
    return this.mentorshipService.rejectMentorshipApplication(applicationId);
  }

  @Post('goals')
  createGoal(@Body() createGoalDto: CreateGoalDto) {
    return this.mentorshipService.createGoal(createGoalDto);
  }

  @Get('goals/:mentorshipId')
  getGoals(@Param('mentorshipId') mentorshipId: string) {
    return this.mentorshipService.getGoals(mentorshipId);
  }

  @Get('goal/:goalId')
  getGoal(@Param('goalId') goalId: string) {
    return this.mentorshipService.getGoal(goalId);
  }

  @Put('goals/:goalId')
  updateGoal(@Param('goalId') goalId: string, @Body() updateGoalDto: UpdateGoalDto) {
    return this.mentorshipService.updateGoal(goalId, updateGoalDto);
  }

  @Delete('goals/:goalId')
  deleteGoal(@Param('goalId') goalId: string) {
    return this.mentorshipService.deleteGoal(goalId);
  }

  @Put('progress/:mentorshipId')
  updateMentorshipProgress(
    @Param('mentorshipId') mentorshipId: string,
    @Body() updateMentorshipProgressDto: UpdateMentorshipProgressDto,
  ) {
    return this.mentorshipService.updateMentorshipProgress(mentorshipId, updateMentorshipProgressDto);
  }

  @Post('meetings')
  createMeeting(@Body() createMeetingDto: CreateMeetingDto) {
    return this.mentorshipService.createMeeting(createMeetingDto);
  }

  @Get('meetings/:mentorshipId')
  getMeetings(@Param('mentorshipId') mentorshipId: string) {
    return this.mentorshipService.getMeetings(mentorshipId);
  }

  @Get('meeting/:meetingId')
  getMeeting(@Param('meetingId') meetingId: string) {
    return this.mentorshipService.getMeeting(meetingId);
  }

  @Put('meetings/:meetingId')
  updateMeeting(@Param('meetingId') meetingId: string, @Body() updateMeetingDto: UpdateMeetingDto) {
    return this.mentorshipService.updateMeeting(meetingId, updateMeetingDto);
  }

  @Delete('meetings/:meetingId')
  deleteMeeting(@Param('meetingId') meetingId: string) {
    return this.mentorshipService.deleteMeeting(meetingId);
  }

  @Post('agreements')
  createAgreement(@Body() createAgreementDto: CreateAgreementDto) {
    return this.mentorshipService.createAgreement(createAgreementDto);
  }

  @Get('agreements/:mentorshipId')
  getAgreement(@Param('mentorshipId') mentorshipId: string) {
    return this.mentorshipService.getAgreement(mentorshipId);
  }

  @Put('agreements/:agreementId')
  updateAgreement(@Param('agreementId') agreementId: string, @Body() updateAgreementDto: UpdateAgreementDto) {
    return this.mentorshipService.updateAgreement(agreementId, updateAgreementDto);
  }
}
