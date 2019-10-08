import net from "net";
import winston from "winston";
import uuidv4 from "uuid/v4";

export interface Session {
    /** this callback will send the message to the client */
    messageSender?: (msg: string) => void;
    /** called on session start */
    init(): void;
    /** send message to the client */
    sendMessage(msg: string): void;
    /** receive message from the client */
    receiveMessage(msg: string): void;
    /** called on session close */
    close(data: boolean): void;
}

/** create a new session for every client connection */
export interface SessionFactory {
    (): Session;
}

// XXX comment
class BufferCollector {
    buffer: string = '';
    // this received flag detect the '\n{delimiter}\n' pattern for the char (one char per onData(data)) based terminals
    delimiter_received: boolean = false;
    constructor(private session: Session, private delimiter: string) {
    }

    onData(data: Buffer) {
        let line = data.toString();
        if (line == this.delimiter) {
            this.delimiter_received = true;
        } else {
            if (this.delimiter_received) {
                line = this.delimiter + line;
                this.delimiter_received = false;
            }
            line.split(/\r\n|\n/).forEach(element => {
                if ( element == this.delimiter) {
                    try {
                        this.session.receiveMessage(this.buffer);
                    } finally {
                        this.buffer = '';
                    }
                } else {
                    this.buffer += element;
                }            
            });
        }
    }
    onEnd() {
        this.session.close(true);
    }

    onClose(data: boolean) {
        this.session.close(data);
    }
}

/** the Server Configuration */
export interface Config {
    /** Tcp port number where to listen. */
    port: number;
    /** Host name or IP address where to listen. */
    host: string;
    /** Logger instance type of [[winston.Logger]]. */
    logger: winston.Logger;
    /** The protocol command delimiter what should be send after each command to trigger the server side command execution.
     * Works like the '.' in the SMTP proto
    */
    delimiter: string;
}

/** 
 * Server implements a simple TCP server what will start a new [[Session]] on each connection
 */
export class Server {
    /** The server from [[net]] */
    server: net.Server;
    logger: winston.Logger;
    sockets: Map<string, net.Socket>;

    /**
     * @param {ServerConfig} config contains the basic configuration of the Server.
     * @param {SessionFactory} sessionFactory will create a new session for each client connection. 
    */
    constructor(private config: Config, private sessionFactory: SessionFactory) {
        this.server = net.createServer();
        this.logger = config.logger;
        this.sockets = new Map();
    }

    /** Start the server and listen on the port */
    start(): Promise<void> {
        return new Promise((resolve,reject) => {
            this.logger.info("Starting the TCP server");
            this.server.listen(this.config.port, this.config.host, () => {
                this.logger.info(`Server started on port ${this.config.host}:${this.config.port}`);
                resolve();
            });
            this.server.on('connection', socket => this.connectionHandler(socket));
        });
    }

    /** Stop the sever, wait all connection to close */
    stop(): Promise<Error | undefined> {
        this.logger.info("Stopping the TCP server");
        this.close_sockets();
        return new Promise((resolve,reject) =>
            this.server.close(_ => resolve())
        );
    }
    /** Close all open sockets */
    close_sockets(): void {
        this.sockets.forEach(value => {
            value.end();
        });
    }

    /** Handle one client session */
    connectionHandler(socket: net.Socket): void {
        try {
            this.logger.debug('New connection arrived');
            const uuid = uuidv4();
            this.sockets.set(uuid, socket);
            this.logger.debug('sockets size: ' + this.sockets.size);
            const session = this.sessionFactory();
            const buffer = new BufferCollector(session, this.config.delimiter);
            session.messageSender = (msg) => {
                socket.write(msg + `\r\n`);
            };
            session.init();

            socket.on('data', data => {
                try {
                    buffer.onData(data);
                } catch (e) {
                    socket.write(JSON.stringify(e) + `\r\n`);
                    this.logger.error(`catch error in tcp.Server socket data event: ${e.toString()}`);
                }
            })
            .on('end', (_data: any) => {
                try {
                    this.sockets.delete(uuid);
                    buffer.onEnd();
                } catch (e) {
                    socket.write(JSON.stringify(e) + `\r\n`);
                    this.logger.error(`catch error in tcp.Server socket close event: ${e.toString()}`);
                }
            })
            .on('close', data => {
                try {
                    buffer.onClose(data);
                } catch (e) {
                    socket.write(JSON.stringify(e) + `\r\n`);
                    this.logger.error(`catch error in tcp.Server socket close event: ${e.toString()}`);
                }
            });

        } catch (e) {
            this.logger.error(`catch error in tcp.Server.connectionHandler(): ${e.toString()}`);
            socket.end(); 
        }
    }
}