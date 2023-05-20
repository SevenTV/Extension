### Version 3.0.9

- Added an option to highlight messages from specific user

### Version 3.0.8

-   Enabled AVIF images on Firefox >= 113 by default
-   Added sub duration & account creation date in the User Card
-   Added a button to open an emote's full page from the emote card
-   Fixed an issue where clicking the upper drag region in the User Card opened the user's channel
-   Fixed user card content overflowing due to long messages
-   Fixed chat scroller being visible in the viewer list
-   Tentatively fixed an issue which caused the sidebar to crash occasionally

### Version 3.0.7

-   Added a new User Card
-   Added a tooltip to show the full message when hovering over replies in chat
-   Added a "Site Layout" menu where certain features of the Twitch website can be hidden
-   Added icons for emoji sets in the Emote Menu
-   Added an option to choose chat timestamp format
-   Fixed tooltips of nametag paints appearing even if they are disabled
-   Reinstated functionality on youtube.com

### Version 3.0.6

-   Links in chat messages now respect known TLDs instead of matching any url-like pattern
-   Added an option to show timeouts/bans directly in the chat without being a moderator
-   Added options to change what emotes are displayed in the colon list and tab-completion carousel
-   Added an option to show the text bit for BTTV and FFZ emote modifiers
-   Added an option to hide monitored suspicious user highlights
-   Added an option to hide restricted suspicious user highlights
-   Added an option to highlight your own chat messages
-   Fixed an issue in the emote menu where the previously selected provider would close if a set was empty
-   Fixed emote cards sometimes not showing who added the emote
-   Fixed an issue where the detailed emote card would clip under existing chat messages

### Version 3.0.5

-   Reply Threads should now appear properly and show all messages
-   Fixed an issue which caused tab-completion to abruptly halt when a chatter's name is selected

### Version 3.0.4

-   Added hot-patching functionality to the extension
-   Added chat rich embeds which allows twitch clips to preview in chat
-   Added a "Copy Message" button
-   Added an option to show thumbnail previews of streams when hovering over channels on the sidebar
-   Temporarily disabled the "Most Used Emotes" feature, pending a refactor. This fixes severe input lag experienced by some users
-   Made some internal changes which may decrease memory usage for some users
-   Fixed bad performance on colon-completion by limiting the amount of items shown
-   Fixed an issue which caused flickering when hovering on a deleted message
-   Fixed a compatibility issue with another extension, causing distorted scrolling behavior in the settings menu

### Version 3.0.3

-   Disabled YouTube support temporarily due an issue with request pattern

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
