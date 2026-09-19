import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

const connectDB = async () => {
    try {
        await prisma.$connect();
        console.log('✅ Successfully connected to PostgreSQL database using Prisma.');
    } catch (error) {
        console.error('❌ Failed to connect to the database. Reverting...', error);
        await prisma.$disconnect();
        process.exit(1);
    }
};

connectDB();

export default prisma;
