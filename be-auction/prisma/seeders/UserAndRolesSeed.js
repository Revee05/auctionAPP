import 'dotenv/config'
import { prisma } from './prismaClient.js'
import bcrypt from 'bcrypt'

export async function seedUsersAndRoles() {
  // Combined list of users (from UserSeed.js and UserRoleSeed.js)
  const users = [
    { name: 'Super Admin', email: 'superadmin@example.com', password: 'superadmin123', roles: ['SUPER_ADMIN'] },
    { name: 'Admin', email: 'admin@example.com', password: 'admin123', roles: ['ADMIN'] },
    { name: 'Artist', email: 'artist@example.com', password: 'artist123', roles: ['ARTIST'] },
    { name: 'Collector', email: 'collector@example.com', password: 'collector123', roles: ['COLLECTOR'] },

    // Additional Admins
    { name: 'Admin 2', email: 'admin2@example.com', password: 'admin123', roles: ['ADMIN'] },
    { name: 'Admin 3', email: 'admin3@example.com', password: 'admin123', roles: ['ADMIN'] },

    // Additional Artists
    { name: 'John Artist', email: 'john.artist@example.com', password: 'artist123', roles: ['ARTIST'] },
    { name: 'Sarah Painter', email: 'sarah.painter@example.com', password: 'artist123', roles: ['ARTIST'] },
    { name: 'Mike Sculptor', email: 'mike.sculptor@example.com', password: 'artist123', roles: ['ARTIST'] },
    { name: 'Emma Designer', email: 'emma.designer@example.com', password: 'artist123', roles: ['ARTIST'] },
    { name: 'David Photographer', email: 'david.photo@example.com', password: 'artist123', roles: ['ARTIST'] },
    { name: 'Lisa Illustrator', email: 'lisa.illustrator@example.com', password: 'artist123', roles: ['ARTIST'] },
    { name: 'James Digital', email: 'james.digital@example.com', password: 'artist123', roles: ['ARTIST'] },
    { name: 'Anna Ceramics', email: 'anna.ceramics@example.com', password: 'artist123', roles: ['ARTIST'] },

    // Additional Collectors
    { name: 'Robert Collector', email: 'robert.collector@example.com', password: 'collector123', roles: ['COLLECTOR'] },
    { name: 'Maria Art Lover', email: 'maria.artlover@example.com', password: 'collector123', roles: ['COLLECTOR'] },
    { name: 'William Gallery', email: 'william.gallery@example.com', password: 'collector123', roles: ['COLLECTOR'] },
    { name: 'Patricia Museum', email: 'patricia.museum@example.com', password: 'collector123', roles: ['COLLECTOR'] },
    { name: 'Richard Buyer', email: 'richard.buyer@example.com', password: 'collector123', roles: ['COLLECTOR'] },
    { name: 'Jennifer Patron', email: 'jennifer.patron@example.com', password: 'collector123', roles: ['COLLECTOR'] },
    { name: 'Thomas Investor', email: 'thomas.investor@example.com', password: 'collector123', roles: ['COLLECTOR'] },
    { name: 'Nancy Enthusiast', email: 'nancy.enthusiast@example.com', password: 'collector123', roles: ['COLLECTOR'] },
    { name: 'Daniel Connoisseur', email: 'daniel.connoisseur@example.com', password: 'collector123', roles: ['COLLECTOR'] },
    { name: 'Betty Curator', email: 'betty.curator@example.com', password: 'collector123', roles: ['COLLECTOR'] },

    // Emails present in UserRoleSeed.js (auctionapp.com) — use default password
    { name: 'superadmin', email: 'superadmin@auctionapp.com', password: 'Password123!', roles: ['SUPER_ADMIN'] },
    { name: 'admin', email: 'admin@auctionapp.com', password: 'Password123!', roles: ['ADMIN'] },
    { name: 'artist', email: 'artist@auctionapp.com', password: 'Password123!', roles: ['ARTIST'] },
    { name: 'collector', email: 'collector@auctionapp.com', password: 'Password123!', roles: ['COLLECTOR'] },
    { name: 'admin2', email: 'admin2@auctionapp.com', password: 'Password123!', roles: ['ADMIN'] },
    { name: 'admin3', email: 'admin3@auctionapp.com', password: 'Password123!', roles: ['ADMIN'] },
    { name: 'john.artist', email: 'john.artist@auctionapp.com', password: 'Password123!', roles: ['ARTIST'] },
    { name: 'sarah.painter', email: 'sarah.painter@auctionapp.com', password: 'Password123!', roles: ['ARTIST'] },
    { name: 'mike.sculptor', email: 'mike.sculptor@auctionapp.com', password: 'Password123!', roles: ['ARTIST'] },
    { name: 'emma.designer', email: 'emma.designer@auctionapp.com', password: 'Password123!', roles: ['ARTIST'] },
    { name: 'david.photo', email: 'david.photo@auctionapp.com', password: 'Password123!', roles: ['ARTIST'] },
    { name: 'lisa.illustrator', email: 'lisa.illustrator@auctionapp.com', password: 'Password123!', roles: ['ARTIST'] },
    { name: 'james.digital', email: 'james.digital@auctionapp.com', password: 'Password123!', roles: ['ARTIST'] },
    { name: 'anna.ceramics', email: 'anna.ceramics@auctionapp.com', password: 'Password123!', roles: ['ARTIST'] },
    { name: 'robert.collector', email: 'robert.collector@auctionapp.com', password: 'Password123!', roles: ['COLLECTOR'] },
    { name: 'maria.artlover', email: 'maria.artlover@auctionapp.com', password: 'Password123!', roles: ['COLLECTOR'] },
    { name: 'william.gallery', email: 'william.gallery@auctionapp.com', password: 'Password123!', roles: ['COLLECTOR'] },
    { name: 'patricia.museum', email: 'patricia.museum@auctionapp.com', password: 'Password123!', roles: ['COLLECTOR'] },
    { name: 'richard.buyer', email: 'richard.buyer@auctionapp.com', password: 'Password123!', roles: ['COLLECTOR'] },
    { name: 'jennifer.patron', email: 'jennifer.patron@auctionapp.com', password: 'Password123!', roles: ['COLLECTOR'] },
    { name: 'thomas.investor', email: 'thomas.investor@auctionapp.com', password: 'Password123!', roles: ['COLLECTOR'] },
    { name: 'nancy.enthusiast', email: 'nancy.enthusiast@auctionapp.com', password: 'Password123!', roles: ['COLLECTOR'] },
    { name: 'daniel.connoisseur', email: 'daniel.connoisseur@auctionapp.com', password: 'Password123!', roles: ['COLLECTOR'] },
    { name: 'betty.curator', email: 'betty.curator@auctionapp.com', password: 'Password123!', roles: ['COLLECTOR'] },
  ]

  for (const u of users) {
    const hashedPassword = await bcrypt.hash(u.password, 10)
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        name: u.name,
        email: u.email,
        password: hashedPassword,
        emailVerified: true,
        verificationToken: null,
        verificationTokenHash: null,
        verificationTokenExpiry: null,
        verificationIp: null,
      },
    })

    // Assign roles
    if (Array.isArray(u.roles) && u.roles.length > 0) {
      for (const roleName of u.roles) {
        const role = await prisma.role.findUnique({ where: { name: roleName } })
        if (role) {
          await prisma.userRole.upsert({
            where: { userId_roleId: { userId: user.id, roleId: role.id } },
            update: {},
            create: { userId: user.id, roleId: role.id },
          })
        }
      }
    }
  }

  console.log('Seed combined users and roles selesai!')
}

export default seedUsersAndRoles
