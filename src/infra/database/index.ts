import { ErrorCode, SystemError } from "../../errors"

import { ENVIRONMENT } from "./environment"
import { Sequelize } from "sequelize"
import User from "../models/user/user.model"

interface ModelWithInit {
    initialize?: (sequelize: Sequelize) => void
    associate?: (models: any) => void
    ensureFullTextIndex?: (sequelize: Sequelize) => Promise<void>
}

// Instância principal do Sequelize
export const sequelize = new Sequelize(ENVIRONMENT)

// Registro de modelos
const models: ModelWithInit[] = [User]

// Inicialização dos modelos
async function initializeDatabase() {
    try {
        // Conectar ao banco
        await sequelize.authenticate()
        logger.info("Conexão com o banco de dados estabelecida com sucesso")

        // Inicializar modelos
        logger.info("Inicializando modelos")
        for (const model of models) {
            if (model.initialize) {
                model.initialize(sequelize)
            }
        }

        // Configurar associações
        logger.info("Configurando associações")
        for (const model of models) {
            if (model.associate) {
                model.associate(sequelize.models)
            }
        }

        // Configurar índices especiais
        logger.info("Configurando índices especiais")
        for (const model of models) {
            if (model.ensureFullTextIndex) {
                await model.ensureFullTextIndex(sequelize)
            }
        }

        // Sincronizar modelos (apenas em desenvolvimento)
        if (process.env.NODE_ENV === "development") {
            logger.info("Sincronizando modelos com o banco")
            await sequelize.sync({ alter: true })
        }

        logger.info("Todos os modelos foram inicializados com sucesso!")
    } catch (error) {
        // Se já é um erro customizado, re-throw
        if (error instanceof SystemError) {
            throw error
        }

        // Converter erro genérico para SystemError
        const systemError = new SystemError({
            message: "Falha na inicialização do banco de dados",
            code: ErrorCode.DATABASE_ERROR,
            action: "Verifique a configuração do banco e tente novamente",
            context: {
                additionalData: {
                    originalError: (error as Error)?.message,
                    errorType: (error as Error)?.constructor?.name,
                    environment: process.env.NODE_ENV,
                },
            },
            metadata: {
                severity: "critical",
                retryable: true,
                logLevel: "error",
                notifyAdmin: true,
            },
        })

        logger.error("Erro ao inicializar banco de dados", {
            error: systemError.toJSON(),
            originalError: error,
        })
        throw systemError
    }
}

// Exportar para compatibilidade
export { sequelize as connection, initializeDatabase }
export default sequelize
