import 'dotenv/config'
import pkg from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const { PrismaClient } = pkg
export const prisma = new PrismaClient({ adapter })
