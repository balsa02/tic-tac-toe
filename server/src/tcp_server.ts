import {graphql, GraphQLSchema, subscribe, ExecutionResult, DocumentNode} from 'graphql';
import {ExecutionResultDataDefault} from 'graphql/execution/execute';
import * as tcp from './tcp';
import winston from 'winston';
import gql from 'graphql-tag';


/** the Server Configuration */
export interface Config {
    tcp: tcp.Config,
    logger: winston.Logger,
}

/** Handle the session chat with [[tcp.Server]] for every connection. Execute the graphql query and send back the result. */
class Session<Ctx> {
    /** this callback will send the message to the client */
    public messageSender?: (msg: string) => void;
    /** the graphql context for this session */
    private context: Ctx;
    /** iterators to cancel at unsubscribe */
    private subscription_iterators: Array<AsyncIterableIterator<ExecutionResult<ExecutionResultDataDefault>>>;

    constructor(private logger: winston.Logger, private schema: GraphQLSchema, private session_ctx_factory: () => Ctx) {
        // create a new context for this session
        this.context = this.session_ctx_factory();
        this.subscription_iterators = new Array();
    }

    init(): void {
        this.sendMessage(`Ok`);
    }

    /** Send the message back to the client through the tcp server using the messageSender callback */
    sendMessage(msg: string): void {
        if (this.messageSender) {
            try {
                this.messageSender(msg);
            } catch (error) {
                this.logger.info(`Failed to send msg: ${msg}`);
            }
        }
    }

    /** Receive the message from the client and send to execute */
    receiveMessage(msg: string): void {
        this.logger.debug(`Session received msg: ${msg}`);
        this.execute(msg);
    }

    close(data: boolean): void {
        this.logger.debug(`Session close msg: ${data}`);
        this.unsubscribe();
    }

    /** Jsonize and send back the data to the client */
    sendData(data: ExecutionResult) {
        const msg = JSON.stringify(data);
        this.sendMessage(msg);
    }

    /** Execute a query or a mutation and return the result back */
    execute_query(query: string) {
        graphql(this.schema, query, undefined, this.context)
        .then((result) => {
            this.sendData(result);
        });        
    }

    /** Execute a subscription an register it to cancel later. */
    execute_subscription(node: DocumentNode) {
        subscribe(this.schema, node, undefined, this.context)
        .then(async (result) => {
            // if it is an AsyncIterableIterator iterate it over until unsubscribe
            if ('next' in result) {
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
        });      
    }

    /** Cancel all running subscription in this session */
    unsubscribe() {
        this.subscription_iterators.splice(0).forEach(iterator => {
            if (iterator.return) {
                iterator.return();
            }
        });
        this.sendMessage(JSON.stringify({data: {success: true}}));
    }

    /** Execute the incomming query.
     * Based on the query tpye you have 3 option
     * mutation,query goes to execute_query
     * subscription to execute_subscription
     * an a special 'unsubscribe{}' command to cancel all running subscription
     */
    execute(query: string) {
        if (query == 'unsubscribe{}') {
            this.unsubscribe();
        } else {
            const query_node = gql`${query}`;
            if (query_node.definitions[0].operation == 'subscription') {
                this.execute_subscription(query_node);
            } else {
                this.execute_query(query);
            }
        }
    }
}

/** Configure the GraphQL [[Session]] and start/stop the TCP server with it */
export class GraphQLTcpServer<Ctx> {
    private server: tcp.Server;

    constructor(private config: Config, private schema: GraphQLSchema, session_ctx_factory: () => Ctx) {
        this.server = new tcp.Server(this.config.tcp, () => new Session(this.config.logger, this.schema, session_ctx_factory));
    }

    async start() {
        await this.server.start();
    }
    async stop() {
        await this.server.stop();
    }
}