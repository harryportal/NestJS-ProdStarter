import { Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
/**
 * Clears the entire database
 * @param prisma
 */
export async function clearDb(prisma: PrismaClient) {
  try {
    return await prisma.user.deleteMany({});
  } catch (err: any) {
    Logger.error(`Error clearing database, ${err}`);
  }
}
