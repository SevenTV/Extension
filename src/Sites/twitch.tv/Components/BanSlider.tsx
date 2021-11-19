import React, { PointerEvent, useState } from 'react';
import Restore from '@material-ui/icons/Restore';
import SvgIcon from '@material-ui/core/SvgIcon';

const minVal = 40.0;
const delVal = 80.0;
const maxVal = 300.0;
const maxSeconds = 1209600.0;

const numberToTime = (val: number): string => {
	if ( val < 60 ) {
		return ( `${Math.round(val)} seconds` );
	} else if ( val < 60*60 ) {
		return ( `${Math.round(val/60)} minutes` );
	} else if ( val < 60*60*24 ) {
		return ( `${Math.round(val/(60*60))} hours` );
	} else {
		return ( `${Math.round(val/(60*60*24))} days` );
	}
};

class sliderData {
	command = '';
	text = '';
	time = 0;
	unbanVis = 0;
	color = '';
	pos = '0px';

	constructor(pos: number) {
		this.pos = `${pos}px`;

		if (pos < -40) {
			this.command = '/unban {user}';
			this.unbanVis = 1;
		} else if ( pos < minVal ) {
			return;
		} else if ( pos < delVal ) {
			this.command = '/delete {id}';
			this.text = 'Delete';
			this.color = '#FFFF00';
		} else if ( pos < maxVal ) {
			const time = Math.pow((pos + 0.25*maxVal - delVal)/(1.25*maxVal - delVal), 10)*maxSeconds;

			this.command = `/timeout {user} ${Math.round(time)}`;
			this.text = String(numberToTime(time));
			this.color = '#FFA500';
		} else {
			this.command = '/ban {user}';
			this.text = 'Ban';
			this.color = '#C40000';
		}
	}
}

export function BanSlider({onRelease}: BanSlider.props): JSX.Element {

	const [data, setData] = useState(new sliderData(0));
	const [tracking, setTracking] = useState(false);
	const [initial, setInitial] = useState(0);

	const handleDown = 	(e: PointerEvent) => {
		e.stopPropagation();
		setInitial(e.pageX);
		setTracking(true);
		(e.target as HTMLElement).setPointerCapture(e.pointerId);
	};

	const handleRelease = (e: PointerEvent): void => {
		setTracking(false);

		if ( !!data.command ) { onRelease(data); }

		e.pageX = initial;
		update(e);

		(e.target as HTMLElement).releasePointerCapture(e.pointerId);
	};

	const update = (e: PointerEvent): void => {
		e.preventDefault();

		const calcPos = Math.max(Math.min(e.pageX - initial, maxVal), -50);

		setData(new sliderData(calcPos));
		(e.target as HTMLElement).offsetParent!.parentElement!.style.transform = `translateX(${calcPos}px)`;
	};

	return (
		<div className='outer'>
			<div
				className='behind'
				style={{
					backgroundColor: data.color,
					width: data.pos,
					transform: `translateX(-${data.pos})`
				}}>
				<span className='text'>
					{data.text}
				</span>
			</div>
			<div className='grabbable-outer'
				title='7TV Moderation slider'
				onPointerDown={ handleDown }
				onPointerUp={ handleRelease }
				onPointerMove={	(e: PointerEvent) => { if (tracking) { update(e); }} }
				>
				<div className='grabbable-inner'>
					<div className='dots'/>
				</div>
			</div>
			<div className='unban-icon'
				style={{
					opacity: data.unbanVis
					}}>
				<SvgIcon component={Restore} />
			</div>
		</div>
	);
}

export namespace BanSlider {
	export interface props {
		onRelease: (x: sliderData) => void;
	}
}
