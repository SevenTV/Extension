import React from 'react';
import ReactDOM from 'react-dom';
import { BanSlider } from 'src/Sites/twitch.tv/Components/BanSlider'

export function insertSlider(parent: HTMLElement): void {
    
    if ( parent.classList.contains('chat-line__message') ) {
        const container = document.createElement('span');
        container.classList.add('seventv-ban-slider');
        parent.insertBefore(container, parent.firstChild);
        
        parent.style.transform = `translateX(0px)`

        const translate = (pos: number): void => {
            parent.style.transform = `translateX(${pos}px)`

            if (pos != 0) {
                parent.style.boxShadow = `inset 0 0.1em 0.2em black`
            } else {
                parent.style.boxShadow = ''
            }
        }

        const printAction = (action: string): void => {
            parent.style.transition = '0.2s linear'
            parent.style.boxShadow = ''
            parent.style.transform = `translateX(0px)`
            console.log(action)
            setTimeout(() => {
                parent.style.transition = ''
            }, 200)
            
            
        }

        parent.parentElement!.style.overflow = 'hidden'

        ReactDOM.render(<BanSlider onUpdate={translate} onRelease={printAction}/>, container);
    }    
}
