import { Cluster, ClusterAssignment } from "../types/cluster.types"

/**
 * Interface para o repositório de clusters
 */
export interface IClusterRepository {
    /**
     * Salva um cluster
     */
    save(cluster: Cluster): Promise<Cluster>

    /**
     * Busca um cluster pelo ID
     */
    findById(clusterId: string): Promise<Cluster | null>

    /**
     * Busca todos os clusters
     */
    findAll(): Promise<Cluster[]>

    /**
     * Busca clusters por IDs
     */
    findByIds(clusterIds: string[]): Promise<Cluster[]>

    /**
     * Salva múltiplos clusters
     */
    saveMany(clusters: Cluster[]): Promise<Cluster[]>

    /**
     * Deleta um cluster
     */
    delete(clusterId: string): Promise<boolean>

    /**
     * Salva uma atribuição de momento a cluster
     */
    saveAssignment(assignment: ClusterAssignment): Promise<ClusterAssignment>

    /**
     * Busca atribuições de um momento
     */
    findAssignmentsByMomentId(momentId: string): Promise<ClusterAssignment[]>

    /**
     * Busca momentos de um cluster
     */
    findMomentsByClusterId(clusterId: string, limit?: number): Promise<string[]>

    /**
     * Remove todas as atribuições de um momento
     */
    deleteAssignmentsByMomentId(momentId: string): Promise<boolean>

    /**
     * Atualiza as estatísticas de um cluster
     */
    updateClusterStats(
        clusterId: string,
        stats: { size: number; density: number; coherence?: number },
    ): Promise<boolean>
}
