import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { PrismaService } from '../prisma/prisma.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CacheService } from '../cache/cache.service';
import { TelegrafModule } from 'nestjs-telegraf';
import { UserModule } from '../user/user.module';
import { EggService } from '../user/egg.service';

@Module({
  imports: [
    PrismaModule,
    PassportModule,
    UserModule,
    TelegrafModule.forRoot({
      token: process.env.TELEGRAM_TOKEN,
    }),
  ],
  providers: [
    AuthService,
    JwtStrategy,
    PrismaService,
    CacheService,
    EggService,
  ],
  controllers: [AuthController],
})
export class AuthModule {}
