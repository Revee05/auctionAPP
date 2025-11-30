import 'dotenv/config'
import pkg from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const { PrismaClient } = pkg
const prisma = new PrismaClient({ adapter })

export async function seedTest() {
  await prisma.test.createMany({
    data: [
      { name: 'User Satu', email: 'user1@example.com' },
      { name: 'User Dua', email: 'user2@example.com' },
      { name: 'User Tiga', email: 'user3@example.com' }
    ],
    skipDuplicates: true
  })
  console.log('Seed data Test selesai!')
}