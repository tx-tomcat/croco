import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';
import { withAccelerate } from '@prisma/extension-accelerate';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prismaService: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'secretKey',
    });
  }

  async validate(payload: any) {
    const user = await this.prismaService
      .$extends(withAccelerate())
      .user.findUnique({
        where: {
          id: payload.id,
        },
        cacheStrategy: {
          ttl: 60 * 60,
          swr: 60 * 60,
        },
      });
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
