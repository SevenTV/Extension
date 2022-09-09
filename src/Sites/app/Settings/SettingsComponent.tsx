import { MainComponent } from 'src/Sites/app/MainComponent';
import { version } from 'public/manifest.v3.json';
import { Config } from 'src/Config';
import { SettingNode } from 'src/Content/Runtime/Settings';
import { SettingsForm } from 'src/Sites/app/Settings/SettingsForm';
import { assetStore, SiteApp } from 'src/Sites/app/SiteApp';
import { IconButton } from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';
import React from 'react';

export class SettingsComponent extends React.Component<SettingsComponent.Props> {
	constructor(props: SettingsComponent.Props) {
		super(props);
	}

	get site(): SiteApp {
		return this.props.main.app as SiteApp;
	}

	render() {
		const logoURL = assetStore.get('7tv.webp');

		return (
			<div className={`seventv-settings-menu ${this.site.config.get('ui.transparency')?.asBoolean() ? 'seventv-sm-backdrop-blur' : ''}`}>
				{/* Header */}
				<div className='seventv-sm-header'>
					<div className='seventv-sm-header-left'>
						<img src={logoURL} />
						<h1 className='seventv-sm-title'>Settings</h1>
					</div>
					<div className='seventv-sm-header-right'>
						<div className='seventv-sm-socials'>
							<span className='seventv-sm-cta'>Join The Community</span>
							<div className='seventv-sm-social-list'>
								{this.socials.map(x =>
									<IconButton key={x.label} className='seventv-sm-social-icon' onClick={() => window.open(x.clickURL, '_blank')} title={`7TV ${x.label}`}>
										<img src={x.imageURL} />
									</IconButton>
								)}
							</div>
						</div>
						<IconButton title='Close settings' onClick={() => this.props.main.setState({ settingsMenu: { open: false } })}>
							<CloseIcon sx={{ fontSize: 32, color: 'red' }} />
						</IconButton>
					</div>
				</div>

				{/* Content */}
				<div className='seventv-sm-content'>
					<div className='seventv-sm-options'>
						<div className='form-list'>
							<SettingsForm main={this.props.main} settings={this.props.settings} />
						</div>
					</div>
				</div>

				{/* Footer */}
				<div className='seventv-sm-footer'>
					<div className='seventv-sm-appinfo'>
						<span>Version: {version}</span>
						<span>Server: {Config.apiUrl}</span>
					</div>
				</div>
			</div>
		);
	}

	socials = [
		{
			label: 'Discord',
			clickURL: `https://discord.gg/${Config.social.discordInviteID}`,
			imageURL: assetStore.get('discord.webp')
		},
		{
			label: 'Twitter',
			clickURL: `https://twitter.com/${Config.social.twitterHandle}`,
			imageURL: assetStore.get('twitter.webp')
		}
	] as SettingsComponent.SocialIcon[];
};

export namespace SettingsComponent {
	export interface Props {
		main: MainComponent;
		configData: { [x: string]: any; };
		settings: SettingNode[];
	}

	export interface SocialIcon {
		label: string;
		clickURL: string;
		imageURL: string;
	}
}
