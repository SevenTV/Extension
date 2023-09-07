### Untitled Version

**The changes listed here are not assigned to an official release**.

-   Added an option to select alternating background color for chat messages
-   Added a tip to the favorite menu to help users favorite emotes if none are found
-   Fixed an issue with tab auto-completion on Kick
-   Fixed emote tile width in emote menu
-   Fixed "hidden subscription status" message in the User Card
-   Fixed extraneous emote menu blank space when "Live Input Search" was enabled
-	  Added an option to hide the featured clips section
-	  Added option for enlargement of badges when hovering mouse over them.

### 3.0.15.1000

**The changes listed here are not assigned to an official release**.

-   Added a backup tab to the settings menu for importing & exporting settings
-   Added an option to select the default Emote Menu tab
-   Added artist attribution to the emote card
-   Added ability to reset settings to their defaults
-   Fixed an issue where emotes would take a long time to load if external emote providers gave slow response times
-   Fixed an issue where mentioning yourself would highlight the message
-   Fixed an issue where replying to a thread starting from your own message would highlight the message
-   Fixed a regression in previous nightly build causing channel emote sets to not receive EventAPI subscriptions
-   Removed old deprecated fallback cosmetics fetching using the v2 API

### 3.0.14.1000

-   Added a shortcut (Ctrl+E) to open the Emote Menu
-   Added shortcuts (Up/Down Arrows) to switch between providers in the Emote Menu
-   Search in the Emote Menu will now automatically open the nearest tab where matches are found
-   The input box in the Emote Menu is now focused automatically upon opening
-   Added an option to show stream stats such as latency, resolution, bitrate, etc.
-   Added an option to set click actions on the video player (pause/unpause and mute/unmute)
-   Added an option to hide player extensions
-   Added iterable tab-completion on Kick
-   Fixed a user card crash
-   Fixed an issue with the EventAPI connection closing on the first initialization
-   Fixed an issue that prevented new chatters from appearing in autocompletion
-   Fixed an issue which squished tooltips when hovering an emote on the far right side of chat
-   Fixed an issue which hid historical messages on Kick
-   Increased the default value for Message Batching from 150 to 250

### Version 3.0.13.1000

-   Added an option to hide the new mature content dialogs on Twitch
-   Added formatting support for Hype Chat
-   Added options to hide Hype Chats and the Hype Chat button
-   Fixed an issue which prevented moderator data from loading in User Cards
-   Fixed an issue where nametags with blending paints did not correctly use the base color and appeared invisible instead
-   Kick:
    -   Added a settings menu
    -   Added an option to set a delay betweet rendering new messages (Message Batching)
    -   Added an option to set alternating backgrounds between chat messages
    -   The chat input box on Kick no longers loses focus during slow mode
    -   Zero-Width Emotes should now appear properly in Kick chat

### Version 3.0.12.1000

-   Added colon-completion (partial emote matches with ":") on Kick
-   Added history navigation (up/down arrow) on Kick
-   Updated the auth mechanism on Kick to avoid using third-party cookies

### Version 3.0.11.1000

-   Fixed an issue that caused long messages to pause the chat on Kick

### Version 3.0.10.1000

-   Tweaked some styling issues in the Emote Menu
-   Kick:
    -   Fixed an issue where historical messages did not consistently render
    -   Fixed an issue which caused text to become misplaced when mixed with Kick native emotes
    -   Fixed an issue with the Emote Menu & Tooltips not appearing while in theater mode
    -   Fixed some issues where the connection flow failed
    -   Long text sequences should no longer overflow outside of the chat box
    -   Adjusted emoji scale to be in line with other platforms
    -   Clicking an emoji in the Emote Menu should now correctly input the unicode instead of the name

### Version 3.0.9.1000

-   Added new feature: Paint Tool ([subscribers only](https://7tv.app/store))
-   Added support for more features on [kick.com](https://kick.com/)
    -   Authentication / Channel Linking
    -   Channel Emotes
    -   Emote Menu
    -   7TV Paints & Badges
-   Fixed an issue which caused mod icons to be invisible
-   Fixed an issue where the emote menu button was broken due to a recent Twitch change
-   Fixed an issue which sometimes caused channel emote sets to disappear
-   Fixed an issue which caused stylesheets to be duplicated when running in hosted mode

### Version 3.0.8.1000

-   Enabled AVIF images on Firefox >= 113 by default
-   Added sub duration & account creation date in the User Card
-   Added a button to open an emote's full page from the emote card
-   Fixed an issue where clicking the upper drag region in the User Card opened the user's channel
-   Fixed user card content overflowing due to long messages
-   Fixed chat scroller being visible in the viewer list
-   Tentatively fixed an issue which caused the sidebar to crash occasionally

### Version 3.0.7.1000

-   Added a new User Card
-   Added early experimental functionality for a new site: [kick.com](https://kick.com/)
-   Added a tooltip to show the full message when hovering over replies in chat
-   Added a "Site Layout" menu where certain features of the Twitch website can be hidden
-   Added icons for emoji sets in the Emote Menu
-   Added an option to choose chat timestamp format
-   Fixed tooltips of nametag paints appearing even if they are disabled
-   Reinstated functionality on youtube.com

### Version 3.0.6.1000

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

### Version 3.0.5.1000

-   Reply Threads should now appear properly and show all messages
-   Fixed an issue which caused tab-completion to abruptly halt when a chatter's name is selected

### Version 3.0.4.7000

-   Added hot-patching functionality to the extension
-   Added chat rich embeds which allows twitch clips to preview in chat
-   Added a "Copy Message" button
-   Added an option to show thumbnail previews of streams when hovering over channels on the sidebar
-   Temporarily disabled the "Most Used Emotes" feature, pending a refactor. This fixes severe input lag experienced by some users
-   Made some internal changes which may decrease memory usage for some users
-   Fixed bad performance on colon-completion by limiting the amount of items shown
-   Fixed an issue which caused flickering when hovering on a deleted message
-   Fixed a compatibility issue with another extension, causing distorted scrolling behavior in the settings menu

### Version 3.0.3.1000

-   Disabled YouTube support temporarily due an issue with request pattern

### Version 3.0.2.3000

-   Improved the look of Channel Point Redeem & Highlight messages
-   Fixed an issue which caused sub emotes and emojis to not display in the Favorites tab
-   Fixed the Most Used Emotes tab ignoring visibility setting
-   Fixed sub emotes not showing in colon-complete while FFZ is enabled
-   Fixed an issue which caused VOD chat to crash for some users

### Version 3.0.2.2000

-   Reply threads should now function properly
-   Added an option to change how deleted messages appear

### Version 3.0.2.1000

-   Fixed issue which caused the chat input to lag over-time
-   Fixed tab complete breaking when an emote was added both as a sub emote and 3rd party emote
-   Fixed a clash with FFZ that led to some messages not appearing correctly

### Version 3.0.1.2000 (Nightly 2 RC)

-   Added an option to modify the font size in chat
-   Unpausing chat should no longer cause old messages to rapidly scroll through
-   Fixed a conflict causing emotes to sometimes display as broken images while other extensions were installed
-   Fixed an issue which prevented highlights from being saved if the "Flash Title" option was turned on
-   Fixed an issue where custom highlight sounds did not work if "Play sound on Mention" was turned off
-   Fixed an issue where custom highlight flash title did not work if "Flash Title on Mention" was turned off

### Version 3.0.1.1000 (Nightly 1)

-   Added an emote menu shortcut to define favorite emotes (alt+click)
-   Added a tab in the emote menu to display favorite and most used emotes
-   Added a button to open the native Twitch Emote Menu
-   Added an option to change where the 7TV Emote Menu Button appears
-   Added an option to modify the scale of emotes in chat
-   Added visual settings for highlighted messages, allows changing opacity and over-all style
-   Sidebar sub-categories in the settings menu will now highlight what's in view
-   Chat History should now load more consistently
-   Pressing escape while the emote menu is open now closes it
-   Fixed an issue where Twitch badges sometimes failed to load
-   Fixed an issue where Twitch emotes sometimes failed to load
-   Fixed an issue which caused duplicate colon-complete matches with FFZ
-   Fixed an issue that caused tab-completion to break with FFZ
-   Fixed an issue where emotes in colon-complete wouldn't load on Mozilla Firefox
-   Added visual settings for highlighted messages, allows changing opacity and over-all style

### Version 3.0.0.19000 (Beta 19 RC)

This build is a **release candidate**.

-   Added support for custom sounds for highlights
-   Added live updating for switching a channel's active emote set
-   Updated the look of emote update alerts in chat
-   Fixed an error in the shared worker which broke the fetching of legacy static cosmetics
-   Fixed an issue which sometimes caused setting changes to be lost
-   Fixed an issue where emote name changes did not reflect in chat
-   Fixed some performance overhead with the Mod Logs interface
-   Fixed timestamps always displaying in the 24h format

#### Beta 19.7

-   Added a special onboarding state for users upgrading from V2
-   Added a browser popup action
-   FFZ Badges will now only load if their extension is installed alongside 7TV
-   The FFZ setting profile created by 7TV will now only be active whilst 7TV is enabled
-   Fixed another issue that caused inconsistent cosmetics behavior

#### Beta 19.6

-   Personal Emotes, Badges, and Paints of the current user will now be pre-loaded
-   Fixed an issue that sometimes caused 7TV badges to double up

#### Beta 19.5

-   Legacy static cosmetics should now be visible again

#### Beta 19.4

-   Added an option to keep chat intact when a moderator clears messages
-   Added support for FFZ Badges
-   The chat should no longer crash when shield mode or /clear is executed by a moderator
-   Duplicate Message Bypass will no longer append the invisible character if 30 seconds have passed

#### Beta 19.3

-   Moderation messages should no longer be delayed when FrankerFaceZ is enabled
-   Fixed a compatibility issue with the Tab-Completion Carousel due to FrankerFaceZ internals corruption

#### Beta 19.2

-   Resolved a crash due to twitch set objects being corrupted with FrankerFaceZ enabled
-   Resolved an issue which prevented the emote menu button from appearing with FrankerFaceZ enabled

#### Beta 19.1

-   Fixed an issue which broke all emote loading on channels without a 7TV account

### Version 3.0.0.18000 (Beta 18)

-   New Feature: Custom Highlights
-   Added an option to control the volume of the mention sound effect
-   Added an option to disable First-Time Chatter highlights
-   Emote Modifiers from BetterTTV/FrankerFaceZ are now stripped from chat
-   Updated the look of the Settings Menu
-   Emotes should now show in the Reply Tray

#### Beta 18.1

-   Fixed an issue which caused settings to disappear
-   Fixed an issue where changing a highlight's color wouldn't save after refresh
-   Fixed an issue where zero-width emotes in chat did not remove the text token from the message
-   Updated the look of settings' home page

---

### Version 3.0.0.17000 (Beta 17)

-   Added a compatibility section to Onboarding Experience and Settings
-   Fixed autocompletion on YouTube only working with a full emote name
-   Fixed an issue which led reply threads to overflow
-   Fixed an issue which caused the mod slider to delete messages despite being retracted
-   Fixed an issue where zero-width emotes wouldn't work if there was extra white space in-between
-   Fixed an issue which occasionally resulted in old chat lines never being deleted, eventually crashing the page
-   Slider styling on Mozilla Firefox should now match that of Chromium

---

### Version 3.0.0.16000 (Beta 16)

-   Added an Onboarding Experience

#### Beta 16.1

-   Fixed an issue which led to broken styles on twitch.tv
-   Fixed an issue which blocked progress on the Onboarding page in Mozilla Firefox if extraneous permissions were requested

---

### Version 3.0.0.15000 (Beta 15)

-   Added a carousel visualization for tab-completion
-   Fixed an issue which caused mentions to ignore the Readable Colors setting
-   Fixed an issue with the Mod Slider performing a max-length timeout if the value was less than 60 seconds
-   Fixed an issue which prevented user cards from opening when in Mod View
-   Fixed the "Smooth-scroll chat" setting requiring a refresh to update

#### Beta 15.3

-   Updated message types

#### Beta 15.2

-   Input hotkeys such as tabbing are now captured to thwart conflicts from other extensions

#### Beta 15.1

-   The tab-completion carousel should now also work in theater mode
-   Fixed an issue where the tab-completion carousel required 2 tab presses to show results

---

### Version 3.0.0.14000 (Beta 14)

**This release adds initial support for YouTube**. To test this, grant permissions via the 7TV settings menu on Twitch.

-   Added support for channel & global emotes in YouTube Live Chat
-   Added support for colon-completing third-party emotes in YouTube Live Chat
-   Added a button to collapse sets in the Emote Menu
-   Gave sorting priority to zero-width emotes in the Emote Menu
-   Zero-Width Emotes in Twitch Chat should now work again

---

### Version 3.0.0.13000 (Beta 13)

#### Beta 13.2

-   Fixed an issue which caused mentions to break when chained with commas

---

#### Beta 13.1

-   Fixed an issue which caused fake mentions to appear around messages

---

-   Added colored mentions
-   Added information in Emote Cards on when an emote was added and who enabled it
-   Added a button and confirmation prompt to pin chat messages
-   Added a tooltip about the current Paint when hovering on a user's name
-   Added a contextual hint for toggling the duplicate message check bypass
-   Fixed an issue which caused the mention sound to play with historical messages
-   Fixed an issue where unpausing chat wouldn't scroll to bottom if there hadn't been any messages

---

### Version 3.0.0.12000 (Beta 12)

#### Beta 12.2

-   Added a button to sign-in and log out within the extension's settings menu
-   Fixed an issue where the Emote Menu Button did not work while signed out
-   Fixed an issue where the Emote Menu Button disappeared after being timed-out
-   Fixed an issue where the fast-updater displayed an error despite a success
-   Fixed an issue where the input box blended in to the viewer list

#### Beta 12.1

-   Mouse/Alt Chat Scroll Pause modes should now work again
-   Fixed an issue where non-https links would look like "`https://http://`" (all links now rewritten to HTTPS)
-   Fixed an issue with the Emote Menu appearing under community highlights

---

-   Added an option to play a sound on mention
-   Added an option to flash the title of a tab upon being mentioned
-   Added an update check mechanism
-   Holding Shift while using tab-completion will now make the selection move backwards
-   The sorting of tab-completion matches should now prioritize shorter names
-   Revised the look of Sliders, Toggles & Select form controls in the settings
-   Fixed an issue where categories in the settings menu while in compact mode needed to be clicked twice
-   Tentatively fixed an issue where all styling would break after an extension update on Mozilla Firefox

### Version 3.0.0.11000 (Beta 11)

🎉 **This build completes twitch.tv Feature Parity with the old extension!**

-   Added an option to bypass the duplicate message restriction in chat
-   Added an option to quick-send the same message by keeping the current content in the input box
-   Fixed an issue that caused some links to duplicate themselves
-   Fixed an issue where links spelled out without the protocol wouldn't become clickable
-   Fixed an issue where foldable buttons in the settings menu only reacted when clicking the chevron icon
-   Fixed an issue which let messages from blocked users appear in chat
-   Fixed an issue where ban/timeout icons would appear on one's own messages
-   Fixed an issue which caused the Mod Slider to only appear on one's own messages
-   Fixed an issue with the Mod Slider where timeouts above a certain thresold wouldn't work
-   Fixed an issue where Mod Icons would appear discolored
-   Tentatively fixed an issue which occasionally caused a crash when chat is cleared by a moderator

---

### Version 3.0.0.10000 (Beta 10)

-   Added support for chat in VODs
-   Fixed an issue where autocompletion stopped working after switching to another channel
-   Fixed an issue where emotes wouldn't load after switching to another channel
-   Fixed an issue where emotes wouldn't load in historical messages
-   Fixed an issue where cosmetics wouldn't load after switching to another channel
-   Fixed an issue which led to chatters from the previous channel remaining available in autocompletion

---

### Version 3.0.0.9000 (Beta 9)

#### Beta 9.2

-   Auto-completion should now work correctly again (oops)
-   Clicking emotes in the Emote Menu should no longer bring up the card
-   Overlay / Zero-Width Emotes should now show in tooltips again

#### Beta 9.1

-   Fixed an input crash when using colon-completion

**This release includes major code refactors**. Please report any issues or regressions via our [Discord server](https://discord.gg/7tv) or [GitHub](https://github.com/seventv/extensionv3).

-   Improved the speed of the extension's initial load
-   Implemented an initial design for Emote Cards
-   Added an option to autocomplete the usernames of active chatters
-   Fixed an issue where up/down-arrow would navigate chat history even if the cursor was not at an end
-   Fixed an issue which prevented user cards from opening
-   Fixed a major performance issue, greatly bringing down average CPU usage
-   Fixed the "Animated Avatars" toggle not actually doing anything
-   Fixed an issue which caused messages to appear permanently greyed out

---

### Version 3.0.0.8000 (Beta 8)

-   New Feature: Mod Logs, an interface to view recent moderator activity and active timeouts
-   New Feature: Autoclaim, allows automatically claiming the channel point bonus when it's available
-   Fixed an issue which caused a stray pixel to stay in view after viewing a tooltip
-   Fixed an issue which caused emojis to be considered in tab-completion
-   Improved the performance of the Emote Menu on highly populated tabs
-   Mention & Reply Highlights should now work again

---

#### Beta 8.1

-   Added support for chat pausing with Alt or Mouseover
-   Further improved the performance of the Emote Menu
-   Fixed freezing issues when opening the Mod Logs menu
-   ***

### Version 3.0.0.7000 (Beta 7)

-   Added support for Emojis in chat & auto-completion
-   Added a new tab for Emojis in the Emote Menu
-   Added support for Animated Avatars
-   Made some optimizations against bandwidth usage
-   Fixed an issue which broke the insertion of emotes to the input via the emote menu
-   Fixed an issue which broke the Mod Slider
-   Fixed an issue which caused timestamps to remain frozen in time
-   Fixed incorrect vertical chat padding
-   ***

### Version 3.0.0.6000 (Beta 6)

-   Added Message Highlights for First-Time Chatter, Returning Chatter & Suspicious Users
-   Added a search bar in the Emote Menu
-   Updated the look of the Settings Menu

---

### Version 3.0.0.5000 (Beta 5)

-   Colon auto-complete ( :emote ) should now work again
-   Added new config option ("Message Batching") to change the rate at which new messages appear
-   Significantly improved the performance of the Emote Menu
-   The jump buttons in the Emote Menu should now work properly on Chrome
-   Made tentative performance improvements to the chat. Please report any regressions
-   The page should no longer substantially freeze when tabbing in after a few seconds out of focus
-   The page should no longer occasionally freeze when switching between channels
-   The page should no longer feel sluggish for the first few seconds after loading into a channel
-   Fixed a conflict with FrankerFaceZ where some message types did not render properly
-   Fixed an issue which caused EventAPI subscription commands to be sent twice

---

### Version 3.0.0.4000 (Beta 4)

-   Added support for Replies & Threads
-   Added support for Mod Icons
-   Added a message announcement when channel 7TV emotes are changed
-   Added an option to change the chat padding style (full-width or native)
-   The emote menu button will now take the form of the 7TV Logo
-   Fixed an issue which caused this changelog to become impossible to close if multiple tabs were open

---

### Version 3.0.0.3000 (Beta 3)

-   Added an option for alternating background colors between chat messages
-   Added initial support for syncing settings with FrankerFaceZ
-   Content from blocked users will now be hidden
-   Made performance & stability tweaks
-   Fixed an issue where AVIF would be used regardless of whether the current browser is supported
-   Fixed an issue which caused this changelog to appear on every refresh <img width="18" src="https://cdn.7tv.app/emote/6086fa8d5e01df61570b594e/1x.webp" />

---

### Version 3.0.0.2000 (Beta 2)

-   Added message send state indication: greys out sent messages until confirmed
-   Added support for historical chat messages
-   Made it possible to delete one's own messages when broadcaster or mod
-   Cosmetics & Personal Emotes should now correctly synchronize with every tab
-   @mentions will now appear bolded
-   Added a setting for compact emote tooltips
-   Tooltips should no longer clip outside the window on some occasions
-   Fixed an issue where pressing tab would exit the chat input box
-   Fixed an issue where tab completion would pick a match that didn't start with the currently typed word
-   The extension will now refuse to run if another version of 7TV is detected on the browser
-   Added changelogs
