import { Logger } from 'src/Logger';
import { BaseTwitchChatListener } from 'src/Sites/twitch.tv/Runtime/BaseChatListener';
import { TwitchPageScript } from 'src/Sites/twitch.tv/twitch';
import { Twitch } from 'src/Sites/twitch.tv/Util/Twitch';


let currentHandler: (comment: Twitch.VideoChatComment) => void;

export class TwitchVideoChatListener extends BaseTwitchChatListener {

    constructor(page: TwitchPageScript) {
        super(page);
    }

    start(): void {
        const listener = this;

        // Handle changes only if FFZ isn't enabled.
        if (!this.page.ffzMode) {

            Logger.Get().debug('Twitch video chat rerender detected, rendering 7TV emotes');
            setTimeout(() => listener.renderAll(listener.twitch.getVideoMessages()), 1000);
        }
    }

    listen(): void {

    }

    private renderAll(messages: Twitch.VideoMessageAndComponent[]): void {
        for (const message of messages) {
            if (!message.component?.props) {
                continue;
            }

            this.renderPaintOnNametag(message);
        }
    }

    renderPaintOnNametag(message: Twitch.VideoMessageAndComponent) {

        const props = message.component.props;
        if (!props || !props.context) {
            return undefined;
        }

        const user = props.context.author;
        const userID = parseInt(user.id);

        console.log(props.context.comment.message.userColor)

        // Add custom paint.
        const paintMap = this.page.site.paintMap;
        if (user && paintMap.has(userID)) {
            const paintID = paintMap.get(userID);

            if (typeof paintID !== 'number') {
                return undefined;
            }

            const paint = this.page.site.paints[paintID];
            const username = message.element.querySelector<HTMLAnchorElement>('.video-chat__message-author');
            username?.setAttribute('data-seventv-paint', paintID.toString());

            // No paint color? Use Twitch assigned color.
            const userColor = props.context.comment.message.userColor;
            if (!paint.color && userColor && username) {
                username.style.color = userColor;
            }
        }
    }
}