import net from "net";
import winston from "winston";
import * as tcp from "../tcp";

class TestSession {
    public messageSender?: (msg: string) => void;
    public messageReceiver?: (msg: string) => void;
    public initialized: boolean = false;
    constructor(private logger: winston.Logger, private sessions: SessionStore<TestSession>) {
    }
    public init(): void {
        if (!this.initialized) {
            this.sessions.push(this);
            this.initialized = true;
        }
    }
    public sendMessage(msg: string): void {
        if (this.messageSender) {
            this.messageSender(msg);
        }
    }
    public receiveMessage(msg: string): void {
        this.init();
        this.logger.info(`TestSession received msg: ${msg}`);
        if (this.messageReceiver) {
            this.messageReceiver(msg);
        }
    }
    public close(data: boolean): void {
        this.logger.info(`TestSession close msg: ${data}`);
        this.sessions.pop();
    }
}

class SessionStore<T> extends Array<T> {
    public pushCallback?: (element: T) => void;
    constructor() {
        super();
        Object.setPrototypeOf(this, new.target.prototype);
    }
    public onPush(callback: (element: T) => void): void {
        this.pushCallback = callback;
    }
    public push(element: T): number {
        if (this.pushCallback) {
            this.pushCallback(element);
        }
        return super.push(element);
    }
}

test("TCP server test with client/server chat", async () => {
    const client = new net.Socket();

    const logger = winston.createLogger({
        level: "debug",
        transports: [
          new winston.transports.Console(),
        ],
    });

    const sessions = new SessionStore<TestSession>();
    const config = {
        port: Math.floor(Math.random() * 1000) + 7000,
        host: "127.0.0.1",
        logger,
        delimiter: ".",
    };

    const server = new tcp.Server(config, () => new TestSession(logger, sessions));

    await server.start();

    let answer = "";
    let request = "";

    await Promise.all([
        new Promise((resolve, reject) => {
            sessions.onPush( (session) => {
                session.messageReceiver = (msg) => {
                    request = msg;
                    resolve();
                };
                session.sendMessage("Hello from Server");
            });
        }),
        new Promise((resolve, reject) => {
            client.connect(config.port, config.host, () => {
                logger.info("Client connected");
            })
            .on("data", (data) => {
                logger.info(`Client received msg:${data.toString()}`);
                answer = data.toString();
            })
            .on("end", () => {
                resolve();
            })
            .write("Hello From Client\r\n.\n", () => {
                client.end();
            });
        }),
    ]);

    client.destroy();
    await server.stop();
    expect(request + answer).toBe("Hello From Client" + `Hello from Server\r\n`);
});
