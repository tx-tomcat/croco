// speed-upgrade.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';

export interface SpeedPackage {
  id: number;
  speed: number;
  price: number;
  selected: boolean;
}

@Injectable()
export class SpeedUpgradeService {
  private readonly UPGRADE_DURATION_HOURS = 4;
  private readonly TOTAL_DURATION_HOURS = 20;

  constructor(private prisma: PrismaService) {}

  async getUserCurrentLevel(userId: number): Promise<number> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        autoBoosts: {
          where: {
            boostType: 'speedLevel',
          },
          orderBy: {
            multiplier: 'desc',
          },
          take: 1,
        },
      },
    });

    return user?.autoBoosts[0]?.multiplier || 1;
  }

  async getAvailableUpgrades(userId: number): Promise<SpeedPackage[]> {
    const currentLevel = await this.getUserCurrentLevel(userId);
    const nextLevel = currentLevel + 1;

    // Get all speed upgrade items up to next possible level
    const upgrades = await this.prisma.speedUpgradeItem.findMany({
      where: {
        speed: {
          lte: nextLevel,
        },
      },
      orderBy: {
        speed: 'asc',
      },
    });

    // Get user's selected package if any
    const selectedBoost = await this.prisma.autoBoost.findFirst({
      where: {
        userId,
        boostType: 'speedSelected',
      },
    });

    // Convert to SpeedPackage format with selection status
    return upgrades.map((upgrade) => ({
      id: upgrade.id,
      speed: upgrade.speed,
      price: upgrade.price,
      selected: selectedBoost?.multiplier === upgrade.speed,
    }));
  }

  async selectPackage(
    userId: number,
    packageId: number,
  ): Promise<{
    success: boolean;
    message: string;
    selectedPackage?: SpeedPackage;
  }> {
    try {
      const currentLevel = await this.getUserCurrentLevel(userId);
      const speedPackage = await this.prisma.speedUpgradeItem.findUnique({
        where: { id: packageId },
      });

      if (!speedPackage) {
        return {
          success: false,
          message: 'Package not found',
        };
      }

      if (speedPackage.speed > currentLevel + 1) {
        return {
          success: false,
          message: `Must upgrade to x${currentLevel + 1} before selecting x${speedPackage.speed}`,
        };
      }

      // Update or create selection
      await this.prisma.autoBoost.upsert({
        where: {
          userId,
          boostType: 'speedSelected',
        },
        create: {
          userId,
          boostType: 'speedSelected',
          multiplier: speedPackage.speed,
          expiresAt: new Date('2099-12-31'), // Far future date for selection
        },
        update: {
          multiplier: speedPackage.speed,
        },
      });

      return {
        success: true,
        message: `Selected x${speedPackage.speed} speed package`,
        selectedPackage: {
          ...speedPackage,
          selected: true,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to select package',
      };
    }
  }

  async purchaseSpeedUpgrade(userId: number): Promise<{
    success: boolean;
    message: string;
    upgrade?: any;
  }> {
    try {
      // Get user's current level and selected package
      const currentLevel = await this.getUserCurrentLevel(userId);
      const selectedBoost = await this.prisma.autoBoost.findFirst({
        where: {
          userId,
          boostType: 'speedSelected',
        },
      });

      if (!selectedBoost) {
        return {
          success: false,
          message: 'No speed package selected',
        };
      }

      const speedPackage = await this.prisma.speedUpgradeItem.findFirst({
        where: {
          speed: selectedBoost.multiplier,
        },
      });

      if (!speedPackage) {
        return {
          success: false,
          message: 'Selected package not found',
        };
      }

      // Verify level progression
      if (speedPackage.speed !== currentLevel + 1) {
        return {
          success: false,
          message: `Must upgrade to x${currentLevel + 1} first`,
        };
      }

      // Check user's balance and active egg
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          eggs: {
            where: {
              isIncubating: true,
              hatchProgress: { lt: 100 },
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

      if (user.crocoBalance < speedPackage.price) {
        return {
          success: false,
          message: 'Insufficient Croco balance',
        };
      }

      if (user.eggs.length === 0) {
        return {
          success: false,
          message: 'No active incubating egg found',
        };
      }

      // Calculate expiration times
      const now = new Date();
      const boostExpiresAt = new Date(
        now.getTime() + this.UPGRADE_DURATION_HOURS * 60 * 60 * 1000,
      );
      const totalExpiresAt = new Date(
        now.getTime() + this.TOTAL_DURATION_HOURS * 60 * 60 * 1000,
      );

      // Process upgrade in transaction
      const result = await this.prisma.$transaction(async (prisma) => {
        // Deduct cost
        const updatedUser = await prisma.user.update({
          where: { id: userId },
          data: {
            crocoBalance: {
              decrement: speedPackage.price,
            },
          },
        });

        // Update user's level
        await prisma.autoBoost.upsert({
          where: {
            userId,
            boostType: 'speedLevel',
          },
          create: {
            userId,
            boostType: 'speedLevel',
            multiplier: speedPackage.speed,
            expiresAt: totalExpiresAt,
          },
          update: {
            multiplier: speedPackage.speed,
            expiresAt: totalExpiresAt,
          },
        });

        // Create active boost
        const boost = await prisma.autoBoost.create({
          data: {
            userId,
            boostType: 'hatchSpeed',
            multiplier: speedPackage.speed,
            expiresAt: boostExpiresAt,
          },
        });

        // Create reversion to previous level after boost
        await prisma.autoBoost.create({
          data: {
            userId,
            boostType: 'hatchSpeed',
            multiplier: currentLevel,
            expiresAt: totalExpiresAt,
          },
        });

        return { boost, updatedUser };
      });

      return {
        success: true,
        message: `Speed upgraded to x${speedPackage.speed} for ${this.UPGRADE_DURATION_HOURS} hours`,
        upgrade: result.boost,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to purchase upgrade',
      };
    }
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async processSpeedBoosts() {
    const now = new Date();

    try {
      // Update user levels based on expired boosts
      const expiredLevelBoosts = await this.prisma.autoBoost.findMany({
        where: {
          boostType: 'speedLevel',
          expiresAt: { lt: now },
        },
      });

      for (const boost of expiredLevelBoosts) {
        await this.prisma.autoBoost.update({
          where: { id: boost.id },
          data: {
            multiplier: boost.multiplier - 1, // Revert to previous level
          },
        });
      }

      // Process active speed boosts
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
                  boostType: 'hatchSpeed',
                  expiresAt: { gt: now },
                },
                orderBy: {
                  multiplier: 'desc',
                },
              },
            },
          },
        },
      });

      // Update egg speeds
      for (const egg of activeEggs) {
        const activeBoost = egg.user.autoBoosts[0];
        const newSpeed = activeBoost ? activeBoost.multiplier : 1;

        if (egg.hatchSpeed !== newSpeed) {
          await this.prisma.egg.update({
            where: { id: egg.id },
            data: {
              hatchSpeed: newSpeed,
            },
          });
        }
      }

      // Clean up expired boosts
      await this.prisma.autoBoost.deleteMany({
        where: {
          boostType: 'hatchSpeed',
          expiresAt: { lt: now },
        },
      });
    } catch (error) {
      console.error('Error processing speed boosts:', error);
    }
  }
}
