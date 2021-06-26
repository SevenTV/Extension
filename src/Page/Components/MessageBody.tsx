import React from 'react';
import ReactDOM from 'react-dom';
import { filter, mapTo, take, tap } from 'rxjs/operators';
import { onMessageUnrender } from 'src/Content/App/App';
import { EmoteComponent } from 'src/Content/Components/EmoteComponent';
import { MessageRenderer } from 'src/Content/Runtime/MessageRenderer';
import { Logger } from 'src/Logger';
import styled from 'styled-components';
import twemoji from 'twemoji';

export class MessageBody extends React.PureComponent<MessageBody.Props, MessageBody.State> {
	node: Element | undefined;
	return = {};
	state = {} as MessageBody.State;

	constructor(props: MessageBody.Props) {
		super(props);

		// Detect the moment this message gets unrendered by Twitch
		onMessageUnrender.pipe(
			filter(id => this.props.id === id),
			take(1),
			tap(() => { // Then unmount this component
				try {
					ReactDOM.unmountComponentAtNode(this.node?.parentNode as Element);
					this.node?.remove();
				} catch (e) {
					Logger.Get().error(`Could not unload message (${e}), hiding it instead`);
					this.setState({ offScreen: true });
				}
			}),
			mapTo('Unloaded')
		).subscribe();
	}

	render() {
		setTimeout(() => {
			this.node?.parentElement?.querySelectorAll('span').forEach(span => {
				if (twemoji.test(span.innerText)) {
					twemoji.parse(span, {
						className: 'seventv-emoji'
					});
					const emojis = span.querySelectorAll('img');
					for (const emoji of Array.from(emojis)) {
						const emoteji = this.props.renderer.app.emotes.fromEmoji(emoji);

						const jsx = <EmoteComponent provider='Emoji' emote={emoteji}/>;
						const emojiContainer = document.createElement('span');
						ReactDOM.render(jsx, emojiContainer);

						emoji.replaceWith(emojiContainer);
					}
				}
			});
		}, 0);

		return (this.state.offScreen ? <span></span> :
			<MessageBody.PartsList>{this.props.parts.map((part, i) => {
				return React.cloneElement(part, {
					...part.props,
					key: `msg-part-${i}`
				});
			})}</MessageBody.PartsList>
		);
	}

	isInViewport(): boolean {
		if (!this.node) return false;

		const rect = this.node.getBoundingClientRect();
		return (
			rect.top >= 0 &&
			rect.left >= 0 &&
			rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
			rect.right <= (window.innerWidth || document.documentElement.clientWidth)
		);
	}

	checkVisibleState(): void {
		const inVP = this.isInViewport();
		if (!inVP) {
			this.setState({ offScreen: true });
		} else {
			this.setState({ offScreen: false });
		}
	}

	componentDidMount(): void {
		this.node = ReactDOM.findDOMNode(this) as Element;
	}
}

export namespace MessageBody {
	export interface Props {
		id: string;
		parts: JSX.Element[];
		renderer: MessageRenderer;
	}

	export interface State {
		offScreen: boolean;
	}

	export const PartsList = styled.span`
		display: inline-block;
	`;
}
