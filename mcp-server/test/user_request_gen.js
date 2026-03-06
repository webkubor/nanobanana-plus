import { ImageGenerator } from '../dist/imageGenerator.js';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
    const generator = new ImageGenerator();

    const prompts = [
        {
            name: "han_dynasty_wall",
            prompt: "A hyper-realistic cinematic 21:9 wide-angle shot from the top of an ancient, weathered Han Dynasty city wall. Rain-slicked dark stone battlements overlooking a bleak, empty battlefield. Heavy, storm clouds gathering in the sky. Deep, moody shadows and cold slate tones. 35mm film aesthetic, grainy texture, high dynamic range, epic and heavy Wuxia atmosphere. No characters, no CGI look, no text.",
            aspectRatio: "21:9",
            model: "imagen-4.0-ultra-generate-001"
        },
        {
            name: "desolate_riverbank",
            prompt: "A hyper-realistic cinematic 21:9 wide-angle shot of a desolate ancient riverbank at deep dusk. A lone, rotting wooden ferry boat moored to a dead, twisted tree. Dark, slow-moving river river water reflecting a bleak, overcast sky. Cold mist rolling off the water surface. Deep blue and slate gray tones. 35mm film aesthetic, grainy texture, high dynamic range, melancholic Wuxia atmosphere. No characters, no CGI look, no text.",
            aspectRatio: "21:9",
            model: "imagen-4.0-ultra-generate-001"
        }
    ];

    for (const p of prompts) {
        console.log(`Generating: ${p.name}...`);
        try {
            const result = await generator.generateImage({
                prompt: p.prompt,
                aspectRatio: p.aspectRatio,
                model: p.model
            });
            console.log(`Successfully generated ${p.name}:`, JSON.stringify(result, null, 2));
        } catch (error) {
            console.error(`Failed to generate ${p.name}:`, error.message);
        }
    }
}

main();
