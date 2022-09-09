import React from 'react';
import {
	FormGroup,
	FormControl,
	FormControlLabel,
	FormHelperText,
	FormLabel,
	Checkbox,
	RadioGroup,
	Radio,
	OutlinedInput
} from '@material-ui/core';
import { SettingNode } from 'src/Content/Runtime/Settings';
import { MainComponent } from 'src/Sites/app/MainComponent';
import { SettingValue } from 'src/Global/Util';

const SettingsForm: React.FC<SettingsForm.Props> = ({ main, settings }) => {
	const handleCheckboxChange = (sNode: SettingNode, ev: React.ChangeEvent<HTMLInputElement>): void => {
		const checked = ev.target.checked;

		sNode.value = checked;
		main.app?.config.set(sNode.id, new SettingValue(checked));
		main.app?.sendMessageUp('SetConfigNode', { key: `cfg.${sNode.id}`, value: checked });

		main.setState({});
	};

	const handleSelectChange = (sNode: SettingNode, ev: React.ChangeEvent<HTMLInputElement>): void => {
		const value = ev.target.value;

		sNode.value = value;
		main.app?.config.set(sNode.id, new SettingValue(value));
		main.app?.sendMessageUp('SetConfigNode', { key: `cfg.${sNode.id}`, value });

		main.setState({});
	};

	return (
		<FormGroup>
			{settings.map(setting => {
				let input: JSX.Element;

				switch (setting.type) {
					case 'checkbox':
						input =
							<FormControlLabel label={setting.label} sx={{ '.MuiFormControlLabel-label': { fontSize: '1em', color: 'currentcolor' }, '.MuiButtonBase-root': { color: 'currentcolor' } }} control={
								<Checkbox
									checked={(main.app?.config.get(setting.id)?.asBoolean() ?? setting.defaultValue) as boolean}
									onChange={ev => handleCheckboxChange(setting, ev)}
									sx={{ '& .MuiSvgIcon-root': { fontSize: 24, marginLeft: '14px' } }} />
							} />;
						break;
					case 'select':
						input =
							<div>
								<FormLabel component='legend' style={{ fontSize: '1em', color: 'currentcolor', margin: '14px 0 0 14px'}}>{setting.label}</FormLabel>
								<RadioGroup
									style={{ marginLeft: '14px'}}
									name='Test'
									sx={{ '.MuiFormControlLabel-label': { fontSize: '1em', color: 'currentcolor' }, '.MuiButtonBase-root': { color: 'currentcolor' } }}
									onChange={ev => handleSelectChange(setting, ev)}
									value={(main.app?.config.get(setting.id)?.asString() ?? setting.defaultValue) as string}>
										{setting.options?.map((option) => (
											<FormControlLabel style={{textTransform:'capitalize'}} value={option} key={option} control={<Radio />} label={option} />
										))}
								</RadioGroup>
							</div>;
						break;
					default:
						input = <OutlinedInput placeholder='Generic Input' />;
						break;
				}

				return (
					<FormControl
						disabled={setting.disabledIf?.() || false}
						component='fieldset'
						sx={{ '.Mui-disabled': { color: 'red' }}}
						key={`formcontrol-${setting.id}`}
						id={setting.id}>
							{input}
							<FormHelperText style={{ fontSize: '0.75em', color: 'currentcolor', opacity: '0.60' }}> {setting.hint} </FormHelperText>
					</FormControl>
				)
			})}
		</FormGroup>
	);
}

export default SettingsForm;

export namespace SettingsForm {
	export interface Props {
		main: MainComponent;
		settings: SettingNode[];
	}
}
