import React from 'react';
import { EmoteComponent } from 'src/Content/Components/EmoteComponent';
import { EmoteStore } from 'src/Global/EmoteStore';
import { Page } from 'src/Page/Page';
import { MessagePatcher } from 'src/Page/Util/MessagePatcher';

/**
 * Chat Input
 *
 * Overlays the regular twitch chat input while displaying emotes and stuff
 */

export class ChatInput extends React.Component<ChatInput.Props, ChatInput.State> {
	state = {
		value: '',
		savedValue: ''
	} as ChatInput.State;

	constructor(props: ChatInput.Props) {
		super(props);

		// Page.TabCompletion.onInputEvent.subscribe({
		// 	next: (ev) => this.setState({ value: (ev.target as HTMLTextAreaElement).value })
		// });
	}

	render(): JSX.Element {
		return (
			<React.Fragment>
				<div
					className='tw-font-size-6 dTtjBt'
					style={{
						paddingTop: '1rem',
						paddingBottom: '1rem',
						paddingRight: this.hasBitsButton() ? '6.5rem' : '3.5rem',
						paddingLeft: this.hasBadgeCarousel() ? '3.8rem' : '1rem'
					}}
				>
					{this.parseValue()}
				</div>
			</React.Fragment>
		);
	}

	parseValue(): JSX.Element[] {
		const matches = this.state.value.match(MessagePatcher.getRegexp());

		return matches?.map(val => {
			const emote = this.props.emotes.find(e => e.name === val);

			if (!!emote) {
				return <EmoteComponent emote={{} as EmoteStore.Emote} />;
			} else {
				return <div style={{ width: val.length * 8.5 }}></div>;
			}
		}) ?? [];
	}

	/**
	 * Whether or not the text input input has the badge carousel
	 */
	hasBadgeCarousel(): boolean {
		return !!document.getElementsByClassName('chat-input__badge-carousel').item(0);
	}

	/**
	 * Whether or not the text input has the bits button
	 */
	hasBitsButton(): boolean {
		return !!document.querySelector('[data-a-target=bits-button]');
	}
}

export namespace ChatInput {
	export interface Props {
		originalInput: HTMLInputElement;
		emotes: EmoteStore.Emote[];
	}

	export interface State {
		value: string;
	}
}
