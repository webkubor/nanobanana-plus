/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface UserProfile {
  name: string;
  platform: string;
  aspectRatio: string;
  style?: string;
  provider?: string;
  qualityLevel?: 'fast' | 'standard' | 'high';
  language?: 'zh' | 'en';
  promptSuffix?: string;
  created: string;
  updated: string;
}

export interface ProfileStore {
  version: '1';
  defaultProfile: string;
  profiles: Record<string, UserProfile>;
}

export const CONFIG_DIR = path.join(os.homedir(), '.image-agent-plus');
export const CONFIG_FILE = path.join(CONFIG_DIR, 'profiles.json');

const now = () => new Date().toISOString();

const BUILTIN_PROFILES: Array<Omit<UserProfile, 'created' | 'updated'>> = [
  { name: 'social',     platform: 'instagram/xiaohongshu', aspectRatio: '3:4',  style: 'photorealistic' },
  { name: 'story',      platform: 'stories/reels',         aspectRatio: '9:16', style: 'photorealistic' },
  { name: 'blog',       platform: 'web-blog',              aspectRatio: '16:9', style: 'modern illustration' },
  { name: 'hero',       platform: 'web-hero',              aspectRatio: '21:9', style: 'cinematic' },
  { name: 'wallpaper',  platform: 'desktop-wallpaper',     aspectRatio: '16:9', style: 'artistic' },
  { name: 'avatar',     platform: 'profile-photo',         aspectRatio: '1:1',  style: 'photorealistic portrait' },
  { name: 'poster',     platform: 'print-poster',          aspectRatio: '3:4',  style: 'editorial' },
];

function makeBuiltinProfiles(): Record<string, UserProfile> {
  const ts = now();
  return Object.fromEntries(
    BUILTIN_PROFILES.map((p) => [p.name, { ...p, created: ts, updated: ts }]),
  );
}

export function loadProfileStore(): ProfileStore {
  try {
    const content = fs.readFileSync(CONFIG_FILE, 'utf8');
    return JSON.parse(content) as ProfileStore;
  } catch {
    return { version: '1', defaultProfile: 'social', profiles: makeBuiltinProfiles() };
  }
}

export function saveProfileStore(store: ProfileStore): void {
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(store, null, 2), 'utf8');
}

export function getProfile(name?: string): UserProfile | undefined {
  const store = loadProfileStore();
  const key = name || store.defaultProfile;
  return store.profiles[key];
}

export function getDefaultProfileName(): string {
  return loadProfileStore().defaultProfile;
}

export function setDefaultProfile(name: string): void {
  const store = loadProfileStore();
  if (!store.profiles[name]) {
    throw new Error(`Profile "${name}" not found. Run \`image-agent-plus profile list\` to see available profiles.`);
  }
  store.defaultProfile = name;
  saveProfileStore(store);
}

export function upsertProfile(profile: Omit<UserProfile, 'created' | 'updated'> & Partial<Pick<UserProfile, 'created'>>): UserProfile {
  const store = loadProfileStore();
  const existing = store.profiles[profile.name];
  const full: UserProfile = {
    ...profile,
    created: existing?.created ?? now(),
    updated: now(),
  };
  store.profiles[profile.name] = full;
  saveProfileStore(store);
  return full;
}

export function listProfiles(): Array<{ name: string; isDefault: boolean; profile: UserProfile }> {
  const store = loadProfileStore();
  return Object.entries(store.profiles).map(([name, profile]) => ({
    name,
    isDefault: name === store.defaultProfile,
    profile,
  }));
}

export const PLATFORM_ASPECT_RATIO: Record<string, string> = {
  'instagram/xiaohongshu': '3:4',
  'stories/reels':         '9:16',
  'twitter/weibo':         '16:9',
  'web-blog':              '16:9',
  'web-hero':              '21:9',
  'desktop-wallpaper':     '16:9',
  'mobile-wallpaper':      '9:16',
  'profile-photo':         '1:1',
  'print-poster':          '3:4',
  'youtube-thumbnail':     '16:9',
};
