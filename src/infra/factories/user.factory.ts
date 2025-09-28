import { DatabaseAdapter } from "@/infra/database/adapter"
import { UserController } from "@/infra/controllers/user.controller"
import { UserRepository } from "@/domain/user"

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
     * Cria um UserController com UserRepository
     */
    static createUserController(userRepository: UserRepository): UserController {
        return new UserController(userRepository)
    }

    /**
     * Cria um UserController completo com todas as dependências
     */
    static createUserControllerWithDependencies(database: DatabaseAdapter): UserController {
        const userRepository = this.createUserRepository(database)
        return this.createUserController(userRepository)
    }

    /**
     * Cria componentes para ambiente de produção
     */
    static createForProduction(database: DatabaseAdapter): {
        userRepository: UserRepository
        userController: UserController
    } {
        const userRepository = this.createUserRepository(database)
        const userController = this.createUserController(userRepository)

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
    controller: (userRepository: UserRepository) =>
        UserFactory.createUserController(userRepository),

    /**
     * Cria UserController completo com dependências
     */
    controllerWithDependencies: (database: DatabaseAdapter) =>
        UserFactory.createUserControllerWithDependencies(database),

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
