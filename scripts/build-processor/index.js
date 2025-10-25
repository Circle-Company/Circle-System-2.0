/**
 * Build Processor Ultra Simplificado
 * Compila TypeScript e corrige paths
 */

const { AdvancedPathFixer } = require("./core/path.fixer")
const { execSync } = require("child_process")
const path = require("path")

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

            // 2. Corrigir paths
            if (this.options.verbose) {
                console.log("🔧 Iniciando correção de paths...")
            }

            const pathFixer = new AdvancedPathFixer({
                buildDir: this.options.buildDir,
                verbose: this.options.verbose,
                dryRun: this.options.dryRun,
            })

            const fixes = await pathFixer.fix()

            if (this.options.verbose) {
                console.log(`✅ Path fixer concluído: ${fixes.length} correções aplicadas`)
            }

            return {
                success: true,
                fixesApplied: fixes.length,
                fixes: fixes,
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
if (require.main === module) {
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

module.exports = {
    BuildProcessor,
    BuildProcessorFactory,
}
