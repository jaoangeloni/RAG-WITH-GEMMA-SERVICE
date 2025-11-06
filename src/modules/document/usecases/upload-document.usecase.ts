import { Injectable, Logger } from '@nestjs/common';
import { DocumentProcessorService } from '../services/document-processor.service';
import { ChromaDbService } from '../services/chromadb.service';

@Injectable()
export class UploadDocumentUseCase {
    private readonly logger = new Logger(UploadDocumentUseCase.name);

    constructor(
        private readonly documentProcessor: DocumentProcessorService,
        private readonly vectorStore: ChromaDbService,
    ) { }

    async execute(file: Express.Multer.File): Promise<{ documentId: string; chunksCount: number }> {
        try {
            this.logger.log(`Processing document: ${file.originalname}`);

            const document = await this.documentProcessor.processFile(file);

            await this.vectorStore.addDocuments(document.chunks);

            this.logger.log(
                `Successfully processed document ${document.filename} with ${document.chunks.length} chunks`
            );

            return {
                documentId: document.id,
                chunksCount: document.chunks.length,
            };
        } catch (error) {
            this.logger.error('Failed to upload document', error);
            throw error;
        }
    }
}