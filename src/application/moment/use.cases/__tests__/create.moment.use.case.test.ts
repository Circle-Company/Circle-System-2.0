import { beforeEach, describe, expect, it, vi } from "vitest"
import { CreateMomentRequest, CreateMomentUseCase } from "../create.moment.use.case"

describe("CreateMomentUseCase", () => {
    let createMomentUseCase: CreateMomentUseCase
    let mockMomentService: any
    let mockUserRepository: any

    const mockUser = {
        id: "user_123",
        username: "testuser",
        canCreateMoments: vi.fn().mockReturnValue(true),
    }

    const mockMoment = {
        id: "moment_123",
        ownerId: "user_123",
        description: "Test moment",
    }

    const validRequest: CreateMomentRequest = {
        ownerId: "user_123",
        videoData: Buffer.from("video data"),
        videoMetadata: {
            filename: "test.mp4",
            mimeType: "video/mp4",
            size: 1024,
        },
        description: "Test moment",
    }

    beforeEach(() => {
        mockUserRepository = {
            findById: vi.fn(),
        } as any

        mockMomentService = {
            createMoment: vi.fn(),
        } as any

        createMomentUseCase = new CreateMomentUseCase(mockMomentService, mockUserRepository)
    })

    describe("execute", () => {
        it("should create moment successfully", async () => {
            // Arrange
            mockUserRepository.findById.mockResolvedValue(mockUser)
            mockMomentService.createMoment.mockResolvedValue(mockMoment)

            // Act
            const result = await createMomentUseCase.execute(validRequest)

            // Assert
            expect(result.success).toBe(true)
            expect(result.moment).toBeDefined()
            expect(mockMomentService.createMoment).toHaveBeenCalled()
        })

        it("should fail when owner ID is not provided", async () => {
            // Arrange
            const request = { ...validRequest, ownerId: "" }

            // Act
            const result = await createMomentUseCase.execute(request)

            // Assert
            expect(result.success).toBe(false)
            expect(result.error).toBe("Owner ID is required")
        })

        it("should fail when user is not found", async () => {
            // Arrange
            mockUserRepository.findById.mockResolvedValue(null)

            // Act
            const result = await createMomentUseCase.execute(validRequest)

            // Assert
            expect(result.success).toBe(false)
            expect(result.error).toBe("Owner not found")
        })

        it("should fail when user cannot create moments", async () => {
            // Arrange
            const restrictedUser = {
                ...mockUser,
                canCreateMoments: vi.fn().mockReturnValue(false),
            }
            mockUserRepository.findById.mockResolvedValue(restrictedUser)

            // Act
            const result = await createMomentUseCase.execute(validRequest)

            // Assert
            expect(result.success).toBe(false)
            expect(result.error).toBe("User does not have permission to create moments")
        })

        it("should fail when video data is not provided", async () => {
            // Arrange
            const request = { ...validRequest, videoData: Buffer.from("") }
            mockUserRepository.findById.mockResolvedValue(mockUser)

            // Act
            const result = await createMomentUseCase.execute(request)

            // Assert
            expect(result.success).toBe(false)
            expect(result.error).toBe("Video data is required")
        })

        it("should fail when video metadata is not provided", async () => {
            // Arrange
            const request = { ...validRequest, videoMetadata: undefined as any }
            mockUserRepository.findById.mockResolvedValue(mockUser)

            // Act
            const result = await createMomentUseCase.execute(request)

            // Assert
            expect(result.success).toBe(false)
            expect(result.error).toBe("Video metadata is required")
        })

        it("should handle service errors gracefully", async () => {
            // Arrange
            mockUserRepository.findById.mockResolvedValue(mockUser)
            mockMomentService.createMoment.mockRejectedValue(new Error("Processing failed"))

            // Act
            const result = await createMomentUseCase.execute(validRequest)

            // Assert
            expect(result.success).toBe(false)
            expect(result.error).toBe("Processing failed")
        })

        it("should create moment with optional properties", async () => {
            // Arrange
            const requestWithOptional = {
                ...validRequest,
                location: {
                    latitude: -23.5505,
                    longitude: -46.6333,
                },
                device: {
                    type: "mobile",
                    os: "iOS",
                    osVersion: "17.0",
                    model: "iPhone 15",
                    screenResolution: "1170x2532",
                    orientation: "portrait",
                },
            }

            mockUserRepository.findById.mockResolvedValue(mockUser)
            mockMomentService.createMoment.mockResolvedValue(mockMoment)

            // Act
            const result = await createMomentUseCase.execute(requestWithOptional)

            // Assert
            expect(result.success).toBe(true)
            expect(mockMomentService.createMoment).toHaveBeenCalledWith(
                expect.objectContaining({
                    location: expect.any(Object),
                    device: expect.any(Object),
                }),
            )
        })
    })
})
