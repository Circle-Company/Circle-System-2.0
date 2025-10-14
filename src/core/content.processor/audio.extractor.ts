/**
 * Audio Extractor
 * Extrai áudio e frames de vídeos usando ffmpeg
 */

import { exec } from "child_process"
import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"
import { promisify } from "util"

const execAsync = promisify(exec)

export interface AudioExtractionResult {
    success: boolean
    audioPath?: string
    audioData?: Buffer
    duration: number
    sampleRate: number
    channels: number
    error?: string
}

export interface FrameExtractionResult {
    success: boolean
    frames: Array<{
        path: string
        data: Buffer
        timestamp: number
    }>
    totalFrames: number
    error?: string
}

export class AudioExtractor {
    /**
     * Extrai áudio do vídeo
     * ffmpeg -i video.mp4 -vn -ac 1 -ar 16000 audio.wav
     */
    async extractAudio(
        videoData: Buffer,
        options: {
            sampleRate?: number
            channels?: number
            format?: "wav" | "mp3"
        } = {},
    ): Promise<AudioExtractionResult> {
        const sampleRate = options.sampleRate || 16000
        const channels = options.channels || 1
        const format = options.format || "wav"

        const tempVideoPath = join(
            tmpdir(),
            `video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.mp4`,
        )
        const tempAudioPath = join(
            tmpdir(),
            `audio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${format}`,
        )

        try {
            console.log(`[AudioExtractor] 🎵 Extraindo áudio: ${sampleRate}Hz, ${channels}ch`)

            // Salvar vídeo em arquivo temporário
            writeFileSync(tempVideoPath, videoData)

            // Executar ffmpeg para extrair áudio
            const ffmpegCommand = `ffmpeg -i "${tempVideoPath}" -vn -ac ${channels} -ar ${sampleRate} "${tempAudioPath}"`

            console.log(`[AudioExtractor] 🔧 Executando: ${ffmpegCommand}`)
            const { stdout } = await execAsync(ffmpegCommand)

            // Ler arquivo de áudio gerado
            if (existsSync(tempAudioPath)) {
                const audioData = readFileSync(tempAudioPath)

                // Extrair duração do stdout ou calcular
                const duration = this.extractDurationFromOutput(stdout) || 0

                console.log(
                    `[AudioExtractor] ✅ Áudio extraído: ${(audioData.length / 1024).toFixed(1)}KB`,
                )

                return {
                    success: true,
                    audioPath: tempAudioPath,
                    audioData,
                    duration,
                    sampleRate,
                    channels,
                }
            } else {
                throw new Error("Arquivo de áudio não foi criado")
            }
        } catch (error) {
            console.error(`[AudioExtractor] ❌ Erro ao extrair áudio:`, error)

            // Fallback: retornar buffer vazio
            return {
                success: false,
                duration: 0,
                sampleRate,
                channels,
                error: error instanceof Error ? error.message : String(error),
            }
        } finally {
            // Deletar arquivo de vídeo temporário
            if (existsSync(tempVideoPath)) {
                unlinkSync(tempVideoPath)
            }
        }
    }

    /**
     * Extrai frames do vídeo
     * ffmpeg -i video.mp4 -r 1 frames/frame_%04d.jpg
     */
    async extractFrames(
        videoData: Buffer,
        options: {
            fps?: number
            maxFrames?: number
            quality?: number
        } = {},
    ): Promise<FrameExtractionResult> {
        const fps = options.fps || 1
        const maxFrames = options.maxFrames || 10
        const quality = options.quality || 2

        const tempVideoPath = join(
            tmpdir(),
            `video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.mp4`,
        )
        const tempFramesDir = join(tmpdir(), `frames_${Date.now()}`)

        try {
            console.log(`[AudioExtractor] 🖼️  Extraindo frames: ${fps}fps, max=${maxFrames}`)

            // Criar diretório de frames
            if (!existsSync(tempFramesDir)) {
                mkdirSync(tempFramesDir, { recursive: true })
            }

            // Salvar vídeo em arquivo temporário
            writeFileSync(tempVideoPath, videoData)

            // Executar ffmpeg para extrair frames
            const outputPattern = join(tempFramesDir, "frame_%04d.jpg")
            const ffmpegCommand = `ffmpeg -i "${tempVideoPath}" -r ${fps} -vframes ${maxFrames} -q:v ${quality} "${outputPattern}"`

            console.log(`[AudioExtractor] 🔧 Executando: ${ffmpegCommand}`)
            await execAsync(ffmpegCommand)

            // Ler frames gerados
            const frames: Array<{ path: string; data: Buffer; timestamp: number }> = []

            for (let i = 1; i <= maxFrames; i++) {
                const framePath = join(tempFramesDir, `frame_${String(i).padStart(4, "0")}.jpg`)

                if (existsSync(framePath)) {
                    const frameData = readFileSync(framePath)
                    frames.push({
                        path: framePath,
                        data: frameData,
                        timestamp: (i - 1) / fps,
                    })
                }
            }

            console.log(`[AudioExtractor] ✅ ${frames.length} frames extraídos`)

            return {
                success: true,
                frames,
                totalFrames: frames.length,
            }
        } catch (error) {
            console.error(`[AudioExtractor] ❌ Erro ao extrair frames:`, error)

            return {
                success: false,
                frames: [],
                totalFrames: 0,
                error: error instanceof Error ? error.message : String(error),
            }
        } finally {
            // Deletar arquivo de vídeo temporário
            if (existsSync(tempVideoPath)) {
                unlinkSync(tempVideoPath)
            }
        }
    }

    /**
     * Limpa arquivos temporários de frames
     */
    cleanupFrames(frameResult: FrameExtractionResult): void {
        frameResult.frames.forEach((frame) => {
            if (existsSync(frame.path)) {
                unlinkSync(frame.path)
            }
        })
    }

    /**
     * Extrai duração do output do ffmpeg
     */
    private extractDurationFromOutput(output: string): number | null {
        const durationMatch = output.match(/Duration: (\d+):(\d+):(\d+\.\d+)/)
        if (durationMatch) {
            const hours = parseInt(durationMatch[1])
            const minutes = parseInt(durationMatch[2])
            const seconds = parseFloat(durationMatch[3])
            return hours * 3600 + minutes * 60 + seconds
        }
        return null
    }
}
