import { getAgentDir, type ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { homedir } from "node:os";
import { join, resolve } from "node:path";

export default function (pi: ExtensionAPI) {
  const terminal = process.env.HC_TERMINAL_ID;
  if (!terminal) return;
  const label = "omarchy.pi-model";
  const defaultProfile = resolve(getAgentDir()) === join(homedir(), ".pi", "agent");
  const publish = async (model?: { provider: string; id: string }) => {
    const value = model ? JSON.stringify([model.provider, model.id, process.pid, defaultProfile]) : "";
    await pi.exec("hc", ["label", terminal, `${label}=${value}`], { timeout: 1500 }).catch(() => {});
  };
  pi.on("session_start", (_event, ctx) => publish(ctx.model));
  pi.on("model_select", (event) => publish(event.model));
  pi.on("session_shutdown", () => publish());
}
