import { MomentMetricsService } from "@/application/moment/services/moment.metrics.service"
import { MomentService } from "@/application/moment/services/moment.service"
import { GetUserMomentsUseCase } from "@/application/moment/use.cases/get.user.moments.use.case"
import { BlockUserUseCase } from "@/application/user/use.cases/block.user.use.case"
import { FollowUserUseCase } from "@/application/user/use.cases/follow.user.use.case"
import { GetUserAccountUseCase } from "@/application/user/use.cases/get.user.account.use.case"
import { GetUserBlocksUseCase } from "@/application/user/use.cases/get.user.blocks.use.case"
import { GetUserProfileUseCase } from "@/application/user/use.cases/get.user.profile.use.case"
import { UnblockUserUseCase } from "@/application/user/use.cases/unblock.user.use.case"
import { UnfollowUserUseCase } from "@/application/user/use.cases/unfollow.user.use.case"
import { IMomentRepository } from "@/domain/moment"
import { IMomentMetricsRepository } from "@/domain/moment/repositories/moment.metrics.repository"
import { IUserMetricsRepository, UserRepository } from "@/domain/user"
import { UserController } from "@/infra/controllers/user.controller"
import { DatabaseAdapter } from "@/infra/database/adapter"
import { MomentMetricsRepositoryImpl } from "@/infra/repository.impl/moment.metrics.repository.impl"
import { MomentRepositoryImpl } from "@/infra/repository.impl/moment.repository.impl"

/**
 * Factory para criar componentes relacionados ao usuário
 */
export class UserFactory {
    /**
     * Cria um UserRepository com DatabaseAdapter
     */
    static createUserRepository(database: DatabaseAdapter): UserRepository {
        return new UserRepository(database)
    }

    /**
     * Cria MomentRepository com DatabaseAdapter
     */
    static createMomentRepository(database: DatabaseAdapter): IMomentRepository {
        return new MomentRepositoryImpl(database)
    }

    /**
     * Cria MomentMetricsRepository com DatabaseAdapter
     */
    static createMomentMetricsRepository(database: DatabaseAdapter): IMomentMetricsRepository {
        return new MomentMetricsRepositoryImpl(database)
    }

    /**
     * Cria MomentMetricsService com MomentMetricsRepository
     */
    static createMomentMetricsService(database: DatabaseAdapter): MomentMetricsService {
        const momentMetricsRepository = this.createMomentMetricsRepository(database)
        return new MomentMetricsService(momentMetricsRepository)
    }

    /**
     * Cria MomentService com MomentRepository e MomentMetricsService
     */
    static createMomentService(database: DatabaseAdapter): MomentService {
        const momentRepository = this.createMomentRepository(database)
        const metricsService = this.createMomentMetricsService(database)

        // Importar StorageAdapterFactory dinamicamente para evitar circular dependency
        const { StorageAdapterFactory } = require("../../core/content.processor/storage.adapter")
        const storageAdapter = StorageAdapterFactory.create("local")

        return new MomentService(
            momentRepository,
            undefined, // config
            storageAdapter, // storageAdapter
            undefined, // moderationEngine (opcional)
        )
    }

    /**
     * Cria UserMetricsRepository com DatabaseAdapter
     */
    static createUserMetricsRepository(database: DatabaseAdapter): IUserMetricsRepository {
        // TODO: Implementar UserMetricsRepositoryImpl quando disponível
        // Por enquanto, retornamos um mock básico
        const mockRepository: IUserMetricsRepository = {
            create: async (metrics) => metrics,
            findById: async (id) => null,
            findByUserId: async (userId) => null,
            update: async (metrics) => metrics,
            delete: async (id) => {},
            findTopByEngagement: async () => [],
            findTopByFollowers: async () => [],
            findTopByActivity: async () => [],
            findTopByGrowth: async () => [],
            findActiveUsers: async () => [],
            findInfluencers: async () => [],
            findUsersWithModerationIssues: async () => [],
            getAverageMetrics: async () => ({
                averageEngagementRate: 0,
                averageActivityRate: 0,
                averageGrowthRate: 0,
                averageFollowers: 0,
            }),
            getMetricsDistribution: async () => ({
                engagementDistribution: {},
                activityDistribution: {},
                followersDistribution: {},
                growthDistribution: {},
            }),
            getMetricsByTimeRange: async () => [],
            countByEngagementRange: async () => 0,
            countByFollowersRange: async () => 0,
            countByActivityRange: async () => 0,
            countByGrowthRange: async () => 0,
            exists: async () => false,
            existsByUserId: async () => false,
            createMany: async (metrics) => metrics,
            updateMany: async (metrics) => metrics,
            deleteMany: async (ids) => {},
            findPaginated: async () => ({
                metrics: [],
                total: 0,
                page: 1,
                limit: 10,
                totalPages: 0,
            }),
        }
        return mockRepository
    }

    /**
     * Cria GetUserProfileUseCase com UserRepository e UserMetricsRepository
     */
    static createGetUserProfileUseCase(
        userRepository: UserRepository,
        userMetricsRepository: IUserMetricsRepository,
    ): GetUserProfileUseCase {
        return new GetUserProfileUseCase(userRepository, userMetricsRepository)
    }

    /**
     * Cria GetUserAccountUseCase com UserRepository e MomentRepository
     */
    static createGetUserAccountUseCase(database: DatabaseAdapter): GetUserAccountUseCase {
        const userRepository = this.createUserRepository(database)
        const momentRepository = this.createMomentRepository(database)
        return new GetUserAccountUseCase(userRepository, momentRepository)
    }

    /**
     * Cria GetUserMomentsUseCase com DatabaseAdapter
     */
    static createGetUserMomentsUseCase(database: DatabaseAdapter): GetUserMomentsUseCase {
        const momentRepository = this.createMomentRepository(database)
        const userRepository = this.createUserRepository(database)
        return new GetUserMomentsUseCase(momentRepository, userRepository)
    }

    /**
     * Cria um UserController com GetUserProfileUseCase e GetUserAccountUseCase
     */
    static createUserController(
        getUserProfileUseCase: GetUserProfileUseCase,
        getUserAccountUseCase: GetUserAccountUseCase,
        followUserUseCase?: FollowUserUseCase,
        unfollowUserUseCase?: UnfollowUserUseCase,
        blockUserUseCase?: BlockUserUseCase,
        unblockUserUseCase?: UnblockUserUseCase,
    ): UserController {
        const userRepository = this.createUserRepository(
            // @ts-ignore
            followUserUseCase?.userRepository?.database,
        )
        
        // Se não passados, criar com valores padrão
        const follow = followUserUseCase || new FollowUserUseCase(userRepository)
        const unfollow = unfollowUserUseCase || new UnfollowUserUseCase(userRepository)
        const block = blockUserUseCase || new BlockUserUseCase(userRepository)
        const unblock = unblockUserUseCase || new UnblockUserUseCase(userRepository)
        const getUserBlocks = new GetUserBlocksUseCase(userRepository)
        
        return new UserController(
            getUserProfileUseCase,
            getUserAccountUseCase,
            follow,
            unfollow,
            block,
            unblock,
            getUserBlocks,
        )
    }

    /**
     * Cria um UserController completo com todas as dependências
     */
    static createUserControllerWithDeps(database: DatabaseAdapter): UserController {
        const userRepository = this.createUserRepository(database)
        const userMetricsRepository = this.createUserMetricsRepository(database)
        const getUserProfileUseCase = this.createGetUserProfileUseCase(
            userRepository,
            userMetricsRepository,
        )
        const getUserAccountUseCase = this.createGetUserAccountUseCase(database)
        
        // Criar use cases de follow/block
        const followUserUseCase = new FollowUserUseCase(userRepository)
        const unfollowUserUseCase = new UnfollowUserUseCase(userRepository)
        const blockUserUseCase = new BlockUserUseCase(userRepository)
        const unblockUserUseCase = new UnblockUserUseCase(userRepository)
        const getUserBlocksUseCase = new GetUserBlocksUseCase(userRepository)
        
        return new UserController(
            getUserProfileUseCase,
            getUserAccountUseCase,
            followUserUseCase,
            unfollowUserUseCase,
            blockUserUseCase,
            unblockUserUseCase,
            getUserBlocksUseCase,
        )
    }

    /**
     * Cria um UserRepository com funcionalidades de permissão
     */
    static createUserPermissionRepository(database: DatabaseAdapter): UserRepository {
        return new UserRepository(database)
    }

    /**
     * Cria um UserRepository com funcionalidades de admin
     */
    static createUserAdminRepository(database: DatabaseAdapter): UserRepository {
        return new UserRepository(database)
    }

    /**
     * Cria componentes para ambiente de produção
     */
    static createForProduction(database: DatabaseAdapter): {
        userRepository: UserRepository
        userController: UserController
    } {
        const userRepository = this.createUserRepository(database)
        const userMetricsRepository = this.createUserMetricsRepository(database)
        const getUserProfileUseCase = this.createGetUserProfileUseCase(
            userRepository,
            userMetricsRepository,
        )
        const getUserAccountUseCase = this.createGetUserAccountUseCase(database)
        const userController = this.createUserController(
            getUserProfileUseCase,
            getUserAccountUseCase,
        )

        return {
            userRepository,
            userController,
        }
    }

    /**
     * Cria componentes para ambiente de teste
     */
    static createForTest(database: DatabaseAdapter): {
        userRepository: UserRepository
        userController: UserController
    } {
        // Para testes, podemos usar a mesma implementação ou uma versão mock
        return this.createForProduction(database)
    }

    /**
     * Cria componentes baseado no ambiente
     */
    static createForEnvironment(
        environment: string,
        database: DatabaseAdapter,
    ): {
        userRepository: UserRepository
        userController: UserController
    } {
        return environment === "test"
            ? this.createForTest(database)
            : this.createForProduction(database)
    }

    /**
     * Cria componentes com funcionalidades de permissão
     */
    static createWithPermissions(database: DatabaseAdapter): {
        userRepository: UserRepository
        userController: UserController
    } {
        const userRepository = this.createUserPermissionRepository(database)
        const userMetricsRepository = this.createUserMetricsRepository(database)
        const getUserProfileUseCase = this.createGetUserProfileUseCase(
            userRepository,
            userMetricsRepository,
        )
        const getUserAccountUseCase = this.createGetUserAccountUseCase(database)
        const userController = this.createUserController(
            getUserProfileUseCase,
            getUserAccountUseCase,
        )

        return {
            userRepository,
            userController,
        }
    }

    /**
     * Cria componentes com funcionalidades de métricas
     */
    static createWithMetrics(database: DatabaseAdapter): {
        userRepository: UserRepository
        userController: UserController
    } {
        const userRepository = this.createUserRepository(database)
        const userMetricsRepository = this.createUserMetricsRepository(database)
        const getUserProfileUseCase = this.createGetUserProfileUseCase(
            userRepository,
            userMetricsRepository,
        )
        const getUserAccountUseCase = this.createGetUserAccountUseCase(database)
        const userController = this.createUserController(
            getUserProfileUseCase,
            getUserAccountUseCase,
        )

        return {
            userRepository,
            userController,
        }
    }

    /**
     * Cria componentes com funcionalidades de admin
     */
    static createWithAdmin(database: DatabaseAdapter): {
        userRepository: UserRepository
        userController: UserController
    } {
        const userRepository = this.createUserAdminRepository(database)
        const userMetricsRepository = this.createUserMetricsRepository(database)
        const getUserProfileUseCase = this.createGetUserProfileUseCase(
            userRepository,
            userMetricsRepository,
        )
        const getUserAccountUseCase = this.createGetUserAccountUseCase(database)
        const userController = this.createUserController(
            getUserProfileUseCase,
            getUserAccountUseCase,
        )

        return {
            userRepository,
            userController,
        }
    }

    /**
     * Cria componentes completos com todas as funcionalidades
     */
    static createComplete(database: DatabaseAdapter): {
        userRepository: UserRepository
        userController: UserController
    } {
        const userRepository = this.createUserRepository(database)
        const userMetricsRepository = this.createUserMetricsRepository(database)
        const getUserProfileUseCase = this.createGetUserProfileUseCase(
            userRepository,
            userMetricsRepository,
        )
        const getUserAccountUseCase = this.createGetUserAccountUseCase(database)
        const userController = this.createUserController(
            getUserProfileUseCase,
            getUserAccountUseCase,
        )

        return {
            userRepository,
            userController,
        }
    }
}

/**
 * Funções utilitárias para criação rápida de componentes de usuário
 */
export const createUser = {
    /**
     * Cria UserRepository para produção
     */
    repository: (database: DatabaseAdapter) => UserFactory.createUserRepository(database),

    /**
     * Cria UserController para produção
     */
    controller: (
        getUserProfileUseCase: GetUserProfileUseCase,
        getUserAccountUseCase: GetUserAccountUseCase,
    ) => UserFactory.createUserController(getUserProfileUseCase, getUserAccountUseCase),

    /**
     * Cria UserController completo com dependências
     */
    controllerWithDeps: (database: DatabaseAdapter) =>
        UserFactory.createUserControllerWithDeps(database),

    /**
     * Cria componentes para produção
     */
    production: (database: DatabaseAdapter) => UserFactory.createForProduction(database),

    /**
     * Cria componentes para testes
     */
    test: (database: DatabaseAdapter) => UserFactory.createForTest(database),

    /**
     * Cria componentes baseado no ambiente
     */
    forEnvironment: (env: string, database: DatabaseAdapter) =>
        UserFactory.createForEnvironment(env, database),

    /**
     * Cria componentes com funcionalidades de permissão
     */
    withPermissions: (database: DatabaseAdapter) => UserFactory.createWithPermissions(database),

    /**
     * Cria componentes com funcionalidades de métricas
     */
    withMetrics: (database: DatabaseAdapter) => UserFactory.createWithMetrics(database),

    /**
     * Cria componentes com funcionalidades de admin
     */
    withAdmin: (database: DatabaseAdapter) => UserFactory.createWithAdmin(database),

    /**
     * Cria componentes completos com todas as funcionalidades
     */
    complete: (database: DatabaseAdapter) => UserFactory.createComplete(database),

    /**
     * Cria UserRepository com funcionalidades de permissão
     */
    permissionRepository: (database: DatabaseAdapter) =>
        UserFactory.createUserPermissionRepository(database),

    /**
     * Cria UserRepository com funcionalidades de métricas
     */
    metricsRepository: (database: DatabaseAdapter) =>
        UserFactory.createUserMetricsRepository(database),

    /**
     * Cria UserRepository com funcionalidades de admin
     */
    adminRepository: (database: DatabaseAdapter) => UserFactory.createUserAdminRepository(database),
}

/**
 * Configurações padrão para diferentes ambientes
 */
export const UserFactoryConfig = {
    production: {
        defaultLimit: 50,
        defaultOffset: 0,
        maxLimit: 100,
    },
    test: {
        defaultLimit: 10,
        defaultOffset: 0,
        maxLimit: 50,
    },
    development: {
        defaultLimit: 25,
        defaultOffset: 0,
        maxLimit: 75,
    },
} as const

/**
 * Tipo para configuração do factory
 */
export type UserFactoryConfigType = keyof typeof UserFactoryConfig
