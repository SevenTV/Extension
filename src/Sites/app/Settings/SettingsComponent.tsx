import React from 'react';
import { MainComponent } from '../MainComponent';
import { assetStore, SiteApp } from '../SiteApp';
import { version } from 'public/manifest.v3.json';
import { Config } from 'src/Config';
import { SettingNode } from 'src/Content/Runtime/Settings';
import SettingsForm from './SettingsForm';
import { IconButton } from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';

const SettingsComponent: React.FC<SettingsComponent.Props> = ({ main, settings }) => {
	const site: SiteApp = main.app as SiteApp;
	const logoURL = assetStore.get('7tv.webp');
	const socials = [
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

	return (
		<div className={`seventv-settings-menu ${site.config.get('ui.transparency')?.asBoolean() ? 'seventv-sm-backdrop-blur' : ''}`}>
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
							{socials.map(x =>
								<IconButton key={x.label} className='seventv-sm-social-icon' onClick={() => window.open(x.clickURL, '_blank')} title={`7TV ${x.label}`}>
									<img src={x.imageURL} />
								</IconButton>
							)}
						</div>
					</div>
					<IconButton title='Close settings' onClick={() => main.setState({ settingsMenu: { open: false } })}>
						<CloseIcon sx={{ fontSize: 28, color: '#747474' }} />
					</IconButton>
				</div>
			</div>

			{/* Content */}
			<div className='seventv-sm-content'>
				<div className='seventv-sm-options'>
					<div className='form-list'>
						<SettingsForm main={main} settings={settings} />
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
};

export default SettingsComponent;

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
