import { UserSearchResult } from "../user.search.result.entity"

describe("UserSearchResult Entity", () => {
    const validProps = {
        userId: "123456789",
        username: "testuser",
        name: "Test User",
        description: "Test description",
        isVerified: false,
        isActive: true,
        reputationScore: 75,
        engagementRate: 0.05,
        followersCount: 1000,
        followingCount: 500,
        contentCount: 50,
        profilePictureUrl: "https://example.com/avatar.jpg",
        relationshipStatus: {
            youFollow: false,
            followsYou: true,
            isBlocked: false,
            isMuted: false,
        },
        searchScore: 85,
        searchMetadata: {
            searchTerm: "test",
            searchType: "unknown" as const,
            searchTimestamp: new Date(),
            rankingFactors: ["relevance", "engagement"],
        },
    }

    describe("Constructor", () => {
        it("deve criar uma instância válida com props válidas", () => {
            const result = UserSearchResult.create(validProps)

            expect(result.userId).toBe(validProps.userId)
            expect(result.username).toBe(validProps.username)
            expect(result.name).toBe(validProps.name)
            expect(result.searchScore).toBe(validProps.searchScore)
        })

        it("deve gerar um ID automaticamente se não fornecido", () => {
            const result = UserSearchResult.create(validProps)

            expect(result.id).toBeDefined()
            expect(result.id).toMatch(/^[a-zA-Z0-9_-]+$/)
        })

        it("deve definir timestamps automaticamente", () => {
            const result = UserSearchResult.create(validProps)

            expect(result.createdAt).toBeInstanceOf(Date)
            expect(result.updatedAt).toBeInstanceOf(Date)
        })
    })

    describe("Validação", () => {
        it("deve falhar se userId estiver vazio", () => {
            expect(() => {
                UserSearchResult.create({ ...validProps, userId: "" })
            }).toThrow("User ID é obrigatório")
        })

        it("deve falhar se username for muito curto", () => {
            expect(() => {
                UserSearchResult.create({ ...validProps, username: "ab" })
            }).toThrow("Username deve ter pelo menos 3 caracteres")
        })

        it("deve falhar se reputationScore for negativo", () => {
            expect(() => {
                UserSearchResult.create({ ...validProps, reputationScore: -1 })
            }).toThrow("Reputation score deve estar entre 0 e 100")
        })

        it("deve falhar se reputationScore for maior que 100", () => {
            expect(() => {
                UserSearchResult.create({ ...validProps, reputationScore: 101 })
            }).toThrow("Reputation score deve estar entre 0 e 100")
        })

        it("deve falhar se engagementRate for negativo", () => {
            expect(() => {
                UserSearchResult.create({ ...validProps, engagementRate: -0.1 })
            }).toThrow("Engagement rate deve estar entre 0 e 1")
        })

        it("deve falhar se engagementRate for maior que 1", () => {
            expect(() => {
                UserSearchResult.create({ ...validProps, engagementRate: 1.1 })
            }).toThrow("Engagement rate deve estar entre 0 e 1")
        })

        it("deve falhar se followersCount for negativo", () => {
            expect(() => {
                UserSearchResult.create({ ...validProps, followersCount: -1 })
            }).toThrow("Followers count não pode ser negativo")
        })

        it("deve falhar se distance for negativo", () => {
            expect(() => {
                UserSearchResult.create({ ...validProps, distance: -1 })
            }).toThrow("Distance não pode ser negativo")
        })
    })

    describe("Métodos de domínio", () => {
        let result: UserSearchResult

        beforeEach(() => {
            result = UserSearchResult.create(validProps)
        })

        describe("updateSearchScore", () => {
            it("deve atualizar o score de busca", () => {
                result.updateSearchScore(90)

                expect(result.searchScore).toBe(90)
            })

            it("deve falhar se score for negativo", () => {
                expect(() => {
                    result.updateSearchScore(-1)
                }).toThrow("Search score deve estar entre 0 e 100")
            })

            it("deve falhar se score for maior que 100", () => {
                expect(() => {
                    result.updateSearchScore(101)
                }).toThrow("Search score deve estar entre 0 e 100")
            })
        })

        describe("addRankingFactor", () => {
            it("deve adicionar um novo fator de ranking", () => {
                const initialFactors = result.searchMetadata.rankingFactors.length

                result.addRankingFactor("verification")

                expect(result.searchMetadata.rankingFactors.length).toBe(initialFactors + 1)
                expect(result.searchMetadata.rankingFactors).toContain("verification")
            })

            it("não deve adicionar fator duplicado", () => {
                const initialFactors = result.searchMetadata.rankingFactors.length

                result.addRankingFactor("relevance")

                expect(result.searchMetadata.rankingFactors.length).toBe(initialFactors)
            })
        })

        describe("updateRelationshipStatus", () => {
            it("deve atualizar status de relacionamento", () => {
                result.updateRelationshipStatus({ youFollow: true })

                expect(result.relationshipStatus.youFollow).toBe(true)
            })

            it("deve manter outros status inalterados", () => {
                const originalStatus = { ...result.relationshipStatus }

                result.updateRelationshipStatus({ youFollow: true })

                expect(result.relationshipStatus.followsYou).toBe(originalStatus.followsYou)
                expect(result.relationshipStatus.isBlocked).toBe(originalStatus.isBlocked)
                expect(result.relationshipStatus.isMuted).toBe(originalStatus.isMuted)
            })
        })

        describe("updateDistance", () => {
            it("deve atualizar a distância", () => {
                result.updateDistance(15.5)

                expect(result.distance).toBe(15.5)
            })

            it("deve permitir null como distância", () => {
                result.updateDistance(null)

                expect(result.distance).toBe(null)
            })
        })

        describe("isRelevant", () => {
            it("deve retornar true para usuário ativo e não bloqueado", () => {
                expect(result.isRelevant()).toBe(true)
            })

            it("deve retornar false para usuário bloqueado", () => {
                result.updateRelationshipStatus({ isBlocked: true })

                expect(result.isRelevant()).toBe(false)
            })

            it("deve retornar false para usuário silenciado", () => {
                result.updateRelationshipStatus({ isMuted: true })

                expect(result.isRelevant()).toBe(false)
            })

            it("deve retornar false para usuário inativo", () => {
                const inactiveResult = UserSearchResult.create({
                    ...validProps,
                    isActive: false,
                })

                expect(inactiveResult.isRelevant()).toBe(false)
            })
        })

        describe("isHighQuality", () => {
            it("deve retornar true para usuário verificado com boa reputação", () => {
                const highQualityResult = UserSearchResult.create({
                    ...validProps,
                    isVerified: true,
                    reputationScore: 80,
                    engagementRate: 0.08,
                    followersCount: 2000,
                })

                expect(highQualityResult.isHighQuality()).toBe(true)
            })

            it("deve retornar false para usuário não verificado", () => {
                expect(result.isHighQuality()).toBe(false)
            })

            it("deve retornar false para usuário com baixa reputação", () => {
                const lowQualityResult = UserSearchResult.create({
                    ...validProps,
                    isVerified: true,
                    reputationScore: 30,
                })

                expect(lowQualityResult.isHighQuality()).toBe(false)
            })
        })

        describe("getDisplayName", () => {
            it("deve retornar o nome se disponível", () => {
                expect(result.getDisplayName()).toBe(validProps.name)
            })

            it("deve retornar o username se nome não estiver disponível", () => {
                const resultWithoutName = UserSearchResult.create({
                    ...validProps,
                    name: null,
                })

                expect(resultWithoutName.getDisplayName()).toBe(validProps.username)
            })
        })

        describe("getEngagementLevel", () => {
            it("deve retornar high para engagement rate alto", () => {
                const highEngagementResult = UserSearchResult.create({
                    ...validProps,
                    engagementRate: 0.15,
                })

                expect(highEngagementResult.getEngagementLevel()).toBe("high")
            })

            it("deve retornar medium para engagement rate médio", () => {
                const mediumEngagementResult = UserSearchResult.create({
                    ...validProps,
                    engagementRate: 0.08,
                })

                expect(mediumEngagementResult.getEngagementLevel()).toBe("medium")
            })

            it("deve retornar low para engagement rate baixo", () => {
                expect(result.getEngagementLevel()).toBe("low")
            })
        })

        describe("getInfluenceLevel", () => {
            it("deve retornar high para muitos seguidores", () => {
                const highInfluenceResult = UserSearchResult.create({
                    ...validProps,
                    followersCount: 15000,
                })

                expect(highInfluenceResult.getInfluenceLevel()).toBe("high")
            })

            it("deve retornar medium para seguidores médios", () => {
                const mediumInfluenceResult = UserSearchResult.create({
                    ...validProps,
                    followersCount: 5000,
                })

                expect(mediumInfluenceResult.getInfluenceLevel()).toBe("medium")
            })

            it("deve retornar low para poucos seguidores", () => {
                expect(result.getInfluenceLevel()).toBe("low")
            })
        })

        describe("getProximityLevel", () => {
            it("deve retornar close para distância pequena", () => {
                const closeResult = UserSearchResult.create({
                    ...validProps,
                    distance: 2,
                })

                expect(closeResult.getProximityLevel()).toBe("close")
            })

            it("deve retornar medium para distância média", () => {
                const mediumResult = UserSearchResult.create({
                    ...validProps,
                    distance: 25,
                })

                expect(mediumResult.getProximityLevel()).toBe("medium")
            })

            it("deve retornar far para distância grande", () => {
                const farResult = UserSearchResult.create({
                    ...validProps,
                    distance: 100,
                })

                expect(farResult.getProximityLevel()).toBe("far")
            })

            it("deve retornar unknown para distância nula", () => {
                expect(result.getProximityLevel()).toBe("unknown")
            })
        })
    })

    describe("toJSON", () => {
        it("deve retornar objeto JSON válido", () => {
            const result = UserSearchResult.create(validProps)
            const json = result.toJSON()

            expect(json.userId).toBe(validProps.userId)
            expect(json.username).toBe(validProps.username)
            expect(json.searchScore).toBe(validProps.searchScore)
            expect(json.createdAt).toBeInstanceOf(Date)
            expect(json.updatedAt).toBeInstanceOf(Date)
        })
    })
})
