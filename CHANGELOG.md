### Version 3.0.2

-   Fixed an issue which caused the chat input to increasingly slow down the page
-   Improved the look of Channel Point Redeem & Highlight messages
-   Reply threads should now function properly
-   Added an option to change how deleted messages appear
-   Fixed tab complete breaking when an emote was added both as a sub emote and 3rd party emote
-   Fixed a clash with FFZ that led to some messages not appearing correctly
-   Fixed an issue which caused sub emotes and emojis to not display in the Favorites tab
-   Fixed the Most Used Emotes tab ignoring visibility setting
-   Fixed sub emotes not showing in colon-complete while FFZ is enabled
-   Fixed an issue which caused VOD chat to crash for some users

### Version 3.0.1

-   Added an emote menu shortcut to define favorite emotes (alt+click)
-   Added a tab in the emote menu to display favorite and most used emotes
-   Added a button to open the native Twitch Emote Menu
-   Added an option to change where the 7TV Emote Menu Button appears
-   Added an option to modify the scale of emotes in chat
-   Added visual settings for highlighted messages, allows changing opacity and over-all style
-   Added an option to modify the font size in chat
-   Unpausing chat should no longer cause old messages to rapidly scroll through
-   Sidebar sub-categories in the settings menu will now highlight what's in view
-   Chat History should now load more consistently
-   Pressing escape while the emote menu is open now closes it
-   Fixed an issue where Twitch badges sometimes failed to load
-   Fixed an issue where Twitch emotes sometimes failed to load
-   Fixed an issue which caused duplicate colon-complete matches with FFZ
-   Fixed an issue that caused tab-completion to break with FFZ
-   Fixed an issue where emotes in colon-complete wouldn't load on Mozilla Firefox
-   Fixed a conflict causing emotes to sometimes display as broken images while other extensions were installed
-   Fixed an issue which prevented highlights from being saved if the "Flash Title" option was turned on
-   Fixed an issue where custom highlight sounds did not work if "Play sound on Mention" was turned off
-   Fixed an issue where custom highlight flash title did not work if "Flash Title on Mention" was turned off

### Version 3.0.0

<span style="font-size:1.5rem;">7TV has received a total overhaul. Check out what's new:</span>

#### High-Performance Chat

<span style="font-size:larger;">
We've made chat run faster, by rebuilding it from the ground up. Let your processor and memory relax, with 7TV your chat experience will be much more efficient.
</span>

<video autoplay muted loop>
	<source x-src="~/picture/cgl_display_chat.webm" />
</video>

#### New Emote Menu

<span style="font-size:larger;">The emote menu was completely redesigned, it's now divided into providers, emote sets, and even shows emojis! It also got smarter, only loading the images currently in view for much better performance.</span>

![Emote Menu](~/picture/cgl_display_emote_menu.avif)

#### New Settings Menu

<span style="font-size:larger;">7TV has just gotten much more customizable, check out the new menu and tune all the various settings to your liking!</span>

![Settings Menu](~/picture/cgl_display_settings_menu.avif)

#### Personal Emotes

<span style="font-size:larger;">7TV Subscribers can now use Personal Emotes in chat! These are emotes that can be used globally, but only by you. Get your own by <a href="https://7tv.app/store" target="_blank">subscribing</a>.</span>

![Personal Emotes](~/picture/cgl_display_personal_emotes.avif)

#### Dynamic Cosmetics

<span style="font-size:larger;">Badges, Paints & Animated Avatars will now update instantly. That's right, no more wait times!</span>

![Dynamic Cosmetics](~/picture/cgl_display_dynamic_cosmetics.avif)

#### Custom Chat Highlights

<span style="font-size:larger;">Set up custom highlights for specific phrases in chat messages, with a color, label, title flash and custom sounds. Use Regular Expressions for even greater control.</span>

![Chat Highlights](~/picture/cgl_display_highlights.avif)

#### Tab-Completion Carousel

<span style="font-size:larger;">View matches as you go when using TAB to find emotes!</span>

![Emote Carousel](~/picture/cgl_display_emote_carousel.avif)

#### AVIF Support

<span style="font-size:larger;">
We are the first emote provider to support WEBP, and as we've inspired others to do the same, we're taking the initiative of supporting AVIF (AV1 Image File Format)!
AVIF is the image variant of the AV1 Video Codec, capable of shrinking image sizes from 20% to 90% over a GIF. 
</span>

AVIF will now be automatically served to users of Google Chrome 100+ (or chromium-based browsers).

![AVIF](~/picture/cgl_display_avif.svg)

#### Mod Logs

<span style="font-size:larger;">View recent mod actions with the Mod Logs menu.</span>

#### Much more to come

<span style="font-size:larger;">This is just the beginning! We've rewritten the entire extension with a modular, scalable codebase just waiting to be expanded upon. Expect many new additions to come!</span>

And of course, this is an open-source project. Anyone is welcome to submit a pull request via <a href="https://github.com/seventv/extension" target="_blank">GitHub</a>.
