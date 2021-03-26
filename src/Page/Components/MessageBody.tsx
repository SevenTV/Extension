import React from "react";
import { cloneElement, Fragment } from "react";

export function MessageBody(props: MessageBody.Props): JSX.Element {
	const { parts } = props;

	return (
		<Fragment>
			{parts.map((part) => {
				return cloneElement(part, part.props);
			})}
		</Fragment>
	);
}

export namespace MessageBody {
	export interface Props {
		parts: JSX.Element[];
	}
}
