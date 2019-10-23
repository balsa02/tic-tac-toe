import winston from "winston";
import {Session} from "./data";
import {AuthProvider} from "./model/authprovider";
import {Lobby} from "./model/lobby";
import { Match } from "./model/match";
import { MatchMaker } from "./model/matchmaker";
import {PubSub} from "./model/pubsub";
import { SessionMgr } from "./model/sessionmgr";
import * as schema from "./schema";

export const logger = winston.createLogger({
    level: "debug",
    transports: [
      new winston.transports.Console(),
    ],
});

export const config = {
    tcp: {
        port: 4001,
        delimiter: ".",
        host: "0.0.0.0",
        logger,
    },
    http: {
        port: 4000,
        staticDir: "../webclient/build",
        host: "0.0.0.0",
    },
    logger,
    secret: "ZUjvZ%FT3t5U=ZFHDTTR/CRvhkhujdtd4T!Dx2424VFDTES!TF%/7oiuOGHRSsdxHT/eEGDUP",
    tokenExpires: "1d",

};

export const globalCtx = {
    pubsub: new PubSub(),
    auth: new AuthProvider(),
    config,
    session_manager: new SessionMgr(),
    match_maker: new MatchMaker(Match.create),
    lobby: new Lobby(),
};

// tslint:disable-next-line:variable-name
export const session_ctx = async (token?: string): Promise<schema.Context> => {
    const sessionCtx = {
        session: new Session(),
    };
    const ctx = Object.assign(sessionCtx, globalCtx);
    if (token) {
        await globalCtx.session_manager.use_token(token, ctx);
    }
    return ctx;
};
