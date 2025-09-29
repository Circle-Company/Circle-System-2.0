import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { Device, Level } from "@/domain/authorization"
import { HttpRequest, HttpResponse } from "@/infra/http"
import { ErrorCode, ValidationError, jwtDecoder } from "@/shared"
import { User } from "@/domain/user/entities/user.entity"
import { UserRepository } from "@/domain/user"
import {
    AuthService,
    AuthServiceImpl,
    AuthMiddleware,
    createAuthMiddleware,
    authMiddleware,
} from "../auth.middleware"
import { AuthenticatedUser } from "../types"

// Mock do jwtDecoder
vi.mock("@/shared", () => ({
    jwtDecoder: vi.fn(),
    ErrorCode: {
        USER_NOT_FOUND: "USER_NOT_FOUND",
        OPERATION_NOT_ALLOWED: "OPERATION_NOT_ALLOWED",
    },
    ValidationError: class ValidationError extends Error {
        public code: string
        constructor(public data: any) {
            super(data.message)
            this.name = "ValidationError"
            this.code = data.code
        }
    },
}))

// Mock do User
const mockUser = {
    id: "user-123",
    username: "testuser",
    status: {
        accessLevel: Level.USER,
        verified: true,
        blocked: false,
        deleted: false,
    },
    toJSON: () => ({
        id: "user-123",
        username: "testuser",
    }),
} as unknown as User

const mockBlockedUser = {
    id: "user-123",
    username: "blockeduser",
    status: {
        accessLevel: Level.USER,
        verified: true,
        blocked: true,
        deleted: false,
    },
    toJSON: () => ({
        id: "user-123",
        username: "blockeduser",
    }),
} as unknown as User

const mockDeletedUser = {
    id: "user-123",
    username: "deleteduser",
    status: {
        accessLevel: Level.USER,
        verified: true,
        blocked: false,
        deleted: true,
    },
    toJSON: () => ({
        id: "user-123",
        username: "deleteduser",
    }),
} as unknown as User

describe("AuthService", () => {
    let mockUserRepository: UserRepository
    let authService: AuthService

    beforeEach(() => {
        mockUserRepository = {
            findById: vi.fn(),
        } as unknown as UserRepository

        authService = new AuthServiceImpl(mockUserRepository)
    })

    afterEach(() => {
        vi.clearAllMocks()
    })

    describe("authenticate", () => {
        it("deve autenticar usuário com sucesso", async () => {
            const mockPayload = {
                sub: "user-123",
                device: Device.WEB,
            }

            vi.mocked(jwtDecoder).mockResolvedValue(mockPayload)
            vi.mocked(mockUserRepository.findById).mockResolvedValue(mockUser)

            const result = await authService.authenticate("valid-token")

            expect(result).toEqual({
                id: "user-123",
                device: Device.WEB,
                level: Level.USER,
            })
            expect(jwtDecoder).toHaveBeenCalledWith("valid-token")
            expect(mockUserRepository.findById).toHaveBeenCalledWith("user-123")
        })

        it("deve lançar erro quando usuário não for encontrado", async () => {
            const mockPayload = {
                sub: "user-123",
                device: Device.WEB,
            }

            vi.mocked(jwtDecoder).mockResolvedValue(mockPayload)
            vi.mocked(mockUserRepository.findById).mockResolvedValue(null)

            await expect(authService.authenticate("valid-token")).rejects.toThrow(ValidationError)
        })

        it("deve lançar erro quando usuário estiver bloqueado", async () => {
            const mockPayload = {
                sub: "user-123",
                device: Device.WEB,
            }

            vi.mocked(jwtDecoder).mockResolvedValue(mockPayload)
            vi.mocked(mockUserRepository.findById).mockResolvedValue(mockBlockedUser)

            await expect(authService.authenticate("valid-token")).rejects.toThrow(ValidationError)
        })

        it("deve lançar erro quando usuário estiver deletado", async () => {
            const mockPayload = {
                sub: "user-123",
                device: Device.WEB,
            }

            vi.mocked(jwtDecoder).mockResolvedValue(mockPayload)
            vi.mocked(mockUserRepository.findById).mockResolvedValue(mockDeletedUser)

            await expect(authService.authenticate("valid-token")).rejects.toThrow(ValidationError)
        })
    })
})

describe("AuthMiddleware", () => {
    let mockAuthService: AuthService
    let authMiddleware: AuthMiddleware
    let mockRequest: HttpRequest
    let mockResponse: HttpResponse

    beforeEach(() => {
        mockAuthService = {
            authenticate: vi.fn(),
        } as unknown as AuthService

        authMiddleware = new AuthMiddleware(mockAuthService)

        mockRequest = {
            headers: {},
            user: undefined,
        } as unknown as HttpRequest

        mockResponse = {
            status: vi.fn().mockReturnThis(),
            send: vi.fn(),
        } as unknown as HttpResponse
    })

    afterEach(() => {
        vi.clearAllMocks()
    })

    describe("execute", () => {
        it("deve autenticar com sucesso quando token válido", async () => {
            const mockAuthenticatedUser: AuthenticatedUser = {
                id: "user-123",
                device: Device.WEB,
                level: Level.USER,
            }

            mockRequest.headers.authorization = "Bearer valid-token"
            vi.mocked(mockAuthService.authenticate).mockResolvedValue(mockAuthenticatedUser)

            await authMiddleware.execute(mockRequest, mockResponse)

            expect(mockAuthService.authenticate).toHaveBeenCalledWith("valid-token")
            expect(mockRequest.user).toEqual(mockAuthenticatedUser)
            expect(mockResponse.status).not.toHaveBeenCalled()
            expect(mockResponse.send).not.toHaveBeenCalled()
        })

        it("deve retornar 401 quando header Authorization não existir", async () => {
            await authMiddleware.execute(mockRequest, mockResponse)

            expect(mockResponse.status).toHaveBeenCalledWith(401)
            expect(mockResponse.send).toHaveBeenCalledWith({
                success: false,
                error: {
                    message: "Token de autenticação necessário",
                    code: "AUTHENTICATION_REQUIRED",
                    timestamp: expect.any(String),
                },
            })
        })

        it("deve retornar 401 quando header Authorization não começar com Bearer", async () => {
            mockRequest.headers.authorization = "Invalid token"

            await authMiddleware.execute(mockRequest, mockResponse)

            expect(mockResponse.status).toHaveBeenCalledWith(401)
            expect(mockResponse.send).toHaveBeenCalledWith({
                success: false,
                error: {
                    message: "Token de autenticação necessário",
                    code: "AUTHENTICATION_REQUIRED",
                    timestamp: expect.any(String),
                },
            })
        })

        it("deve retornar 403 quando ValidationError for lançado", async () => {
            const validationError = new ValidationError({
                message: "Usuário bloqueado",
                code: ErrorCode.OPERATION_NOT_ALLOWED,
            })

            mockRequest.headers.authorization = "Bearer valid-token"
            vi.mocked(mockAuthService.authenticate).mockRejectedValue(validationError)

            await authMiddleware.execute(mockRequest, mockResponse)

            expect(mockResponse.status).toHaveBeenCalledWith(403)
            expect(mockResponse.send).toHaveBeenCalledWith({
                success: false,
                error: {
                    message: "Usuário bloqueado",
                    code: ErrorCode.OPERATION_NOT_ALLOWED,
                    timestamp: expect.any(String),
                },
            })
        })

        it("deve retornar 401 quando erro genérico for lançado", async () => {
            mockRequest.headers.authorization = "Bearer invalid-token"
            vi.mocked(mockAuthService.authenticate).mockRejectedValue(new Error("JWT Error"))

            await authMiddleware.execute(mockRequest, mockResponse)

            expect(mockResponse.status).toHaveBeenCalledWith(401)
            expect(mockResponse.send).toHaveBeenCalledWith({
                success: false,
                error: {
                    message: "Erro de autenticação",
                    code: "AUTH_ERROR",
                    timestamp: expect.any(String),
                },
            })
        })
    })
})

describe("createAuthMiddleware", () => {
    let mockUserRepository: UserRepository

    beforeEach(() => {
        mockUserRepository = {
            findById: vi.fn(),
        } as unknown as UserRepository
    })

    afterEach(() => {
        vi.clearAllMocks()
    })

    it("deve criar middleware com AuthService injetado", () => {
        const middleware = createAuthMiddleware(mockUserRepository)

        expect(middleware).toBeInstanceOf(AuthMiddleware)
    })
})

describe("authMiddleware (deprecated)", () => {
    let mockUserRepository: UserRepository
    let middleware: (request: HttpRequest, response: HttpResponse) => Promise<void>
    let mockRequest: HttpRequest
    let mockResponse: HttpResponse

    beforeEach(() => {
        mockUserRepository = {
            findById: vi.fn(),
        } as unknown as UserRepository

        middleware = authMiddleware(mockUserRepository)

        mockRequest = {
            headers: {},
            user: undefined,
        } as unknown as HttpRequest

        mockResponse = {
            status: vi.fn().mockReturnThis(),
            send: vi.fn(),
        } as unknown as HttpResponse
    })

    afterEach(() => {
        vi.clearAllMocks()
    })

    it("deve autenticar com sucesso quando token válido", async () => {
        const mockPayload = {
            sub: "user-123",
            device: Device.WEB,
        }

        mockRequest.headers.authorization = "Bearer valid-token"
        vi.mocked(jwtDecoder).mockResolvedValue(mockPayload)
        vi.mocked(mockUserRepository.findById).mockResolvedValue(mockUser)

        await middleware(mockRequest, mockResponse)

        expect(jwtDecoder).toHaveBeenCalledWith("valid-token")
        expect(mockUserRepository.findById).toHaveBeenCalledWith("user-123")
        expect(mockRequest.user).toEqual({
            id: "user-123",
            device: Device.WEB,
            level: Level.USER,
        })
        expect(mockResponse.status).not.toHaveBeenCalled()
        expect(mockResponse.send).not.toHaveBeenCalled()
    })

    it("deve retornar 401 quando header Authorization não existir", async () => {
        await middleware(mockRequest, mockResponse)

        expect(mockResponse.status).toHaveBeenCalledWith(401)
        expect(mockResponse.send).toHaveBeenCalledWith({
            success: false,
            error: {
                message: "Token de autenticação necessário",
                code: "AUTHENTICATION_REQUIRED",
                timestamp: expect.any(String),
            },
        })
    })

    it("deve retornar 401 quando usuário não for encontrado", async () => {
        const mockPayload = {
            sub: "user-123",
            device: Device.WEB,
        }

        mockRequest.headers.authorization = "Bearer valid-token"
        vi.mocked(jwtDecoder).mockResolvedValue(mockPayload)
        vi.mocked(mockUserRepository.findById).mockResolvedValue(null)

        await middleware(mockRequest, mockResponse)

        expect(mockResponse.status).toHaveBeenCalledWith(401)
        expect(mockResponse.send).toHaveBeenCalledWith({
            success: false,
            error: {
                message: "Usuário não encontrado",
                code: "USER_NOT_FOUND",
                timestamp: expect.any(String),
            },
        })
    })

    it("deve retornar 403 quando usuário estiver bloqueado", async () => {
        const mockPayload = {
            sub: "user-123",
            device: Device.WEB,
        }

        mockRequest.headers.authorization = "Bearer valid-token"
        vi.mocked(jwtDecoder).mockResolvedValue(mockPayload)
        vi.mocked(mockUserRepository.findById).mockResolvedValue(mockBlockedUser)

        await middleware(mockRequest, mockResponse)

        expect(mockResponse.status).toHaveBeenCalledWith(403)
        expect(mockResponse.send).toHaveBeenCalledWith({
            success: false,
            error: {
                message: "Usuário bloqueado ou deletado pelo sistema",
                code: "USER_BLOCKED",
                timestamp: expect.any(String),
            },
        })
    })

    it("deve retornar 403 quando usuário estiver deletado", async () => {
        const mockPayload = {
            sub: "user-123",
            device: Device.WEB,
        }

        mockRequest.headers.authorization = "Bearer valid-token"
        vi.mocked(jwtDecoder).mockResolvedValue(mockPayload)
        vi.mocked(mockUserRepository.findById).mockResolvedValue(mockDeletedUser)

        await middleware(mockRequest, mockResponse)

        expect(mockResponse.status).toHaveBeenCalledWith(403)
        expect(mockResponse.send).toHaveBeenCalledWith({
            success: false,
            error: {
                message: "Usuário bloqueado ou deletado pelo sistema",
                code: "USER_BLOCKED",
                timestamp: expect.any(String),
            },
        })
    })

    it("deve retornar 401 quando erro de JWT ocorrer", async () => {
        mockRequest.headers.authorization = "Bearer invalid-token"
        vi.mocked(jwtDecoder).mockRejectedValue(new Error("JWT Error"))

        await middleware(mockRequest, mockResponse)

        expect(mockResponse.status).toHaveBeenCalledWith(401)
        expect(mockResponse.send).toHaveBeenCalledWith({
            success: false,
            error: {
                message: "Erro de autenticação",
                code: "AUTH_ERROR",
                timestamp: expect.any(String),
            },
        })
    })
})
