import UiButton from "@/ui/UiButton.vue";
import { render } from "@testing-library/vue";

describe("UiButton", () => {
	test("it should render", () => {
		const { getByText } = render(UiButton, {
			slots: {
				default: "buttontext",
			},
		});

		getByText("buttontext");
	});
});
