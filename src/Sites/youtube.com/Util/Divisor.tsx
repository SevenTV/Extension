import React, { PointerEvent, useState } from 'react';

export function Divisor({callback}: Divisor.callback): JSX.Element {

	const [tracking, setTracking] = useState(false);

	const update = (e: PointerEvent): void => {
		callback(e.pageX);
	};

	return (
		<div
			onPointerDown={	(e: PointerEvent) => { setTracking(true);	(e.target as HTMLElement).setPointerCapture(e.pointerId); }}
			onPointerUp={	(e: PointerEvent) => { setTracking(false);	(e.target as HTMLElement).releasePointerCapture(e.pointerId); }}
			onPointerMove={	(e: PointerEvent) => { if (tracking) { update(e); }}}
		/>
	);
}

export namespace Divisor {
	export interface callback {
		callback: (x: number) => void;
	}
}
