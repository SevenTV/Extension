import Tooltip from "@material-ui/core/Tooltip";
import * as React from "react";
import { useState } from "react";
import styled from "styled-components";

export function Emote(props: Emote.Props): JSX.Element {
	const { src, name, ownerName, provider, global } = props;

	const [, setDetails] = useState({
		visible: false,
		posX: 0,
		posY: 0,
	});

	const openDetails = (ev: React.MouseEvent) =>
		setDetails({
			posX: ev.clientX,
			posY: ev.clientY,
			visible: true,
		});

	return (
		<Emote.Container className="7tv-emote" style={{ display: "inline-block" }}>
			<Tooltip
				enterDelay={0}
				TransitionProps={{ timeout: 50 }}
				title={
					<React.Fragment>
						<Emote.TooltipImage>
							<img src={src.preview}></img>
						</Emote.TooltipImage>

						<Emote.Details>
							<h3 className="emote-name"> {name} </h3>
							{ownerName ? <span className="emote-submitter"> {ownerName} </span> : ""}

							<h4>
								{" "}
								{provider} {global ? "Global" : "Channel"} Emote{" "}
							</h4>
						</Emote.Details>
					</React.Fragment>
				}
				arrow
				placement="left-start"
			>
				<Emote.Style className="seventv-emote" onClick={(ev: React.MouseEvent) => openDetails(ev)}>
					<img
						alt={name}
						height={provider === "emoji" ? 19.5 : ""}
						className="chat-image chat-line__message--emote"
						src={src.small}
					/>
				</Emote.Style>
			</Tooltip>
		</Emote.Container>
	);
}

export namespace Emote {
	export interface Props {
		provider: string;
		src: {
			small: string;
			preview: string;
		};
		name: string;
		ownerName?: string;
		global?: boolean;
	}

	export const Container = styled.div`
		display: "inline-block";
		margin-bottom: 10px;
	`;

	export const Style = styled.div`
		display: "inline-flex";
	`;

	export const TooltipImage = styled.div`
		margin: 1em;

		display: flex;
		justify-content: center;
	`;

	export const Details = styled.div`
		display: block;

		.emote-name {
			width: 100%;
			margin-bottom: 6px;
		}

		.emote-submitter {
			font-size: 2em;
		}

		.is-7tv-emote {
			font-size: 1.6em;
		}
	`;
}
