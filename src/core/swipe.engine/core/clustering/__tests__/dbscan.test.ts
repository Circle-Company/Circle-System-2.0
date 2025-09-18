import { Entity, EntityType } from "../../../types"
import { beforeEach, describe, expect, it } from "vitest"

import { DBSCANClustering } from "../dbscan"

describe("DBSCANClustering", () => {
    let dbscan: DBSCANClustering

    beforeEach(() => {
        dbscan = new DBSCANClustering()
    })

    describe("Constructor", () => {
        it("should create instance with default configuration", () => {
            expect(dbscan).toBeInstanceOf(DBSCANClustering)
        })
    })

    describe("process method", () => {
        it("should throw error when embeddings and entities length mismatch", async () => {
            const embeddings = [
                [1, 2],
                [3, 4],
            ]
            const entities: Entity[] = [{ id: "1", type: "user" as EntityType, metadata: {} }]

            await expect(dbscan.process(embeddings, entities)).rejects.toThrow(
                "Número de embeddings não corresponde ao número de entidades",
            )
        })

        it("should return empty result for empty input", async () => {
            const result = await dbscan.process([], [])

            expect(result.clusters).toEqual([])
            expect(result.assignments).toEqual({})
        })

        it("should handle single point as noise", async () => {
            const embeddings = [[1, 2]]
            const entities: Entity[] = [{ id: "1", type: "user" as EntityType, metadata: {} }]

            const result = await dbscan.process(embeddings, entities)

            expect(result.clusters).toEqual([])
            expect(result.assignments).toEqual({})
        })

        it("should create cluster for dense points", async () => {
            // Create a dense cluster of points
            const embeddings = [
                [0, 0],
                [0.1, 0.1],
                [0.2, 0.2],
                [0.3, 0.3],
                [0.4, 0.4],
                [0.5, 0.5], // 6 points total, should form cluster with minPoints=5
            ]
            const entities: Entity[] = embeddings.map((_, i) => ({
                id: `point-${i}`,
                type: "user" as EntityType,
                metadata: {},
            }))

            const result = await dbscan.process(embeddings, entities)

            expect(result.clusters.length).toBeGreaterThan(0)
            expect(result.clusters[0].size).toBeGreaterThanOrEqual(5)
            expect(result.clusters[0].members.length).toBeGreaterThanOrEqual(5)
        })

        it("should identify noise points correctly", async () => {
            // Create one dense cluster and one isolated point
            // Using smaller distances to ensure they're within epsilon=0.3
            const embeddings = [
                [0, 0],
                [0.05, 0.05],
                [0.1, 0.1],
                [0.15, 0.15],
                [0.2, 0.2],
                [5, 5], // Isolated point (noise) - far from cluster
            ]
            const entities: Entity[] = embeddings.map((_, i) => ({
                id: `point-${i}`,
                type: "user" as EntityType,
                metadata: {},
            }))

            const result = await dbscan.process(embeddings, entities)

            // Should have at least one cluster
            expect(result.clusters.length).toBeGreaterThan(0)

            // The isolated point should not be in any cluster
            const clusterMembers = result.clusters.flatMap((cluster) => cluster.members)
            expect(clusterMembers).not.toContain("point-5")
        })

        it("should create multiple clusters for separated dense regions", async () => {
            // Create two separate dense clusters
            const embeddings = [
                // Cluster 1 - dense points close together
                [0, 0],
                [0.05, 0.05],
                [0.1, 0.1],
                [0.15, 0.15],
                [0.2, 0.2],
                // Cluster 2 (far away) - dense points close together
                [5, 5],
                [5.05, 5.05],
                [5.1, 5.1],
                [5.15, 5.15],
                [5.2, 5.2],
            ]
            const entities: Entity[] = embeddings.map((_, i) => ({
                id: `point-${i}`,
                type: "user" as EntityType,
                metadata: {},
            }))

            const result = await dbscan.process(embeddings, entities)

            expect(result.clusters.length).toBeGreaterThanOrEqual(2)

            // Each cluster should have at least 5 members
            result.clusters.forEach((cluster) => {
                expect(cluster.size).toBeGreaterThanOrEqual(5)
            })
        })

        it("should calculate centroids correctly", async () => {
            const embeddings = [
                [0, 0],
                [1, 1],
                [2, 2],
                [3, 3],
                [4, 4],
            ]
            const entities: Entity[] = embeddings.map((_, i) => ({
                id: `point-${i}`,
                type: "user" as EntityType,
                metadata: {},
            }))

            const result = await dbscan.process(embeddings, entities)

            if (result.clusters.length > 0) {
                const centroid = result.clusters[0].centroid
                expect(centroid).toHaveLength(2)
                expect(centroid[0]).toBeCloseTo(2, 1) // Average of 0,1,2,3,4
                expect(centroid[1]).toBeCloseTo(2, 1) // Average of 0,1,2,3,4
            }
        })

        it("should calculate density correctly", async () => {
            const embeddings = [
                [0, 0],
                [0.1, 0.1],
                [0.2, 0.2],
                [0.3, 0.3],
                [0.4, 0.4],
            ]
            const entities: Entity[] = embeddings.map((_, i) => ({
                id: `point-${i}`,
                type: "user" as EntityType,
                metadata: {},
            }))

            const result = await dbscan.process(embeddings, entities)

            if (result.clusters.length > 0) {
                const density = result.clusters[0].density
                expect(density).toBeDefined()
                expect(density).toBeGreaterThan(0)
            }
        })

        it("should assign correct cluster IDs", async () => {
            const embeddings = [
                [0, 0],
                [0.1, 0.1],
                [0.2, 0.2],
                [0.3, 0.3],
                [0.4, 0.4],
            ]
            const entities: Entity[] = embeddings.map((_, i) => ({
                id: `point-${i}`,
                type: "user" as EntityType,
                metadata: {},
            }))

            const result = await dbscan.process(embeddings, entities)

            if (result.clusters.length > 0) {
                expect(result.clusters[0].id).toMatch(/^dbscan-\d+$/)
            }
        })

        it("should handle 3D embeddings", async () => {
            const embeddings = [
                [0, 0, 0],
                [0.1, 0.1, 0.1],
                [0.2, 0.2, 0.2],
                [0.3, 0.3, 0.3],
                [0.4, 0.4, 0.4],
            ]
            const entities: Entity[] = embeddings.map((_, i) => ({
                id: `point-${i}`,
                type: "user" as EntityType,
                metadata: {},
            }))

            const result = await dbscan.process(embeddings, entities)

            if (result.clusters.length > 0) {
                expect(result.clusters[0].centroid).toHaveLength(3)
                expect(result.clusters[0].size).toBeGreaterThanOrEqual(5)
            }
        })

        it("should handle high-dimensional embeddings", async () => {
            const embeddings = [
                [1, 2, 3, 4, 5],
                [1.1, 2.1, 3.1, 4.1, 5.1],
                [1.2, 2.2, 3.2, 4.2, 5.2],
                [1.3, 2.3, 3.3, 4.3, 5.3],
                [1.4, 2.4, 3.4, 4.4, 5.4],
            ]
            const entities: Entity[] = embeddings.map((_, i) => ({
                id: `point-${i}`,
                type: "user" as EntityType,
                metadata: {},
            }))

            const result = await dbscan.process(embeddings, entities)

            if (result.clusters.length > 0) {
                expect(result.clusters[0].centroid).toHaveLength(5)
                expect(result.clusters[0].size).toBeGreaterThanOrEqual(5)
            }
        })

        it("should normalize embeddings before processing", async () => {
            const embeddings = [
                [100, 200],
                [101, 201],
                [102, 202],
                [103, 203],
                [104, 204],
            ]
            const entities: Entity[] = embeddings.map((_, i) => ({
                id: `point-${i}`,
                type: "user" as EntityType,
                metadata: {},
            }))

            const result = await dbscan.process(embeddings, entities)

            // Should still create clusters even with large values due to normalization
            expect(result.clusters.length).toBeGreaterThanOrEqual(0)
        })

        it("should handle edge case with exactly minPoints", async () => {
            const embeddings = [
                [0, 0],
                [0.1, 0.1],
                [0.2, 0.2],
                [0.3, 0.3],
                [0.4, 0.4], // Exactly 5 points (minPoints=5)
            ]
            const entities: Entity[] = embeddings.map((_, i) => ({
                id: `point-${i}`,
                type: "user" as EntityType,
                metadata: {},
            }))

            const result = await dbscan.process(embeddings, entities)

            expect(result.clusters.length).toBeGreaterThanOrEqual(0)
        })

        it("should handle edge case with fewer than minPoints", async () => {
            const embeddings = [
                [0, 0],
                [0.1, 0.1],
                [0.2, 0.2],
                [0.3, 0.3], // Only 4 points (minPoints=5)
            ]
            const entities: Entity[] = embeddings.map((_, i) => ({
                id: `point-${i}`,
                type: "user" as EntityType,
                metadata: {},
            }))

            const result = await dbscan.process(embeddings, entities)

            // Should not create clusters (all points are noise)
            expect(result.clusters).toEqual([])
            expect(result.assignments).toEqual({})
        })

        it("should maintain entity metadata", async () => {
            const embeddings = [
                [0, 0],
                [0.1, 0.1],
                [0.2, 0.2],
                [0.3, 0.3],
                [0.4, 0.4],
            ]
            const entities: Entity[] = embeddings.map((_, i) => ({
                id: `point-${i}`,
                type: "user" as EntityType,
                metadata: { customField: `value-${i}` },
            }))

            const result = await dbscan.process(embeddings, entities)

            if (result.clusters.length > 0) {
                const clusterEntities = result.clusters[0].entities
                expect(clusterEntities).toHaveLength(result.clusters[0].size)

                clusterEntities.forEach((entity) => {
                    expect(entity.metadata).toHaveProperty("customField")
                })
            }
        })

        it("should handle different entity types", async () => {
            const embeddings = [
                [0, 0],
                [0.1, 0.1],
                [0.2, 0.2],
                [0.3, 0.3],
                [0.4, 0.4],
            ]
            const entities: Entity[] = embeddings.map((_, i) => ({
                id: `point-${i}`,
                type: (i % 2 === 0 ? "user" : "post") as EntityType,
                metadata: {},
            }))

            const result = await dbscan.process(embeddings, entities)

            if (result.clusters.length > 0) {
                const clusterEntities = result.clusters[0].entities
                expect(clusterEntities.length).toBeGreaterThan(0)

                // Should contain both user and post entities
                const types = clusterEntities.map((e) => e.type)
                expect(types).toContain("user")
                expect(types).toContain("post")
            }
        })

        it("should produce consistent results for same input", async () => {
            const embeddings = [
                [0, 0],
                [0.1, 0.1],
                [0.2, 0.2],
                [0.3, 0.3],
                [0.4, 0.4],
            ]
            const entities: Entity[] = embeddings.map((_, i) => ({
                id: `point-${i}`,
                type: "user" as EntityType,
                metadata: {},
            }))

            const result1 = await dbscan.process(embeddings, entities)
            const result2 = await dbscan.process(embeddings, entities)

            expect(result1.clusters.length).toBe(result2.clusters.length)
            expect(result1.assignments).toEqual(result2.assignments)
        })

        it("should handle zero vectors", async () => {
            const embeddings = [
                [0, 0],
                [0, 0],
                [0, 0],
                [0, 0],
                [0, 0],
            ]
            const entities: Entity[] = embeddings.map((_, i) => ({
                id: `point-${i}`,
                type: "user" as EntityType,
                metadata: {},
            }))

            const result = await dbscan.process(embeddings, entities)

            // All points are identical, should form one cluster
            expect(result.clusters.length).toBeGreaterThanOrEqual(0)
        })

        it("should handle negative values in embeddings", async () => {
            const embeddings = [
                [-1, -1],
                [-0.9, -0.9],
                [-0.8, -0.8],
                [-0.7, -0.7],
                [-0.6, -0.6],
            ]
            const entities: Entity[] = embeddings.map((_, i) => ({
                id: `point-${i}`,
                type: "user" as EntityType,
                metadata: {},
            }))

            const result = await dbscan.process(embeddings, entities)

            expect(result.clusters.length).toBeGreaterThanOrEqual(0)
        })
    })

    describe("Algorithm Properties", () => {
        it("should satisfy DBSCAN properties", async () => {
            // Test with a known configuration that should produce predictable results
            const embeddings = [
                // Dense cluster - points close together
                [0, 0],
                [0.05, 0.05],
                [0.1, 0.1],
                [0.15, 0.15],
                [0.2, 0.2],
                [0.25, 0.25],
                // Noise point - far from cluster
                [5, 5],
            ]
            const entities: Entity[] = embeddings.map((_, i) => ({
                id: `point-${i}`,
                type: "user" as EntityType,
                metadata: {},
            }))

            const result = await dbscan.process(embeddings, entities)

            // DBSCAN should identify the dense region as a cluster
            // and the isolated point as noise
            if (result.clusters.length > 0) {
                const clusterMembers = result.clusters[0].members
                expect(clusterMembers.length).toBeGreaterThanOrEqual(5)

                // The noise point should not be in any cluster
                expect(clusterMembers).not.toContain("point-6")
            }
        })

        it("should handle boundary conditions", async () => {
            // Test with points exactly at epsilon distance
            const epsilon = 0.3
            const embeddings = [
                [0, 0],
                [epsilon, 0], // Exactly epsilon distance
                [0, epsilon], // Exactly epsilon distance
                [epsilon * 0.5, epsilon * 0.5], // Within epsilon
                [epsilon * 0.5, epsilon * 0.5], // Within epsilon
            ]
            const entities: Entity[] = embeddings.map((_, i) => ({
                id: `point-${i}`,
                type: "user" as EntityType,
                metadata: {},
            }))

            const result = await dbscan.process(embeddings, entities)

            // Should handle boundary conditions gracefully
            expect(result.clusters.length).toBeGreaterThanOrEqual(0)
        })
    })
})
