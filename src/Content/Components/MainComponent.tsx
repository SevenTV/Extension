import React from 'react';
import { iif, Observable } from 'rxjs';
import { switchMap, take } from 'rxjs/operators';
import { TooltipComponent } from 'src/Content/Components/TooltipComponent';
import { Content } from 'src/Content/Content';
import { Emote } from 'src/Page/Components/EmoteComponent';
import styled from 'styled-components';

export class Main extends React.Component<{}, Main.State> {
	render() {
		Content.ShowTooltip.pipe(
			switchMap(({ event, emote, hover }) => iif(() => hover,
				this.showTooltip(event, emote),
				this.hideTooltip()
			))
		).subscribe();

		return (
			<Main.Style>
				<span className='clickable-overlay-child' onClick={(ev) => console.log('Cocks And Balls!', ev)}>HELLO</span>

				{this.state?.currentTooltip &&
					<TooltipComponent
						posX={this.state.currentTooltip.posX}
						posY={this.state.currentTooltip.posY}
						emote={this.state.currentTooltip.emote}>
					</TooltipComponent>
				}
			</Main.Style>
		);
	}

	showTooltip(event: React.MouseEvent, emote: Emote): Observable<void> {
		return new Observable<void>(observer => {
			if (!!this.state?.currentTooltip) return observer.next(undefined);
			this.setState({
				currentTooltip: {
					emote,
					posX: event.pageX,
					posY: event.pageY
				}
			});

			observer.next(undefined);
		}).pipe(take(1));
	}

	hideTooltip(): Observable<void> {
		return new Observable<void>(observer => {
			this.setState({ currentTooltip: null });

			observer.next(undefined);
		}).pipe(take(1));
	}
}

export namespace Main {
	export const Style = styled.div`
		width: 100vw;
		height: 100vh;
		background-color: transparent;
		z-index: 99999999;
	`;

	export interface State {
		currentTooltip: State.CurrentTooltip | null;
	}
	export namespace State {
		export interface CurrentTooltip {
			emote: Emote;
			posX: number;
			posY: number;
		}
	}
}
