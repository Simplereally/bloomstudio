"use client"

import { useMutation as useConvexMutation } from "convex/react"
import { useMutation } from "@tanstack/react-query"
import { api } from "@/convex/_generated/api"

interface UploadResult {
    url: string
    r2Key: string
    contentType: string
    sizeBytes: number
}

interface UploadOptions {
    onProgress?: (progress: number) => void
}

/**
 * Hook to upload a reference image to R2 and store its metadata in Convex.
 */
export function useUploadReference(options: UploadOptions = {}) {
    const createImage = useConvexMutation(api.referenceImages.create)

    return useMutation({
        mutationFn: async (file: File): Promise<UploadResult> => {
            return new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest()
                const formData = new FormData()
                formData.append("file", file)

                xhr.upload.addEventListener("progress", (event) => {
                    if (event.lengthComputable) {
                        const progress = (event.loaded / event.total) * 100
                        options.onProgress?.(progress)
                    }
                })

                xhr.addEventListener("load", async () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        try {
                            const data = JSON.parse(xhr.responseText)
                            if (!data.success) {
                                reject(new Error(data.error?.message || "Upload failed"))
                                return
                            }

                            const uploadData = data.data

                            // Store metadata in Convex
                            await createImage({
                                r2Key: uploadData.r2Key,
                                url: uploadData.url,
                                filename: file.name,
                                contentType: uploadData.contentType,
                                sizeBytes: uploadData.sizeBytes,
                            })

                            resolve(uploadData)
                        } catch {
                            reject(new Error("Failed to parse upload response"))
                        }
                    } else {
                        try {
                            const data = JSON.parse(xhr.responseText)
                            reject(new Error(data.error?.message || `Upload failed with status ${xhr.status}`))
                        } catch {
                            reject(new Error(`Upload failed with status ${xhr.status}`))
                        }
                    }
                })

                xhr.addEventListener("error", () => reject(new Error("Network error during upload")))
                xhr.addEventListener("abort", () => reject(new Error("Upload aborted")))

                xhr.open("POST", "/api/upload")
                xhr.send(formData)
            })
        },
    })
}
