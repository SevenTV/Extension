import React from 'react';
import { FormControlLabel, Checkbox as MUICheckbox } from '@material-ui/core';
import { MainComponent } from 'src/Sites/app/MainComponent';
import { SettingNode } from 'src/Content/Runtime/Settings';
import { SettingValue } from 'src/Global/Util';

const Checkbox: React.FC<Checkbox.Props> = ({ main, id, label, defaultValue }) => {
	const handleChange = (ev: React.ChangeEvent<HTMLInputElement>): void => {
		const checked = ev.target.checked;

		main.app?.config.set(id, new SettingValue(checked));
		main.app?.sendMessageUp('SetConfigNode', { key: `cfg.${id}`, value: checked });

		main.setState({});
	};

  return (
    <FormControlLabel label={label} sx={{ '.MuiFormControlLabel-label': { fontSize: '1em', color: 'currentcolor' }, '.MuiButtonBase-root': { color: 'currentcolor' } }} control={
      <MUICheckbox
        checked={(main.app?.config.get(id)?.asBoolean() ?? defaultValue) as boolean}
        onChange={handleChange}
        sx={{ '& .MuiSvgIcon-root': { fontSize: 24, marginLeft: '14px' } }} />
    } />
  );
}

export default Checkbox;

export namespace Checkbox {
	export interface Props extends SettingNode {
		main: MainComponent;
	}
}