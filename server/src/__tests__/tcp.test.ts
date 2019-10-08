import *  as tcp from "../tcp";
import net from "net";
import winston from "winston";

class TestSession {
    public messageSender?: (msg: string) => void;
    public messageReceiver?: (msg: string) => void;
    constructor(private logger: winston.Logger, private sessions: SessionStore<TestSession>) {
    }
    init(): void {
        this.sessions.push(this);
    }
    sendMessage(msg: string): void {
        if (this.messageSender) {
            this.messageSender(msg);
        }
    }
    receiveMessage(msg: string): void {
        this.logger.info(`TestSession received msg: ${msg}`);
        if (this.messageReceiver) {
            this.messageReceiver(msg);
        }
    }
    close(data: boolean): void {
        this.logger.info(`TestSession close msg: ${data}`);
        this.sessions.pop();
    }
}

class SessionStore<T> extends Array<T> {
    pushCallback?: (element: T) => void;
    constructor() {
        super();
        Object.setPrototypeOf(this, new.target.prototype);
    }
    onPush(callback: (element: T) => void): void {
        this.pushCallback = callback;
    }
    push(element: T): number {
        if (this.pushCallback) {
            this.pushCallback(element);
        }
        return super.push(element);
    }
}

test("tcp server test with client connect", async () => {
    const client = new net.Socket();

    const logger = winston.createLogger({
        transports: [
          new winston.transports.Console(),
        ]
    });
    
    let sessions = new SessionStore<TestSession>();
    let config = {
        port: Math.floor(Math.random() * 1000) + 7000,
        host: '127.0.0.1',
        logger: logger,
        delimiter: '.'
    }

    let server = new tcp.Server(config, () => new TestSession(logger, sessions));

    await server.start();
    const msg:Array<string> = await Promise.all([
        new Promise((resolve, reject) => {
            sessions.onPush( (session) => {
                session.messageReceiver = (msg) => resolve(msg);
            });
        }),
        new Promise((resolve, reject) => {
            client.connect(config.port, config.host, () => {
                logger.info('Client connected');
                client.write("Hello From Client\r\n.\n");
                resolve();
            });
        }),
    ]);
    if (sessions.length > 0) { 
        sessions[0].sendMessage("Hello from Server");
    } else {
        throw("Missing session");
    }
    const msg2:string = await   new Promise((resolve, reject) => {
                                client.on('data', (data) => {
                                    logger.info(`Client received msg:${data.toString()}`);
                                    resolve(data.toString());
                                });
                        });
    client.destroy();
    await server.stop();
    expect(msg[0]+msg2).toBe("Hello From Client"+`Hello from Server\r\n`);
});

