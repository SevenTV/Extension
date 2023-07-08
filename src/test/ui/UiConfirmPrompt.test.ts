import UiConfirmPrompt from "@/ui/UiConfirmPrompt.vue";
import { render } from "@testing-library/vue";

describe("UiConfirmPrompt", () => {
	test("it should render", () => {
		const { container } = render(UiConfirmPrompt, {
			props: {
				choices: ["yes", "no"],
				title: "prompt",
				message: "prompt message",
			},
		});

		const titleContainer = container.querySelector(".seventv-confirm-prompt-heading");
		expect(titleContainer?.textContent).equal("prompt");

		const promptBody = container.querySelector(".seventv-confirm-prompt-body");
		expect(promptBody?.textContent).equal("prompt message");

		const choicesButtons = container.querySelectorAll(".seventv-confirm-prompt-choice > button");
		expect(choicesButtons.length).equal(2);

		expect(choicesButtons[0].textContent).equal("YES");
		expect(choicesButtons[1].textContent).equal("NO");
	});
});
