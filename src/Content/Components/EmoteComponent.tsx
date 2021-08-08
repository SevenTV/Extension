import * as React from 'react';
import { MainComponent } from 'src/Content/Components/MainComponent';
import { EmoteStore } from 'src/Global/EmoteStore';
import { getProviderLogo } from 'src/Global/Util';
import styled from 'styled-components';

export class EmoteComponent extends React.PureComponent<EmoteComponent.Props, EmoteComponent.State> {
	state = {
		details: {
			visible: false,
			posX: 0,
			posY: 0
		},
		hover: false
	};

	render() {
		return (
			<EmoteComponent.Container
				style={{
					minWidth: this.props.emote.width[0], minHeight: this.props.emote.height[0]
				}}
				className='seventv-emote'
				onMouseLeave={ev => this.onMouseEvent(false, ev)}
				onMouseEnter={ev => this.onMouseEvent(true, ev)}
			>
					<EmoteComponent.Style
						onClick={(ev: React.MouseEvent) => this.openDetails(ev)}
					>
						<EmoteComponent.Img
							alt={this.props.alt ?? this.props.emote.name}
							className={'chat-image chat-line__message--emote' + (this.isEmoji ? ' emoji' : '')}
							src={this.props.emote.cdn('1')} />
					</EmoteComponent.Style>
			</EmoteComponent.Container>
		);
	}

	getURL(): string {
		return ``;
	}

	onMouseEvent(hover: boolean, event: React.MouseEvent): void {
		const tooltipExtra = [] as JSX.Element[];
		if (this.props.emote.isGlobal()) {
			tooltipExtra.push(<p key='globalstate' className='is-7tv-global'>Global Emote</p>);
		}

		MainComponent.ShowTooltip.next({ event: event.nativeEvent, hover, fields: {
			name: this.props.emote.name,
			hint: `by ${this.props.emote.owner?.display_name ?? 'Unknown User'}`,
			imageURL: this.props.emote.cdn('3'),
			providerIconURL: getProviderLogo(this.props.emote.provider),
			extra: tooltipExtra
		}});
	}

	get isEmoji(): boolean {
		return this.props.emote.provider === 'EMOJI';
	}

	openDetails(ev: React.MouseEvent) {
		this.setState({
			details: {
				posX: ev.clientX,
				posY: ev.clientY,
				visible: true
			}
		});
	}
}

export namespace EmoteComponent {
	export interface Props {
		provider?: string | undefined | null;
		emote: EmoteStore.Emote;
		maxSize?: [number, number];
		alt?: string;
	}

	export interface State {
		details: {
			visible: boolean;
			posX: number;
			posY: number;
		};
		hover: boolean;
	}

	export const Container = styled.span`
		display: inline-block;
	`;

	export const Style = styled.span`
	`;

	export const Img = styled.img`
	`;
}
