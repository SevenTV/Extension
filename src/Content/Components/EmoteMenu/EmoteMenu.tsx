import React from 'react';
import { EmoteComponent } from 'src/Content/Components/EmoteComponent';
import { MainComponent } from 'src/Content/Components/MainComponent';
import { EmoteStore } from 'src/Global/EmoteStore';
import { getProviderLogo } from 'src/Global/Util';
import { DataStructure } from '@typings/typings/DataStructure';
import styled from 'styled-components';
import BaseButton from '@material-ui/core/ButtonBase';
import { withStyles } from '@material-ui/core';

const providers = ['7TV', 'BTTV', 'FFZ'] as DataStructure.Emote.Provider[];
const styles = () => ({
	search: {
		color: 'white'
	}
});

export class EmoteMenu extends React.Component<EmoteMenu.Props, EmoteMenu.State> {
	ref: React.RefObject<HTMLDivElement>;
	state = {
		provider: '7TV'
	} as EmoteMenu.State;

	constructor(props: EmoteMenu.Props) {
		super(props);

		this.ref = React.createRef();
	}

	render(): React.ReactNode {
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
					{/* Render current emotes*/}
					<EmoteMenu.EmoteListSection>
						<EmoteMenu.CategoryHeader>Channel Emotes</EmoteMenu.CategoryHeader>
					</EmoteMenu.EmoteListSection>
					<EmoteMenu.EmoteList>
						{this.emotes.getAllEmotes([this.state.provider]).filter(e => !e.isGlobal()).map((e, i) => (
							<span key={`${i}-${e.id}`} onClick={() => this.onInsertEmote(e)}>
								<EmoteComponent emote={e}></EmoteComponent>
							</span>
						))}
					</EmoteMenu.EmoteList>

					<EmoteMenu.EmoteListSection>
						<EmoteMenu.CategoryHeader>Global Emotes</EmoteMenu.CategoryHeader>
					</EmoteMenu.EmoteListSection>
					<EmoteMenu.EmoteList>
						{this.emotes.getAllEmotes([this.state.provider]).filter(e => e.isGlobal()).map((e, i) => (
							<span key={`${i}-${e.id}`} onClick={() => this.onInsertEmote(e)}>
								<EmoteComponent emote={e}></EmoteComponent>
							</span>
						))}
					</EmoteMenu.EmoteList>

				</EmoteMenu.Scrollable>

				{/** Search Bar */}
				<EmoteMenu.Search>
					<input className='seventv-emote-search' placeholder='Search Emotes...'>

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
	export const WithStyles = withStyles(styles)(EmoteMenu);

	export interface Props {
		main: MainComponent;
		bounds?: DOMRect;
		classes: any;
	}

	export interface State {
		provider: DataStructure.Emote.Provider;
	}

	export const Styled = styled.div`
		position: absolute;
	`;

	export const Scrollable = styled.div`
		padding-top: 1em;
		border-radius: 6px;
		width: 320px;
		height: 400px;
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
		margin: 1em;
		margin-bottom: 1.75em;
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
