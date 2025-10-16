import { Cluster } from "./cluster.entity"
import { ClusterAssignmentEntity } from "./cluster.type"

/**
 * IClusterRepository - Interface simplificada para operações básicas de cluster
 * Focada nas operações essenciais para o swipe engine
 */
export interface IClusterRepository {
    // ===== OPERAÇÕES BÁSICAS =====
    save(cluster: Cluster): Promise<Cluster>
    findById(id: string): Promise<Cluster | null>
    findAll(): Promise<Cluster[]>
    saveMany(clusters: Cluster[]): Promise<Cluster[]>

    // ===== OPERAÇÕES DE ASSIGNMENTS =====
    saveAssignment(assignment: ClusterAssignmentEntity): Promise<ClusterAssignmentEntity>
    findAssignmentsByMomentId(momentId: string): Promise<ClusterAssignmentEntity[]>
    findMomentsByClusterId(clusterId: string, limit?: number): Promise<string[]>
}
