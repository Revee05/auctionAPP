import 'dotenv/config'
import { prisma } from './prismaClient.js'

export async function seedUserRoles() {
  // Map user email to role name
  const userRoles = [
    { email: 'superadmin@example.com', role: 'SUPER_ADMIN' },
    { email: 'admin@example.com', role: 'ADMIN' },
    { email: 'artist@example.com', role: 'ARTIST' },
    { email: 'collector@example.com', role: 'COLLECTOR' },
    
    // Additional Admins
    { email: 'admin2@example.com', role: 'ADMIN' },
    { email: 'admin3@example.com', role: 'ADMIN' },
    
    // Additional Artists
    { email: 'john.artist@example.com', role: 'ARTIST' },
    { email: 'sarah.painter@example.com', role: 'ARTIST' },
    { email: 'mike.sculptor@example.com', role: 'ARTIST' },
    { email: 'emma.designer@example.com', role: 'ARTIST' },
    { email: 'david.photo@example.com', role: 'ARTIST' },
    { email: 'lisa.illustrator@example.com', role: 'ARTIST' },
    { email: 'james.digital@example.com', role: 'ARTIST' },
    { email: 'anna.ceramics@example.com', role: 'ARTIST' },
    
    // Additional Collectors
    { email: 'robert.collector@example.com', role: 'COLLECTOR' },
    { email: 'maria.artlover@example.com', role: 'COLLECTOR' },
    { email: 'william.gallery@example.com', role: 'COLLECTOR' },
    { email: 'patricia.museum@example.com', role: 'COLLECTOR' },
    { email: 'richard.buyer@example.com', role: 'COLLECTOR' },
    { email: 'jennifer.patron@example.com', role: 'COLLECTOR' },
    { email: 'thomas.investor@example.com', role: 'COLLECTOR' },
    { email: 'nancy.enthusiast@example.com', role: 'COLLECTOR' },
    { email: 'daniel.connoisseur@example.com', role: 'COLLECTOR' },
    { email: 'betty.curator@example.com', role: 'COLLECTOR' }
  ]
  for (const ur of userRoles) {
    const user = await prisma.user.findUnique({ where: { email: ur.email } })
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
