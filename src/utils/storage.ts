/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Capsule } from "../types";

// Premium high-fidelity SVGs as base64 or inline strings to render immediately
const SVGS = {
  coffee: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="100%" height="100%"><rect width="100%" height="100%" fill="%232b211a"/><g stroke="%23dfcaad" stroke-width="1.5" fill="none" opacity="0.85"><path d="M120 180 h160 v8 h-160 z M130 180 v-60 c0-15 10-25 25-25 h90 c15 0 25 10 25 25 v60 M270 115 c12 0 20 8 20 18 s-8 18-20 18 h-5 M160 95 c-5-10-2-20 2-25 M200 95 c-2-15 4-25 0-30 M240 95 c2-10-3-20 1-25 M110 215 h180 M130 200 h140"/></g><text x="200" y="250" fill="%23dfcaad" font-family="serif" font-size="14" text-anchor="middle" letter-spacing="2" opacity="0.7">CAFE CHRONICLES - 2023</text></svg>`,
  mountain: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="100%" height="100%"><rect width="100%" height="100%" fill="%231a261f"/><g stroke="%23dfcaad" stroke-width="1.5" fill="none" opacity="0.8"><path d="M60 210 l100-110 l50 50 l100-100 l50 60 l20 100 M60 210 h300 M110 155 l40-10 M210 150 l30-20"/><path d="M130 133 l10-20 M140 144 l25-10 M280 80 l15-20 M290 90 l20-5"/><circle cx="310" cy="80" r="15" stroke="%23dfcaad" stroke-dasharray="2 2"/></g><text x="200" y="255" fill="%23dfcaad" font-family="serif" font-size="14" text-anchor="middle" letter-spacing="2" opacity="0.7">THE GREEN SUMMIT - 2026</text></svg>`,
  vintageLetter: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="100%" height="100%"><rect width="100%" height="100%" fill="%23221e1a"/><g stroke="%23dfcaad" stroke-width="1" fill="none" opacity="0.6"><rect x="100" y="60" width="200" height="140" rx="4"/><path d="M100 60 l100 70 l100-70 M100 200 l70-55 M300 200 l-70-55"/></g><circle cx="200" cy="130" r="12" fill="%23802020" stroke="%23dfcaad" stroke-width="1" opacity="0.9"/><path d="M195 127 l5 6 l10-10" stroke="%23dfcaad" stroke-width="1.5" fill="none"/><text x="200" y="240" fill="%23dfcaad" font-family="serif" font-size="13" text-anchor="middle" letter-spacing="3" opacity="0.75">A SACRED TRUST</text></svg>`,
};

// Simulated beautiful classical ambient backing tracks (recorded in synth or base64)
// We will generate audio wave sounds procedurally in React, but we can store mock wave assets
const DEFAULT_CAPSULES: Capsule[] = [];

export function getCapsules(): Capsule[] {
  const data = localStorage.getItem("capsule_archive");
  if (!data) {
    localStorage.setItem("capsule_archive", JSON.stringify(DEFAULT_CAPSULES));
    return DEFAULT_CAPSULES;
  }
  try {
    return JSON.parse(data);
  } catch (e) {
    return DEFAULT_CAPSULES;
  }
}

export function saveCapsules(capsules: Capsule[]) {
  localStorage.setItem("capsule_archive", JSON.stringify(capsules));
}

export function getCapsuleColorClasses(color: string) {
  switch (color) {
    case "oxblood":
      return {
        bg: "bg-[#4a1212]",
        border: "border-[#6b2121]",
        text: "text-[#ecd3be]",
        accent: "bg-[#aa2c2c]",
        gradient: "from-[#4a1212] to-[#1c0404]",
        highlight: "border-[#aa2c2c]/30",
        pill: "bg-[#330c0c] text-[#dfcaad] border-[#6b2121]"
      };
    case "walnut":
      return {
        bg: "bg-[#2f1f17]",
        border: "border-[#402a1e]",
        text: "text-[#ead9c9]",
        accent: "bg-[#8b5a2b]",
        gradient: "from-[#2f1f17] to-[#140b06]",
        highlight: "border-[#8b5a2b]/30",
        pill: "bg-[#1c120d] text-[#e3cca8] border-[#402a1e]"
      };
    case "charcoal":
      return {
        bg: "bg-[#222120]",
        border: "border-[#333230]",
        text: "text-[#e5dfda]",
        accent: "bg-[#555350]",
        gradient: "from-[#222120] to-[#0a0a09]",
        highlight: "border-[#555350]/30",
        pill: "bg-[#141413] text-[#dfcaad] border-[#333230]"
      };
    case "pine":
      return {
        bg: "bg-[#1c281e]",
        border: "border-[#2a3c2d]",
        text: "text-[#dfebdf]",
        accent: "bg-[#3f6446]",
        gradient: "from-[#1c281e] to-[#0a110b]",
        highlight: "border-[#3f6446]/30",
        pill: "bg-[#0f1811] text-[#bfe1bf] border-[#2a3c2d]"
      };
    case "indigo":
      return {
        bg: "bg-[#1c2230]",
        border: "border-[#263045]",
        text: "text-[#dfe6f5]",
        accent: "bg-[#3e568c]",
        gradient: "from-[#1c2230] to-[#0b0e16]",
        highlight: "border-[#3e568c]/30",
        pill: "bg-[#0e121b] text-[#bfcee8] border-[#263045]"
      };
    case "amber":
    default:
      return {
        bg: "bg-[#3d2a13]",
        border: "border-[#523b1e]",
        text: "text-[#f9ebd9]",
        accent: "bg-[#b3772d]",
        gradient: "from-[#3d2a13] to-[#1a1005]",
        highlight: "border-[#b3772d]/30",
        pill: "bg-[#1e1409] text-[#ffd699] border-[#523b1e]"
      };
  }
}
