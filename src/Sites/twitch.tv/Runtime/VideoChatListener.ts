import { Observable } from 'rxjs';
import { Logger } from 'src/Logger';
import { BaseTwitchChatListener } from 'src/Sites/twitch.tv/Runtime/BaseChatListener';
import { TwitchPageScript } from 'src/Sites/twitch.tv/twitch';
import { MessagePatcher } from 'src/Sites/twitch.tv/Util/MessagePatcher';
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
        Logger.Get().info('Listen for chat messages');
    }

    private renderAll(messages: Twitch.VideoMessageAndComponent[]): void {
        for (const message of messages) {
            if (!message.component?.props) {
                continue;
            }

            this.onMessage(message.component.props.context, message);
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

    private onMessage(message: Twitch.VideoChatCommentContext, renderAs: Twitch.VideoMessageAndComponent | null = null): void {

        const patcher = new MessagePatcher(this.page, message.comment);
        message.comment.seventv = {
            patcher,
            parts: [],
            badges: [],
            words: []
        }

        patcher.tokenize();

        if (renderAs) {
            patcher.render(renderAs);
        }
    }

    /**
     * Watch for new chat comments.
     */
    observeDOM(): Observable<Twitch.VideoMessageAndComponent> {
        return new Observable<Twitch.VideoMessageAndComponent>(subscriber => {
            Logger.Get().info('Creating MutationObserver');

            const mutationObserver = new MutationObserver(mutations => {
                for (const mutation of mutations) {
                    for (const node of mutation.addedNodes) {
                        const component = this.twitch.getVideoChatMessage(node as HTMLElement);

                        subscriber.next({
                            element: node as HTMLDivElement,
                            component: component.component as Twitch.VideoMessageComponent,
                            inst: component.instance
                        })
                    }
                }
            });

            // Ensure the video chat is available.
            const list = document.querySelectorAll(`${Twitch.Selectors.VideoChatContainer} div.video-chat__message-list-wrapper > div > ul`)?.[0];
            if (!list) {
                throw new Error('Could not find chat container');
            }

            mutationObserver.observe(
                list,
                {
                    childList: true
                }
            )
        });
    }
}