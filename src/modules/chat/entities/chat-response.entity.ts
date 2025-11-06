import { DocumentChunk } from "src/modules/document/entities/document.entity";

export class ChatResponse {
    constructor(
        public readonly id: string,
        public readonly message: string,
        public readonly relevantChunks: DocumentChunk[],
        public readonly timestamp: Date,
        public readonly isComplete: boolean = false
    ) { }
}