/**
 * API Adapter System - Exportações principais
 *
 * Sistema desacoplado para APIs HTTP seguindo Clean Architecture
 */

// Tipos e interfaces
export type {
    AdapterType,
    HttpAdapter,
    HttpRequest,
    HttpResponse,
    RouteHandler,
    RouteOptions,
} from "./http.type"

export {
    Adapter,
    BaseAdapter,
    BaseHttpAdapter,
    FastifyAdapter,
    FastifyRouteHandlerAdapter,
    HttpAdapterInterface,
    MockAdapter,
} from "./http.adapters"
export { createHttp, HttpFactory } from "./http.factory"
