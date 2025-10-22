/**
 * Real Local Storage Adapter
 * Implementação REAL de storage local (salva arquivos em disco)
 */

import { logger } from "@/shared"
import { existsSync, mkdirSync, writeFileSync } from "fs"
import { StorageAdapter, StorageUploadResult } from "./type"

import { join } from "path"

interface StorageUploadOptions {
    mimeType: string
    metadata?: Record<string, any>
}

export class LocalStorageAdapter implements StorageAdapter {
    private baseDir: string
    private baseUrl: string
    private video_filename: string
    private thumbnail_filename: string

    constructor(baseDir: string = "./uploads", baseUrl: string = "http://localhost:3000/uploads") {
        this.baseDir = baseDir
        this.baseUrl = baseUrl
        this.video_filename = ""
        this.thumbnail_filename = ""

        // Criar diretórios se não existirem
        this.ensureDirectories()
    }

    /**
     * Upload de vídeo
     */
    async uploadVideo(
        baseKey: string,
        videoData: Buffer,
        options: StorageUploadOptions,
    ): Promise<StorageUploadResult> {
        try {
            // Organizar arquivo usando baseKey: ownerId/contentId -> videos/ownerId_contentId.mp4
            this.video_filename = this.generateFilename(baseKey, "video", options.mimeType)
            const filePath = join(this.baseDir, "videos", this.video_filename)

            // Salvar arquivo
            writeFileSync(filePath, videoData)

            const url = `${this.baseUrl}/videos/${this.video_filename}`

            return {
                success: true,
                url,
                key: baseKey,
                provider: "local",
                bucket: "uploads",
                metadata: {
                    path: filePath,
                    filename: this.video_filename,
                    mimeType: options.mimeType,
                    baseKey: baseKey,
                },
            }
        } catch (error) {
            logger.error("[LocalStorage] ❌ Erro ao salvar vídeo:", error)
            return {
                success: false,
                url: "",
                key: baseKey,
                provider: "local",
                error: error instanceof Error ? error.message : String(error),
            }
        }
    }

    private generateFilename(
        baseKey: string,
        type: "video" | "thumbnail",
        mimeType: string,
    ): string {
        // Para thumbnails, usar formato especial: thumb_{id}.jpg
        if (type === "thumbnail" && !baseKey.includes("/")) {
            return `thumb_${baseKey}.${this.getExtension(mimeType)}`
        }

        // Para vídeos e thumbnails com path completo, usar formato padrão
        return `${type}_${baseKey.replace(/\//g, "_")}.${this.getExtension(mimeType)}`
    }

    /**
     * Upload de thumbnail (alias para uploadImage)
     */
    async uploadThumbnail(
        baseKey: string,
        data: Buffer,
        metadata: Record<string, any>,
    ): Promise<StorageUploadResult> {
        return this.uploadImage(baseKey, data, {
            mimeType: metadata.mimeType || "image/jpeg",
            metadata: { ...metadata, baseKey },
        })
    }

    /**
     * Upload de imagem (thumbnail)
     */
    async uploadImage(
        baseKey: string,
        imageData: Buffer,
        options: StorageUploadOptions,
    ): Promise<StorageUploadResult> {
        try {
            // Organizar arquivo usando baseKey: ownerId/contentId -> thumbnails/ownerId_contentId.jpg
            const extension = this.getExtension(options.mimeType)
            this.thumbnail_filename = this.generateFilename(baseKey, "thumbnail", options.mimeType)
            const filePath = join(this.baseDir, "thumbnails", this.thumbnail_filename)

            // Salvar arquivo
            writeFileSync(filePath, imageData)

            const url = `${this.baseUrl}/thumbnails/${this.thumbnail_filename}`

            console.log(
                `[LocalStorage] ✅ Thumbnail salva: ${this.thumbnail_filename} (${(
                    imageData.length / 1024
                ).toFixed(2)}KB) - BaseKey: ${baseKey}`,
            )

            return {
                success: true,
                url,
                key: baseKey, // Retornar baseKey original
                provider: "local",
                bucket: "uploads",
                metadata: {
                    path: filePath,
                    filename: this.thumbnail_filename,
                    mimeType: options.mimeType,
                    baseKey: baseKey,
                },
            }
        } catch (error) {
            console.error("[RealLocalStorage] ❌ Erro ao salvar thumbnail:", error)

            return {
                success: false,
                url: "",
                key: baseKey,
                provider: "local",
                error: error instanceof Error ? error.message : String(error),
            }
        }
    }

    /**
     * Garante que os diretórios existem
     */
    private ensureDirectories(): void {
        const videosDir = join(this.baseDir, "videos")
        const thumbnailsDir = join(this.baseDir, "thumbnails")

        if (!existsSync(this.baseDir)) {
            mkdirSync(this.baseDir, { recursive: true })
        }

        if (!existsSync(videosDir)) {
            mkdirSync(videosDir, { recursive: true })
        }

        if (!existsSync(thumbnailsDir)) {
            mkdirSync(thumbnailsDir, { recursive: true })
        }

        console.log(`[RealLocalStorage] 📁 Diretórios prontos: ${this.baseDir}`)
    }

    /**
     * Delete de vídeo
     */
    async deleteVideo(baseKey: string): Promise<void> {
        const filename = `${baseKey.replace(/\//g, "_")}.mp4`
        console.log(`[LocalStorage] 🗑️  Deletando vídeo: ${filename} (BaseKey: ${baseKey})`)
        // TODO: Implementar delete real se necessário
    }

    /**
     * Delete de thumbnail
     */
    async deleteThumbnail(baseKey: string): Promise<void> {
        const filename = `${baseKey.replace(/\//g, "_")}.jpg`
        console.log(`[LocalStorage] 🗑️  Deletando thumbnail: ${filename} (BaseKey: ${baseKey})`)
        // TODO: Implementar delete real se necessário
    }

    /**
     * Obter URL de vídeo
     */
    async getVideoUrl(baseKey: string, quality?: "low" | "medium" | "high"): Promise<string> {
        const filename = `${baseKey.replace(/\//g, "_")}.mp4`
        return `${this.baseUrl}/videos/${filename}`
    }

    /**
     * Obter URL de thumbnail
     */
    async getThumbnailUrl(baseKey: string): Promise<string> {
        const filename = `${baseKey.replace(/\//g, "_")}.jpg`
        return `${this.baseUrl}/thumbnails/${filename}`
    }

    /**
     * Obtém extensão do arquivo baseado no MIME type
     */
    private getExtension(mimeType: string): string {
        const map: Record<string, string> = {
            "video/mp4": "mp4",
            "video/quicktime": "mov",
            "video/x-msvideo": "avi",
            "video/webm": "webm",
            "image/jpeg": "jpg",
            "image/png": "png",
            "image/webp": "webp",
        }

        return map[mimeType] || "mp4"
    }
}
