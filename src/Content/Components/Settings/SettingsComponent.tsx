import { Checkbox } from '@material-ui/core';
import React from 'react';

export class SettingsComponent extends React.Component<{}, {}> {
	render() {
		const logoURL = chrome.runtime.getURL('image/7tv.webp');
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
					</div>

					<div className='seventv-sm-options'>
						Hello World
						<div>
						<Checkbox {...{ inputProps: { 'aria-label': 'test' } }} />
						</div>
					</div>
				</div>
			</div>
		);
	}
}

export namespace SettingsComponent {

}
