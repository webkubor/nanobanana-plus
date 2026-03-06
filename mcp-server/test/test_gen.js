
import { ImageGenerator } from '../dist/imageGenerator.js';

const authConfig = {
  apiKey: process.env.NANOBANANA_GEMINI_API_KEY || 'YOUR_API_KEY',
  keyType: 'GOOGLE_API_KEY',
  source: 'GOOGLE_API_KEY'
};

const generator = new ImageGenerator(authConfig);
const requests = [
  {
    prompt: "A hyper-realistic cinematic 21:9 wide-angle shot from the top of an ancient, weathered Han Dynasty city wall. Rain-slicked dark stone battlements overlooking a bleak, empty battlefield. Heavy, storm clouds gathering in the sky. Deep, moody shadows and cold slate tones. 35mm film aesthetic, grainy texture, high dynamic range, epic and heavy Wuxia atmosphere. No characters, no CGI look, no text.",
    aspectRatio: "21:9",
    model: "imagen-4.0-ultra-generate-001"
  },
  {
    prompt: "A hyper-realistic cinematic 21:9 wide-angle shot of a desolate ancient riverbank at deep dusk. A lone, rotting wooden ferry boat moored to a dead, twisted tree. Dark, slow-moving river river water reflecting a bleak, overcast sky. Cold mist rolling off the water surface. Deep blue and slate gray tones. 35mm film aesthetic, grainy texture, high dynamic range, melancholic Wuxia atmosphere. No characters, no CGI look, no text.",
    aspectRatio: "21:9",
    model: "imagen-4.0-ultra-generate-001"
  }
];

async function run() {
  console.log('--- Generating User Requested Wuxia Scenes ---');
  for (const req of requests) {
    console.log(`🚀 Generating [${req.aspectRatio}] with Imagen 4 Ultra...`);
    try {
      const result = await generator.generateImage(req);
      console.log(`✅ SUCCESS:`, JSON.stringify(result, null, 2));
    } catch (err) {
      console.error(`❌ FAILED:`, err.message);
    }
  }
}

run();
