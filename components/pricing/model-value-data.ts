"use client"

export interface ModelValueData {
    id: string
    displayName: string
    logo: string
    monthlyQuota: number
    type: "image" | "video"
    nsfw?: boolean
}

export const MODEL_VALUE_DATA: ModelValueData[] = [
    {
        id: "flux",
        displayName: "Flux Schnell",
        logo: "/image-models/flux.svg",
        monthlyQuota: 150_000,
        type: "image",
    },
    {
        id: "klein",
        displayName: "FLUX.2 Klein 4B",
        logo: "/image-models/flux.svg",
        monthlyQuota: 4_500, // 30 * 150
        type: "image",
    },
    {
        id: "klein-large",
        displayName: "FLUX.2 Klein 9B",
        logo: "/image-models/flux.svg",
        monthlyQuota: 2_550, // 30 * 85
        type: "image",
    },
    {
        id: "zimage",
        displayName: "Z-Image Turbo",
        logo: "/image-models/alibaba.svg",
        monthlyQuota: 150_000,
        nsfw: true,
        type: "image",
    },
    {
        id: "turbo",
        displayName: "SDXL Turbo",
        logo: "/image-models/stability.svg",
        monthlyQuota: 99_000,
        type: "image",
    },
    {
        id: "gptimage",
        displayName: "GPT Image 1.0",
        logo: "/image-models/openai.svg",
        monthlyQuota: 2_100,
        type: "image",
    },
    {
        id: "nanobanana",
        displayName: "Nano Banana",
        logo: "/image-models/google.svg",
        monthlyQuota: 750,
        type: "image",
    },
    {
        id: "seedream",
        displayName: "Seedream 4.0",
        logo: "/image-models/bytedance.svg",
        monthlyQuota: 1_050,
        type: "image",
    },
    {
        id: "seedream-pro",
        displayName: "Seedream 4.5 Pro",
        logo: "/image-models/bytedance.svg",
        monthlyQuota: 750,
        type: "image",
    },
    {
        id: "seedance-pro",
        displayName: "Seedance Pro",
        logo: "/image-models/bytedance.svg",
        monthlyQuota: 300,
        type: "video",
    },
    {
        id: "seedance",
        displayName: "Seedance",
        logo: "/image-models/bytedance.svg",
        monthlyQuota: 180,
        type: "video",
    },
    {
        id: "veo",
        displayName: "Veo 3.1",
        logo: "/image-models/google.svg",
        monthlyQuota: 30,
        type: "video",
    },
    {
        id: "kontext",
        displayName: "Flux Kontext",
        logo: "/image-models/flux.svg",
        monthlyQuota: 750,
        type: "image",
    },
    {
        id: "gptimage-large",
        displayName: "GPT Image 1.5",
        logo: "/image-models/openai.svg",
        monthlyQuota: 600,
        type: "image",
    },
    {
        id: "nanobanana-pro",
        displayName: "Nano Banana Pro",
        logo: "/image-models/google.svg",
        monthlyQuota: 180,
        type: "image",
    },
]
