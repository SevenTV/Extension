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

		// this code could be pushed back to parent, but it might also be worth refactoring the entire SettingNode datatype
		// to a better hierarchy ({category: setting[]}?)
		// will settle with this in the mean time.
		let categories : { [category: string] : SettingNode[] } = {};
		for(let setting of this.props.settings) {
			// syntax id: <category>.setting
			let categoryTerminator = setting.id.indexOf(".");

			// default to general category if syntax miss
			let catName = categoryTerminator >= 0 ? setting.id.substring(0, categoryTerminator) : "general";

			
			(categories[catName] = categories[catName] || []).push(setting);
		}

		let categoryNames = Object.keys(categories);

		// Sort categories by names
		categoryNames.sort( (a,b) => {
			// Put general first always
			if(a == "general") {
				return -1;
			} else {
				// Otherwise sort alphabetically
				return a.localeCompare(b);
			}
		})

		return (
			<FormGroup>
				{categoryNames.map(categoryName => {
					let categorySettings : JSX.Element[] = [];
		
					categorySettings.push(<h1 id={"cat-" + categoryName + "-title"} style={{fontSize: '1.2em', marginLeft: "14px"}}>{categoryName.toUpperCase()}</h1>);
					
					for(let setting of categories[categoryName]) {
						const isDisabled = typeof setting.disabledIf === 'function' ? setting.disabledIf() : false;
						let result: JSX.Element;
						switch (setting.type) {
							case 'checkbox':
								result =
									<FormControlLabel label={setting.label} sx={{ '.MuiFormControlLabel-label': { fontSize: '1em', color: 'currentcolor' }, '.MuiButtonBase-root': { color: 'currentcolor' } }} control={
										<Checkbox
											checked={(this.props.main.app?.config.get(setting.id)?.asBoolean() ?? setting.defaultValue) as boolean}
											onChange={ev => this.handleCheckboxChange(setting, ev)}
											sx={{ '& .MuiSvgIcon-root': { fontSize: 24, marginLeft: '14px' } }} />
									}></FormControlLabel>;
								break;


							case 'select':
								result =
									<div>
										<FormLabel component='legend' style={{ fontSize: '1em', color: 'currentcolor', margin: '14px 0 0 14px'}}>{setting.label}</FormLabel>
										<RadioGroup style={{ marginLeft: '14px'}} name='Test' sx={{ '.MuiFormControlLabel-label': { fontSize: '1em', color: 'currentcolor' }, '.MuiButtonBase-root': { color: 'currentcolor' } }} onChange={ev => this.handleSelectChange(setting, ev)} value={(this.props.main.app?.config.get(setting.id)?.asString() ?? setting.defaultValue) as string}>
												{setting.options?.map((option) => <FormControlLabel style={{textTransform:'capitalize'}} value={option} key={option} control={<Radio />} label={option} /> )}
										</RadioGroup>
									</div>;
								break;

							default:
								result =
									<Input placeholder='Generic Input'></Input>;
								break;
						}

						categorySettings.push(<FormControl disabled={isDisabled} component='fieldset' sx={{
							'.Mui-disabled': { color: 'red' }
						}} key={`formcontrol-${setting.id}`} id={setting.id}>
							{result}
							<FormHelperText style={{ fontSize: '0.75em', color: 'currentcolor', opacity: '0.60' }}> {setting.hint} </FormHelperText>
						</FormControl>);
					}
					//									 46px = 3* 14px from form margin
					return (<div style={{marginBottom: "46px", display: "flex", flexDirection: "column"}}>{categorySettings}</div>);
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
