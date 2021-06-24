declare let FrankerFaceZ: any;

declare interface Window { 
	ffz?: any;
};

let initialized = false;
function tryInit() {
	if (!initialized) {
		let ffz = FrankerFaceZ.get();
		if (ffz) {
			ffz.addons.on(':ready', () => {
				//TODO: Signal to content script that FFZ has loaded
			});
		}
	}
}

if (window.ffz) {
	tryInit();
}
else {
	// Attempt to inject after FFZ via a self-destructing setter, so we can reference FFZ globals.
	try {
		let oldPropertyDescriptor = Object.getOwnPropertyDescriptor(window, 'ffz');
		Object.defineProperty(window, 'ffz', {
			set: function (value) {
				if (oldPropertyDescriptor) {
					Object.defineProperty(window, 'ffz', oldPropertyDescriptor);
					if (oldPropertyDescriptor.set) {
						oldPropertyDescriptor.set(value);
					}
				}
				else {
					delete window.ffz;
					window.ffz = value;
				}
				tryInit();
			},
			configurable: true
		});
	}
	catch (error) {}
}