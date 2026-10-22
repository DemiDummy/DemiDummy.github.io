// Screenshot a page with headless Edge (WebGL through SwiftShader), for card images. Prints the PNG path.
//
//   node tools/shot.mjs "https://demidummy.github.io/trip-sitter/?scene=kitchen" shots/trip-sitter.png --size 1280x720 --wait 6000
//
// Handy jump-in URLs: trip-sitter ?scene=kitchen|maze|clay..., pirate-web ?battle or ?lookbook=sloops,
// sleepwalk ?play&mute&at=lobby (pauses without a mouse, so its card uses a shot from the game's own tools).

import { existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = process.cwd();
const args = process.argv.slice(2);
let size = "1280x800";
let wait = 2500;
const positional = [];
for (let i = 0; i < args.length; i++) {
    if (args[i] === "--size") size = args[++i];
    else if (args[i] === "--wait") wait = Number(args[++i]);
    else positional.push(args[i]);
}
if (positional.length < 2) {
    console.error("usage: node tools/shot.mjs <url> <out.png> [--size WxH] [--wait ms]");
    process.exit(2);
}
const [url, outArg] = positional;
const out = resolve(root, outArg);
const [w, h] = size.split("x").map(Number);
const edge = [
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
].find((p) => existsSync(p));
if (!edge) {
    console.error("Microsoft Edge not found");
    process.exit(1);
}
mkdirSync(dirname(out), { recursive: true });
rmSync(out, { force: true });
const profile = join(root, `edge-shot-${process.pid}`);
execFileSync(edge, [
    "--headless=new",
    "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist",
    "--hide-scrollbars",
    "--no-first-run",
    "--mute-audio",
    "--force-device-scale-factor=1",
    `--user-data-dir=${profile}`,
    `--window-size=${w},${h}`,
    `--virtual-time-budget=${wait}`,
    `--screenshot=${out}`,
    url,
], { stdio: "ignore", timeout: 90_000 });
const deadline = Date.now() + 30_000;
while (!existsSync(out) && Date.now() < deadline) await new Promise((r) => setTimeout(r, 100));
try { rmSync(profile, { recursive: true, force: true }); } catch { /* still held; harmless */ }
if (!existsSync(out)) {
    console.error("Edge didn't write the screenshot");
    process.exit(1);
}
console.log(out);
