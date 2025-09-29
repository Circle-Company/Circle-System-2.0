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
    headers: {
        type: "object",
        required: [
            "device",
            "ipAddress",
            "machineId",
            "userAgent",
            "timezone",
            "latitude",
            "longitude",
        ],
        properties: {
            device: { type: "string" },
            ipAddress: { type: "string" },
            machineId: { type: "string" },
            userAgent: { type: "string" },
            timezone: { type: "string" },
            latitude: { type: "number" },
            longitude: { type: "number" },
        },
    },
}

export const signUpSchema = {
    body: {
        type: "object",
        required: ["username", "password"],
        properties: {
            username: { type: "string", minLength: 4, maxLength: 20 },
            password: { type: "string", minLength: 4, maxLength: 20 },
        },
    },
    headers: {
        type: "object",
        required: [
            "device",
            "ipAddress",
            "machineId",
            "userAgent",
            "timezone",
            "latitude",
            "longitude",
        ],
        properties: {
            device: { type: "string" },
            ipAddress: { type: "string" },
            machineId: { type: "string" },
            userAgent: { type: "string" },
            timezone: { type: "string" },
            latitude: { type: "number" },
            longitude: { type: "number" },
        },
    },
}
