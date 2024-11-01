// boost.controller.ts
import {
  Controller,
  Post,
  Get,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { BoostService } from './boost.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('boost')
export class BoostController {
  constructor(private readonly boostService: BoostService) {}

  @Post('purchase/:boostId')
  @UseGuards(AuthGuard('jwt'))
  async purchaseBoost(@Request() req, @Param('boostId') boostId: string) {
    return await this.boostService.purchaseBoost(
      req.user.id,
      parseInt(boostId),
    );
  }

  @Get('current')
  @UseGuards(AuthGuard('jwt'))
  async getCurrentBoosts(@Request() req) {
    return await this.boostService.getCurrentBoosts(req.user.id);
  }
}
