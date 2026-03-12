import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Req,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { FrontendErrorReportDto } from '../dto/frontend-error-report.dto';

@ApiTags('monitoring')
@Controller('monitoring')
export class FrontendErrorController {
  private readonly logger = new Logger(FrontendErrorController.name);

  @Post('frontend-errors')
  @HttpCode(HttpStatus.ACCEPTED)
  reportFrontendError(
    @Body() dto: FrontendErrorReportDto,
    @Req() req: Request,
  ): { accepted: boolean } {
    this.logger.error(
      `Frontend runtime error [${dto.boundary}] ${dto.message}`,
      dto.stack,
    );
    this.logger.warn(
      `Frontend error context route=${dto.route} ip=${req.ip} ua=${dto.userAgent} ts=${dto.timestamp}`,
    );

    if (dto.componentStack) {
      this.logger.debug(`Frontend component stack: ${dto.componentStack}`);
    }

    return { accepted: true };
  }
}
