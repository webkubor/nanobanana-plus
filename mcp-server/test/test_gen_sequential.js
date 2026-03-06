
import { ImageGenerator } from './dist/imageGenerator.js';
import { execSync } from 'child_process';

const generator = new ImageGenerator(ImageGenerator.validateAuthentication());
const model = process.argv[2] || 'gemini-3.1-flash-image-preview';
const scenes = {
  '16:9': 'A cinematic wuxia battle scene in a dense bamboo forest, black-clad assassins rushing in from the mist, long-range composition, cold moonlight, flying leaves, ultra-detailed Chinese martial arts atmosphere. The only visible text in the image is exactly these four Chinese characters: 沸腾之雪. No other text, no subtitles, no seals, no logos, no calligraphy except 沸腾之雪.',
  '1:1': 'A wuxia swordsman standing on the edge of a sheer cliff above the clouds, robes whipping in the wind, distant mountains and storm light, centered heroic composition, high-end cinematic detail. The only visible text in the image is exactly these four Chinese characters: 沸腾之雪. No other text, no subtitles, no seals, no logos, no calligraphy except 沸腾之雪.',
  '4:3': 'A grand imperial palace at night in a Chinese wuxia world, torchlight, red walls, golden roofs, tense atmosphere before a duel, classical composition, richly detailed architecture. The only visible text in the image is exactly these four Chinese characters: 沸腾之雪. No other text, no subtitles, no seals, no logos, no calligraphy except 沸腾之雪.',
  '9:16': 'A vertical wuxia poster scene of black-clad killers emerging through a bamboo forest, dramatic perspective, motion, moonlit fog, sharp blades, elegant Chinese action cinema style. The only visible text in the image is exactly these four Chinese characters: 沸腾之雪. No other text, no subtitles, no seals, no logos, no calligraphy except 沸腾之雪.',
  '3:4': 'A vertical wuxia scene at the palace gate, lone fighter facing elite guards, ancient Chinese architecture, banners in the wind, rich depth and dramatic lighting. The only visible text in the image is exactly these four Chinese characters: 沸腾之雪. No other text, no subtitles, no seals, no logos, no calligraphy except 沸腾之雪.',
  'web-hero': 'An epic extreme long shot of two massive armies confronting each other across an open plain in a Chinese wuxia world, banners, cavalry, dust, storm sky, monumental scale, cinematic war tableau. The only visible text in the image is exactly these four Chinese characters: 沸腾之雪. No other text, no subtitles, no seals, no logos, no calligraphy except 沸腾之雪.',
};

const testCases = [
  { aspectRatio: '16:9' },
  { aspectRatio: '1:1' },
  { aspectRatio: '4:3' },
  { aspectRatio: '9:16' },
  { aspectRatio: '3:4' },
  { aspectRatioPreset: 'web-hero' } // 21:9
];

const expectedRatios = {
  '16:9': 16 / 9,
  '1:1': 1,
  '4:3': 4 / 3,
  '9:16': 9 / 16,
  '3:4': 3 / 4,
  'web-hero': 21 / 9,
};

async function checkDimensions(filePath) {
  try {
    const width = execSync(`sips -g pixelWidth "${filePath}" | grep pixelWidth | cut -d: -f2`).toString().trim();
    const height = execSync(`sips -g pixelHeight "${filePath}" | grep pixelHeight | cut -d: -f2`).toString().trim();
    return { width, height };
  } catch (e) {
    return { error: e.message };
  }
}

async function run() {
  console.log('--- Sequential Validation Against Built dist/ ---');
  console.log(`Model: ${model}`);
  for (const tc of testCases) {
    const aspectLabel = tc.aspectRatio || tc.aspectRatioPreset;
    const prompt = scenes[aspectLabel];
    console.log(`\n🚀 Generating [${aspectLabel}]...`);
    
    try {
      const result = await generator.generateTextToImage({
        prompt,
        ...tc,
        model,
        mode: 'generate',
        outputCount: 1,
        noPreview: true
      });

      if (result.success && result.generatedFiles?.length > 0) {
        const file = result.generatedFiles[0];
        console.log(`✅ SUCCESS: ${file}`);
        const dims = await checkDimensions(file);
        console.log(`📐 Dimensions: ${dims.width} x ${dims.height}`);

        const w = parseInt(dims.width);
        const h = parseInt(dims.height);
        const ratio = w / h;
        const expected = expectedRatios[aspectLabel];
        const matches = Math.abs(ratio - expected) < 0.03;
        console.log(`📈 Actual Ratio: ${ratio.toFixed(3)}`);
        console.log(`🎯 Expected Ratio: ${expected.toFixed(3)}`);
        console.log(`🧪 Match: ${matches ? 'YES' : 'NO'}`);
      } else {
        console.error(`❌ FAILED: ${result.error || result.message}`);
      }
    } catch (err) {
      console.error(`❌ ERROR:`, err.message);
    }
  }
}

run();
