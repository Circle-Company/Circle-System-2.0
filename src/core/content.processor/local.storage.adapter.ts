/**
 * Real Local Storage Adapter
 * Implementação REAL de storage local (salva arquivos em disco)
 */

import { existsSync, mkdirSync, writeFileSync } from "fs"
import { StorageAdapter, StorageUploadResult } from "./type"

import { logger } from "@/shared"
import { networkInterfaces } from "os"
import { join } from "path"

interface StorageUploadOptions {
    mimeType: string
    metadata?: Record<string, any>
}

/**
 * Obtém o IP da máquina
 */
function getMachineIP(): string {
    const interfaces = networkInterfaces()
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name] || []) {
            // Ignorar endereços internos e IPv6
            if (iface.family === "IPv4" && !iface.internal) {
                return iface.address
            }
        }
    }
    return "localhost"
}

export class LocalStorageAdapter implements StorageAdapter {
    private baseDir: string
    private baseUrl: string
    private video_filename: string
    private thumbnail_filename: string

    constructor(baseDir: string = "./uploads", baseUrl?: string) {
        this.baseDir = baseDir

        // Se baseUrl não foi fornecido, usar IP da máquina
        if (!baseUrl) {
            const machineIP = getMachineIP()
            const port = process.env.PORT || "3000"
            this.baseUrl = `http://${machineIP}:${port}`
        } else {
            // Garantir que baseUrl não tenha /uploads no final
            this.baseUrl = baseUrl.replace(/\/uploads$/, "")
        }

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

            // URL com prefix /storage/
            const url = `${this.baseUrl}/storage/videos/${this.video_filename}`

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

            // URL com prefix /storage/
            const url = `${this.baseUrl}/storage/thumbnails/${this.thumbnail_filename}`

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
        try {
            // Normalizar baseKey: remover prefixos e extensões duplicadas
            let filePath = baseKey
            
            // Se contém "storage/videos/", extrair apenas o nome do arquivo
            if (filePath.includes("storage/videos/")) {
                filePath = filePath.split("storage/videos/")[1]
            } else if (filePath.includes("videos/")) {
                filePath = filePath.split("videos/")[1]
            }
            
            // Se já tem extensão .mp4, não adicionar novamente
            const filename = filePath.endsWith(".mp4") ? filePath : `${filePath}.mp4`
            const fullPath = join(this.baseDir, "videos", filename)
            
            console.log(`[LocalStorage] 🗑️  Deletando vídeo: ${filename} (BaseKey: ${baseKey})`)
            
            // Implementar delete real
            if (existsSync(fullPath)) {
                const fs = await import("fs")
                fs.unlinkSync(fullPath)
                console.log(`[LocalStorage] ✅ Vídeo deletado: ${fullPath}`)
            } else {
                console.warn(`[LocalStorage] ⚠️ Arquivo não encontrado para deletar: ${fullPath}`)
            }
        } catch (error) {
            console.error(`[LocalStorage] ❌ Erro ao deletar vídeo:`, error)
            throw error
        }
    }

    /**
     * Delete de thumbnail
     */
    async deleteThumbnail(baseKey: string): Promise<void> {
        try {
            // Normalizar baseKey: remover prefixos e extensões duplicadas
            let filePath = baseKey
            
            // Se contém "storage/thumbnails/", extrair apenas o nome do arquivo
            if (filePath.includes("storage/thumbnails/")) {
                filePath = filePath.split("storage/thumbnails/")[1]
            } else if (filePath.includes("thumbnails/")) {
                filePath = filePath.split("thumbnails/")[1]
            }
            
            // Se já tem extensão .jpg, não adicionar novamente
            const filename = filePath.endsWith(".jpg") || filePath.endsWith(".jpeg") 
                ? filePath 
                : `${filePath}.jpg`
            const fullPath = join(this.baseDir, "thumbnails", filename)
            
            console.log(`[LocalStorage] 🗑️  Deletando thumbnail: ${filename} (BaseKey: ${baseKey})`)
            
            // Implementar delete real
            if (existsSync(fullPath)) {
                const fs = await import("fs")
                fs.unlinkSync(fullPath)
                console.log(`[LocalStorage] ✅ Thumbnail deletado: ${fullPath}`)
            } else {
                console.warn(`[LocalStorage] ⚠️ Arquivo não encontrado para deletar: ${fullPath}`)
            }
        } catch (error) {
            console.error(`[LocalStorage] ❌ Erro ao deletar thumbnail:`, error)
            throw error
        }
    }

    /**
     * Obter URL de vídeo
     */
    async getVideoUrl(baseKey: string, quality?: "low" | "medium" | "high"): Promise<string> {
        const filename = `${baseKey.replace(/\//g, "_")}.mp4`
        return `${this.baseUrl}/storage/videos/${filename}`
    }

    /**
     * Obter URL de thumbnail
     */
    async getThumbnailUrl(baseKey: string): Promise<string> {
        const filename = `${baseKey.replace(/\//g, "_")}.jpg`
        return `${this.baseUrl}/storage/thumbnails/${filename}`
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
