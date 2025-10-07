/**
 * Storage Adapter Interface
 * Interface para diferentes provedores de armazenamento
 */

import { StorageAdapter, StorageUploadResult } from "./type"

/**
 * Adapter vazio para ser implementado com S3, GCS, Azure, etc
 */
export class EmptyStorageAdapter implements StorageAdapter {
    async uploadVideo(
        key: string,
        data: Buffer,
        metadata: Record<string, any>,
    ): Promise<StorageUploadResult> {
        // TODO: Implementar upload real quando definir provider
        return {
            success: false,
            key,
            url: "",
            provider: "local",
            error: "Storage provider não configurado. Configure S3, GCS ou Azure.",
        }
    }

    async uploadThumbnail(
        key: string,
        data: Buffer,
        metadata: Record<string, any>,
    ): Promise<StorageUploadResult> {
        // TODO: Implementar upload real quando definir provider
        return {
            success: false,
            key,
            url: "",
            provider: "local",
            error: "Storage provider não configurado. Configure S3, GCS ou Azure.",
        }
    }

    async deleteVideo(key: string): Promise<void> {
        // TODO: Implementar delete real
        throw new Error("Storage provider não configurado")
    }

    async deleteThumbnail(key: string): Promise<void> {
        // TODO: Implementar delete real
        throw new Error("Storage provider não configurado")
    }

    async getVideoUrl(key: string, quality?: "low" | "medium" | "high"): Promise<string> {
        // TODO: Implementar geração de URL real
        return ""
    }

    async getThumbnailUrl(key: string): Promise<string> {
        // TODO: Implementar geração de URL real
        return ""
    }
}

/**
 * Mock Local Storage Adapter (para desenvolvimento)
 */
export class LocalStorageAdapter implements StorageAdapter {
    private baseUrl: string

    constructor(baseUrl: string = "http://localhost:3000/storage") {
        this.baseUrl = baseUrl
    }

    async uploadVideo(
        key: string,
        data: Buffer,
        metadata: Record<string, any>,
    ): Promise<StorageUploadResult> {
        // Mock de upload local
        return {
            success: true,
            key,
            url: `${this.baseUrl}/videos/${key}`,
            provider: "local",
        }
    }

    async uploadThumbnail(
        key: string,
        data: Buffer,
        metadata: Record<string, any>,
    ): Promise<StorageUploadResult> {
        // Mock de upload local
        return {
            success: true,
            key,
            url: `${this.baseUrl}/thumbnails/${key}`,
            provider: "local",
        }
    }

    async deleteVideo(key: string): Promise<void> {
        // Mock de delete local
        console.log(`[LocalStorage] Deletando vídeo: ${key}`)
    }

    async deleteThumbnail(key: string): Promise<void> {
        // Mock de delete local
        console.log(`[LocalStorage] Deletando thumbnail: ${key}`)
    }

    async getVideoUrl(key: string, quality?: "low" | "medium" | "high"): Promise<string> {
        const qualityParam = quality ? `?quality=${quality}` : ""
        return `${this.baseUrl}/videos/${key}${qualityParam}`
    }

    async getThumbnailUrl(key: string): Promise<string> {
        return `${this.baseUrl}/thumbnails/${key}`
    }
}

/**
 * Factory para criar storage adapter
 */
export class StorageAdapterFactory {
    static create(provider: "s3" | "gcs" | "azure" | "local" = "local"): StorageAdapter {
        switch (provider) {
            case "local":
                return new LocalStorageAdapter()
            case "s3":
            case "gcs":
            case "azure":
                // TODO: Implementar quando necessário
                return new EmptyStorageAdapter()
            default:
                return new EmptyStorageAdapter()
        }
    }
}
