import { DocumentChunk } from "src/modules/document/entities/document.entity";

export interface IVectorStore {
    addDocuments(chunks: DocumentChunk[]): Promise<void>;
    similaritySearch(query: string, topK?: number): Promise<DocumentChunk[]>;
    deleteDocument(documentId: string): Promise<void>;
}