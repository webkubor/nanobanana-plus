/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { UserProfile } from './profileManager.js';

// ── Composition hints keyed by aspect ratio ──────────────────────────────────
const RATIO_COMPOSITION: Record<string, string> = {
  '9:16':  'vertical composition, subject centered, safe zones at top and bottom',
  '3:4':   'portrait composition, subject in upper-center, breathing room',
  '4:5':   'portrait composition, tight but balanced framing',
  '1:1':   'square composition, centered subject, balanced negative space',
  '16:9':  'wide landscape, rule of thirds, cinematic depth',
  '21:9':  'ultra-wide cinematic, panoramic sweep, strong horizon',
  '3:1':   'wide banner, dominant horizontal rhythm',
};

// ── Platform-specific aesthetic tokens ───────────────────────────────────────
const PLATFORM_AESTHETIC: Record<string, string> = {
  'instagram/xiaohongshu': 'lifestyle aesthetic, warm tones, soft bokeh, shareable',
  'stories/reels':         'bold visual, high contrast, mobile-first, eye-catching',
  'twitter/weibo':         'clean editorial, strong focal point',
  'web-blog':              'editorial illustration, legible, tasteful negative space',
  'web-hero':              'impactful hero, spacious sky or background for overlay text',
  'desktop-wallpaper':     'rich detail, immersive, no text clutter',
  'mobile-wallpaper':      'vertical immersive, status-bar safe zone',
  'profile-photo':         'soft focus background, warm natural light on subject',
  'print-poster':          'high-fidelity detail, strong typographic space at bottom',
  'youtube-thumbnail':     'bold focal element, high contrast, thumbnail-readable',
};

// ── Quality tokens by level ───────────────────────────────────────────────────
const QUALITY_TOKENS: Record<string, string> = {
  fast:     'clean, polished',
  standard: 'high detail, professional quality, sharp focus',
  high:     'ultra-high detail, masterwork, studio quality, 4K render',
};

// ── Language-aware padding for very short prompts ────────────────────────────
function isChinesePrompt(prompt: string): boolean {
  return /[一-鿿]/.test(prompt);
}

function padShortPrompt(prompt: string): string {
  if (prompt.length >= 40) return '';
  return isChinesePrompt(prompt)
    ? 'subject sharp and detailed, soft ambient light, minimal noise'
    : 'subject sharp and detailed, soft ambient light, minimal noise';
}

// ── Main expander ─────────────────────────────────────────────────────────────
export interface ExpandResult {
  original: string;
  expanded: string;
  appliedTokens: string[];
}

export function expandPrompt(rawPrompt: string, profile?: UserProfile): ExpandResult {
  const tokens: string[] = [];

  const compositionHint = profile?.aspectRatio
    ? RATIO_COMPOSITION[profile.aspectRatio]
    : undefined;
  if (compositionHint) tokens.push(compositionHint);

  const platformAesthetic = profile?.platform
    ? PLATFORM_AESTHETIC[profile.platform]
    : undefined;
  if (platformAesthetic) tokens.push(platformAesthetic);

  if (profile?.style) tokens.push(profile.style);

  const qualityToken = QUALITY_TOKENS[profile?.qualityLevel ?? 'standard'];
  if (qualityToken) tokens.push(qualityToken);

  const padToken = padShortPrompt(rawPrompt);
  if (padToken) tokens.push(padToken);

  if (profile?.promptSuffix) tokens.push(profile.promptSuffix);

  const expanded = tokens.length > 0
    ? `${rawPrompt}, ${tokens.join(', ')}`
    : rawPrompt;

  return { original: rawPrompt, expanded, appliedTokens: tokens };
}

// ── Utility: describe a profile in human-readable form ───────────────────────
export function describeProfile(profile: UserProfile): string {
  const parts = [
    `platform: ${profile.platform}`,
    `ratio: ${profile.aspectRatio}`,
    profile.style ? `style: ${profile.style}` : null,
    profile.qualityLevel ? `quality: ${profile.qualityLevel}` : null,
  ].filter(Boolean);
  return parts.join(' | ');
}
