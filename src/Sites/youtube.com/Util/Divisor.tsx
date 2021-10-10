import React from 'react';

export function Divisor(): JSX.Element {
	const divisor = document.querySelector('.seventv-divisor') as HTMLElement;
	const chatbox = document.querySelector('div[id=secondary]') as HTMLElement;

	let width = 400;

	const move = (e: PointerEvent) => {

		if ( e.x > 0  && e.x < window.innerWidth ) {

			width = (window.innerWidth - e.x);

			divisor!.style.left = `${e.x}px`;
			chatbox!.style.width = `${width}px`;
		}
	};

	const removeHandle = () => {
		divisor.style.width= '1em';
		divisor.style.marginLeft = '-0.5em';
		window.removeEventListener('pointermove', move);
		window.removeEventListener('pointerup', removeHandle);
	};

	const addHandle = () => {
		divisor.style.width = '30em';
		divisor.style.marginLeft = '-15em';
		window.addEventListener('pointermove', move);
		window.addEventListener('pointerup', removeHandle);
	};

	window.onresize = () => {
		divisor!.style.left = `${
			window.innerWidth - width
		}px`;
	};

	return (
		<div onPointerDown={addHandle} />
	);
}

export namespace Divisor {}
