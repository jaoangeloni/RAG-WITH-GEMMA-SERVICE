import { Injectable } from '@nestjs/common';
import mammoth from 'mammoth';
import PdfParse from 'pdf-parse';
import { Document, DocumentChunk, ChunkMetadata } from '../entities/document.entity';

@Injectable()
export class DocumentProcessorService {
    async processFile(file: Express.Multer.File): Promise<Document> {
        const content = await this.extractContent(file);
        const chunks = this.createChunks(content, file.originalname);

        return new Document(
            this.generateId(),
            file.originalname,
            content,
            new Date(),
            chunks
        );
    }

    private async extractContent(file: Express.Multer.File): Promise<string> {
        const fileType = file.mimetype;

        if (fileType.includes('pdf')) {
            const pdfData = await PdfParse(file.buffer);
            return pdfData.text;
        }

        if (fileType.includes('word') || fileType.includes('document')) {
            const result = await mammoth.extractRawText({ buffer: file.buffer });
            return result.value;
        }

        throw new Error(`Unsupported file type: ${fileType}`);
    }

    private createChunks(content: string, filename: string): DocumentChunk[] {
        const documentId = this.generateId();
        const chunkSize = 1000;
        const overlap = 200;
        const chunks: DocumentChunk[] = [];

        let start = 0;
        let chunkIndex = 0;

        while (start < content.length) {
            const end = Math.min(start + chunkSize, content.length);
            const chunkContent = content.slice(start, end);

            if (chunkContent.trim().length > 0) {
                const metadata: ChunkMetadata = {
                    documentId,
                    chunkIndex: chunkIndex++,
                    wordCount: chunkContent.split(/\s+/).length,
                };

                chunks.push(new DocumentChunk(
                    this.generateId(),
                    chunkContent.trim(),
                    metadata
                ));
            }

            start += chunkSize - overlap;
        }

        return chunks;
    }

    private generateId(): string {
        return Math.random().toString(36).substring(2) + Date.now().toString(36);
    }
}