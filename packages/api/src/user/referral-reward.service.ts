// referral-reward.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReferralRewardService {
  private readonly logger = new Logger(ReferralRewardService.name);

  // Referral reward percentages for each level
  private readonly REFERRAL_REWARDS = {
    1: 0.15, // 15% for direct referrer
    2: 0.08, // 8% for level 2
    3: 0.05, // 5% for level 3
    4: 0.02, // 2% for level 4
    5: 0.01, // 1% for level 5
  };

  constructor(private prisma: PrismaService) {}

  /**
   * Process referral rewards when a user earns Croco
   */
  async processReferralRewards(
    userId: number,
    baseAmount: number,
  ): Promise<{
    success: boolean;
    referralRewards: Array<{ level: number; userId: number; amount: number }>;
  }> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user?.treePath) {
        return { success: true, referralRewards: [] };
      }

      const referralCodes = user.treePath
        .split('.')
        .filter((code) => code.length > 0)
        .reverse(); // Process from immediate referrer to higher levels

      const referralRewards = [];

      // Process each level of referrers
      for (let level = 1; level <= Math.min(5, referralCodes.length); level++) {
        const referralCode = referralCodes[level - 1];
        const rewardPercentage = this.REFERRAL_REWARDS[level];
        const rewardAmount = baseAmount * rewardPercentage;

        const referrer = await this.prisma.user.findUnique({
          where: { referralCode },
        });

        if (referrer) {
          // Add to referral rewards array for processing
          referralRewards.push({
            level,
            userId: referrer.id,
            amount: rewardAmount,
          });
        }
      }

      return { success: true, referralRewards };
    } catch (error) {
      this.logger.error(
        `Failed to calculate referral rewards: ${error.message}`,
      );
      return { success: false, referralRewards: [] };
    }
  }

  /**
   * Get user's referral chain
   */
  async getReferralChain(userId: number): Promise<{
    success: boolean;
    chain?: any[];
  }> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user || !user.treePath) {
        return {
          success: true,
          chain: [],
        };
      }

      const referralCodes = user.treePath
        .split('.')
        .filter((code) => code.length > 0);
      const chain = [];

      for (let i = 0; i < referralCodes.length; i++) {
        const referrer = await this.prisma.user.findUnique({
          where: { referralCode: referralCodes[i] },
          select: {
            id: true,
            username: true,
            referralCode: true,
          },
        });

        if (referrer) {
          chain.push({
            level: i + 1,
            ...referrer,
            rewardPercentage: this.REFERRAL_REWARDS[i + 1] * 100,
          });
        }
      }

      return {
        success: true,
        chain,
      };
    } catch (error) {
      return {
        success: false,
        chain: null,
      };
    }
  }
}
