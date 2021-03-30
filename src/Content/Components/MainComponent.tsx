import React from 'react';
import { defer, iif, Observable } from 'rxjs';
import { filter, map, pairwise, switchMap, take, tap } from 'rxjs/operators';
import { TooltipComponent } from 'src/Content/Components/TooltipComponent';
import { Content } from 'src/Content/Content';
import { Emote } from 'src/Page/Components/EmoteComponent';
import styled from 'styled-components';

export class Main extends React.Component<{}, Main.State> {
	render() {
		Content.ShowTooltip.pipe(
			pairwise(),
			filter(([a, b]) => a.hover === false || a.emote.props.name !== b.emote.props.name),
			map(([_, b]) => b),
			switchMap(({ event, emote, hover }) => iif(() => hover,
				this.showTooltip(event, emote),
				defer(() => this.hideTooltip())
			))
		).subscribe();

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

			Content.ShowTooltip.pipe(
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
