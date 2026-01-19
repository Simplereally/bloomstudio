// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock fs/promises only
vi.mock("fs/promises", () => {
    const mocks = {
        writeFile: vi.fn().mockResolvedValue(undefined),
        readFile: vi.fn(),
        unlink: vi.fn().mockResolvedValue(undefined),
        mkdir: vi.fn().mockResolvedValue(undefined),
    };
    return {
        ...mocks,
        default: mocks,
    };
});

// Mock ffmpeg-static
vi.mock("ffmpeg-static", () => ({
    default: "/path/to/ffmpeg",
}));

// Mock fluent-ffmpeg
const mockFfmpegInstance = {
    inputOptions: vi.fn().mockReturnThis(),
    videoCodec: vi.fn().mockReturnThis(),
    audioCodec: vi.fn().mockReturnThis(),
    outputOptions: vi.fn().mockReturnThis(),
    output: vi.fn().mockReturnThis(),
    on: vi.fn().mockImplementation(function (this: any, event: string, cb: any) {
        if (event === "end") {
            setTimeout(() => cb(), 10);
        }
        return this;
    }),
    run: vi.fn(),
    kill: vi.fn(),
};

vi.mock("fluent-ffmpeg", () => {
    const f = vi.fn(() => mockFfmpegInstance);
    (f as any).setFfmpegPath = vi.fn();
    return { default: f };
});


// Import code under test AFTER mocks
import { generateVideoPreview, generateMobileVideoPreview, shouldGeneratePreview } from "./videoPreview";
// Import mocked modules to assert on them (Vitest returns the mocked version)
import { writeFile, readFile, unlink, mkdir } from "fs/promises";

describe("videoPreview", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("shouldGeneratePreview", () => {
        it("should return true if video > 5MB", () => {
            expect(shouldGeneratePreview(6 * 1024 * 1024)).toBe(true);
        });

        it("should return false if video <= 5MB", () => {
            expect(shouldGeneratePreview(5 * 1024 * 1024)).toBe(false);
            expect(shouldGeneratePreview(1024)).toBe(false);
        });
    });

    describe("generateVideoPreview", () => {
        it("should generate a preview successfully", async () => {
            const inputBuffer = Buffer.from("mock-original-video");
            const outputBuffer = Buffer.from("mock-preview-video");

            (readFile as any).mockResolvedValue(outputBuffer);

            const result = await generateVideoPreview(inputBuffer);

            expect(result).not.toBeNull();
            if (result) {
                expect(result.buffer).toEqual(outputBuffer);
            }

            expect(mkdir).toHaveBeenCalled();
            expect(writeFile).toHaveBeenCalled();
            expect(mockFfmpegInstance.run).toHaveBeenCalled();
            expect(readFile).toHaveBeenCalled();
            expect(unlink).toHaveBeenCalled();
        });

        it("should return null on ffmpeg error", async () => {
            const inputBuffer = Buffer.from("mock-original-video");

            mockFfmpegInstance.on.mockImplementationOnce(function (this: any, event: string, cb: any) {
                if (event === "error") {
                    setTimeout(() => cb(new Error("ffmpeg conversion failed")), 10);
                }
                return this;
            });

            const result = await generateVideoPreview(inputBuffer);

            expect(result).toBeNull();
        });
    });

    describe("generateMobileVideoPreview", () => {
        it("should call generateVideoPreview with mobile config", async () => {
            const inputBuffer = Buffer.from("mock-original-video");
            const outputBuffer = Buffer.from("mock-preview-video");

            (readFile as any).mockResolvedValue(outputBuffer);

            const result = await generateMobileVideoPreview(inputBuffer);

            expect(result).not.toBeNull();
            expect(mockFfmpegInstance.outputOptions).toHaveBeenCalledWith(
                expect.arrayContaining([expect.stringContaining("800k")])
            );
        });
    });
});

