import { UserSearchController } from "@/infra/controllers/user.search.controller"
import { Router } from "express"

/**
 * User Search Router
 *
 * Router para endpoints de busca de usuários
 */
export class UserSearchRouter {
    private router: Router
    private userSearchController: UserSearchController

    constructor(userSearchController: UserSearchController) {
        this.router = Router()
        this.userSearchController = userSearchController
        this.setupRoutes()
    }

    private setupRoutes(): void {
        // Middleware de validação e rate limiting
        this.router.use(UserSearchController.validateSearchRequest)
        this.router.use(UserSearchController.rateLimitMiddleware)

        // Endpoint principal de busca
        this.router.post(
            "/search",
            this.handleAsync(this.userSearchController.searchUsers.bind(this.userSearchController)),
        )

        // Endpoints específicos por tipo de busca
        this.router.get(
            "/related",
            this.handleAsync(
                this.userSearchController.searchRelatedUsers.bind(this.userSearchController),
            ),
        )
        this.router.get(
            "/nearby",
            this.handleAsync(
                this.userSearchController.searchNearbyUsers.bind(this.userSearchController),
            ),
        )
        this.router.get(
            "/verified",
            this.handleAsync(
                this.userSearchController.searchVerifiedUsers.bind(this.userSearchController),
            ),
        )

        // Endpoint de sugestões
        this.router.get(
            "/suggestions",
            this.handleAsync(
                this.userSearchController.getSearchSuggestions.bind(this.userSearchController),
            ),
        )

        // Endpoint de estatísticas
        this.router.get(
            "/stats",
            this.handleAsync(
                this.userSearchController.getSearchStats.bind(this.userSearchController),
            ),
        )

        // Endpoint de saúde
        this.router.get("/health", this.handleHealthCheck.bind(this))
    }

    /**
     * Wrapper para lidar com funções assíncronas nos handlers
     */
    private handleAsync(fn: Function) {
        return (req: any, res: any, next: any) => {
            Promise.resolve(fn(req, res, next)).catch(next)
        }
    }

    /**
     * Endpoint de health check
     */
    private handleHealthCheck(req: any, res: any): void {
        res.status(200).json({
            status: "healthy",
            service: "user-search",
            timestamp: new Date(),
            version: "1.0.0",
        })
    }

    /**
     * Retorna o router configurado
     */
    public getRouter(): Router {
        return this.router
    }

    /**
     * Middleware de tratamento de erros
     */
    public static errorHandler(err: any, req: any, res: any, next: any): void {
        console.error("Erro no UserSearchRouter:", err)

        // Se já foi enviada uma resposta, não fazer nada
        if (res.headersSent) {
            return next(err)
        }

        // Determina o status code baseado no tipo de erro
        let statusCode = 500
        let message = "Erro interno do servidor"

        if (err.name === "ValidationError") {
            statusCode = 400
            message = "Erro de validação"
        } else if (err.name === "UnauthorizedError") {
            statusCode = 401
            message = "Não autorizado"
        } else if (err.name === "ForbiddenError") {
            statusCode = 403
            message = "Acesso negado"
        } else if (err.name === "NotFoundError") {
            statusCode = 404
            message = "Recurso não encontrado"
        } else if (err.name === "RateLimitError") {
            statusCode = 429
            message = "Muitas requisições"
        }

        res.status(statusCode).json({
            success: false,
            error: {
                type: "INTERNAL_ERROR",
                message,
                code: "INTERNAL_ERROR",
                timestamp: new Date(),
                ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
            },
        })
    }

    /**
     * Middleware de logging de requisições
     */
    public static requestLogger(req: any, res: any, next: any): void {
        const start = Date.now()

        res.on("finish", () => {
            const duration = Date.now() - start
            console.log(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms - ${req.ip}`)
        })

        next()
    }

    /**
     * Middleware de CORS
     */
    public static corsMiddleware(req: any, res: any, next: any): void {
        res.header("Access-Control-Allow-Origin", "*")
        res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        res.header(
            "Access-Control-Allow-Headers",
            "Origin, X-Requested-With, Content-Type, Accept, Authorization, X-User-ID, X-Session-ID",
        )

        if (req.method === "OPTIONS") {
            res.sendStatus(200)
        } else {
            next()
        }
    }

    /**
     * Middleware de autenticação (básico)
     */
    public static authMiddleware(req: any, res: any, next: any): void {
        // Verifica se há um token de autorização
        const authHeader = req.headers.authorization
        const userId = req.headers["x-user-id"]

        if (!authHeader && !userId) {
            return res.status(401).json({
                success: false,
                error: {
                    type: "PERMISSION_DENIED",
                    message: "Token de autorização ou user ID é obrigatório",
                    code: "PERMISSION_DENIED",
                    timestamp: new Date(),
                },
            })
        }

        // Em uma implementação completa, validaria o token JWT aqui
        // Por enquanto, apenas adiciona o userId ao request
        if (userId) {
            req.user = { id: userId }
        }

        next()
    }

    /**
     * Middleware de validação de parâmetros de query
     */
    public static validateQueryParams(req: any, res: any, next: any): void {
        const { limit, offset } = req.query

        // Valida limit
        if (limit !== undefined) {
            const limitNum = parseInt(limit as string)
            if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
                return res.status(400).json({
                    success: false,
                    error: {
                        type: "VALIDATION_ERROR",
                        message: "Limit deve ser um número entre 1 e 100",
                        code: "VALIDATION_ERROR",
                        timestamp: new Date(),
                    },
                })
            }
        }

        // Valida offset
        if (offset !== undefined) {
            const offsetNum = parseInt(offset as string)
            if (isNaN(offsetNum) || offsetNum < 0) {
                return res.status(400).json({
                    success: false,
                    error: {
                        type: "VALIDATION_ERROR",
                        message: "Offset deve ser um número maior ou igual a 0",
                        code: "VALIDATION_ERROR",
                        timestamp: new Date(),
                    },
                })
            }
        }

        next()
    }
}

/**
 * Factory para criar o router com todas as dependências
 */
export class UserSearchRouterFactory {
    static create(
        userSearchController: UserSearchController,
        options?: {
            enableCors?: boolean
            enableAuth?: boolean
            enableLogging?: boolean
            enableErrorHandling?: boolean
        },
    ): Router {
        const router = new UserSearchRouter(userSearchController)
        const expressRouter = router.getRouter()

        // Aplica middlewares opcionais
        if (options?.enableLogging) {
            expressRouter.use(UserSearchRouter.requestLogger)
        }

        if (options?.enableCors) {
            expressRouter.use(UserSearchRouter.corsMiddleware)
        }

        if (options?.enableAuth) {
            expressRouter.use(UserSearchRouter.authMiddleware)
        }

        expressRouter.use(UserSearchRouter.validateQueryParams)

        if (options?.enableErrorHandling) {
            expressRouter.use(UserSearchRouter.errorHandler)
        }

        return expressRouter
    }
}
