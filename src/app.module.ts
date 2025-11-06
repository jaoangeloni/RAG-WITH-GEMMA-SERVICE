import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DocumentModule } from './modules/document/document.module';
import { ChatModule } from './modules/chat/chat.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DocumentModule,
    ChatModule
  ],
})
export class AppModule { }