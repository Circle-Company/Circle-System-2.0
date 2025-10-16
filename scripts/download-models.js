/**
 * Script para baixar e cachear modelos do Hugging Face
 * Execute: node scripts/download-models.js
 */

const { pipeline, AutoModel, AutoTokenizer } = require("@xenova/transformers")
const path = require("path")
const fs = require("fs")

// Configurar diretório de cache
const CACHE_DIR = path.join(__dirname, "..", "models", "huggingface")

if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true })
}

// Configurar cache para @xenova/transformers
process.env.TRANSFORMERS_CACHE = CACHE_DIR

const MODELS = {
    whisper: {
        name: "Xenova/whisper-tiny",
        type: "automatic-speech-recognition",
        description: "Whisper Tiny para transcrição de áudio",
    },
    textEmbedding: {
        name: "Xenova/all-MiniLM-L6-v2",
        type: "feature-extraction",
        description: "all-MiniLM-L6-v2 para embeddings de texto",
    },
    clip: {
        name: "Xenova/clip-vit-base-patch32",
        type: "zero-shot-image-classification",
        description: "CLIP ViT-B/32 para embeddings visuais",
    },
}

async function downloadModel(modelConfig) {
    console.log(`\n📥 Baixando modelo: ${modelConfig.name}`)
    console.log(`   📝 Descrição: ${modelConfig.description}`)
    console.log(`   🔧 Tipo: ${modelConfig.type}`)

    try {
        const startTime = Date.now()

        // Criar pipeline para forçar download
        const model = await pipeline(modelConfig.type, modelConfig.name, {
            cache_dir: CACHE_DIR,
        })

        const duration = ((Date.now() - startTime) / 1000).toFixed(2)
        console.log(`   ✅ Modelo baixado com sucesso! (${duration}s)`)

        return model
    } catch (error) {
        console.error(`   ❌ Erro ao baixar modelo:`, error.message)
        throw error
    }
}

async function main() {
    console.log("🚀 Iniciando download dos modelos do Hugging Face...")
    console.log(`📂 Diretório de cache: ${CACHE_DIR}\n`)

    const results = {
        success: [],
        failed: [],
    }

    // Download Whisper
    try {
        await downloadModel(MODELS.whisper)
        results.success.push("Whisper")
    } catch (error) {
        results.failed.push("Whisper")
    }

    // Download Text Embedding
    try {
        await downloadModel(MODELS.textEmbedding)
        results.success.push("Text Embedding")
    } catch (error) {
        results.failed.push("Text Embedding")
    }

    // Download CLIP
    try {
        await downloadModel(MODELS.clip)
        results.success.push("CLIP")
    } catch (error) {
        results.failed.push("CLIP")
    }

    // Resumo final
    console.log("\n" + "=".repeat(60))
    console.log("📊 RESUMO DO DOWNLOAD")
    console.log("=".repeat(60))
    console.log(`✅ Sucesso: ${results.success.length} modelos`)
    results.success.forEach((model) => console.log(`   - ${model}`))

    if (results.failed.length > 0) {
        console.log(`\n❌ Falhas: ${results.failed.length} modelos`)
        results.failed.forEach((model) => console.log(`   - ${model}`))
    }

    console.log("\n✨ Download concluído!")
    console.log(`📂 Modelos salvos em: ${CACHE_DIR}`)
}

main().catch((error) => {
    console.error("\n❌ Erro fatal:", error)
    process.exit(1)
})
