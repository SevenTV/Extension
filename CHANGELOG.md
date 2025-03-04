### 3.1.6

- Fixed an issue causing Twitch chat / moderation tools to not work properly
- Removed old kick auth
- Fixed an issue with the Twitch chat not showing a cooldown timer

### 3.1.5

- Entitlements like paints and badges should now better reflect what the user has equipped
- Fixed an issue with entitlements on accounts with multiple connections
- Fixed an issue with causing animated avatars to not work
- Added animated avatars to 7TV user card

### 3.1.4

- Fixed an issue with avatars not loading

### 3.1.3

- Added option hide shared chat
- Fixed an issue with profile picture in shared chat
- Fixed extension login
- Fixed an issue when users had multiple personal emote sets

### 3.1.2

- **Implement support for the new Kick site:**
  - Chat emotes
  - Emote menu
  - Emote auto-completion
  - Cosmetics
  - Settings
- Added option to settings to hide Stories from the sidebar
- Fixed settings to hide recommended channels and viewers also watch channels
- Fixed an issue where history navigation is accidentally triggered during IME composition
- Added option to highlight messages of specific usernames
- Added option to highlight messages based on badges
- Added button to user card to toggle highlighting for a users messages
- Added mod icon for warning users to chat mod icons and user card
- Added an option to limit the drop shadows on paints
- Added more drop shadow settings
- Added link to creators 7TV profile to emote cards of 7TV emotes
- Fixed a bug that could cause issues when clicking an emoji in chat
- Fixed an issue with emote sets not switching on channel switch
- Fixed an issue with making users unable to chat
- Added an option to expand sidebar on twitch when hovering

### 3.1.1

- Fixed video player stats not showing
- Pass rendering of animated messages to twitch
- Add option to hide on screen celebrations
- Fixed badge width on kick
- Fixed an issue where settings would be hidden due to auto-filling the searchbox

### 3.1.0

- Added rich embeds for 7TV emotes.
- Added custom commands /search, /add, /remove and /rename to manage 7TV emotes.
- Added /song that uses the AudD api to recognize songs. (Requires an api token from [AudD](https://audd.io/))
- Added /refresh to reload emotes.
- Added /nuke to moderate multiple messages at once. Can be enabled in the settings.
- Fixed native chat width.
- Make all setting pages searchable.

### 3.0.17

- Reinstated animated avatars
- Fixed an issue where links would include a period at the end
- Added an option to hide the channel point balance button under the chat input box
- Updated background of the current emote tab selection
- Fixed an issue where suspicious users were not highlighted and clips not being displayed in chat
- Fixed an issue which caused timestamps to count beyond 24 hours
- Fixed an issue which caused scrolling to not work while scrolling through a category
- Fixed an issue where lowercase cheers were displayed as text
- Added an option to hide the community challenge contributions in the chat
- Fixed extension not working on twitch for some users (React 18 support)
- Fixed an issue where chat messages (like announcements) did not use the channel accent color
- Fixed an issue where an emote with a long alias would cause the alias to go outside of the tooltip
- Added an option to hide timestamps in vods
- Fixed an issue which sometimes caused chat badges to not appear
- Fixed an issue that caused replies in threads to not appear
- Fixed an issue where replies in threads could not be selected
- Fixed an issue where switching the selected emote-set would not be detected
- Fixed an issue where the emote menu button did not appear on Kick
- Fixed an issue which sometimes caused old messages to not appear
- Sort emotes alphabetically with tab auto-completion on Kick
- Removed option to hide the React button on Twitch
- Added emote support for introduction & watch streak messages.
- Fixed an issue that caused suspicious user highlights to not persist
- Fixed an issue that caused returning users to not be highlighted
- Added an option to show raider highlights
- Added an option to show returning user highlights
- Fixed an issue that caused international names to not always display logins
- Fixed an issue that caused Twitch VODs to not load emotes
- Fixed an issue that caused emote names in emote cards to overflow
- Fixed an issue that caused certain words to not display in chat

### 3.0.16

- Added an option to select alternating background color for chat messages
- Added a tip to the favorite menu to help users favorite emotes if none are found
- Fixed an issue where personal emote sets remained in cache forever
- Fixed an issue which prevented users from using two different personal emote sets at once
- Fixed an issue where seasonal global emotes stayed in cache permanently
- Fixed an issue with tab auto-completion on Kick
- Fixed emote tile width in emote menu
- Fixed "hidden subscription status" message in the User Card
- Fixed extraneous emote menu blank space when "Live Input Search" was enabled
- Fixed an issue with deleting messages using mod icons
- Fixed an issue where the extension menu displayed incorrectly in Chromium-based browsers

### 3.0.15

- Added a backup tab to the settings menu for importing & exporting settings
- Added an option to select the default Emote Menu tab
- Added artist attribution to the emote card
- Added ability to reset settings to their defaults
- Fixed an issue where emotes would take a long time to load if external emote providers gave slow response times
- Fixed an issue where mentioning yourself would highlight the message
- Fixed an issue where replying to a thread starting from your own message would highlight the message
- Fixed a regression in previous nightly build causing channel emote sets to not receive EventAPI subscriptions
- Removed old deprecated fallback cosmetics fetching using the v2 API

### 3.0.14

- Added a shortcut (Ctrl+E) to open the Emote Menu
- Added shortcuts (Up/Down Arrows) to switch between providers in the Emote Menu
- Search in the Emote Menu will now automatically open the nearest tab where matches are found
- The input box in the Emote Menu is now focused automatically upon opening
- Added an option to show stream stats such as latency, resolution, bitrate, etc.
- Added an option to set click actions on the video player (pause/unpause and mute/unmute)
- Added an option to hide player extensions
- Added iterable tab-completion on Kick
- Fixed a user card crash
- Fixed an issue with the EventAPI connection closing on the first initialization
- Fixed an issue that prevented new chatters from appearing in autocompletion
- Fixed an issue which squished tooltips when hovering an emote on the far right side of chat
- Fixed an issue which hid historical messages on Kick
- Increased the default value for Message Batching from 150 to 250

### Version 3.0.13

- Added an option to hide the new mature content dialogs on Twitch
- Added formatting support for Hype Chat
- Added options to hide Hype Chats and the Hype Chat button
- Fixed an issue which prevented moderator data from loading in User Cards
- Fixed an issue where nametags with blending paints did not correctly use the base color and appeared invisible instead
- Kick:
  - Added a settings menu
  - Added an option to set a delay betweet rendering new messages (Message Batching)
  - Added an option to set alternating backgrounds between chat messages
  - The chat input box on Kick no longers loses focus during slow mode
  - Zero-Width Emotes should now appear properly in Kick chat

### Version 3.0.12

- Added colon-completion (partial emote matches with ":") on Kick
- Added history navigation (up/down arrow) on Kick
- Updated the auth mechanism on Kick to avoid using third-party cookies

### Version 3.0.11

- Fixed an issue which caused chat to randomly pause on Kick

### Version 3.0.10

- Tweaked some styling issues in the Emote Menu
- Kick:
  - Fixed an issue where historical messages did not consistently render
  - Fixed an issue which caused text to become misplaced when mixed with Kick native emotes
  - Fixed an issue with the Emote Menu & Tooltips not appearing while in theater mode
  - Fixed some issues where the connection flow failed
  - Long text sequences should no longer overflow outside of the chat box
  - Adjusted emoji scale to be in line with other platforms
  - Clicking an emoji in the Emote Menu should now correctly input the unicode instead of the name

### Version 3.0.9

- Added support for [Kick](https://kick.com)
- Added new feature: Paint Tool ([subscribers only](https://7tv.app/store))
- Fixed an issue where the emote menu button was broken due to a recent Twitch change
- Fixed an issue which sometimes caused channel emote sets to disappear
- Fixed an issue which caused stylesheets to be duplicated when running in hosted mode

### Version 3.0.8

- Enabled AVIF images on Firefox >= 113 by default
- Added sub duration & account creation date in the User Card
- Added a button to open an emote's full page from the emote card
- Fixed an issue where clicking the upper drag region in the User Card opened the user's channel
- Fixed user card content overflowing due to long messages
- Fixed chat scroller being visible in the viewer list
- Tentatively fixed an issue which caused the sidebar to crash occasionally

### Version 3.0.7

- Added a new User Card
- Added a tooltip to show the full message when hovering over replies in chat
- Added a "Site Layout" menu where certain features of the Twitch website can be hidden
- Added icons for emoji sets in the Emote Menu
- Added an option to choose chat timestamp format
- Fixed tooltips of nametag paints appearing even if they are disabled
- Reinstated functionality on youtube.com

### Version 3.0.6

- Links in chat messages now respect known TLDs instead of matching any url-like pattern
- Added an option to show timeouts/bans directly in the chat without being a moderator
- Added options to change what emotes are displayed in the colon list and tab-completion carousel
- Added an option to show the text bit for BTTV and FFZ emote modifiers
- Added an option to hide monitored suspicious user highlights
- Added an option to hide restricted suspicious user highlights
- Added an option to highlight your own chat messages
- Fixed an issue in the emote menu where the previously selected provider would close if a set was empty
- Fixed emote cards sometimes not showing who added the emote
- Fixed an issue where the detailed emote card would clip under existing chat messages

### Version 3.0.5

- Reply Threads should now appear properly and show all messages
- Fixed an issue which caused tab-completion to abruptly halt when a chatter's name is selected

### Version 3.0.4

- Added hot-patching functionality to the extension
- Added chat rich embeds which allows twitch clips to preview in chat
- Added a "Copy Message" button
- Added an option to show thumbnail previews of streams when hovering over channels on the sidebar
- Temporarily disabled the "Most Used Emotes" feature, pending a refactor. This fixes severe input lag experienced by some users
- Made some internal changes which may decrease memory usage for some users
- Fixed bad performance on colon-completion by limiting the amount of items shown
- Fixed an issue which caused flickering when hovering on a deleted message
- Fixed a compatibility issue with another extension, causing distorted scrolling behavior in the settings menu

### Version 3.0.3

- Disabled YouTube support temporarily due an issue with request pattern

### Version 3.0.2

- Fixed an issue which caused the chat input to increasingly slow down the page
- Improved the look of Channel Point Redeem & Highlight messages
- Reply threads should now function properly
- Added an option to change how deleted messages appear
- Fixed tab complete breaking when an emote was added both as a sub emote and 3rd party emote
- Fixed a clash with FFZ that led to some messages not appearing correctly
- Fixed an issue which caused sub emotes and emojis to not display in the Favorites tab
- Fixed the Most Used Emotes tab ignoring visibility setting
- Fixed sub emotes not showing in colon-complete while FFZ is enabled
- Fixed an issue which caused VOD chat to crash for some users

### Version 3.0.1

- Added an emote menu shortcut to define favorite emotes (alt+click)
- Added a tab in the emote menu to display favorite and most used emotes
- Added a button to open the native Twitch Emote Menu
- Added an option to change where the 7TV Emote Menu Button appears
- Added an option to modify the scale of emotes in chat
- Added visual settings for highlighted messages, allows changing opacity and over-all style
- Added an option to modify the font size in chat
- Unpausing chat should no longer cause old messages to rapidly scroll through
- Sidebar sub-categories in the settings menu will now highlight what's in view
- Chat History should now load more consistently
- Pressing escape while the emote menu is open now closes it
- Fixed an issue where Twitch badges sometimes failed to load
- Fixed an issue where Twitch emotes sometimes failed to load
- Fixed an issue which caused duplicate colon-complete matches with FFZ
- Fixed an issue that caused tab-completion to break with FFZ
- Fixed an issue where emotes in colon-complete wouldn't load on Mozilla Firefox
- Fixed a conflict causing emotes to sometimes display as broken images while other extensions were installed
- Fixed an issue which prevented highlights from being saved if the "Flash Title" option was turned on
- Fixed an issue where custom highlight sounds did not work if "Play sound on Mention" was turned off
- Fixed an issue where custom highlight flash title did not work if "Flash Title on Mention" was turned off

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
