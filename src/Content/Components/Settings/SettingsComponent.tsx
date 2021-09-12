import { MainComponent } from 'src/Sites/app/MainComponent';
import { version } from 'public/manifest.json';
import { Config } from 'src/Config';
import { SettingNode, settings } from 'src/Content/Runtime/Settings';
import { SettingsForm } from 'src/Content/Components/Settings/SettingsForm';
import CloseIcon from '@material-ui/icons/Close';
import React from 'react';

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
						<div className='seventv-sm-socials'>
							<span>Join The Community</span>

							<div className='seventv-sm-social-list'>
								{this.socials.map(soc =>
									<div key={`social-${soc.label}`} className='seventv-sm-social-icon' onClick={() => window.open(soc.clickURL, '_blank')}>
										<img src={chrome.runtime.getURL(soc.imageURL)}></img>
									</div>
								)}
							</div>
						</div>
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

						{/** Render the form */}
						<div className='form-list'>
							<SettingsForm settings={this.props.settings}></SettingsForm>
						</div>
					</div>
				</div>
			</div>
		);
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
			}
		}
		this.setState({ retrieved: true });
	}

	componentWillUnmount(): void {
		if (typeof this.changeListener === 'function') {
			chrome.storage.onChanged.removeListener(this.changeListener as any);
		}
	}

	socials = [
		{
			label: 'Discord',
			clickURL: `https://discord.gg/${Config.social.discordInviteID}`,
			imageURL: `image/icon/discord.webp`
		},
		{
			label: 'Twitter',
			clickURL: `https://twitter.com/${Config.social.twitterHandle}`,
			imageURL: 'image/icon/twitter.webp'
		}
	] as SettingsComponent.SocialIcon[];
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

	export interface SocialIcon {
		label: string;
		clickURL: string;
		imageURL: string;
	}
}
