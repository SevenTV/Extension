import React from 'react';
import ReactDOM from 'react-dom';
import { BanSlider } from 'src/Sites/twitch.tv/Components/BanSlider'
import 'src/Sites/twitch.tv/Util/Twitch';
import { Twitch } from 'src/Sites/twitch.tv/Util/Twitch';
import { configMap } from 'src/Sites/app/SiteApp';

export function insertSlider(parent: HTMLElement, component: Twitch.ChatLineComponent, controller: Twitch.ChatControllerComponent): void {

    const msg = component.props.message

    const settingEnabled = configMap.get('ui.show_moderation_slider')?.asBoolean()
    const isMessage = ( msg.messageType === 0 || msg.messageType === 1 )
    const target = msg.user.displayName
    const isTargetMod = ( msg.user.userType === 'mod' || msg.user.displayName.toLowerCase() == component.props.channelLogin.toLowerCase())
    console.log('type:', msg.user.userType)

    const isMod = component.props.isCurrentUserModerator

    const buildCommand = (action: string): string => {

        switch (action) {
            case 'Unban': { 
                return `/unban ${target}`;
            }
            case 'Delete': {
                return `/delete ${msg.id}`;
            }
            case 'Ban': {
                return `/ban ${target}`;
            }
            default: {
                return `/timeout ${target} ${action}`
            }
        }
    }

    const handleRelease = (action: string): void => {

        parent.style.transition = '0.2s linear'
        setTimeout(() => {
            parent.style.transition = ''
        }, 200)

        const cmd = buildCommand(action)
        console.log(cmd)
        controller.sendMessage( cmd, undefined )
    }
    
    if (settingEnabled && isMod && !isTargetMod && isMessage) {

        const container = document.createElement('span');
        container.classList.add('seventv-ban-slider');
        parent.insertBefore(container, parent.firstChild);

        parent.parentElement!.style.overflow = 'hidden'

        ReactDOM.render(<BanSlider onRelease={handleRelease} parent={parent}/>, container);
    }    
}


