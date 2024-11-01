import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { UserCacheInterceptor } from '../interceptors/user-cache.interceptor';
import { CacheService } from '../cache/cache.service';
import { JwtService } from '@nestjs/jwt';
import { PrismaModule } from '../prisma/prisma.module';
import { ScheduleModule } from '@nestjs/schedule';
import { TelegrafModule } from 'nestjs-telegraf';
import { EggService } from './egg.service';
import { SpeedUpgradeService } from './speed.service';
import { AutoHatchingService } from './auto-hatching.service';
import { BoostService } from './boost.service';
import { BoostController } from './boost.controller';
import { SpeedUpgradeController } from './speed-upgrade.controller';
import { AutoHatchingController } from './auto-hatching.controller';
import { ReferralRewardService } from './referral-reward.service';

@Module({
  imports: [
    PrismaModule,
    ScheduleModule.forRoot(),
    TelegrafModule.forRoot({
      token: process.env.TELEGRAM_TOKEN,
    }),
  ],
  controllers: [
    UserController,
    BoostController,
    SpeedUpgradeController,
    AutoHatchingController,
  ],
  providers: [
    UserService,
    EggService,
    SpeedUpgradeService,
    AutoHatchingService,
    BoostService,
    UserController,
    UserCacheInterceptor,
    CacheService,
    JwtService,
    ReferralRewardService,
  ],
  exports: [UserService],
})
export class UserModule {}
