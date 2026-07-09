import sharp from "sharp";
import { mkdirSync } from "fs";
import path from "path";

const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="96" fill="#ea580c"/>
  <g fill="none" stroke="#fff7ed" stroke-width="22" stroke-linecap="round">
    <line x1="160" y1="150" x2="150" y2="230"/>
    <line x1="220" y1="130" x2="215" y2="230"/>
    <line x1="280" y1="150" x2="290" y2="230"/>
  </g>
  <path d="M120 250 h272 a16 16 0 0 1 16 16 v10 a148 148 0 0 1 -148 148 h-8 a148 148 0 0 1 -148 -148 v-10 a16 16 0 0 1 16 -16 z" fill="#fff7ed"/>
  <path d="M108 268 h-24 a34 34 0 0 0 0 68 h20" fill="none" stroke="#fff7ed" stroke-width="20" stroke-linecap="round"/>
  <path d="M404 268 h24 a34 34 0 0 1 0 68 h-20" fill="none" stroke="#fff7ed" stroke-width="20" stroke-linecap="round"/>
</svg>
`;

const outDir = path.resolve("public", "icons");
mkdirSync(outDir, { recursive: true });

const sizes = [
  { name: "icon-192.png", size: 192 },
  { name: "icon-512.png", size: 512 },
  { name: "apple-touch-icon.png", size: 180 },
];

for (const { name, size } of sizes) {
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(path.join(outDir, name));
  console.log("generated", name);
}
