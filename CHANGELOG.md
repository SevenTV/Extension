### Version 3.0.0.11000 (Beta 11)

🎉 **This build completes twitch.tv Feature Parity with the old extension!**

- Added an option to bypass the duplicate message restriction in chat
- Added an option to quick-send the same message by keeping the current content in the input box
- Fixed an issue that caused some links to duplicate themselves
- Fixed an issue where links spelled out without the protocol wouldn't become clickable
- Fixed an issue where foldable buttons in the settings menu only reacted when clicking the chevron icon
- Fixed an issue which let messages from blocked users appear in chat
- Fixed an issue where ban/timeout icons would appear on one's own messages
- Fixed an issue which caused the Mod Slider to only appear on one's own messages
- Fixed an issue with the Mod Slider where timeouts above a certain thresold wouldn't work
- Fixed an issue where Mod Icons would appear discolored
- Tentatively fixed an issue which occasionally caused a crash when chat is cleared by a moderator 

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

- Auto-completion should now work correctly again (oops)
- Clicking emotes in the Emote Menu should no longer bring up the card
- Overlay / Zero-Width Emotes should now show in tooltips again

#### Beta 9.1

- Fixed an input crash when using colon-completion

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
-   
---

### Version 3.0.0.7000 (Beta 7)

-   Added support for Emojis in chat & auto-completion
-   Added a new tab for Emojis in the Emote Menu
-   Added support for Animated Avatars
-   Made some optimizations against bandwidth usage
-   Fixed an issue which broke the insertion of emotes to the input via the emote menu
-   Fixed an issue which broke the Mod Slider
-   Fixed an issue which caused timestamps to remain frozen in time
-   Fixed incorrect vertical chat padding
-   
---

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
