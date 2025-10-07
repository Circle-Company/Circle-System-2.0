import { TextLibrary, Timezone } from "circle-text-library"

import { userRules } from "@/domain/user/user.rules"
import type { ValidationConfig } from "circle-text-library/dist/src/types"

// Função para converter regras do user.rules.ts para o formato ValidationConfig
function createValidationConfig(): ValidationConfig {
    const rules = userRules()

    return {
        username: {
            minLength: {
                enabled: false,
                value: rules.username.minLength,
                description: "Username deve ter pelo menos 4 caracteres",
            },
            maxLength: {
                enabled: false,
                value: rules.username.maxLength,
                description: "Username deve ter no máximo 20 caracteres",
            },
            allowedCharacters: {
                enabled: false,
                value: rules.username.allowedCharacters,
                description: "Username deve conter apenas letras, números e ._-",
            },
            cannotStartWith: {
                enabled: false,
                value: rules.username.cannotStartWith,
                description: "Username não pode começar com .",
            },
            cannotEndWith: {
                enabled: false,
                value: rules.username.cannotEndWith,
                description: "Username não pode terminar com .",
            },
            cannotContainConsecutive: {
                enabled: false,
                value: rules.username.cannotContainConsecutive,
                description: "Username não pode conter caracteres consecutivos",
            },
            allowAtPrefix: {
                enabled: false,
                value: rules.username.allowAtPrefix,
                description: "Username deve começar com @",
            },
            allowedSpecialCharacters: {
                enabled: false,
                value: rules.username.allowedSpecialCharacters,
                description: "Username deve conter apenas caracteres especiais permitidos",
            },
            forbiddenSpecialCharacters: {
                enabled: false,
                value: rules.username.forbiddenSpecialCharacters,
                description: "Username não deve conter caracteres especiais proibidos",
            },
            onlyAlphaNumeric: {
                enabled: false,
                value: rules.username.onlyAlphaNumeric,
                description: "Username deve conter apenas letras e números",
            },
            requireSpecialCharacters: {
                enabled: false,
                value: rules.username.requireSpecialCharacters,
                description: "Username deve conter pelo menos um caractere especial",
            },
        },
        name: {
            minLength: {
                enabled: false,
                value: rules.name.minLength,
                description: "Nome deve ter pelo menos 2 caracteres",
            },
            maxLength: {
                enabled: false,
                value: rules.name.maxLength,
                description: "Nome deve ter no máximo 100 caracteres",
            },
            allowedCharacters: {
                enabled: false,
                value: rules.name.allowedCharacters,
                description: "Nome deve conter apenas letras e espaços",
            },
            requireOnlyLetters: {
                enabled: false,
                value: rules.name.requireOnlyLetters,
                description: "Nome deve conter apenas letras",
            },
            requireFullName: {
                enabled: false,
                value: rules.name.requireFullName,
                description: "Nome deve ser completo",
            },
            forbiddenNames: {
                enabled: false,
                value: rules.name.forbiddenNames,
                description: "Nome não pode ser uma palavra proibida",
            },
            cannotContainNumbers: {
                enabled: false,
                value: rules.name.cannotContainNumbers,
                description: "Nome não pode conter números",
            },
            cannotContainSpecialChars: {
                enabled: false,
                value: rules.name.cannotContainSpecialChars,
                description: "Nome não pode conter caracteres especiais",
            },
            requireCapitalization: {
                enabled: false,
                value: rules.name.requireCapitalization,
                description: "Nome deve ter capitalização adequada",
            },
            cannotStartWith: {
                enabled: false,
                value: rules.name.cannotStartWith,
                description: "Nome não pode começar com espaço",
            },
            cannotEndWith: {
                enabled: false,
                value: rules.name.cannotEndWith,
                description: "Nome não pode terminar com espaço",
            },
        },
        description: {
            minLength: {
                enabled: false,
                value: rules.description.minLength,
                description: "Descrição deve ter pelo menos 10 caracteres",
            },
            maxLength: {
                enabled: false,
                value: rules.description.maxLength,
                description: "Descrição deve ter no máximo 300 caracteres",
            },
            allowedCharacters: {
                enabled: false,
                value: rules.description.allowedCharacters,
                description: "Descrição deve conter apenas caracteres permitidos",
            },
            forbiddenWords: {
                enabled: false,
                value: rules.description.forbiddenWords,
                description: "Descrição não pode conter palavras proibidas",
            },
            requireAlphanumeric: {
                enabled: false,
                value: rules.description.requireAlphanumeric,
                description: "Descrição deve conter caracteres alfanuméricos",
            },
            cannotStartWith: {
                enabled: false,
                value: rules.description.cannotStartWith,
                description: "Descrição não pode começar com espaço",
            },
            cannotEndWith: {
                enabled: false,
                value: rules.description.cannotEndWith,
                description: "Descrição não pode terminar com espaço",
            },
            allowUrls: {
                enabled: false,
                value: rules.description.allowUrls,
                description: "Descrição pode conter URLs",
            },
            allowMentions: {
                enabled: false,
                value: rules.description.allowMentions,
                description: "Descrição pode conter menções",
            },
            allowHashtags: {
                enabled: false,
                value: rules.description.allowHashtags,
                description: "Descrição pode conter hashtags",
            },
        },
        password: {
            minLength: {
                enabled: false,
                value: rules.password.minLength,
                description: `Senha deve ter pelo menos ${rules.password.minLength} caracteres`,
            },
            maxLength: {
                enabled: false,
                value: rules.password.maxLength,
                description: "Senha deve ter no máximo 128 caracteres",
            },
            requireUppercase: {
                enabled: false,
                value: rules.password.requireUppercase,
                description: "Senha deve conter pelo menos uma letra maiúscula",
            },
            requireLowercase: {
                enabled: false,
                value: rules.password.requireLowercase,
                description: "Senha deve conter pelo menos uma letra minúscula",
            },
            requireNumbers: {
                enabled: false,
                value: rules.password.requireNumbers,
                description: "Senha deve conter pelo menos um número",
            },
            requireSpecialChars: {
                enabled: false,
                value: rules.password.requireSpecialChars,
                description: "Senha deve conter pelo menos um caractere especial",
            },
            allowedSpecialChars: {
                enabled: false,
                value: rules.password.allowedSpecialChars,
                description: "Senha deve conter apenas caracteres especiais permitidos",
            },
            forbiddenSpecialChars: {
                enabled: false,
                value: rules.password.forbiddenSpecialChars,
                description: "Senha não deve conter caracteres especiais proibidos",
            },
            requireCommonPasswords: {
                enabled: false,
                value: rules.password.requireCommonPasswords,
                description: "Senha deve ser comum",
            },
            forbiddenWords: {
                enabled: false,
                value: rules.password.forbiddenWords,
                description: "Senha não pode conter palavras proibidas",
            },
            cannotContainUsername: {
                enabled: false,
                value: rules.password.cannotContainUsername,
                description: "Senha não pode conter o username",
            },
            cannotContainEmail: {
                enabled: false,
                value: rules.password.cannotContainEmail,
                description: "Senha não pode conter o email",
            },
            cannotStartWith: {
                enabled: false,
                value: rules.password.cannotStartWith,
                description: "Senha não pode começar com espaço",
            },
            cannotEndWith: {
                enabled: false,
                value: rules.password.cannotEndWith,
                description: "Senha não pode terminar com espaço",
            },
            cannotBeRepeatedChars: {
                enabled: false,
                value: rules.password.cannotBeRepeatedChars,
                description: "Senha não pode conter caracteres repetidos",
            },
            cannotBeSequentialChars: {
                enabled: false,
                value: rules.password.cannotBeSequentialChars,
                description: "Senha não pode conter caracteres sequenciais",
            },
            requireDigitAtPosition: {
                enabled: false,
                value: rules.password.requireDigitAtPosition,
                description: "Senha deve conter dígito em posição específica",
            },
        },
        hashtag: {
            requiredPrefix: {
                enabled: false,
                value: rules.hashtag.requiredPrefix,
                description: "Hashtag deve começar com #",
            },
            minLength: {
                enabled: false,
                value: rules.hashtag.minLength,
                description: "Hashtag deve ter pelo menos 2 caracteres",
            },
            maxLength: {
                enabled: false,
                value: rules.hashtag.maxLength,
                description: "Hashtag deve ter no máximo 50 caracteres",
            },
            allowedCharacters: {
                enabled: false,
                value: rules.hashtag.allowedCharacters,
                description: "Hashtag deve conter apenas letras, números e underscore",
            },
            cannotStartWith: {
                enabled: false,
                value: rules.hashtag.cannotStartWith,
                description: "Hashtag não pode começar com espaço",
            },
            cannotEndWith: {
                enabled: false,
                value: rules.hashtag.cannotEndWith,
                description: "Hashtag não pode terminar com espaço",
            },
        },
        url: {
            requireProtocol: {
                enabled: false,
                value: rules.url.requireProtocol,
                description: "URL deve conter protocolo",
            },
            allowedProtocols: {
                enabled: false,
                value: rules.url.allowedProtocols,
                description: "URL deve usar protocolos permitidos",
            },
            minLength: {
                enabled: false,
                value: rules.url.minLength,
                description: "URL deve ter pelo menos 10 caracteres",
            },
            maxLength: {
                enabled: false,
                value: rules.url.maxLength,
                description: "URL deve ter no máximo 2048 caracteres",
            },
        },
    }
}

export const circleTextLibrary = new TextLibrary({
    validationRules: createValidationConfig(),
})

export const timezone = Timezone
