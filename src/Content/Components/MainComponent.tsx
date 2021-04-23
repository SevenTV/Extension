import React from 'react';
import { defer, iif, Observable, Subject } from 'rxjs';
import { filter, switchMap, take, tap } from 'rxjs/operators';
import { TooltipComponent } from 'src/Content/Components/TooltipComponent';
import { Emote } from 'src/Content/Components/EmoteComponent';
import styled from 'styled-components';

export class MainComponent extends React.Component<{}, Main.State> {
	constructor(props: {}) {
		super(props);

		Main.ShowTooltip.pipe(
			switchMap(({ event, emote, hover }) => iif(() => hover,
				this.showTooltip(event, emote),
				defer(() => this.hideTooltip())
			))
		).subscribe();
	}

	render() {
		return (
			<Main.Style>
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
			this.setState({
				currentTooltip: {
					emote,
					posX: event.pageX,
					posY: event.pageY
				}
			});

			Main.ShowTooltip.pipe(
				filter(({ hover }) => hover === false),
				take(1),
				tap(() => this.hideTooltip())
			).subscribe();
			observer.next(undefined);
		}).pipe(take(1));
	}

	hideTooltip(): void {
		if (!this.state.currentTooltip) return undefined;

		this.setState({ currentTooltip: null });
	}
}

export namespace Main {
	export const ShowTooltip = new Subject<{ event: React.MouseEvent; emote: Emote; hover: boolean; }>();

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
