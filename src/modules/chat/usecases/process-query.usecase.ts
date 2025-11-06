import { Injectable, Logger } from '@nestjs/common';
import { ChromaDbService } from '../../document/services/chromadb.service';
import { ChatResponse } from '../entities/chat-response.entity';
import { LLMProvider } from '../dtos/query.dto';
import { GemmaService } from '../services/gemma.service';

@Injectable()
export class ProcessQueryUseCase {
    private readonly logger = new Logger(ProcessQueryUseCase.name);
    private readonly defaultProvider: LLMProvider;

    constructor(
        private readonly vectorStore: ChromaDbService,
        private readonly gemmaService: GemmaService,
    ) {
        this.defaultProvider = (process.env.DEFAULT_LLM_PROVIDER as LLMProvider) || LLMProvider.GEMMA;
        this.logger.log(`Default LLM Provider: ${this.defaultProvider}`);
    }

    async execute(
        query: string,
        sessionId: string,
        onToken?: (token: string) => void,
        provider?: LLMProvider
    ): Promise<ChatResponse> {
        try {
            const selectedProvider = provider || this.defaultProvider;

            this.logger.log(`Processing query for session ${sessionId} with ${selectedProvider}: ${query.substring(0, 100)}...`);

            const relevantChunks = await this.vectorStore.similaritySearch(query, 5);

            this.logger.log(`Found ${relevantChunks.length} relevant chunks`);

            const context = relevantChunks
                .map(chunk => chunk.content)
                .join('\n\n');

            if (!context.trim()) {
                this.logger.warn('No relevant context found for query');
                const noContextResponse = 'Desculpe, não encontrei informações relevantes nos documentos enviados para responder sua pergunta. Você poderia reformular a pergunta ou enviar documentos relacionados ao tema?';

                if (onToken) {
                    const words = noContextResponse.split(' ');
                    for (const word of words) {
                        onToken(word + ' ');
                        await new Promise(resolve => setTimeout(resolve, 50));
                    }
                }

                return new ChatResponse(
                    this.generateId(),
                    noContextResponse,
                    relevantChunks,
                    new Date(),
                    true
                );
            }

            const llmService = this.selectLLMService(selectedProvider);

            this.logger.log(`Starting response generation with ${selectedProvider}...`);

            const response = await llmService.generateResponse(
                query,
                context,
                (token: string) => {
                    this.logger.debug(`Token received: "${token}"`);
                    if (onToken) {
                        onToken(token);
                    }
                }
            );

            const chatResponse = new ChatResponse(
                this.generateId(),
                response,
                relevantChunks,
                new Date(),
                true
            );

            this.logger.log(`Generated complete response for session ${sessionId} using ${selectedProvider}`);

            return chatResponse;
        } catch (error) {
            this.logger.error('Failed to process query', error);
            throw error;
        }
    }

    private selectLLMService(provider: LLMProvider) {
        switch (provider) {
            case LLMProvider.GEMMA: 3
                this.logger.log('Using Gemma service');
                return this.gemmaService;
            default:
                this.logger.warn(`Unknown provider ${provider}, defaulting to ${this.defaultProvider}`);
                return this.selectLLMService(this.defaultProvider);
        }
    }

    async testProviders(): Promise<{ gemma: boolean }> {
        const [gemmaStatus] = await Promise.all([
            this.gemmaService.testConnection().catch(() => false),
        ]);

        return {
            gemma: gemmaStatus,
        };
    }

    private generateId(): string {
        return Math.random().toString(36).substring(2) + Date.now().toString(36);
    }
}
