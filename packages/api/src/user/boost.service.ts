// boost.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class BoostService {
  private readonly logger = new Logger(BoostService.name);
  private readonly INITIAL_BOOST_HOURS = 4;
  private readonly TOTAL_BOOST_HOURS = 24;

  constructor(private prisma: PrismaService) {}

  async purchaseBoost(
    userId: number,
    boostId: number,
  ): Promise<{
    success: boolean;
    message: string;
    boost?: any;
  }> {
    try {
      // Get the boost package
      const boostPackage = await this.prisma.boostUpgradeItem.findUnique({
        where: { id: boostId },
      });

      if (!boostPackage) {
        return {
          success: false,
          message: 'Boost package not found',
        };
      }

      // Check user's fish balance
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          autoBoosts: {
            where: {
              boostType: {
                in: ['crocoBoost', 'speedBoost'],
              },
              expiresAt: {
                gt: new Date(),
              },
            },
          },
        },
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

      // Check for active boosts
      if (user.autoBoosts.length > 0) {
        return {
          success: false,
          message: 'Another boost is already active',
        };
      }

      // Calculate expiration times
      const now = new Date();
      const initialBoostExpires = new Date(
        now.getTime() + this.INITIAL_BOOST_HOURS * 60 * 60 * 1000,
      );
      const totalBoostExpires = new Date(
        now.getTime() + this.TOTAL_BOOST_HOURS * 60 * 60 * 1000,
      );

      // Process the boost purchase in a transaction
      const result = await this.prisma.$transaction(async (prisma) => {
        // Deduct fish cost
        const updatedUser = await prisma.user.update({
          where: { id: userId },
          data: {
            fishBalance: {
              decrement: boostPackage.fishPrice,
            },
          },
        });

        // Create initial 4-hour double boost (speed * 2)
        const initialSpeedBoost = await prisma.autoBoost.create({
          data: {
            userId,
            boostType: 'speedBoost',
            multiplier: boostPackage.speed,
            expiresAt: initialBoostExpires,
          },
        });

        const initialCrocoBoost = await prisma.autoBoost.create({
          data: {
            userId,
            boostType: 'crocoBoost',
            multiplier: 2, // Double the Croco reward
            expiresAt: initialBoostExpires,
          },
        });

        // Create remaining 20-hour normal boost
        const remainingSpeedBoost = await prisma.autoBoost.create({
          data: {
            userId,
            boostType: 'speedBoost',
            multiplier: boostPackage.speed,
            expiresAt: totalBoostExpires,
          },
        });

        return {
          initialSpeedBoost,
          initialCrocoBoost,
          remainingSpeedBoost,
          updatedUser,
        };
      });

      return {
        success: true,
        message: `Boost activated: ${boostPackage.speed}x speed with 2x Croco for 4 hours, then ${boostPackage.speed}x speed for 20 hours`,
        boost: result,
      };
    } catch (error) {
      this.logger.error(`Failed to purchase boost: ${error.message}`);
      return {
        success: false,
        message: 'Failed to activate boost',
      };
    }
  }

  async getCurrentBoosts(userId: number): Promise<{
    speedMultiplier: number;
    crocoMultiplier: number;
    initialBoostRemaining?: number;
    totalBoostRemaining?: number;
  }> {
    const now = new Date();
    const activeBoosts = await this.prisma.autoBoost.findMany({
      where: {
        userId,
        expiresAt: { gt: now },
      },
    });

    const speedBoost = activeBoosts.find((b) => b.boostType === 'speedBoost');
    const crocoBoost = activeBoosts.find((b) => b.boostType === 'crocoBoost');

    const initialBoostEnd = activeBoosts
      .filter((b) => b.boostType === 'crocoBoost')
      .map((b) => b.expiresAt)[0];

    const totalBoostEnd = activeBoosts
      .filter((b) => b.boostType === 'speedBoost')
      .map((b) => b.expiresAt)
      .sort((a, b) => b.getTime() - a.getTime())[0];

    return {
      speedMultiplier: speedBoost ? speedBoost.multiplier : 1,
      crocoMultiplier: crocoBoost ? crocoBoost.multiplier : 1,
      initialBoostRemaining: initialBoostEnd
        ? Math.max(0, initialBoostEnd.getTime() - now.getTime()) / 1000
        : 0,
      totalBoostRemaining: totalBoostEnd
        ? Math.max(0, totalBoostEnd.getTime() - now.getTime()) / 1000
        : 0,
    };
  }

  async calculateReward(userId: number, baseReward: number): Promise<number> {
    const boosts = await this.getCurrentBoosts(userId);
    return baseReward * boosts.speedMultiplier * boosts.crocoMultiplier;
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async processBoosts() {
    const now = new Date();

    try {
      // Clean up expired boosts
      await this.prisma.autoBoost.deleteMany({
        where: {
          expiresAt: { lt: now },
        },
      });

      // Update active eggs with current speed multipliers
      const activeEggs = await this.prisma.egg.findMany({
        where: {
          isIncubating: true,
          hatchProgress: { lt: 100 },
        },
        include: {
          user: {
            include: {
              autoBoosts: {
                where: {
                  boostType: 'speedBoost',
                  expiresAt: { gt: now },
                },
              },
            },
          },
        },
      });

      for (const egg of activeEggs) {
        const speedBoost = egg.user.autoBoosts[0];
        const newSpeed = speedBoost ? speedBoost.multiplier : 1;

        if (egg.hatchSpeed !== newSpeed) {
          await this.prisma.egg.update({
            where: { id: egg.id },
            data: {
              hatchSpeed: newSpeed,
            },
          });
        }
      }
    } catch (error) {
      this.logger.error(`Error processing boosts: ${error.message}`);
    }
  }
}
