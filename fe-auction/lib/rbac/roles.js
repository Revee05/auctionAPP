// Role definitions and permissions
export const ROLES = {
  SUPER_ADMIN: "superadmin",
  ADMIN: "admin",
  ARTIST: "artist",
  COLLECTOR: "collector",
};

export const PERMISSIONS = {
  MANAGE_USERS: "manage_users",
  MANAGE_AUCTIONS: "manage_auctions",
  CREATE_ART: "create_art",
  BID: "bid",
  VIEW_AUCTIONS: "view_auctions",
};

export const ROLE_PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: [
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.MANAGE_AUCTIONS,
    PERMISSIONS.CREATE_ART,
    PERMISSIONS.BID,
    PERMISSIONS.VIEW_AUCTIONS,
  ],
  [ROLES.ADMIN]: [
    PERMISSIONS.MANAGE_AUCTIONS,
    PERMISSIONS.BID,
    PERMISSIONS.VIEW_AUCTIONS,
  ],
  [ROLES.ARTIST]: [
    PERMISSIONS.CREATE_ART,
    PERMISSIONS.BID,
    PERMISSIONS.VIEW_AUCTIONS,
  ],
  [ROLES.COLLECTOR]: [
    PERMISSIONS.BID,
    PERMISSIONS.VIEW_AUCTIONS,
  ],
};

export function hasPermission(role, permission) {
  return ROLE_PERMISSIONS[role]?.includes(permission);
}
