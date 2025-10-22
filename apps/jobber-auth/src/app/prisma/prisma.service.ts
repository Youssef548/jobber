import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma-clients/jobber-auth';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
    async onModuleInit() {
        try {
            await this.$connect();
        } catch (err) {
            // Provide a helpful message in development so the app doesn't crash
            // and the developer knows how to bring up the DB or create it.
            const isProd = process.env.NODE_ENV === 'production';
            // Log a concise actionable hint
            console.error('Prisma failed to connect to the database:', err?.message ?? err);
            console.error('If you are running locally, ensure a Postgres server is reachable at the URL in AUTH_DATABASE_URL.');
            console.error('Common fixes:');
            console.error('- Start the database container: docker-compose up -d');
            console.error("- Create the database if it doesn't exist (psql -h localhost -U your_user -c \"CREATE DATABASE jobber_auth;\")");
            console.error('- Run your Prisma migrations: npx prisma migrate deploy --schema=apps/jobber-auth/prisma/schema.prisma');

            if (isProd) {
                // In production we should fail hard so the process manager restarts
                throw err;
            }
            // In development, swallow the error so the rest of the app can start for iterative work.
        }
    }
}
