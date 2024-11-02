// boost.controller.ts
import {
  Controller,
  Post,
  Get,
  Param,
  UseGuards,
  Request,
  Body,
} from '@nestjs/common';
import { BoostService } from './boost.service';
import { JwtAuthGuard } from 'auth/jwt-auth.guard';

@Controller('boosts')
export class BoostController {
  constructor(private readonly boostService: BoostService) {}

  @Get('available')
  @UseGuards(JwtAuthGuard)
  async getAvailableBoosts(@Request() req) {
    return await this.boostService.getAvailableBoosts(req.user.id);
  }

  @Post('purchase')
  @UseGuards(JwtAuthGuard)
  async purchaseBoost(@Request() req, @Body() body: { boostId: number }) {
    return await this.boostService.purchaseBoost(req.user.id, body.boostId);
  }

  @Get('active')
  @UseGuards(JwtAuthGuard)
  async getActiveBoosts(@Request() req) {
    return await this.boostService.getUserActiveBoosts(req.user.id);
  }

  @Get('current')
  @UseGuards(JwtAuthGuard)
  async getCurrentBoost(@Request() req) {
    const multiplier = await this.boostService.getCurrentBoost(req.user.id);
    return { multiplier };
  }
}
