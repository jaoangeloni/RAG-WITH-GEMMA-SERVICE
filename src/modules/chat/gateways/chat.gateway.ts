import {
    WebSocketGateway,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Socket } from 'socket.io';
import { ProcessQueryUseCase } from '../usecases/process-query.usecase';
import { LLMProvider, QueryDto } from '../dtos/query.dto';

@WebSocketGateway({
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true,
    },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly logger = new Logger(ChatGateway.name);

    constructor(private readonly processQueryUseCase: ProcessQueryUseCase) { }

    handleConnection(client: Socket) {
        this.logger.log(`Client connected: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        this.logger.log(`Client disconnected: ${client.id}`);
    }

    @SubscribeMessage('sendMessage')
    async handleMessage(
        @MessageBody() data: QueryDto,
        @ConnectedSocket() client: Socket,
    ) {
        try {
            const provider = data.provider || (process.env.DEFAULT_LLM_PROVIDER as LLMProvider) || LLMProvider.GEMMA;

            this.logger.log(`Received message from ${client.id} using ${provider}: ${data.message}`);

            client.emit('botTyping', true);

            let tokenCount = 0;

            const response = await this.processQueryUseCase.execute(
                data.message,
                data.sessionId || client.id,
                (token: string) => {
                    tokenCount++;
                    this.logger.debug(`Emitting token ${tokenCount}: "${token}"`);

                    client.emit('messageToken', {
                        sessionId: data.sessionId || client.id,
                        token,
                        provider,
                        timestamp: new Date(),
                    });
                },
                provider
            );

            this.logger.log(`Completed response with ${tokenCount} tokens using ${provider}`);

            client.emit('messageComplete', {
                sessionId: data.sessionId || client.id,
                message: response.message,
                provider,
                timestamp: new Date(),
            });

            client.emit('botTyping', false);

        } catch (error) {
            this.logger.error('Error processing message', error);

            client.emit('error', {
                message: `Desculpe, ocorreu um erro ao processar sua mensagem com o provedor selecionado. Tente novamente ou mude o provedor.`,
                timestamp: new Date(),
            });

            client.emit('botTyping', false);
        }
    }

    @SubscribeMessage('testProviders')
    async handleTestProviders(@ConnectedSocket() client: Socket) {
        try {
            const status = await this.processQueryUseCase.testProviders();

            client.emit('providersStatus', {
                providers: status,
                timestamp: new Date(),
            });
        } catch (error) {
            this.logger.error('Error testing providers', error);
        }
    }
}