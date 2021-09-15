import { MainComponent } from 'src/Sites/app/MainComponent';
import { version } from 'public/manifest.v3.json';
import { Config } from 'src/Config';
import { SettingNode, settings } from 'src/Content/Runtime/Settings';
import { SettingsForm } from 'src/Sites/app/Settings/SettingsForm';
import { assetStore } from 'src/Sites/app/SiteApp';
import CloseIcon from '@material-ui/icons/Close';
import React from 'react';

export class SettingsComponent extends React.Component<SettingsComponent.Props, SettingsComponent.State> {
	state = {
		retrieved: false
	} as SettingsComponent.State;

	constructor(props: SettingsComponent.Props) {
		super(props);
	}

	render() {
		const logoURL = assetStore.get('7tv.webp');
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

	socials = [
		{
			label: 'Discord',
			clickURL: `https://discord.gg/${Config.social.discordInviteID}`,
			imageURL: assetStore.get('discord.web')
		},
		{
			label: 'Twitter',
			clickURL: `https://twitter.com/${Config.social.twitterHandle}`,
			imageURL: assetStore.get('twitter.web')
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
