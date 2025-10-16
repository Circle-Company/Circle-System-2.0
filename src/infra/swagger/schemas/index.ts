import { signInSchema, signUpSchema } from "./auth.schemas"
import { CommonSchemas } from "./common.schemas"
import {
    CommentSchema,
    CreateMomentSchema,
    GetAnalyticsQuerySchema,
    GetMomentMetricsQuerySchema,
    ListMomentsQuerySchema,
    MomentErrorSchema,
    MomentListResponseSchema,
    MomentMetricsResponseSchema,
    MomentResponseSchema,
    MomentsAnalyticsResponseSchema,
    ReportSchema,
    SearchMomentsQuerySchema,
    UpdateMomentSchema,
} from "./moment.schemas"
import { UserSchemas } from "./user.schemas"

export const AllSchemas = {
    // ===== COMMON SCHEMAS =====
    ...CommonSchemas,

    // ===== AUTH SCHEMAS =====
    SignInRequest: signInSchema.body,
    SignInHeaders: signInSchema.headers,
    SignUpRequest: signUpSchema.body,
    SignUpHeaders: signUpSchema.headers,

    // ===== USER SCHEMAS =====
    ...UserSchemas,

    // ===== MOMENT SCHEMAS =====
    CreateMoment: CreateMomentSchema,
    UpdateMoment: UpdateMomentSchema,
    Comment: CommentSchema,
    Report: ReportSchema,
    ListMomentsQuery: ListMomentsQuerySchema,
    SearchMomentsQuery: SearchMomentsQuerySchema,
    MomentResponse: MomentResponseSchema,
    MomentListResponse: MomentListResponseSchema,
    MomentError: MomentErrorSchema,

    // ===== METRICS SCHEMAS =====
    GetMomentMetricsQuery: GetMomentMetricsQuerySchema,
    GetAnalyticsQuery: GetAnalyticsQuerySchema,
    MomentMetricsResponse: MomentMetricsResponseSchema,
    MomentsAnalyticsResponse: MomentsAnalyticsResponseSchema,

    // ===== DEPRECATED (manter para compatibilidade) =====
    ValidationError: CommonSchemas.ValidationError,
    Error: CommonSchemas.ErrorResponse,
}

export const Schemas = AllSchemas

// Export individual schema modules
export * from "./auth.schemas"
export { CommonSchemas } from "./common.schemas"
export * from "./moment.schemas"
export { UserSchemas } from "./user.schemas"
