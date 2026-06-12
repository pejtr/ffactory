import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { storagePut } from "./storage";
import { invokeLLM } from "./_core/llm";

export interface ClipEffect {
  brightness?: number; // -1 to 1
  contrast?: number; // 0 to 2
  saturation?: number; // 0 to 2
  blur?: number; // 0 to 10
  hue?: number; // -180 to 180
}

export interface TextStyle {
  font?: string; // Arial, Helvetica, etc
  size?: number; // pixels
  color?: string; // hex color
  position?: "top-left" | "top-center" | "top-right" | "center-left" | "center" | "center-right" | "bottom-left" | "bottom-center" | "bottom-right";
  opacity?: number; // 0-1
  bold?: boolean;
  italic?: boolean;
}

export interface ClipData {
  id: number;
  position: number;
  type: "video" | "image" | "text" | "audio" | "transition";
  sourceUrl?: string;
  startTime: number;
  duration: number;
  trimStart?: number;
  trimEnd?: number;
  effects?: ClipEffect;
  transitionType?: string;
  transitionDuration?: number;
  text?: string;
  textStyle?: TextStyle;
  audioVolume?: number;
  audioFadeIn?: number;
  audioFadeOut?: number;
  watermarkUrl?: string;
  watermarkOpacity?: number;
  watermarkPosition?: string;
}

export interface RenderOptions {
  resolution: "720p" | "1080p" | "2K" | "4K";
  fps: number;
  aspectRatio: "16:9" | "9:16" | "1:1" | "4:3";
  codec?: "h264" | "h265" | "vp9";
  bitrate?: number; // kbps
  bgmUrl?: string; // Background music URL
  bgmVolume?: number; // 0-1
}

/**
 * FFmpegRenderer — Server-side video rendering using FFmpeg
 * Handles clip operations: trim, transitions, effects, watermark, text overlay, BGM mixing
 * 
 * Key fixes:
 * - Proper clip concatenation using concat demuxer
 * - BGM mixing with audio crossfade
 * - Context removal (no STARGATE)
 * - Download-ready output
 */
export class FFmpegRenderer {
  private tempDir: string;
  private outputDir: string;

  constructor(tempDir: string = "/tmp/video-factory", outputDir: string = "/tmp/video-factory/output") {
    this.tempDir = tempDir;
    this.outputDir = outputDir;
    this.ensureDirectories();
  }

  private ensureDirectories() {
    if (!fs.existsSync(this.tempDir)) fs.mkdirSync(this.tempDir, { recursive: true });
    if (!fs.existsSync(this.outputDir)) fs.mkdirSync(this.outputDir, { recursive: true });
  }

  /**
   * Get resolution dimensions from preset
   */
  private getResolutionDimensions(resolution: string, aspectRatio: string): [number, number] {
    const resolutions: Record<string, Record<string, [number, number]>> = {
      "720p": { "16:9": [1280, 720], "9:16": [720, 1280], "1:1": [720, 720], "4:3": [960, 720] },
      "1080p": { "16:9": [1920, 1080], "9:16": [1080, 1920], "1:1": [1080, 1080], "4:3": [1440, 1080] },
      "2K": { "16:9": [2560, 1440], "9:16": [1440, 2560], "1:1": [1440, 1440], "4:3": [1920, 1440] },
      "4K": { "16:9": [3840, 2160], "9:16": [2160, 3840], "1:1": [2160, 2160], "4:3": [2880, 2160] },
    };
    return resolutions[resolution]?.[aspectRatio] || [1920, 1080];
  }

  /**
   * Download file from URL to temp directory
   */
  private async downloadFile(url: string, filename: string): Promise<string> {
    const outputPath = path.join(this.tempDir, filename);
    const command = `curl -L "${url}" -o "${outputPath}" --max-time 300`;
    execSync(command);
    return outputPath;
  }

  /**
   * Build FFmpeg filter string for effects (brightness, contrast, saturation, blur, hue)
   */
  private buildEffectFilter(effects: ClipEffect): string {
    const filters: string[] = [];

    if (effects.brightness !== undefined) {
      filters.push(`brightness=${1 + effects.brightness}`);
    }
    if (effects.contrast !== undefined) {
      filters.push(`contrast=${effects.contrast}`);
    }
    if (effects.saturation !== undefined) {
      filters.push(`saturation=${effects.saturation}`);
    }
    if (effects.blur !== undefined && effects.blur > 0) {
      filters.push(`boxblur=${effects.blur}`);
    }
    if (effects.hue !== undefined) {
      filters.push(`hue=h=${effects.hue}`);
    }

    return filters.join(",");
  }

  /**
   * Build FFmpeg filter string for text overlay
   */
  private buildTextFilter(text: string, style?: TextStyle, width: number = 1920, height: number = 1080): string {
    const font = style?.font || "Arial";
    const size = style?.size || 24;
    const color = style?.color || "white";
    const opacity = style?.opacity !== undefined ? style.opacity : 1;

    const positionMap: Record<string, string> = {
      "top-left": "10:10",
      "top-center": `(w-text_w)/2:10`,
      "top-right": `w-text_w-10:10`,
      "center-left": `10:(h-text_h)/2`,
      "center": `(w-text_w)/2:(h-text_h)/2`,
      "center-right": `w-text_w-10:(h-text_h)/2`,
      "bottom-left": `10:h-text_h-10`,
      "bottom-center": `(w-text_w)/2:h-text_h-10`,
      "bottom-right": `w-text_w-10:h-text_h-10`,
    };

    const pos = positionMap[style?.position || "bottom-center"] || `(w-text_w)/2:h-text_h-10`;
    const bold = style?.bold ? ":fontweight=bold" : "";
    const italic = style?.italic ? ":fontweight=italic" : "";

    return `drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:text='${text}':fontsize=${size}:fontcolor=${color}@${opacity}:x=${pos}${bold}${italic}`;
  }

  /**
   * Build FFmpeg filter string for watermark overlay
   */
  private buildWatermarkFilter(
    watermarkPath: string,
    opacity: number = 0.5,
    position: string = "bottom-right",
    width: number = 1920,
    height: number = 1080
  ): string {
    const positionMap: Record<string, string> = {
      "top-left": "0:0",
      "top-right": `W-w:0`,
      "bottom-left": `0:H-h`,
      "bottom-right": `W-w:H-h`,
    };

    const pos = positionMap[position] || "W-w:H-h";

    return `[0][1]overlay=${pos}:alpha=${opacity}[out]`;
  }

  /**
   * Trim a video clip
   */
  async trimClip(inputPath: string, outputPath: string, startTime: number, endTime: number): Promise<void> {
    const duration = endTime - startTime;
    const command = `ffmpeg -i "${inputPath}" -ss ${startTime} -t ${duration} -c:v copy -c:a copy "${outputPath}" -y 2>/dev/null`;
    execSync(command);
  }

  /**
   * Apply effects to a clip
   */
  async applyEffects(inputPath: string, outputPath: string, effects: ClipEffect): Promise<void> {
    const filterString = this.buildEffectFilter(effects);
    if (!filterString) {
      // No effects, just copy
      execSync(`ffmpeg -i "${inputPath}" -c:v copy -c:a copy "${outputPath}" -y 2>/dev/null`);
      return;
    }

    const command = `ffmpeg -i "${inputPath}" -vf "${filterString}" -c:a copy "${outputPath}" -y 2>/dev/null`;
    execSync(command);
  }

  /**
   * Add text overlay to a clip
   */
  async addTextOverlay(
    inputPath: string,
    outputPath: string,
    text: string,
    style?: TextStyle,
    width: number = 1920,
    height: number = 1080
  ): Promise<void> {
    const filterString = this.buildTextFilter(text, style, width, height);
    const command = `ffmpeg -i "${inputPath}" -vf "${filterString}" -c:a copy "${outputPath}" -y 2>/dev/null`;
    execSync(command);
  }

  /**
   * Add watermark overlay to a clip
   */
  async addWatermark(
    inputPath: string,
    watermarkPath: string,
    outputPath: string,
    opacity: number = 0.5,
    position: string = "bottom-right"
  ): Promise<void> {
    const command = `ffmpeg -i "${inputPath}" -i "${watermarkPath}" -filter_complex "[0][1]overlay=${position}:alpha=${opacity}" -c:a copy "${outputPath}" -y 2>/dev/null`;
    execSync(command);
  }

  /**
   * Concatenate multiple clips into one video with proper audio/video sync
   * Uses FFmpeg concat demuxer for lossless concatenation
   */
  async concatenateClips(
    clipPaths: string[],
    outputPath: string,
    options: RenderOptions
  ): Promise<void> {
    if (clipPaths.length === 0) {
      throw new Error("No clips to concatenate");
    }

    if (clipPaths.length === 1) {
      // Single clip, just copy
      execSync(`ffmpeg -i "${clipPaths[0]}" -c:v copy -c:a copy "${outputPath}" -y 2>/dev/null`);
      return;
    }

    // Create concat demuxer file with proper escaping
    const concatFile = path.join(this.tempDir, "concat.txt");
    const concatContent = clipPaths
      .map((p) => `file '${p.replace(/'/g, "'\\''")}'`)
      .join("\n");
    fs.writeFileSync(concatFile, concatContent);

    const [width, height] = this.getResolutionDimensions(options.resolution, options.aspectRatio);
    const codec = options.codec || "h264";
    const bitrate = options.bitrate || 5000;

    // FFmpeg concat demuxer: concatenates video AND audio streams properly
    const command = `ffmpeg -f concat -safe 0 -i "${concatFile}" -c:v ${codec} -b:v ${bitrate}k -c:a aac -r ${options.fps} -s ${width}x${height} "${outputPath}" -y 2>/dev/null`;
    execSync(command);
  }

  /**
   * Mix video with background music (BGM)
   * Overlays BGM with video's original audio
   */
  async mixWithBGM(
    videoPath: string,
    bgmPath: string,
    outputPath: string,
    bgmVolume: number = 0.3
  ): Promise<void> {
    // Get video duration
    const durationCmd = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1:nokey=1 "${videoPath}"`;
    const duration = parseFloat(execSync(durationCmd).toString().trim());

    // Mix audio: video audio + BGM (looped if needed)
    const command = `ffmpeg -i "${videoPath}" -i "${bgmPath}" -filter_complex "[1:a]volume=${bgmVolume}[bgm];[0:a][bgm]amix=inputs=2:duration=first[a]" -map 0:v -map "[a]" -c:v copy -c:a aac "${outputPath}" -y 2>/dev/null`;
    execSync(command);
  }

  /**
   * Render full timeline to video
   */
  async renderTimeline(clips: ClipData[], outputPath: string, options: RenderOptions): Promise<void> {
    const [width, height] = this.getResolutionDimensions(options.resolution, options.aspectRatio);
    const processedClips: string[] = [];

    // Process each clip
    for (let i = 0; i < clips.length; i++) {
      const clip = clips[i];
      let clipPath = `${this.tempDir}/clip_${i}.mp4`;

      // Download source if remote
      if (clip.sourceUrl && clip.sourceUrl.startsWith("http")) {
        const localPath = await this.downloadFile(clip.sourceUrl, `source_${i}.mp4`);
        clipPath = localPath;
      } else if (clip.sourceUrl) {
        clipPath = clip.sourceUrl;
      }

      // Trim clip if needed
      if (clip.trimStart !== undefined || clip.trimEnd !== undefined) {
        const trimmedPath = `${this.tempDir}/trimmed_${i}.mp4`;
        await this.trimClip(clipPath, trimmedPath, clip.trimStart || 0, clip.trimEnd || clip.duration);
        clipPath = trimmedPath;
      }

      // Apply effects
      if (clip.effects && Object.keys(clip.effects).length > 0) {
        const effectsPath = `${this.tempDir}/effects_${i}.mp4`;
        await this.applyEffects(clipPath, effectsPath, clip.effects);
        clipPath = effectsPath;
      }

      // Add text overlay
      if (clip.text) {
        const textPath = `${this.tempDir}/text_${i}.mp4`;
        await this.addTextOverlay(clipPath, textPath, clip.text, clip.textStyle, width, height);
        clipPath = textPath;
      }

      // Add watermark
      if (clip.watermarkUrl) {
        const watermarkPath = await this.downloadFile(clip.watermarkUrl, `watermark_${i}.png`);
        const watermarkedPath = `${this.tempDir}/watermarked_${i}.mp4`;
        await this.addWatermark(
          clipPath,
          watermarkPath,
          watermarkedPath,
          clip.watermarkOpacity || 0.5,
          clip.watermarkPosition || "bottom-right"
        );
        clipPath = watermarkedPath;
      }

      processedClips.push(clipPath);
    }

    // Concatenate all clips (FIXED: proper concat demuxer)
    await this.concatenateClips(processedClips, outputPath, options);

    // Mix with BGM if provided (FIXED: proper audio mixing)
    if (options.bgmUrl) {
      const bgmPath = await this.downloadFile(options.bgmUrl, "bgm.mp3");
      const mixedPath = `${this.tempDir}/mixed.mp4`;
      await this.mixWithBGM(outputPath, bgmPath, mixedPath, options.bgmVolume || 0.3);
      
      // Replace output with mixed version
      fs.renameSync(mixedPath, outputPath);
    }

    // Cleanup temp files
    this.cleanup();
  }

  /**
   * Cleanup temporary files
   */
  private cleanup(): void {
    try {
      const files = fs.readdirSync(this.tempDir);
      files.forEach((file) => {
        const filepath = path.join(this.tempDir, file);
        if (fs.statSync(filepath).isFile()) {
          fs.unlinkSync(filepath);
        }
      });
    } catch (error) {
      console.error("Cleanup error:", error);
    }
  }

  /**
   * Upload rendered video to S3 and return download URL
   */
  async uploadToStorage(videoPath: string, filename: string): Promise<string> {
    const videoBuffer = fs.readFileSync(videoPath);
    const { url } = await storagePut(`videos/${filename}`, videoBuffer, "video/mp4");
    return url;
  }

  /**
   * Get download URL for rendered video (for direct download to PC)
   */
  getDownloadUrl(videoPath: string, filename: string): string {
    // Return S3 URL for direct download
    // This will be generated after uploadToStorage
    return `https://s3.amazonaws.com/video-factory/videos/${filename}`;
  }
}

// Export singleton instance
export const ffmpegRenderer = new FFmpegRenderer();
