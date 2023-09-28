import { Prisma } from '@prisma/client';

export const newUser: Prisma.UserCreateInput = {
  firstName: 'firstName',
  lastName: 'lastName',
  email: 'test@email.com',
  password: 'testnewP@ssw0rd!',
};

export const newInvalidUser: Prisma.UserCreateInput = {
  firstName: 'firstName',
  lastName: 'lastName',
  email: 'testemail',
  password: 'testPasswo',
};

export const verifiedUser: Prisma.UserCreateInput = {
  firstName: 'firstName',
  lastName: 'lastName',
  email: 'verified@email.com',
  password: 'testnewP@ssw0rd!',
  verified: true,
};

export const signInResponse = {
  accessToken: expect.any(String),
  refreshToken: expect.any(String),
  user: {
    id: expect.any(String),
    firstName: expect.any(String),
    lastName: expect.any(String),
    email: expect.any(String),
    verified: expect.any(Boolean)
  },
};
