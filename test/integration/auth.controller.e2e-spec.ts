import request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  HttpStatus
} from '@nestjs/common';
import { AppModule } from '../../src/app.module';
import {
  signInResponse,
  newInvalidUser,
  newUser,
  initializeApp,
  clearDb,
  verifiedUser,
} from '../helpers';
import { PrismaClient } from '@prisma/client';
import { PrismaService } from '../../src/config/prisma';
import { QueueService } from '../../src/modules/queue';
import { IEmailData } from '../../src/modules/mail';
import { RedisStore } from '../../src/common';

describe('AuthController', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let sendEmailMock: jest.SpyInstance;
  let cacheMock: jest.SpyInstance;
  const randomEmail = 'random@email.com';
  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = initializeApp(moduleRef);
    prisma = moduleRef.get<PrismaService>(PrismaService);
    await clearDb(prisma);
    const queueService = moduleRef.get<QueueService>(QueueService);
    const cacheService = moduleRef.get<RedisStore>(RedisStore);
    sendEmailMock = jest
      .spyOn(queueService, 'addEmailToQueue')
      .mockImplementation(async (emailData: IEmailData) => {});
    cacheMock = jest.spyOn(cacheService, 'set');
    await app.init();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  describe('#UserSignUp', () => {
    it('should create a new user successfully', async () => {
      const { status, body } = await request(app.getHttpServer())
        .post('/auth/signup/')
        .send(newUser);
      const user = await prisma.user.findUnique({
        where: { email: newUser.email },
      });
      expect(status).toBe(HttpStatus.CREATED);
      expect(body).toHaveProperty('message');
      expect(user).toBeDefined();
      expect(sendEmailMock).toHaveBeenCalled();
    });

    it('should fail if email is already in use', async () => {
      const { status } = await request(app.getHttpServer())
        .post('/auth/signup')
        .send(newUser);
      expect(status).toBe(HttpStatus.CONFLICT);
    });

    it('should fail if the user input is not valid', async () => {
      const { status } = await request(app.getHttpServer())
        .post('/auth/signup')
        .send(newInvalidUser);
      expect(status).toBe(HttpStatus.BAD_REQUEST);
    });
  });

  describe('#UserSignIn', () => {
    it('should return tokens and the user profile', async () => {
      const { status, body } = await request(app.getHttpServer())
        .post('/auth/signin')
        .send(newUser);
      expect(status).toBe(HttpStatus.OK);
      expect(body.data).toEqual(signInResponse);
    });

    it('should fail for invalid credentials', async () => {
      const unRegisteredUser = { ...newUser };
      unRegisteredUser.email = randomEmail;
      const { status, body } = await request(app.getHttpServer())
        .post('/auth/signin')
        .send(unRegisteredUser);
      expect(status).toBe(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('#Initiate EmailVerification_NotLoggedIn', () => {
    it('should fail for unregistered user', async () => {
      const { status, body } = await request(app.getHttpServer())
        .get('/auth/verify-with-email')
        .send({ email: randomEmail });
      expect(sendEmailMock).not.toHaveBeenCalled();
      expect(status).toBe(HttpStatus.BAD_REQUEST);
      expect(body.message).toBe(
        'Email does not exist, Please sign up on dash to get started',
      );
    });

    it('should not send the mail if the user is already verified', async () => {
      await prisma.user.create({ data: verifiedUser });
      await request(app.getHttpServer())
        .get('/auth/verify-with-email')
        .send({ email: verifiedUser.email });
      expect(sendEmailMock).not.toHaveBeenCalled();
    });

    it('should send a verification mail to the user', async () => {
      const { status, body } = await request(app.getHttpServer())
        .get('/auth/verify-with-email')
        .send({ email: newUser.email });
      expect(sendEmailMock).toHaveBeenCalled();
      expect(status).toBe(HttpStatus.OK);
      expect(body.message).toBe(
        'A verification link has been sent to your mail',
      );
    });
  });

  xdescribe('#EmailVerification_LoggedIn', () => {});
  xdescribe('#EmailVerification', () => {});

  describe('#InitiatePasswordReset', () => {
    it('should fail for an unregistered email address', async () => {
      const { status, body } = await request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({ email: randomEmail });
      expect(status).toBe(HttpStatus.BAD_REQUEST);
      expect(body.message).toBe(
        'Email does not exist, Please sign up on dash to get started',
      );
    });

    it('should send a verification mail to the user', async () => {
      const { status, body } = await request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({ email: newUser.email });
      expect(sendEmailMock).toHaveBeenCalled();
      expect(body.message).toBe(
        'A password reset link has been sent to your mail',
      );
    });
  });
});

xdescribe('#PasswordReset', () => {
  it('should fail for an invalid verification token', () => {});

  it('should fail for a password mismatch', () => {});

  it('should reset the user password', () => {});
});

xdescribe('#LogOut', () => {});
