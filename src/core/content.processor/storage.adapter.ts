/**
 * Storage Adapter Interface
 * Interface para diferentes provedores de armazenamento
 */

import { LocalStorageAdapter } from "./local.storage.adapter"
import { StorageAdapter } from "./type"

/**
 * Factory para criar storage adapter
 */
export class StorageAdapterFactory {
    static create(provider: "s3" | "gcs" | "azure" | "local"): StorageAdapter {
        switch (provider) {
            case "s3":
            case "gcs":
            case "azure":
            case "local":
                return new LocalStorageAdapter()
            default:
                return new LocalStorageAdapter()
        }
    }
}
