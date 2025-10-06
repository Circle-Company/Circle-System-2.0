/**
 * Build Processor Ultra Simplificado
 * Apenas Path Fixer
 */

const { AdvancedPathFixer } = require("./core/path.fixer")

class BuildProcessor {
    constructor(options = {}) {
        this.options = {
            buildDir: options.buildDir || "./build",
            verbose: options.verbose || false,
            dryRun: options.dryRun || false,
        }
    }

    /**
     * Executa apenas o path fixer
     */
    async build() {
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

module.exports = {
    BuildProcessor,
    BuildProcessorFactory,
}
