declare let FrankerFaceZ: any;

let win = getWindow();
let initialized = false;
function tryInit() {
	if (!initialized) {
		let ffz = FrankerFaceZ.get();
		if (ffz) {
			console.info('FFZ Hook: Successfully found FFZ instance');

			ffz.addons.on(':ready', () => {
				window.postMessage('FFZ_HOOK::FFZ_ADDONS_READY', '',);
			});
		}
		else {
			console.error('FFZ Hook: Failed to find FFZ instance');
		}
	}
}

if (win.ffz) {
	tryInit();
}
else {
	// Attempt to inject after FFZ via a self-destructing setter, so we can reference FFZ globals.
	let oldPropertyDescriptor = Reflect.getOwnPropertyDescriptor(window, 'ffz');
	let hookDefined = Reflect.defineProperty(window, 'ffz', {
		set: function (value) {
			if (oldPropertyDescriptor) {
				Reflect.defineProperty(window, 'ffz', oldPropertyDescriptor);
				if (oldPropertyDescriptor.set) {
					oldPropertyDescriptor.set.apply(this, arguments as any);
				}
			}
			else {
				delete win.ffz;
				win.ffz = value;
			}
			tryInit();
		},
		configurable: true
	});

	if (hookDefined) {
		console.info('FFZ Hook: Initialized before FFZ, hooked window.ffz');
	}
	else {
		console.warn('FFZ Hook: Failed to hook window.ffz, cannot continue.');
	}
}

function getWindow(): WindowType {
	return window as WindowType;
}
type WindowType = Window & typeof globalThis & {
	ffz?: any;
};
