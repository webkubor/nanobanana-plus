
import { ImageGenerator } from './dist/imageGenerator.js';

const authConfig = {
  apiKey: 'AIzaSyDI048-U_s4CnEbeDmq8xnT6T4Iha6y7mc',
  keyType: 'GOOGLE_API_KEY',
  source: 'GOOGLE_API_KEY'
};

const generator = new ImageGenerator(authConfig);
const prompt = `A hyper-realistic cinematic 21:9 anamorphic shot of a remote Wuxia wooden inn standing solitary in a vast, wind-swept desert. Several camels are tethered outside, their silhouettes stark against the shifting sands. Warm, low-hanging sun creating long shadows and highlighting the golden grit of the desert. Dust blowing in the wind. Authentic Han-style architecture, weathered wood textures. 35mm film aesthetic, grainy texture, high dynamic range, desaturated desert tones.`;

async function testSingle(aspect) {
  console.log(`--- Testing Packaged Code: Aspect Ratio ${aspect} ---`);
  try {
    const result = await generator.generateTextToImage({
      prompt,
      aspectRatio: aspect,
      mode: 'generate',
      outputCount: 1,
      noPreview: true
    });
    console.log(`[SUCCESS] File saved: ${result.generatedFiles?.[0]}`);
  } catch (err) {
    console.error(`[ERROR]:`, err.message);
  }
}

testSingle('1:1');
