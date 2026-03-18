
import { GoogleGenAI } from '@google/genai';
import { FileHandler } from './fileHandler.js';
import {
  ImageGenerationRequest,
  ImageGenerationResponse,
  AuthConfig,
  AuthStatus,
  StorySequenceArgs,
} from './types.js';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class ImageGenerator {
  private ai: GoogleGenAI;
  private modelName: string;
  private authConfig: AuthConfig;
  private authValidated = false;
  private authValidationError: string | null = null;
  private static readonly DEFAULT_MODEL = 'gemini-3.1-flash-image-preview';
  private static readonly MODEL_LIST_ENDPOINT =
    'https://generativelanguage.googleapis.com/v1beta/models';
  private static readonly ASPECT_RATIO_PRESETS = {
    'web-hero': '21:9',
    'web-banner': '16:9',
    'section-banner': '3:1',
  } as const;
  private static readonly IMAGEN_UNSUPPORTED_FALLBACKS = {
    'imagen-4.0-ultra-generate-001': 'gemini-3-pro-image-preview',
    'imagen-4.0-fast-generate-001': 'gemini-3.1-flash-image-preview',
  } as const;

  constructor(authConfig: AuthConfig) {
    this.authConfig = authConfig;
    this.ai = new GoogleGenAI(
      authConfig.apiKey ? { apiKey: authConfig.apiKey } : {},
    );
    this.modelName =
      process.env.NANOBANANA_MODEL || ImageGenerator.DEFAULT_MODEL;
    console.error(`DEBUG - Default image model: ${this.modelName}`);
  }

  // 解析每次请求实际使用的模型（per-call override 优先）
  private resolveModel(request: ImageGenerationRequest): string {
    const model = request.model || this.modelName;
    console.error(`DEBUG - Resolved model for this call: ${model}`);
    return model;
  }

  private resolveAspectRatio(
    request: ImageGenerationRequest,
  ): string | undefined {
    if (request.aspectRatio) {
      return request.aspectRatio;
    }

    if (request.aspectRatioPreset) {
      return ImageGenerator.ASPECT_RATIO_PRESETS[request.aspectRatioPreset];
    }

    return undefined;
  }

  private resolveEffectiveModel(
    request: ImageGenerationRequest,
    aspectRatio?: string,
  ): {
    requestedModel: string;
    effectiveModel: string;
    fallbackReason?: string;
  } {
    const requestedModel = this.resolveModel(request);

    if (
      aspectRatio === '21:9' &&
      requestedModel in ImageGenerator.IMAGEN_UNSUPPORTED_FALLBACKS
    ) {
      const effectiveModel =
        ImageGenerator.IMAGEN_UNSUPPORTED_FALLBACKS[
        requestedModel as keyof typeof ImageGenerator.IMAGEN_UNSUPPORTED_FALLBACKS
        ];
      return {
        requestedModel,
        effectiveModel,
        fallbackReason:
          `Requested model ${requestedModel} does not support 21:9 output via the Imagen API. ` +
          `Switched automatically to ${effectiveModel} so the request can still produce a 21:9 image.`,
      };
    }

    return { requestedModel, effectiveModel: requestedModel };
  }

  // 判断是否为需要 predict 协议的 Imagen 4 模型
  private isImagenPredictModel(model: string): boolean {
    return model.startsWith('imagen-4.');
  }

  private getModelLabel(model: string): string {
    if (model.startsWith('imagen-4.') && model.includes('ultra')) {
      return 'Imagen 4 Ultra';
    }

    if (model.startsWith('imagen-4.')) {
      return 'Imagen 4 Fast';
    }

    if (model.includes('pro')) {
      return 'Nano Banana Pro';
    }

    if (model.includes('3.1')) {
      return 'Nano Banana 2';
    }

    return 'Nano Banana v1';
  }

  // 使用 predict REST 接口调用 Imagen 4 Ultra / Fast
  private async generateViaPredict(
    prompt: string,
    model: string,
    apiKey: string,
    aspectRatio?: string,
    sampleCount: number = 1,
  ): Promise<string[]> {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:predict?key=${encodeURIComponent(apiKey)}`;
    
    // For Nano Banana models (gemini-3*), we use imageConfig inside parameters
    const parameters: Record<string, any> = { sampleCount };
    
    if (aspectRatio) {
      if (model.includes('gemini-3')) {
        parameters.imageConfig = {
          aspectRatio,
          imageSize: '1K'
        };
      } else {
        // Imagen 4 standard
        parameters.aspectRatio = aspectRatio;
      }
    }

    const body = JSON.stringify({
      instances: [{ prompt }],
      parameters,
    });

    console.error(`DEBUG - Using predict API for model: ${model}`);
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });

    if (!response.ok) {
      let errMsg = `predict API error ${response.status}`;
      try {
        const payload = (await response.json()) as { error?: { message?: string } };
        errMsg = payload.error?.message || errMsg;
      } catch { /* ignore */ }
      throw new Error(errMsg);
    }

    const json = (await response.json()) as {
      predictions?: Array<{ bytesBase64Encoded?: string; mimeType?: string }>;
    };

    const results: string[] = [];
    for (const pred of json.predictions || []) {
      if (pred.bytesBase64Encoded && pred.bytesBase64Encoded.length > 100) {
        results.push(pred.bytesBase64Encoded);
      }
    }
    return results;
  }

  private async generateGeminiViaRest(
    prompt: string,
    model: string,
    apiKey: string,
    aspectRatio?: string,
    imageSize: '1K' | '2K' | '4K' = '1K',
  ): Promise<string[]> {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
    const generationConfig: Record<string, unknown> = {
      responseModalities: ['TEXT', 'IMAGE'],
      imageConfig: {
        imageSize,
        ...(aspectRatio ? { aspectRatio } : {}),
      },
    };

    const body = JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
      generationConfig,
    });

    console.error(`DEBUG - Using generateContent REST API for model: ${model}`);
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'x-goog-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body,
    });

    if (!response.ok) {
      let errMsg = `generateContent REST API error ${response.status}`;
      try {
        const payload = (await response.json()) as { error?: { message?: string } };
        errMsg = payload.error?.message || errMsg;
      } catch { /* ignore */ }
      throw new Error(errMsg);
    }

    const json = (await response.json()) as {
      candidates?: Array<{
        content?: {
          parts?: Array<{
            inlineData?: { data?: string; mimeType?: string };
            inline_data?: { data?: string; mime_type?: string };
            text?: string;
          }>;
        };
      }>;
    };

    const results: string[] = [];

    for (const candidate of json.candidates || []) {
      for (const part of candidate.content?.parts || []) {
        const inlineData = part.inlineData || part.inline_data;
        if (inlineData?.data && inlineData.data.length > 100) {
          results.push(inlineData.data);
          continue;
        }

        if (part.text && this.isValidBase64ImageData(part.text)) {
          results.push(part.text);
        }
      }
    }

    return results;
  }

  private async openImagePreview(filePath: string): Promise<void> {
    try {
      const platform = process.platform;
      let command: string;

      switch (platform) {
        case 'darwin': // macOS
          command = `open "${filePath}"`;
          break;
        case 'win32': // Windows
          command = `start "" "${filePath}"`;
          break;
        default: // Linux and others
          command = `xdg-open "${filePath}"`;
          break;
      }

      await execAsync(command);
      console.error(`DEBUG - Opened preview for: ${filePath}`);
    } catch (error: unknown) {
      console.error(
        `DEBUG - Failed to open preview for ${filePath}:`,
        error instanceof Error ? error.message : String(error),
      );
      // Don't throw - preview failure shouldn't break image generation
    }
  }

  private shouldAutoPreview(request: ImageGenerationRequest): boolean {
    // If --no-preview is explicitly set, never preview
    if (request.noPreview) {
      return false;
    }

    // Only preview when --preview flag is explicitly set
    if (request.preview) {
      return true;
    }

    // No auto-preview - images only open when explicitly requested
    return false;
  }

  private async handlePreview(
    files: string[],
    request: ImageGenerationRequest,
  ): Promise<void> {
    const shouldPreview = this.shouldAutoPreview(request);

    if (!shouldPreview || !files.length) {
      if (files.length > 1 && request.noPreview) {
        console.error(
          `DEBUG - Auto-preview disabled for ${files.length} images (--no-preview specified)`,
        );
      }
      return;
    }

    console.error(
      `DEBUG - ${request.preview ? 'Explicit' : 'Auto'}-opening ${files.length} image(s) for preview`,
    );

    // Open all generated images
    const previewPromises = files.map((file) => this.openImagePreview(file));
    await Promise.all(previewPromises);
  }

  static validateAuthentication(): AuthConfig {
    // 支持多 key 轮换：NANOBANANA_API_KEYS="key1,key2,key3" 逗号分隔
    const nanoMultiKeys = process.env.NANOBANANA_API_KEYS;
    if (nanoMultiKeys) {
      const keys = nanoMultiKeys.split(',').map(k => k.trim()).filter(k => k);
      if (keys.length > 0) {
        console.error(`✓ Found NANOBANANA_API_KEYS with ${keys.length} keys, will rotate`);
        return {
          apiKey: keys[0],  // 初始使用第一个
          keyType: 'GEMINI_API_KEY',
          source: 'NANOBANANA_API_KEYS',
          apiKeys: keys,
          currentKeyIndex: 0,
        };
      }
    }

    const nanoGeminiKey = process.env.NANOBANANA_GEMINI_API_KEY;
    if (nanoGeminiKey) {
      console.error('✓ Found NANOBANANA_GEMINI_API_KEY environment variable');
      return {
        apiKey: nanoGeminiKey,
        keyType: 'GEMINI_API_KEY',
        source: 'NANOBANANA_GEMINI_API_KEY',
      };
    }

    const nanoGoogleKey = process.env.NANOBANANA_GOOGLE_API_KEY;
    if (nanoGoogleKey) {
      console.error('✓ Found NANOBANANA_GOOGLE_API_KEY environment variable');
      return {
        apiKey: nanoGoogleKey,
        keyType: 'GOOGLE_API_KEY',
        source: 'NANOBANANA_GOOGLE_API_KEY',
      };
    }

    const allowFallback =
      process.env.NANOBANANA_ALLOW_FALLBACK_KEYS === '1' ||
      process.env.NANOBANANA_ALLOW_FALLBACK_KEYS === 'true';

    if (!allowFallback) {
      if (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY) {
        console.error(
          '⚠️ GEMINI_API_KEY/GOOGLE_API_KEY detected but ignored. Set NANOBANANA_ALLOW_FALLBACK_KEYS=true to allow fallback keys.',
        );
      }
    }

    if (allowFallback) {
      const geminiKey = process.env.GEMINI_API_KEY;
      if (geminiKey) {
        console.error(
          '✓ Found GEMINI_API_KEY environment variable (fallback)',
        );
        return {
          apiKey: geminiKey,
          keyType: 'GEMINI_API_KEY',
          source: 'GEMINI_API_KEY',
        };
      }

      const googleKey = process.env.GOOGLE_API_KEY;
      if (googleKey) {
        console.error(
          '✓ Found GOOGLE_API_KEY environment variable (fallback)',
        );
        return {
          apiKey: googleKey,
          keyType: 'GOOGLE_API_KEY',
          source: 'GOOGLE_API_KEY',
        };
      }
    }

    const allowOAuthAdc =
      process.env.NANOBANANA_ALLOW_OAUTH_ADC !== '0' &&
      process.env.NANOBANANA_ALLOW_OAUTH_ADC !== 'false';
    if (allowOAuthAdc) {
      console.error(
        '✓ No API key found, using OAuth/ADC credentials (Gemini CLI login/session)',
      );
      return { apiKey: '', keyType: 'GEMINI_API_KEY', source: 'oauth_adc' };
    }

    return { apiKey: '', keyType: 'GEMINI_API_KEY', source: 'none' };
  }

  getAuthStatus(): AuthStatus {
    if (this.hasApiKey()) {
      const sourceLabel =
        this.authConfig.source === 'runtime'
          ? 'runtime input'
          : this.authConfig.source;
      return {
        ready: true,
        hasApiKey: true,
        keyType: this.authConfig.keyType,
        source: this.authConfig.source,
        message: `✅ API key ready (${sourceLabel}).`,
      };
    }

    if (this.authConfig.source === 'oauth_adc') {
      return {
        ready: true,
        hasApiKey: false,
        source: 'oauth_adc',
        message:
          '✅ OAuth/ADC ready (Gemini CLI login/session). You can generate images without explicitly setting API key.',
      };
    }

    return {
      ready: false,
      hasApiKey: false,
      source: 'none',
      message:
        '❌ No authentication configured. Provide API key or enable OAuth/ADC.',
    };
  }

  async configureRuntimeApiKey(
    apiKey: string,
    keyType: AuthConfig['keyType'] = 'GEMINI_API_KEY',
  ): Promise<{ success: boolean; message: string }> {
    const normalized = apiKey.trim();
    if (!normalized) {
      return { success: false, message: 'API key is empty.' };
    }

    const validationResult = await ImageGenerator.validateApiKey(normalized);
    if (!validationResult.valid) {
      return {
        success: false,
        message: `API key validation failed: ${validationResult.message}`,
      };
    }

    this.authConfig = { apiKey: normalized, keyType, source: 'runtime' };
    this.ai = new GoogleGenAI({ apiKey: normalized });
    this.authValidated = true;
    this.authValidationError = null;
    return {
      success: true,
      message:
        '✅ API key is valid and has been configured for this session. You can continue image generation now.',
    };
  }

  private hasApiKey(): boolean {
    return this.authConfig.apiKey.trim().length > 0;
  }

  // 获取当前应该使用的 API key（多 key 轮换）
  private getApiKey(): string {
    if (this.authConfig.apiKeys && this.authConfig.apiKeys.length > 0) {
      return this.authConfig.apiKeys[this.authConfig.currentKeyIndex || 0];
    }
    return this.authConfig.apiKey;
  }

  // 轮换到下一个 key
  private rotateToNextKey(): void {
    if (this.authConfig.apiKeys && this.authConfig.apiKeys.length > 1) {
      const nextIndex = ((this.authConfig.currentKeyIndex || 0) + 1) % this.authConfig.apiKeys.length;
      this.authConfig.currentKeyIndex = nextIndex;
      const newKey = this.authConfig.apiKeys[nextIndex];
      console.error(`🔄 Rotating to API key #${nextIndex + 1}/${this.authConfig.apiKeys.length}`);
      // 重新创建 AI 实例
      this.ai = new GoogleGenAI({ apiKey: newKey });
    }
  }

  private getAuthModeLabel(): string {
    switch (this.authConfig.source) {
      case 'runtime':
        return 'Runtime API Key (session input)';
      case 'NANOBANANA_GEMINI_API_KEY':
      case 'NANOBANANA_GOOGLE_API_KEY':
      case 'GEMINI_API_KEY':
      case 'GOOGLE_API_KEY':
        return `API Key (${this.authConfig.source})`;
      case 'oauth_adc':
        return 'OAuth/ADC (Gemini CLI login/session)';
      default:
        return 'Unknown';
    }
  }

  private static async validateApiKey(
    apiKey: string,
  ): Promise<{ valid: boolean; message: string }> {
    try {
      const response = await fetch(
        `${ImageGenerator.MODEL_LIST_ENDPOINT}?key=${encodeURIComponent(apiKey)}`,
      );

      if (response.ok) {
        return { valid: true, message: 'API key is valid.' };
      }

      let errorDetails = '';
      try {
        const payload = (await response.json()) as {
          error?: { message?: string };
        };
        errorDetails = payload.error?.message || '';
      } catch {
        errorDetails = await response.text();
      }

      const message = errorDetails || response.statusText;
      if (response.status === 400 || response.status === 401) {
        return { valid: false, message: `Invalid API key. ${message}` };
      }
      if (response.status === 403) {
        return {
          valid: false,
          message: `API key does not have required permissions. ${message}`,
        };
      }
      return {
        valid: false,
        message: `Validation request failed with status ${response.status}. ${message}`,
      };
    } catch (error: unknown) {
      return {
        valid: false,
        message: `Failed to validate API key due to network/runtime error: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  private async ensureAuthenticationReady(): Promise<void> {
    if (this.authConfig.source === 'oauth_adc') {
      return;
    }

    if (!this.hasApiKey()) {
      throw new Error(
        '未检测到可用 API Key。请先提供 Gemini API Key（https://aistudio.google.com/apikey）。\n' +
        '或启用 OAuth/ADC（Gemini CLI 登录态）。你也可以直接回复：我的 key 是 xxx，我会先验证可用性再继续生成。',
      );
    }

    if (this.authValidated) {
      return;
    }

    if (this.authValidationError) {
      throw new Error(this.authValidationError);
    }

    const validationResult = await ImageGenerator.validateApiKey(
      this.authConfig.apiKey,
    );
    if (!validationResult.valid) {
      this.authValidationError =
        `当前 API Key 验证失败：${validationResult.message}\n` +
        '请重新输入可用 key，我会验证通过后继续生成。';
      throw new Error(this.authValidationError);
    }

    this.authValidated = true;
  }

  private isValidBase64ImageData(data: string): boolean {
    // Check if data looks like base64 image data
    if (!data || data.length < 100) {
      return false; // Too short to be meaningful image data
    }

    // Check if it's valid base64 format
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
    if (!base64Regex.test(data)) {
      return false; // Not valid base64
    }

    // Additional check: base64 image data is typically quite long
    if (data.length < 1000) {
      console.error(
        'DEBUG - Skipping short data that may not be image:',
        data.length,
        'characters',
      );
      return false;
    }

    return true;
  }

  private buildBatchPrompts(request: ImageGenerationRequest): string[] {
    const prompts: string[] = [];
    const basePrompt = request.prompt;

    // If no batch options, return original prompt
    if (!request.styles && !request.variations && !request.outputCount) {
      return [basePrompt];
    }

    // Handle styles
    if (request.styles && request.styles.length > 0) {
      for (const style of request.styles) {
        prompts.push(`${basePrompt}, ${style} style`);
      }
    }

    // Handle variations
    if (request.variations && request.variations.length > 0) {
      const basePrompts = prompts.length > 0 ? prompts : [basePrompt];
      const variationPrompts: string[] = [];

      for (const baseP of basePrompts) {
        for (const variation of request.variations) {
          switch (variation) {
            case 'lighting':
              variationPrompts.push(`${baseP}, dramatic lighting`);
              variationPrompts.push(`${baseP}, soft lighting`);
              break;
            case 'angle':
              variationPrompts.push(`${baseP}, from above`);
              variationPrompts.push(`${baseP}, close-up view`);
              break;
            case 'color-palette':
              variationPrompts.push(`${baseP}, warm color palette`);
              variationPrompts.push(`${baseP}, cool color palette`);
              break;
            case 'composition':
              variationPrompts.push(`${baseP}, centered composition`);
              variationPrompts.push(`${baseP}, rule of thirds composition`);
              break;
            case 'mood':
              variationPrompts.push(`${baseP}, cheerful mood`);
              variationPrompts.push(`${baseP}, dramatic mood`);
              break;
            case 'season':
              variationPrompts.push(`${baseP}, in spring`);
              variationPrompts.push(`${baseP}, in winter`);
              break;
            case 'time-of-day':
              variationPrompts.push(`${baseP}, at sunrise`);
              variationPrompts.push(`${baseP}, at sunset`);
              break;
          }
        }
      }
      if (variationPrompts.length > 0) {
        prompts.splice(0, prompts.length, ...variationPrompts);
      }
    }

    // If no styles/variations but outputCount > 1, create simple variations
    if (
      prompts.length === 0 &&
      request.outputCount &&
      request.outputCount > 1
    ) {
      for (let i = 0; i < request.outputCount; i++) {
        prompts.push(basePrompt);
      }
    }

    // Limit to outputCount if specified
    if (request.outputCount && prompts.length > request.outputCount) {
      prompts.splice(request.outputCount);
    }

    return prompts.length > 0 ? prompts : [basePrompt];
  }

  async generateTextToImage(
    request: ImageGenerationRequest,
  ): Promise<ImageGenerationResponse> {
    try {
      await this.ensureAuthenticationReady();
      const outputPath = FileHandler.ensureOutputDirectory();
      const generatedFiles: string[] = [];
      const prompts = this.buildBatchPrompts(request);
      const aspectRatio = this.resolveAspectRatio(request);
      const { requestedModel, effectiveModel, fallbackReason } =
        this.resolveEffectiveModel(request, aspectRatio);
      let firstError: string | null = null;

      console.error(`DEBUG - Generating ${prompts.length} image variation(s)`);

      for (let i = 0; i < prompts.length; i++) {
        const currentPrompt = prompts[i];
        console.error(
          `DEBUG - Generating variation ${i + 1}/${prompts.length}:`,
          currentPrompt,
        );

        try {
          if (this.isImagenPredictModel(effectiveModel)) {
            // ---- Imagen 4 路径：使用 predict REST 接口 ----
            if (!this.hasApiKey()) {
              throw new Error('Imagen 4 predict 接口需要显式 API Key，无法使用 OAuth/ADC。');
            }
            const base64List = await this.generateViaPredict(
              currentPrompt,
              effectiveModel,
              this.authConfig.apiKey,
              aspectRatio,
              1,
            );
            for (const imageBase64 of base64List) {
              const filename = FileHandler.generateFilename(
                request.styles || request.variations ? currentPrompt : request.prompt,
                effectiveModel,
                request.fileFormat || 'png',
                i,
                aspectRatio || '1:1',
                request.customFileName
              );
              const fullPath = await FileHandler.saveImageFromBase64(
                imageBase64,
                outputPath,
                filename,
              );
              generatedFiles.push(fullPath);
              console.error('DEBUG - Image saved (predict):', fullPath);
              break;
            }
          } else if (this.hasApiKey()) {
            const base64List = await this.generateGeminiViaRest(
              currentPrompt,
              effectiveModel,
              this.authConfig.apiKey,
              aspectRatio,
            );

            for (const imageBase64 of base64List) {
              const filename = FileHandler.generateFilename(
                request.styles || request.variations ? currentPrompt : request.prompt,
                effectiveModel,
                request.fileFormat || 'png',
                i,
                aspectRatio || '1:1',
                request.customFileName
              );
              const fullPath = await FileHandler.saveImageFromBase64(
                imageBase64,
                outputPath,
                filename,
              );
              generatedFiles.push(fullPath);
              console.error('DEBUG - Image saved (generateContent REST):', fullPath);
              break;
            }
          } else {
            // ---- 普通模型路径：使用 generateContent ----
            const generateConfig: any = {
              responseModalities: ['TEXT', 'IMAGE'],
            };

            if (aspectRatio) {
              generateConfig.imageConfig = {
                aspectRatio,
                imageSize: '1K',
              };
            }

            const response = await (this.ai as any).models.generateContent({
              model: effectiveModel,
              contents: [
                {
                  role: 'user',
                  parts: [{ text: currentPrompt }],
                },
              ],
              config: generateConfig,
            });

            console.error('DEBUG - API Response structure for variation', i + 1);

            if (response.candidates && response.candidates[0]?.content?.parts) {
              for (const part of response.candidates[0].content.parts) {
                let imageBase64: string | undefined;

                if (part.inlineData?.data) {
                  imageBase64 = part.inlineData.data;
                  console.error('DEBUG - Found image data in inlineData:', {
                    length: imageBase64!.length,
                    mimeType: part.inlineData.mimeType,
                  });
                } else if (part.text && this.isValidBase64ImageData(part.text)) {
                  imageBase64 = part.text;
                  console.error('DEBUG - Found image data in text field (fallback)');
                }

                if (imageBase64) {
                  const filename = FileHandler.generateFilename(
                    request.styles || request.variations ? currentPrompt : request.prompt,
                    effectiveModel,
                    request.fileFormat || 'png',
                    i,
                    aspectRatio || '1:1',
                    request.customFileName
                  );
                  const fullPath = await FileHandler.saveImageFromBase64(
                    imageBase64,
                    outputPath,
                    filename,
                  );
                  generatedFiles.push(fullPath);
                  console.error('DEBUG - Image saved to:', fullPath);
                  break;
                }
              }
            }
          }
        } catch (error: unknown) {
          const errorMessage = this.handleApiError(error);
          if (!firstError) {
            firstError = errorMessage;
          }
          console.error(
            `DEBUG - Error generating variation ${i + 1}:`,
            errorMessage,
          );

          // If auth-related, stop immediately
          if (errorMessage.toLowerCase().includes('authentication failed')) {
            return {
              success: false,
              message: 'Image generation failed',
              error: errorMessage,
            };
          }
        }
      }

      if (generatedFiles.length === 0) {
        return {
          success: false,
          message: 'Failed to generate any images',
          error: firstError || 'No image data found in API responses',
        };
      }

      // Handle preview if requested
      await this.handlePreview(generatedFiles, request);

      const modelLabel = this.getModelLabel(effectiveModel);

      return {
        success: true,
        message: `✅ Successfully generated ${generatedFiles.length} image(s)\n` +
          `🔐 Auth: ${this.getAuthModeLabel()}\n` +
          `🍌 Model: ${modelLabel} (${effectiveModel})\n` +
          (fallbackReason
            ? `ℹ️ Auto-switch: requested ${requestedModel}, but ${fallbackReason}\n`
            : '') +
          (aspectRatio ? `📐 Aspect ratio: ${aspectRatio}\n` : '') +
          `📁 Saved to: ${generatedFiles.join(', ')}`,
        generatedFiles,
      };
    } catch (error: unknown) {
      console.error('DEBUG - Error in generateTextToImage:', error);
      
      // 检查是否是多 key 配置且遇到可重试的错误
      const errorMessage = error instanceof Error ? error.message : String(error).toLowerCase();
      const isRetryableError = 
        errorMessage.includes('quota exceeded') ||
        errorMessage.includes('429') ||
        errorMessage.includes('rate limit') ||
        errorMessage.includes('api key not valid') ||
        errorMessage.includes('permission denied');
      
      // 如果是多 key 配置且遇到可重试错误，尝试轮换 key 重试
      if (this.authConfig.apiKeys && this.authConfig.apiKeys.length > 1 && isRetryableError) {
        console.error('⚠️ Detected retryable error, trying next API key...');
        this.rotateToNextKey();
        // 递归重试一次
        return this.generateTextToImage(request);
      }
      
      return {
        success: false,
        message: 'Failed to generate image',
        error: this.handleApiError(error),
      };
    }
  }

  private handleApiError(error: unknown): string {
    // Ideal: Check for a specific error code or type from the SDK
    // Fallback: Check for revealing strings in the error message
    const errorMessage =
      error instanceof Error ? error.message : String(error).toLowerCase();

    if (errorMessage.includes('api key not valid')) {
      return 'Authentication failed: The provided API key is invalid. Please provide a valid key and verify it before retrying.';
    }

    if (errorMessage.includes('permission denied')) {
      return 'Authentication failed: The provided API key does not have the necessary permissions for the Gemini API. Please check your Google Cloud project settings.';
    }

    if (errorMessage.includes('quota exceeded')) {
      return 'API quota exceeded. Please check your usage and limits in the Google Cloud console.';
    }

    if (errorMessage.includes('insufficient authentication scopes')) {
      return 'Authentication failed: OAuth/ADC credentials were found, but they do not include the scope required for Gemini image generation.';
    }

    // Check for GoogleGenerativeAIResponseError
    if (
      error &&
      typeof error === 'object' &&
      'response' in error &&
      error.response
    ) {
      const responseError = error as {
        response: { status: number; statusText: string };
      };
      const { status } = responseError.response;

      switch (status) {
        case 400:
          return 'The request was malformed. This may be due to an issue with the prompt. Please check for safety violations or unsupported content.';
        case 403: // General permission error if specific message not caught
          return 'Authentication failed. Please ensure your API key is valid and has the necessary permissions.';
        case 500:
          return 'The image generation service encountered a temporary internal error. Please try again later.';
        default:
          return `API request failed with status ${status}. Please check your connection and API key.`;
      }
    }

    // Fallback for other error types
    return `An unexpected error occurred: ${errorMessage}`;
  }

  async generateStorySequence(
    request: ImageGenerationRequest,
    args?: StorySequenceArgs,
  ): Promise<ImageGenerationResponse> {
    try {
      await this.ensureAuthenticationReady();
      const outputPath = FileHandler.ensureOutputDirectory();
      const aspectRatio = this.resolveAspectRatio(request);
      const generatedFiles: string[] = [];
      const steps = request.outputCount || 4;
      const type = args?.type || 'story';
      const style = args?.style || 'consistent';
      const transition = args?.transition || 'smooth';
      let firstError: string | null = null;

      console.error(`DEBUG - Generating ${steps}-step ${type} sequence`);

      // Generate each step of the story/process
      for (let i = 0; i < steps; i++) {
        const stepNumber = i + 1;
        let stepPrompt = `${request.prompt}, step ${stepNumber} of ${steps}`;

        // Add context based on type
        switch (type) {
          case 'story':
            stepPrompt += `, narrative sequence, ${style} art style`;
            break;
          case 'process':
            stepPrompt += `, procedural step, instructional illustration`;
            break;
          case 'tutorial':
            stepPrompt += `, tutorial step, educational diagram`;
            break;
          case 'timeline':
            stepPrompt += `, chronological progression, timeline visualization`;
            break;
        }

        // Add transition context
        if (i > 0) {
          stepPrompt += `, ${transition} transition from previous step`;
        }

        console.error(`DEBUG - Generating step ${stepNumber}: ${stepPrompt}`);

        try {
          const response = await this.ai.models.generateContent({
            model: this.resolveModel(request),
            contents: [
              {
                role: 'user',
                parts: [{ text: stepPrompt }],
              },
            ],
          });

          if (response.candidates && response.candidates[0]?.content?.parts) {
            for (const part of response.candidates[0].content.parts) {
              let imageBase64: string | undefined;

              if (part.inlineData?.data) {
                imageBase64 = part.inlineData.data;
              } else if (part.text && this.isValidBase64ImageData(part.text)) {
                imageBase64 = part.text;
              }

              if (imageBase64) {
                const filename = FileHandler.generateFilename(
                  `${type}step${stepNumber}${request.prompt}`,
                  this.resolveModel(request),
                  'png',
                  0,
                  aspectRatio || '1:1',
                  request.customFileName
                );
                const fullPath = await FileHandler.saveImageFromBase64(
                  imageBase64,
                  outputPath,
                  filename,
                );
                generatedFiles.push(fullPath);
                console.error(`DEBUG - Step ${stepNumber} saved to:`, fullPath);
                break;
              }
            }
          }
        } catch (error: unknown) {
          const errorMessage = this.handleApiError(error);
          if (!firstError) {
            firstError = errorMessage;
          }
          console.error(
            `DEBUG - Error generating step ${stepNumber}:`,
            errorMessage,
          );
          if (errorMessage.toLowerCase().includes('authentication failed')) {
            return {
              success: false,
              message: 'Story generation failed',
              error: errorMessage,
            };
          }
        }

        // Check if this step was actually generated
        if (generatedFiles.length < stepNumber) {
          console.error(
            `DEBUG - WARNING: Step ${stepNumber} failed to generate - no valid image data received`,
          );
        }
      }

      console.error(
        `DEBUG - Story generation completed. Generated ${generatedFiles.length} out of ${steps} requested images`,
      );

      if (generatedFiles.length === 0) {
        return {
          success: false,
          message: 'Failed to generate any story sequence images',
          error: firstError || 'No image data found in API responses',
        };
      }

      // Handle preview if requested
      await this.handlePreview(generatedFiles, request);

      const wasFullySuccessful = generatedFiles.length === steps;
      const successMessage = wasFullySuccessful
        ? `Successfully generated complete ${steps}-step ${type} sequence`
        : `Generated ${generatedFiles.length} out of ${steps} requested ${type} steps (${steps - generatedFiles.length} steps failed)`;

      return {
        success: true,
        message: `${successMessage}\n🔐 Auth: ${this.getAuthModeLabel()}`,
        generatedFiles,
      };
    } catch (error: unknown) {
      console.error('DEBUG - Error in generateStorySequence:', error);
      return {
        success: false,
        message: `Failed to generate ${request.mode} sequence`,
        error: this.handleApiError(error),
      };
    }
  }
  async editImage(
    request: ImageGenerationRequest,
  ): Promise<ImageGenerationResponse> {
    try {
      await this.ensureAuthenticationReady();
      if (!request.inputImage) {
        return {
          success: false,
          message: 'Input image file is required for editing',
          error: 'Missing inputImage parameter',
        };
      }

      const fileResult = FileHandler.findInputFile(request.inputImage);
      if (!fileResult.found) {
        return {
          success: false,
          message: `Input image not found: ${request.inputImage}`,
          error: `Searched in: ${fileResult.searchedPaths.join(', ')}`,
        };
      }

      const outputPath = FileHandler.ensureOutputDirectory();
      const aspectRatio = this.resolveAspectRatio(request);
      const imageBase64 = await FileHandler.readImageAsBase64(
        fileResult.filePath!,
      );

      const response = await this.ai.models.generateContent({
        model: this.resolveModel(request),
        contents: [
          {
            role: 'user',
            parts: [
              { text: request.prompt },
              {
                inlineData: {
                  data: imageBase64,
                  mimeType: 'image/png',
                },
              },
            ],
          },
        ],
      });

      console.error(
        'DEBUG - Edit API Response structure:',
        JSON.stringify(response, null, 2),
      );

      if (response.candidates && response.candidates[0]?.content?.parts) {
        const generatedFiles: string[] = [];
        let imageFound = false;

        for (const part of response.candidates[0].content.parts) {
          let resultImageBase64: string | undefined;

          if (part.inlineData?.data) {
            resultImageBase64 = part.inlineData.data;
            console.error('DEBUG - Found edited image in inlineData:', {
              length: resultImageBase64!.length,
              mimeType: part.inlineData.mimeType,
            });
          } else if (part.text && this.isValidBase64ImageData(part.text)) {
            resultImageBase64 = part.text;
            console.error(
              'DEBUG - Found edited image in text field (fallback)',
            );
          }

          if (resultImageBase64) {
            const filename = FileHandler.generateFilename(
              `${request.mode}_${request.prompt}`,
              this.resolveModel(request),
              'png',
              0,
              aspectRatio || '1:1',
              request.customFileName
            );
            const fullPath = await FileHandler.saveImageFromBase64(
              resultImageBase64,
              outputPath,
              filename,
            );
            generatedFiles.push(fullPath);
            console.error('DEBUG - Edited image saved to:', fullPath);
            imageFound = true;
            break; // Only process the first valid image
          }
        }

        if (!imageFound) {
          console.error(
            'DEBUG - No valid image data found in edit response parts',
          );
        }

        // Handle preview if requested
        await this.handlePreview(generatedFiles, request);

        return {
          success: true,
          message: `Successfully ${request.mode}d image\n🔐 Auth: ${this.getAuthModeLabel()}`,
          generatedFiles,
        };
      }

      return {
        success: false,
        message: `Failed to ${request.mode} image`,
        error: 'No image data in response',
      };
    } catch (error: unknown) {
      console.error(`DEBUG - Error in ${request.mode}Image:`, error);
      return {
        success: false,
        message: `Failed to ${request.mode} image`,
        error: this.handleApiError(error),
      };
    }
  }
}
