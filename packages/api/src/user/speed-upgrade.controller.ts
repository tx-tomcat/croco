// speed-upgrade.controller.ts
import {
  Controller,
  Post,
  Get,
  Param,
  UseGuards,
  Request,
  Req,
} from '@nestjs/common';
import { SpeedUpgradeService } from './speed.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('speed-upgrade')
export class SpeedUpgradeController {
  constructor(private readonly speedUpgradeService: SpeedUpgradeService) {}

  @Get('packages')
  @UseGuards(AuthGuard)
  async getAvailableUpgrades(@Req() req) {
    return await this.speedUpgradeService.getAvailableUpgrades(req.user.id);
  }

  @Post('select/:packageId')
  @UseGuards(AuthGuard('jwt'))
  async selectPackage(@Req() req, @Param('packageId') packageId: string) {
    return await this.speedUpgradeService.selectPackage(
      req.user.id,
      parseInt(packageId),
    );
  }

  @Post('purchase')
  @UseGuards(AuthGuard)
  async purchaseSpeedUpgrade(@Req() req) {
    return await this.speedUpgradeService.purchaseSpeedUpgrade(req.user.id);
  }

  @Get('current-level')
  @UseGuards(AuthGuard)
  async getCurrentLevel(@Req() req) {
    const level = await this.speedUpgradeService.getUserCurrentLevel(
      req.user.id,
    );
    return { level };
  }
}
