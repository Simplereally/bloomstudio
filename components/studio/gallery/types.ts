/** Shape of a server-cached paginated gallery page (used for hybrid caching strategy) */
export type PaginatedGalleryResult = {
  page: Array<{
    _id: string;
    _creationTime: number;
    url: string;
    /** Original full-size URL (R2) — present when the gallery url is a thumbnail */
    originalUrl?: string;
    visibility?: "public" | "unlisted";
    model?: string;
    contentType?: string;
  }>;
  isDone: boolean;
  continueCursor: string;
};

export interface ThumbnailData {
  id: string;
  _id?: string;
  url: string;
  /** Original full-size URL (R2) for use when the actual image content is needed (e.g. reference images) */
  originalUrl?: string;
  prompt?: string;
  visibility?: "public" | "unlisted";
  model?: string;
  _creationTime?: number;
  contentType?: string;
}

export type ThumbnailSize = "sm" | "md" | "lg";
export type GalleryDirection = "horizontal" | "vertical";

export const THUMBNAIL_SIZES = {
  sm: 64, // w-16 h-16
  md: 96, // w-24 h-24
  lg: 128, // w-32 h-32
} as const;

export const STANDARD_SIZE_CLASSES = {
  sm: "w-16 h-16",
  md: "w-24 h-24",
  lg: "w-32 h-32",
};

export const GRID_COLUMNS = {
  sm: 4,
  md: 3,
  lg: 2,
} as const;

export const MOBILE_COLUMNS = 3;

export const GAP_SIZE = 6; // gap-1.5 = 0.375rem = 6px
export const PADDING = 8; // p-2 = 0.5rem = 8px
