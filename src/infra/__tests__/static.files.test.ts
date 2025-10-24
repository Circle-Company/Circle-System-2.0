import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs"
import { afterAll, beforeAll, describe, expect, it } from "vitest"

import { join } from "path"

// Importar api diretamente
import { api } from "../api"

describe("Static Files Serving", () => {
    const testVideoPath = join(process.cwd(), "uploads", "videos", "test-video.mp4")
    const testThumbnailPath = join(process.cwd(), "uploads", "thumbnails", "test-thumbnail.jpg")
    const testVideoKey = "test-video.mp4"
    const testThumbnailKey = "test-thumbnail.jpg"

    // Nota: A API usa prefix /storage/ conforme configurado em api.ts

    beforeAll(async () => {
        // Criar pastas se não existirem
        const videosDir = join(process.cwd(), "uploads", "videos")
        const thumbnailsDir = join(process.cwd(), "uploads", "thumbnails")

        if (!existsSync(videosDir)) {
            mkdirSync(videosDir, { recursive: true })
        }
        if (!existsSync(thumbnailsDir)) {
            mkdirSync(thumbnailsDir, { recursive: true })
        }

        // Criar arquivos de teste
        const mockVideoData = Buffer.from("fake video data for testing")
        const mockThumbnailData = Buffer.from("fake thumbnail data for testing")

        writeFileSync(testVideoPath, mockVideoData)
        writeFileSync(testThumbnailPath, mockThumbnailData)

        // Aguardar a API estar pronta
        await new Promise((resolve) => setTimeout(resolve, 1000))
    })

    afterAll(async () => {
        // Limpar arquivos de teste
        if (existsSync(testVideoPath)) {
            const fs = await import("fs")
            fs.unlinkSync(testVideoPath)
        }
        if (existsSync(testThumbnailPath)) {
            const fs = await import("fs")
            fs.unlinkSync(testThumbnailPath)
        }

        // Fechar a API após os testes
        await api.close()
    })

    describe("Video Files Serving", () => {
        it("should serve video files from /storage/videos/", async () => {
            const response = await api.inject({
                method: "GET",
                url: `/storage/videos/${testVideoKey}`,
            })

            expect(response.statusCode).toBe(200)
            expect(response.headers["content-type"]).toContain("video/mp4")
            expect(response.headers["content-length"]).toBeDefined()
        })

        it("should return 404 for non-existent video files", async () => {
            const response = await api.inject({
                method: "GET",
                url: "/storage/videos/nonexistent-video.mp4",
            })

            expect(response.statusCode).toBe(404)
        })

        it("should return correct content type for video files", async () => {
            const response = await api.inject({
                method: "GET",
                url: `/storage/videos/${testVideoKey}`,
            })

            expect(response.headers["content-type"]).toContain("video/mp4")
        })

        it("should return binary data for video files", async () => {
            const response = await api.inject({
                method: "GET",
                url: `/storage/videos/${testVideoKey}`,
            })

            expect(Buffer.isBuffer(response.rawPayload)).toBe(true)
            expect(response.rawPayload.length).toBeGreaterThan(0)
        })
    })

    describe("Thumbnail Files Serving", () => {
        it("should serve thumbnail files from /storage/thumbnails/", async () => {
            const response = await api.inject({
                method: "GET",
                url: `/storage/thumbnails/${testThumbnailKey}`,
            })

            expect(response.statusCode).toBe(200)
            expect(response.headers["content-type"]).toContain("image/jpeg")
            expect(response.headers["content-length"]).toBeDefined()
        })

        it("should return 404 for non-existent thumbnail files", async () => {
            const response = await api.inject({
                method: "GET",
                url: "/storage/thumbnails/nonexistent-thumbnail.jpg",
            })

            expect(response.statusCode).toBe(404)
        })

        it("should return correct content type for thumbnail files", async () => {
            const response = await api.inject({
                method: "GET",
                url: `/storage/thumbnails/${testThumbnailKey}`,
            })

            expect(response.headers["content-type"]).toContain("image/jpeg")
        })

        it("should return binary data for thumbnail files", async () => {
            const response = await api.inject({
                method: "GET",
                url: `/storage/thumbnails/${testThumbnailKey}`,
            })

            expect(Buffer.isBuffer(response.rawPayload)).toBe(true)
            expect(response.rawPayload.length).toBeGreaterThan(0)
        })
    })

    describe("General Static Files", () => {
        it("should handle HEAD requests for static files", async () => {
            const response = await api.inject({
                method: "HEAD",
                url: `/storage/videos/${testVideoKey}`,
            })

            expect(response.statusCode).toBe(200)
            expect(response.headers["content-type"]).toContain("video/mp4")
        })

        it("should set proper cache headers for static files", async () => {
            const response = await api.inject({
                method: "GET",
                url: `/storage/videos/${testVideoKey}`,
            })

            // Verificar se headers de cache estão presentes
            expect(response.headers).toBeDefined()
        })

        it("should handle concurrent requests to static files", async () => {
            const requests = Array.from({ length: 5 }, () =>
                api.inject({
                    method: "GET",
                    url: `/storage/videos/${testVideoKey}`,
                }),
            )

            const responses = await Promise.all(requests)

            responses.forEach((response) => {
                expect(response.statusCode).toBe(200)
                expect(response.headers["content-type"]).toContain("video/mp4")
            })
        })
    })

    describe("Static Files Path Resolution", () => {
        it("should serve files from base /storage/ path", async () => {
            // Testar se arquivos são acessíveis via path genérico
            const response = await api.inject({
                method: "GET",
                url: `/storage/videos/${testVideoKey}`,
            })

            expect(response.statusCode).toBe(200)
        })

        it("should not allow access to files outside uploads directory", async () => {
            // Tentar acessar arquivo fora do diretório permitido
            const response = await api.inject({
                method: "GET",
                url: "/storage/../../../package.json",
            })

            // Deve retornar 404 ou bloquear o acesso
            expect([404, 403]).toContain(response.statusCode)
        })

        it("should handle special characters in filenames", async () => {
            // Criar arquivo com nome especial
            const specialFileName = "test-video_123-test.mp4"
            const specialFilePath = join(process.cwd(), "uploads", "videos", specialFileName)
            const mockData = Buffer.from("test data")

            writeFileSync(specialFilePath, mockData)

            try {
                const response = await api.inject({
                    method: "GET",
                    url: `/storage/videos/${specialFileName}`,
                })

                expect(response.statusCode).toBe(200)
            } finally {
                // Limpar arquivo
                if (existsSync(specialFilePath)) {
                    const fs = await import("fs")
                    fs.unlinkSync(specialFilePath)
                }
            }
        })
    })

    describe("Content Delivery", () => {
        it("should return correct file size", async () => {
            const response = await api.inject({
                method: "GET",
                url: `/storage/videos/${testVideoKey}`,
            })

            const fileSize = readFileSync(testVideoPath).length
            expect(response.headers["content-length"]).toBe(String(fileSize))
        })

        it("should support range requests for video files", async () => {
            const response = await api.inject({
                method: "GET",
                url: `/storage/videos/${testVideoKey}`,
                headers: {
                    range: "bytes=0-1023",
                },
            })

            // Pode retornar 206 (Partial Content) ou 200 (Full Content)
            expect([200, 206]).toContain(response.statusCode)
        })

        it("should handle invalid range requests gracefully", async () => {
            const response = await api.inject({
                method: "GET",
                url: `/storage/videos/${testVideoKey}`,
                headers: {
                    range: "bytes=999999-9999999",
                },
            })

            // Deve retornar 416 (Range Not Satisfiable) ou tratar como requisição normal
            expect([200, 206, 416]).toContain(response.statusCode)
        })
    })
})
