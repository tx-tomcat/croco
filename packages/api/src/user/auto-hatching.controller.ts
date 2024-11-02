// auto-hatching.controller.ts
import { Controller, Post, Get, UseGuards, Request } from '@nestjs/common';
import { AutoHatchingService } from './auto-hatching.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('auto-hatching')
export class AutoHatchingController {
  constructor(private readonly autoHatchingService: AutoHatchingService) {}

  @Post('purchase')
  @UseGuards(JwtAuthGuard)
  async purchaseAutoHatching(@Request() req) {
    return await this.autoHatchingService.purchaseAutoHatching(req.user.id);
  }

  @Get('status')
  @UseGuards(JwtAuthGuard)
  async getAutoHatchingStatus(@Request() req) {
    return await this.autoHatchingService.checkAutoHatchingStatus(req.user.id);
  }
}
