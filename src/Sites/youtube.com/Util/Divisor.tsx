import React, { useState } from 'react';

export function Divisor(): JSX.Element {

	const [clicked, setClick] = useState(false);

	const divisor = document.querySelector('.seventv-divisor') as HTMLElement;
	const chatbox = document.querySelector('div[id=secondary]') as HTMLElement;

	const move = (e: any) => {
		if ( e.pageX > 0 && e.pageX < e.view.innerWidth) {
			if (clicked) {
				divisor!.style.left = `${e.pageX}px`;
				chatbox!.style.width = `calc(100vw - ${e.pageX}px)`;
			}
		}
	};

	return (
		<div id='outer' onPointerMove={move}>
			<div
				id='inner'
				onPointerDown={() => {setClick(true);}}
				onPointerUp={() => {setClick(false);}}
			/>
		</div>
	);
}

export namespace Divisor {}
