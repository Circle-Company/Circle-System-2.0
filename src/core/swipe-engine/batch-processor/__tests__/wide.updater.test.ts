import { PostEmbeddingService, UserEmbeddingService } from "../../embeddings"
import { describe, expect, it } from "vitest"

import { WideUpdater } from "../wide.updater"
import { mock } from "vitest-mock-extended"

describe("WideUpdater", () => {
    it("should update user embeddings", async () => {
        const userEmbeddingService = mock<UserEmbeddingService>()
        const wideUpdater = new WideUpdater()
        expect(wideUpdater.updateUserEmbeddings(userEmbeddingService)).toBe(true)
    })

    it("should update post embeddings", async () => {
        const postEmbeddingService = mock<PostEmbeddingService>()
        const wideUpdater = new WideUpdater()
        expect(wideUpdater.updatePostEmbeddings(postEmbeddingService)).toBe(true)
    })
})
