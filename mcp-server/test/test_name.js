
import { FileHandler } from './dist/fileHandler.js';

console.log('--- Filename Logic Unit Test ---');

const tests = [
  { prompt: 'A lonely desert inn', model: 'gemini-3.1-flash-image-preview', ratio: '1:1', custom: 'Wuxia_Master' },
  { prompt: 'Cyberpunk city', model: 'imagen-4.0-ultra-generate-001', ratio: '21:9', custom: '' },
  { prompt: 'Golden sunset', model: 'gemini-3-pro-image-preview', ratio: '16:9', custom: 'Wallpaper_4K' }
];

tests.forEach(t => {
  const name = FileHandler.generateFilename(t.prompt, t.model, 'png', 0, t.ratio, t.custom);
  console.log(`INPUT: ${t.model} | ${t.ratio} | "${t.custom}"`);
  console.log(`RESULT: ${name}\n`);
});
