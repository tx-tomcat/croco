import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserCacheInterceptor } from '../interceptors/user-cache.interceptor';
import { EggService } from './egg.service';
import { SpeedUpgradeService } from './speed.service';
import { AutoHatchingService } from './auto-hatching.service';

@UseInterceptors(UserCacheInterceptor)
@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly eggService: EggService,
    private readonly speedUpgradeService: SpeedUpgradeService,
    private readonly autoHatchingService: AutoHatchingService,
  ) {}

  @Get('/me')
  @UseGuards(JwtAuthGuard)
  async findOne(@Req() req) {
    const user = await this.userService.findById(Number(req.user.id));
    return user;
  }

  @Post('/claim-token')
  @UseGuards(JwtAuthGuard)
  async claimReward(@Req() req) {
    return this.userService.claimReward(req.user.id);
  }

  @Get('/speed-list')
  @UseGuards(JwtAuthGuard)
  async getSpeedList() {
    const speedList = await this.userService.getSpeedList();
    return speedList;
  }

  @Get('/boost-list')
  @UseGuards(JwtAuthGuard)
  async getBoostList() {
    const boostList = await this.userService.getBoostList();
    return boostList;
  }

  @Get('/fish-list')
  @UseGuards(JwtAuthGuard)
  async getFishList() {
    const fishList = await this.userService.getFishList();
    return fishList;
  }

  @Post('/start-hatching')
  @UseGuards(JwtAuthGuard)
  async startHatching(@Req() req) {
    return await this.eggService.startHatching(req.user.id);
  }

  @Get('/referees/:referralCode')
  @UseGuards(JwtAuthGuard)
  async getReferees(@Param('referralCode') referralCode: string) {
    return await this.userService.getReferees(referralCode);
  }

  @Get('/referrer-rankings')
  async getReferrerRankings() {
    return await this.userService.getTopReferrersSQL();
  }

  @Get('/croco-rankings')
  async getCrocoRankings() {
    return await this.userService.getTopCrocoRanking();
  }

  @Post('/import-wallet')
  @UseGuards(JwtAuthGuard)
  async importWallet(@Req() req, @Body() body: { privateKey: string }) {
    return await this.userService.deriveAndUpdateWallet(
      req.user.id,
      body.privateKey,
    );
  }

  @Post('create-wallet')
  @UseGuards(JwtAuthGuard)
  async createWallet(@Req() req) {
    return await this.userService.createXrplWallet(req.user.id);
  }

  @Post('/purchase-fish')
  @UseGuards(JwtAuthGuard)
  async purchaseFish(@Req() req, @Body() body: { fishItemId: number }) {
    return await this.userService.purchaseFish(req.user.id, body.fishItemId);
  }

  @Post('/logout-wallet')
  @UseGuards(JwtAuthGuard)
  async logoutWallet(@Req() req) {
    return await this.userService.logoutWallet(req.user.id);
  }

  // @Post('/claim-referral-token')
  // @UseGuards(JwtAuthGuard)
  // async claimReferralToken(@Req() req) {
  //   return await this.userService.claimReferralToken(req.user.id);
  // }
}
