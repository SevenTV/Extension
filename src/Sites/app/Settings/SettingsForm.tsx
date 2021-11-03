import React from 'react';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import Input from '@material-ui/core/OutlinedInput';
import FormControl from '@material-ui/core/FormControl';
import FormHelperText from '@material-ui/core/FormHelperText';
import FormGroup from '@material-ui/core/FormGroup';
import FormLabel from '@material-ui/core/FormLabel';
import RadioGroup from '@material-ui/core/RadioGroup';
import Radio from '@material-ui/core/Radio';
import { SettingNode } from 'src/Content/Runtime/Settings';
import { MainComponent } from 'src/Sites/app/MainComponent';
import { SettingValue } from 'src/Global/Util';

export class SettingsForm extends React.Component<SettingsForm.Props> {
	render() {
		return (
			<FormGroup>
				{this.props.settings.map(s => {
					const isDisabled = typeof s.disabledIf === 'function' ? s.disabledIf() : false;
					let result: JSX.Element;
					switch (s.type) {
						case 'checkbox':
							result =
								<FormControlLabel label={s.label} sx={{ '.MuiFormControlLabel-label': { fontSize: '1em', color: 'currentcolor' }, '.MuiButtonBase-root': { color: 'currentcolor' } }} control={
									<Checkbox
										checked={(this.props.main.app?.config.get(s.id)?.asBoolean() ?? s.defaultValue) as boolean}
										onChange={ev => this.handleCheckboxChange(s, ev)}
										sx={{ '& .MuiSvgIcon-root': { fontSize: 24, marginLeft: '14px' } }} />
								}></FormControlLabel>;
							break;


						case 'select':
							result =
								<div>
									<FormLabel component='legend' style={{ fontSize: '1em', color: 'currentcolor', margin: '14px 0 0 14px'}}>{s.label}</FormLabel>
									<RadioGroup style={{ marginLeft: '14px'}} name='Test' sx={{ '.MuiFormControlLabel-label': { fontSize: '1em', color: 'currentcolor' }, '.MuiButtonBase-root': { color: 'currentcolor' } }} onChange={ev => this.handleSelectChange(s, ev)} value={(this.props.main.app?.config.get(s.id)?.asString() ?? s.defaultValue) as string}>
											{s.options?.map((option) => <FormControlLabel style={{textTransform:'capitalize'}} value={option} key={option} control={<Radio />} label={option} /> )}
									</RadioGroup>
								</div>;
							break;

						default:
							result =
								<Input placeholder='Generic Input'></Input>;
							break;
					}

					return <FormControl disabled={isDisabled} component='fieldset' sx={{
						'.Mui-disabled': { color: 'red' }
					}} key={`formcontrol-${s.id}`} id={s.id}>
						{result}
						<FormHelperText style={{ fontSize: '0.75em', color: 'currentcolor', opacity: '0.60' }}> {s.hint} </FormHelperText>
					</FormControl>;
				})}
			</FormGroup>
		);
	}

	handleCheckboxChange(sNode: SettingNode, ev: React.ChangeEvent<HTMLInputElement>): void {
		const checked = ev.target.checked;

		sNode.value = checked;
		this.props.main.app?.config.set(sNode.id, new SettingValue(checked));
		this.props.main.app?.sendMessageUp('SetConfigNode', { key: `cfg.${sNode.id}`, value: checked });

		this.setState({});
		this.props.main.setState({});
	}

	handleSelectChange(sNode: SettingNode, ev: any): void {
		const value = ev.target.value;

		sNode.value = value;
		this.props.main.app?.config.set(sNode.id, new SettingValue(value));
		this.props.main.app?.sendMessageUp('SetConfigNode', { key: `cfg.${sNode.id}`, value: value });

		this.setState({});
		this.props.main.setState({});
	}
}

export namespace SettingsForm {
	export interface Props {
		main: MainComponent;
		settings: SettingNode[];
	}
}
