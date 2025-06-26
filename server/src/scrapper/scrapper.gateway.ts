import {
    WebSocketGateway,
    WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({ cors: true })
export class ScrapperGateway {
    @WebSocketServer()
    server: Server;

    emitLog(message: string) {
        this.server.emit('scrapper-log', { message });
    }

    emitDone(summary: string) {
        this.server.emit('scrapper-complete', { summary });
    }
}
