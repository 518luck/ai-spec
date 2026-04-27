// TODO 过滤导航栏
// 还没研究
function filterNavItems(
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

export function filterNavSections(
  sections: NavSection[],
  role: DashboardRole,
  enabledFlags: string[] = [],
): NavSection[] {
  return sections
    .map((section) => {
      const items = filterNavItems(section.items, role, enabledFlags);

      if (items.length === 0) {
        return null;
      }

      return {
        ...section,
        items,
      };
    })
    .filter((section): section is NavSection => section !== null);
}
