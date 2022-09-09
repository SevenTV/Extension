import React from 'react';
import { FormControlLabel, FormLabel, RadioGroup, Radio } from '@material-ui/core';
import { MainComponent } from 'src/Sites/app/MainComponent';
import { SettingNode } from 'src/Content/Runtime/Settings';
import { SettingValue } from 'src/Global/Util';

const Select: React.FC<Select.Props> = ({ main, id, label, defaultValue, options }) => {
	const handleChange = (ev: React.ChangeEvent<HTMLInputElement>): void => {
		const value = ev.target.value;

		main.app?.config.set(id, new SettingValue(value));
		main.app?.sendMessageUp('SetConfigNode', { key: `cfg.${id}`, value: value });

		main.setState({});
	};

  return (
    <div>
			<FormLabel component='legend' style={{ fontSize: '1em', color: 'currentcolor', margin: '14px 0 0 14px'}}>{label}</FormLabel>
			<RadioGroup
				style={{ marginLeft: '14px'}}
				name='Test'
				sx={{ '.MuiFormControlLabel-label': { fontSize: '1em', color: 'currentcolor' }, '.MuiButtonBase-root': { color: 'currentcolor' }}}
				onChange={handleChange}
				value={(main.app?.config.get(id)?.asString() ?? defaultValue) as string}>
					{options?.map((option) => (
						<FormControlLabel style={{textTransform:'capitalize'}} value={option} key={option} control={<Radio />} label={option} />
					))}
			</RadioGroup>
		</div>
  );
}

export default Select;

export namespace Select {
	export interface Props extends SettingNode {
		main: MainComponent;
	}
}