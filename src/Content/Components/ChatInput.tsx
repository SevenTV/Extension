import React from 'react';
import { Subject } from 'rxjs';
import { EmoteComponent } from 'src/Content/Components/EmoteComponent';
import { EmoteStore } from 'src/Global/EmoteStore';
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
	textArea = React.createRef<HTMLTextAreaElement>();
	value = new Subject<string>();
	send = new Subject<string>();

	constructor(props: ChatInput.Props) {
		super(props);

		// Page.TabCompletion.onInputEvent.subscribe({
		// 	next: (ev) => this.setState({ value: (ev.target as HTMLTextAreaElement).value })
		// });
	}

	render(): JSX.Element {
		return (
			<React.Fragment>
				<div className='seventv-virtual-input' style={{
					paddingRight: this.hasBitsButton() ? '6.5rem' : '3.5rem',
					paddingLeft: this.hasBadgeCarousel() ? '3.8rem' : '1rem'
				}}>
					<textarea ref={this.textArea}
						className='seventv-overlayed-input tw-font-size-6'
						style={{
							paddingTop: '1rem',
							paddingBottom: '1rem',
							border: this.props.originalInput.style.border,
							backgroundColor: this.props.originalInput.style.background,
						}}
					/>
				</div>
			</React.Fragment>
		);
	}

	parseValue(): JSX.Element[] {
		const matches = this.state.value.match(MessagePatcher.getRegexp());

		return matches?.map(val => {
			const emote = this.props.emotes.find(e => e.name === val);

			if (!!emote) {
				return <span style={{ height: 'min-content' }}><EmoteComponent emote={emote} /></span>;
			} else {
				return <span style={{ marginRight: '.25em', marginLeft: '.25em' }}>{val}</span>;
			}
		}) ?? [];
	}

	componentDidMount(): void{
		const input = this.props.originalInput;
		const virtual = this.textArea.current as HTMLTextAreaElement;

		// Mirror virtual input to twitch input
		virtual.addEventListener('input', () => {
			this.setState({ value: input.value });
			this.value.next(virtual.value);
		});


		// Swap Focus from twitch input to our virtual input
		input.addEventListener('focus', () => {
			input.blur();
			virtual.focus();
		});

		virtual.addEventListener('keydown', ev => {
			if (ev.code !== 'Enter') {
				return;
			}
			ev.preventDefault();

			this.send.next(virtual.value);
			virtual.value = '';
		});
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
		originalInput: HTMLTextAreaElement;
		emotes: EmoteStore.Emote[];
	}

	export interface State {
		value: string;
	}
}
