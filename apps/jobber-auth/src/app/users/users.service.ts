import { Injectable } from '@nestjs/common';
import { User } from './models/user.model';
import { CreateUserInput } from './dto/create-user.input';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from "@prisma-clients/jobber-auth"
import { hash } from 'bcryptjs';

@Injectable()
export class UsersService {
    constructor(private readonly prismaService: PrismaService) {}

  private users: User[] = [
    { id: 1, email: 'test@example.com' },
    { id: 2, email: 'admin@example.com' },
  ];

  findAll(): User[] {
    return this.users;
  }

  async createUser(createUserInput: Prisma.UserCreateInput) {
    return this.prismaService.user.create({
      data: {
        ...createUserInput,
        password: await hash(createUserInput.password, 10),
      }
    })
  }
}
