import 'dotenv/config'
import { prisma } from './prismaClient.js'
import bcrypt from 'bcrypt'

export async function seedUserRoles() {
  // Map user email to role name
  const userRoles = [
    { email: 'superadmin@auctionapp.com', role: 'SUPER_ADMIN' },
    { email: 'admin@auctionapp.com', role: 'ADMIN' },
    { email: 'artist@auctionapp.com', role: 'ARTIST' },
    { email: 'collector@auctionapp.com', role: 'COLLECTOR' },
    { email: 'admin2@auctionapp.com', role: 'ADMIN' },
    { email: 'admin3@auctionapp.com', role: 'ADMIN' },
    { email: 'john.artist@auctionapp.com', role: 'ARTIST' },
    { email: 'sarah.painter@auctionapp.com', role: 'ARTIST' },
    { email: 'mike.sculptor@auctionapp.com', role: 'ARTIST' },
    { email: 'emma.designer@auctionapp.com', role: 'ARTIST' },
    { email: 'david.photo@auctionapp.com', role: 'ARTIST' },
    { email: 'lisa.illustrator@auctionapp.com', role: 'ARTIST' },
    { email: 'james.digital@auctionapp.com', role: 'ARTIST' },
    { email: 'anna.ceramics@auctionapp.com', role: 'ARTIST' },
    { email: 'robert.collector@auctionapp.com', role: 'COLLECTOR' },
    { email: 'maria.artlover@auctionapp.com', role: 'COLLECTOR' },
    { email: 'william.gallery@auctionapp.com', role: 'COLLECTOR' },
    { email: 'patricia.museum@auctionapp.com', role: 'COLLECTOR' },
    { email: 'richard.buyer@auctionapp.com', role: 'COLLECTOR' },
    { email: 'jennifer.patron@auctionapp.com', role: 'COLLECTOR' },
    { email: 'thomas.investor@auctionapp.com', role: 'COLLECTOR' },
    { email: 'nancy.enthusiast@auctionapp.com', role: 'COLLECTOR' },
    { email: 'daniel.connoisseur@auctionapp.com', role: 'COLLECTOR' },
    { email: 'betty.curator@auctionapp.com', role: 'COLLECTOR' }
  ]

  // Seed users with hashed password
  const defaultPassword = 'Password123!'
  const hashedPassword = await bcrypt.hash(defaultPassword, 10)

  for (const ur of userRoles) {
    // Upsert user
    const user = await prisma.user.upsert({
      where: { email: ur.email },
      update: {},
      create: {
        email: ur.email,
        password: hashedPassword,
        name: ur.email.split('@')[0], // contoh nama dari email
      }
    })
    const role = await prisma.role.findUnique({ where: { name: ur.role } })
    if (user && role) {
      await prisma.userRole.upsert({
        where: { userId_roleId: { userId: user.id, roleId: role.id } },
        update: {},
        create: { userId: user.id, roleId: role.id },
      })
    }
  }
  console.log('Seed user_roles selesai!')
}
