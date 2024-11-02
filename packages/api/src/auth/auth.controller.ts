import { Controller, Post, Body, UseInterceptors } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserCacheInterceptor } from '../interceptors/user-cache.interceptor';
import { Throttle } from '@nestjs/throttler';

@Controller('auth')
@UseInterceptors(UserCacheInterceptor)
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @Throttle({ default: { limit: 1, ttl: 1000 } })
  async login(@Body() req) {
    return this.authService.login(req.initData, req.referralCode);
  }
}
