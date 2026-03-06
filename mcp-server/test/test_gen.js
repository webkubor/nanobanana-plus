
import { ImageGenerator } from './dist/imageGenerator.js';

const authConfig = {
  apiKey: process.env.NANOBANANA_GEMINI_API_KEY || 'YOUR_API_KEY',
  keyType: 'GOOGLE_API_KEY',
  source: 'GOOGLE_API_KEY'
};

const generator = new ImageGenerator(authConfig);
// 强化中式审美 Prompt
const prompt = `A breathtaking cinematic close-up poster of a Chinese Wuxia swordsman in flowing traditional Hanfu, misty bamboo forest background, traditional Chinese aesthetic. Soft ink-wash tones combined with high-contrast cinematic lantern lighting. Authentic Han-style facial features, long flowing hair in the wind, pure Chinese martial arts soul. No samurai elements, no Western industrial style, elegant and poetic atmosphere. 8k resolution, film grain texture.`;

const requests = [
  { aspectRatio: '16:9' },
  { aspectRatio: '1:1' },
  { aspectRatio: '4:3' },
  { aspectRatio: '9:16' },
  { aspectRatio: '3:4' },
  { aspectRatioPreset: 'web-hero' } // 21:9
];

async function run() {
  console.log('--- Phase 4: Chinese Aesthetic & Full Ratio Validation ---');
  for (const req of requests) {
    const aspect = req.aspectRatio || req.aspectRatioPreset;
    console.log(`🚀 Generating [${aspect}] with Chinese Wuxia soul...`);
    try {
      const result = await generator.generateTextToImage({
        prompt,
        ...req,
        model: 'gemini-3.1-flash-image-preview',
        customFileName: 'Chinese_Wuxia_Master',
        mode: 'generate',
        outputCount: 1,
        noPreview: true
      });
      console.log(`✅ SUCCESS [${aspect}]: ${result.generatedFiles?.[0]}`);
    } catch (err) {
      console.error(`❌ FAILED [${aspect}]:`, err.message);
    }
  }
}

run();
