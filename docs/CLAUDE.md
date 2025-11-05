# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an **Nx monorepo** for building microservices. Currently contains one authentication microservice (`jobber-auth`) with plans for additional microservices. The architecture uses **NestJS + GraphQL + Prisma + PostgreSQL** with JWT-based authentication.

## Common Commands

### Development

```bash
# Start development server (runs build automatically with dependencies)
npx nx serve jobber-auth

# Build for production
npx nx build jobber-auth

# Run all affected tasks (lint, test, build) for changed code
npx nx affected -t lint test build
```

### Database (Prisma)

```bash
# Generate Prisma client types (required after schema changes)
npx nx generate-types jobber-auth

# Run database migrations in development
npx nx migrate-prisma jobber-auth

# Direct prisma commands (run from apps/jobber-auth)
cd apps/jobber-auth
npx prisma migrate dev --name <migration-name>
npx prisma studio  # Opens database GUI
```

### Testing

```bash
# Run tests for jobber-auth
npx nx test jobber-auth

# Run tests for affected projects
npx nx affected -t test

# Run single test file
npx nx test jobber-auth --testFile=users.service.spec.ts
```

### Code Quality

```bash
# Lint
npx nx lint jobber-auth

# Format with Prettier
npx prettier --write .

# Pre-commit hooks run automatically via Husky + lint-staged
```

### Nx Utilities

```bash
# Visualize project dependency graph
npx nx graph

# Show all available targets for a project
npx nx show project jobber-auth

# List installed plugins
npx nx list

# Generate new NestJS application
npx nx g @nx/nest:app <app-name>

# Generate new library
npx nx g @nx/node:lib <lib-name>
```

## Architecture

### Monorepo Structure

- **Apps**: `/apps/jobber-auth` - Authentication microservice
- **Libs**: `/libs/nestjs` - Shared utilities and models (`@jobber/nestjs`)
- **Custom Prisma Client**: Generated to `/node_modules/@prisma-clients/jobber-auth`

### jobber-auth Modules

**AppModule** - Root module orchestrating the application

- Configures GraphQL with Apollo Server (code-first approach)
- Imports ConfigModule, PrismaModule, UsersModule, AuthModule

**UsersModule** (`apps/jobber-auth/src/app/users/`)

- GraphQL API for user management (createUser mutation, users query)
- UsersService uses Prisma for database operations
- Passwords are hashed with bcrypt before storage
- User model extends AbstractModel from `@jobber/nestjs`

**AuthModule** (`apps/jobber-auth/src/app/auth/`)

- JWT-based authentication (configuration via environment variables)
- AuthResolver provides login mutation (implementation in progress)
- Configured with JwtModule for token generation

**PrismaModule** (`apps/jobber-auth/src/app/prisma/`)

- PrismaService extends PrismaClient
- Handles database connection lifecycle with graceful error handling
- Dev-friendly error messages for connection failures

### Shared Library (`@jobber/nestjs`)

- **AbstractModel**: Base GraphQL ObjectType with ID field
- Import pattern: `import { AbstractModel } from '@jobber/nestjs'`

### Data Flow

```
GraphQL Request
  ↓ Apollo Server
  ↓ Resolver (AuthResolver/UsersResolver)
  ↓ Service (AuthService/UsersService)
  ↓ PrismaService
  ↓ PostgreSQL Database
```

## Key Technical Details

### Build System

- **Webpack** with `@nx/webpack` plugin handles compilation
- Build automatically runs `generate-types` (Prisma) first
- Test target depends on both `generate-types` and `migrate-prisma`
- Output: `dist/apps/jobber-auth`

### Database Schema

- **User model**: id (auto-increment), email (unique), password (hashed), createdAt, updatedAt
- Database URL: `AUTH_DATABASE_URL` environment variable
- PostgreSQL runs in Docker via `docker-compose.yaml`

### Environment Configuration

Required variables (see `apps/jobber-auth/.env.example`):

- `AUTH_DATABASE_URL`: PostgreSQL connection string
- `PORT`: Application port
- `JWT_SECRET`: Secret key for JWT signing
- `JWT_EXPIRATION_MS`: Token expiration time in milliseconds

### TypeScript Configuration

- Path aliases:
  - `@jobber/nestjs` → `libs/nestjs/src/index.ts`
  - `@prisma-clients/jobber-auth` → `node_modules/@prisma-clients/jobber-auth`
- Decorator metadata enabled for NestJS dependency injection
- Target: ES2015

### GraphQL

- **Code-first** approach (TypeScript decorators → schema)
- Apollo Server integrated via `@nestjs/apollo`
- Auto-schema generation enabled
- DTOs use `class-validator` and `class-transformer`

## Development Guidelines

### Adding New Microservices

1. Generate new NestJS app: `npx nx g @nx/nest:app <service-name>`
2. Configure Prisma if needed (separate schema per service)
3. Update path aliases in `tsconfig.base.json` if using custom Prisma client
4. Set up GraphQL in AppModule following jobber-auth pattern
5. Add shared code to `@jobber/nestjs` library

### Working with Prisma

- Schema location: `apps/jobber-auth/prisma/schema.prisma`
- **Always run `npx nx generate-types jobber-auth`** after schema changes
- Custom client output requires path alias in tsconfig
- Import: `import { PrismaClient } from '@prisma-clients/jobber-auth'`

### Module Boundaries

- ESLint enforces module boundary rules via `@nx/eslint-plugin`
- Shared code must go in libs, not directly imported from other apps
- Use `@jobber/nestjs` for cross-service utilities

### Testing

- All services have corresponding `.spec.ts` files
- Use `@nestjs/testing` for creating test modules
- Mock PrismaService for unit tests
- E2E tests in separate `jobber-auth-e2e` project

### CI/CD

- GitHub Actions runs on push to main and PRs
- Executes: `nx affected -t lint test build`
- Nx Cloud enabled for distributed caching (ID: 68efcb1f1c0adf19a7a31f9b)

## Important Patterns

### Creating GraphQL Models

Extend AbstractModel from shared library:

```typescript
import { AbstractModel } from '@jobber/nestjs';
import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class MyModel extends AbstractModel {
  @Field()
  name: string;
}
```

### Using PrismaService

Inject in services and use typed client:

```typescript
constructor(private prisma: PrismaService) {}

async findAll() {
  return this.prisma.user.findMany();
}
```

### Password Hashing

Use bcryptjs for password operations:

```typescript
import * as bcrypt from 'bcryptjs';

const hashedPassword = await bcrypt.hash(password, 10);
```

### JWT Configuration

AuthModule imports JwtModule with config:

```typescript
JwtModule.registerAsync({
  inject: [ConfigService],
  useFactory: (config: ConfigService) => ({
    secret: config.get<string>('JWT_SECRET'),
    signOptions: {
      expiresIn: config.get<string>('JWT_EXPIRATION_MS'),
    },
  }),
});
```
