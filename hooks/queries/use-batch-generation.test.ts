import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useBatchGeneration, useBatchImages, useBatchJob, useBatchProcessor } from "./use-batch-generation";
import { useMutation, useQuery } from "convex/react";
import * as React from "react";

// Mock convex/react
vi.mock("convex/react", () => ({
  useMutation: vi.fn(),
  useQuery: vi.fn(),
}));

// Mock api
vi.mock("@/convex/_generated/api", () => ({
  api: {
    batchGeneration: {
      startBatchJob: "startBatchJob",
      cancelBatchJob: "cancelBatchJob",
      pauseBatchJob: "pauseBatchJob",
      resumeBatchJob: "resumeBatchJob",
      getUserActiveBatches: "getUserActiveBatches",
      getUserBatchJobs: "getUserBatchJobs",
      getBatchImages: "getBatchImages",
      getBatchJob: "getBatchJob",
    },
  },
}));

describe("useBatchGeneration", () => {
  const mockStartBatch = vi.fn();
  const mockCancelBatch = vi.fn();
  const mockPauseBatch = vi.fn();
  const mockResumeBatch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useMutation as any).mockImplementation((apiPath: string) => {
      if (apiPath === "startBatchJob") return mockStartBatch;
      if (apiPath === "cancelBatchJob") return mockCancelBatch;
      if (apiPath === "pauseBatchJob") return mockPauseBatch;
      if (apiPath === "resumeBatchJob") return mockResumeBatch;
      return vi.fn();
    });
  });

  it("should return active batches and recent batches", () => {
    const activeBatches = [{ _id: "b1", status: "processing" }];
    const recentBatches = [{ _id: "b1", status: "processing" }, { _id: "b2", status: "completed" }];

    (useQuery as any).mockImplementation((apiPath: string) => {
      if (apiPath === "getUserActiveBatches") return activeBatches;
      if (apiPath === "getUserBatchJobs") return recentBatches;
      return null;
    });

    const { result } = renderHook(() => useBatchGeneration());

    expect(result.current.activeBatches).toEqual(activeBatches);
    expect(result.current.recentBatches).toEqual(recentBatches);
    expect(result.current.hasActiveBatch).toBe(true);
    expect(result.current.isLoading).toBe(false);
  });

  it("should call mutations correctly", async () => {
    const { result } = renderHook(() => useBatchGeneration());

    const params = { prompt: "test" };
    const count = 5;
    const apiKey = "key123";

    mockStartBatch.mockResolvedValue("new-batch-id");
    
    await act(async () => {
      const id = await result.current.startBatch(params, count, apiKey);
      expect(id).toBe("new-batch-id");
    });
    expect(mockStartBatch).toHaveBeenCalledWith({ count, generationParams: params, apiKey });

    await act(async () => {
      await result.current.cancelBatch("batch1" as any);
    });
    expect(mockCancelBatch).toHaveBeenCalledWith({ batchJobId: "batch1" });

    await act(async () => {
      await result.current.pauseBatch("batch1" as any);
    });
    expect(mockPauseBatch).toHaveBeenCalledWith({ batchJobId: "batch1" });

    await act(async () => {
      await result.current.resumeBatch("batch1" as any);
    });
    expect(mockResumeBatch).toHaveBeenCalledWith({ batchJobId: "batch1" });
  });

  it("should find a specific batch job with getBatchJob", () => {
    const recentBatches = [{ _id: "b1", status: "completed" }, { _id: "b2", status: "failed" }];
    (useQuery as any).mockImplementation((apiPath: string) => {
      if (apiPath === "getUserBatchJobs") return recentBatches;
      return null;
    });

    const { result } = renderHook(() => useBatchGeneration());

    expect(result.current.getBatchJob("b1" as any)).toEqual(recentBatches[0]);
    expect(result.current.getBatchJob("b2" as any)).toEqual(recentBatches[1]);
    expect(result.current.getBatchJob("b3" as any)).toBeNull();
  });
});

describe("useBatchImages", () => {
  it("should return images for a batch", () => {
    const mockImages = [{ _id: "img1", url: "url1" }];
    (useQuery as any).mockReturnValue(mockImages);

    const { result } = renderHook(() => useBatchImages("batch1" as any));

    expect(result.current.images).toEqual(mockImages);
    expect(result.current.isLoading).toBe(false);
    expect(useQuery).toHaveBeenCalledWith("getBatchImages", { batchJobId: "batch1" });
  });

  it("should skip query if batchJobId is undefined", () => {
    renderHook(() => useBatchImages(undefined));
    expect(useQuery).toHaveBeenCalledWith("getBatchImages", "skip");
  });
});

describe("useBatchJob", () => {
  it("should return a specific batch job", () => {
    const mockBatch = { _id: "b1", status: "pending" };
    (useQuery as any).mockReturnValue(mockBatch);

    const { result } = renderHook(() => useBatchJob("b1" as any));

    expect(result.current.batchJob).toEqual(mockBatch);
    expect(result.current.isLoading).toBe(false);
    expect(useQuery).toHaveBeenCalledWith("getBatchJob", { batchJobId: "b1" });
  });
});

describe("useBatchProcessor (deprecated)", () => {
  it("should provide progress info based on useBatchJob", () => {
    const mockBatch = {
      _id: "b1",
      status: "processing",
      currentIndex: 5,
      totalCount: 10,
      completedCount: 3,
    };
    (useQuery as any).mockReturnValue(mockBatch);

    const { result } = renderHook(() => useBatchProcessor("b1" as any));

    expect(result.current.isProcessing).toBe(true);
    expect(result.current.currentIndex).toBe(5);
    expect(result.current.totalCount).toBe(10);
    expect(result.current.completedCount).toBe(3);
    expect(result.current.status).toBe("processing");
  });

  it("should return defaults if batch job is not loaded", () => {
    (useQuery as any).mockReturnValue(undefined);

    const { result } = renderHook(() => useBatchProcessor(null));

    expect(result.current.isProcessing).toBe(false);
    expect(result.current.currentIndex).toBe(0);
    expect(result.current.totalCount).toBe(0);
    expect(result.current.completedCount).toBe(0);
  });
});
