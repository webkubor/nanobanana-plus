/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

export type GeminiImageModel =
  | 'gemini-3.1-flash-image-preview'   // Nano Banana 2 — 快速，默认
  | 'gemini-3-pro-image-preview'        // Nano Banana Pro — 高质量
  | 'gemini-2.5-flash-image'            // Nano Banana v1 — 兼容旧版
  | 'imagen-4.0-ultra-generate-001'    // Imagen 4 Ultra — predict 协议，Pro 专享
  | 'imagen-4.0-fast-generate-001';    // Imagen 4 Fast — predict 协议，Pro 专享

export type ImageProvider = 'codex' | 'gemini' | 'openai';

export type PresetType =
  | 'aureate-tech'    // CortexOS / Webkubor style
  | 'isometric-3d'    // High-end 3D model
  | 'glassmorphism'   // Frosted glass UI
  | 'cyberpunk-vibe'; // Neon lights, rain, futuristic

export interface ImageGenerationRequest {
  prompt: string;
  inputImage?: string;
  outputCount?: number;
  mode: 'generate' | 'edit' | 'restore';
  // Provider override (per-call)
  provider?: ImageProvider;
  // Model override (per-call)
  model?: string;
  // Style preset (predefined high-end aesthetics)
  preset?: PresetType;
  // Aspect ratio (e.g. "16:9", "1:1", "4:3", "9:16")
  aspectRatio?: string;
  // Common presets that map to production-friendly banner ratios
  aspectRatioPreset?: 'web-hero' | 'web-banner' | 'section-banner';
  // Batch generation options
  styles?: string[];
  variations?: string[];
  format?: 'grid' | 'separate';
  fileFormat?: 'png' | 'jpeg';
  seed?: number;
  // Custom export filename
  customFileName?: string;
  // Active profile name (applied before expansion)
  profileName?: string;
  // Skip prompt expansion even when a profile is active
  noExpand?: boolean;
  // Preview options
  preview?: boolean;
  noPreview?: boolean;
}

export interface ImageGenerationResponse {
  success: boolean;
  message: string;
  generatedFiles?: string[];
  error?: string;
}

export interface AuthConfig {
  apiKey: string;
  provider: ImageProvider;
  keyType: 'GEMINI_API_KEY' | 'GOOGLE_API_KEY' | 'OPENAI_API_KEY';
  source:
    | 'IMAGE_AGENT_GEMINI_API_KEY'
    | 'IMAGE_AGENT_GOOGLE_API_KEY'
    | 'IMAGE_AGENT_OPENAI_API_KEY'
    | 'IMAGE_AGENT_API_KEYS'
    | 'NANOBANANA_GEMINI_API_KEY'
    | 'NANOBANANA_GOOGLE_API_KEY'
    | 'NANOBANANA_OPENAI_API_KEY'
    | 'NANOBANANA_API_KEYS'  // 多 key 轮换
    | 'GEMINI_API_KEY'
    | 'GOOGLE_API_KEY'
    | 'OPENAI_API_KEY'
    | 'codex_cli'
    | 'gemini_cli'
    | 'oauth_adc'
    | 'runtime'
    | 'none';
  // 多 key 轮换相关
  apiKeys?: string[];  // 多个 key
  currentKeyIndex?: number;  // 当前使用的 key 索引
}

export interface AuthStatus {
  ready: boolean;
  hasApiKey: boolean;
  provider?: ImageProvider;
  keyType?: AuthConfig['keyType'];
  source: AuthConfig['source'];
  message: string;
}

export interface FileSearchResult {
  found: boolean;
  filePath?: string;
  searchedPaths: string[];
}

export interface StorySequenceArgs {
  type?: string;
  style?: string;
  transition?: string;
}

export interface IconPromptArgs {
  prompt?: string;
  type?: string;
  style?: string;
  background?: string;
  corners?: string;
}

export interface PatternPromptArgs {
  prompt?: string;
  type?: string;
  style?: string;
  density?: string;
  colors?: string;
  size?: string;
}

export interface DiagramPromptArgs {
  prompt?: string;
  type?: string;
  style?: string;
  layout?: string;
  complexity?: string;
  colors?: string;
  annotations?: string;
}
