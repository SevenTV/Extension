import React from 'react';
import { Select as MUISelect, MenuItem, SelectChangeEvent, Typography } from '@material-ui/core';
import { MainComponent } from 'src/Sites/app/MainComponent';
import { SettingNode } from 'src/Content/Runtime/Settings';
import { SettingValue } from 'src/Global/Util';
import { SxProps } from '@material-ui/system';

const menuProps = {
	disablePortal: true,
	MenuListProps: {
		sx: {
			backgroundColor: 'var(--seventv-color-background-1)'
		}
	}
};

const menuItemStyle: SxProps = {
	textTransform: 'capitalize',
	'&.Mui-selected': {
		backgroundColor: 'var(--seventv-primary-color)'
	}
};

const Select: React.FC<Select.Props> = ({ main, id, label, defaultValue, options }) => {
	const handleChange = (ev: SelectChangeEvent<any>): void => {
		const value = ev.target.value;

		main.app?.config.set(id, new SettingValue(value));
		main.app?.sendMessageUp('SetConfigNode', { key: `cfg.${id}`, value: value });

		main.setState({});
	};

  return (
		<div className='seventv-sm-option-select'>
			<Typography variant='body1' sx={{ fontSize: '1em' }} className='seventv-sm-select-label'>{label}</Typography>
			<MUISelect
				value={main.app?.config.get(id)?.asString() ?? defaultValue ?? ''}
				onChange={handleChange}
				sx={{ minWidth: '100px', textTransform: 'capitalize' }}
				SelectDisplayProps={{ style: { fontSize: '1.2em', marginBottom: '-3px' } }}
				MenuProps={menuProps}>
				{options?.map(option => (
					<MenuItem key={option} value={option} sx={menuItemStyle}>
						{option}
					</MenuItem>
				))}
			</MUISelect>
		</div>
  );
}

export default Select;

export namespace Select {
	export interface Props extends SettingNode {
		main: MainComponent;
	}
}