import React, { PointerEvent, useState } from 'react';

export function Divisor({callback}: Divisor.callback): JSX.Element {

	const [border, setBorder] = useState(1);
	const [tracking, setTracking] = useState(false);

	const update = (e: PointerEvent): void => {
		callback(e.pageX);
	};

	return (
		<div
			onPointerDown={	() 					=> { setTracking(true); setBorder(30); 	}}
			onPointerUp={	() 					=> { setTracking(false); setBorder(1); 	}}
			onPointerMove={	(e: PointerEvent) 	=> { if (tracking) { update(e); } 		}}

			// This is so the mouse stays over the div more consistent
			style={{
				'width': `${border}em`,
				'marginLeft': `-${border/2.0}em`
				}}>
		</div>
	);
}

export namespace Divisor {
	export interface callback {
		callback: (x: number) => void;
	}
}
