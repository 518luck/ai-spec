import type { DashboardRole, NavItem } from "@/app/config/dashboard-nav";

// 判断某个导航项 item，当前用户角色 role 能不能访问。
function canAccess(item: NavItem, role: DashboardRole) {
  const roles = item.auth?.roles;

  if (roles && !roles.includes(role)) {
    return false;
  }

  return true;
}

// 根据当前用户角色，把不能访问的导航项过滤掉，并且支持递归处理子菜单。
export function filterNavItems(
  items: NavItem[],
  role: DashboardRole,
): NavItem[] {
  return items
    .map((item) => {
      if (!canAccess(item, role)) {
        return null;
      }

      if (item.items?.length) {
        const children = filterNavItems(item.items, role);

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
