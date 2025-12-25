/**
 * Storage Module Exports
 *
 * Re-exports R2 client functions for image storage operations.
 */

export {
    uploadImage,
    deleteImage,
    imageExists,
    generateImageKey,
    getPublicUrl,
    type UploadImageOptions,
    type UploadResult,
} from "./r2-client"
