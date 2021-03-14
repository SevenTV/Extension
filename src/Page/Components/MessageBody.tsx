import React from 'react';

export class MessageBody extends React.PureComponent<MessageBody.Props> {
	return = {};

	render() {
		return (
			this.props.parts.map(part => {
				return React.cloneElement(part, part.props);
			})
		);
	}

	componentWillUnmount() {
		console.log('Component WILL unmount.');
	}
}

export namespace MessageBody {
	export interface Props {
		parts: JSX.Element[];
	}
}
