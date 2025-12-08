import { prisma } from '../../lib/prisma.js'

async function main() {
  // Example: Fetch all records from a table
  // Replace 'user' with your actual model name
  const allTests = await prisma.test.findMany()
  console.log('All Test records:', JSON.stringify(allTests, null, 2))
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })