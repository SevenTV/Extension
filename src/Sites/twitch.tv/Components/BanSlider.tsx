import React, { PointerEvent, useState } from 'react';

const minVal = 20.0;
const delVal = 40.0;
const maxVal = 200.0;
const maxSeconds = 1209600.0;

const numberToTime = (val: number): string => {

    

    if ( val < 60 ) {
        return ( `${Math.round(val)} seconds` )
    } else if ( val < 60*60 ) {
        return ( `${Math.round(val/60)} minutes` ) 
    } else if ( val < 60*60*24 ) {
        return ( `${Math.round(val/(60*60))} hours` ) 
    } else {
        return ( `${Math.round(val/(60*60*24))} days` ) 
    }
}

const calculateAction = ( pos: number ): string => {
    if (pos < -40) {
        return('Unban')
    } else if ( pos < minVal ) {
        return('')
    } else if ( pos < delVal ) {
        return(
            'Delete'
        )
    } else if ( pos < maxVal ) {
        return(
            `${Math.pow((pos - delVal)/(maxVal - delVal), 7)*maxSeconds + 1}`
        )
    } else {
        return(
            'Permanent'
        )
    }
}

export function BanSlider({ onUpdate, onRelease}: BanSlider.callback): JSX.Element {

	const [tracking, setTracking] = useState(false);
    const [pos, setPos] = useState(0);
    const [initial, setInitial] = useState(0);
    const [tDur, settDur] = useState('0s');
    const [color, setColor] = useState('#000000')

    const calculateColor = (pos: number): void => {
        if ( pos < minVal ) {
            setColor('var(--color-border-input)')
        } else if ( pos < delVal ) {
            setColor('#8feb34')
        } else if ( pos < maxVal ) {
            setColor('#c98b18')
        } else {
            setColor('#c40000')
        }
    }

	const update = (e: PointerEvent): void => {

        const calcPos = Math.max(Math.min(e.pageX - initial, 200), -50);

		setPos(calcPos);
        onUpdate(calcPos);

        calculateColor(calcPos)
	};

    const handleRelease = (e: PointerEvent): void => {
        setTracking(false);

        const action = calculateAction(pos)

        console.log(numberToTime(20))

        onRelease(action)
        settDur('0.2s')
        setTimeout(() => {settDur('0s');}, 250)
        setPos(0);
        onUpdate(0);
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    }

    const handleDown = 	(e: PointerEvent) => { 
        setInitial(e.pageX); 
        setTracking(true); 
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
    }

	return (
        <div className='outer'>
            <div 
                className='behind'
                style={{
                    width: `${pos}px`,
                    transform: `translateX(-${pos}px)`,
                    boxShadow: `inset ${pos/20}px 0.5em 1em black`,
                    transitionDuration: tDur,
                    backgroundColor: color
                }}
            >
                <span className='text' 
                    style={{
                        textIndent: `calc(1rem + ${pos/20}px)`
                    }}
                >
                    {calculateAction(pos)}
                </span>
            </div>
            <div className='grabbable-outer'>
                <div className='grabbable-inner'
                    onPointerDown={ handleDown }
                    onPointerUp={ handleRelease }
                    onPointerMove={	(e: PointerEvent) => { if (tracking) { update(e); } }}
                >
                </div>
            </div>
        </div>
	);
}

export namespace BanSlider {
    export interface callback {
		onUpdate: (x: number) => void;
        onRelease: (x: string) => void;
	}
}
