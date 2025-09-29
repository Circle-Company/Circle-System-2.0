import { beforeEach, describe, expect, it, vi } from "vitest"

import { Level } from "../../../authorization/authorization.type"
import { UserProps } from "../../types/user.type"
import { User } from "../user.entity"

// Mock do Encrypt
vi.mock("../../../shared/encrypt", () => ({
    Encrypt: vi.fn().mockImplementation(() => ({
        hashStr: vi.fn().mockResolvedValue("hashed_password_123"),
        compare: vi.fn().mockImplementation((params: { value: string; encryptedValue: string }) => {
            // Simula comparação real - retorna true se a senha fornecida for igual à senha armazenada
            return Promise.resolve(params.value === params.encryptedValue)
        }),
    })),
}))

// Mock do generateId
vi.mock("../../../shared/id", () => ({
    generateId: vi.fn().mockReturnValue("123456789"),
}))

describe("User Entity", () => {
    let validUserProps: UserProps

    beforeEach(() => {
        validUserProps = {
            username: "joao_silva",
            searchMatchTerm: "joao silva",
            password: "minhasenha123",
            name: "João Silva",
            description: "Desenvolvedor Full Stack",
        }
    })

    describe("Constructor", () => {
        it("deve criar uma instância de User com propriedades válidas", () => {
            const user = new User(validUserProps)

            expect(user).toBeInstanceOf(User)
            expect(user.username).toBe("joao_silva")
            expect(user.name).toBe("João Silva")
            expect(user.searchMatchTerm).toBe("joao silva")
            expect(user.password).toBe("minhasenha123")
            expect(user.description).toBe("Desenvolvedor Full Stack")
        })

        it("deve gerar um ID automaticamente se não fornecido", () => {
            const user = new User(validUserProps)
            expect(user.id).toBe("123456789")
        })

        it("deve usar o ID fornecido", () => {
            const userWithId = new User({ ...validUserProps, id: "custom_id_123" })
            expect(userWithId.id).toBe("custom_id_123")
        })

        it("deve definir timestamps automaticamente", () => {
            const user = new User(validUserProps)
            expect(user.createdAt).toBeInstanceOf(Date)
            expect(user.updatedAt).toBeInstanceOf(Date)
        })

        it("deve usar timestamps fornecidos", () => {
            const customDate = new Date("2023-01-01")
            const user = new User({
                ...validUserProps,
                createdAt: customDate,
                updatedAt: customDate,
            })
            expect(user.createdAt).toBe(customDate)
            expect(user.updatedAt).toBe(customDate)
        })
    })

    describe("Validação", () => {
        it("deve lançar erro se username for muito curto", () => {
            expect(() => {
                new User({ ...validUserProps, username: "ab" })
            }).toThrow("Username deve ter pelo menos 3 caracteres")
        })

        it("deve lançar erro se username for vazio", () => {
            expect(() => {
                new User({ ...validUserProps, username: "" })
            }).toThrow("Username deve ter pelo menos 3 caracteres")
        })

        it("deve lançar erro se searchMatchTerm for muito curto", () => {
            expect(() => {
                new User({ ...validUserProps, searchMatchTerm: "a" })
            }).toThrow("Termo de busca deve ter pelo menos 2 caracteres")
        })

        it("deve lançar erro se senha for muito curta", () => {
            expect(() => {
                new User({ ...validUserProps, password: "123" })
            }).toThrow("Senha deve ter pelo menos 8 caracteres")
        })

        it("deve lançar erro se descrição for muito longa", () => {
            const longDescription = "a".repeat(301)
            expect(() => {
                new User({ ...validUserProps, description: longDescription })
            }).toThrow("Descrição deve ter no máximo 300 caracteres")
        })
    })

    describe("Métodos de Atualização", () => {
        let user: User

        beforeEach(() => {
            user = new User(validUserProps)
        })

        it("deve atualizar username corretamente", () => {
            user.updateUsername("novo_username")
            expect(user.username).toBe("novo_username")
            expect(user.updatedAt).not.toBe(user.createdAt)
        })

        it("deve lançar erro ao atualizar username inválido", () => {
            expect(() => {
                user.updateUsername("ab")
            }).toThrow("Username deve ter pelo menos 3 caracteres")
        })

        it("deve atualizar nome corretamente", () => {
            user.updateName("João Silva Santos")
            expect(user.name).toBe("João Silva Santos")
            expect(user.updatedAt).not.toBe(user.createdAt)
        })

        it("deve lançar erro ao atualizar nome inválido", () => {
            expect(() => {
                user.updateName("a")
            }).toThrow("Nome deve ter pelo menos 2 caracteres")
        })

        it("deve atualizar termo de busca corretamente", () => {
            user.updateSearchMatchTerm("novo termo")
            expect(user.searchMatchTerm).toBe("novo termo")
            expect(user.updatedAt).not.toBe(user.createdAt)
        })

        it("deve atualizar senha corretamente", () => {
            const oldPassword = user.password
            user.updatePassword("novasenha123")
            expect(user.password).toBe("novasenha123")
            expect(user.oldPassword).toBe(oldPassword)
            expect(user.lastPasswordUpdatedAt).toBeInstanceOf(Date)
            expect(user.updatedAt).not.toBe(user.createdAt)
        })

        it("deve lançar erro ao atualizar senha inválida", () => {
            expect(() => {
                user.updatePassword("123")
            }).toThrow("Senha deve ter pelo menos 8 caracteres")
        })

        it("deve atualizar descrição corretamente", () => {
            user.updateDescription("Nova descrição")
            expect(user.description).toBe("Nova descrição")
            expect(user.updatedAt).not.toBe(user.createdAt)
        })

        it("deve aceitar descrição nula", () => {
            user.updateDescription(null as any)
            expect(user.description).toBeNull()
        })

        it("deve lançar erro ao atualizar descrição muito longa", () => {
            const longDescription = "a".repeat(301)
            expect(() => {
                user.updateDescription(longDescription)
            }).toThrow("Descrição deve ter no máximo 300 caracteres")
        })
    })

    describe("Métodos de Verificação", () => {
        let user: User

        beforeEach(() => {
            user = new User({
                ...validUserProps,
                status: {
                    accessLevel: Level.USER,
                    verified: true,
                    deleted: false,
                    blocked: false,
                    muted: false,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            })
        })

        it("deve retornar true para usuário ativo", () => {
            expect(user.isActive()).toBe(true)
        })

        it("deve retornar false para usuário bloqueado", () => {
            user.updateStatus({
                accessLevel: Level.USER,
                verified: true,
                deleted: false,
                blocked: true,
                muted: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            })
            expect(user.isActive()).toBe(false)
        })

        it("deve retornar false para usuário deletado", () => {
            user.updateStatus({
                accessLevel: Level.USER,
                verified: true,
                deleted: true,
                blocked: false,
                muted: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            })
            expect(user.isActive()).toBe(false)
        })

        it("deve retornar true para usuário verificado", () => {
            expect(user.isVerified()).toBe(true)
        })

        it("deve retornar false para usuário não verificado", () => {
            user.updateStatus({
                accessLevel: Level.USER,
                verified: false,
                deleted: false,
                blocked: false,
                muted: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            })
            expect(user.isVerified()).toBe(false)
        })

        it("deve retornar true para usuário bloqueado", () => {
            user.updateStatus({
                accessLevel: Level.USER,
                verified: true,
                deleted: false,
                blocked: true,
                muted: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            })
            expect(user.isBlocked()).toBe(true)
        })

        it("deve retornar true para usuário deletado", () => {
            user.updateStatus({
                accessLevel: Level.USER,
                verified: true,
                deleted: true,
                blocked: false,
                muted: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            })
            expect(user.isDeleted()).toBe(true)
        })

        it("deve retornar true para usuário silenciado", () => {
            user.updateStatus({
                accessLevel: Level.USER,
                verified: true,
                deleted: false,
                blocked: false,
                muted: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            })
            expect(user.isMuted()).toBe(true)
        })

        it("deve retornar true para usuário com acesso de admin", () => {
            user.updateStatus({
                accessLevel: Level.ADMIN,
                verified: true,
                deleted: false,
                blocked: false,
                muted: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            })
            expect(user.canAccessAdminFeatures()).toBe(true)
            expect(user.isAdmin()).toBe(true)
        })

        it("deve retornar true para usuário com acesso de sudo", () => {
            user.updateStatus({
                accessLevel: Level.SUDO,
                verified: true,
                deleted: false,
                blocked: false,
                muted: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            })
            expect(user.canAccessAdminFeatures()).toBe(true)
            expect(user.isAdmin()).toBe(true)
        })

        it("deve retornar false para usuário sem acesso de admin", () => {
            expect(user.canAccessAdminFeatures()).toBe(false)
            expect(user.isAdmin()).toBe(false)
        })

        it("deve verificar se usuário pode criar moments", () => {
            expect(user.canCreateMoments()).toBe(true)
        })

        it("deve verificar se usuário pode interagir com moments", () => {
            expect(user.canInteractWithMoments()).toBe(true)
        })

        it("deve verificar se usuário pode ver moments", () => {
            expect(user.canViewMoments()).toBe(true)
        })

        it("deve retornar limite ilimitado de moments por dia", () => {
            expect(user.getDailyMomentsLimit()).toBe(Number.MAX_SAFE_INTEGER)
        })

        it("deve retornar configuração de visibilidade padrão", () => {
            expect(user.getDefaultMomentVisibility()).toBe('public')
        })
    })

    describe("Validação de Senha", () => {
        let user: User

        beforeEach(() => {
            user = new User(validUserProps)
        })

        it("deve validar senha corretamente", async () => {
            const isValid = await user.validatePassword("minhasenha123")
            expect(isValid).toBe(true)
        })

        it("deve retornar false para senha incorreta", async () => {
            const isValid = await user.validatePassword("senha_incorreta")
            expect(isValid).toBe(false)
        })
    })

    describe("Factory Method", () => {
        it("deve criar usuário com senha criptografada", async () => {
            const user = await User.create({
                username: "test_user",
                searchMatchTerm: "test user",
                password: "plain_password",
            })

            expect(user).toBeInstanceOf(User)
            expect(user.password).toBe("hashed_password_123")
            expect(user.username).toBe("test_user")
        })
    })

    describe("Serialização", () => {
        it("deve serializar usuário corretamente", () => {
            const user = new User(validUserProps)
            const json = user.toJSON()

            expect(json.id).toBe(user.id)
            expect(json.username).toBe(user.username)
            expect(json.name).toBe(user.name)
            expect(json.searchMatchTerm).toBe(user.searchMatchTerm)
            expect(json.password).toBe(user.password)
            expect(json.description).toBe(user.description)
            expect(json.createdAt).toBe(user.createdAt)
            expect(json.updatedAt).toBe(user.updatedAt)
        })

        it("deve serializar propriedades opcionais como undefined quando null", () => {
            const user = new User(validUserProps)
            const json = user.toJSON()

            expect(json.profilePicture).toBeUndefined()
            expect(json.status).toBeUndefined()
            expect(json.metrics).toBeUndefined()
            expect(json.preferences).toBeUndefined()
            expect(json.terms).toBeUndefined()
            expect(json.embedding).toBeUndefined()
            expect(json.interctionsSummary).toBeUndefined()
        })
    })

    describe("Métricas e Análise de Comportamento", () => {
        let user: User

        beforeEach(() => {
            user = new User(validUserProps)
        })

        it("deve obter estatísticas de criação de conteúdo sem métricas", () => {
            const stats = user.getContentCreationStats()
            expect(stats.totalMoments).toBe(0)
            expect(stats.totalMemories).toBe(0)
            expect(stats.averageMomentsPerDay).toBe(0)
            expect(stats.averageMemoriesPerDay).toBe(0)
            expect(stats.lastContentDate).toBeNull()
        })

        it("deve obter estatísticas de engajamento sem métricas", () => {
            const stats = user.getEngagementStats()
            expect(stats.totalLikesReceived).toBe(0)
            expect(stats.totalViewsReceived).toBe(0)
            expect(stats.totalCommentsReceived).toBe(0)
            expect(stats.totalSharesReceived).toBe(0)
            expect(stats.engagementRate).toBe(0)
            expect(stats.reachRate).toBe(0)
        })

        it("deve calcular score de reputação sem métricas", () => {
            expect(user.getReputationScore()).toBe(0)
        })

        it("deve verificar se tem embedding", () => {
            expect(user.hasEmbedding()).toBe(false)
        })

        it("deve obter configurações de notificação padrão", () => {
            const settings = user.getMomentNotificationSettings()
            expect(settings.likeMoments).toBe(true)
            expect(settings.newMemories).toBe(true)
            expect(settings.suggestions).toBe(true)
        })

        it("deve obter configurações de reprodução de mídia", () => {
            const settings = user.getMediaPlaybackSettings()
            expect(settings.autoplay).toBe(true)
            expect(settings.haptics).toBe(true)
            expect(settings.language).toBe('pt')
            expect(settings.timezone).toBe(-3)
        })

        it("deve verificar permissões de menção", () => {
            expect(user.canMentionUsers()).toBe(true)
            expect(user.canBeMentioned()).toBe(true)
        })

        it("deve obter hashtags preferidas vazias", () => {
            expect(user.getPreferredHashtags()).toEqual([])
        })
    })

    describe("Atualização de Propriedades Relacionadas", () => {
        let user: User

        beforeEach(() => {
            user = new User(validUserProps)
        })

        it("deve atualizar foto de perfil", () => {
            const profilePicture = {
                tinyResolution: "tiny_url",
                fullhdResolution: "fullhd_url",
                createdAt: new Date(),
                updatedAt: new Date(),
            }

            user.updateProfilePicture(profilePicture)
            expect(user.profilePicture).toEqual(profilePicture)
            expect(user.updatedAt).not.toBe(user.createdAt)
        })

        it("deve atualizar métricas", () => {
            const metrics = {
                totalLikesReceived: 100,
                totalViewsReceived: 500,
                totalSharesReceived: 50,
                totalCommentsReceived: 25,
                totalMemoriesCreated: 10,
                totalMomentsCreated: 5,
                totalLikesGiven: 200,
                totalCommentsGiven: 30,
                totalSharesGiven: 15,
                totalFollowsGiven: 20,
                totalReportsGiven: 2,
                totalFollowers: 150,
                totalFollowing: 100,
                totalRelations: 250,
                daysActiveLast30: 25,
                daysActiveLast7: 6,
                lastActiveDate: new Date(),
                currentStreakDays: 5,
                longestStreakDays: 10,
                engagementRate: 0.15,
                reachRate: 0.8,
                momentsPublishedGrowthRate30d: 0.1,
                memoriesPublishedGrowthRate30d: 0.2,
                followerGrowthRate30d: 0.05,
                engagementGrowthRate30d: 0.1,
                interactionsGrowthRate30d: 0.12,
                memoriesPerDayAverage: 0.5,
                momentsPerDayAverage: 0.2,
                reportsReceived: 1,
                violationsCount: 0,
                lastMetricsUpdate: new Date(),
                createdAt: new Date(),
                updatedAt: new Date(),
            }

            user.updateMetrics(metrics)
            expect(user.metrics).toEqual(metrics)
            expect(user.updatedAt).not.toBe(user.createdAt)
        })

        it("deve atualizar preferências", () => {
            const preferences = {
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
                createdAt: new Date(),
                updatedAt: new Date(),
            }

            user.updatePreferences(preferences)
            expect(user.preferences).toEqual(preferences)
            expect(user.updatedAt).not.toBe(user.createdAt)
        })

        it("deve atualizar termos", () => {
            const terms = {
                termsAndConditionsAgreed: true,
                termsAndConditionsAgreedVersion: "1.0",
                termsAndConditionsAgreedAt: new Date(),
                createdAt: new Date(),
                updatedAt: new Date(),
            }

            user.updateTerms(terms)
            expect(user.terms).toEqual(terms)
            expect(user.updatedAt).not.toBe(user.createdAt)
        })

        it("deve atualizar embedding", () => {
            const embedding = {
                vector: "serialized_vector",
                dimension: 128,
                metadata: { source: "test" },
                createdAt: new Date(),
                updatedAt: new Date(),
            }

            user.updateEmbedding(embedding)
            expect(user.embedding).toEqual(embedding)
            expect(user.updatedAt).not.toBe(user.createdAt)
        })

        it("deve atualizar resumo de interações", () => {
            const summary = {
                totalInteractions: 1000,
                lastInteractionDate: new Date(),
                interactionCounts: { like: 500, comment: 300, share: 200 },
                createdAt: new Date(),
                updatedAt: new Date(),
            }

            user.updateInterctionsSummary(summary)
            expect(user.interctionsSummary).toEqual(summary)
            expect(user.updatedAt).not.toBe(user.createdAt)
        })
    })
})
