/*
  Standardize Zelle asset filenames and convert to JPG.

  - Reads files from `zelle-orig/`
  - Extracts a reasonable booster/club name from the filename
  - Slugifies to lowercase kebab-case
  - Converts non-JPG images (e.g., PNG) to high-quality JPG (quality 90, 4:4:4)
  - Preserves transparency by flattening to white background
  - Skips unsupported types (e.g., PDF, DOCX) with a warning
  - Writes results to `zelle-standardized/` (keeps originals intact)
*/

const fs = require('fs/promises');
const path = require('path');
const sharp = require('sharp');

const ROOT_DIR = process.cwd();
const INPUT_DIR = path.join(ROOT_DIR, 'zelle-orig');
const OUTPUT_DIR = path.join(ROOT_DIR, 'zelle-standardized');

const SUPPORTED_IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg']);
const CONVERT_TO_EXTENSION = '.jpg';

function normalizeWhitespace(value) {
  return value
    .replace(/[\u00A0\u2000-\u200B\u202F\u205F\u3000]/g, ' ') // uncommon spaces
    .replace(/[_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractNameParts(basename) {
  // Remove obvious suffix terms unrelated to the club name
  // Examples of tokens to drop: zelle, qr, code, codes, booster, boosters, my
  // Keep meaningful org tokens like EWA/EHS by default
  const stopwords = new Set([
    'zelle', 'qr', 'code', 'codes', 'booster', 'boosters', 'my'
  ]);

  const cleaned = normalizeWhitespace(
    basename
      .replace(/®/g, '')
      .replace(/[\(\)\[\]\{\}]/g, ' ')
      .replace(/[-]+/g, ' ')
  );

  const tokens = cleaned
    .split(' ')
    .map(t => t.trim())
    .filter(Boolean);

  const filtered = tokens.filter(t => !stopwords.has(t.toLowerCase()));
  // Avoid empty result; if everything was filtered, fall back to original tokens
  return filtered.length > 0 ? filtered : tokens;
}

function slugifyName(parts) {
  const raw = parts.join(' ');
  const slug = raw
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // diacritics
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return slug || 'unnamed';
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function listFilesRecursive(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(entries.map(async entry => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return listFilesRecursive(fullPath);
    }
    return [fullPath];
  }));
  return files.flat();
}

async function getUniqueOutputPath(baseSlug) {
  let candidate = path.join(OUTPUT_DIR, `${baseSlug}${CONVERT_TO_EXTENSION}`);
  let counter = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      await fs.access(candidate);
      // exists -> increment
      candidate = path.join(OUTPUT_DIR, `${baseSlug}-${counter}${CONVERT_TO_EXTENSION}`);
      counter += 1;
    } catch (e) {
      // does not exist
      return candidate;
    }
  }
}

async function processImage(inputPath, outputPath, isPng) {
  const image = sharp(inputPath, { failOn: 'none' });

  const pipeline = isPng
    ? image.flatten({ background: '#ffffff' }) // handle transparency from PNG
    : image;

  await pipeline
    .jpeg({ quality: 90, mozjpeg: true, chromaSubsampling: '4:4:4', progressive: true })
    .toFile(outputPath);
}

async function copyJpg(inputPath, outputPath) {
  // Copy while normalizing extension and name
  await fs.copyFile(inputPath, outputPath);
}

async function run() {
  try {
    await ensureDir(OUTPUT_DIR);

    const exists = await fs.access(INPUT_DIR).then(() => true).catch(() => false);
    if (!exists) {
      console.error(`Input directory not found: ${INPUT_DIR}`);
      process.exit(1);
    }

    const allFiles = await listFilesRecursive(INPUT_DIR);
    const tasks = [];
    let converted = 0;
    let copied = 0;
    let skipped = 0;

    for (const fullPath of allFiles) {
      const ext = path.extname(fullPath).toLowerCase();
      const name = path.basename(fullPath, ext);

      const nameParts = extractNameParts(name);
      const slug = slugifyName(nameParts);
      const destPath = await getUniqueOutputPath(slug);

      if (!SUPPORTED_IMAGE_EXTENSIONS.has(ext)) {
        console.warn(`Skipping unsupported type: ${path.basename(fullPath)} (${ext})`);
        skipped += 1;
        continue;
      }

      if (ext === '.jpg' || ext === '.jpeg') {
        tasks.push(
          copyJpg(fullPath, destPath).then(() => { copied += 1; })
        );
      } else if (ext === '.png') {
        tasks.push(
          processImage(fullPath, destPath, true).then(() => { converted += 1; })
        );
      }
    }

    await Promise.all(tasks);

    console.log('\nDone.');
    console.log(`Copied JPGs: ${copied}`);
    console.log(`Converted to JPG: ${converted}`);
    console.log(`Skipped (unsupported): ${skipped}`);
    console.log(`Output folder: ${OUTPUT_DIR}`);
  } catch (err) {
    console.error('Error while standardizing Zelle assets:', err);
    process.exit(1);
  }
}

run();


