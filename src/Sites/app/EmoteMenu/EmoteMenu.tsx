import { EmoteComponent } from 'src/Content/Components/EmoteComponent';
import { MainComponent } from 'src/Sites/app/MainComponent';
import { EmoteStore } from 'src/Global/EmoteStore';
import { getProviderLogo } from 'src/Global/Util';
import { DataStructure } from '@typings/typings/DataStructure';
import React from 'react';
import styled from 'styled-components';
import BaseButton from '@material-ui/core/ButtonBase';

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
						<EmoteMenu.Tab className={`seventv-emote-menu-tab ${this.state.provider === p ? 'selected' : ''}`} onClick={() => this.selectProvider(p)} key={`provider-${p}`}>
							<img src={getProviderLogo(p)} />
						</EmoteMenu.Tab>
					))}
				</EmoteMenu.TabList>

				{/* Scrollable Area */}
				<EmoteMenu.Scrollable className='seventv-emote-menu-scrollable'>
					{/* Render current emotes*/}
					<EmoteMenu.EmoteListSection className='seventv-emote-menu-emote-list-section'>
						<EmoteMenu.CategoryHeader className='seventv-emote-menu-category-header'>Channel Emotes</EmoteMenu.CategoryHeader>
					</EmoteMenu.EmoteListSection>
					<EmoteMenu.EmoteList className='seventv-emote-menu-emote-list'>
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

					<EmoteMenu.EmoteListSection className='seventv-emote-menu-emote-list-section'>
						<EmoteMenu.CategoryHeader className='seventv-emote-menu-category-header'>Global Emotes</EmoteMenu.CategoryHeader>
					</EmoteMenu.EmoteListSection>
					<EmoteMenu.EmoteList className='seventv-emote-menu-emote-list'>
						{this.emotes.getAllEmotes([this.state.provider]).filter(e => e.isGlobal() && e.name.toLowerCase().includes(this.state.search)).map((e, i) => (
							<span key={`${i}-${e.id}`} onClick={() => this.onInsertEmote(e)}>
								<EmoteComponent emote={e}></EmoteComponent>
							</span>
						))}
					</EmoteMenu.EmoteList>

				</EmoteMenu.Scrollable>

				{/** Search Bar */}
				<EmoteMenu.Search className='seventv-emote-menu-search'>
					<input placeholder='Search Emotes...' onChange={ev => this.onSearchChange(ev)}>

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
		this.props.main.app?.menuPickEmote.next(emote);
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

	`;

	export const Scrollable = styled.div`

	`;

	export const TabList = styled.div`

	`;

	export const Tab = styled(BaseButton)`

	`;

	export const CategoryHeader = styled.span`

	`;

	export const Search = styled.div`
	`;

	export const EmoteList = styled.div`

	`;
	export const EmoteListSection = styled.section`

	`;
}
