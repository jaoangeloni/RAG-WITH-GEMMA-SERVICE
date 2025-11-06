import { Module } from '@nestjs/common';
import { ChromaDbService } from './services/chromadb.service';
import { DocumentProcessorService } from './services/document-processor.service';
import { DocumentController } from './controllers/document.controller';
import { UploadDocumentUseCase } from './usecases/upload-document.usecase';

@Module({
    controllers: [DocumentController],
    providers: [
        UploadDocumentUseCase,
        ChromaDbService,
        DocumentProcessorService,
    ],
    exports: [ChromaDbService],
})
export class DocumentModule { }