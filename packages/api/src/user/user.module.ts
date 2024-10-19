import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { UserCacheInterceptor } from '../interceptors/user-cache.interceptor';
import { CacheService } from '../cache/cache.service';
import { JwtService } from '@nestjs/jwt';
import { PrismaModule } from '../prisma/prisma.module';
import { ScheduleModule } from '@nestjs/schedule';
import { TelegrafModule } from 'nestjs-telegraf';
@Module({
  imports: [
    PrismaModule,
    ScheduleModule.forRoot(),
    TelegrafModule.forRoot({
      token: process.env.TELEGRAM_TOKEN,
    }),
  ],
  controllers: [UserController],
  providers: [
    UserService,
    UserController,
    UserCacheInterceptor,
    CacheService,
    JwtService,
  ],
  exports: [UserService],
})
export class UserModule {}
