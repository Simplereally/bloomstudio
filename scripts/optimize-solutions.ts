import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const SOLUTIONS_DIR = path.join(process.cwd(), 'public', 'solutions');

const toKebabCase = (str: String) => {
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

        if (dirName !== newDirName) {
            console.log(`Renaming folder: ${dirName} -> ${newDirName}`);
            if (fs.existsSync(newDirPath)) {
                // Merge if target exists? Or just delete? Better move files and delete old.
                const files = fs.readdirSync(dirPath);
                for (const file of files) {
                    fs.renameSync(path.join(dirPath, file), path.join(newDirPath, file));
                }
                fs.rmdirSync(dirPath);
            } else {
                fs.renameSync(dirPath, newDirPath);
            }
        }

        const files = fs.readdirSync(newDirPath);

        for (const fileName of files) {
            const filePath = path.join(newDirPath, fileName);
            if (fs.statSync(filePath).isDirectory()) continue;
            if (fileName.includes('-backup')) {
                 fs.unlinkSync(filePath);
                 continue;
            }

            const ext = path.extname(fileName).toLowerCase();
            const nameWithoutExt = path.basename(fileName, ext);
            
            let newNameWithoutExt = toKebabCase(nameWithoutExt);
            newNameWithoutExt = newNameWithoutExt.replace(/([a-z])(\d+)/, '$1-$2');

            const isVideo = ['.mp4', '.webm'].includes(ext);

            if (isVideo) {
                const newFileName = `${newNameWithoutExt}${ext}`;
                if (fileName !== newFileName) {
                     console.log(`Renaming video: ${fileName} -> ${newFileName}`);
                     fs.renameSync(filePath, path.join(newDirPath, newFileName));
                }
                continue;
            }
            
            if (!['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) continue;

            const tempFilePath = path.join(newDirPath, `temp-${Date.now()}-${fileName}`);
            
            try {
                let pipeline = sharp(filePath);
                const metadata = await pipeline.metadata();

                if (metadata.width > 2500) {
                    pipeline = pipeline.resize({ width: 2500 });
                }

                let newExt = ext;
                const isTransparent = newDirName.includes('transparent') || ext === '.png';
                
                if (isTransparent) {
                    pipeline = pipeline.png({ compressionLevel: 9, palette: true });
                    newExt = '.png';
                } else {
                    pipeline = pipeline.jpeg({ quality: 80, mozjpeg: true });
                    newExt = '.jpg';
                }

                await pipeline.toFile(tempFilePath);

                const finalFileName = `${newNameWithoutExt}${newExt}`;
                const finalFilePath = path.join(newDirPath, finalFileName);

                if (fs.existsSync(finalFilePath) && finalFilePath !== filePath && finalFilePath !== tempFilePath) {
                    fs.unlinkSync(finalFilePath);
                }

                if (fs.existsSync(filePath)) fs.unlinkSync(filePath); 
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
