import { seedRoles } from "./RoleSeed.js";
import { seedUsersAndRoles } from "./UserAndRolesSeed.js";
import { seedRefreshTokens } from "./RefreshTokenSeed.js";
import "dotenv/config";

async function main() {
  await seedRoles();
  await seedUsersAndRoles();
  await seedRefreshTokens();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
