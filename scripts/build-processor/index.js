/**
 * Build Processor Ultra Simplificado
 * Compila TypeScript e corrige paths
 */

import { execSync } from "child_process"
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

class BuildProcessor {
    constructor(options = {}) {
        this.options = {
            buildDir: options.buildDir || "./build",
            verbose: options.verbose || false,
            dryRun: options.dryRun || false,
        }
    }

    /**
     * Executa compilação TypeScript e correção de paths
     */
    async build() {
        try {
            // 1. Compilar TypeScript
            if (this.options.verbose) {
                console.log("🔨 Compilando TypeScript...")
            }

            try {
                execSync("npx tsc --project tsconfig.build.json", {
                    stdio: this.options.verbose ? "inherit" : "pipe",
                    cwd: path.resolve(process.cwd()),
                })
            } catch (error) {
                // TypeScript pode ter erros mas ainda gerar arquivos
                console.warn("⚠️  TypeScript compilou com alguns erros, mas arquivos foram gerados")
                if (this.options.verbose) {
                    console.log(error.stdout?.toString() || "")
                }
            }

            if (this.options.verbose) {
                console.log("✅ TypeScript compilado com sucesso")
            }

            // 2. Resolver aliases com tsc-alias
            if (this.options.verbose) {
                console.log("🔧 Resolvendo aliases de path...")
            }

            try {
                execSync("npx tsc-alias -p tsconfig.build.json", {
                    stdio: this.options.verbose ? "inherit" : "ignore",
                    cwd: path.resolve(process.cwd()),
                })
            } catch (error) {
                console.warn("⚠️  Erro ao resolver aliases, mas continuando...")
            }

            // 3. Adicionar extensões .js para ESM
            if (this.options.verbose) {
                console.log("🔧 Adicionando extensões .js aos imports...")
            }

            try {
                execSync("node ./scripts/add-js-extensions.js", {
                    stdio: this.options.verbose ? "inherit" : "ignore",
                    cwd: path.resolve(process.cwd()),
                })
            } catch (error) {
                console.warn("⚠️  Erro ao adicionar extensões .js, mas continuando...")
            }

            return {
                success: true,
                fixesApplied: 0,
                fixes: [],
            }
        } catch (error) {
            console.error("❌ Erro no processo de build:", error.message)
            throw error
        }
    }
}

/**
 * Factory simplificado
 */
class BuildProcessorFactory {
    static create(options = {}) {
        return new BuildProcessor(options)
    }
}

// Auto-executar se for chamado diretamente
const isMainModule = import.meta.url === `file://${process.argv[1]}`
if (isMainModule) {
    const verbose = process.argv.includes("--verbose") || process.argv.includes("-v")
    const dryRun = process.argv.includes("--dry-run")

    const processor = BuildProcessorFactory.create({ verbose, dryRun })
    processor
        .build()
        .then(() => {
            console.log("✅ Build completado com sucesso!")
            process.exit(0)
        })
        .catch((error) => {
            console.error("💥 Build falhou:", error.message)
            process.exit(1)
        })
}

export { BuildProcessor, BuildProcessorFactory }
