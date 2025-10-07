export const signInSchema = {
    body: {
        type: "object",
        required: ["username", "password"],
        properties: {
            username: {
                type: "string",
                minLength: 4,
                maxLength: 20,
            },
            password: {
                type: "string",
                minLength: 4,
                maxLength: 20,
            },
            latitude: {
                type: "number",
                minimum: -90,
                maximum: 90,
            },
            longitude: {
                type: "number",
                minimum: -180,
                maximum: 180,
            },
        },
        additionalProperties: false,
    },
}

export const signUpSchema = {
    body: {
        type: "object",
        required: ["username", "password"],
        properties: {
            username: { type: "string", minLength: 4, maxLength: 20 },
            password: { type: "string", minLength: 6, maxLength: 128 },
            latitude: {
                type: "number",
                minimum: -90,
                maximum: 90,
            },
            longitude: {
                type: "number",
                minimum: -180,
                maximum: 180,
            },
        },
        additionalProperties: false,
    },
}
