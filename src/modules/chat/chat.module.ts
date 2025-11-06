import { Module } from '@nestjs/common';
import { ChatGateway } from './gateways/chat.gateway';
import { ProcessQueryUseCase } from './usecases/process-query.usecase';
import { GemmaService } from './services/gemma.service';
import { DocumentModule } from '../document/document.module';

@Module({
    imports: [DocumentModule],
    providers: [ChatGateway, ProcessQueryUseCase, GemmaService],
})
export class ChatModule { }