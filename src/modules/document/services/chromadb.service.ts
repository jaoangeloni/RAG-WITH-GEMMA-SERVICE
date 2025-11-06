import { Injectable, Logger } from '@nestjs/common';
import { DocumentChunk } from '../entities/document.entity';
import { IVectorStore } from 'src/shared/vector-store.interface';
import { CloudClient } from 'chromadb';
import { DefaultEmbeddingFunction } from '@chroma-core/default-embed'

@Injectable()
export class ChromaDbService implements IVectorStore {
    private readonly logger = new Logger(ChromaDbService.name);
    private client: CloudClient;
    private collection: any;
    private embedder: DefaultEmbeddingFunction;

    constructor() {
        this.initializeClient();
    }

    private async initializeClient() {
        try {
            this.client = new CloudClient({
                database: process.env.CHROMA_DATABASE,
                tenant: process.env.CHROMA_TENANT,
                apiKey: process.env.CHROMA_API_KEY,
            });

            this.embedder = new DefaultEmbeddingFunction({
                modelName: 'Xenova/all-MiniLM-L6-v2',
                revision: 'main',
                dtype: 'fp32',
                wasm: false,
            });

            this.collection = await this.client.getOrCreateCollection({
                name: 'documents',
                embeddingFunction: this.embedder,
            });

            this.logger.log('ChromaDB client initialized successfully');
        } catch (error) {
            this.logger.error('Failed to initialize ChromaDB client', error);
            throw error;
        }
    }

    async addDocuments(chunks: DocumentChunk[]): Promise<void> {
        try {
            const ids = chunks.map(chunk => chunk.id);
            const documents = chunks.map(chunk => chunk.content);
            const metadatas = chunks.map(chunk => chunk.metadata);

            await this.collection.add({
                ids,
                documents,
                metadatas,
            });

            this.logger.log(`Added ${chunks.length} chunks to ChromaDB`);
        } catch (error) {
            this.logger.error('Failed to add documents to ChromaDB', error);
            throw error;
        }
    }

    async similaritySearch(query: string, topK: number = 5): Promise<DocumentChunk[]> {
        try {
            const results = await this.collection.query({
                queryTexts: [query],
                nResults: topK,
            });

            return results.ids[0].map((id, index) =>
                new DocumentChunk(
                    id,
                    results.documents[0][index],
                    results.metadatas[0][index],
                    results.embeddings?.[0]?.[index]
                )
            );
        } catch (error) {
            this.logger.error('Failed to perform similarity search', error);
            throw error;
        }
    }

    async deleteDocument(documentId: string): Promise<void> {
        try {
            await this.collection.delete({
                where: { documentId },
            });

            this.logger.log(`Deleted document ${documentId} from ChromaDB`);
        } catch (error) {
            this.logger.error(`Failed to delete document ${documentId}`, error);
            throw error;
        }
    }
}