import { PrismaService } from '../prisma/prisma.service';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaCrudService } from 'nestjs-prisma-crud';
import { CacheService } from '../cache/cache.service';
import { withAccelerate } from '@prisma/extension-accelerate';
import { Wallet, Client } from 'xrpl';
import { CronExpression } from '@nestjs/schedule';
import { Cron } from '@nestjs/schedule';
import { EggService } from './egg.service';
import { ReferralRewardService } from './referral-reward.service';

@Injectable()
export class UserService extends PrismaCrudService implements OnModuleInit {
  private readonly logger = new Logger(UserService.name);

  private readonly REWARD_AMOUNT = 144;
  private readonly CYCLE_HOURS = 4;
  private xrplClient: Client;

  constructor(
    private prismaService: PrismaService,
    private cacheService: CacheService,
    private eggService: EggService,
    private referralRewardService: ReferralRewardService,
  ) {
    super({
      model: 'user',
      allowedJoins: [],
      defaultJoins: [],
    });
    this.xrplClient = new Client(
      process.env.XRPL_NODE_URL || 'wss://s.altnet.rippletest.net:51233',
    );
  }
  async onModuleInit() {
    await this.xrplClient.connect();
  }

  async createXrplWallet(userId: bigint): Promise<{
    address: string;
    seed: string;
    publicKey: string;
    privateKey: string;
  }> {
    try {
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

  async findById(id: number) {
    const user = await this.prismaService
      .$extends(withAccelerate())
      .user.findUnique({
        where: { id },
        include: {},
        cacheStrategy: {
          ttl: 60,
          swr: 60,
        },
      });
    if (!user?.xrplAddress) {
      await this.createXrplWallet(user.telegramId);
    }
    return user;
  }

  async getAndSaveUser(id: number) {
    const user = await this.prismaService
      .$extends(withAccelerate())
      .user.findUnique({
        where: { id },
        include: {},
        cacheStrategy: {
          ttl: 60,
          swr: 60,
        },
      });
    const key = `${user.id}:/api/v1/user/me`;
    await this.cacheService.setCache(key, user, 60 * 1000);
    return user;
  }

  async getSpeedList() {
    return this.prismaService.speedUpgradeItem.findMany();
  }

  async getBoostList() {
    return this.prismaService.boostUpgradeItem.findMany();
  }

  async getFishList() {
    return this.prismaService.fishItem.findMany();
  }

  private async isEligibleForReward(userId: number): Promise<{
    eligible: boolean;
    message?: string;
  }> {
    const user = await this.findById(userId);
    const egg = await this.prismaService.egg.findFirst({
      where: { userId, isIncubating: true, hatchProgress: { lt: 100 } },
    });

    if (!user) {
      return { eligible: false, message: 'User not found' };
    }

    if (!egg) {
      return { eligible: false, message: 'No active incubating egg found' };
    }

    if (!user.lastDailyReward) {
      return { eligible: true };
    }

    const now = new Date();
    const timeSinceLastClaim = now.getTime() - user.lastDailyReward.getTime();
    const hoursElapsed = timeSinceLastClaim / (60 * 60 * 1000);

    if (hoursElapsed < this.CYCLE_HOURS) {
      const remainingHours = Math.ceil(this.CYCLE_HOURS - hoursElapsed);
      return {
        eligible: false,
        message: `Next claim available in ${remainingHours} hours`,
      };
    }

    return { eligible: true };
  }

  async claimReward(userId: number): Promise<{
    success: boolean;
    message: string;
    reward?: number;
    eggProgress?: number;
    isIncubationStopped?: boolean;
  }> {
    const isEligible = await this.isEligibleForReward(userId);
    if (!isEligible) {
      return {
        success: false,
        message:
          'Not eligible for reward yet. Please wait for the current cycle to complete.',
      };
    }
    const activeEgg = await this.prismaService.egg.findFirst({
      where: {
        userId,
        isIncubating: true,
        hatchProgress: { lt: 100 },
      },
    });

    if (!activeEgg) {
      return {
        success: false,
        message: 'No active incubating egg found',
      };
    }
    try {
      const progressIncrement = 25;
      const newProgress = Math.min(
        100,
        activeEgg.hatchProgress + progressIncrement,
      );
      const { referralRewards } =
        await this.referralRewardService.processReferralRewards(
          userId,
          this.REWARD_AMOUNT,
        );
      // Get current user's croco balance
      const user = await this.prismaService.user.findUnique({
        where: { id: userId },
        select: { crocoBalance: true },
      });

      // Calculate new balance
      const newBalance = user.crocoBalance + this.REWARD_AMOUNT;

      // Check if balance will be exactly REWARD_AMOUNT
      const shouldStopIncubation = newBalance === this.REWARD_AMOUNT;
      await this.prismaService.$transaction(async (prisma) => {
        // Update main user's reward
        const updatedUser = await prisma.user.update({
          where: { id: userId },
          data: {
            crocoBalance: {
              increment: this.REWARD_AMOUNT,
            },
            lastDailyReward: new Date(),
          },
        });

        // Update egg progress
        const updatedEgg = await prisma.egg.update({
          where: { id: activeEgg.id },
          data: {
            hatchProgress: newProgress,
            isIncubating: newProgress < 100,
          },
        });
        if (newProgress >= 100) {
          await prisma.egg.update({
            where: { id: activeEgg.id },
            data: {
              hatchProgress: 0,
              hatchSpeed: 1,
              isIncubating: false,
            },
          });
        }
        // Process all referral rewards
        for (const reward of referralRewards) {
          // Update referrer's balance
          await prisma.user.update({
            where: { id: reward.userId },
            data: {
              crocoBalance: {
                increment: reward.amount,
              },
            },
          });
        }

        return { updatedUser, updatedEgg };
      });

      let message = 'Reward claimed successfully!';
      if (shouldStopIncubation) {
        message = 'Reward claimed and incubation stopped (reached 144 Croco)!';
      } else if (newProgress >= 100) {
        message = 'Reward claimed and egg has completed hatching!';
      }

      return {
        success: true,
        message,
        reward: this.REWARD_AMOUNT,
        eggProgress: newProgress,
        isIncubationStopped: shouldStopIncubation,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to claim reward. Please try again.',
      };
    }
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async checkAndStopInactiveIncubations() {
    try {
      const now = new Date();
      const cutoffTime = new Date(
        now.getTime() - this.CYCLE_HOURS * 60 * 60 * 1000,
      );

      // Find all eggs that should be stopped
      const inactiveEggs = await this.prismaService.egg.findMany({
        where: {
          isIncubating: true,
          hatchProgress: { lt: 100 },
          user: {
            lastDailyReward: {
              lt: cutoffTime,
            },
          },
        },
      });

      if (inactiveEggs.length === 0) return;

      // Stop incubation for inactive eggs
      await this.prismaService.egg.updateMany({
        where: {
          id: {
            in: inactiveEggs.map((egg) => egg.id),
          },
        },
        data: {
          isIncubating: false,
        },
      });

      this.logger.log(
        `Stopped incubation for ${inactiveEggs.length} inactive eggs`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to stop inactive incubations: ${error.message}`,
      );
    }
  }
}
