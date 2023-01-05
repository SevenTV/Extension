module.exports = {
	plugins: ["stylelint-scss"],
	extends: [
		"stylelint-config-standard",
		"stylelint-config-prettier",
		"stylelint-config-recommended-scss",
		"stylelint-config-recommended-vue",
	],
	// add your custom config here
	// https://stylelint.io/user-guide/configuration
	rules: {
		"at-rule-no-unknown": null,
		"no-descending-specificity": null,
		"selector-pseudo-element-colon-notation": null,
		"declaration-empty-line-before": null,
		"rule-empty-line-before": null,
		"scss/at-import-partial-extension": null,
		"scss/no-global-function-names": null,
		"color-function-notation": null,
		"declaration-block-no-redundant-longhand-properties": null,
		"keyframes-name-pattern": null,
		"selector-class-pattern": null,
		"property-no-vendor-prefix": null,
		"no-empty-source": null,
		"value-keyword-case": null,
		"function-no-unknown": null,
		"annotation-no-unknown": null,
		"import-notation": null,
	},
	ignoreFiles: ["locale/*.ts"],
};
