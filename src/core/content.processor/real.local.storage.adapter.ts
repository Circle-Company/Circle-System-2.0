/**
 * Real Local Storage Adapter
 * Implementação REAL de storage local (salva arquivos em disco)
 */

import { generateId } from "@/shared"
import { existsSync, mkdirSync, writeFileSync } from "fs"
import { join } from "path"
import { StorageAdapter, StorageUploadResult } from "./type"

interface StorageUploadOptions {
    filename: string
    mimeType: string
    metadata?: Record<string, any>
}

export class RealLocalStorageAdapter implements StorageAdapter {
    private baseDir: string
    private baseUrl: string

    constructor(baseDir: string = "./uploads", baseUrl: string = "http://localhost:3000/uploads") {
        this.baseDir = baseDir
        this.baseUrl = baseUrl

        // Criar diretórios se não existirem
        this.ensureDirectories()
    }

    /**
     * Upload de vídeo
     */
    async uploadVideo(
        videoData: Buffer,
        options: StorageUploadOptions,
    ): Promise<StorageUploadResult> {
        try {
            const videoId = generateId()
            const extension = this.getExtension(options.mimeType)
            const filename = `${videoId}.${extension}`
            const filePath = join(this.baseDir, "videos", filename)

            // Salvar arquivo
            writeFileSync(filePath, videoData)

            const url = `${this.baseUrl}/videos/${filename}`

            console.log(
                `[RealLocalStorage] ✅ Vídeo salvo: ${filename} (${(
                    videoData.length /
                    1024 /
                    1024
                ).toFixed(2)}MB)`,
            )

            return {
                success: true,
                url,
                key: `videos/${filename}`,
                provider: "local",
                bucket: "uploads",
                size: videoData.length,
                metadata: {
                    path: filePath,
                    filename,
                    mimeType: options.mimeType,
                },
            }
        } catch (error) {
            console.error("[RealLocalStorage] ❌ Erro ao salvar vídeo:", error)

            return {
                success: false,
                url: "",
                key: "",
                provider: "local",
                error: error instanceof Error ? error.message : String(error),
            }
        }
    }

    /**
     * Upload de imagem (thumbnail)
     */
    async uploadImage(
        imageData: Buffer,
        options: StorageUploadOptions,
    ): Promise<StorageUploadResult> {
        try {
            const imageId = generateId()
            const extension = this.getExtension(options.mimeType)
            const filename = `${imageId}.${extension}`
            const filePath = join(this.baseDir, "thumbnails", filename)

            // Salvar arquivo
            writeFileSync(filePath, imageData)

            const url = `${this.baseUrl}/thumbnails/${filename}`

            console.log(
                `[RealLocalStorage] ✅ Thumbnail salva: ${filename} (${(
                    imageData.length / 1024
                ).toFixed(2)}KB)`,
            )

            return {
                success: true,
                url,
                key: `thumbnails/${filename}`,
                provider: "local",
                bucket: "uploads",
                size: imageData.length,
                metadata: {
                    path: filePath,
                    filename,
                    mimeType: options.mimeType,
                },
            }
        } catch (error) {
            console.error("[RealLocalStorage] ❌ Erro ao salvar thumbnail:", error)

            return {
                success: false,
                url: "",
                key: "",
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
