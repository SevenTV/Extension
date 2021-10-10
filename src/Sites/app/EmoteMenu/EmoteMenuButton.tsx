import React, { useRef, MouseEvent } from 'react';
import { MainComponent } from 'src/Sites/app/MainComponent';
import { Logger } from 'src/Logger';
import { assetStore } from 'src/Sites/app/SiteApp';

export function EmoteMenuButton({ main, toSettings }: EmoteMenuButton.Props): JSX.Element {
	const buttonRef = useRef<HTMLButtonElement>(null);

	const onClick = (e: MouseEvent): void => {
		e.stopPropagation();
		if (toSettings) {
			Logger.Get().debug('EmoteMenuButton, action=onClick, to settings');
			main?.openSettings();
			return undefined;
		}

		const bounds = buttonRef.current?.getBoundingClientRect();
		Logger.Get().debug(`EmoteMenuButton, action=onClick, bounds=(x: ${bounds?.x}, y: ${bounds?.y})`);
		main?.toggleEmoteMenu(bounds);
	};

	return (
			<div>
				<button ref={buttonRef} onClick={onClick}>
					<div className='logo' style={{ WebkitMaskImage: `url(${ assetStore.get('7tv.webp') })`}}/>
				</button>
				<span className={toSettings ? 'tooltip-under' : 'tooltip-over'}>
					{toSettings ? '7TV Settings' : '7TV Emotes'}
				</span>
			</div>
	);
}

export namespace EmoteMenuButton {
	export interface Props {
		main: MainComponent | null;
		toSettings?: boolean;
	}
}
