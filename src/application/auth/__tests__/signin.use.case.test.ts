import { AuthLogRepository, AuthLogStatus, AuthLogType, Device } from "../../../domain/auth"
import { InputDto, SignInUseCase } from "../signin.use.case"
import { InvalidCredentialsError, UserInactiveError } from "../../../shared/errors/auth.errors"
import { UserRepository, UserRole, UserStatus } from "../../../domain/user"
import { beforeEach, describe, expect, it, vi } from "vitest"

// Mock do jwtEncoder
vi.mock("@/shared", () => ({
    jwtEncoder: vi.fn().mockResolvedValue("mock-jwt-token"),
}))

describe("SignInUseCase", () => {
    let signInUseCase: SignInUseCase
    let mockUserRepository: UserRepository
    let mockAuthLogRepository: AuthLogRepository
    let mockUser: any

    beforeEach(() => {
        // Reset mocks
        vi.clearAllMocks()

        // Mock do usuário
        mockUser = {
            id: "123",
            name: "Test User",
            email: "test@example.com",
            password: "hashed-password",
            role: UserRole.USER,
            status: UserStatus.ACTIVE,
            validatePassword: vi.fn(),
        }

        // Mock do UserRepository
        mockUserRepository = {
            save: vi.fn(),
            findById: vi.fn(),
            findByEmail: vi.fn(),
            findAll: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
            existsByEmail: vi.fn(),
        } as any

        // Mock do AuthLogRepository
        mockAuthLogRepository = {
            create: vi.fn(),
            findByEmail: vi.fn(),
            findByIpAddress: vi.fn(),
            countFailedAttemptsByEmail: vi.fn(),
            countFailedAttemptsByIp: vi.fn(),
        } as any

        // Instanciar o use case
        signInUseCase = new SignInUseCase(mockUserRepository, mockAuthLogRepository)
    })

    describe("Login bem-sucedido", () => {
        it("deve fazer login com credenciais válidas", async () => {
            // Arrange
            const input: InputDto = {
                email: "test@example.com",
                password: "password123",
                device: Device.WEB,
                logContext: {
                    ip: "192.168.1.1",
                    userAgent: "Mozilla/5.0",
                },
            }

            vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(mockUser)
            vi.mocked(mockUser.validatePassword).mockResolvedValue(true)

            // Act
            const result = await signInUseCase.execute(input)

            // Assert
            expect(result).toEqual({
                token: "mock-jwt-token",
                expiresIn: 3600,
                user: {
                    id: "123",
                    name: "Test User",
                    email: "test@example.com",
                    role: UserRole.USER,
                    status: UserStatus.ACTIVE,
                },
            })

            expect(mockUserRepository.findByEmail).toHaveBeenCalledWith("test@example.com")
            expect(mockUser.validatePassword).toHaveBeenCalledWith("password123")
            expect(vi.mocked(mockAuthLogRepository.create)).toHaveBeenCalledWith({
                email: "test@example.com",
                ipAddress: "192.168.1.1",
                userAgent: "Mozilla/5.0",
                type: AuthLogType.SIGNIN,
                status: AuthLogStatus.SUCCESS,
                deviceType: Device.WEB,
            })
        })

        it("deve fazer login com usuário super_admin", async () => {
            // Arrange
            const superAdminUser = {
                ...mockUser,
                role: UserRole.SUPER_ADMIN,
            }

            const input: InputDto = {
                email: "admin@example.com",
                password: "admin123",
                device: Device.DESKTOP,
            }

            vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(superAdminUser)
            superAdminUser.validatePassword.mockResolvedValue(true)

            // Act
            const result = await signInUseCase.execute(input)

            // Assert
            expect(result.user.role).toBe(UserRole.SUPER_ADMIN)
            expect(result.token).toBe("mock-jwt-token")
        })
    })

    describe("Falhas de autenticação", () => {
        it("deve falhar quando usuário não existe", async () => {
            // Arrange
            const input: InputDto = {
                email: "nonexistent@example.com",
                password: "password123",
                device: Device.WEB,
                logContext: {
                    ip: "192.168.1.1",
                    userAgent: "Mozilla/5.0",
                },
            }

            vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(null)

            // Act & Assert
            await expect(signInUseCase.execute(input)).rejects.toThrow(InvalidCredentialsError)

            expect(vi.mocked(mockAuthLogRepository.create)).toHaveBeenCalledWith({
                email: "nonexistent@example.com",
                ipAddress: "192.168.1.1",
                userAgent: "Mozilla/5.0",
                type: AuthLogType.SIGNIN,
                status: AuthLogStatus.FAILED,
                failureReason: "User not found",
                deviceType: Device.WEB,
            })
        })

        it("deve falhar quando senha está incorreta", async () => {
            // Arrange
            const input: InputDto = {
                email: "test@example.com",
                password: "wrongpassword",
                device: Device.WEB,
                logContext: {
                    ip: "192.168.1.1",
                    userAgent: "Mozilla/5.0",
                },
            }

            vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(mockUser)
            vi.mocked(mockUser.validatePassword).mockResolvedValue(false)

            // Act & Assert
            await expect(signInUseCase.execute(input)).rejects.toThrow(InvalidCredentialsError)

            expect(vi.mocked(mockAuthLogRepository.create)).toHaveBeenCalledWith({
                email: "test@example.com",
                ipAddress: "192.168.1.1",
                userAgent: "Mozilla/5.0",
                type: AuthLogType.SIGNIN,
                status: AuthLogStatus.FAILED,
                failureReason: "Invalid password",
                deviceType: Device.WEB,
            })
        })

        it("deve falhar quando usuário está inativo", async () => {
            // Arrange
            const inactiveUser = {
                ...mockUser,
                status: UserStatus.INACTIVE,
            }

            const input: InputDto = {
                email: "test@example.com",
                password: "password123",
                device: Device.WEB,
                logContext: {
                    ip: "192.168.1.1",
                    userAgent: "Mozilla/5.0",
                },
            }

            vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(inactiveUser)
            inactiveUser.validatePassword.mockResolvedValue(true)

            // Act & Assert
            await expect(signInUseCase.execute(input)).rejects.toThrow(UserInactiveError)

            expect(vi.mocked(mockAuthLogRepository.create)).toHaveBeenCalledWith({
                email: "test@example.com",
                ipAddress: "192.168.1.1",
                userAgent: "Mozilla/5.0",
                type: AuthLogType.SIGNIN,
                status: AuthLogStatus.FAILED,
                failureReason: "User inactive",
                deviceType: Device.WEB,
            })
        })
    })

    describe("Logging sem contexto", () => {
        it("deve funcionar sem logContext", async () => {
            // Arrange
            const input: InputDto = {
                email: "test@example.com",
                password: "password123",
                device: Device.WEB,
                // sem logContext
            }

            vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(mockUser)
            vi.mocked(mockUser.validatePassword).mockResolvedValue(true)

            // Act
            const result = await signInUseCase.execute(input)

            // Assert
            expect(result.token).toBe("mock-jwt-token")
            expect(vi.mocked(mockAuthLogRepository.create)).not.toHaveBeenCalled()
        })

        it("deve funcionar sem AuthLogRepository", async () => {
            // Arrange
            const signInUseCaseWithoutLogRepo = new SignInUseCase(mockUserRepository)
            const input: InputDto = {
                email: "test@example.com",
                password: "password123",
                device: Device.WEB,
                logContext: {
                    ip: "192.168.1.1",
                    userAgent: "Mozilla/5.0",
                },
            }

            vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(mockUser)
            vi.mocked(mockUser.validatePassword).mockResolvedValue(true)

            // Act
            const result = await signInUseCaseWithoutLogRepo.execute(input)

            // Assert
            expect(result.token).toBe("mock-jwt-token")
        })
    })

    describe("Diferentes tipos de device", () => {
        it("deve funcionar com device WEB", async () => {
            // Arrange
            const input: InputDto = {
                email: "test@example.com",
                password: "password123",
                device: Device.WEB,
            }

            vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(mockUser)
            vi.mocked(mockUser.validatePassword).mockResolvedValue(true)

            // Act
            const result = await signInUseCase.execute(input)

            // Assert
            expect(result.token).toBe("mock-jwt-token")
        })

        it("deve funcionar com device DESKTOP", async () => {
            // Arrange
            const input: InputDto = {
                email: "test@example.com",
                password: "password123",
                device: Device.DESKTOP,
            }

            vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(mockUser)
            vi.mocked(mockUser.validatePassword).mockResolvedValue(true)

            // Act
            const result = await signInUseCase.execute(input)

            // Assert
            expect(result.token).toBe("mock-jwt-token")
        })
    })

    describe("Validação de entrada", () => {
        it("deve processar email em lowercase", async () => {
            // Arrange
            const input: InputDto = {
                email: "TEST@EXAMPLE.COM",
                password: "password123",
                device: Device.WEB,
            }

            vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(mockUser)
            vi.mocked(mockUser.validatePassword).mockResolvedValue(true)

            // Act
            await signInUseCase.execute(input)

            // Assert
            expect(mockUserRepository.findByEmail).toHaveBeenCalledWith("TEST@EXAMPLE.COM")
        })
    })
})
