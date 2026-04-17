[33mcommit 2354f47c5b7547fd1527481a524ce31430cd74ff[m[33m ([m[1;31mupstream/Fix/ffz-conflict[m[33m)[m
Author: moath alayel <57598907+ftk789@users.noreply.github.com>
Date:   Thu Apr 2 14:03:18 2026 +0300

    Fixed conflict with ffz

[1mdiff --git a/CHANGELOG-nightly.md b/CHANGELOG-nightly.md[m
[1mindex 65e04d9..6deb39b 100644[m
[1m--- a/CHANGELOG-nightly.md[m
[1m+++ b/CHANGELOG-nightly.md[m
[36m@@ -1,3 +1,14 @@[m
[32m+[m[32m### 3.1.18.1000[m
[32m+[m
[32m+[m[32m-   Fixed a conflict issue with 7TV extension and FFZ running at the same time[m
[32m+[m
[32m+[m[32m### 3.1.17.1000[m
[32m+[m
[32m+[m[32m-   April fools effects joke 2026[m
[32m+[m[32m-   Fixed steam latency information not being displayed correctly[m
[32m+[m[32m-   Added initial Lead Moderator functionallity[m
[32m+[m[32m-   Fixed other small bugs[m
[32m+[m
 ### 3.1.16.2000[m
 [m
 -   Updated Firefox extension URL in onboarding[m
[1mdiff --git a/CHANGELOG.md b/CHANGELOG.md[m
[1mindex 1749794..b16c1a0 100644[m
[1m--- a/CHANGELOG.md[m
[1m+++ b/CHANGELOG.md[m
[36m@@ -1,3 +1,14 @@[m
[32m+[m[32m### 3.1.18[m
[32m+[m
[32m+[m[32m-   Fixed a conflict issue with 7TV extension and FFZ extension running at the same time[m
[32m+[m
[32m+[m[32m### 3.1.17[m
[32m+[m
[32m+[m[32m-   April fools effects joke 2026[m
[32m+[m[32m-   Fixed steam latency information not being displayed correctly[m
[32m+[m[32m-   Added initial Lead Moderator functionallity[m
[32m+[m[32m-   Fixed other small bugs[m
[32m+[m
 ### 3.1.16[m
 [m
 -   Fixed emote menu not showing emotes with same name but different casing[m
[1mdiff --git a/src/site/twitch.tv/modules/chat/ChatModule.vue b/src/site/twitch.tv/modules/chat/ChatModule.vue[m
[1mindex 87d9606..0f14225 100644[m
[1m--- a/src/site/twitch.tv/modules/chat/ChatModule.vue[m
[1m+++ b/src/site/twitch.tv/modules/chat/ChatModule.vue[m
[36m@@ -60,6 +60,7 @@[m [mconst chatController = useComponentHook<Twitch.ChatControllerComponent>([m
 		predicate: (n) => n.pushMessage && n.props?.messageHandlerAPI,[m
 	},[m
 	{[m
[32m+[m		[32m// new hook method[m
 		hooks: {[m
 			update(inst) {[m
 				shouldMount.set(inst, !!inst.component.props.channelID);[m
