
import { IsNotEmpty, IsString, IsOptional, IsEnum } from 'class-validator';

export enum LLMProvider {
    GEMMA = 'gemma',
}

export class QueryDto {
    @IsNotEmpty()
    @IsString()
    message: string;

    @IsNotEmpty()
    @IsString()
    sessionId: string;

    @IsOptional()
    @IsEnum(LLMProvider)
    provider?: LLMProvider;
}