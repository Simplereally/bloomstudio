/**
 * Storage Module Exports
 *
 * Re-exports R2 client functions for file storage operations.
 */

export {
    uploadFile,
    deleteImage,
    deleteImages,
    imageExists,
    generateImageKey,
    getPublicUrl,
    type UploadFileOptions,
    type UploadResult,
} from "./r2-client"
