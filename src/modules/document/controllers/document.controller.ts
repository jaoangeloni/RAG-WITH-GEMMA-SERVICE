import {
    Controller,
    Post,
    UploadedFile,
    UseInterceptors,
    BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadDocumentUseCase } from '../usecases/upload-document.usecase';

@Controller('documents')
export class DocumentController {
    constructor(private readonly uploadDocumentUseCase: UploadDocumentUseCase) { }

    @Post('upload')
    @UseInterceptors(FileInterceptor('file'))
    async uploadDocument(@UploadedFile() file: Express.Multer.File) {
        if (!file) {
            throw new BadRequestException('No file provided');
        }

        const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ];

        if (!allowedTypes.includes(file.mimetype)) {
            throw new BadRequestException('File type not supported. Please upload PDF or Word documents.');
        }

        try {
            const result = await this.uploadDocumentUseCase.execute(file);

            return {
                success: true,
                message: 'Document uploaded and processed successfully',
                data: result,
            };
        } catch (error) {
            throw new BadRequestException(`Failed to process document: ${error.message}`);
        }
    }
}