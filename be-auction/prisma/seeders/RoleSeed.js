import { prisma } from './prismaClient.js'

export async function seedRoles() {
  const roles = ['SUPER_ADMIN', 'ADMIN', 'ARTIST', 'COLLECTOR']
  for (const name of roles) {
    await prisma.role.upsert({
      where: { name },
      update: {},
      create: { name },
    })
  }
  console.log('Seed roles selesai!')
}
