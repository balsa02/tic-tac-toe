import {GraphQLTcpServer} from '../tcp_server';
import winston from "winston";
import gql from 'graphql-tag';
import {makeExecutableSchema} from 'graphql-tools';
import net from "net";

const logger = winston.createLogger({
    level: "debug",
    transports: [
      new winston.transports.Console(),
    ]
});

const config = {
    tcp: {
        port: 4001,
        delimiter: '.',
        host: '0.0.0.0',
        logger: logger
    },
    staticDir: '../webclient/build',
    logger: logger,

};

const global_ctx = {
    logger: logger,
};

const session_ctx = () => {
    const session_ctx = {
    }
    return Object.assign(session_ctx, global_ctx);
}

export interface Context {
    logger: winston.Logger;
}

const typeDefs = gql`
    type Greetings {
        hello(name: String!): String!
    }

    type Query {
        greatings: Greetings!
    }
`;

const resolvers = <Ctx extends Context>(): any => {
    return {
        Query: {
            greatings : (_: undefined, __: undefined, ctx: Ctx): Greetings => {
                return new Greetings();
            }
        }
    }
};

class Greetings {
    hello(args: {name: string}, ctx: Context) {
        ctx.logger.info(`Say Hello to ${args.name}`);
        return `hello ${args.name}`;
    }
}

const schema = makeExecutableSchema({
        typeDefs: typeDefs,
        resolvers: resolvers<Context>(),
    });


test("GraphQL TCP server test with client connect", async () => {
    const tcp_srv = new GraphQLTcpServer(config,schema,session_ctx);
    const client = new net.Socket();

    await tcp_srv.start();

    await new Promise((resolve, reject) => {
            client.connect(config.tcp.port, config.tcp.host, () => {
                logger.info('Client connected');
                resolve();
            })
    });

    const result = await new Promise((resolve, reject) => {
        let answer = '';
        client.on('data', (data) => {
            logger.info(`Client received msg:${data.toString()}`);
            answer += data.toString();
        })
        .on('end', () => {
            resolve(answer);
        })
        .write(`{greatings{hello(name: "Test")}}\n.\n`, () => {
            client.end();
        });
    });

    client.destroy();
    await tcp_srv.stop();
    expect(result).toBe(`Ok\r\n{"data":{"greatings":{"hello":"hello Test"}}}\r\n`);
});