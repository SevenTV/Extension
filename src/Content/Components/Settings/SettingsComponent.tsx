import { MainComponent } from 'src/Content/Components/MainComponent';
import { version } from 'public/manifest.json';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import Input from '@material-ui/core/OutlinedInput';
import FormControl from '@material-ui/core/FormControl';
import FormHelperText from '@material-ui/core/FormHelperText';
import FormGroup from '@material-ui/core/FormGroup';
import CloseIcon from '@material-ui/icons/Close';
import React from 'react';
import { Config } from 'src/Config';
import { SettingNode, settings } from 'src/Content/Runtime/Settings';

export class SettingsComponent extends React.Component<SettingsComponent.Props, SettingsComponent.State> {
	state = {
		retrieved: false
	} as SettingsComponent.State;

	changeListener: Function;

	constructor(props: SettingsComponent.Props) {
		super(props);

		this.retrieveValues();

		// Handle config change from another location
		// i.e a different tab
		const changeListener = this.changeListener = (changes: any) => {
			const items = Object.create({});
			for (const k of Object.keys(changes)) {
				items[k] = changes[k].newValue;
			}

			this.apply(items);
		};
		chrome.storage.onChanged.addListener(changeListener);
	}

	render() {
		const logoURL = chrome.runtime.getURL('image/7tv.webp');
		if (!this.state.retrieved) {
			return <span>Loading menu...</span>;
		}

		return (
			<div className={`seventv-settings-menu ${settings.get('ui.transparency').asBoolean() ? 'seventv-sm-backdrop-blur' : ''}`}>
				<div className='seventv-sm-sidebar'>
					{/* Logo */}
					<div className='seventv-sm-logo'>
						<img src={logoURL} width={96} height={96}></img>
					</div>

					{/* Tabs List */}
					<div className='seventv-sm-tabs'>
						<div className='seventv-sm-tablist'></div>
						<div className='seventv-sm-appinfo'>
							<span>Version: {version}</span>
							<span>Server: {Config.apiUrl}</span>
						</div>
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
								{this.props.settings.filter(s => typeof s.hideIf === 'function' ? !s.hideIf() : true).map(s => {
									let result: JSX.Element;
									switch (s.type) {
										case 'checkbox':
											result =
												<FormControlLabel label={s.label} sx={{ '.MuiFormControlLabel-label': { fontSize: '1em', color: 'currentcolor' } }} control={
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

									return <FormControl sx={{
										'.Mui-disabled': { color: 'red' }
									}} key={`formcontrol-${s.id}`} id={s.id}>
										{result}
										<FormHelperText style={{ fontSize: '0.75em' }}>
											{s.hint}
											{!!s.tag && <span style={{ color: s.tag.color, marginLeft: '1em', fontWeight: 'bold' }}>{s.tag.name}</span>}
										</FormHelperText>
									</FormControl>;
								})}
							</FormGroup>
						</div>
					</div>
				</div>
			</div>
		);
	}

	handleCheckboxChange(sNode: SettingNode, ev: React.ChangeEvent<HTMLInputElement>): void {
		const checked = ev.target.checked;

		sNode.value = checked;
		chrome.storage.local.set({
			[`cfg.${sNode.id}`]: checked
		});

		this.setState({});
	}

	/**
	 * Retrieve the stored config values and apply them to the UI
	 */
	retrieveValues(): void {
		// Retrieve the full storage set
		chrome.storage.local.get(items => {
			this.apply(items);
		});
	}

	private apply(items: { [x: string]: string; }): void {
		// Get all config k/v pairs
		const keys = Object.keys(items).filter(k => k.startsWith('cfg.'));
		if (keys.length === 0) {
			this.setState({ retrieved: true });
		}

		// Iterate through available settings and apply stored value
		for (const sNode of this.props.settings) {
			for (const k of keys) {
				if (k.slice(4) !== sNode.id) {
					continue;
				}
				const value = items[k];

				sNode.value = value;
				if (sNode.defaultValue === value) {
					chrome.storage.local.remove(`cfg.${sNode.id}`);
				}
				this.setState({ retrieved: true });
			}
		}
	}

	componentWillUnmount(): void {
		if (typeof this.changeListener === 'function') {
			chrome.storage.onChanged.removeListener(this.changeListener as any);
		}
	}
}

export namespace SettingsComponent {
	export interface Props {
		main: MainComponent;
		configData: { [x: string]: any; };
		settings: SettingNode[];
	}

	export interface State {
		retrieved: boolean;
	}
}
