import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { ILLMProvider } from '../interfaces/llm-provider.interface';

@Injectable()
export class GemmaService implements ILLMProvider {
    private readonly logger = new Logger(GemmaService.name);
    private readonly gemmaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';

    async generateResponse(
        query: string,
        context: string,
        onToken?: (token: string) => void
    ): Promise<string> {
        try {
            const prompt = this.buildPrompt(query, context);
            this.logger.log('Starting gemma request...');

            const response = await axios.post(
                `${this.gemmaUrl}/api/generate`,
                {
                    model: "gemma3.1:8b",
                    prompt,
                    stream: true,
                },
                {
                    timeout: 0,
                    responseType: 'stream',
                }
            );

            let fullResponse = '';

            return new Promise((resolve, reject) => {
                response.data.on('data', (chunk: Buffer) => {
                    const lines = chunk.toString().split('\n').filter(line => line.trim());

                    for (const line of lines) {
                        try {
                            const data = JSON.parse(line);

                            if (data.response) {
                                fullResponse += data.response;
                                onToken?.(data.response);
                            }

                            if (data.done) {
                                resolve(fullResponse);
                            }
                        } catch (parseError) {
                        }
                    }
                });

                response.data.on('error', (error: any) => {
                    this.logger.error('gemma stream error', error);
                    reject(error);
                });

                response.data.on('end', () => {
                    if (fullResponse) {
                        resolve(fullResponse);
                    }
                });
            });
        } catch (error) {
            this.logger.error('Failed to generate response with gemma', error.response);
            throw new Error('Failed to generate response with gemma');
        }
    }

    async testConnection(): Promise<boolean> {
        try {
            await axios.get(`${this.gemmaUrl}/api/tags`, { timeout: 5000 });
            this.logger.log('gemma connection test successful');
            return true;
        } catch (error) {
            this.logger.error('gemma connection test failed:', error.message);
            return false;
        }
    }

    private buildPrompt(query: string, context: string): string {
        return `Você é um assistente útil e amigável que responde perguntas baseadas no contexto fornecido.

CONTEXTO:
${context}

PERGUNTA DO USUÁRIO:
${query}

INSTRUÇÕES:
- Responda de forma clara, amigável e útil
- Base sua resposta apenas no contexto fornecido
- Se não houver contexto ou a informação não estiver disponível ou a pergunta não puder ser respondida com o contexto disponível neste prompt, apenas diga ao usuário "Não pude encontrar a informação no contexto fornecido."
- Seja conciso mas completo
- Use um tom conversacional e acolhedor

RESPOSTA:`;
    }
}