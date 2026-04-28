import type { DashboardRole, NavItem } from "@/app/config/dashboard-nav";

function canAccess(
  item: NavItem,
  role: DashboardRole,
  enabledFlags: string[] = [],
) {
  const roles = item.auth?.roles;
  const featureFlag = item.auth?.featureFlag;

  if (roles && !roles.includes(role)) {
    return false;
  }

  if (featureFlag && !enabledFlags.includes(featureFlag)) {
    return false;
  }

  return true;
}

export function filterNavItems(
  items: NavItem[],
  role: DashboardRole,
  enabledFlags: string[] = [],
): NavItem[] {
  return items
    .map((item) => {
      if (!canAccess(item, role, enabledFlags)) {
        return null;
      }

      if (item.items?.length) {
        const children = filterNavItems(item.items, role, enabledFlags);

        if (children.length === 0) {
          return null;
        }

        return {
          ...item,
          items: children,
        };
      }

      return item;
    })
    .filter((item): item is NavItem => item !== null);
}
