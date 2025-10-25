/**
 * Sistema de Correção de Paths Avançado
 * Corrige TODOS os caminhos de importação em arquivos JavaScript compilados
 * Converte aliases @/ para caminhos relativos corretos baseados na estrutura de diretórios
 */

import fs from "fs"
import path from "path"

class AdvancedPathFixer {
    constructor(options = {}) {
        this.buildDir = options.buildDir || "./build"
        this.verbose = options.verbose || false
        this.dryRun = options.dryRun || false
        this.fixes = []
    }

    /**
     * Executa a correção de todos os caminhos
     */
    async fix() {
        if (this.verbose) {
            console.log("🔧 Starting comprehensive build path fixing...")
        }

        if (!fs.existsSync(this.buildDir)) {
            throw new Error(`Build directory not found: ${this.buildDir}`)
        }

        const files = this.getAllJsFiles(this.buildDir)
        if (this.verbose) {
            console.log(`📁 Found ${files.length} JavaScript files to process`)
        }

        // Primeiro, coletar todos os caminhos que precisam ser corrigidos
        const pathMappings = this.buildPathMappings(files)

        // Depois, aplicar as correções
        for (const file of files) {
            await this.fixFileWithMappings(file, pathMappings)
        }

        if (this.verbose) {
            this.logResults()
        }

        return this.fixes
    }

    /**
     * Constrói mapeamento de caminhos corretos
     */
    buildPathMappings(files) {
        const mappings = new Map()

        for (const file of files) {
            const content = fs.readFileSync(file, "utf8")
            const requireMatches = content.match(/require\("([^"]+)"\)/g)

            if (requireMatches) {
                for (const match of requireMatches) {
                    const requirePath = match.match(/require\("([^"]+)"\)/)[1]

                    if (requirePath.startsWith("@/")) {
                        const targetPath = requirePath.replace("@/", "")
                        const fileDir = path.dirname(file)
                        const buildDir = path.resolve(this.buildDir)

                        // Calcular caminho relativo correto
                        const targetFullPath = path.join(buildDir, targetPath)
                        const relativePath = path.relative(fileDir, targetFullPath)

                        // Normalizar caminho para usar barras corretas
                        const normalizedPath = relativePath.replace(/\\/g, "/")
                        const finalPath = normalizedPath.startsWith(".")
                            ? normalizedPath
                            : `./${normalizedPath}`

                        mappings.set(`${file}:${requirePath}`, finalPath)
                    }
                }
            }
        }

        return mappings
    }

    /**
     * Obtém todos os arquivos JavaScript recursivamente
     */
    getAllJsFiles(dir) {
        const files = []

        function walkDir(currentDir) {
            const items = fs.readdirSync(currentDir)

            for (const item of items) {
                const fullPath = path.join(currentDir, item)
                const stat = fs.statSync(fullPath)

                if (stat.isDirectory()) {
                    walkDir(fullPath)
                } else if (item.endsWith(".js")) {
                    files.push(fullPath)
                }
            }
        }

        walkDir(dir)
        return files
    }

    /**
     * Corrige caminhos em um arquivo usando os mapeamentos
     */
    async fixFileWithMappings(filePath, pathMappings) {
        try {
            const originalContent = fs.readFileSync(filePath, "utf8")
            let content = originalContent
            let hasChanges = false

            // Corrigir require() statements
            const requireMatches = content.match(/require\("([^"]+)"\)/g)
            if (requireMatches) {
                for (const match of requireMatches) {
                    const requirePath = match.match(/require\("([^"]+)"\)/)[1]
                    const mappingKey = `${filePath}:${requirePath}`

                    if (pathMappings.has(mappingKey)) {
                        const fixedPath = pathMappings.get(mappingKey)
                        content = content.replace(match, `require("${fixedPath}")`)
                        hasChanges = true

                        this.fixes.push({
                            file: filePath,
                            original: requirePath,
                            fixed: fixedPath,
                            type: "require",
                        })
                    }
                }
            }

            if (hasChanges) {
                if (!this.dryRun) {
                    fs.writeFileSync(filePath, content)
                }

                if (this.verbose) {
                    console.log(`✅ Fixed paths in: ${path.relative(process.cwd(), filePath)}`)
                }
            }
        } catch (error) {
            if (this.verbose) {
                console.warn(`⚠️ Failed to process ${filePath}: ${error.message}`)
            }
        }
    }

    /**
     * Exibe resultados da correção
     */
    logResults() {
        console.log("\n📊 Fix Results:")
        console.log(`Total fixes applied: ${this.fixes.length}`)

        if (this.fixes.length > 0) {
            console.log("\n🔧 Applied fixes:")
            this.fixes.forEach((fix, index) => {
                console.log(`${index + 1}. ${path.relative(process.cwd(), fix.file)}`)
                console.log(`   ${fix.type}: "${fix.original}" → "${fix.fixed}"`)
            })
        }

        if (this.dryRun) {
            console.log("\n⚠️ DRY RUN - No files were actually modified")
        } else {
            console.log("\n✅ All files have been processed")
        }
    }

    /**
     * Limpa dados do fixer
     */
    clear() {
        this.fixes = []
    }

    /**
     * Obtém estatísticas
     */
    getStats() {
        return {
            fixesApplied: this.fixes.length,
            buildDir: this.buildDir,
            verbose: this.verbose,
            dryRun: this.dryRun,
        }
    }
}

export { AdvancedPathFixer }
