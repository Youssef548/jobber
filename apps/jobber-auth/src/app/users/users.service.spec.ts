import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma-clients/jobber-auth';
import * as bcrypt from 'bcryptjs';

// Mock bcryptjs
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashedPassword123'),
}));

describe('UsersService', () => {
  let service: UsersService;
  let prismaService: jest.Mocked<PrismaService>;

  const mockPrismaService = {
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prismaService = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return all users', () => {
    const users = service.findAll();
    expect(users).toEqual([
      { id: 1, email: 'test@example.com' },
      { id: 2, email: 'admin@example.com' },
    ]);
  });

  describe('createUser', () => {
    it('should create a user with hashed password', async () => {
      const createUserInput: Prisma.UserCreateInput = {
        email: 'newuser@example.com',
        password: 'plainPassword',
      };

      const expectedUser = {
        id: 3,
        email: 'newuser@example.com',
        password: 'hashedPassword123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.user.create.mockResolvedValue(expectedUser);

      const result = await service.createUser(createUserInput);

      expect(bcrypt.hash).toHaveBeenCalledWith('plainPassword', 10);
      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: {
          email: 'newuser@example.com',
          password: 'hashedPassword123',
        },
      });
      expect(result).toEqual(expectedUser);
    });
  });
});
