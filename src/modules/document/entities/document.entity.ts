export class Document {
    constructor(
        public readonly id: string,
        public readonly filename: string,
        public readonly content: string,
        public readonly uploadedAt: Date,
        public readonly chunks: DocumentChunk[]
    ) { }
}

export class DocumentChunk {
    constructor(
        public readonly id: string,
        public readonly content: string,
        public readonly metadata: ChunkMetadata,
        public readonly embedding?: number[]
    ) { }
}

export interface ChunkMetadata {
    documentId: string;
    chunkIndex: number;
    pageNumber?: number;
    wordCount: number;
}