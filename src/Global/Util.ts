
export function getRunningContext(): Context {
	try {
		if (chrome.bookmarks) {
			return 'background';
		}
		else {
			return 'content';
		}
	}
	catch (_) {
		return 'content';
	}
}

type Context = 'background' | 'content';
