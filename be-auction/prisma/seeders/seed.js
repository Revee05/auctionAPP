import { seedRoles } from "./RoleSeed.js";
import { seedUsers } from "./UserSeed.js";
import { seedUserRoles } from "./UserRoleSeed.js";
import "dotenv/config";

async function main() {
  await seedRoles();
  // await seedUsers();
  // await seedUserRoles();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
