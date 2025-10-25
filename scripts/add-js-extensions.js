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

            // Adicionar .js em imports relativos que não têm extensão
            content = content.replace(
                /from\s+['"](\.[^'"]+)['"]/g,
                (match, importPath) => {
                    if (!importPath.endsWith(".js") && !importPath.endsWith(".json")) {
                        modified = true
                        return `from '${importPath}.js'`
                    }
                    return match
                }
            )

            // Adicionar .js em imports dinâmicos
            content = content.replace(
                /import\s*\(\s*['"](\.[^'"]+)['"]\s*\)/g,
                (match, importPath) => {
                    if (!importPath.endsWith(".js") && !importPath.endsWith(".json")) {
                        modified = true
                        return `import('${importPath}.js')`
                    }
                    return match
                }
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

