import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
  UseGuards,
} from '@nestjs/common';
import { GamificationService } from './gamification.service';
import { AwardPointsDto } from './dto/award-points.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';

@Controller('gamification')
export class GamificationController {
  constructor(private readonly gamificationService: GamificationService) {}

  // Manual award endpoint (admin / internal use)
  @Post('award')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async award(@Body() dto: AwardPointsDto) {
    const res = await this.gamificationService.awardPoints(
      dto.userId,
      dto.points,
      dto.type,
      dto.entityId,
    );

    // res is { userPoints, transaction }
    return { success: true, userPoints: res.userPoints, transaction: res.transaction };
  }

  // Create a transaction and return the transaction object (alias of award, explicit intent)
  @Post('transaction')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async createTransaction(@Body() dto: AwardPointsDto) {
    const res = await this.gamificationService.awardPoints(
      dto.userId,
      dto.points,
      dto.type,
      dto.message,
      dto.entityId,
    );

    return { success: true, transaction: res.transaction, userPoints: res.userPoints };
  }

  // Get stored total points for a user
  @Get('points/:userId')
  async getPoints(@Param('userId') userId: string) {
    const res = await this.gamificationService.getUserPoints(userId);
    return { userId, points: res?.points ?? 0 };
  }

  // Leaderboard endpoint - supports period query: all|day|week|month
  @Get('leaderboard')
  async leaderboard(
    @Query('period', new DefaultValuePipe('all')) period: 'all' | 'day' | 'week' | 'month',
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    const data = await this.gamificationService.getLeaderboardByPeriod(period, limit);
    return { period, limit, data };
  }

  // Recent transactions for a user
  @Get('transactions/:userId')
  async transactions(
    @Param('userId') userId: string,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    const data = await this.gamificationService.getRecentTransactions(userId, limit);
    return { userId, data };
  }
}
