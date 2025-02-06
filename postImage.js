import fs from "fs";
import path from "path";
import { Resvg } from "@resvg/resvg-js";
import { AtpAgent } from "@atproto/api";
import * as dotenv from "dotenv";
dotenv.config();
// bsky.social
const agent = new AtpAgent({
  service: "https://bsky.social",
});

// Generate a random hex color
const randomHexColor = () => {
  return "#" + Math.floor(Math.random() * 16777215).toString(16);
};

// Create an SVG image with a random background color
function createImage(randomHexColor) {
  const svgContent = `
<svg width="1200" height="600" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="${randomHexColor}"/>
</svg>
`;

  // Define the output directory and file path
  const outputDir = path.join(process.cwd(), "cache");
  const timestamp = Date.now();
  const outputFile = path.join(outputDir, timestamp + ".png");

  // Ensure the output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  // Convert SVG to PNG
  const resvg = new Resvg(svgContent, {
    background: "rgba(0, 0, 0, 0)", // Transparent background
    fitTo: {
      mode: "width",
      value: 1200,
    },
  });

  const pngData = resvg.render();
  const pngBuffer = pngData.asPng();

  // Save the PNG image to the output file
  try {
    fs.writeFileSync(outputFile, pngBuffer);
    console.log("Image saved as image.png in the cache directory");
  } catch (error) {
    console.error("Failed to save image to file", error);
  }

  return pngBuffer;
}

async function postImage(color, pngBuffer) {
  await agent.login({
    identifier: process.env.BLUESKY_USERNAME,
    password: process.env.BLUESKY_PASSWORD,
  });

  const { data } = await agent.uploadBlob(pngBuffer, {
    encoding: "image/png",
  });

  await agent.post({
    text: "The color " + color,
    langs: ["en-US"],
    embed: {
      $type: "app.bsky.embed.images",
      images: [
        // can be an array up to 4 values
        {
          alt: "The color " + color, // the alt text
          image: data.blob,
          aspectRatio: {
            // a hint to clients
            width: 1200,
            height: 600,
          },
        },
      ],
    },
    createdAt: new Date().toISOString(),
  });
  console.log("Just posted!");
}

let color = randomHexColor();
let pngBuffer = createImage(color);

postImage(color, pngBuffer);
