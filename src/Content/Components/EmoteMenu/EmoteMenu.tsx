import { EmoteComponent } from 'src/Content/Components/EmoteComponent';
import { MainComponent } from 'src/Content/Components/MainComponent';
import { EmoteStore } from 'src/Global/EmoteStore';
import { getProviderLogo } from 'src/Global/Util';
import { DataStructure } from '@typings/typings/DataStructure';
import React from 'react';
import styled from 'styled-components';
import BaseButton from '@material-ui/core/ButtonBase';
import Button from '@material-ui/core/Button';
import SettingsIcon from '@material-ui/icons/Settings';

const providers = ['7TV', 'BTTV', 'FFZ'] as DataStructure.Emote.Provider[];

export class EmoteMenu extends React.Component<EmoteMenu.Props, EmoteMenu.State> {
	ref: React.RefObject<HTMLDivElement>;
	state = {
		provider: '7TV',
		search: ''
	} as EmoteMenu.State;

	constructor(props: EmoteMenu.Props) {
		super(props);

		this.ref = React.createRef();
	}

	render(): React.ReactNode {
		const channelEmotes = this.emotes.getAllEmotes([this.state.provider]).filter(e => !e.isGlobal());
		return (
			<EmoteMenu.Styled ref={this.ref} style={{ top: this.posY, left: this.posX, maxWidth: window.innerWidth }} className='seventv-clickable-overlay-child seventv-emote-menu'>
				{/* Provider Tabs*/}
				<EmoteMenu.TabList className='seventv-emote-menu-header'>
					{providers.map(p => (
						<EmoteMenu.Tab className={this.state.provider === p ? 'selected' : ''} onClick={() => this.selectProvider(p)} key={`provider-${p}`}>
							<img src={getProviderLogo(p)} />
						</EmoteMenu.Tab>
					))}
				</EmoteMenu.TabList>

				{/* Scrollable Area */}
				<EmoteMenu.Scrollable className='seventv-emote-menu-scrollable'>
					<div className='seventv-settings-button'>
						<Button variant='outlined' onClick={() => this.props.main.openSettings()}>
							<SettingsIcon></SettingsIcon>
							<span style={{ marginLeft: '.5em' }}>SETTINGS</span>
						</Button>
					</div>

					{/* Render current emotes*/}
					<EmoteMenu.EmoteListSection>
						<EmoteMenu.CategoryHeader>Channel Emotes</EmoteMenu.CategoryHeader>
					</EmoteMenu.EmoteListSection>
					<EmoteMenu.EmoteList>
						{channelEmotes.filter(e => e.name.toLowerCase().includes(this.state.search)).map((e, i) => (
							<span key={`${i}-${e.id}`} onClick={() => this.onInsertEmote(e)}>
								<EmoteComponent emote={e}></EmoteComponent>
							</span>
						))}

						{channelEmotes.length === 0 &&
							<span style={{ color: 'gray' }}>
								There are no {this.state.provider} emotes in this channel
							</span>
						}
					</EmoteMenu.EmoteList>

					<EmoteMenu.EmoteListSection>
						<EmoteMenu.CategoryHeader>Global Emotes</EmoteMenu.CategoryHeader>
					</EmoteMenu.EmoteListSection>
					<EmoteMenu.EmoteList>
						{this.emotes.getAllEmotes([this.state.provider]).filter(e => e.isGlobal() && e.name.toLowerCase().includes(this.state.search)).map((e, i) => (
							<span key={`${i}-${e.id}`} onClick={() => this.onInsertEmote(e)}>
								<EmoteComponent emote={e}></EmoteComponent>
							</span>
						))}
					</EmoteMenu.EmoteList>

				</EmoteMenu.Scrollable>

				{/** Search Bar */}
				<EmoteMenu.Search>
					<input className='seventv-emote-search' placeholder='Search Emotes...' onChange={ev => this.onSearchChange(ev)}>

					</input>
				</EmoteMenu.Search>
			</EmoteMenu.Styled>
		);
	}

	/** The Y position of the menu */
	get posY(): number {
		const height = this.ref.current?.getBoundingClientRect().height ?? 0;

		return (this.props.bounds?.top ?? 0) - (height + 56);
	}

	/** The X position of the menu */
	get posX(): number {
		const offset = this.ref.current?.getBoundingClientRect().width ?? 0;

		return (this.props.bounds?.left ?? 0) - (offset / 2) - 64;
	}

	onSearchChange(ev: React.ChangeEvent<HTMLInputElement>): void {
		const value = ev.currentTarget.value;

		this.setState({
			search: value.toLowerCase()
		});
	}

	onInsertEmote(emote: EmoteStore.Emote): void {
		this.props.main.app?.sendMessageDown('InsertEmoteInChatInput', emote.name);
	}

	selectProvider(provider: DataStructure.Emote.Provider): void {
		this.setState({
			provider: provider
		});
	}

	componentDidMount(): void {
		setTimeout(() => {
			this.setState({});
		}, 0);
	}

	/** Obtain reference to the emote store */
	get emotes() {
		return this.props.main.props.emoteStore;
	}
}

export namespace EmoteMenu {
	export interface Props {
		main: MainComponent;
		bounds?: DOMRect;
	}

	export interface State {
		provider: DataStructure.Emote.Provider;
		search: string;
	}

	export const Styled = styled.div`
		position: absolute;
	`;

	export const Scrollable = styled.div`
		padding-top: 1em;
		border-radius: 6px;
		width: 340px;
		height: 480px;
		overflow: auto;
	`;

	export const TabList = styled.div`
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		border-radius: 4px;
	`;

	export const Tab = styled(BaseButton)`
		display: flex;
		justify-content: center;
		flex-grow: 1;
		min-height: 3em;

		&.selected {
			border-bottom: 1px solid white !important;
		}
	`;

	export const CategoryHeader = styled.span`
		display: flex;
		width: 100%;
		justify-content: center;
		font-size: 1.65rem;

		border-style: solid;
		border-bottom-width: 1px;
		border-color: white;
	`;

	export const Search = styled.div`
		background-color: var(--seventv-background-color);
	`;

	export const EmoteList = styled.div`
		display: flex;
		flex-wrap: wrap;
		padding: .25e;

		margin-top: 1em;
		margin-right: .25em;
		margin-left: 1.25em;
		margin-bottom: 1em;

		span {
			margin-right: .2em;
			margin-left: .2em;
			margin-top: .1em;
			margin-bottom: .1em;
		}
	`;
	export const EmoteListSection = styled.section`
		margin-top: 1m;
		margin-left: 1em;
	`;
}
