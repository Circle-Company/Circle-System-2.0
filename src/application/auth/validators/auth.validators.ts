/**
 * Validadores compartilhados entre SignIn e SignUp Use Cases
 *
 * @author Circle System Team
 * @version 1.0.0
 */

import { Device } from "@/domain/auth"
import { SignInputDto } from "@/domain/auth/auth.dtos"
import {
    InvalidCoordinatesError,
    InvalidDeviceError,
    InvalidIpAddressError,
    InvalidMetadataError,
    InvalidTimezoneError,
} from "@/shared"

export class AuthValidators {
    /**
     * Valida se é um IP address válido (IPv4 ou IPv6)
     */
    static isValidIpAddress(ip: string): boolean {
        // Regex simples para IPv4
        const ipv4Regex =
            /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/

        // Regex simples para IPv6 (simplificado)
        const ipv6Regex = /^([0-9a-fA-F]{0,4}:){7}[0-9a-fA-F]{0,4}$/

        return ipv4Regex.test(ip) || ipv6Regex.test(ip)
    }

    /**
     * Valida se é um timezone válido
     */
    static isValidTimezone(timezone: string): boolean {
        try {
            // Tenta criar um formatter com o timezone para validar
            Intl.DateTimeFormat(undefined, { timeZone: timezone })
            return true
        } catch {
            return false
        }
    }

    /**
     * Valida se as coordenadas geográficas são válidas
     */
    static areValidCoordinates(latitude?: number, longitude?: number): boolean {
        if (latitude === undefined || longitude === undefined) {
            return false
        }

        if (typeof latitude !== "number" || typeof longitude !== "number") {
            return false
        }

        if (isNaN(latitude) || isNaN(longitude)) {
            return false
        }

        // Latitude deve estar entre -90 e 90
        if (latitude < -90 || latitude > 90) {
            return false
        }

        // Longitude deve estar entre -180 e 180
        if (longitude < -180 || longitude > 180) {
            return false
        }

        return true
    }

    /**
     * Valida se é um código de linguagem válido (ISO 639-1)
     */
    static isValidLanguageCode(language: string): boolean {
        if (typeof language !== "string") {
            return false
        }

        // Deve ter 2 caracteres
        if (language.length !== 2) {
            return false
        }

        // Deve conter apenas letras
        return /^[a-z]{2}$/i.test(language)
    }

    /**
     * Valida os dados de metadata (versão comum)
     */
    static validateMetadata(
        metadata: SignInputDto["metadata"],
        options: {
            requireDevice?: boolean
            requireTermsAccepted?: boolean
        } = {},
    ): void {
        // 1. Verificar se metadata existe
        if (!metadata) {
            throw new InvalidMetadataError("Metadata is required")
        }

        // 2. Validar device (obrigatório se especificado)
        if (options.requireDevice) {
            if (!metadata.device) {
                throw new InvalidDeviceError("Device is required")
            }

            const validDevices = Object.values(Device)
            if (!validDevices.includes(metadata.device)) {
                throw new InvalidDeviceError(
                    `Invalid device type: ${metadata.device}. Valid types: ${validDevices.join(
                        ", ",
                    )}`,
                )
            }
        }

        // 3. Validar ipAddress (obrigatório)
        if (!metadata.ipAddress) {
            throw new InvalidIpAddressError()
        }

        if (!this.isValidIpAddress(metadata.ipAddress)) {
            throw new InvalidIpAddressError(metadata.ipAddress)
        }

        // 4. Validar termsAccepted (se obrigatório)
        if (options.requireTermsAccepted && metadata.termsAccepted !== true) {
            throw new InvalidMetadataError("Terms must be accepted")
        }

        // 5. Validar timezone (opcional mas se fornecido deve ser válido)
        if (metadata.timezone && !this.isValidTimezone(metadata.timezone)) {
            throw new InvalidTimezoneError(metadata.timezone)
        }

        // 6. Validar coordenadas (opcional mas se fornecidas devem ser válidas)
        if (metadata.latitude !== undefined || metadata.longitude !== undefined) {
            if (!this.areValidCoordinates(metadata.latitude, metadata.longitude)) {
                throw new InvalidCoordinatesError(metadata.latitude, metadata.longitude)
            }
        }

        // 7. Validar userAgent (opcional mas se fornecido deve ser string não vazia)
        if (metadata.userAgent !== undefined) {
            if (typeof metadata.userAgent !== "string" || metadata.userAgent.trim().length === 0) {
                throw new InvalidMetadataError("User agent must be a non-empty string")
            }
        }

        // 8. Validar machineId (opcional mas se fornecido deve ser string válida)
        if (metadata.machineId !== undefined) {
            if (typeof metadata.machineId !== "string" || metadata.machineId.trim().length === 0) {
                throw new InvalidMetadataError("Machine ID must be a non-empty string")
            }
        }

        // 9. Validar language (opcional mas se fornecido deve ser código válido)
        if (metadata.language !== undefined) {
            if (!this.isValidLanguageCode(metadata.language)) {
                throw new InvalidMetadataError(
                    `Invalid language code: ${metadata.language}. Must be a 2-letter ISO 639-1 code`,
                )
            }
        }
    }
}
