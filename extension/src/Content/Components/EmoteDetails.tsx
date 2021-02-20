import * as React from 'react';
import styled from 'styled-components';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';

export class EmoteDetails extends React.Component<EmoteDetails.Props> {
	render() {
		return (
			<EmoteDetails.Style.Wrapper style={{ top: this.props.posY, left: this.props.posX }}>
				<Card style={{ position: 'relative' }}>
					<CardContent>
						VeryPog
					</CardContent>
				</Card>
			</EmoteDetails.Style.Wrapper>
		)
	}
}

export namespace EmoteDetails {
	export interface Props {
		posX: number;
		posY: number;
	}

	export namespace Style {
		export const Wrapper = styled.div`
			position: fixed;
			z-index: 10000;
		`

		export const Box = styled.div`
			display: flex;
			height: 4em;
			width: 12em;
			background-color: white;
		`
	}
}
