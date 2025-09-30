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
        },
    },
}

export const signUpSchema = {
    body: {
        type: "object",
        required: ["username", "password"],
        properties: {
            username: { type: "string", minLength: 4, maxLength: 20 },
            password: { type: "string", minLength: 6, maxLength: 128 },
        },
    },
}
