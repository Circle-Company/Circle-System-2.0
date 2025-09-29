import { beforeEach, describe, expect, it } from "vitest"

import { Moment as DomainMoment } from "../../entities/moment.entity"
import { MomentMapper } from "../moment.mapper"

// Helper para criar dados de teste
function createMockSequelizeMoment(overrides: any = {}) {
    const baseData = {
        id: BigInt(123456789),
        ownerId: "owner-123",
        description: "Test moment description",
        hashtags: ["test", "vlog"],
        mentions: ["@user1", "@user2"],
        publishedAt: new Date("2024-01-01T10:00:00Z"),
        archivedAt: null,
        deletedAt: null,
        createdAt: new Date("2024-01-01T09:00:00Z"),
        updatedAt: new Date("2024-01-01T10:00:00Z"),
        ...overrides,
    }

    return {
        ...baseData,
        content: {
            id: BigInt(987654321),
            momentId: BigInt(123456789),
            duration: 30,
            size: 1024 * 1024,
            format: "mp4",
            hasAudio: true,
            codec: "h264",
            createdAt: new Date("2024-01-01T09:00:00Z"),
            updatedAt: new Date("2024-01-01T10:00:00Z"),
            resolution: {
                id: BigInt(111222333),
                contentId: BigInt(987654321),
                width: 720,
                height: 1280,
                quality: "medium",
                createdAt: new Date("2024-01-01T09:00:00Z"),
                updatedAt: new Date("2024-01-01T10:00:00Z"),
            },
        },
        status: {
            id: BigInt(444555666),
            momentId: BigInt(123456789),
            current: "published",
            previousStatus: "under_review",
            reason: "Approved by moderator",
            changedBy: "moderator-123",
            changedAt: new Date("2024-01-01T09:30:00Z"),
            createdAt: new Date("2024-01-01T09:00:00Z"),
            updatedAt: new Date("2024-01-01T09:30:00Z"),
        },
        visibility: {
            id: BigInt(777888999),
            momentId: BigInt(123456789),
            level: "public",
            allowedUsers: [],
            blockedUsers: [],
            ageRestriction: false,
            contentWarning: false,
            createdAt: new Date("2024-01-01T09:00:00Z"),
            updatedAt: new Date("2024-01-01T10:00:00Z"),
        },
        metrics: {
            id: BigInt(101112131),
            momentId: BigInt(123456789),
            totalViews: 1000,
            uniqueViews: 800,
            repeatViews: 200,
            completionViews: 600,
            averageWatchTime: 15.5,
            averageCompletionRate: 0.75,
            bounceRate: 0.2,
            totalLikes: 50,
            totalComments: 25,
            totalReports: 2,
            likeRate: 0.05,
            commentRate: 0.025,
            reportRate: 0.002,
            loadTime: 2.5,
            bufferTime: 0.5,
            errorRate: 0.01,
            qualitySwitches: 3,
            viralScore: 75.5,
            trendingScore: 60.0,
            reachScore: 80.0,
            influenceScore: 70.0,
            growthRate: 0.15,
            totalReach: 1200,
            contentQualityScore: 85.0,
            audioQualityScore: 90.0,
            videoQualityScore: 80.0,
            faceDetectionRate: 0.95,
            lastMetricsUpdate: new Date("2024-01-01T11:00:00Z"),
            metricsVersion: "1.0.0",
            dataQuality: 95.0,
            confidenceLevel: 90.0,
            createdAt: new Date("2024-01-01T09:00:00Z"),
            updatedAt: new Date("2024-01-01T11:00:00Z"),
        },
        context: {
            id: BigInt(141516171),
            momentId: BigInt(123456789),
            createdAt: new Date("2024-01-01T09:00:00Z"),
            updatedAt: new Date("2024-01-01T10:00:00Z"),
            device: {
                id: BigInt(181920212),
                contextId: BigInt(141516171),
                type: "mobile",
                os: "iOS",
                osVersion: "17.0",
                model: "iPhone 15 Pro",
                screenResolution: "1170x2532",
                orientation: "portrait",
                createdAt: new Date("2024-01-01T09:00:00Z"),
                updatedAt: new Date("2024-01-01T10:00:00Z"),
            },
            location: {
                id: BigInt(232425262),
                momentId: BigInt(123456789),
                latitude: -23.5505,
                longitude: -46.6333,
                accuracy: 10.0,
                altitude: 760.0,
                heading: 45.0,
                speed: 5.0,
                address: "São Paulo, SP, Brasil",
                city: "São Paulo",
                country: "Brasil",
                createdAt: new Date("2024-01-01T09:00:00Z"),
                updatedAt: new Date("2024-01-01T10:00:00Z"),
            },
        },
        processing: {
            id: BigInt(272829303),
            momentId: BigInt(123456789),
            status: "completed",
            progress: 100,
            error: null,
            startedAt: new Date("2024-01-01T09:00:00Z"),
            completedAt: new Date("2024-01-01T09:15:00Z"),
            estimatedCompletion: new Date("2024-01-01T09:20:00Z"),
            createdAt: new Date("2024-01-01T09:00:00Z"),
            updatedAt: new Date("2024-01-01T09:15:00Z"),
            steps: [
                {
                    id: BigInt(313233343),
                    processingId: BigInt(272829303),
                    name: "video_compression",
                    status: "completed",
                    progress: 100,
                    startedAt: new Date("2024-01-01T09:00:00Z"),
                    completedAt: new Date("2024-01-01T09:05:00Z"),
                    error: null,
                    createdAt: new Date("2024-01-01T09:00:00Z"),
                    updatedAt: new Date("2024-01-01T09:05:00Z"),
                },
                {
                    id: BigInt(353637383),
                    processingId: BigInt(272829303),
                    name: "thumbnail_generation",
                    status: "completed",
                    progress: 100,
                    startedAt: new Date("2024-01-01T09:05:00Z"),
                    completedAt: new Date("2024-01-01T09:10:00Z"),
                    error: null,
                    createdAt: new Date("2024-01-01T09:05:00Z"),
                    updatedAt: new Date("2024-01-01T09:10:00Z"),
                },
            ],
        },
        embedding: {
            id: BigInt(394041424),
            momentId: BigInt(123456789),
            vector: JSON.stringify(new Array(128).fill(0.5)),
            dimension: 128,
            metadata: {
                model: "openai-ada-002",
                version: "1.0",
                created_at: "2024-01-01T09:10:00Z",
            },
            createdAt: new Date("2024-01-01T09:10:00Z"),
            updatedAt: new Date("2024-01-01T09:10:00Z"),
        },
        media: {
            id: BigInt(434445464),
            momentId: BigInt(123456789),
            lowUrl: "https://storage.example.com/videos/low/123456789.mp4",
            mediumUrl: "https://storage.example.com/videos/medium/123456789.mp4",
            highUrl: "https://storage.example.com/videos/high/123456789.mp4",
            storageProvider: "aws",
            bucket: "moment-videos",
            key: "videos/123456789/original.mp4",
            region: "us-east-1",
            createdAt: new Date("2024-01-01T09:00:00Z"),
            updatedAt: new Date("2024-01-01T09:15:00Z"),
        },
        thumbnail: {
            id: BigInt(474849505),
            momentId: BigInt(123456789),
            url: "https://storage.example.com/thumbnails/123456789.jpg",
            width: 360,
            height: 640,
            storageProvider: "aws",
            bucket: "moment-thumbnails",
            key: "thumbnails/123456789.jpg",
            region: "us-east-1",
            createdAt: new Date("2024-01-01T09:10:00Z"),
            updatedAt: new Date("2024-01-01T09:10:00Z"),
        },
    }
}

describe("MomentMapper", () => {
    let mockSequelizeMoment: any

    beforeEach(() => {
        mockSequelizeMoment = createMockSequelizeMoment()
    })

    describe("toDomain", () => {
        it("deve converter modelo Sequelize completo para entidade de domínio", () => {
            const domainMoment = MomentMapper.toDomain(mockSequelizeMoment)

            expect(domainMoment).toBeInstanceOf(DomainMoment)
            expect(domainMoment.id).toBe("123456789")
            expect(domainMoment.ownerId).toBe("owner-123")
            expect(domainMoment.description).toBe("Test moment description")
            expect(domainMoment.hashtags).toEqual(["test", "vlog"])
            expect(domainMoment.mentions).toEqual(["@user1", "@user2"])
        })

        it("deve mapear corretamente o conteúdo do momento", () => {
            const domainMoment = MomentMapper.toDomain(mockSequelizeMoment)

            expect(domainMoment.content).toBeDefined()
            expect(domainMoment.content.duration).toBe(30)
            expect(domainMoment.content.size).toBe(1024 * 1024)
            expect(domainMoment.content.format).toBe("mp4")
            expect(domainMoment.content.hasAudio).toBe(true)
            expect(domainMoment.content.codec).toBe("h264")
            expect(domainMoment.content.resolution.width).toBe(720)
            expect(domainMoment.content.resolution.height).toBe(1280)
            expect(domainMoment.content.resolution.quality).toBe("medium")
        })

        it("deve mapear corretamente o status do momento", () => {
            const domainMoment = MomentMapper.toDomain(mockSequelizeMoment)

            expect(domainMoment.status).toBeDefined()
            expect(domainMoment.status.current).toBe("published")
            expect(domainMoment.status.previous).toBe("under_review")
            expect(domainMoment.status.reason).toBe("Approved by moderator")
            expect(domainMoment.status.changedBy).toBe("moderator-123")
            expect(domainMoment.status.changedAt).toEqual(new Date("2024-01-01T09:30:00Z"))
        })

        it("deve mapear corretamente a visibilidade do momento", () => {
            const domainMoment = MomentMapper.toDomain(mockSequelizeMoment)

            expect(domainMoment.visibility).toBeDefined()
            expect(domainMoment.visibility.level).toBe("public")
            expect(domainMoment.visibility.allowedUsers).toEqual([])
            expect(domainMoment.visibility.blockedUsers).toEqual([])
            expect(domainMoment.visibility.ageRestriction).toBe(false)
            expect(domainMoment.visibility.contentWarning).toBe(false)
        })

        it("deve mapear corretamente as métricas do momento", () => {
            const domainMoment = MomentMapper.toDomain(mockSequelizeMoment)

            expect(domainMoment.metrics).toBeDefined()
            expect(domainMoment.metrics.views.totalViews).toBe(1000)
            expect(domainMoment.metrics.views.uniqueViews).toBe(800)
            expect(domainMoment.metrics.engagement.totalLikes).toBe(50)
            expect(domainMoment.metrics.engagement.totalComments).toBe(25)
            expect(domainMoment.metrics.viral.viralScore).toBe(75.5)
            expect(domainMoment.metrics.content.contentQualityScore).toBe(85.0)
        })

        it("deve mapear corretamente o contexto e dispositivo", () => {
            const domainMoment = MomentMapper.toDomain(mockSequelizeMoment)

            expect(domainMoment.context).toBeDefined()
            expect(domainMoment.context.device.type).toBe("mobile")
            expect(domainMoment.context.device.os).toBe("iOS")
            expect(domainMoment.context.device.model).toBe("iPhone 15 Pro")
            expect(domainMoment.context.location.latitude).toBe(-23.5505)
            expect(domainMoment.context.location.longitude).toBe(-46.6333)
        })

        it("deve mapear corretamente o processamento e seus passos", () => {
            const domainMoment = MomentMapper.toDomain(mockSequelizeMoment)

            expect(domainMoment.processing).toBeDefined()
            expect(domainMoment.processing.status).toBe("completed")
            expect(domainMoment.processing.progress).toBe(100)
            expect(domainMoment.processing.steps).toHaveLength(2)
            expect(domainMoment.processing.steps[0].name).toBe("video_compression")
            expect(domainMoment.processing.steps[1].name).toBe("thumbnail_generation")
        })

        it("deve mapear corretamente o embedding", () => {
            const domainMoment = MomentMapper.toDomain(mockSequelizeMoment)

            expect(domainMoment.embedding).toBeDefined()
            expect(domainMoment.embedding.vector).toBe(JSON.stringify(new Array(128).fill(0.5)))
            expect(domainMoment.embedding.dimension).toBe(128)
            expect(domainMoment.embedding.metadata.model).toBe("openai-ada-002")
        })

        it("deve mapear corretamente a mídia", () => {
            const domainMoment = MomentMapper.toDomain(mockSequelizeMoment)

            expect(domainMoment.media).toBeDefined()
            expect(domainMoment.media.urls.low).toBe(
                "https://storage.example.com/videos/low/123456789.mp4",
            )
            expect(domainMoment.media.urls.medium).toBe(
                "https://storage.example.com/videos/medium/123456789.mp4",
            )
            expect(domainMoment.media.urls.high).toBe(
                "https://storage.example.com/videos/high/123456789.mp4",
            )
            expect(domainMoment.media.storage.provider).toBe("aws")
            expect(domainMoment.media.storage.bucket).toBe("moment-videos")
        })

        it("deve mapear corretamente o thumbnail", () => {
            const domainMoment = MomentMapper.toDomain(mockSequelizeMoment)

            expect(domainMoment.thumbnail).toBeDefined()
            expect(domainMoment.thumbnail.url).toBe(
                "https://storage.example.com/thumbnails/123456789.jpg",
            )
            expect(domainMoment.thumbnail.width).toBe(360)
            expect(domainMoment.thumbnail.height).toBe(640)
            expect(domainMoment.thumbnail.storage.provider).toBe("aws")
        })

        it("deve mapear corretamente a localização", () => {
            const domainMoment = MomentMapper.toDomain(mockSequelizeMoment)

            expect(domainMoment.context.location).toBeDefined()
            expect(domainMoment.context.location.latitude).toBe(-23.5505)
            expect(domainMoment.context.location.longitude).toBe(-46.6333)
        })

        it("deve fornecer valores padrão quando campos opcionais estão ausentes", () => {
            const minimalMoment = {
                id: BigInt(123456789),
                ownerId: "owner-123",
                description: "Minimal moment",
                hashtags: [],
                mentions: [],
                publishedAt: null,
                archivedAt: null,
                deletedAt: null,
                createdAt: new Date("2024-01-01T09:00:00Z"),
                updatedAt: new Date("2024-01-01T10:00:00Z"),
            }

            const domainMoment = MomentMapper.toDomain(minimalMoment)

            expect(domainMoment.content).toBeDefined()
            expect(domainMoment.content.duration).toBe(0)
            expect(domainMoment.content.format).toBe("mp4")
            expect(domainMoment.content.hasAudio).toBe(false)
            expect(domainMoment.content.resolution.width).toBe(0)
            expect(domainMoment.content.resolution.height).toBe(0)
            expect(domainMoment.content.resolution.quality).toBe("medium")
        })

        it("deve converter IDs bigint para string corretamente", () => {
            const domainMoment = MomentMapper.toDomain(mockSequelizeMoment)

            expect(typeof domainMoment.id).toBe("string")
            expect(domainMoment.id).toBe("123456789")
        })

        it("deve lidar com arrays vazios para hashtags e mentions", () => {
            const momentWithEmptyArrays = createMockSequelizeMoment({
                hashtags: [],
                mentions: [],
            })

            const domainMoment = MomentMapper.toDomain(momentWithEmptyArrays)

            expect(domainMoment.hashtags).toEqual([])
            expect(domainMoment.mentions).toEqual([])
        })

        it("deve lidar com valores null para campos opcionais", () => {
            const momentWithNulls = createMockSequelizeMoment({
                publishedAt: null,
                archivedAt: null,
                deletedAt: null,
            })

            const domainMoment = MomentMapper.toDomain(momentWithNulls)

            expect(domainMoment.publishedAt).toBeNull()
            expect(domainMoment.archivedAt).toBeNull()
            expect(domainMoment.deletedAt).toBeNull()
        })
    })

    describe("toMomentModelAttributes", () => {
        it("deve converter entidade de domínio para atributos do modelo principal", () => {
            const domainMoment = MomentMapper.toDomain(mockSequelizeMoment)
            const attributes = MomentMapper.toMomentModelAttributes(domainMoment)

            expect(attributes).toEqual({
                id: BigInt("123456789"),
                ownerId: "owner-123",
                description: "Test moment description",
                hashtags: ["test", "vlog"],
                mentions: ["@user1", "@user2"],
                publishedAt: new Date("2024-01-01T10:00:00Z"),
                archivedAt: null,
                deletedAt: null,
                createdAt: new Date("2024-01-01T09:00:00Z"),
                updatedAt: new Date("2024-01-01T10:00:00Z"),
            })
        })

        it("deve converter ID string para bigint corretamente", () => {
            const domainMoment = MomentMapper.toDomain(mockSequelizeMoment)
            const attributes = MomentMapper.toMomentModelAttributes(domainMoment)

            expect(typeof attributes.id).toBe("bigint")
            expect(attributes.id).toBe(BigInt("123456789"))
        })
    })

    describe("toMomentContentAttributes", () => {
        it("deve converter conteúdo do momento para atributos do modelo", () => {
            const domainMoment = MomentMapper.toDomain(mockSequelizeMoment)
            const attributes = MomentMapper.toMomentContentAttributes(domainMoment)

            expect(attributes).toEqual({
                momentId: BigInt("123456789"),
                duration: 30,
                size: 1024 * 1024,
                format: "mp4",
                hasAudio: true,
                codec: "h264",
            })
        })

        it("deve retornar valores padrão quando conteúdo está ausente", () => {
            const minimalMoment = {
                id: BigInt(123456789),
                ownerId: "owner-123",
                description: "Minimal moment",
                hashtags: [],
                mentions: [],
                publishedAt: null,
                archivedAt: null,
                deletedAt: null,
                createdAt: new Date("2024-01-01T09:00:00Z"),
                updatedAt: new Date("2024-01-01T10:00:00Z"),
            }

            const domainMoment = MomentMapper.toDomain(minimalMoment)
            const attributes = MomentMapper.toMomentContentAttributes(domainMoment)

            expect(attributes).toEqual({
                momentId: BigInt("123456789"),
                duration: 0,
                size: 0,
                format: "mp4",
                hasAudio: false,
                codec: "h264",
            })
        })
    })

    describe("toMomentResolutionAttributes", () => {
        it("deve converter resolução do conteúdo para atributos do modelo", () => {
            const domainMoment = MomentMapper.toDomain(mockSequelizeMoment)
            const attributes = MomentMapper.toMomentResolutionAttributes(domainMoment)

            expect(attributes).toEqual({
                width: 720,
                height: 1280,
                quality: "medium",
            })
        })

        it("deve retornar valores padrão quando resolução está ausente", () => {
            const momentWithoutResolution = createMockSequelizeMoment({
                content: {
                    ...createMockSequelizeMoment().content,
                    resolution: undefined,
                },
            })

            const domainMoment = MomentMapper.toDomain(momentWithoutResolution)
            const attributes = MomentMapper.toMomentResolutionAttributes(domainMoment)

            expect(attributes).toEqual({
                width: 720,
                height: 1280,
                quality: "medium",
            })
        })
    })

    describe("toMomentStatusAttributes", () => {
        it("deve converter status do momento para atributos do modelo", () => {
            const domainMoment = MomentMapper.toDomain(mockSequelizeMoment)
            const attributes = MomentMapper.toMomentStatusAttributes(domainMoment)

            expect(attributes).toEqual({
                momentId: BigInt("123456789"),
                current: "published",
                previousStatus: "under_review",
                reason: "Approved by moderator",
                changedBy: "moderator-123",
                changedAt: new Date("2024-01-01T09:30:00Z"),
            })
        })

        it("deve retornar valores padrão quando status está ausente", () => {
            const momentWithoutStatus = createMockSequelizeMoment({
                status: undefined,
            })

            const domainMoment = MomentMapper.toDomain(momentWithoutStatus)
            const attributes = MomentMapper.toMomentStatusAttributes(domainMoment)

            expect(attributes).toEqual({
                momentId: BigInt("123456789"),
                current: "published",
                previousStatus: "under_review",
                reason: "Approved by moderator",
                changedBy: "moderator-123",
                changedAt: new Date("2024-01-01T09:30:00Z"),
            })
        })
    })

    describe("toMomentVisibilityAttributes", () => {
        it("deve converter visibilidade do momento para atributos do modelo", () => {
            const domainMoment = MomentMapper.toDomain(mockSequelizeMoment)
            const attributes = MomentMapper.toMomentVisibilityAttributes(domainMoment)

            expect(attributes).toEqual({
                momentId: BigInt("123456789"),
                level: "public",
                allowedUsers: [],
                blockedUsers: [],
                ageRestriction: false,
                contentWarning: false,
            })
        })

        it("deve retornar valores padrão quando visibilidade está ausente", () => {
            const momentWithoutVisibility = createMockSequelizeMoment({
                visibility: undefined,
            })

            const domainMoment = MomentMapper.toDomain(momentWithoutVisibility)
            const attributes = MomentMapper.toMomentVisibilityAttributes(domainMoment)

            expect(attributes).toEqual({
                momentId: BigInt("123456789"),
                level: "public",
                allowedUsers: [],
                blockedUsers: [],
                ageRestriction: false,
                contentWarning: false,
            })
        })
    })

    describe("toMomentMetricsAttributes", () => {
        it("deve converter métricas do momento para atributos do modelo", () => {
            const domainMoment = MomentMapper.toDomain(mockSequelizeMoment)
            const attributes = MomentMapper.toMomentMetricsAttributes(domainMoment)

            expect(attributes).toEqual({
                momentId: BigInt("123456789"),
                totalViews: 1000,
                uniqueViews: 800,
                repeatViews: 200,
                completionViews: 600,
                averageWatchTime: 15.5,
                averageCompletionRate: 0.75,
                bounceRate: 0.2,
                totalLikes: 50,
                totalComments: 25,
                totalReports: 2,
                likeRate: 0.05,
                commentRate: 0.025,
                reportRate: 0.002,
                loadTime: 2.5,
                bufferTime: 0.5,
                errorRate: 0.01,
                qualitySwitches: 3,
                viralScore: 75.5,
                trendingScore: 60.0,
                reachScore: 80.0,
                influenceScore: 70.0,
                growthRate: 0.15,
                totalReach: 1200,
                contentQualityScore: 85.0,
                audioQualityScore: 90.0,
                videoQualityScore: 80.0,
                faceDetectionRate: 0.95,
                lastMetricsUpdate: new Date("2024-01-01T11:00:00Z"),
                metricsVersion: "1.0.0",
                dataQuality: 95.0,
                confidenceLevel: 90.0,
            })
        })

        it("deve retornar valores padrão quando métricas estão ausentes", () => {
            const momentWithoutMetrics = createMockSequelizeMoment({
                metrics: undefined,
            })

            const domainMoment = MomentMapper.toDomain(momentWithoutMetrics)
            const attributes = MomentMapper.toMomentMetricsAttributes(domainMoment)

            expect(attributes).toEqual({
                momentId: BigInt("123456789"),
                totalViews: 1000,
                uniqueViews: 800,
                repeatViews: 200,
                completionViews: 600,
                averageWatchTime: 15.5,
                averageCompletionRate: 0.75,
                bounceRate: 0.2,
                totalLikes: 50,
                totalComments: 25,
                totalReports: 2,
                likeRate: 0.05,
                commentRate: 0.025,
                reportRate: 0.002,
                loadTime: 2.5,
                bufferTime: 0.5,
                errorRate: 0.01,
                qualitySwitches: 3,
                viralScore: 75.5,
                trendingScore: 60.0,
                reachScore: 80.0,
                influenceScore: 70.0,
                growthRate: 0.15,
                totalReach: 1200,
                contentQualityScore: 85.0,
                audioQualityScore: 90.0,
                videoQualityScore: 80.0,
                faceDetectionRate: 0.95,
                lastMetricsUpdate: new Date("2024-01-01T11:00:00Z"),
                metricsVersion: "1.0.0",
                dataQuality: 95.0,
                confidenceLevel: 90.0,
            })
        })
    })

    describe("toMomentContextAttributes", () => {
        it("deve converter contexto do momento para atributos do modelo", () => {
            const domainMoment = MomentMapper.toDomain(mockSequelizeMoment)
            const attributes = MomentMapper.toMomentContextAttributes(domainMoment)

            expect(attributes).toEqual({
                momentId: BigInt("123456789"),
            })
        })

        it("deve retornar valores padrão quando contexto está ausente", () => {
            const momentWithoutContext = createMockSequelizeMoment({
                context: undefined,
            })

            const domainMoment = MomentMapper.toDomain(momentWithoutContext)
            const attributes = MomentMapper.toMomentContextAttributes(domainMoment)

            expect(attributes).toEqual({
                momentId: BigInt("123456789"),
            })
        })
    })

    describe("toMomentDeviceAttributes", () => {
        it("deve converter dispositivo do momento para atributos do modelo", () => {
            const domainMoment = MomentMapper.toDomain(mockSequelizeMoment)
            const attributes = MomentMapper.toMomentDeviceAttributes(domainMoment)

            expect(attributes).toEqual({
                type: "mobile",
                os: "iOS",
                osVersion: "17.0",
                model: "iPhone 15 Pro",
                screenResolution: "1170x2532",
                orientation: "portrait",
            })
        })

        it("deve retornar valores padrão quando dispositivo está ausente", () => {
            const momentWithoutDevice = createMockSequelizeMoment({
                context: {
                    ...createMockSequelizeMoment().context,
                    device: undefined,
                },
            })

            const domainMoment = MomentMapper.toDomain(momentWithoutDevice)
            const attributes = MomentMapper.toMomentDeviceAttributes(domainMoment)

            expect(attributes).toEqual({
                type: "mobile",
                os: "iOS",
                osVersion: "17.0",
                model: "iPhone 15 Pro",
                screenResolution: "1170x2532",
                orientation: "portrait",
            })
        })
    })

    describe("toMomentLocationAttributes", () => {
        it("deve converter localização do momento para atributos do modelo", () => {
            const domainMoment = MomentMapper.toDomain(mockSequelizeMoment)
            const attributes = MomentMapper.toMomentLocationAttributes(domainMoment)

            expect(attributes).toEqual({
                momentId: BigInt("123456789"),
                latitude: -23.5505,
                longitude: -46.6333,
            })
        })

        it("deve retornar valores padrão quando localização está ausente", () => {
            const momentWithoutLocation = createMockSequelizeMoment({
                context: {
                    ...createMockSequelizeMoment().context,
                    location: undefined,
                },
            })

            const domainMoment = MomentMapper.toDomain(momentWithoutLocation)
            const attributes = MomentMapper.toMomentLocationAttributes(domainMoment)

            expect(attributes).toEqual({
                momentId: BigInt("123456789"),
                latitude: -23.5505,
                longitude: -46.6333,
            })
        })
    })

    describe("toMomentProcessingAttributes", () => {
        it("deve converter processamento do momento para atributos do modelo", () => {
            const domainMoment = MomentMapper.toDomain(mockSequelizeMoment)
            const attributes = MomentMapper.toMomentProcessingAttributes(domainMoment)

            expect(attributes).toEqual({
                momentId: BigInt("123456789"),
                status: "completed",
                progress: 100,
                error: null,
                startedAt: new Date("2024-01-01T09:00:00Z"),
                completedAt: new Date("2024-01-01T09:15:00Z"),
                estimatedCompletion: new Date("2024-01-01T09:20:00Z"),
            })
        })

        it("deve retornar valores padrão quando processamento está ausente", () => {
            const momentWithoutProcessing = createMockSequelizeMoment({
                processing: undefined,
            })

            const domainMoment = MomentMapper.toDomain(momentWithoutProcessing)
            const attributes = MomentMapper.toMomentProcessingAttributes(domainMoment)

            expect(attributes).toEqual({
                momentId: BigInt("123456789"),
                status: "completed",
                progress: 100,
                error: null,
                startedAt: new Date("2024-01-01T09:00:00Z"),
                completedAt: new Date("2024-01-01T09:15:00Z"),
                estimatedCompletion: new Date("2024-01-01T09:20:00Z"),
            })
        })
    })

    describe("toMomentProcessingStepAttributes", () => {
        it("deve converter passos de processamento para atributos do modelo", () => {
            const domainMoment = MomentMapper.toDomain(mockSequelizeMoment)
            const attributes = MomentMapper.toMomentProcessingStepAttributes(domainMoment)

            expect(attributes).toHaveLength(2)
            expect(attributes[0]).toEqual({
                name: "video_compression",
                status: "completed",
                progress: 100,
                startedAt: new Date("2024-01-01T09:00:00Z"),
                completedAt: new Date("2024-01-01T09:05:00Z"),
                error: null,
            })
            expect(attributes[1]).toEqual({
                name: "thumbnail_generation",
                status: "completed",
                progress: 100,
                startedAt: new Date("2024-01-01T09:05:00Z"),
                completedAt: new Date("2024-01-01T09:10:00Z"),
                error: null,
            })
        })

        it("deve retornar valores padrão quando passos de processamento estão ausentes", () => {
            const momentWithoutSteps = createMockSequelizeMoment({
                processing: {
                    ...createMockSequelizeMoment().processing,
                    steps: undefined,
                },
            })

            const domainMoment = MomentMapper.toDomain(momentWithoutSteps)
            const attributes = MomentMapper.toMomentProcessingStepAttributes(domainMoment)

            expect(attributes).toEqual([
                {
                    name: "video_compression",
                    status: "completed",
                    progress: 100,
                    startedAt: new Date("2024-01-01T09:00:00Z"),
                    completedAt: new Date("2024-01-01T09:05:00Z"),
                    error: null,
                },
                {
                    name: "thumbnail_generation",
                    status: "completed",
                    progress: 100,
                    startedAt: new Date("2024-01-01T09:05:00Z"),
                    completedAt: new Date("2024-01-01T09:10:00Z"),
                    error: null,
                },
            ])
        })
    })

    describe("toMomentEmbeddingAttributes", () => {
        it("deve converter embedding do momento para atributos do modelo", () => {
            const domainMoment = MomentMapper.toDomain(mockSequelizeMoment)
            const attributes = MomentMapper.toMomentEmbeddingAttributes(domainMoment)

            expect(attributes).toEqual({
                momentId: BigInt("123456789"),
                vector: JSON.stringify(new Array(128).fill(0.5)),
                dimension: 128,
                metadata: {
                    model: "openai-ada-002",
                    version: "1.0",
                    created_at: "2024-01-01T09:10:00Z",
                },
            })
        })

        it("deve retornar valores padrão quando embedding está ausente", () => {
            const momentWithoutEmbedding = createMockSequelizeMoment({
                embedding: undefined,
            })

            const domainMoment = MomentMapper.toDomain(momentWithoutEmbedding)
            const attributes = MomentMapper.toMomentEmbeddingAttributes(domainMoment)

            expect(attributes).toEqual({
                momentId: BigInt("123456789"),
                vector: JSON.stringify(new Array(128).fill(0.5)),
                dimension: 128,
                metadata: {
                    model: "openai-ada-002",
                    version: "1.0",
                    created_at: "2024-01-01T09:10:00Z",
                },
            })
        })
    })

    describe("toMomentMediaAttributes", () => {
        it("deve converter mídia do momento para atributos do modelo", () => {
            const domainMoment = MomentMapper.toDomain(mockSequelizeMoment)
            const attributes = MomentMapper.toMomentMediaAttributes(domainMoment)

            expect(attributes).toEqual({
                momentId: BigInt("123456789"),
                lowUrl: "https://storage.example.com/videos/low/123456789.mp4",
                mediumUrl: "https://storage.example.com/videos/medium/123456789.mp4",
                highUrl: "https://storage.example.com/videos/high/123456789.mp4",
                storageProvider: "aws",
                bucket: "moment-videos",
                key: "videos/123456789/original.mp4",
                region: "us-east-1",
            })
        })

        it("deve retornar valores padrão quando mídia está ausente", () => {
            const momentWithoutMedia = createMockSequelizeMoment({
                media: undefined,
            })

            const domainMoment = MomentMapper.toDomain(momentWithoutMedia)
            const attributes = MomentMapper.toMomentMediaAttributes(domainMoment)

            expect(attributes).toEqual({
                momentId: BigInt("123456789"),
                lowUrl: "https://storage.example.com/videos/low/123456789.mp4",
                mediumUrl: "https://storage.example.com/videos/medium/123456789.mp4",
                highUrl: "https://storage.example.com/videos/high/123456789.mp4",
                storageProvider: "aws",
                bucket: "moment-videos",
                key: "videos/123456789/original.mp4",
                region: "us-east-1",
            })
        })
    })

    describe("toMomentThumbnailAttributes", () => {
        it("deve converter thumbnail do momento para atributos do modelo", () => {
            const domainMoment = MomentMapper.toDomain(mockSequelizeMoment)
            const attributes = MomentMapper.toMomentThumbnailAttributes(domainMoment)

            expect(attributes).toEqual({
                momentId: BigInt("123456789"),
                url: "https://storage.example.com/thumbnails/123456789.jpg",
                width: 360,
                height: 640,
                storageProvider: "aws",
                bucket: "moment-thumbnails",
                key: "thumbnails/123456789.jpg",
                region: "us-east-1",
            })
        })

        it("deve retornar valores padrão quando thumbnail está ausente", () => {
            const momentWithoutThumbnail = createMockSequelizeMoment({
                thumbnail: undefined,
            })

            const domainMoment = MomentMapper.toDomain(momentWithoutThumbnail)
            const attributes = MomentMapper.toMomentThumbnailAttributes(domainMoment)

            expect(attributes).toEqual({
                momentId: BigInt("123456789"),
                url: "https://storage.example.com/thumbnails/123456789.jpg",
                width: 360,
                height: 640,
                storageProvider: "aws",
                bucket: "moment-thumbnails",
                key: "thumbnails/123456789.jpg",
                region: "us-east-1",
            })
        })
    })

    describe("toDomainArray", () => {
        it("deve converter array de modelos Sequelize para array de entidades de domínio", () => {
            const moment1 = createMockSequelizeMoment({ id: BigInt(111), description: "Moment 1" })
            const moment2 = createMockSequelizeMoment({ id: BigInt(222), description: "Moment 2" })
            const moment3 = createMockSequelizeMoment({ id: BigInt(333), description: "Moment 3" })

            const domainMoments = MomentMapper.toDomainArray([moment1, moment2, moment3])

            expect(domainMoments).toHaveLength(3)
            expect(domainMoments[0].id).toBe("111")
            expect(domainMoments[0].description).toBe("Moment 1")
            expect(domainMoments[1].id).toBe("222")
            expect(domainMoments[1].description).toBe("Moment 2")
            expect(domainMoments[2].id).toBe("333")
            expect(domainMoments[2].description).toBe("Moment 3")
        })

        it("deve retornar array vazio se receber array vazio", () => {
            const domainMoments = MomentMapper.toDomainArray([])

            expect(domainMoments).toEqual([])
        })

        it("deve manter a ordem dos elementos", () => {
            const moments = Array.from({ length: 10 }, (_, i) =>
                createMockSequelizeMoment({ id: BigInt(i + 1), description: `Moment ${i + 1}` }),
            )

            const domainMoments = MomentMapper.toDomainArray(moments)

            expect(domainMoments).toHaveLength(10)
            domainMoments.forEach((moment, index) => {
                expect(moment.id).toBe((index + 1).toString())
                expect(moment.description).toBe(`Moment ${index + 1}`)
            })
        })
    })

    describe("Performance e otimização", () => {
        it("deve mapear rapidamente um grande número de momentos", () => {
            const startTime = Date.now()
            const largeArray = Array.from({ length: 1000 }, (_, i) =>
                createMockSequelizeMoment({ id: BigInt(i + 1) }),
            )

            const domainMoments = MomentMapper.toDomainArray(largeArray)
            const endTime = Date.now()

            expect(domainMoments).toHaveLength(1000)
            expect(endTime - startTime).toBeLessThan(1000) // Deve ser rápido (< 1 segundo)
        })

        it("deve usar memória eficientemente para grandes volumes", () => {
            const moments = Array.from({ length: 100 }, (_, i) =>
                createMockSequelizeMoment({ id: BigInt(i + 1) }),
            )

            // Simular múltiplas operações de mapeamento
            for (let i = 0; i < 10; i++) {
                const domainMoments = MomentMapper.toDomainArray(moments)
                expect(domainMoments).toHaveLength(100)
            }
        })
    })
})
