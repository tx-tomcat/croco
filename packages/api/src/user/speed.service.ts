// speed-upgrade.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { getNextSpeedLevel } from '../utils/utils';

export interface SpeedPackage {
  id: number;
  speed: number;
  price: number;
  selected: boolean;
  available: boolean;
}

@Injectable()
export class SpeedUpgradeService {
  private readonly logger = new Logger(SpeedUpgradeService.name);
  constructor(private prisma: PrismaService) {}

  /**
   * Get user's current hatch speed level
   */
  async getUserCurrentSpeed(userId: number): Promise<number> {
    const speedBoost = await this.prisma.speedUpgrade.findFirst({
      where: { userId },
      include: {
        selectedSpeed: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return speedBoost?.selectedSpeed.speed || 1;
  }

  /**
   * Get available speed upgrades for the user
   */
  async getAvailableUpgrades(userId: number): Promise<SpeedPackage[]> {
    const currentSpeed = await this.getUserCurrentSpeed(userId);
    const nextSpeed = currentSpeed + 1;

    // Get all speed upgrade items
    const upgrades = await this.prisma.speedUpgradeItem.findMany({
      orderBy: {
        speed: 'asc',
      },
    });

    // Get user's selected speed if any
    const selectedSpeed = await this.prisma.speedUpgrade.findFirst({
      where: { userId },
      include: { selectedSpeed: true },
    });

    // Return packages with availability status
    return upgrades.map((upgrade) => ({
      id: upgrade.id,
      speed: upgrade.speed,
      price: upgrade.price,
      selected: selectedSpeed?.speedId === upgrade.id,
      available: upgrade.speed === nextSpeed, // Only next level is available
    }));
  }

  /**
   * Purchase selected speed upgrade
   */
  async purchaseSpeedUpgrade(
    userId: number,
    packageId: number,
  ): Promise<{
    success: boolean;
    message: string;
    newSpeed?: number;
  }> {
    console.log('purchaseSpeedUpgrade', userId, packageId);
    try {
      const speedPackage = await this.prisma.speedUpgradeItem.findUnique({
        where: { id: packageId },
      });

      if (!speedPackage) {
        return {
          success: false,
          message: 'No speed package found',
        };
      }

      // Verify sequential upgrade
      const currentSpeed = await this.getUserCurrentSpeed(userId);
      if (speedPackage.speed !== getNextSpeedLevel(currentSpeed)) {
        return {
          success: false,
          message: `Must upgrade to x${getNextSpeedLevel(currentSpeed)} speed first`,
        };
      }

      // Check user's Croco balance
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
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
          message: `Insufficient Croco balance. Need ${speedPackage.price} Croco`,
        };
      }

      // Process upgrade in transaction
      await this.prisma.$transaction(async (prisma) => {
        // Deduct Croco cost
        await prisma.user.update({
          where: { id: userId },
          data: {
            crocoBalance: {
              decrement: speedPackage.price,
            },
          },
        });

        // Create new speed boost entry (this will become the current speed)
        await prisma.speedUpgrade.create({
          data: {
            userId,
            speedId: speedPackage.id,
          },
        });

        // Update any active egg's speed
        await prisma.egg.updateMany({
          where: {
            userId,
            isIncubating: true,
          },
          data: {
            hatchSpeed: speedPackage.speed,
          },
        });
      });

      return {
        success: true,
        message: `Speed upgraded to x${speedPackage.speed}`,
        newSpeed: speedPackage.speed,
      };
    } catch (error) {
      this.logger.error(error.stack);
      return {
        success: false,
        message: 'Failed to purchase speed upgrade',
      };
    }
  }

  /**
   * Get current hatch speed multiplier and selected upgrade if any
   */
  async getCurrentSpeed(userId: number): Promise<{
    speed: number;
    selectedUpgrade?: {
      speed: number;
      price: number;
    };
  }> {
    const currentSpeed = await this.getUserCurrentSpeed(userId);

    return {
      speed: currentSpeed,
    };
  }
}
