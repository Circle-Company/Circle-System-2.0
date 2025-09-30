import * as UserEntity from "../../../domain/user/entities/user.entity"

import { beforeEach, describe, expect, it, vi } from "vitest"
import { AuthLogRepository, AuthLogStatus, AuthLogType, Device } from "../../../domain/auth"
import { IUserRepository, User, UserRole } from "../../../domain/user"
import { SecurityRisk, SignStatus } from "../../../infra/models/auth/sign.logs.model"
import {
    InvalidCredentialsError,
    SecurityRiskError,
    UserAlreadyExistsError,
} from "../../../shared/errors/auth.errors"
import { ProcessSignRequest, ProcessSignRequestResponse } from "../process.sign.request"
import { SignUpInputDto, SignUpUseCase } from "../signup.use.case"

// Mock do jwtEncoder
vi.mock("@/shared", () => ({
    jwtEncoder: vi.fn().mockResolvedValue("mock-jwt-token"),
}))

// Mock do User.create
vi.mock("../../../domain/user/entities/user.entity", () => ({
    User: {
        create: vi.fn(),
    },
}))

describe("SignUpUseCase", () => {
    let signUpUseCase: SignUpUseCase
    let mockUserRepository: IUserRepository
    let mockAuthLogRepository: AuthLogRepository
    let mockProcessSignRequest: ProcessSignRequest
    let mockUser: User

    beforeEach(() => {
        // Reset mocks
        vi.clearAllMocks()

        // Mock do usuário criado
        mockUser = {
            id: "new-user-123",
            username: "newuser@example.com",
            name: "New User",
            email: "newuser@example.com",
            password: "hashed-password",
            role: UserRole.USER,
            status: { blocked: false, deleted: false },
            validatePassword: vi.fn(),
            recordLogin: vi.fn(),
            shouldUpdatePassword: vi.fn().mockReturnValue(false),
            isVerified: vi.fn().mockReturnValue(false),
        } as any

        // Mock do IUserRepository
        mockUserRepository = {
            save: vi.fn(),
            findById: vi.fn(),
            findByEmail: vi.fn(),
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

        // Mock do User.create
        vi.mocked(UserEntity.User.create).mockReturnValue(mockUser)

        // Instanciar o use case
        signUpUseCase = new SignUpUseCase(
            mockUserRepository,
            mockAuthLogRepository,
            mockProcessSignRequest,
        )
    })

    describe("Registro bem-sucedido", () => {
        it("deve registrar novo usuário com sucesso e atualizar propriedades", async () => {
            // Arrange
            const input: SignUpInputDto = {
                name: "New User",
                email: "newuser@example.com",
                password: "password123",
                device: Device.WEB,
                logContext: {
                    ip: "192.168.1.1",
                    userAgent: "Mozilla/5.0",
                },
                termsAccepted: true,
                marketingAccepted: false,
            }

            vi.mocked(mockUserRepository.existsByEmail).mockResolvedValue(false)
            vi.mocked(mockUserRepository.save).mockResolvedValue(mockUser)
            vi.mocked(mockUserRepository.update).mockResolvedValue(mockUser)

            // Act
            const result = await signUpUseCase.execute(input)

            // Assert
            expect(result.token).toBe("mock-jwt-token")
            expect(result.expiresIn).toBe(3600)
            expect(result.user).toEqual({
                id: "new-user-123",
                username: "newuser@example.com",
                name: "New User",
                email: "newuser@example.com",
                role: UserRole.USER,
                status: "active",
                lastLogin: expect.any(Date),
            })

            // Verificar se User.create foi chamado com os parâmetros corretos
            expect(UserEntity.User.create).toHaveBeenCalledWith({
                username: "newuser@example.com",
                name: "New User",
                searchMatchTerm: "New User newuser@example.com",
                password: "password123",
                description: null,
                preferences: {
                    appLanguage: "pt",
                    appTimezone: -3,
                    disableAutoplay: false,
                    disableHaptics: false,
                    disableTranslation: false,
                    translationLanguage: "pt",
                    disableLikeMomentPushNotification: false,
                    disableNewMemoryPushNotification: false,
                    disableAddToMemoryPushNotification: false,
                    disableFollowUserPushNotification: false,
                    disableViewUserPushNotification: false,
                    disableNewsPushNotification: true,
                    disableSugestionsPushNotification: true,
                    disableAroundYouPushNotification: false,
                    defaultMomentVisibility: "public",
                    createdAt: expect.any(Date),
                    updatedAt: expect.any(Date),
                },
                terms: {
                    termsAndConditionsAgreed: true,
                    termsAndConditionsAgreedVersion: "1.0",
                    termsAndConditionsAgreedAt: expect.any(Date),
                    createdAt: expect.any(Date),
                    updatedAt: expect.any(Date),
                },
            })

            expect(mockUserRepository.existsByEmail).toHaveBeenCalledWith("newuser@example.com")
            expect(mockUserRepository.save).toHaveBeenCalledWith(mockUser)
            expect(mockUser.recordLogin).toHaveBeenCalledWith({
                device: Device.WEB,
                ipAddress: "192.168.1.1",
                userAgent: "Mozilla/5.0",
            })
            expect(mockUserRepository.update).toHaveBeenCalledWith(mockUser)

            expect(vi.mocked(mockAuthLogRepository.create)).toHaveBeenCalledWith({
                username: "newuser@example.com",
                ipAddress: "192.168.1.1",
                userAgent: "Mozilla/5.0",
                type: AuthLogType.SIGNUP,
                status: AuthLogStatus.SUCCESS,
                failureReason: "Registration successful",
                deviceType: Device.WEB,
                deviceId: "unknown",
                deviceTimezone: "UTC",
                createdAt: expect.any(Date),
            })
        })

        it("deve registrar usuário com marketing aceito", async () => {
            // Arrange
            const input: SignUpInputDto = {
                name: "Marketing User",
                email: "marketing@example.com",
                password: "password123",
                device: Device.MOBILE,
                termsAccepted: true,
                marketingAccepted: true,
            }

            const userWithMarketing = {
                ...mockUser,
                id: "marketing-user-123",
                email: "marketing@example.com",
            }

            vi.mocked(UserEntity.User.create).mockReturnValue(userWithMarketing)
            vi.mocked(mockUserRepository.existsByEmail).mockResolvedValue(false)
            vi.mocked(mockUserRepository.save).mockResolvedValue(userWithMarketing)
            vi.mocked(mockUserRepository.update).mockResolvedValue(userWithMarketing)

            // Act
            const result = await signUpUseCase.execute(input)

            // Assert
            expect(result.user.email).toBe("marketing@example.com")

            expect(UserEntity.User.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    preferences: expect.objectContaining({
                        disableNewsPushNotification: false,
                        disableSugestionsPushNotification: false,
                    }),
                }),
            )
        })
    })

    describe("Falhas de registro", () => {
        it("deve falhar quando usuário já existe", async () => {
            // Arrange
            const input: SignUpInputDto = {
                name: "Existing User",
                email: "existing@example.com",
                password: "password123",
                device: Device.WEB,
                termsAccepted: true,
            }

            vi.mocked(mockUserRepository.existsByEmail).mockResolvedValue(true)

            // Act & Assert
            await expect(signUpUseCase.execute(input)).rejects.toThrow(UserAlreadyExistsError)
        })

        it("deve falhar quando nome é muito curto", async () => {
            // Arrange
            const input: SignUpInputDto = {
                name: "A", // Nome muito curto
                email: "test@example.com",
                password: "password123",
                device: Device.WEB,
                termsAccepted: true,
            }

            // Act & Assert
            await expect(signUpUseCase.execute(input)).rejects.toThrow(InvalidCredentialsError)
        })

        it("deve falhar quando email é inválido", async () => {
            // Arrange
            const input: SignUpInputDto = {
                name: "Test User",
                email: "invalid-email",
                password: "password123",
                device: Device.WEB,
                termsAccepted: true,
            }

            // Act & Assert
            await expect(signUpUseCase.execute(input)).rejects.toThrow(InvalidCredentialsError)
        })

        it("deve falhar quando senha é muito curta", async () => {
            // Arrange
            const input: SignUpInputDto = {
                name: "Test User",
                email: "test@example.com",
                password: "123", // Senha muito curta
                device: Device.WEB,
                termsAccepted: true,
            }

            // Act & Assert
            await expect(signUpUseCase.execute(input)).rejects.toThrow(InvalidCredentialsError)
        })

        it("deve falhar quando termos não são aceitos", async () => {
            // Arrange
            const input: SignUpInputDto = {
                name: "Test User",
                email: "test@example.com",
                password: "password123",
                device: Device.WEB,
                termsAccepted: false, // Termos não aceitos
            }

            // Act & Assert
            await expect(signUpUseCase.execute(input)).rejects.toThrow(InvalidCredentialsError)
        })
    })

    describe("Tratamento de erros", () => {
        it("deve retornar erro quando falha ao salvar usuário", async () => {
            // Arrange
            const input: SignUpInputDto = {
                name: "Test User",
                email: "test@example.com",
                password: "password123",
                device: Device.WEB,
                termsAccepted: true,
            }

            vi.mocked(mockUserRepository.existsByEmail).mockResolvedValue(false)
            vi.mocked(mockUserRepository.save).mockRejectedValue(new Error("Database error"))

            // Act & Assert
            await expect(signUpUseCase.execute(input)).rejects.toThrow("Database error")
        })
    })

    describe("Validação de entrada", () => {
        it("deve validar diferentes tipos de email", async () => {
            const validEmails = [
                "test@example.com",
                "user.name@domain.co.uk",
                "user+tag@example.org",
                "123@test.com",
            ]

            for (const email of validEmails) {
                const input: SignUpInputDto = {
                    name: "Test User",
                    email,
                    password: "password123",
                    device: Device.WEB,
                    termsAccepted: true,
                }

                vi.mocked(mockUserRepository.existsByEmail).mockResolvedValue(false)
                vi.mocked(mockUserRepository.save).mockResolvedValue(mockUser)
                vi.mocked(mockUserRepository.update).mockResolvedValue(mockUser)

                const result = await signUpUseCase.execute(input)
                expect(result.token).toBe("mock-jwt-token")
            }
        })

        it("deve rejeitar emails inválidos", async () => {
            const invalidEmails = ["invalid-email", "@example.com", "test@", "test.example.com", ""]

            for (const email of invalidEmails) {
                const input: SignUpInputDto = {
                    name: "Test User",
                    email,
                    password: "password123",
                    device: Device.WEB,
                    termsAccepted: true,
                }

                await expect(signUpUseCase.execute(input)).rejects.toThrow(InvalidCredentialsError)
            }
        })
    })

    describe("Processamento de Segurança", () => {
        it("deve processar solicitação de registro com dados de segurança válidos", async () => {
            // Arrange
            const input: SignUpInputDto = {
                name: "New User",
                email: "newuser@example.com",
                password: "password123",
                device: Device.WEB,
                termsAccepted: true,
                marketingAccepted: false,
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
                message: "Registration approved successfully",
                securityRisk: SecurityRisk.LOW,
                status: SignStatus.APPROVED,
                additionalData: {
                    checks: [],
                    timestamp: new Date().toISOString(),
                },
            }

            vi.mocked(mockUserRepository.existsByEmail).mockResolvedValue(false)
            vi.mocked(mockUserRepository.save).mockResolvedValue(mockUser)
            vi.mocked(mockUserRepository.update).mockResolvedValue(mockUser)
            vi.mocked(mockProcessSignRequest.setSignRequest).mockResolvedValue()
            vi.mocked(mockProcessSignRequest.process).mockResolvedValue(securityResult)

            // Act
            const result = await signUpUseCase.execute(input)

            // Assert
            expect(result.securityInfo).toBeDefined()
            expect(result.securityInfo?.riskLevel).toBe(SecurityRisk.LOW)
            expect(result.securityInfo?.status).toBe(SignStatus.APPROVED)
            expect(mockProcessSignRequest.setSignRequest).toHaveBeenCalledWith(
                expect.objectContaining({
                    username: "newuser@example.com",
                    signType: "signup",
                    ipAddress: "203.0.113.1",
                    latitude: -15.7801,
                    longitude: -47.9292,
                    termsAccepted: true,
                }),
            )
            expect(mockProcessSignRequest.process).toHaveBeenCalled()
        })

        it("deve rejeitar registro com risco crítico de segurança", async () => {
            // Arrange
            const input: SignUpInputDto = {
                name: "New User",
                email: "newuser@example.com",
                password: "password123",
                device: Device.WEB,
                termsAccepted: true,
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
                message: "Registration rejected due to security issues",
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
            await expect(signUpUseCase.execute(input)).rejects.toThrow(SecurityRiskError)
            expect(mockProcessSignRequest.setSignRequest).toHaveBeenCalled()
            expect(mockProcessSignRequest.process).toHaveBeenCalled()
        })

        it("deve permitir registro com atividade suspeita mas com alerta", async () => {
            // Arrange
            const input: SignUpInputDto = {
                name: "New User",
                email: "newuser@example.com",
                password: "password123",
                device: Device.WEB,
                termsAccepted: true,
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

            vi.mocked(mockUserRepository.existsByEmail).mockResolvedValue(false)
            vi.mocked(mockUserRepository.save).mockResolvedValue(mockUser)
            vi.mocked(mockUserRepository.update).mockResolvedValue(mockUser)
            vi.mocked(mockProcessSignRequest.setSignRequest).mockResolvedValue()
            vi.mocked(mockProcessSignRequest.process).mockResolvedValue(securityResult)

            // Act
            const result = await signUpUseCase.execute(input)

            // Assert
            expect(result.securityInfo).toBeDefined()
            expect(result.securityInfo?.riskLevel).toBe(SecurityRisk.MEDIUM)
            expect(result.securityInfo?.status).toBe(SignStatus.APPROVED)
            expect(result.securityInfo?.message).toContain("minor security alerts")
        })

        it("deve funcionar sem dados de segurança quando ProcessSignRequest não está disponível", async () => {
            // Arrange
            const signUpUseCaseWithoutSecurity = new SignUpUseCase(
                mockUserRepository,
                mockAuthLogRepository,
            )
            const input: SignUpInputDto = {
                name: "New User",
                email: "newuser@example.com",
                password: "password123",
                device: Device.WEB,
                termsAccepted: true,
            }

            vi.mocked(mockUserRepository.existsByEmail).mockResolvedValue(false)
            vi.mocked(mockUserRepository.save).mockResolvedValue(mockUser)
            vi.mocked(mockUserRepository.update).mockResolvedValue(mockUser)

            // Act
            const result = await signUpUseCaseWithoutSecurity.execute(input)

            // Assert
            expect(result.securityInfo).toBeUndefined()
            expect(result.token).toBe("mock-jwt-token")
        })
    })
})
