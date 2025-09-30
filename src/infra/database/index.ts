import { ErrorCode, SystemError } from "../../shared/errors"

// Importar todos os modelos
import AuthLog from "../models/auth/sign.logs.model"
import MomentContent from "../models/moment/moment.content.model"
import MomentContext from "../models/moment/moment.context.model"
import MomentDevice from "../models/moment/moment.device.model"
import MomentEmbedding from "../models/moment/moment.embedding.model"
import MomentLocation from "../models/moment/moment.location.model"
import MomentMedia from "../models/moment/moment.media.model"
import MomentMetrics from "../models/moment/moment.metrics.model"
import Moment from "../models/moment/moment.model"
import MomentProcessing from "../models/moment/moment.processing.model"
import MomentProcessingStep from "../models/moment/moment.processing.step.model"
import MomentResolution from "../models/moment/moment.resolution.model"
import MomentStatus from "../models/moment/moment.status.model"
import MomentThumbnail from "../models/moment/moment.thumbnail.model"
import MomentVisibility from "../models/moment/moment.visibility.model"
import InteractionEvent from "../models/swipe.engine/interaction.event.model"
import PostCluster from "../models/swipe.engine/post.cluster.model"
import PostClusterRank from "../models/swipe.engine/post.cluster.rank.model"
import PostEmbedding from "../models/swipe.engine/post.embedding.model"
import { ENVIRONMENT } from "./environment"
// Swipe Engine models
import { Sequelize } from "sequelize"
import UserClusterRank from "../models/swipe.engine/user.cluster.rank.model"
import UserEmbedding from "../models/swipe.engine/user.embedding.model"
import UserInteractionHistory from "../models/swipe.engine/user.interaction.history.model"
import UserInteractionSummary from "../models/swipe.engine/user.interaction.summary.model"
import UserMetadata from "../models/user/user.metadata.model"
import User from "../models/user/user.model"
import UserPreferences from "../models/user/user.preferences.model"
import UserProfilePicture from "../models/user/user.profile.picture.model"
import UserStatistics from "../models/user/user.statistics.model"
import UserStatus from "../models/user/user.status.model"
import UserTerms from "../models/user/user.terms.model"
// Moment models
import { logger } from "@/shared"

/**
 * Interface para modelos que podem ser inicializados
 */
interface ModelWithInit {
    initialize?: (sequelize: Sequelize) => void
    associate?: (models: any) => void
    ensureFullTextIndex?: (sequelize: Sequelize) => Promise<void>
}

/**
 * Classe responsável pela configuração e inicialização do banco de dados
 */
export class DatabaseManager {
    private static instance: DatabaseManager
    private sequelize: Sequelize
    private models: ModelWithInit[] = [
        // Auth models
        AuthLog,

        // User models
        User,
        UserStatus,
        UserTerms,
        UserMetadata,
        UserPreferences,
        UserProfilePicture,
        UserStatistics,

        // Moment models
        Moment,
        MomentContent,
        MomentStatus,
        MomentVisibility,
        MomentMetrics,
        MomentContext,
        MomentDevice,
        MomentLocation,
        MomentProcessing,
        MomentProcessingStep,
        MomentEmbedding,
        MomentMedia,
        MomentThumbnail,
        MomentResolution,

        // Swipe Engine models
        InteractionEvent,
        PostCluster,
        PostClusterRank,
        PostEmbedding,
        UserClusterRank,
        UserEmbedding,
        UserInteractionHistory,
        UserInteractionSummary,
    ]
    private isInitialized = false

    private constructor() {
        this.sequelize = new Sequelize(ENVIRONMENT)
    }

    /**
     * Singleton pattern para garantir uma única instância
     */
    public static getInstance(): DatabaseManager {
        if (!DatabaseManager.instance) {
            DatabaseManager.instance = new DatabaseManager()
        }
        return DatabaseManager.instance
    }

    /**
     * Inicializa o banco de dados e todos os modelos
     */
    public async initialize(): Promise<void> {
        if (this.isInitialized) {
            logger.info("Banco de dados já foi inicializado")
            return
        }

        try {
            await this.connect()
            await this.initializeModels()
            await this.configureAssociations()
            await this.configureIndexes()
            await this.syncModels()

            this.isInitialized = true
            logger.info("Banco de dados inicializado com sucesso!")
        } catch (error) {
            await this.handleInitializationError(error)
        }
    }

    /**
     * Estabelece conexão com o banco de dados
     */
    private async connect(): Promise<void> {
        await this.sequelize.authenticate()
        logger.info("Conexão com o banco de dados estabelecida com sucesso")
    }

    /**
     * Inicializa todos os modelos registrados
     */
    private async initializeModels(): Promise<void> {
        logger.info("Inicializando modelos")
        for (const model of this.models) {
            if (model.initialize) {
                model.initialize(this.sequelize)
            }
        }
    }

    /**
     * Configura as associações entre modelos
     */
    private async configureAssociations(): Promise<void> {
        logger.info("Configurando associações")
        for (const model of this.models) {
            if (model.associate) {
                model.associate(this.sequelize.models)
            }
        }
    }

    /**
     * Configura índices especiais nos modelos
     */
    private async configureIndexes(): Promise<void> {
        logger.info("Configurando índices especiais")
        for (const model of this.models) {
            if (model.ensureFullTextIndex) {
                await model.ensureFullTextIndex(this.sequelize)
            }
        }
    }

    /**
     * Sincroniza modelos com o banco (apenas em desenvolvimento)
     */
    private async syncModels(): Promise<void> {
        // Desabilitar sync - usar apenas migrations para evitar conflitos de índices
        logger.info("Sincronização de modelos desabilitada - usando migrations")
        // if (process.env.NODE_ENV === "development") {
        //     logger.info("Sincronizando modelos com o banco")
        //     await this.sequelize.sync({ alter: true })
        // }
    }

    /**
     * Trata erros de inicialização
     */
    private async handleInitializationError(error: any): Promise<void> {
        if (error instanceof SystemError) {
            throw error
        }

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

    /**
     * Retorna a instância do Sequelize
     */
    public getSequelize(): Sequelize {
        return this.sequelize
    }

    /**
     * Fecha a conexão com o banco de dados
     */
    public async close(): Promise<void> {
        if (this.isInitialized) {
            await this.sequelize.close()
            this.isInitialized = false
            logger.info("Conexão com o banco de dados fechada")
        }
    }
}

// Instância singleton do gerenciador de banco
const databaseManager = DatabaseManager.getInstance()

// Exportações para compatibilidade com código existente
export const sequelize = databaseManager.getSequelize()
export const initialize = async () => {
    const { DatabaseAdapterFactory } = await import("./adapter")
    const databaseAdapter = DatabaseAdapterFactory.createForEnvironment(
        process.env.NODE_ENV || "development",
    )
    return databaseAdapter.connect()
}
export const connection = sequelize

// Exportações do adapter
export { DatabaseAdapterFactory } from "./adapter"
export type { DatabaseAdapter } from "./adapter"

// Exportação padrão
export default databaseManager
