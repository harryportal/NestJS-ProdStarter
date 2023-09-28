import { Prisma } from '@prisma/client';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../config';

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getUser(
    where: Prisma.UserWhereUniqueInput,
    select?: Prisma.UserSelect,
  ) {
    return this.prisma.user.findUnique({
      where,
    });
  }

  async upsertGoogleUser(data: Prisma.UserCreateInput) {
    return this.prisma.user.upsert({
      where: { email: data.email },
      update: { firstName: data.firstName, lastName: data.lastName },
      create: {
        ...data,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        verified: true,
      },
    });
  }

  async getUserData(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async updateUser(
    where: Prisma.UserWhereUniqueInput,
    data: Prisma.UserUpdateInput,
  ) {
    return this.prisma.user.update({
      where,
      data,
    });
  }

  async createUser(data: Prisma.UserCreateInput) {
    return this.prisma.user.create({ data });
  }
}
