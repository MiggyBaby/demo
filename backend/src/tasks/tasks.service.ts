import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.task.findMany({
      orderBy: {
        id: 'desc',
      },
    });
  }

  async create(task: any) {
    return this.prisma.task.create({
      data: task,
    });
  }

  async update(id: number, updatedData: any) {
    return this.prisma.task.update({
      where: {
        id: Number(id),
      },
      data: updatedData,
    });
  }

  async delete(id: number) {
    return this.prisma.task.delete({
      where: {
        id: Number(id),
      },
    });
  }
}