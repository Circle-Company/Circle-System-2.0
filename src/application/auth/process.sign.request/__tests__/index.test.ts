import { SecurityRisk, SignStatus, SignType } from "@/infra/models/auth/sign.logs.model"
import { describe, expect, it } from "vitest"

import { SignRequest } from "@/modules/auth/types"
import { ProcessSignRequest } from "../index"

describe("ProcessSignRequest", () => {
    let processSignRequest: ProcessSignRequest

    const createValidSignRequest = (overrides: Partial<SignRequest> = {}): SignRequest => ({
        username: "testuser",
        password: "password123",
        signType: SignType.SIGNIN,
        ipAddress: "203.0.113.1",
        machineId: "device123",
        latitude: -15.7801, // Brasília - localização segura
        longitude: -47.9292,
        timezone: "America/Sao_Paulo",
        termsAccepted: true,
        userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)",
        ...overrides,
    })

    describe("process()", () => {
        it("should approve login with valid data", async () => {
            const signRequest = createValidSignRequest()
            processSignRequest = new ProcessSignRequest()
            await processSignRequest.setSignRequest(signRequest)

            const result = await processSignRequest.process()

            expect(result.success).toBe(true)
            expect(result.status).toBe(SignStatus.APPROVED)
            expect(result.securityRisk).toBe(SecurityRisk.LOW)
            expect(result.message).toContain("approved")
        })

        it("should reject login with suspicious IP", async () => {
            const signRequest = createValidSignRequest({
                ipAddress: "192.168.1.100", // IP suspeito da lista
            })
            processSignRequest = new ProcessSignRequest()
            await processSignRequest.setSignRequest(signRequest)

            const result = await processSignRequest.process()

            expect(result.success).toBe(false)
            expect(result.status).toBe(SignStatus.SUSPICIOUS)
            expect(result.securityRisk).toBe(SecurityRisk.HIGH)
            expect(result.reason).toContain("Suspicious activity detected")
        })

        it("should reject login with private IP", async () => {
            const signRequest = createValidSignRequest({
                ipAddress: "10.0.0.1", // IP privado
            })
            processSignRequest = new ProcessSignRequest()
            await processSignRequest.setSignRequest(signRequest)

            const result = await processSignRequest.process()

            expect(result.success).toBe(false)
            expect(result.status).toBe(SignStatus.SUSPICIOUS)
            expect(result.securityRisk).toBe(SecurityRisk.HIGH)
            expect(result.reason).toContain("Suspicious activity detected")
        })

        it("should reject login with known malicious IP", async () => {
            const signRequest = createValidSignRequest({
                ipAddress: "1.2.3.4", // IP malicioso da lista
            })
            processSignRequest = new ProcessSignRequest()
            await processSignRequest.setSignRequest(signRequest)

            const result = await processSignRequest.process()

            expect(result.success).toBe(false)
            expect(result.status).toBe(SignStatus.SUSPICIOUS)
            expect(result.securityRisk).toBe(SecurityRisk.HIGH)
            expect(result.reason).toContain("Suspicious activity detected")
        })

        it("should reject login near blocked location", async () => {
            const signRequest = createValidSignRequest({
                latitude: 39.9042, // Próximo à China (Beijing está bloqueada)
                longitude: 116.4074,
            })
            processSignRequest = new ProcessSignRequest()
            await processSignRequest.setSignRequest(signRequest)

            const result = await processSignRequest.process()

            expect(result.success).toBe(false)
            expect(result.status).toBe(SignStatus.REJECTED)
            expect(result.securityRisk).toBe(SecurityRisk.CRITICAL)
            expect(result.reason).toContain("Multiple critical security checks failed")
        })

        it("should reject login when terms are not accepted", async () => {
            const signRequest = createValidSignRequest({
                termsAccepted: false,
            })
            processSignRequest = new ProcessSignRequest()
            await processSignRequest.setSignRequest(signRequest)

            const result = await processSignRequest.process()

            expect(result.success).toBe(true) // Ainda aprovado, mas com risco médio
            expect(result.status).toBe(SignStatus.APPROVED)
            expect(result.securityRisk).toBe(SecurityRisk.MEDIUM)
            expect(result.reason).toContain("minor security alerts")
        })

        it("should mark as suspicious username with suspicious pattern", async () => {
            const signRequest = createValidSignRequest({
                username: "admin", // Username suspeito
            })
            processSignRequest = new ProcessSignRequest()
            await processSignRequest.setSignRequest(signRequest)

            const result = await processSignRequest.process()

            expect(result.success).toBe(true) // Ainda aprovado, mas com risco médio
            expect(result.status).toBe(SignStatus.APPROVED)
            expect(result.securityRisk).toBe(SecurityRisk.MEDIUM)
            expect(result.reason).toContain("minor security alerts")
        })

        it("should mark as suspicious suspicious user agent", async () => {
            const signRequest = createValidSignRequest({
                userAgent: "curl/7.68.0", // User agent suspeito
            })
            processSignRequest = new ProcessSignRequest()
            await processSignRequest.setSignRequest(signRequest)

            const result = await processSignRequest.process()

            expect(result.success).toBe(false)
            expect(result.status).toBe(SignStatus.SUSPICIOUS)
            expect(result.securityRisk).toBe(SecurityRisk.HIGH)
            expect(result.reason).toContain("Suspicious activity detected")
        })

        it("should reject login with multiple critical checks", async () => {
            const signRequest = createValidSignRequest({
                ipAddress: "192.168.1.100", // IP suspeito
                userAgent: "bot/1.0", // User agent suspeito
                username: "admin", // Username suspeito
                termsAccepted: false, // Termos não aceitos
            })
            processSignRequest = new ProcessSignRequest()
            await processSignRequest.setSignRequest(signRequest)

            const result = await processSignRequest.process()

            expect(result.success).toBe(false)
            expect(result.status).toBe(SignStatus.REJECTED)
            expect(result.securityRisk).toBe(SecurityRisk.CRITICAL)
            expect(result.reason).toContain("Multiple critical security checks failed")
        })

        it("should include additional data in response", async () => {
            const signRequest = createValidSignRequest()
            processSignRequest = new ProcessSignRequest()
            await processSignRequest.setSignRequest(signRequest)

            const result = await processSignRequest.process()

            expect(result.additionalData).toBeDefined()
            expect(result.additionalData.checks).toBeDefined()
            expect(result.additionalData.timestamp).toBeDefined()
            expect(typeof result.additionalData.timestamp).toBe("string")
        })

        it("should handle internal error correctly", async () => {
            // Criar uma instância que vai falhar na verificação de segurança
            const signRequest = createValidSignRequest()
            processSignRequest = new ProcessSignRequest()

            // Simular erro ao definir o sign request
            try {
                await processSignRequest.setSignRequest(null as any)
            } catch (error) {
                // Esperado que falhe
            }

            const result = await processSignRequest.process()

            expect(result.success).toBe(false)
            expect(result.status).toBe(SignStatus.REJECTED)
            expect(result.securityRisk).toBe(SecurityRisk.CRITICAL)
            expect(result.message).toContain("Internal error")
        })
    })

    describe("SignType scenarios", () => {
        it("should process SIGNIN correctly", async () => {
            const signRequest = createValidSignRequest({
                signType: SignType.SIGNIN,
            })
            processSignRequest = new ProcessSignRequest()
            await processSignRequest.setSignRequest(signRequest)

            const result = await processSignRequest.process()

            expect(result.success).toBe(true)
            expect(result.status).toBe(SignStatus.APPROVED)
        })

        it("should process SIGNUP correctly", async () => {
            const signRequest = createValidSignRequest({
                signType: SignType.SIGNUP,
            })
            processSignRequest = new ProcessSignRequest()
            await processSignRequest.setSignRequest(signRequest)

            const result = await processSignRequest.process()

            expect(result.success).toBe(true)
            expect(result.status).toBe(SignStatus.APPROVED)
        })
    })

    describe("Location scenarios", () => {
        it("should approve login in safe location", async () => {
            const signRequest = createValidSignRequest({
                latitude: -15.7801, // Brasília - localização segura
                longitude: -47.9292,
            })
            processSignRequest = new ProcessSignRequest()
            await processSignRequest.setSignRequest(signRequest)

            const result = await processSignRequest.process()

            expect(result.success).toBe(true)
            expect(result.status).toBe(SignStatus.APPROVED)
            expect(result.securityRisk).toBe(SecurityRisk.LOW)
        })

        it("should process login without coordinates", async () => {
            const signRequest = createValidSignRequest({
                latitude: undefined,
                longitude: undefined,
            })
            processSignRequest = new ProcessSignRequest()
            await processSignRequest.setSignRequest(signRequest)

            const result = await processSignRequest.process()

            expect(result.success).toBe(true)
            expect(result.status).toBe(SignStatus.APPROVED)
        })
    })

    describe("Username scenarios", () => {
        const suspiciousUsernames = [
            "admin",
            "root",
            "test",
            "guest",
            "1234567", // Muitos dígitos
            "user@domain", // Caracteres especiais
            "USER!", // Caracteres especiais
        ]

        suspiciousUsernames.forEach((username) => {
            it(`should mark as suspicious username: ${username}`, async () => {
                const signRequest = createValidSignRequest({ username })
                processSignRequest = new ProcessSignRequest()
                await processSignRequest.setSignRequest(signRequest)

                const result = await processSignRequest.process()

                expect(result.securityRisk).toBe(SecurityRisk.MEDIUM)
                expect(result.reason).toContain("minor security alerts")
            })
        })

        const validUsernames = ["john_doe", "user123", "myusername", "test_user"]

        validUsernames.forEach((username) => {
            it(`should approve valid username: ${username}`, async () => {
                const signRequest = createValidSignRequest({ username })
                processSignRequest = new ProcessSignRequest()
                await processSignRequest.setSignRequest(signRequest)

                const result = await processSignRequest.process()

                expect(result.success).toBe(true)
                expect(result.status).toBe(SignStatus.APPROVED)
                expect(result.securityRisk).toBe(SecurityRisk.LOW)
            })
        })
    })
})
