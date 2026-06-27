/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type CapsuleCategory = "book" | "case" | "journal" | "letter";
export type CapsuleColor = "oxblood" | "walnut" | "charcoal" | "pine" | "indigo" | "amber";

export interface CapsuleItem {
  id: string;
  type: "letter" | "image" | "voice" | "link";
  title: string;
  content: string; // The raw letter text, base64 image/audio URL, or Web link URL
  fileName?: string;
  duration?: number; // duration of voice recording in seconds
}

export interface Capsule {
  id: string;
  title: string;
  description: string;
  unlockDate: string; // ISO String
  category: CapsuleCategory;
  color: CapsuleColor;
  style: number; // visual variation style (1, 2, 3, etc.)
  isGift: boolean;
  giftTo?: string;
  giftFrom?: string;
  giftLink?: string;
  isOpened: boolean;
  items: CapsuleItem[];
  createdAt: string;
}

export type ViewState = "library" | "desk" | "create" | "gift";
