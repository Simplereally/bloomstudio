// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { EventEmitter } from "events";

// Mocking dependencies
vi.mock("ffmpeg-static", () => ({
  default: "/path/to/ffmpeg",
}));

// Create a mock ffmpeg command
const mockFfmpegCommand: any = {
  inputOptions: vi.fn().mockReturnThis(),
  noAudio: vi.fn().mockReturnThis(),
  frames: vi.fn().mockReturnThis(),
  outputOptions: vi.fn().mockReturnThis(),
  format: vi.fn().mockReturnThis(),
  on: vi.fn().mockReturnThis(),
  kill: vi.fn(),
  pipe: vi.fn(),
};

const mockFfmpeg = vi.fn(() => mockFfmpegCommand) as any;
mockFfmpeg.setFfmpegPath = vi.fn();

vi.mock("fluent-ffmpeg", () => ({
  default: mockFfmpeg,
}));

vi.mock("fs/promises", () => ({
  __esModule: true,
  writeFile: vi.fn().mockResolvedValue(undefined),
  unlink: vi.fn().mockResolvedValue(undefined),
  mkdir: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("os", () => ({
  __esModule: true,
  tmpdir: vi.fn().mockReturnValue("/tmp"),
}));

vi.mock("crypto", () => ({
  __esModule: true,
  randomUUID: vi.fn().mockReturnValue("mock-uuid"),
}));

import { extractVideoThumbnail } from "./videoThumbnail";

describe("extractVideoThumbnail", () => {
  let mockStream: EventEmitter;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset handlers
    mockFfmpegCommand.on.mockImplementation((event: string, callback: Function) => {
      mockFfmpegCommand[event + "Handler"] = callback;
      return mockFfmpegCommand;
    });

    mockStream = new EventEmitter();
    mockFfmpegCommand.pipe.mockReturnValue(mockStream);
  });

  it("should successfully extract a thumbnail", async () => {
    const videoBuffer = Buffer.from("mock-video-data");
    const thumbnailData = Buffer.from("mock-thumbnail-data");

    const extractionPromise = extractVideoThumbnail(videoBuffer);

    // Give it a tick to register handlers
    await new Promise(resolve => setTimeout(resolve, 50));

    // Simulate data chunk
    mockStream.emit("data", thumbnailData);
    
    // Simulate end
    if (mockFfmpegCommand.endHandler) {
      mockFfmpegCommand.endHandler();
    }

    const result = await extractionPromise;

    expect(result).toEqual(thumbnailData);
    expect(mockFfmpeg).toHaveBeenCalledWith(expect.stringContaining("input-mock-uuid.mp4"));
    expect(mockFfmpegCommand.noAudio).toHaveBeenCalled();
    expect(mockFfmpegCommand.frames).toHaveBeenCalledWith(1);
    expect(mockFfmpegCommand.format).toHaveBeenCalledWith("mjpeg");
  });

  it("should return null if ffmpeg fails", async () => {
    const videoBuffer = Buffer.from("mock-video-data");

    const extractionPromise = extractVideoThumbnail(videoBuffer);

    await new Promise(resolve => setTimeout(resolve, 50));

    // Simulate error
    if (mockFfmpegCommand.errorHandler) {
      mockFfmpegCommand.errorHandler(new Error("FFmpeg error"));
    }

    const result = await extractionPromise;

    expect(result).toBeNull();
  });

  it("should handle multi-chunk output", async () => {
    const videoBuffer = Buffer.from("mock-video-data");
    const part1 = Buffer.from("part1");
    const part2 = Buffer.from("part2");

    const extractionPromise = extractVideoThumbnail(videoBuffer);

    await new Promise(resolve => setTimeout(resolve, 50));

    // Simulate data chunks
    mockStream.emit("data", part1);
    mockStream.emit("data", part2);
    
    // Simulate end
    if (mockFfmpegCommand.endHandler) {
      mockFfmpegCommand.endHandler();
    }

    const result = await extractionPromise;

    expect(result).toEqual(Buffer.concat([part1, part2]));
  });
});
