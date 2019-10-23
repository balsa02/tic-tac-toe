import gql from "graphql-tag";
import {makeExecutableSchema} from "graphql-tools";
import winston from "winston";

export const logger = winston.createLogger({
    level: "warn",
    transports: [
      new winston.transports.Console(),
    ],
});

export const config = {
    http: {
        host: "0.0.0.0",
        port: 4000,
        staticDir: "../webclient/build",
    },
    logger,
    secret: "ZUjvZ%FT3t5U=ZFHDTTR/CRvhkhujdtd4T!Dx2424VFDTES!TF%/7oiuOGHRSsdxHT/eEGDUP",
    tcp: {
        delimiter: ".",
        host: "0.0.0.0",
        logger,
        port: 4001,
    },
    tokenExpires: "1d",
};

const globalCtx = {
    logger,
};

// tslint:disable-next-line:variable-name
export const session_ctx = async (token?: string) => {
    const sessionCtx = {
    };
    return Object.assign(sessionCtx, globalCtx);
};

export interface IContext {
    logger: winston.Logger;
}

class Greetings {
    public hello(args: {name: string}, ctx: IContext) {
        ctx.logger.info(`Say Hello to ${args.name}`);
        return `hello ${args.name}`;
    }
}

const typeDefs = gql`
    type Greetings {
        hello(name: String!): String!
    }

    type Query {
        greatings: Greetings!
    }
`;

const resolvers = <Ctx extends IContext>(): any => {
    return {
        Query: {
            greatings : (_: undefined, __: undefined, ctx: Ctx): Greetings => {
                return new Greetings();
            },
        },
    };
};

export const schema = makeExecutableSchema({
        resolvers: resolvers<IContext>(),
        typeDefs,
    });
