export const EmoteSetFlags = {
	Immutable: 1 << 0,
	Privileged: 1 << 1,
	Personal: 1 << 2,
	Commercial: 1 << 3,
};

export const ActiveEmoteFlags = {
	ZeroWidth: 1 << 0,
	Pending: 1 << 8,
	OverrideTwitchGlobal: 1 << 16,
	OverrideTwitchSubscriber: 1 << 17,
	OverrideBetterTTV: 1 << 18,
	OverrideFrankerFaceZ: 1 << 19,
};

class BitFieldOps<T extends Record<string, number>> {
	constructor(private e: T, public sum: number) {}

	has(bit: keyof T): boolean {
		return (this.sum & this.e[bit]) === this.e[bit];
	}

	add(bit: keyof T): this {
		this.sum |= this.e[bit];
		return this;
	}

	remove(bit: keyof T): this {
		this.sum &= ~this.e[bit];
		return this;
	}

	toggle(bit: keyof T): this {
		this.sum ^= this.e[bit];
		return this;
	}

	valueOf(): number {
		return this.sum;
	}
}

export function BitField<T extends Record<string, number>>(e: T, n: number): BitFieldOps<T> {
	return new BitFieldOps(e, n);
}
