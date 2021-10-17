import React, { PointerEvent, useState } from 'react';
import { assetStore } from 'src/Sites/app/SiteApp';

const minVal = 40.0;
const delVal = 80.0;
const maxVal = 300.0;
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



export function BanSlider({onRelease, parent}: BanSlider.props): JSX.Element {

	const [tracking, setTracking] = useState(false);
    const [pos, setPos] = useState(0);
    const [initial, setInitial] = useState(0);
    const [tDur, settDur] = useState('0s');
    const [color, setColor] = useState('#000000')
    const [action, setAction] = useState('');
    const [vis, setVisibility] = useState(false)

    const calculateAction = ( pos: number ): string | null => {
        if (pos < -40) {
            setAction( 'Unban' )
            setVisibility( true )
            return( 'Unban' )
        } else if ( pos < minVal ) {
            setAction( '' )
            setVisibility( false )
            setColor('var(--color-border-input)')
            return( null )
        } else if ( pos < delVal ) {
            setAction( 'Delete' )
            setVisibility( false )
            setColor('#ffd726')
            return( 'Delete' )
        } else if ( pos < maxVal ) {
            const time = Math.pow((pos + 0.25*maxVal - delVal)/(1.25*maxVal - delVal), 10)*maxSeconds;

            setAction( numberToTime(time) );
            setVisibility( false )
            setColor('#c98b18')
            return( String(Math.round(time)) )
        } else {
            setAction( 'Ban' )
            setVisibility( false )
            setColor('#c40000')
            return('Ban')
        }
    }

    const translate = (pos: number): void => {
        parent.style.transform = `translateX(${pos}px)`
        parent.style.boxShadow = (pos != 0) ? `inset 0 0.1em 0.2em black` : ''
    }

	const update = (e: PointerEvent): void => {

        const calcPos = Math.max(Math.min(e.pageX - initial, maxVal), -50);

		setPos(calcPos);
        calculateAction(calcPos)

        translate(calcPos)
        
	};

    const handleRelease = (e: PointerEvent): void => {
        setTracking(false);

        const action = calculateAction(pos)
        if (!!action) {
            onRelease(action)
        }

        settDur('0.2s')
        setTimeout(() => {settDur('0s');}, 250)

        setPos(0);
        translate(0);
        setVisibility( false );

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
                    {action}
                </span>
            </div>
            <div className='grabbable-outer'
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
                    opacity: vis ? 1 : 0
                }}>
                <img src={assetStore.get('undo.webp')}/>
            </div>
        </div>
	);
}

export namespace BanSlider {
    export interface props {
        onRelease: (x: string) => void;
        parent: HTMLElement;
	}
}
