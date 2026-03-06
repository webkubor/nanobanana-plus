/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { FileSearchResult } from './types.js';

export class FileHandler {
  private static readonly PROJECT_ROOT = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '..',
    '..',
  );
  private static readonly OUTPUT_DIR = 'banana-plus';
  private static readonly SEARCH_PATHS = [
    this.PROJECT_ROOT,
    path.join(this.PROJECT_ROOT, 'images'),
    path.join(this.PROJECT_ROOT, 'input'),
    path.join(this.PROJECT_ROOT, this.OUTPUT_DIR),
    path.join(this.PROJECT_ROOT, 'nanobanana-output'),
    process.cwd(),
    path.join(process.cwd(), 'images'),
    path.join(process.cwd(), 'input'),
    path.join(process.cwd(), this.OUTPUT_DIR),
    path.join(process.cwd(), 'nanobanana-output'),
    path.join(process.env.HOME || '~', 'Downloads'),
    path.join(process.env.HOME || '~', 'Desktop'),
  ];

  static ensureOutputDirectory(): string {
    const outputPath = path.join(this.PROJECT_ROOT, this.OUTPUT_DIR);

    if (!fs.existsSync(outputPath)) {
      fs.mkdirSync(outputPath, { recursive: true });
    }

    return outputPath;
  }

  static findInputFile(filename: string): FileSearchResult {
    if (path.isAbsolute(filename) && fs.existsSync(filename)) {
      return {
        found: true,
        filePath: filename,
        searchedPaths: [],
      };
    }

    const searchPaths = this.SEARCH_PATHS;

    for (const searchPath of searchPaths) {
      const fullPath = path.join(searchPath, filename);
      if (fs.existsSync(fullPath)) {
        return {
          found: true,
          filePath: fullPath,
          searchedPaths: searchPaths,
        };
      }
    }

    return {
      found: false,
      searchedPaths: searchPaths,
    };
  }

  static generateFilename(
    prompt: string,
    format: 'png' | 'jpeg' = 'png',
    index: number = 0,
    aspectRatio: string = '1:1',
  ): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const timestamp = `${year}${month}${day}_${hours}${minutes}${seconds}`;

    // Create user-friendly filename from prompt
    let baseName = prompt
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '') // Remove special characters
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .substring(0, 32) // Limit to 32 characters
      .replace(/^_|_$/g, ''); // Remove leading/trailing underscores

    if (!baseName) {
      baseName = 'generated_image';
    }

    const extension = format === 'jpeg' ? 'jpg' : 'png';
    const cleanRatio = aspectRatio.replace(':', '-');

    // Construct elegant filename: 20240306_120000_prompt_slug_[16-9].png
    const outputPath = this.ensureOutputDirectory();
    let fileName = `${timestamp}_${baseName}_[${cleanRatio}].${extension}`;
    let counter = index > 0 ? index : 1;

    // Check for existing files and add counter if needed
    while (fs.existsSync(path.join(outputPath, fileName))) {
      fileName = `${timestamp}_${baseName}_${counter}_[${cleanRatio}].${extension}`;
      counter++;
    }

    return fileName;
  }

  static async saveImageFromBase64(
    base64Data: string,
    outputPath: string,
    filename: string,
  ): Promise<string> {
    const buffer = Buffer.from(base64Data, 'base64');
    const fullPath = path.join(outputPath, filename);

    await fs.promises.writeFile(fullPath, buffer);
    return fullPath;
  }

  static async readImageAsBase64(filePath: string): Promise<string> {
    const buffer = await fs.promises.readFile(filePath);
    return buffer.toString('base64');
  }
}
