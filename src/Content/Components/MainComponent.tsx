import React from 'react';
import { defer, iif, Observable, Subject } from 'rxjs';
import { filter, switchMap, take, tap } from 'rxjs/operators';
import { TooltipComponent } from 'src/Content/Components/TooltipComponent';
import { EmoteMenu } from 'src/Content/Components/EmoteMenu/EmoteMenu';
import { EmoteStore } from 'src/Global/EmoteStore';
import { App } from 'src/Content/App/App';
import { theme } from 'src/Global/Util';
import styled from 'styled-components';
import { MuiThemeProvider } from '@material-ui/core/styles';

export class MainComponent extends React.Component<Main.Props, Main.State> {
	app: App | null = null;

	state = {
		emoteMenu: {
			open: false
		}
	} as Main.State;

	constructor(props: Main.Props) {
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
				<MuiThemeProvider theme={theme}>

					{this.state?.currentTooltip &&
						<TooltipComponent
							posX={this.state.currentTooltip.posX}
							posY={this.state.currentTooltip.posY}
							emote={this.state.currentTooltip.emote}>
						</TooltipComponent>
					}

					{this.state?.emoteMenu?.open &&
						<EmoteMenu.WithStyles main={this} bounds={this.state.emoteMenu.bounds} />
					}
				</MuiThemeProvider>
			</Main.Style>
		);
	}

	/**
	 * Toggle the emote menu's visible state
	 *
	 * @param bounds the position at which the menu should appear
	 */
	toggleEmoteMenu(bounds: DOMRect | undefined, forceState?: boolean): void {
		this.setState({
			emoteMenu: {
				open: typeof forceState !== 'boolean' ? !this.state?.emoteMenu.open : forceState,
				bounds
			}
		});
	}

	showTooltip(event: MouseEvent, emote: EmoteStore.Emote): Observable<void> {
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
	export const ShowTooltip = new Subject<{ event: MouseEvent; emote: EmoteStore.Emote; hover: boolean; }>();

	export const Style = styled.div`
		width: 100vw;
		height: 100vh;
		background-color: transparent;
		z-index: 99999999;
	`;

	export interface Props {
		emoteStore: EmoteStore;
	}

	export interface State {
		currentTooltip: State.CurrentTooltip | null;
		emoteMenu: {
			open: boolean;
			bounds?: DOMRect;
		};
	}
	export namespace State {
		export interface CurrentTooltip {
			emote: EmoteStore.Emote;
			posX: number;
			posY: number;
		}
	}
}
