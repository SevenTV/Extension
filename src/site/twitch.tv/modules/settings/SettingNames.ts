export interface Area {
	type: AreaTypes;
	category?: string;
	scrollpoint?: string;
}

export function getOrder(c: string | undefined) {
	return c && isOrdered(c) ? categoryOrder[c] : -1;
}

function isOrdered(c: string): c is keyof typeof categoryOrder {
	return c in categoryOrder;
}

const categoryOrder = {
	General: 0,
	Chat: 1,
	Appearance: 2,
};

export enum AreaTypes {
	FRONTPAGE,
	SETTINGS,
	PROFILE,
}
