import React from 'react';
import {
	FormGroup,
	FormControl,
	FormHelperText,
	OutlinedInput,
} from '@material-ui/core';
import { SettingNode } from 'src/Content/Runtime/Settings';
import { MainComponent } from 'src/Sites/app/MainComponent';
import Checkbox from './Inputs/Checkbox';
import Select from './Inputs/Select';

const SettingsForm: React.FC<SettingsForm.Props> = ({ main, settings }) => (
	<FormGroup>
		{settings.map(setting => {
			let input: JSX.Element;
			let controlProps = {};

			switch (setting.type) {
				case 'checkbox':
					input = <Checkbox main={main} {...setting} />;
					break;
				case 'select':
					input = <Select main={main} {...setting} />;
					controlProps = { size: 'small' };
					break;
				default:
					input = <OutlinedInput placeholder='Generic Input' />;
					break;
			}

			return (
				<FormControl
					key={`formcontrol-${setting.id}`}
					disabled={setting.disabledIf?.() || false}
					component='fieldset'
					sx={{ '.Mui-disabled': { color: 'red' }, marginBottom: '18px' }}
					id={setting.id}
					{...controlProps}>
						{input}
						<FormHelperText style={{ fontSize: '0.75em', color: 'currentcolor', opacity: '0.60' }}> {setting.hint} </FormHelperText>
				</FormControl>
			)
		})}
	</FormGroup>
);

export default SettingsForm;

export namespace SettingsForm {
	export interface Props {
		main: MainComponent;
		settings: SettingNode[];
	}
}
