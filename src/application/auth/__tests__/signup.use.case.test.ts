import * as UserEntity from "../../../domain/user/entities/user.entity"

import { beforeEach, describe, expect, it, vi } from "vitest"
import { AuthLogRepository, AuthLogStatus, AuthLogType, Device } from "../../../domain/auth"
import { SecurityRisk, SignStatus } from "../../../domain/auth/auth.type"
import { IUserRepository, User, UserRole } from "../../../domain/user"
import {
    AccessDeniedError,
    InvalidCredentialsError,
    SecurityRiskError,
    UserAlreadyExistsError,
} from "../../../shared/errors/auth.errors"
import { ProcessSignRequest, ProcessSignRequestResponse } from "../process.sign.request"
import { SignUpInputDto, SignUpUseCase } from "../signup.use.case"

// Mock do jwtEncoder
vi.mock("@/shared", () => ({
    jwtEncoder: vi.fn().mockResolvedValue("mock-jwt-token"),
    parseTimezone: vi.fn().mockReturnValue(-3),
    generateId: vi.fn().mockReturnValue("mock-id-123"),
}))

// Mock do User.create
vi.mock("../../../domain/user/entities/user.entity", () => ({
    User: {
        create: vi.fn(),
    },
}))

// Mock do circleTextLibrary
vi.mock("@/shared/circle.text.library", () => ({
    circleTextLibrary: {
        validate: {
            username: vi.fn().mockReturnValue({ isValid: true }),
        },
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
            password: "hashed-password",
            role: UserRole.USER,
            status: { blocked: false, deleted: false },
            validatePassword: vi.fn(),
            recordLogin: vi.fn(),
            shouldUpdatePassword: vi.fn().mockReturnValue(false),
            isVerified: vi.fn().mockReturnValue(false),
            updateMetrics: vi.fn(),
        } as any

        // Mock do IUserRepository
        mockUserRepository = {
            save: vi.fn(),
            findById: vi.fn(),
            findByEmail: vi.fn(),
            findByUsername: vi.fn(),
            existsByUsername: vi.fn(),
            update: vi.fn(),
            deleteUser: vi.fn(),
            exists: vi.fn(),
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
        vi.mocked(UserEntity.User.create).mockResolvedValue(mockUser)

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
                username: "newuser@example.com",
                password: "password123",
                device: Device.WEB,
                metadata: {
                    ipAddress: "192.168.1.1",
                    userAgent: "Mozilla/5.0",
                },
                termsAccepted: true,
            }

            vi.mocked(mockUserRepository.existsByUsername).mockResolvedValue(false)
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
                role: UserRole.USER,
                status: "active",
                lastLogin: expect.any(Date),
            })

            // Verificar se User.create foi chamado com os parâmetros corretos
            expect(UserEntity.User.create).toHaveBeenCalledWith({
                username: "newuser@example.com",
                name: null,
                searchMatchTerm: "newuser@example.com",
                password: "password123",
                description: null,
                profilePicture: {
                    tinyResolution: null,
                    fullhdResolution: null,
                    createdAt: expect.any(Date),
                    updatedAt: expect.any(Date),
                },
                status: {
                    accessLevel: "user",
                    verified: false,
                    deleted: false,
                    blocked: false,
                    muted: false,
                    createdAt: expect.any(Date),
                    updatedAt: expect.any(Date),
                },
                metrics: undefined,
                embedding: {
                    vector: "",
                    dimension: 0,
                    metadata: {},
                    createdAt: expect.any(Date),
                    updatedAt: expect.any(Date),
                },
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
                    disableNewsPushNotification: false,
                    disableSugestionsPushNotification: false,
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

            expect(mockUserRepository.existsByUsername).toHaveBeenCalledWith("newuser@example.com")
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
            })
        })

        it("deve registrar usuário com marketing aceito", async () => {
            // Arrange
            const input: SignUpInputDto = {
                username: "marketing@example.com",
                password: "password123",
                device: Device.MOBILE,
                termsAccepted: true,
            }

            const userWithMarketing = {
                ...mockUser,
                id: "marketing-user-123",
                username: "marketing@example.com",
            }

            vi.mocked(UserEntity.User.create).mockResolvedValue(userWithMarketing as any)
            vi.mocked(mockUserRepository.existsByUsername).mockResolvedValue(false)
            vi.mocked(mockUserRepository.save).mockResolvedValue(userWithMarketing as any)
            vi.mocked(mockUserRepository.update).mockResolvedValue(userWithMarketing as any)

            // Act
            const result = await signUpUseCase.execute(input)

            // Assert
            expect(result.user.username).toBe("marketing@example.com")

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
                username: "existing@example.com",
                password: "password123",
                device: Device.WEB,
                termsAccepted: true,
            }

            vi.mocked(mockUserRepository.existsByUsername).mockResolvedValue(true)

            // Act & Assert
            await expect(signUpUseCase.execute(input)).rejects.toThrow(UserAlreadyExistsError)
        })

        it("deve falhar quando username é muito curto", async () => {
            // Arrange
            const input: SignUpInputDto = {
                username: "ab", // Username muito curto (menos de 3 caracteres)
                password: "password123",
                device: Device.WEB,
                termsAccepted: true,
            }

            // Mock User.create para lançar erro de validação
            vi.mocked(UserEntity.User.create).mockRejectedValue(
                new Error("Username validation failed"),
            )

            // Act & Assert
            await expect(signUpUseCase.execute(input)).rejects.toThrow(Error)
        })

        it("deve falhar quando email é inválido", async () => {
            // Arrange
            const input: SignUpInputDto = {
                username: "invalid-email",
                password: "password123",
                device: Device.WEB,
                termsAccepted: true,
            }

            // Mock User.create para lançar erro de validação
            vi.mocked(UserEntity.User.create).mockRejectedValue(
                new Error("Username validation failed"),
            )

            // Act & Assert
            await expect(signUpUseCase.execute(input)).rejects.toThrow(Error)
        })

        it("deve falhar quando senha é vazia", async () => {
            // Arrange
            const input: SignUpInputDto = {
                username: "test@example.com",
                password: "", // Senha vazia
                device: Device.WEB,
                termsAccepted: true,
            }

            // Act & Assert
            await expect(signUpUseCase.execute(input)).rejects.toThrow(InvalidCredentialsError)
        })

        it("deve falhar quando termos não são aceitos", async () => {
            // Arrange
            const input: SignUpInputDto = {
                username: "test@example.com",
                password: "password123",
                device: Device.WEB,
                termsAccepted: false, // Termos não aceitos
            }

            // Act & Assert
            await expect(signUpUseCase.execute(input)).rejects.toThrow(AccessDeniedError)
        })
    })

    describe("Tratamento de erros", () => {
        it("deve retornar erro quando falha ao salvar usuário", async () => {
            // Arrange
            const input: SignUpInputDto = {
                username: "test@example.com",
                password: "password123",
                device: Device.WEB,
                termsAccepted: true,
            }

            vi.mocked(mockUserRepository.existsByUsername).mockResolvedValue(false)
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
                    username: email,
                    password: "password123",
                    device: Device.WEB,
                    termsAccepted: true,
                }

                vi.mocked(mockUserRepository.existsByUsername).mockResolvedValue(false)
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
                    username: email,
                    password: "password123",
                    device: Device.WEB,
                    termsAccepted: true,
                }

                // Mock User.create para lançar erro de validação
                vi.mocked(UserEntity.User.create).mockRejectedValue(
                    new Error("Username validation failed"),
                )

                await expect(signUpUseCase.execute(input)).rejects.toThrow(Error)
            }
        })
    })

    describe("Processamento de Segurança", () => {
        it("deve processar solicitação de registro com dados de segurança válidos", async () => {
            // Arrange
            const input: SignUpInputDto = {
                username: "newuser@example.com",
                password: "password123",
                device: Device.WEB,
                termsAccepted: true,
                metadata: {
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

            vi.mocked(mockUserRepository.existsByUsername).mockResolvedValue(false)
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
                username: "newuser@example.com",
                password: "password123",
                device: Device.WEB,
                termsAccepted: true,
                metadata: {
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
                username: "newuser@example.com",
                password: "password123",
                device: Device.WEB,
                termsAccepted: true,
                metadata: {
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

            vi.mocked(mockUserRepository.existsByUsername).mockResolvedValue(false)
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
                username: "newuser@example.com",
                password: "password123",
                device: Device.WEB,
                termsAccepted: true,
            }

            vi.mocked(mockUserRepository.existsByUsername).mockResolvedValue(false)
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
