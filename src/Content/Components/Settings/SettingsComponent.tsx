import { MainComponent } from 'src/Content/Components/MainComponent';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import Input from '@material-ui/core/OutlinedInput';
import FormControl from '@material-ui/core/FormControl';
import FormHelperText from '@material-ui/core/FormHelperText';
import FormGroup from '@material-ui/core/FormGroup';
import CloseIcon from '@material-ui/icons/Close';
import React from 'react';

export class SettingsComponent extends React.Component<SettingsComponent.Props, SettingsComponent.State> {
	state = {
		retrieved: false
	} as SettingsComponent.State;
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
		}
	] as SettingsComponent.SettingNode[];

	constructor(props: SettingsComponent.Props) {
		super(props);

		this.retrieveValues();
	}

	render() {
		const logoURL = chrome.runtime.getURL('image/7tv.webp');
		if (!this.state.retrieved) {
			return <span></span>;
		}

		return (
			<div className='seventv-settings-menu'>
				<div className='seventv-sm-sidebar'>
					{/* Logo */}
					<div className='seventv-sm-logo'>
						<img src={logoURL} width={96} height={96}></img>
					</div>
				</div>

				<div className='seventv-sm-content'>
					{/** Heading & Breadcrumbs */}
					<div className='seventv-sm-heading'>
						<div className='seventv-sm-titlebox'>
							<span>Settings</span>
						</div>

						<div className='close-icon' onClick={() => this.props.main.setState({ settingsMenu: { open: false } })}>
							<CloseIcon sx={{ fontSize: 32, color: 'red' }}></CloseIcon>
						</div>
					</div>

					<div className='seventv-sm-options'>
						<span></span>

						<div className='form-list'>
							<FormGroup>
								{this.settings.map(s => {
									let result: JSX.Element;
									switch (s.type) {
										case 'checkbox':
											result =
												<FormControlLabel label={s.label} sx={{ '.MuiFormControlLabel-label': { fontSize: '1em' } }} control={
													<Checkbox
														checked={(s.value ?? s.defaultValue) as boolean}
														onChange={ev => this.handleCheckboxChange(s, ev)}
														sx={{ '& .MuiSvgIcon-root': { fontSize: 24 } }} />
												}></FormControlLabel>;
											break;

										default:
											result =
												<Input placeholder='Generic Input'></Input>;
											break;
									}

									return <FormControl key={`formcontrol-${s.id}`} id={s.id}>
										{result}
										<FormHelperText style={{ fontSize: '0.75em' }}> {s.hint} </FormHelperText>
									</FormControl>;
								})}
							</FormGroup>
						</div>
					</div>
				</div>
			</div>
		);
	}

	handleCheckboxChange(sNode: SettingsComponent.SettingNode, ev: React.ChangeEvent<HTMLInputElement>): void {
		const checked = ev.target.checked;

		sNode.value = checked;
		chrome.storage.sync.set({
			[`cfg.${sNode.id}`]: checked
		});

		this.setState({});
	}

	/**
	 * Retrieve the stored config values and apply them to the UI
	 */
	retrieveValues(): void {
		// Retrieve the full storage set
		chrome.storage.sync.get(items => {
			// Get all config k/v pairs
			const keys = Object.keys(items).filter(k => k.startsWith('cfg.'));
			if (keys.length === 0) {
				this.setState({ retrieved: true });
			}

			// Iterate through available settings and apply stored value
			for (const sNode of this.settings) {
				for (const k of keys) {
					if (k.slice(4) !== sNode.id) {
						continue;
					}
					const value = items[k];

					sNode.value = value;
					if (sNode.defaultValue === value) {
						chrome.storage.sync.remove(`cfg.${sNode.id}`);
					}
					this.setState({ retrieved: true });
				}
			}
		});
	}
}

export namespace SettingsComponent {
	export interface Props {
		main: MainComponent;
	}

	export interface State {
		retrieved: boolean;
	}

	export interface SettingNode {
		id: string;
		label: string;
		hint?: string;
		type: SettingNode.Type;

		value?: boolean | string | object;
		defaultValue?: boolean | string | object;
	}
	export namespace SettingNode {
		export type Type = 'checkbox';
	}
}
