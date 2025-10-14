/**
 * Script para testar embeddings com modelos REAIS
 * Execute: node scripts/test-real-embeddings.js
 */

const { pipeline } = require("@xenova/transformers")
const path = require("path")

const CACHE_DIR = path.join(__dirname, "..", "models", "huggingface")
process.env.TRANSFORMERS_CACHE = CACHE_DIR

async function testRealTextEmbedding() {
    console.log("\n" + "=".repeat(60))
    console.log("📝 TESTE: Text Embedding REAL (all-MiniLM-L6-v2)")
    console.log("=".repeat(60))

    try {
        const extractor = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2", {
            cache_dir: CACHE_DIR,
        })

        // Teste 1: Embedding simples
        const text1 = "Vídeo sobre tecnologia e programação"
        const output1 = await extractor(text1, { pooling: "mean", normalize: true })
        const embedding1 = Array.from(output1.data)

        console.log(`\n✅ Texto 1: "${text1}"`)
        console.log(`   📐 Dimensão: ${embedding1.length}`)
        console.log(
            `   🔢 Primeiros valores: [${embedding1
                .slice(0, 5)
                .map((v) => v.toFixed(4))
                .join(", ")}...]`,
        )

        // Teste 2: Texto similar
        const text2 = "Vídeo sobre desenvolvimento de software"
        const output2 = await extractor(text2, { pooling: "mean", normalize: true })
        const embedding2 = Array.from(output2.data)

        console.log(`\n✅ Texto 2: "${text2}"`)
        console.log(`   📐 Dimensão: ${embedding2.length}`)

        // Calcular similaridade
        const similarity = cosineSimilarity(embedding1, embedding2)
        console.log(`\n🎯 Similaridade entre textos: ${(similarity * 100).toFixed(2)}%`)

        if (similarity > 0.7) {
            console.log("   ✅ Alta similaridade (textos semanticamente próximos!)")
        }

        // Teste 3: Texto diferente
        const text3 = "Receita de bolo de chocolate"
        const output3 = await extractor(text3, { pooling: "mean", normalize: true })
        const embedding3 = Array.from(output3.data)

        const dissimilarity = cosineSimilarity(embedding1, embedding3)
        console.log(`\n🎯 Similaridade com texto diferente: ${(dissimilarity * 100).toFixed(2)}%`)

        if (dissimilarity < 0.5) {
            console.log("   ✅ Baixa similaridade (textos semanticamente distantes!)")
        }

        return true
    } catch (error) {
        console.error("\n❌ Erro:", error.message)
        return false
    }
}

async function testRealWhisper() {
    console.log("\n" + "=".repeat(60))
    console.log("🎤 TESTE: Whisper REAL (transcrição)")
    console.log("=".repeat(60))

    try {
        const transcriber = await pipeline("automatic-speech-recognition", "Xenova/whisper-tiny", {
            cache_dir: CACHE_DIR,
        })

        console.log("\n✅ Modelo Whisper carregado com sucesso")
        console.log("   ℹ️  Para testar transcrição, forneça arquivo de áudio .wav")
        console.log("   ℹ️  Exemplo: const result = await transcriber('audio.wav')")

        return true
    } catch (error) {
        console.error("\n❌ Erro:", error.message)
        return false
    }
}

async function testRealCLIP() {
    console.log("\n" + "=".repeat(60))
    console.log("🖼️  TESTE: CLIP REAL (embeddings visuais)")
    console.log("=".repeat(60))

    try {
        const classifier = await pipeline(
            "zero-shot-image-classification",
            "Xenova/clip-vit-base-patch32",
            {
                cache_dir: CACHE_DIR,
            },
        )

        console.log("\n✅ Modelo CLIP carregado com sucesso")
        console.log("   ℹ️  Para testar embedding visual, forneça imagem")
        console.log("   ℹ️  CLIP pode classificar e gerar embeddings de imagens")

        return true
    } catch (error) {
        console.error("\n❌ Erro:", error.message)
        return false
    }
}

function cosineSimilarity(a, b) {
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0)
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0))
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0))

    if (magnitudeA === 0 || magnitudeB === 0) return 0

    return dotProduct / (magnitudeA * magnitudeB)
}

async function main() {
    console.log("\n🧪 TESTANDO MODELOS REAIS DO HUGGING FACE\n")

    const results = []

    results.push(await testRealTextEmbedding())
    results.push(await testRealWhisper())
    results.push(await testRealCLIP())

    const successCount = results.filter((r) => r).length

    console.log("\n" + "=".repeat(60))
    console.log("📊 RESULTADO FINAL")
    console.log("=".repeat(60))
    console.log(`✅ ${successCount}/3 modelos REAIS funcionando`)

    if (successCount === 3) {
        console.log("\n🎉 Todos os modelos REAIS estão operacionais!")
        console.log("🚀 Sistema pronto para gerar embeddings com IA de verdade!")
    } else {
        console.log("\n⚠️  Alguns modelos falharam (fallback será usado)")
    }

    console.log("\n💡 Dica: Os modelos são carregados na primeira vez que são usados")
    console.log("💡 Modelos são singletons (carrega uma vez, reutiliza sempre)\n")
}

main().catch((error) => {
    console.error("\n❌ Erro fatal:", error)
    process.exit(1)
})
