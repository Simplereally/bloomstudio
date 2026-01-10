import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const SOLUTIONS_DIR = path.join(process.cwd(), 'public', 'solutions');

const toKebabCase = (str) => {
    return str
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');
};

async function processImages() {
    if (!fs.existsSync(SOLUTIONS_DIR)) {
        console.error(`Directory not found: ${SOLUTIONS_DIR}`);
        return;
    }

    const dirs = fs.readdirSync(SOLUTIONS_DIR);

    for (const dirName of dirs) {
        const dirPath = path.join(SOLUTIONS_DIR, dirName);
        if (!fs.statSync(dirPath).isDirectory()) continue;

        const newDirName = toKebabCase(dirName);
        const newDirPath = path.join(SOLUTIONS_DIR, newDirName);

        // Rename directory if needed
        if (dirName !== newDirName) {
            console.log(`Renaming folder: ${dirName} -> ${newDirName}`);
            fs.renameSync(dirPath, newDirPath);
        }

        const files = fs.readdirSync(newDirPath);

        for (const fileName of files) {
            const filePath = path.join(newDirPath, fileName);
            if (fs.statSync(filePath).isDirectory()) continue;

            // separate extension and name
            const ext = path.extname(fileName).toLowerCase();
            const nameWithoutExt = path.basename(fileName, ext);
            
            // Rename file to kebab-case
            let newNameWithoutExt = toKebabCase(nameWithoutExt);
            // fix common pattern "hero1" -> "hero-1"
            newNameWithoutExt = newNameWithoutExt.replace(/([a-z])(\d+)/, '$1-$2');

            // Determine output format
            const isTransparent = newDirName.includes('transparent');
            const isVideo = ['.mp4', '.webm'].includes(ext);

            if (isVideo) {
                 // Just rename videos
                const newFileName = `${newNameWithoutExt}${ext}`;
                if (fileName !== newFileName) {
                     console.log(`Renaming video: ${fileName} -> ${newFileName}`);
                     fs.renameSync(filePath, path.join(newDirPath, newFileName));
                }
                continue;
            }
            
            // Image processing
            if (!['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) continue;

            const tempFilePath = path.join(newDirPath, `temp-${Date.now()}-${fileName}`);
            
            try {
                let pipeline = sharp(filePath);
                const metadata = await pipeline.metadata();

                // Resize if too large (e.g. > 2500px width)
                if (metadata.width > 2500) {
                    pipeline = pipeline.resize({ width: 2500 });
                }

                let newExt = ext;
                
                if (isTransparent) {
                     // Keep PNG, optimize
                     if (ext !== '.png') {
                        // If it's not png but in transparent folder, maybe convert to png? 
                        // But user said "compressed JPEG" generally.
                        // If it's transparent generator, we likely want PNG.
                        pipeline = pipeline.png({ compressionLevel: 9, palette: true });
                        newExt = '.png';
                     } else {
                        pipeline = pipeline.png({ compressionLevel: 9, palette: true });
                     }
                } else {
                    // Convert to JPEG
                    pipeline = pipeline.jpeg({ quality: 80, mozjpeg: true });
                    newExt = '.jpg';
                }

                await pipeline.toFile(tempFilePath);

                // Replace original (or delete original and rename temp)
                // If we changed extension, delete old file
                // If simple rename, unlink old
                
                const finalFileName = `${newNameWithoutExt}${newExt}`;
                const finalFilePath = path.join(newDirPath, finalFileName);

                // Remove original if different path or just to be safe before renaming temp
                fs.unlinkSync(filePath); 
                fs.renameSync(tempFilePath, finalFilePath);

                console.log(`Optimized: ${fileName} -> ${finalFileName}`);

            } catch (err) {
                console.error(`Error processing ${filePath}:`, err);
                if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
            }
        }
    }
}

processImages().catch(console.error);
