import Hapi from "@hapi/hapi";
import Inert from "@hapi/inert";
import {ApolloServer} from "apollo-server-hapi";
import {GraphQLSchema} from "graphql";
import {ConnectionContext} from "subscriptions-transport-ws";
import WebSocket from "ws";

import { string } from "@hapi/joi";
import winston from "winston";

export interface IConfig {
    http: IHttpConfig;
    logger: winston.Logger;
}

/** the Server Configuration */
export interface IHttpConfig {
    /** Tcp port number where to listen. */
    port: number;
    host: string;
    staticDir: string;
}

export class GraphQLHttpServer<Ctx> {
    private server: ApolloServer;
    private hapi: Hapi.Server;

    constructor(private config: IConfig, gql_schema: GraphQLSchema, private session_ctx_factory: (authorization?: string) => Promise<Ctx>) {
        this.server = new ApolloServer({
            schema: gql_schema,
            // this will set the ctx for query,mutation,subscription requests based on the websocket connection context
            context: async ({request, h, connection} ): Promise<Ctx> => {
                // we have a ws sesion
                if (connection) {
                    return connection.context;
                } else {
                    // plain http presuest
                    if (request.headers.authorization) {
                        return this.session_ctx_factory(request.headers.authorization);
                    } else {
                        return this.session_ctx_factory();
                    }
                }
            },
            // this will set the ctx for the websocket connection itself, not for the queries
            subscriptions: {
                keepAlive: 10000,
                onConnect: (connectionParams: object, _websocket: WebSocket, context: ConnectionContext): Promise<Ctx> => {
                    const params = connectionParams as {token: string};
                    let token: string | undefined;
                    if (context.request.headers.authorization) {
                        token = context.request.headers.authorization;
                    }
                    if (params.token) {
                        token = params.token;
                    }
                    this.config.logger.debug("Subscription token received: " + token);
                    if (token) {
                        return this.session_ctx_factory(token);
                    } else {
                        return this.session_ctx_factory();
                    }
                },
            },
            playground: {
                // version: '1.7.32',
                settings: {
                    "general.betaUpdates": true,
                    // include Authorization header in the requests from the GraphQL playground
                    "request.credentials": "same-origin",
                },
            },
        });
        this.hapi = new Hapi.Server({
            port: this.config.http.port,
            host: this.config.http.host,
        });

    }
    public async start() {
        await this.server.applyMiddleware({
            app: this.hapi,
            cors: {
                origin: ["*"],
                credentials: true,
            },
        });
        await this.server.installSubscriptionHandlers(this.hapi.listener);

        // static file serving
        await this.hapi.register(Inert);
        this.hapi.route({
            method: "GET",
            path: "/{path*}",
            handler: { directory: { path: this.config.http.staticDir } },
        });
        this.hapi.events.on("response", (request) => {
            this.config.logger.info(request.info.remoteAddress + ": " + request.method.toUpperCase() + " " + request.path);
        });

        this.hapi.state("session", {
            ttl: 24 * 60 * 60 * 1000,     // One day
            isSecure: true,
            path: "/",
            encoding: "base64json",
        });

        await this.hapi.start();
    }
    public async stop() {
        await this.hapi.stop();
    }
}
