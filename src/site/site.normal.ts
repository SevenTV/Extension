import { log } from "@/common/Logger";

export function loadSite() {
    import("./site.app");
}
