import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { User } from './models/user.model';
import { UsersService } from './users.service';
import { CreateUserInput } from './dto/create-user.input';

@Resolver(() => User)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Mutation(() => User)
  async createUser(@Args('createUserInput') createUserInput: CreateUserInput) {
    return this.usersService.createUser(createUserInput)
  }

  @Query(() => [User], { name: 'users' })
  async getUsers(): Promise<User[]> {
    // return from service, or temporary mock
    return this.usersService.findAll(); 
    // or simply: return []; // works if you haven’t implemented findAll() yet
  }
}
