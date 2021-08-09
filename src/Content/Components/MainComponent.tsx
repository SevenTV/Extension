import React from 'react';
import { defer, iif, Observable, Subject } from 'rxjs';
import { filter, switchMap, take, tap } from 'rxjs/operators';
import { TooltipComponent } from 'src/Content/Components/TooltipComponent';
import { EmoteMenu } from 'src/Content/Components/EmoteMenu/EmoteMenu';
import { EmoteStore } from 'src/Global/EmoteStore';
import { App } from 'src/Content/App/App';
import { SettingValue, theme } from 'src/Global/Util';
import styled from 'styled-components';
import { ThemeProvider } from '@material-ui/core/styles';
import { SettingsComponent } from 'src/Content/Components/Settings/SettingsComponent';

export class MainComponent extends React.Component<MainComponent.Props, MainComponent.State> {
	app: App | null = null;

	state = {
		emoteMenu: {
			open: false
		},
		settingsMenu: {
			open: false
		}
	} as MainComponent.State;

	private configData = new Map<string, any>();
	settings = [
		{
			id: 'general.hide_unlisted_emotes',
			label: 'Hide Unlisted Emotes',
			hint: 'If checked, emotes which have not yet been approved for listing on 7tv.app will be blurred',
			type: 'checkbox',
			defaultValue: false
		},
		{
			id: 'general.minimize_tooltip_size',
			label: 'Minimize Tooltip Size',
			hint: 'Make the 7TV tooltips smaller',
			type: 'checkbox',
			defaultValue: false
		},
		{
			id: 'general.display_mod_actions',
			label: 'Show Timeouts & Bans',
			hint: 'This setting allows non-moderators to see actions by moderators',
			type: 'checkbox',
			defaultValue: true
		},
		{
			id: 'general.autocomplete',
			label: 'Auto-Completion',
			hint: 'Enable or disable 7TV emote auto-completion',
			type: 'checkbox',
			defaultValue: true
		},
		{
			id: 'general.persistent_history',
			label: 'Persistent Chat History',
			hint: 'If enabled, your 100 most recent chat messages will persist in history (up-down arrow navigation)',
			type: 'checkbox',
			defaultValue: true
		},
		{
			id: 'ui.transparency',
			label: 'UI Transparency',
			hint: 'Toggle the transparency / backdrop blur ',
			type: 'checkbox',
			defaultValue: true
		}
	] as SettingsComponent.SettingNode[];

	constructor(props: MainComponent.Props) {
		super(props);

		MainComponent.ShowTooltip.pipe(
			switchMap(({ event, hover, fields }) => iif(() => hover,
				this.showTooltip(event, fields),
				defer(() => this.hideTooltip())
			))
		).subscribe();

		// Get config value & handle changes
		{
			// Retrieve initial value
			chrome.storage.sync.get(items => {
				const result = Object.create({});
				for (const k of Object.keys(items)) {
					const v = items[k];
					const name = k.slice(4);

					result[name] = v;
					this.configData.set(name, v);
				}

				// Add default-valued settings
				for (const sNode of this.settings) {
					if (typeof result[sNode.id] !== 'undefined') {
						continue;
					}

					result[sNode.id] = sNode.defaultValue;
				}
				this.app?.sendMessageDown('ConfigChange', result);
			});

			// Handle changes
			chrome.storage.onChanged.addListener(changes => {
				for (const k of Object.keys(changes)) {
					const v = changes[k].newValue;
					const name = k.slice(4);
					if (typeof v === 'undefined') {
						this.configData.delete(k.slice(4));
						continue;
					}

					this.configData.set(name, changes[k].newValue);
					this.app?.sendMessageDown('ConfigChange', { [name]: changes[k].newValue });
				}
			});
		}
	}

	render() {
		return (
			<MainComponent.Style>
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
						<EmoteMenu main={this} bounds={this.state.emoteMenu.bounds} />
					}

					{this.state.settingsMenu.open &&
						<MainComponent.SettingsMenuWrapper>
							<SettingsComponent settings={this.settings} configData={this.configData} main={this}></SettingsComponent>
						</MainComponent.SettingsMenuWrapper>
					}
				</ThemeProvider>
			</MainComponent.Style>
		);
	}

	openSettings(): void {
		this.setState({
			settingsMenu: {
				open: true
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

	getSetting(name: string): SettingValue {
		let value = this.configData.get(name);
		if (typeof value === 'undefined') {
			const sNode = this.settings.filter(s => s.id === name)[0];
			if (!sNode) {
				return new SettingValue(undefined);
			}

			return new SettingValue(sNode.defaultValue);
		}

		return new SettingValue(value);
	}
}

export namespace MainComponent {
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
