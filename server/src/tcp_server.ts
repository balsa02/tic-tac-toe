import {DocumentNode, ExecutionResult, graphql, GraphQLSchema, subscribe} from "graphql";
import gql from "graphql-tag";
import {ExecutionResultDataDefault} from "graphql/execution/execute";
import winston from "winston";
import * as tcp from "./tcp";

/** the Server Configuration */
export interface Config {
    tcp: tcp.Config;
    logger: winston.Logger;
}

/** Handle the session chat with [[tcp.Server]] for every connection. Execute the graphql query and send back the result. */
class Session<Ctx> {
    /** this callback will send the message to the client */
    public messageSender?: (msg: string) => void;
    /** the graphql context for this session */
    private context?: Ctx;
    /** iterators to cancel at unsubscribe */
    private subscription_iterators: Array<AsyncIterableIterator<ExecutionResult<ExecutionResultDataDefault>>>;

    constructor(private logger: winston.Logger, private schema: GraphQLSchema, private session_ctx_factory: () => Promise<Ctx>) {
        // create a new context for this session
        this.subscription_iterators = new Array();
    }

    public async init() {
        if (!this.context) {
            this.context = await this.session_ctx_factory();
        }
    }

    /** Send the message back to the client through the tcp server using the messageSender callback */
    public sendMessage(msg: string): void {
        if (this.messageSender) {
            try {
                this.messageSender(msg);
            } catch (error) {
                this.logger.info(`Failed to send msg: ${msg}`);
            }
        }
    }

    /** Receive the message from the client and send to execute */
    public async receiveMessage(msg: string): Promise<void> {
        await this.init();
        this.logger.debug(`Session received msg: ${msg}`);
        return await this.execute(msg);
    }

    public close(data: boolean): void {
        this.logger.debug(`Session close msg: ${data}`);
        const _ = this.unsubscribe();
    }

    /** Jsonize and send back the data to the client */
    public sendData(data: ExecutionResult): void {
        const msg = JSON.stringify(data);
        this.sendMessage(msg);
    }

    /** Execute a query or a mutation and return the result back */
    public async execute_query(query: string): Promise<void> {
        try {
            const result = await graphql(this.schema, query, undefined, this.context);
            this.sendData(result);
        } catch (e) {
            this.sendData(e);
        }
    }

    /** Execute a subscription an register it to cancel later. */
    public async execute_subscription(node: DocumentNode): Promise<void> {
        try {
            const result = await subscribe(this.schema, node, undefined, this.context);
            // if it is an AsyncIterableIterator iterate it over until unsubscribe
            if ("next" in result) {
                // register it to cancel later
                this.subscription_iterators.push(result);
                // lets iterate over it
                for await (const data of result) {
                    this.sendData(data);
                }
            } else {
            // or is a simple oneshot ExecutionResult
                this.sendData(result);
            }
        } catch (e) {
            this.sendData(e);
        }
    }

    /** Cancel all running subscription in this session */
    public async unsubscribe(): Promise<void> {
        for (const iterator of this.subscription_iterators.splice(0)) {
            if (iterator.return) {
                await iterator.return();
            }
        }
        this.sendMessage(JSON.stringify({data: {success: true}}));
    }

    /** Execute the incomming query.
     * Based on the query tpye you have 3 option
     * mutation,query goes to execute_query
     * subscription to execute_subscription
     * an a special 'unsubscribe{}' command to cancel all running subscription
     */
    public async execute(query: string): Promise<void> {
        if (query === "unsubscribe{}") {
            await this.unsubscribe();
        } else {
            try {
                const query_node = gql`${query}`;
                if (query_node.definitions[0].operation === "subscription") {
                    await this.execute_subscription(query_node);
                } else {
                    await this.execute_query(query);
                }
            } catch (e) {
                this.sendData(e);
            }
        }
    }
}

/** Configure the GraphQL [[Session]] and start/stop the TCP server with it */
export class GraphQLTcpServer<Ctx> {
    private server: tcp.Server;

    constructor(private config: Config, private schema: GraphQLSchema, session_ctx_factory: () => Promise<Ctx>) {
        this.server = new tcp.Server(this.config.tcp, () => new Session(this.config.logger, this.schema, session_ctx_factory));
    }

    public async start() {
        await this.server.start();
    }
    public async stop() {
        await this.server.stop();
    }
}
