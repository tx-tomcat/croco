// auto-hatching.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class AutoHatchingService {
  private readonly logger = new Logger(AutoHatchingService.name);
  private readonly FISH_COST = 500;

  constructor(private prisma: PrismaService) {}

  async purchaseAutoHatching(userId: number): Promise<{
    success: boolean;
    message: string;
    autoHatching?: any;
  }> {
    try {
      // Check if user already has auto hatching
      const existingAutoHatching = await this.prisma.autoHatching.findFirst({
        where: { userId },
      });

      if (existingAutoHatching) {
        return {
          success: false,
          message: 'Auto hatching is already activated for this user',
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

      if (user.fishBalance < this.FISH_COST) {
        return {
          success: false,
          message: `Insufficient fish balance. Need ${this.FISH_COST} fish`,
        };
      }

      // Create auto hatching entry and deduct fish in a transaction
      const result = await this.prisma.$transaction(async (prisma) => {
        // Deduct fish cost
        const updatedUser = await prisma.user.update({
          where: { id: userId },
          data: {
            fishBalance: {
              decrement: this.FISH_COST,
            },
          },
        });

        // Create auto hatching entry
        const autoHatching = await prisma.autoHatching.create({
          data: {
            userId,
            price: this.FISH_COST,
          },
        });

        return { autoHatching, updatedUser };
      });

      return {
        success: true,
        message: 'Auto hatching activated successfully',
        autoHatching: result.autoHatching,
      };
    } catch (error) {
      this.logger.error(`Failed to purchase auto hatching: ${error.message}`);
      return {
        success: false,
        message: 'Failed to activate auto hatching',
      };
    }
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async processAutoHatching() {
    try {
      const now = new Date();
      const fourHoursAgo = new Date(now.getTime() - 4 * 60 * 60 * 1000);

      // Find all users with auto hatching and eligible for claim
      const eligibleUsers = await this.prisma.user.findMany({
        where: {
          autoHatching: {
            some: {}, // Has auto hatching
          },
          OR: [
            { lastDailyReward: null },
            { lastDailyReward: { lt: fourHoursAgo } },
          ],
          eggs: {
            some: {
              isIncubating: true,
              hatchProgress: { lt: 100 },
            },
          },
        },
        include: {
          eggs: {
            where: {
              isIncubating: true,
              hatchProgress: { lt: 100 },
            },
          },
        },
      });

      for (const user of eligibleUsers) {
        await this.processUserAutoClaim(user);
      }
    } catch (error) {
      this.logger.error(`Auto hatching process error: ${error.message}`);
    }
  }

  private async processUserAutoClaim(user: any) {
    try {
      const progressIncrement = 25;
      const activeEgg = user.eggs[0];

      if (!activeEgg) return;

      const newProgress = Math.min(
        100,
        activeEgg.hatchProgress + progressIncrement,
      );

      await this.prisma.$transaction(async (prisma) => {
        // Update user's croco balance and last claim time
        await prisma.user.update({
          where: { id: user.id },
          data: {
            crocoBalance: {
              increment: 144, // Standard Croco reward
            },
            lastDailyReward: new Date(),
          },
        });

        // Update egg progress
        await prisma.egg.update({
          where: { id: activeEgg.id },
          data: {
            hatchProgress: newProgress,
            isIncubating: newProgress < 100, // Stop incubation if complete
          },
        });

        // If egg is complete, create a new egg and start incubation
        if (newProgress >= 100) {
          await prisma.egg.create({
            data: {
              userId: user.id,
              hatchProgress: 0,
              hatchSpeed: activeEgg.hatchSpeed,
              isIncubating: true,
              lastIncubationStart: new Date(),
            },
          });
        }
      });

      this.logger.log(`Auto claim processed for user ${user.id}`);
    } catch (error) {
      this.logger.error(
        `Failed to process auto claim for user ${user.id}: ${error.message}`,
      );
    }
  }

  async checkAutoHatchingStatus(userId: number): Promise<{
    hasAutoHatching: boolean;
    nextClaimTime?: Date;
  }> {
    const autoHatching = await this.prisma.autoHatching.findFirst({
      where: { userId },
    });

    if (!autoHatching) {
      return { hasAutoHatching: false };
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user.lastDailyReward) {
      return {
        hasAutoHatching: true,
        nextClaimTime: new Date(),
      };
    }

    const nextClaimTime = new Date(
      user.lastDailyReward.getTime() + 4 * 60 * 60 * 1000,
    );

    return {
      hasAutoHatching: true,
      nextClaimTime,
    };
  }
}
