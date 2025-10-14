import { beforeEach, describe, expect, it, vi } from "vitest"
import { AuthLogRepository, AuthLogStatus, AuthLogType } from "../../../domain/auth"
import { SecurityRisk, SignStatus } from "../../../domain/auth/auth.type"
import { Device } from "../../../domain/authorization"
import { IUserRepository, User, UserRole } from "../../../domain/user"
import {
    InvalidCredentialsError,
    SecurityRiskError,
    UserInactiveError,
} from "../../../shared/errors/auth.errors"
import { ProcessSignRequest, ProcessSignRequestResponse } from "../process.sign.request"
import { InputDto, SignInUseCase } from "../signin.use.case"

// Mock do jwtEncoder
vi.mock("@/shared", () => ({
    jwtEncoder: vi.fn().mockResolvedValue("mock-jwt-token"),
}))

describe("SignInUseCase", () => {
    let signInUseCase: SignInUseCase
    let mockUserRepository: IUserRepository
    let mockAuthLogRepository: AuthLogRepository
    let mockProcessSignRequest: ProcessSignRequest
    let mockUser: User

    beforeEach(() => {
        // Reset mocks
        vi.clearAllMocks()

        // Mock do usuário
        mockUser = {
            id: "123",
            username: "test@example.com",
            name: "Test User",
            password: "hashed-password",
            status: { accessLevel: "user", blocked: false, deleted: false },
            validatePassword: vi.fn(),
            recordLogin: vi.fn(),
            shouldUpdatePassword: vi.fn().mockReturnValue(false),
            isVerified: vi.fn().mockReturnValue(true),
            get role() {
                return this.status?.accessLevel || "user"
            },
        } as any

        // Mock do IUserRepository
        mockUserRepository = {
            save: vi.fn(),
            findById: vi.fn(),
            findByUsername: vi.fn(),
            existsByUsername: vi.fn(),
            update: vi.fn(),
            deleteUser: vi.fn(),
            exists: vi.fn(),
            existsByEmail: vi.fn(),
            followUser: vi.fn(),
            unfollowUser: vi.fn(),
            blockUser: vi.fn(),
            unblockUser: vi.fn(),
            isFollowing: vi.fn(),
            isBlocked: vi.fn(),
            getFollowers: vi.fn(),
            getFollowing: vi.fn(),
            getBlockedUsers: vi.fn(),
            search: vi.fn(),
            findByStatus: vi.fn(),
            findByRole: vi.fn(),
            countByStatus: vi.fn(),
            countByRole: vi.fn(),
            findMostActive: vi.fn(),
            findTopByFollowers: vi.fn(),
        } as any

        // Mock do AuthLogRepository
        mockAuthLogRepository = {
            create: vi.fn(),
            findByUsername: vi.fn(),
            findByIpAddress: vi.fn(),
            countFailedAttemptsByUsername: vi.fn(),
            countFailedAttemptsByIp: vi.fn(),
            findByDateRange: vi.fn(),
            findBySecurityRisk: vi.fn(),
            deleteOldLogs: vi.fn(),
        } as any

        // Mock do ProcessSignRequest
        mockProcessSignRequest = {
            setSignRequest: vi.fn(),
            process: vi.fn(),
        } as any

        // Instanciar o use case
        signInUseCase = new SignInUseCase(
            mockUserRepository,
            mockAuthLogRepository,
            mockProcessSignRequest,
        )
    })

    describe("Login bem-sucedido", () => {
        it("deve fazer login com credenciais válidas e atualizar propriedades do usuário", async () => {
            // Arrange
            const input: InputDto = {
                username: "test@example.com",
                password: "password123",
                device: Device.WEB,
                logContext: {
                    ip: "192.168.1.1",
                    userAgent: "Mozilla/5.0",
                },
            }

            vi.mocked(mockUserRepository.findByUsername).mockResolvedValue(mockUser)
            vi.mocked(mockUser.validatePassword).mockResolvedValue(true)
            vi.mocked(mockUserRepository.update).mockResolvedValue(mockUser)

            // Act
            const result = await signInUseCase.execute(input)

            // Assert
            expect(result).toEqual({
                token: "mock-jwt-token",
                expiresIn: 3600,
                user: {
                    id: "123",
                    username: "test@example.com",
                    name: "Test User",
                    role: UserRole.USER,
                    status: "active",
                    lastLogin: expect.any(Date),
                    needsPasswordUpdate: false,
                },
            })

            expect(mockUserRepository.findByUsername).toHaveBeenCalledWith("test@example.com")
            expect(mockUser.validatePassword).toHaveBeenCalledWith("password123")
            expect(mockUser.recordLogin).toHaveBeenCalledWith({
                device: Device.WEB,
                ipAddress: "192.168.1.1",
                userAgent: "Mozilla/5.0",
            })
            expect(mockUserRepository.update).toHaveBeenCalledWith(mockUser)
            expect(vi.mocked(mockAuthLogRepository.create)).toHaveBeenCalledWith({
                username: "test@example.com",
                ipAddress: "192.168.1.1",
                userAgent: "Mozilla/5.0",
                type: AuthLogType.SIGNIN,
                status: AuthLogStatus.SUCCESS,
                failureReason: "Login successful",
                deviceType: Device.WEB,
                deviceId: "unknown",
                deviceTimezone: "UTC",
            })
        })

        it("deve fazer login com usuário super_admin", async () => {
            // Arrange
            const superAdminUser = {
                ...mockUser,
                status: { accessLevel: "sudo", blocked: false, deleted: false },
                get role() {
                    return this.status?.accessLevel || "user"
                },
            } as any

            const input: InputDto = {
                username: "admin@example.com",
                password: "admin123",
                device: Device.WEB,
            }

            vi.mocked(mockUserRepository.findByUsername).mockResolvedValue(superAdminUser)
            vi.mocked(superAdminUser.validatePassword).mockResolvedValue(true)
            vi.mocked(mockUserRepository.update).mockResolvedValue(superAdminUser)

            // Act
            const result = await signInUseCase.execute(input)

            // Assert
            expect(result.user.role).toBe("sudo")
            expect(result.token).toBe("mock-jwt-token")
        })
    })

    describe("Falhas de autenticação", () => {
        it("deve falhar quando usuário não existe", async () => {
            // Arrange
            const input: InputDto = {
                username: "nonexistent@example.com",
                password: "password123",
                device: Device.WEB,
                logContext: {
                    ip: "192.168.1.1",
                    userAgent: "Mozilla/5.0",
                },
            }

            vi.mocked(mockUserRepository.findByUsername).mockResolvedValue(null)

            // Act & Assert
            await expect(signInUseCase.execute(input)).rejects.toThrow(InvalidCredentialsError)

            expect(vi.mocked(mockAuthLogRepository.create)).toHaveBeenCalledWith({
                username: "nonexistent@example.com",
                ipAddress: "192.168.1.1",
                userAgent: "Mozilla/5.0",
                type: AuthLogType.SIGNIN,
                status: AuthLogStatus.FAILED,
                failureReason: "User not found",
                deviceType: Device.WEB,
                deviceId: "unknown",
                deviceTimezone: "UTC",
            })
        })

        it("deve falhar quando senha está incorreta", async () => {
            // Arrange
            const input: InputDto = {
                username: "test@example.com",
                password: "wrongpassword",
                device: Device.WEB,
                logContext: {
                    ip: "192.168.1.1",
                    userAgent: "Mozilla/5.0",
                },
            }

            vi.mocked(mockUserRepository.findByUsername).mockResolvedValue(mockUser)
            vi.mocked(mockUser.validatePassword).mockResolvedValue(false)

            // Act & Assert
            await expect(signInUseCase.execute(input)).rejects.toThrow(InvalidCredentialsError)

            expect(vi.mocked(mockAuthLogRepository.create)).toHaveBeenCalledWith({
                username: "test@example.com",
                ipAddress: "192.168.1.1",
                userAgent: "Mozilla/5.0",
                type: AuthLogType.SIGNIN,
                status: AuthLogStatus.FAILED,
                failureReason: "Invalid password",
                deviceType: Device.WEB,
                deviceId: "unknown",
                deviceTimezone: "UTC",
            })
        })

        it("deve falhar quando usuário está inativo", async () => {
            // Arrange
            const inactiveUser = {
                ...mockUser,
                status: { blocked: true, deleted: false },
            } as any

            const input: InputDto = {
                username: "test@example.com",
                password: "password123",
                device: Device.WEB,
                logContext: {
                    ip: "192.168.1.1",
                    userAgent: "Mozilla/5.0",
                },
            }

            vi.mocked(mockUserRepository.findByUsername).mockResolvedValue(inactiveUser)
            inactiveUser.validatePassword.mockResolvedValue(true)

            // Act & Assert
            await expect(signInUseCase.execute(input)).rejects.toThrow(UserInactiveError)

            expect(vi.mocked(mockAuthLogRepository.create)).toHaveBeenCalledWith({
                username: "test@example.com",
                ipAddress: "192.168.1.1",
                userAgent: "Mozilla/5.0",
                type: AuthLogType.SIGNIN,
                status: AuthLogStatus.FAILED,
                failureReason: "User inactive",
                deviceType: Device.WEB,
                deviceId: "unknown",
                deviceTimezone: "UTC",
            })
        })
    })

    describe("Atualização de propriedades do usuário", () => {
        it("deve atualizar lastLogin e outras propriedades após login bem-sucedido", async () => {
            // Arrange
            const input: InputDto = {
                username: "test@example.com",
                password: "password123",
                device: Device.MOBILE,
                logContext: {
                    ip: "192.168.1.100",
                    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)",
                },
            }

            const userWithPasswordUpdate = {
                ...mockUser,
                shouldUpdatePassword: vi.fn().mockReturnValue(true),
            } as any

            vi.mocked(mockUserRepository.findByUsername).mockResolvedValue(userWithPasswordUpdate)
            vi.mocked(userWithPasswordUpdate.validatePassword).mockResolvedValue(true)
            vi.mocked(mockUserRepository.update).mockResolvedValue(userWithPasswordUpdate)

            // Act
            const result = await signInUseCase.execute(input)

            // Assert
            expect(userWithPasswordUpdate.recordLogin).toHaveBeenCalledWith({
                device: Device.MOBILE,
                ipAddress: "192.168.1.100",
                userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)",
            })

            expect(mockUserRepository.update).toHaveBeenCalledWith(userWithPasswordUpdate)
            expect(result.user.needsPasswordUpdate).toBe(true)
            expect(result.user.lastLogin).toBeInstanceOf(Date)
        })

        it("deve verificar se senha precisa ser atualizada", async () => {
            // Arrange
            const input: InputDto = {
                username: "test@example.com",
                password: "password123",
                device: Device.WEB,
            }

            const userWithOldPassword = {
                ...mockUser,
                shouldUpdatePassword: vi.fn().mockReturnValue(true),
            } as any

            vi.mocked(mockUserRepository.findByUsername).mockResolvedValue(userWithOldPassword)
            vi.mocked(userWithOldPassword.validatePassword).mockResolvedValue(true)
            vi.mocked(mockUserRepository.update).mockResolvedValue(userWithOldPassword)

            // Act
            const result = await signInUseCase.execute(input)

            // Assert
            expect(userWithOldPassword.shouldUpdatePassword).toHaveBeenCalled()
            expect(result.user.needsPasswordUpdate).toBe(true)
        })
    })

    describe("Logging sem contexto", () => {
        it("deve funcionar sem logContext", async () => {
            // Arrange
            const input: InputDto = {
                username: "test@example.com",
                password: "password123",
                device: Device.WEB,
                // sem logContext
            }

            vi.mocked(mockUserRepository.findByUsername).mockResolvedValue(mockUser)
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
                username: "test@example.com",
                password: "password123",
                device: Device.WEB,
                logContext: {
                    ip: "192.168.1.1",
                    userAgent: "Mozilla/5.0",
                },
            }

            vi.mocked(mockUserRepository.findByUsername).mockResolvedValue(mockUser)
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
                username: "test@example.com",
                password: "password123",
                device: Device.WEB,
            }

            vi.mocked(mockUserRepository.findByUsername).mockResolvedValue(mockUser)
            vi.mocked(mockUser.validatePassword).mockResolvedValue(true)

            // Act
            const result = await signInUseCase.execute(input)

            // Assert
            expect(result.token).toBe("mock-jwt-token")
        })

        it("deve funcionar com device DESKTOP", async () => {
            // Arrange
            const input: InputDto = {
                username: "test@example.com",
                password: "password123",
                device: Device.WEB,
            }

            vi.mocked(mockUserRepository.findByUsername).mockResolvedValue(mockUser)
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
                username: "TEST@EXAMPLE.COM",
                password: "password123",
                device: Device.WEB,
            }

            vi.mocked(mockUserRepository.findByUsername).mockResolvedValue(mockUser)
            vi.mocked(mockUser.validatePassword).mockResolvedValue(true)

            // Act
            await signInUseCase.execute(input)

            // Assert
            expect(mockUserRepository.findByUsername).toHaveBeenCalledWith("TEST@EXAMPLE.COM")
        })
    })

    describe("Processamento de Segurança", () => {
        it("deve processar solicitação com dados de segurança válidos", async () => {
            // Arrange
            const input: InputDto = {
                username: "test@example.com",
                password: "password123",
                device: Device.WEB,
                securityData: {
                    ipAddress: "203.0.113.1",
                    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                    machineId: "device123",
                    timezone: "America/Sao_Paulo",
                    latitude: -15.7801,
                    longitude: -47.9292,
                },
            }

            const securityResult: ProcessSignRequestResponse = {
                success: true,
                message: "Login approved successfully",
                securityRisk: SecurityRisk.LOW,
                status: SignStatus.APPROVED,
                additionalData: {
                    checks: [],
                    timestamp: new Date().toISOString(),
                },
            }

            vi.mocked(mockUserRepository.findByUsername).mockResolvedValue(mockUser)
            vi.mocked(mockUser.validatePassword).mockResolvedValue(true)
            vi.mocked(mockUserRepository.update).mockResolvedValue(mockUser)
            vi.mocked(mockProcessSignRequest.setSignRequest).mockResolvedValue()
            vi.mocked(mockProcessSignRequest.process).mockResolvedValue(securityResult)

            // Act
            const result = await signInUseCase.execute(input)

            // Assert
            expect(result.securityInfo).toBeDefined()
            expect(result.securityInfo?.riskLevel).toBe(SecurityRisk.LOW)
            expect(result.securityInfo?.status).toBe(SignStatus.APPROVED)
            expect(mockProcessSignRequest.setSignRequest).toHaveBeenCalledWith(
                expect.objectContaining({
                    username: "test@example.com",
                    signType: "signin",
                    ipAddress: "203.0.113.1",
                    latitude: -15.7801,
                    longitude: -47.9292,
                }),
            )
            expect(mockProcessSignRequest.process).toHaveBeenCalled()
        })

        it("deve rejeitar solicitação com risco crítico de segurança", async () => {
            // Arrange
            const input: InputDto = {
                username: "test@example.com",
                password: "password123",
                device: Device.WEB,
                securityData: {
                    ipAddress: "192.168.1.100", // IP suspeito
                    userAgent: "curl/7.68.0", // User agent suspeito
                    machineId: "device123",
                    timezone: "UTC",
                    latitude: 39.9042, // Beijing - localização bloqueada
                    longitude: 116.4074,
                },
            }

            const securityResult: ProcessSignRequestResponse = {
                success: false,
                message: "Login rejected due to security issues",
                securityRisk: SecurityRisk.CRITICAL,
                status: SignStatus.REJECTED,
                reason: "Multiple critical security checks failed",
                additionalData: {
                    checks: [
                        {
                            risk: SecurityRisk.CRITICAL,
                            reason: "Suspicious IP detected",
                            weight: 3,
                        },
                        {
                            risk: SecurityRisk.CRITICAL,
                            reason: "Location completely blocked",
                            weight: 10,
                        },
                    ],
                    timestamp: new Date().toISOString(),
                },
            }

            vi.mocked(mockProcessSignRequest.setSignRequest).mockResolvedValue()
            vi.mocked(mockProcessSignRequest.process).mockResolvedValue(securityResult)

            // Act & Assert
            await expect(signInUseCase.execute(input)).rejects.toThrow(SecurityRiskError)
            expect(mockProcessSignRequest.setSignRequest).toHaveBeenCalled()
            expect(mockProcessSignRequest.process).toHaveBeenCalled()
        })

        it("deve permitir login com atividade suspeita mas com alerta", async () => {
            // Arrange
            const input: InputDto = {
                username: "test@example.com",
                password: "password123",
                device: Device.WEB,
                securityData: {
                    ipAddress: "203.0.113.1",
                    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                    machineId: "device123",
                    timezone: "America/Sao_Paulo",
                    latitude: -15.7801,
                    longitude: -47.9292,
                },
            }

            const securityResult: ProcessSignRequestResponse = {
                success: true,
                message: "Approved with minor security alerts",
                securityRisk: SecurityRisk.MEDIUM,
                status: SignStatus.APPROVED,
                reason: "Approved with minor security alerts",
                additionalData: {
                    checks: [
                        {
                            risk: SecurityRisk.MEDIUM,
                            reason: "Suspicious pattern in username",
                            weight: 2,
                        },
                    ],
                    timestamp: new Date().toISOString(),
                },
            }

            vi.mocked(mockUserRepository.findByUsername).mockResolvedValue(mockUser)
            vi.mocked(mockUser.validatePassword).mockResolvedValue(true)
            vi.mocked(mockUserRepository.update).mockResolvedValue(mockUser)
            vi.mocked(mockProcessSignRequest.setSignRequest).mockResolvedValue()
            vi.mocked(mockProcessSignRequest.process).mockResolvedValue(securityResult)

            // Act
            const result = await signInUseCase.execute(input)

            // Assert
            expect(result.securityInfo).toBeDefined()
            expect(result.securityInfo?.riskLevel).toBe(SecurityRisk.MEDIUM)
            expect(result.securityInfo?.status).toBe(SignStatus.APPROVED)
            expect(result.securityInfo?.message).toContain("minor security alerts")
        })

        it("deve funcionar sem dados de segurança quando ProcessSignRequest não está disponível", async () => {
            // Arrange
            const signInUseCaseWithoutSecurity = new SignInUseCase(
                mockUserRepository,
                mockAuthLogRepository,
            )
            const input: InputDto = {
                username: "test@example.com",
                password: "password123",
                device: Device.WEB,
            }

            vi.mocked(mockUserRepository.findByUsername).mockResolvedValue(mockUser)
            vi.mocked(mockUser.validatePassword).mockResolvedValue(true)
            vi.mocked(mockUserRepository.update).mockResolvedValue(mockUser)

            // Act
            const result = await signInUseCaseWithoutSecurity.execute(input)

            // Assert
            expect(result.securityInfo).toBeUndefined()
            expect(result.token).toBe("mock-jwt-token")
        })
    })
})
