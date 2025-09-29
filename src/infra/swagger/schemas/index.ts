import { signInSchema, signUpSchema } from "./auth.schemas"
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

export const AllSchemas = {
    // Auth schemas
    SignInRequest: signInSchema.body,
    SignInHeaders: signInSchema.headers,
    SignUpRequest: signUpSchema.body,
    SignUpHeaders: signUpSchema.headers,

    // Moment schemas
    CreateMoment: CreateMomentSchema,
    UpdateMoment: UpdateMomentSchema,
    Comment: CommentSchema,
    Report: ReportSchema,
    ListMomentsQuery: ListMomentsQuerySchema,
    SearchMomentsQuery: SearchMomentsQuerySchema,
    MomentResponse: MomentResponseSchema,
    MomentListResponse: MomentListResponseSchema,
    MomentError: MomentErrorSchema,

    // Metrics schemas
    GetMomentMetricsQuery: GetMomentMetricsQuerySchema,
    GetAnalyticsQuery: GetAnalyticsQuerySchema,
    MomentMetricsResponse: MomentMetricsResponseSchema,
    MomentsAnalyticsResponse: MomentsAnalyticsResponseSchema,

    // Common schemas
    ValidationError: {
        type: "object",
        properties: {
            message: { type: "string" },
            details: { type: "object" },
            code: { type: "string" },
        },
        required: ["message"],
    },
    Error: {
        type: "object",
        properties: {
            success: { type: "boolean", default: false },
            error: {
                type: "object",
                properties: {
                    message: { type: "string" },
                    code: { type: "string" },
                    timestamp: { type: "string", format: "date-time" },
                },
                required: ["message"],
            },
        },
        required: ["success", "error"],
    },
}

export const Schemas = AllSchemas
