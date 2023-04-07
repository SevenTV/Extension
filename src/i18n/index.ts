import { createI18n } from "vue-i18n";

// Import locales
const locale = {} as Record<string, Record<string, object>>;
const importedLocales = import.meta.glob("@/locale/*.yaml", { eager: true, import: "default" });

for (const [path, mod] of Object.entries(importedLocales)) {
	const lang = path.replace("/locale/", "").replace(".yaml", "");
	locale[lang] = mod as Record<string, object>;
}

// Create i18n instance
export function setupI18n() {
	const inst = createI18n({
		locale: "en_US",
		legacy: false,
		globalInjection: true,
		messages: locale,
	});

	return inst;
}
