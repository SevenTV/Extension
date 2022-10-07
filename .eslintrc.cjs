module.exports = {
	root: true,
	env: {
		browser: true,
		node: true,
		es2021: true,
	},
	plugins: ["prettier"],
	extends: [
		"plugin:vue/vue3-recommended",
		"eslint:recommended",
		"@vue/typescript/recommended",
		// Add under other rules
		"@vue/prettier",
	],
	parserOptions: {
		ecmaVersion: 2021,
	},
	ignorePatterns: ["locale/*.ts"],
	rules: {
		"prettier/prettier": "error",
		"no-console": "warn",
		"no-debugger": "error",
		"no-undef": "off",
		quotes: [1, "double"],
		"@typescript-eslint/no-unused-vars": "error",
		"@typescript-eslint/explicit-module-boundary-types": "off",
		"@typescript-eslint/no-namespace": "off",
		"vue/multi-word-component-names": "off",
		"vue/require-default-prop": "off",
	},
	globals: {
		defineEmits: "readonly",
		defineProps: "readonly",
		NodeJS: "readonly",
	},
};
