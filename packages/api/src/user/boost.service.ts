// boost.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';

export interface BoostDetails {
  id: number;
  speed: number;
  duration: number;
  fishPrice: number;
  active: boolean;
  remainingTime?: number;
}

@Injectable()
export class BoostService {
  private readonly logger = new Logger(BoostService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Get available boosts with active status for user
   */
  async getAvailableBoosts(userId: number): Promise<BoostDetails[]> {
    try {
      // Get all boost packages
      const boostPackages = await this.prisma.boostUpgradeItem.findMany({
        orderBy: { speed: 'asc' },
      });

      // Get user's active boosts
      const activeBoosts = await this.prisma.autoBoost.findMany({
        where: {
          userId,
          boostType: 'speed',
          expiresAt: { gt: new Date() },
        },
      });

      // Map boosts with active status and remaining time
      return boostPackages.map((boost) => {
        const activeBoost = activeBoosts.find(
          (ab) => ab.multiplier === boost.speed,
        );

        return {
          id: boost.id,
          speed: boost.speed,
          duration: boost.duration,
          fishPrice: boost.fishPrice,
          active: !!activeBoost,
          remainingTime: activeBoost
            ? Math.max(0, activeBoost.expiresAt.getTime() - Date.now()) / 1000
            : undefined,
        };
      });
    } catch (error) {
      this.logger.error(`Failed to get available boosts: ${error.message}`);
      return [];
    }
  }

  /**
   * Purchase and activate a boost
   */
  async purchaseBoost(
    userId: number,
    boostId: number,
  ): Promise<{
    success: boolean;
    message: string;
    boost?: BoostDetails;
  }> {
    try {
      // Get boost package
      const boostPackage = await this.prisma.boostUpgradeItem.findUnique({
        where: { id: boostId },
      });

      if (!boostPackage) {
        return {
          success: false,
          message: 'Boost package not found',
        };
      }

      // Check if user has an active boost of the same speed
      const existingBoost = await this.prisma.autoBoost.findFirst({
        where: {
          userId,
          boostType: 'speed',
          multiplier: boostPackage.speed,
          expiresAt: { gt: new Date() },
        },
      });

      if (existingBoost) {
        return {
          success: false,
          message: 'This boost is already active',
        };
      }

      // Get user's fish balance
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return {
          success: false,
          message: 'User not found',
        };
      }

      if (user.fishBalance < boostPackage.fishPrice) {
        return {
          success: false,
          message: `Insufficient fish balance. Need ${boostPackage.fishPrice} fish`,
        };
      }

      // Calculate boost duration in hours
      const durationHours = boostPackage.duration * 24; // Convert days to hours
      const expiresAt = new Date(Date.now() + durationHours * 60 * 60 * 1000);

      // Process purchase in transaction
      await this.prisma.$transaction(async (prisma) => {
        // Deduct fish cost
        const updatedUser = await prisma.user.update({
          where: { id: userId },
          data: {
            fishBalance: {
              decrement: boostPackage.fishPrice,
            },
          },
        });

        // Create boost
        const boost = await prisma.autoBoost.create({
          data: {
            userId,
            boostType: 'speed',
            multiplier: boostPackage.speed,
            expiresAt,
          },
        });

        return { boost, updatedUser };
      });

      return {
        success: true,
        message: `Activated ${boostPackage.speed}x speed boost for ${boostPackage.duration} days`,
        boost: {
          id: boostPackage.id,
          speed: boostPackage.speed,
          duration: boostPackage.duration,
          fishPrice: boostPackage.fishPrice,
          active: true,
          remainingTime: durationHours * 3600, // Convert hours to seconds
        },
      };
    } catch (error) {
      this.logger.error(`Failed to purchase boost: ${error.message}`);
      return {
        success: false,
        message: 'Failed to purchase boost',
      };
    }
  }

  /**
   * Get active boost multiplier for user
   */
  async getCurrentBoost(userId: number): Promise<number> {
    const activeBoost = await this.prisma.autoBoost.findFirst({
      where: {
        userId,
        boostType: 'speed',
        expiresAt: { gt: new Date() },
      },
      orderBy: {
        multiplier: 'desc', // Get highest multiplier if multiple boosts
      },
    });

    return activeBoost ? activeBoost.multiplier : 1;
  }

  /**
   * Clean up expired boosts
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async cleanupExpiredBoosts() {
    try {
      await this.prisma.autoBoost.deleteMany({
        where: {
          expiresAt: { lt: new Date() },
          boostType: 'speed',
        },
      });
    } catch (error) {
      this.logger.error(`Failed to cleanup expired boosts: ${error.message}`);
    }
  }

  /**
   * Get user's active boosts
   */
  async getUserActiveBoosts(userId: number): Promise<{
    success: boolean;
    activeBoosts: Array<{
      speed: number;
      remainingTime: number;
      expiresAt: Date;
    }>;
  }> {
    try {
      const activeBoosts = await this.prisma.autoBoost.findMany({
        where: {
          userId,
          boostType: 'speed',
          expiresAt: { gt: new Date() },
        },
        orderBy: {
          expiresAt: 'desc',
        },
      });

      return {
        success: true,
        activeBoosts: activeBoosts.map((boost) => ({
          speed: boost.multiplier,
          remainingTime:
            Math.max(0, boost.expiresAt.getTime() - Date.now()) / 1000,
          expiresAt: boost.expiresAt,
        })),
      };
    } catch (error) {
      return {
        success: false,
        activeBoosts: [],
      };
    }
  }
}
