/**
 * Script para testar os modelos baixados
 * Execute: node scripts/test-models.js
 */

const { pipeline } = require("@xenova/transformers")
const path = require("path")

const CACHE_DIR = path.join(__dirname, "..", "models", "huggingface")
process.env.TRANSFORMERS_CACHE = CACHE_DIR

async function testWhisper() {
    console.log("\n🎤 Testando Whisper (transcrição de áudio)...")

    try {
        const transcriber = await pipeline(
            "automatic-speech-recognition",
            "Xenova/whisper-tiny",
            { cache_dir: CACHE_DIR },
        )

        // Whisper precisa de arquivo de áudio real, então apenas carregamos o modelo
        console.log("   ✅ Modelo Whisper carregado com sucesso!")
        console.log("   ℹ️  Para testar transcrição, forneça um arquivo de áudio")

        return true
    } catch (error) {
        console.error("   ❌ Erro:", error.message)
        return false
    }
}

async function testTextEmbedding() {
    console.log("\n📝 Testando Text Embedding (all-MiniLM-L6-v2)...")

    try {
        const extractor = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2", {
            cache_dir: CACHE_DIR,
        })

        const text = "Este é um texto de teste para gerar embeddings."
        const output = await extractor(text, { pooling: "mean", normalize: true })

        console.log(`   ✅ Embedding gerado com sucesso!`)
        console.log(`   📐 Dimensão: ${output.data.length}`)
        console.log(`   🔢 Primeiros valores: [${output.data.slice(0, 5).map((v) => v.toFixed(4)).join(", ")}...]`)

        return true
    } catch (error) {
        console.error("   ❌ Erro:", error.message)
        return false
    }
}

async function testCLIP() {
    console.log("\n🖼️  Testando CLIP (embeddings visuais)...")

    try {
        const classifier = await pipeline(
            "zero-shot-image-classification",
            "Xenova/clip-vit-base-patch32",
            { cache_dir: CACHE_DIR },
        )

        // CLIP precisa de imagem real, então apenas carregamos o modelo
        console.log("   ✅ Modelo CLIP carregado com sucesso!")
        console.log("   ℹ️  Para testar embeddings visuais, forneça uma imagem")

        return true
    } catch (error) {
        console.error("   ❌ Erro:", error.message)
        return false
    }
}

async function main() {
    console.log("🧪 Testando modelos do Hugging Face...\n")

    const results = []

    results.push(await testWhisper())
    results.push(await testTextEmbedding())
    results.push(await testCLIP())

    const successCount = results.filter((r) => r).length

    console.log("\n" + "=".repeat(60))
    console.log("📊 RESULTADO DOS TESTES")
    console.log("=".repeat(60))
    console.log(`✅ ${successCount}/3 modelos funcionando corretamente`)

    if (successCount === 3) {
        console.log("\n🎉 Todos os modelos estão prontos para uso!")
    } else {
        console.log("\n⚠️  Alguns modelos falharam. Verifique os erros acima.")
    }
}

main().catch((error) => {
    console.error("\n❌ Erro fatal:", error)
    process.exit(1)
})

