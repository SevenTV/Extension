import React, { createRef } from 'react';
import { defer, iif, Observable, Subject } from 'rxjs';
import { filter, switchMap, take, tap } from 'rxjs/operators';
import { TooltipComponent } from 'src/Sites/app/TooltipComponent';
import { EmoteMenu } from 'src/Sites/app/EmoteMenu/EmoteMenu';
import { EmoteStore } from 'src/Global/EmoteStore';
import { theme } from 'src/Global/Util';
import styled from 'styled-components';
import { ThemeProvider } from '@material-ui/core/styles';
import { SettingsComponent } from 'src/Sites/app/Settings/SettingsComponent';
import { settings } from 'src/Content/Runtime/Settings';
import { settingNodes, SiteApp } from 'src/Sites/app/SiteApp';

export class MainComponent extends React.Component<MainComponent.Props, MainComponent.State> {
	app: SiteApp | null = null;

	state = {
		emoteMenu: {
			open: false
		},
		settingsMenu: {
			open: false
		}
	} as MainComponent.State;
	emoteMenuRef = createRef<HTMLDivElement>();

	constructor(props: MainComponent.Props) {
		super(props);

		MainComponent.ShowTooltip.pipe(
			switchMap(({ event, hover, fields }) => iif(() => hover,
				this.showTooltip(event, fields),
				defer(() => this.hideTooltip())
			))
		).subscribe();

		document.addEventListener('click', ev => this.onMainClick(ev), { passive: true });
	}

	onMainClick(ev: MouseEvent): void {
		const isOutside = !this.emoteMenuRef.current?.contains(ev.target as HTMLDivElement);
		if (isOutside && this.state.emoteMenu.open) {
			this.toggleEmoteMenu(undefined, false);
		}
	}

	render() {
		return (
			<MainComponent.Style className='seventv-overlay-main'>
				<ThemeProvider theme={theme}>
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

					{this.state.emoteMenu.open &&
						<div ref={this.emoteMenuRef} style={{ transform: `translateX(${this.props.emoteMenuOffset}px)` }}>
							<EmoteMenu main={this} bounds={this.state.emoteMenu.bounds} />
						</div>
					}

					{this.state.settingsMenu.open &&
						<MainComponent.SettingsMenuWrapper>
							<SettingsComponent settings={settingNodes} configData={settings.data} main={this}></SettingsComponent>
						</MainComponent.SettingsMenuWrapper>
					}
				</ThemeProvider>
			</MainComponent.Style>
		);
	}

	openSettings(forceState?: boolean): void {
		this.setState({
			settingsMenu: {
				open: typeof forceState !== 'boolean' ? !this.state?.settingsMenu.open : forceState
			},
			emoteMenu: { open: false }
		});
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
			},
			settingsMenu: { open: false }
		});
	}

	showTooltip(event: MouseEvent, fields?: MainComponent.State.TooltipFields): Observable<void> {
		return new Observable<void>(observer => {
			this.setState({
				currentTooltip: {
					posX: event.pageX,
					posY: event.pageY,
					...fields,
				}
			});

			MainComponent.ShowTooltip.pipe(
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

export namespace MainComponent {
	export const ShowTooltip = new Subject<{
		event: MouseEvent;
		hover: boolean;
		fields?: State.TooltipFields;
	}>();

	export const Style = styled.div`

	`;

	export interface Props {
		emoteStore: EmoteStore;
		emoteMenuOffset?: number;
	}

	export interface State {
		currentTooltip: State.CurrentTooltip | null;
		emoteMenu: {
			open: boolean;
			bounds?: DOMRect;
		};
		settingsMenu: {
			open: boolean;
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

	export const SettingsMenuWrapper = styled.div`
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100%;
		position: absolute;
	`;
}
