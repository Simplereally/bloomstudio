# Video Processing Plan

This plan outlines the steps to backup, compress, and crop the MP4 files in the `public/solutions/ai-video-generator` directory.

## 1. File Inventory

The following files will be processed:

- **Showcase/Feature (1280x720):**
  - `feature-1.mp4`, `feature-2.mp4`, `feature-3.mp4`
  - `showcase-1.mp4`, `showcase-2.mp4`, `showcase-3.mp4`, `showcase-4.mp4`, `showcase-5.mp4`
- **Hero (720x1280):**
  - `hero-1.mp4`, `hero-2.mp4`, `hero-3.mp4`, `hero-4.mp4`

## 2. Backup Process

For each `showcase` and `feature` file, a backup will be created with the `-backup` suffix.

**Example Command:**

```bash
cp public/solutions/ai-video-generator/showcase-1.mp4 public/solutions/ai-video-generator/showcase-1-backup.mp4
```

## 3. Compression and Cropping

We will use FFmpeg with the following settings:

- **Codec:** `libx264` (H.264)
- **Quality (CRF):** `23` (Provides high quality with significant size reduction)
- **Preset:** `slow` (Better compression efficiency)

### Showcase and Feature MP4s

- **Target Resolution:** 1280x674
- **Crop Strategy:** Remove 46 pixels from the bottom (`crop=1280:674:0:0`)

**Command Template:**

```bash
ffmpeg -i input.mp4 -vf "crop=1280:674:0:0" -vcodec libx264 -crf 23 -preset slow output_temp.mp4
mv output_temp.mp4 input.mp4
```

### Hero MP4s

- **Target Resolution:** 720x1233
- **Crop Strategy:** Remove 47 pixels from the bottom (`crop=720:1233:0:0`)

**Command Template:**

```bash
ffmpeg -i input.mp4 -vf "crop=720:1233:0:0" -vcodec libx264 -crf 23 -preset slow output_temp.mp4
mv output_temp.mp4 input.mp4
```

## 4. Audio Stripping

To further reduce file size, audio streams will be removed from all production (non-backup) MP4 files.

**Command Template:**

```bash
ffmpeg -i input.mp4 -c copy -an output_temp.mp4
mv output_temp.mp4 input.mp4
```

## 5. Execution Steps

1. Create backups for all `showcase` and `feature` files.
2. Run the compression and cropping command for each file.
3. Strip audio from all non-backup files using the `-an` flag.
4. Replace the original files with the processed versions.
5. Verify the dimensions and file sizes of the processed videos.
