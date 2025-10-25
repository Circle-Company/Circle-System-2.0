#!/usr/bin/env node
/**
 * Adiciona extensões .js aos imports ESM
 */

import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const buildDir = path.join(process.cwd(), "build")

function addJsExtensions(dir) {
    const files = fs.readdirSync(dir)

    for (const file of files) {
        const fullPath = path.join(dir, file)
        const stat = fs.statSync(fullPath)

        if (stat.isDirectory()) {
            addJsExtensions(fullPath)
        } else if (file.endsWith(".js")) {
            let content = fs.readFileSync(fullPath, "utf8")
            let modified = false

            // Adicionar .js ou /index.js em imports relativos
            content = content.replace(/from\s+['"](\.[^'"]+)['"]/g, (match, importPath) => {
                // Já tem extensão correta
                if (importPath.endsWith("/index.js") || importPath.endsWith(".json")) {
                    return match
                }

                // Remover .js temporariamente para verificar se é diretório
                const cleanPath = importPath.endsWith(".js") ? importPath.slice(0, -3) : importPath
                const fileDir = path.dirname(fullPath)
                const resolvedPath = path.resolve(fileDir, cleanPath)
                
                // Verificar se é um diretório com index.js
                if (fs.existsSync(resolvedPath) && fs.statSync(resolvedPath).isDirectory()) {
                    const indexPath = path.join(resolvedPath, "index.js")
                    if (fs.existsSync(indexPath)) {
                        modified = true
                        return `from '${cleanPath}/index.js'`
                    }
                }

                // Caso contrário, garantir que tem .js
                if (!importPath.endsWith(".js")) {
                    modified = true
                    return `from '${importPath}.js'`
                }
                
                return match
            })

            // Adicionar .js em imports dinâmicos
            content = content.replace(
                /import\s*\(\s*['"](\.[^'"]+)['"]\s*\)/g,
                (match, importPath) => {
                    if (importPath.endsWith(".js") || importPath.endsWith(".json")) {
                        return match
                    }

                    // Verificar se é um diretório com index.js
                    const fileDir = path.dirname(fullPath)
                    const resolvedPath = path.resolve(fileDir, importPath)
                    
                    if (fs.existsSync(resolvedPath) && fs.statSync(resolvedPath).isDirectory()) {
                        const indexPath = path.join(resolvedPath, "index.js")
                        if (fs.existsSync(indexPath)) {
                            modified = true
                            return `import('${importPath}/index.js')`
                        }
                    }

                    modified = true
                    return `import('${importPath}.js')`
                },
            )

            if (modified) {
                fs.writeFileSync(fullPath, content)
                console.log(`✅ Adicionadas extensões .js em: ${path.relative(buildDir, fullPath)}`)
            }
        }
    }
}

console.log("🔧 Adicionando extensões .js aos imports ESM...")
addJsExtensions(buildDir)
console.log("✅ Extensões .js adicionadas com sucesso!")
