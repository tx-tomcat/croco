// auto-hatching.controller.ts
import { Controller, Post, Get, UseGuards, Request } from '@nestjs/common';
import { AutoHatchingService } from './auto-hatching.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('auto-hatching')
export class AutoHatchingController {
  constructor(private readonly autoHatchingService: AutoHatchingService) {}

  @Post('purchase')
  @UseGuards(AuthGuard('jwt'))
  async purchaseAutoHatching(@Request() req) {
    return await this.autoHatchingService.purchaseAutoHatching(req.user.id);
  }

  @Get('status')
  @UseGuards(AuthGuard('jwt'))
  async getAutoHatchingStatus(@Request() req) {
    return await this.autoHatchingService.checkAutoHatchingStatus(req.user.id);
  }
}
