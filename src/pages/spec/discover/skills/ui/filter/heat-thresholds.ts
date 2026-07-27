// # Skills 热度档位：star 门槛常量 + 文案格式化（菜单与 chip 共用）

// 热度档位：按 star 门槛筛选（单选）；文案统一 star > ...
export const HEAT_THRESHOLDS = [
	{ value: 500, label: "star > 500" },
	{ value: 2000, label: "star > 2k" },
	{ value: 5000, label: "star > 5k" },
	{ value: 10000, label: "star > 10k" },
] as const;

// chip / 菜单共用档位文案
export const formatHeatLabel = (minStars: number): string => {
	const hit = HEAT_THRESHOLDS.find((t) => t.value === minStars);
	if (hit) return hit.label;
	return minStars >= 1000
		? `star > ${(minStars / 1000).toFixed(minStars % 1000 === 0 ? 0 : 1)}k`
		: `star > ${minStars}`;
};
