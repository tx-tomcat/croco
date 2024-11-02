import { PrismaService } from '../prisma/prisma.service';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaCrudService } from 'nestjs-prisma-crud';
import { CacheService } from '../cache/cache.service';
import { withAccelerate } from '@prisma/extension-accelerate';
import { Wallet, Client, Payment, xrpToDrops } from 'xrpl';
import { CronExpression } from '@nestjs/schedule';
import { Cron } from '@nestjs/schedule';
import { EggService } from './egg.service';
import { ReferralRewardService } from './referral-reward.service';
import { Egg, User } from '@prisma/client';

@Injectable()
export class UserService extends PrismaCrudService implements OnModuleInit {
  private readonly logger = new Logger(UserService.name);
  private readonly DESTINATION_ADDRESS = 'rNDyEQGwysviqfs78BoYwuZYqDDAwX5ZkG';
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

  async createXrplWallet(userId: number): Promise<{
    address: string;
    publicKey: string;
  }> {
    try {
      const user = await this.prismaService.user.findFirst({
        where: { id: userId },
        select: {
          xrplAddress: true,
          xrplPublicKey: true,
        },
      });
      if (user?.xrplAddress) {
        return {
          address: user.xrplAddress,
          publicKey: user.xrplPublicKey,
        };
      }
      const wallet = Wallet.generate();

      // Store wallet details in database
      await this.prismaService.user.update({
        where: { id: userId },
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
        publicKey: wallet.publicKey,
      };
    } catch (error) {
      console.error('Error creating XRPL wallet:', error);
      throw new Error('Failed to create XRPL wallet');
    }
  }

  async purchaseFish(
    userId: number,
    fishItemId: number,
  ): Promise<{
    success: boolean;
    message: string;
    transaction?: {
      hash: string;
      xrpAmount: number;
      fishAmount: number;
    };
  }> {
    try {
      // Get user's XRPL details
      const user = await this.prismaService.user.findUnique({
        where: { id: userId },
        select: {
          xrplAddress: true,
          xrplSeed: true,
        },
      });

      if (!user?.xrplAddress || !user?.xrplSeed) {
        return {
          success: false,
          message: 'XRPL wallet not configured',
        };
      }
      const shopItem = await this.prismaService.fishItem.findUnique({
        where: { id: fishItemId },
      });

      // Connect to XRPL
      await this.xrplClient.connect();
      // Create wallet from user's seed
      const wallet = Wallet.fromSeed(user.xrplSeed);

      // Prepare transaction
      const payment: Payment = {
        TransactionType: 'Payment',
        Account: user.xrplAddress,
        Amount: xrpToDrops(shopItem.priceXrpl.toString()),
        Destination: this.DESTINATION_ADDRESS,
      };

      // Submit transaction
      const paymentResult = await this.xrplClient.submitAndWait(payment, {
        wallet,
      });
      if (
        (paymentResult.result.meta as any).TransactionResult !== 'tesSUCCESS'
      ) {
        throw new Error('Transaction failed');
      }

      // Update user's fish balance
      await this.prismaService.user.update({
        where: { id: userId },
        data: {
          fishBalance: {
            increment: shopItem.amount,
          },
        },
      });

      // Log the transaction
      // await this.prismaService.$transaction([
      //   // Log purchase transaction
      //   this.prismaService.fishPurchaseHistory.create({
      //     data: {
      //       userId,
      //       amount: fishAmount,
      //       xrpAmount: xrpPrice,
      //       transactionHash: paymentResult.result.hash,
      //     },
      //   }),
      // ]);

      await this.xrplClient.disconnect();

      return {
        success: true,
        message: 'Fish purchased successfully',
        transaction: {
          hash: paymentResult.result.hash,
          xrpAmount: shopItem.priceXrpl,
          fishAmount: shopItem.amount,
        },
      };
    } catch (error) {
      this.logger.error(`Fish purchase failed: ${error.stack}`);
      await this.xrplClient.disconnect();

      return {
        success: false,
        message: 'Failed to process purchase',
      };
    }
  }

  async findById(id: number) {
    const user = await this.prismaService.user.findUnique({
      where: { id },
      include: {
        egg: true,
        speedUpgrade: {
          include: {
            selectedSpeed: true,
          },
        },
        autoHatching: true,
        autoBoosts: true,
      },
    });

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

  async deriveAndUpdateWallet(
    userId: number,
    privateKey: string,
  ): Promise<{
    success: boolean;
    message: string;
    wallet?: {
      address: string;
      seed: string;
      publicKey: string;
    };
  }> {
    try {
      // Validate private key format
      if (!this.isValidPrivateKey(privateKey)) {
        return {
          success: false,
          message: 'Invalid private key format',
        };
      }

      // Create wallet from private key
      const wallet = await this.deriveWalletFromPrivateKey(privateKey);

      if (!wallet) {
        return {
          success: false,
          message: 'Failed to derive wallet from private key',
        };
      }

      // Check if address is already in use
      const existingUser = await this.prismaService.user.findUnique({
        where: { xrplAddress: wallet.address },
      });

      if (existingUser && existingUser.id !== userId) {
        return {
          success: false,
          message: 'This XRP address is already registered to another user',
        };
      }

      // Update user with wallet details
      await this.prismaService.user.update({
        where: { id: userId },
        data: {
          xrplAddress: wallet.address,
          xrplSeed: wallet.seed,
          xrplPublicKey: wallet.publicKey,
          xrplPrivateKey: privateKey, // Store original private key
        },
      });

      return {
        success: true,
        message: 'Wallet details updated successfully',
        wallet: {
          address: wallet.address,
          seed: wallet.seed,
          publicKey: wallet.publicKey,
        },
      };
    } catch (error) {
      console.error('Failed to derive wallet:', error);
      return {
        success: false,
        message: 'Failed to process wallet derivation',
      };
    }
  }

  private async deriveWalletFromPrivateKey(privateKey: string): Promise<{
    address: string;
    seed: string;
    publicKey: string;
  } | null> {
    try {
      // Create wallet from private key
      const wallet = Wallet.fromSeed(privateKey);

      return {
        address: wallet.address,
        seed: wallet.seed,
        publicKey: wallet.publicKey,
      };
    } catch (error) {
      console.error('Failed to derive wallet from private key:', error);
      return null;
    }
  }

  /**
   * Validate private key format
   */
  private isValidPrivateKey(privateKey: string): boolean {
    // Basic validation - you might want to enhance this based on your requirements
    try {
      // Attempt to create a wallet - this will throw if invalid
      Wallet.fromSeed(privateKey);
      return true;
    } catch (error) {
      this.logger.error(`Invalid private key: ${error.stack}`);
      return false;
    }
  }

  private async isEligibleForReward(userId: number): Promise<{
    eligible: boolean;
    message?: string;
    activeEgg?: Egg;
    user?: User;
  }> {
    const user = await this.findById(userId);
    const egg = await this.prismaService.egg.findFirst({
      where: { userId, isIncubating: true, hatchProgress: { gte: 100 } },
    });
    if (!user) {
      return { eligible: false, message: 'User not found' };
    }

    if (!egg) {
      return { eligible: false, message: 'No active incubating egg found' };
    }

    if (!user.lastDailyReward) {
      return { eligible: true, activeEgg: egg, user };
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

    return { eligible: true, activeEgg: egg, user };
  }

  async getTopCrocoRanking(): Promise<{
    success: boolean;
    rankings?: Array<{
      id: number;
      username: string;
      firstName: string;
      lastName: string;
      crocoBalance: number;
    }>;
    message?: string;
  }> {
    try {
      const rankings = await this.prismaService.user.findMany({
        take: 50,
        orderBy: {
          crocoBalance: 'desc',
        },
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
          crocoBalance: true,
        },
      });

      return {
        success: true,
        rankings,
      };
    } catch (error) {
      this.logger.error(`Failed to get croco rankings: ${error.message}`);
      return {
        success: false,
        message: 'Failed to get croco rankings',
      };
    }
  }

  async getTopReferrersSQL(): Promise<{
    success: boolean;
    rankings?: any;
    message?: string;
  }> {
    try {
      const result = await this.prismaService.$queryRaw`
      WITH ReferralCounts AS (
        SELECT 
          "referredByCode",
          COUNT(*) as referral_count
        FROM "User"
        WHERE "referredByCode" IS NOT NULL
        GROUP BY "referredByCode"
      )
      SELECT 
        u.id,
        u.username,
        u."firstName",
        u."lastName",
        u."referralCode",
        u."totalTokenReferral",
        u."referralLevel",
        u."isPremium",
        COALESCE(rc.referral_count, 0) as referral_count,
        COALESCE(u.username, u."firstName", 'Anonymous') as display_name,
        ROW_NUMBER() OVER (ORDER BY COALESCE(rc.referral_count, 0) DESC) as rank
      FROM "User" u
      LEFT JOIN ReferralCounts rc ON u."referralCode" = rc."referredByCode"
      WHERE u."referralCode" IS NOT NULL
      ORDER BY referral_count DESC
      LIMIT 50
    `;

      return {
        success: true,
        rankings: result,
      };
    } catch (error) {
      this.logger.error(`Failed to get referrer rankings: ${error.stack}`);
      return {
        success: false,
        message: 'Failed to get referrer rankings',
      };
    }
  }

  async getReferees(referralCode: string): Promise<{
    success: boolean;
    referees?: Array<{
      id: number;
      username: string;
      referralToken: number;
      firstName: string;
      lastName: string;
      createdAt: Date;
    }>;
    message?: string;
  }> {
    try {
      const referees = await this.prismaService.user.findMany({
        where: { referredByCode: referralCode },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          username: true,
          referralToken: true,
          createdAt: true,
        },
        orderBy: { referralToken: 'desc' },
      });

      return {
        success: true,
        referees,
      };
    } catch (error) {
      this.logger.error(`Failed to get referees: ${error.message}`);
      return {
        success: false,
        message: 'Failed to get referees',
      };
    }
  }

  async claimReward(userId: number): Promise<{
    success: boolean;
    message: string;
    reward?: number;
    eggProgress?: number;
    isIncubationStopped?: boolean;
  }> {
    const { eligible, activeEgg, user } =
      await this.isEligibleForReward(userId);
    console.log(eligible, activeEgg, user);
    if (!eligible) {
      return {
        success: false,
        message:
          'Not eligible for reward yet. Please wait for the current cycle to complete.',
      };
    }

    try {
      const multiplier = (user as any).autoBoosts.find(
        (boost) =>
          boost.boostType === 'speed' &&
          new Date(boost.expiresAt).getTime() > new Date().getTime(),
      )?.multiplier;
      const speedBoost = activeEgg.hatchSpeed || 1;
      const totalMultiplier = multiplier ? multiplier * speedBoost : speedBoost;
      const reward = 144 * totalMultiplier;

      const { referralRewards } =
        await this.referralRewardService.processReferralRewards(userId, reward);
      // Get current user's croco balance

      await this.prismaService.$transaction(async (prisma) => {
        // Update main user's reward
        const totalTokenReferral = referralRewards.reduce(
          (acc, reward) => acc + reward.amount,
          0,
        );
        const updatedUser = await prisma.user.update({
          where: { id: userId },
          data: {
            crocoBalance: {
              increment: reward,
            },
            totalTokenReferral: {
              increment: totalTokenReferral,
            },
            lastDailyReward: new Date(),
          },
        });

        // Update egg progress

        const updatedEgg = await prisma.egg.update({
          where: { id: activeEgg.id },
          data: {
            hatchProgress: 0,
            hatchSpeed: 1,
            isIncubating: false,
          },
        });

        // Process all referral rewards
        for (const reward of referralRewards) {
          // Update referrer's balance
          await prisma.user.update({
            where: { id: reward.userId },
            data: {
              crocoBalance: {
                increment: reward.amount,
              },
              referralToken: {
                increment: reward.amount,
              },
            },
          });
        }

        return { updatedUser, updatedEgg };
      });

      const message = 'Reward claimed successfully!';

      return {
        success: true,
        message,
        reward: reward,
      };
    } catch (error) {
      this.logger.error(error.stack);
      return {
        success: false,
        message: 'Failed to claim reward. Please try again.',
      };
    }
  }

  // @Cron(CronExpression.EVERY_MINUTE)
  // async checkAndStopInactiveIncubations() {
  //   try {
  //     const now = new Date();
  //     const cutoffTime = new Date(
  //       now.getTime() - this.CYCLE_HOURS * 60 * 60 * 1000,
  //     );

  //     // Find all eggs that should be stopped
  //     const inactiveEggs = await this.prismaService.egg.findMany({
  //       where: {
  //         isIncubating: true,
  //         hatchProgress: { lt: 100 },
  //         user: {
  //           lastDailyReward: {
  //             lt: cutoffTime,
  //           },
  //         },
  //       },
  //     });

  //     if (inactiveEggs.length === 0) return;

  //     // Stop incubation for inactive eggs
  //     await this.prismaService.egg.updateMany({
  //       where: {
  //         id: {
  //           in: inactiveEggs.map((egg) => egg.id),
  //         },
  //       },
  //       data: {
  //         isIncubating: false,
  //       },
  //     });

  //     this.logger.log(
  //       `Stopped incubation for ${inactiveEggs.length} inactive eggs`,
  //     );
  //   } catch (error) {
  //     this.logger.error(
  //       `Failed to stop inactive incubations: ${error.message}`,
  //     );
  //   }
  // }
}
