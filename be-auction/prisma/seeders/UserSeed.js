import 'dotenv/config'
import { prisma } from './prismaClient.js'

export async function seedUsers() {
  const users = [
    { name: 'Super Admin', email: 'superadmin@example.com', password: 'superadmin123' },
    { name: 'Admin', email: 'admin@example.com', password: 'admin123' },
    { name: 'Artist', email: 'artist@example.com', password: 'artist123' },
    { name: 'Collector', email: 'collector@example.com', password: 'collector123' },
    
    // Additional Admins
    { name: 'Admin 2', email: 'admin2@example.com', password: 'admin123' },
    { name: 'Admin 3', email: 'admin3@example.com', password: 'admin123' },
    
    // Additional Artists
    { name: 'John Artist', email: 'john.artist@example.com', password: 'artist123' },
    { name: 'Sarah Painter', email: 'sarah.painter@example.com', password: 'artist123' },
    { name: 'Mike Sculptor', email: 'mike.sculptor@example.com', password: 'artist123' },
    { name: 'Emma Designer', email: 'emma.designer@example.com', password: 'artist123' },
    { name: 'David Photographer', email: 'david.photo@example.com', password: 'artist123' },
    { name: 'Lisa Illustrator', email: 'lisa.illustrator@example.com', password: 'artist123' },
    { name: 'James Digital', email: 'james.digital@example.com', password: 'artist123' },
    { name: 'Anna Ceramics', email: 'anna.ceramics@example.com', password: 'artist123' },
    
    // Additional Collectors
    { name: 'Robert Collector', email: 'robert.collector@example.com', password: 'collector123' },
    { name: 'Maria Art Lover', email: 'maria.artlover@example.com', password: 'collector123' },
    { name: 'William Gallery', email: 'william.gallery@example.com', password: 'collector123' },
    { name: 'Patricia Museum', email: 'patricia.museum@example.com', password: 'collector123' },
    { name: 'Richard Buyer', email: 'richard.buyer@example.com', password: 'collector123' },
    { name: 'Jennifer Patron', email: 'jennifer.patron@example.com', password: 'collector123' },
    { name: 'Thomas Investor', email: 'thomas.investor@example.com', password: 'collector123' },
    { name: 'Nancy Enthusiast', email: 'nancy.enthusiast@example.com', password: 'collector123' },
    { name: 'Daniel Connoisseur', email: 'daniel.connoisseur@example.com', password: 'collector123' },
    { name: 'Betty Curator', email: 'betty.curator@example.com', password: 'collector123' }
  ]
  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: user,
    })
  }
  console.log('Seed users selesai!')
}
