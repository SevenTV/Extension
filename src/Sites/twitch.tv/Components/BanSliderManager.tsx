import React from 'react';
import ReactDOM from 'react-dom';
import { BanSlider } from 'src/Sites/twitch.tv/Components/BanSlider'
import 'src/Sites/twitch.tv/Util/Twitch';
import { Twitch } from 'src/Sites/twitch.tv/Util/Twitch';
import { configMap } from 'src/Sites/app/SiteApp';
import { TwitchPageScript } from 'src/Sites/twitch.tv/twitch';

export class BanSliderManager {
    page: TwitchPageScript
    isEnabled = configMap.get('ui.show_moderation_slider')?.asBoolean();
    initialized = false
    controller: Twitch.ChatControllerComponent | undefined
    chatContainer: HTMLElement | undefined 
    
    constructor(twitch: TwitchPageScript) {
        this.page = twitch;       
    }

    initialize(): void {
        this.initialized = true
        this.isEnabled = configMap.get('ui.show_moderation_slider')?.asBoolean();
        this.controller = this.page.twitch.getChatController()
        this.chatContainer = document.querySelector(Twitch.Selectors.ChatContainer) as HTMLElement
        this.check()
    }

    check(): void {
        if ( !this.initialized ) {
            return;
        }

        this.isEnabled = configMap.get('ui.show_moderation_slider')?.asBoolean();

        if ( this.isEnabled )  {
            this.chatContainer?.classList.add('seventv-ban-slider-container')
            const lines = this.page.twitch.getChatLines()
            for ( const line of lines ) {
                if ( !!line.component && !!line.component.props.message ) {
                    this.considerSlider(line)
                }
            }
        } else {
            this.chatContainer?.classList.remove('seventv-ban-slider-container')
            const allExisting = document.querySelectorAll('.seventv-ban-slider');
            for ( const slider of allExisting ) {
                slider.remove()
            }
        }  
    }

    considerSlider(line: Twitch.ChatLineAndComponent): void {
        this.isEnabled = configMap.get('ui.show_moderation_slider')?.asBoolean();
    
        const msg = line.component.props.message
    
        const isMessage = ( msg.messageType === 1 || msg.messageType === 0 )
        const isTargetMod = ( msg.user.userType === 'mod' || msg.user.displayName == this.page.currentChannel)
        const isMod = this.page.isActorModerator
    
        const handleRelease = (data: any): void => {
            const message: string = data.command.replace('{user}', msg.user.userLogin).replace('{id}', msg.id);
            this.controller?.sendMessage( message, undefined )
        }
        
        if (isMod && isMessage && this.isEnabled && !isTargetMod) {
            
            const container = document.createElement('span');
            container.classList.add('seventv-ban-slider');
            line.element.insertBefore(container, line.element.firstChild);
    
            ReactDOM.render(<BanSlider onRelease={handleRelease}/>, container);
        }
    }
}




