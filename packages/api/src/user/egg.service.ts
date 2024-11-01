// egg.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EggService {
  constructor(private prisma: PrismaService) {}

  async createEgg(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { eggs: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Create new egg with isIncubating set to false initially
    const egg = await this.prisma.egg.create({
      data: {
        userId,
        hatchProgress: 0,
        hatchSpeed: 1,
        isIncubating: false, // Add this field to your Prisma schema
      },
    });

    return egg;
  }

  async startHatching(userId: number) {
    // Check if the egg exists and belongs to the user
    const activeEgg = await this.prisma.egg.findFirst({
      where: {
        userId,
        isIncubating: true,
      },
    });

    if (!activeEgg) {
      throw new NotFoundException('Egg not found');
    }

    if (activeEgg.isIncubating) {
      return {
        success: false,
        message: 'Egg is already incubating',
      };
    }

    // Start incubation
    const updatedEgg = await this.prisma.egg.update({
      where: { id: activeEgg.id },
      data: {
        isIncubating: true,
        lastIncubationStart: new Date(),
      },
    });

    return {
      success: true,
      message: 'Egg incubation started successfully',
      egg: updatedEgg,
    };
  }

  async stopHatching(userId: number, eggId: number) {
    const updatedEgg = await this.prisma.egg.update({
      where: {
        id: eggId,
        userId,
      },
      data: {
        isIncubating: false,
      },
    });

    return {
      success: true,
      message: 'Egg incubation stopped',
      egg: updatedEgg,
    };
  }

  async getActiveEgg(userId: number) {
    return await this.prisma.egg.findFirst({
      where: {
        userId,
        isIncubating: true,
        hatchProgress: { lt: 100 },
      },
    });
  }
}
