/**
 * Storage Adapter Interface
 * Interface para diferentes provedores de armazenamento
 */

import { StorageAdapter, StorageUploadResult } from "./type"

/**
 * Adapter vazio para ser implementado com S3, GCS, Azure, etc
 * Retorna URLs públicas funcionais para simular comportamento real
 */
export class EmptyStorageAdapter implements StorageAdapter {
    private mockVideos = [
        "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
        "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
        "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
        "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
        "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
    ]

    private mockThumbnails = [
        "https://picsum.photos/seed/moment1/360/558",
        "https://picsum.photos/seed/moment2/360/558",
        "https://picsum.photos/seed/moment3/360/558",
        "https://picsum.photos/seed/moment4/360/558",
        "https://picsum.photos/seed/moment5/360/558",
    ]

    private getRandomMockVideo(): string {
        return this.mockVideos[Math.floor(Math.random() * this.mockVideos.length)]
    }

    private getRandomMockThumbnail(): string {
        return this.mockThumbnails[Math.floor(Math.random() * this.mockThumbnails.length)]
    }

    async uploadVideo(
        key: string,
        data: Buffer,
        metadata: Record<string, any>,
    ): Promise<StorageUploadResult> {
        // WARNING: Implementando video mock para testes
        // Retorna URL pública funcional do Google Cloud Storage (vídeos de exemplo)
        // TODO: Implementar upload real quando definir provider
        return {
            success: true,
            key,
            url: this.getRandomMockVideo(),
            provider: "mock",
            metadata: {
                size: data.length,
                originalName: metadata.originalName,
                mimeType: metadata.mimeType || "video/mp4",
                uploadedAt: new Date().toISOString(),
            },
        }
    }

    async uploadThumbnail(
        key: string,
        data: Buffer,
        metadata: Record<string, any>,
    ): Promise<StorageUploadResult> {
        // WARNING: Implementando thumbnail mock para testes
        // Retorna URL pública funcional do Picsum (imagens aleatórias)
        // TODO: Implementar upload real quando definir provider
        return {
            success: true,
            key,
            url: this.getRandomMockThumbnail(),
            provider: "mock",
            metadata: {
                size: data.length,
                originalName: metadata.originalName,
                mimeType: metadata.mimeType || "image/jpeg",
                uploadedAt: new Date().toISOString(),
            },
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
        // Mock: Retorna vídeo de exemplo (já que não temos storage real)
        return this.getRandomMockVideo()
    }

    async getThumbnailUrl(key: string): Promise<string> {
        // Mock: Retorna thumbnail de exemplo (já que não temos storage real)
        return this.getRandomMockThumbnail()
    }
}

/**
 * Mock Local Storage Adapter (para desenvolvimento)
 * Usa URLs públicas funcionais para simular storage local
 */
export class LocalStorageAdapter implements StorageAdapter {
    private baseUrl: string
    private mockVideos = [
        "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
        "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
        "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
        "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
        "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
    ]

    private mockThumbnails = [
        "https://picsum.photos/seed/moment1/360/558",
        "https://picsum.photos/seed/moment2/360/558",
        "https://picsum.photos/seed/moment3/360/558",
        "https://picsum.photos/seed/moment4/360/558",
        "https://picsum.photos/seed/moment5/360/558",
    ]

    constructor(baseUrl: string = "http://localhost:3000/storage") {
        this.baseUrl = baseUrl
    }

    private getRandomMockVideo(): string {
        return this.mockVideos[Math.floor(Math.random() * this.mockVideos.length)]
    }

    private getRandomMockThumbnail(): string {
        return this.mockThumbnails[Math.floor(Math.random() * this.mockThumbnails.length)]
    }

    async uploadVideo(
        key: string,
        data: Buffer,
        metadata: Record<string, any>,
    ): Promise<StorageUploadResult> {
        // Mock de upload local usando URLs públicas funcionais
        console.log(`[LocalStorage] Simulando upload de vídeo: ${key}`)
        return {
            success: true,
            key,
            url: this.getRandomMockVideo(),
            provider: "local-mock",
            metadata: {
                size: data.length,
                originalName: metadata.originalName,
                mimeType: metadata.mimeType || "video/mp4",
                uploadedAt: new Date().toISOString(),
            },
        }
    }

    async uploadThumbnail(
        key: string,
        data: Buffer,
        metadata: Record<string, any>,
    ): Promise<StorageUploadResult> {
        // Mock de upload local usando URLs públicas funcionais
        console.log(`[LocalStorage] Simulando upload de thumbnail: ${key}`)
        return {
            success: true,
            key,
            url: this.getRandomMockThumbnail(),
            provider: "local-mock",
            metadata: {
                size: data.length,
                originalName: metadata.originalName,
                mimeType: metadata.mimeType || "image/jpeg",
                uploadedAt: new Date().toISOString(),
            },
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
        // Mock: Retorna vídeo público funcional
        console.log(
            `[LocalStorage] Gerando URL de vídeo: ${key} (quality: ${quality || "original"})`,
        )
        return this.getRandomMockVideo()
    }

    async getThumbnailUrl(key: string): Promise<string> {
        // Mock: Retorna thumbnail público funcional
        console.log(`[LocalStorage] Gerando URL de thumbnail: ${key}`)
        return this.getRandomMockThumbnail()
    }
}

/**
 * Factory para criar storage adapter
 */
export class StorageAdapterFactory {
    static create(
        provider: "s3" | "gcs" | "azure" | "local" | "real-local" = "local",
    ): StorageAdapter {
        switch (provider) {
            case "real-local":
                const { RealLocalStorageAdapter } = require("./real.local.storage.adapter")
                return new RealLocalStorageAdapter()
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
