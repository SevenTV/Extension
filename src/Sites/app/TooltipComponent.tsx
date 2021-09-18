import React from 'react';
import ReactDOM from 'react-dom';
import { MainComponent } from 'src/Sites/app/MainComponent';
import { configMap } from 'src/Sites/app/SiteApp';

export class TooltipComponent extends React.Component<TooltipComponent.Props, TooltipComponent.State> {
	unmounted = false;
	ref = React.createRef<any>();
	positioned = false;
	node: Element | null = null;
	state = {
		refWidth: 0,
		refHeight: 0
	} as TooltipComponent.State;

	render() {
		const posY = this.getPosY();
		const posX = this.getPosX();

		const isSmall = configMap.get('ui.minimize_tooltip_size')?.asBoolean();
		return (
			<div className={`seventv-emote-tooltip-wrapper ${isSmall ? 'seventv-tooltip-small' : ''}`}
				style={{ visibility: this.positioned ? 'visible' : 'hidden', top: posY, left: posX - 74 }}
			>
				<div ref={this.ref} className='seventv-emote-tooltip'>
					{!!this.props.imageURL && <div className='seventv-tooltip-image'>
						<img src={this.props.imageURL} style={{
							transform: isSmall ? 'scale(0.75)' : undefined
						}}></img>
					</div>
					}

					<div className='seventv-tooltip-details'>
						<h3 className='item-name'> {this.props.name} </h3>
						{!!this.props.hint ? <span className='item-hint'>{this.props.hint}</span> : ''}

						{...this.props.extra ?? []}
					</div>

					{!!this.props.providerIconURL &&
					<div className='seventv-tooltip-provider'>
						<img src={this.props.providerIconURL} />
					</div>
					}
				</div>
			</div>
		);
	}

	getPosY(): number {
		const h = (this.node?.scrollHeight ?? 0);

		return (this.props.posY - (h + 32));
	}

	getPosX(): number {
		const w = (this.node?.clientWidth ?? 0);

		const maxWidth = (document.getElementsByClassName('stream-chat').item(0) as HTMLDivElement)?.scrollWidth ?? window.innerWidth;
		const mostX = this.props.posX - (window.innerWidth - maxWidth) + w;

		return mostX > maxWidth ? (this.props.posX - (mostX - maxWidth) + 32) : this.props.posX;
	}

	componentDidMount(): void {
		setTimeout(() => {
			if (this.unmounted) {
				return undefined;
			}

			let node: Element | null = null;
			try {
				node = ReactDOM.findDOMNode(this) as Element;
			} catch (_) { }

			this.positioned = true;
			this.node = node;
			this.setState({});
		}, 0);
	}

	componentWillUnmount(): void {
		this.unmounted = true;
		this.node = null;
	}
}

export namespace TooltipComponent {
	export interface State {
		refWidth: 0;
		refHeight: 0;
	}

	export interface Props extends MainComponent.State.CurrentTooltip {
		[x: string]: any;
	}
}
