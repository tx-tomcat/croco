import {
  Controller,
  Post,
  Get,
  Param,
  UseGuards,
  Request,
  Req,
  Body,
} from '@nestjs/common';
import { SpeedUpgradeService } from './speed.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('speed-upgrade')
export class SpeedUpgradeController {
  constructor(private readonly speedUpgradeService: SpeedUpgradeService) {}

  @Get('packages')
  @UseGuards(JwtAuthGuard)
  async getAvailableUpgrades(@Req() req) {
    return await this.speedUpgradeService.getAvailableUpgrades(req.user.id);
  }

  @Post('purchase')
  @UseGuards(JwtAuthGuard)
  async purchaseSpeedUpgrade(@Req() req, @Body() body: { packageId: number }) {
    return await this.speedUpgradeService.purchaseSpeedUpgrade(
      req.user.id,
      body.packageId,
    );
  }

  @Get('current')
  @UseGuards(JwtAuthGuard)
  async getCurrentSpeed(@Request() req) {
    return await this.speedUpgradeService.getCurrentSpeed(req.user.id);
  }
}
