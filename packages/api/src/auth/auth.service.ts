import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { parse, validate } from '@telegram-apps/init-data-node';
import { customAlphabet } from 'nanoid';
import { PrismaService } from '../prisma/prisma.service';
import { Egg, User } from '@prisma/client';
import { Telegraf } from 'telegraf';
import { InjectBot } from 'nestjs-telegraf';
import { Client, Wallet } from 'xrpl';
import { EggService } from '../user/egg.service';
(BigInt.prototype as any).toJSON = function (): number {
  return this.toString();
};

@Injectable()
export class AuthService {
  private nanoid: (size?: number) => string;
  private xrplClient: Client;

  constructor(
    private jwtService: JwtService,
    private readonly prismaService: PrismaService,
    private readonly eggService: EggService,
    @InjectBot() private bot: Telegraf,
  ) {
    const alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    this.nanoid = customAlphabet(alphabet, 8);
    this.xrplClient = new Client(
      process.env.XRPL_NODE_URL || 'wss://s.altnet.rippletest.net:51233',
    );
  }

  async createXrplWallet(userId: bigint): Promise<{
    address: string;
    seed: string;
    publicKey: string;
    privateKey: string;
  }> {
    try {
      await this.xrplClient.connect();

      // Generate new wallet
      const wallet = Wallet.generate();

      // Store wallet details in database
      await this.prismaService.user.update({
        where: { telegramId: userId },
        data: {
          xrplAddress: wallet.address,
          xrplSeed: wallet.seed,
          xrplPublicKey: wallet.publicKey,
          xrplPrivateKey: wallet.privateKey,
        },
      });

      await this.xrplClient.disconnect();

      return {
        address: wallet.address,
        seed: wallet.seed,
        publicKey: wallet.publicKey,
        privateKey: wallet.privateKey,
      };
    } catch (error) {
      console.error('Error creating XRPL wallet:', error);
      throw new Error('Failed to create XRPL wallet');
    }
  }

  async validateUser(initData: string): Promise<any> {
    try {
      const secretToken = process.env.TELEGRAM_TOKEN;
      validate(initData, secretToken);
      const data = parse(initData);
      return data.user;
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  async checkUser(initData: string) {
    const user: User = await this.validateUser(initData);
    if (!user) {
      throw new UnauthorizedException();
    }
    const userExists = await this.prismaService.user.findUnique({
      where: { telegramId: user.id },
    });
    return { userExists };
  }

  async login(initData: any, referralCode: string) {
    const user: User = await this.validateUser(initData);
    if (!user) {
      throw new UnauthorizedException();
    }
    const newReferralCode = await this.generateReferralCode();

    let referrer: User | null = null;
    let treePath = '';
    if (referralCode) {
      referrer = await this.prismaService.user.findUnique({
        where: { referralCode },
      });
      if (referrer) {
        treePath = referrer.treePath;
        const referrerPathParts = referrer.treePath.split('.');
        if (referrerPathParts.length < 5) {
          treePath = `${referrer.treePath}${treePath === '' ? '' : '.'}${referralCode}`;
        } else {
          treePath = `${referrerPathParts.slice(1).join('.')}.${referralCode}`;
        }
      }
    }
    const images = await this.bot.telegram.getUserProfilePhotos(user.id, 0);
    const profilePhoto = images.photos[0]?.[0]?.file_id;
    let photo_url = null;
    if (profilePhoto) {
      const photoUrl = await this.bot.telegram.getFileLink(profilePhoto);
      if (photoUrl.pathname) {
        photo_url = `https://api.telegram.org/file/bot${process.env.TELEGRAM_TOKEN}/${photoUrl.pathname}`;
      }
    }

    const userDB: User = await this.prismaService.user.upsert({
      where: { telegramId: user.id },
      update: {
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        languageCode: user.languageCode,
        photoUrl: photo_url,
        isPremium: user.isPremium,
      },
      create: {
        telegramId: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        languageCode: user.languageCode,
        photoUrl: photo_url,
        isPremium: user.isPremium,
        referralCode: newReferralCode,
        referredByCode: referrer?.referralCode,
      },
    });
    const activeEgg = await this.eggService.getActiveEgg(userDB.id);
    if (!activeEgg) {
      await this.eggService.createEgg(userDB.id);
    }

    const payload = { ...userDB };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async generateReferralCode(): Promise<string> {
    let code: string;
    let isUnique = false;

    while (!isUnique) {
      code = this.nanoid();
      const existingUser = await this.prismaService.user.findUnique({
        where: { referralCode: code },
      });
      isUnique = !existingUser;
    }

    return code;
  }
}
