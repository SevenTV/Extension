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
			switchMap(({ event, hover, fields }) => iif(() => hover,
				this.showTooltip(event, fields),
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
							name={this.state.currentTooltip.name}
							hint={this.state.currentTooltip.hint}
							imageURL={this.state.currentTooltip.imageURL}
							providerIconURL={this.state.currentTooltip.providerIconURL}
							extra={this.state.currentTooltip.extra}>
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

	showTooltip(event: MouseEvent, fields?: Main.State.TooltipFields): Observable<void> {
		return new Observable<void>(observer => {
			this.setState({
				currentTooltip: {
					posX: event.pageX,
					posY: event.pageY,
					...fields,
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
	export const ShowTooltip = new Subject<{
		event: MouseEvent;
		hover: boolean;
		fields?: State.TooltipFields;
	}>();

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
		export interface TooltipFields {
			name?: string;
			hint?: string;
			imageURL?: string;
			providerIconURL?: string;
			extra?: JSX.Element[];
		}
		export interface CurrentTooltip extends TooltipFields {
			posX: number;
			posY: number;
		}
	}
}
