import { IsNotEmpty, IsString } from 'class-validator';

export class UploadDocumentDto {
    @IsNotEmpty()
    @IsString()
    filename: string;
}