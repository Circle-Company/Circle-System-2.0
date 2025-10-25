// TEMPORARIAMENTE DESABILITADO PARA BUILD DOCKER
// import { CircleTextProps, TextLibrary } from "circle-text-library"
import type { CircleTextProps } from "circle-text-library"

import { userRules } from "@/domain/user/user.rules"

// Função para converter regras do user.rules.ts para o formato ValidationConfig
function createValidationConfig(): CircleTextProps["validationRules"] {
    const rules = userRules()

    return {
        username: {
            minLength: {
                enabled: false,
                value: rules.username.minLength,
                description: "Username must have at least 4 characters",
            },
            maxLength: {
                enabled: false,
                value: rules.username.maxLength,
                description: "Username must have at most 20 characters",
            },
            allowedCharacters: {
                enabled: false,
                value: rules.username.allowedCharacters,
                description: "Username must contain only letters, numbers and ._-",
            },
            cannotStartWith: {
                enabled: false,
                value: rules.username.cannotStartWith,
                description: "Username cannot start with .",
            },
            cannotEndWith: {
                enabled: false,
                value: rules.username.cannotEndWith,
                description: "Username cannot end with .",
            },
            cannotContainConsecutive: {
                enabled: false,
                value: rules.username.cannotContainConsecutive,
                description: "Username cannot contain consecutive characters",
            },
            allowAtPrefix: {
                enabled: false,
                value: rules.username.allowAtPrefix,
                description: "Username must start with @",
            },
            allowedSpecialCharacters: {
                enabled: false,
                value: rules.username.allowedSpecialCharacters,
                description: "Username must contain only allowed special characters",
            },
            forbiddenSpecialCharacters: {
                enabled: false,
                value: rules.username.forbiddenSpecialCharacters,
                description: "Username must not contain forbidden special characters",
            },
            onlyAlphaNumeric: {
                enabled: false,
                value: rules.username.onlyAlphaNumeric,
                description: "Username must contain only letters and numbers",
            },
            requireSpecialCharacters: {
                enabled: false,
                value: rules.username.requireSpecialCharacters,
                description: "Username must contain at least one special character",
            },
        },
        name: {
            minLength: {
                enabled: false,
                value: rules.name.minLength,
                description: "Name must have at least 2 characters",
            },
            maxLength: {
                enabled: false,
                value: rules.name.maxLength,
                description: "Name must have at most 100 characters",
            },
            allowedCharacters: {
                enabled: false,
                value: rules.name.allowedCharacters,
                description: "Name must contain only letters and spaces",
            },
            requireOnlyLetters: {
                enabled: false,
                value: rules.name.requireOnlyLetters,
                description: "Name must contain only letters",
            },
            requireFullName: {
                enabled: false,
                value: rules.name.requireFullName,
                description: "Name must be complete",
            },
            forbiddenNames: {
                enabled: false,
                value: rules.name.forbiddenNames,
                description: "Name cannot be a forbidden word",
            },
            cannotContainNumbers: {
                enabled: false,
                value: rules.name.cannotContainNumbers,
                description: "Name cannot contain numbers",
            },
            cannotContainSpecialChars: {
                enabled: false,
                value: rules.name.cannotContainSpecialChars,
                description: "Name cannot contain special characters",
            },
            requireCapitalization: {
                enabled: false,
                value: rules.name.requireCapitalization,
                description: "Name must have proper capitalization",
            },
            cannotStartWith: {
                enabled: false,
                value: rules.name.cannotStartWith,
                description: "Name cannot start with space",
            },
            cannotEndWith: {
                enabled: false,
                value: rules.name.cannotEndWith,
                description: "Name cannot end with space",
            },
        },
        description: {
            minLength: {
                enabled: false,
                value: rules.description.minLength,
                description: "Description must have at least 10 characters",
            },
            maxLength: {
                enabled: false,
                value: rules.description.maxLength,
                description: "Description must have at most 300 characters",
            },
            allowedCharacters: {
                enabled: false,
                value: rules.description.allowedCharacters,
                description: "Description must contain only allowed characters",
            },
            forbiddenWords: {
                enabled: false,
                value: rules.description.forbiddenWords,
                description: "Description cannot contain forbidden words",
            },
            requireAlphanumeric: {
                enabled: false,
                value: rules.description.requireAlphanumeric,
                description: "Description must contain alphanumeric characters",
            },
            cannotStartWith: {
                enabled: false,
                value: rules.description.cannotStartWith,
                description: "Description cannot start with space",
            },
            cannotEndWith: {
                enabled: false,
                value: rules.description.cannotEndWith,
                description: "Description cannot end with space",
            },
            allowUrls: {
                enabled: false,
                value: rules.description.allowUrls,
                description: "Description can contain URLs",
            },
            allowMentions: {
                enabled: false,
                value: rules.description.allowMentions,
                description: "Description can contain mentions",
            },
            allowHashtags: {
                enabled: false,
                value: rules.description.allowHashtags,
                description: "Description can contain hashtags",
            },
        },
        password: {
            minLength: {
                enabled: false,
                value: rules.password.minLength,
                description: `Password must have at least ${rules.password.minLength} characters`,
            },
            maxLength: {
                enabled: false,
                value: rules.password.maxLength,
                description: "Password must have at most 128 characters",
            },
            requireUppercase: {
                enabled: false,
                value: rules.password.requireUppercase,
                description: "Password must contain at least one uppercase letter",
            },
            requireLowercase: {
                enabled: false,
                value: rules.password.requireLowercase,
                description: "Password must contain at least one lowercase letter",
            },
            requireNumbers: {
                enabled: false,
                value: rules.password.requireNumbers,
                description: "Password must contain at least one number",
            },
            requireSpecialChars: {
                enabled: false,
                value: rules.password.requireSpecialChars,
                description: "Password must contain at least one special character",
            },
            allowedSpecialChars: {
                enabled: false,
                value: rules.password.allowedSpecialChars,
                description: "Password must contain only allowed special characters",
            },
            forbiddenSpecialChars: {
                enabled: false,
                value: rules.password.forbiddenSpecialChars,
                description: "Password must not contain forbidden special characters",
            },
            requireCommonPasswords: {
                enabled: false,
                value: rules.password.requireCommonPasswords,
                description: "Password must be common",
            },
            forbiddenWords: {
                enabled: false,
                value: rules.password.forbiddenWords,
                description: "Password cannot contain forbidden words",
            },
            cannotContainUsername: {
                enabled: false,
                value: rules.password.cannotContainUsername,
                description: "Password cannot contain the username",
            },
            cannotContainEmail: {
                enabled: false,
                value: rules.password.cannotContainEmail,
                description: "Password cannot contain the email",
            },
            cannotStartWith: {
                enabled: false,
                value: rules.password.cannotStartWith,
                description: "Password cannot start with space",
            },
            cannotEndWith: {
                enabled: false,
                value: rules.password.cannotEndWith,
                description: "Password cannot end with space",
            },
            cannotBeRepeatedChars: {
                enabled: false,
                value: rules.password.cannotBeRepeatedChars,
                description: "Password cannot contain repeated characters",
            },
            cannotBeSequentialChars: {
                enabled: false,
                value: rules.password.cannotBeSequentialChars,
                description: "Password cannot contain sequential characters",
            },
            requireDigitAtPosition: {
                enabled: false,
                value: rules.password.requireDigitAtPosition,
                description: "Password must contain digit at specific position",
            },
        },
        hashtag: {
            requiredPrefix: {
                enabled: false,
                value: rules.hashtag.requiredPrefix,
                description: "Hashtag must start with #",
            },
            minLength: {
                enabled: false,
                value: rules.hashtag.minLength,
                description: "Hashtag must have at least 2 characters",
            },
            maxLength: {
                enabled: false,
                value: rules.hashtag.maxLength,
                description: "Hashtag must have at most 50 characters",
            },
            allowedCharacters: {
                enabled: false,
                value: rules.hashtag.allowedCharacters,
                description: "Hashtag must contain only letters, numbers and underscore",
            },
            cannotStartWith: {
                enabled: false,
                value: rules.hashtag.cannotStartWith,
                description: "Hashtag cannot start with space",
            },
            cannotEndWith: {
                enabled: false,
                value: rules.hashtag.cannotEndWith,
                description: "Hashtag cannot end with space",
            },
        },
        url: {
            requireProtocol: {
                enabled: false,
                value: rules.url.requireProtocol,
                description: "URL must contain protocol",
            },
            allowedProtocols: {
                enabled: false,
                value: rules.url.allowedProtocols,
                description: "URL must use allowed protocols",
            },
            minLength: {
                enabled: false,
                value: rules.url.minLength,
                description: "URL must have at least 10 characters",
            },
            maxLength: {
                enabled: false,
                value: rules.url.maxLength,
                description: "URL must have at most 2048 characters",
            },
        },
    }
}

function createSentimentConfig(): CircleTextProps["sentimentConfig"] {
    return {
        enableCache: false,
        enableEmojiAnalysis: true,
        enablePunctuationAnalysis: true,
        enableRepetitionAnalysis: true,
        enableContextAnalysis: true,
        enableIronyDetection: true,
        enableConnectorsAnalysis: true,
        enablePositionWeight: true,
    }
}

function createRulesConfig(): CircleTextProps["richTextConfig"] {
    return {
        mentionPrefix: "@",
        hashtagPrefix: "#",
    }
}

function createExtractConfig(): CircleTextProps["extractorConfig"] {
    return {
        mentionPrefix: "@",
        hashtagPrefix: "#",
    }
}

function createConversorConfig(): CircleTextProps["conversorConfig"] {
    return {
        defaultSliceLength: 100,
        sliceSuffix: "...",
        thousandsSeparator: ".",
    }
}

function createDateConfig(): CircleTextProps["dateFormatterConfig"] {
    return {
        style: "full",
        locale: "pt",
        usePrefix: true,
        useSuffix: true,
        capitalize: true,
        useApproximateTime: true,
        recentTimeThreshold: 60,
        recentTimeLabel: "agora",
    }
}

// TEMPORARIAMENTE DESABILITADO PARA BUILD DOCKER
// export const textLib = new TextLibrary({
//     validationRules: createValidationConfig(),
//     sentimentConfig: createSentimentConfig(),
//     richTextConfig: createRulesConfig(),
//     extractorConfig: createExtractConfig(),
//     conversorConfig: createConversorConfig(),
//     dateFormatterConfig: createDateConfig(),
// })

// Mock temporário para permitir build
export const textLib: any = {
    validate: () => ({ isValid: true, errors: [] }),
    sentiment: () => ({ score: 0, label: 'neutral' }),
    extract: () => ({ mentions: [], hashtags: [], urls: [] }),
    convert: () => '',
    format: () => '',
}

// export { Timezone } from "circle-text-library"
export type Timezone = string
