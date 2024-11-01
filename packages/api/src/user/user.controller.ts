import {
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

  @Get('/daily-reward')
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

  @Post(':eggId/start')
  @UseGuards(JwtAuthGuard)
  async startHatching(@Req() req) {
    return await this.eggService.startHatching(req.user.id);
  }
}
