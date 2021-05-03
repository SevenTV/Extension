import React from 'react';
import ReactDOM from 'react-dom';
import { filter, take, tap } from 'rxjs/operators';
import { onMessageUnrender } from 'src/Content/App/App';
import { MessageRenderer } from 'src/Content/Runtime/MessageRenderer';

export class MessageBody extends React.PureComponent<MessageBody.Props, MessageBody.State> {
	node: Element | undefined;
	return = {};
	state = {} as MessageBody.State;
	offScreen = false;

	constructor(props: MessageBody.Props) {
		super(props);

		onMessageUnrender.pipe(
			filter(id => this.props.id === id),
			take(1),
			tap(() => {
				ReactDOM.unmountComponentAtNode(this.node?.parentNode as Element);
			})
		).subscribe();
	}

	render() {
		return (this.state.offScreen ? <span></span> :
			this.props.parts.map((part, i) => {
				return React.cloneElement(part, {
					...part.props,
					key: `msg-part-${i}`
				});
			})
		);
	}

	isInViewport(): boolean {
		if (!this.node) return false;

		const rect = this.node.getBoundingClientRect();
		return (
			rect.top >= 0 &&
			rect.left >= 0 &&
			rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
			rect.right <= (window.innerWidth || document.documentElement.clientWidth)
		);
	}

	checkVisibleState(): void {
		const inVP = this.isInViewport();
		if (!inVP) {
			this.setState({ offScreen: true });
		} else {
			this.setState({ offScreen: false });
		}
	}

	componentDidMount(): void {
		this.node = ReactDOM.findDOMNode(this) as Element;
	}
}

export namespace MessageBody {
	export interface Props {
		id: string;
		parts: JSX.Element[];
		renderer: MessageRenderer;
	}

	export interface State {
		offScreen: boolean;
	}
}
