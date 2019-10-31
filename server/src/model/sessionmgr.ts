import jwt from "jsonwebtoken";
import winston from "winston";
import { Session, User } from "../data";
import { UserInputError } from "apollo-server";

export interface IContext {
    session: Session;
    config: IConfig;
}

export interface IConfig {
    secret: string;
    tokenExpires: string;
    logger: winston.Logger;
}

export type Context = IContext;

/** Implement a session expire somehow */
export class SessionMgr {
    public sessions: Map<string, Session>;

    constructor() {
        this.sessions = new Map();
    }

    public async use_token(token: string, ctx: Context): Promise<User> {
        // verify then find or store
        try {
            const user = await this.jwt_verify(token, ctx);
            ctx.config.logger.debug(`use_token ${token} username: ${user.userName}`);
            await this.find_or_store(user, ctx);
            return user;
        } catch (e) {
            ctx.config.logger.debug("Failed to verify token: " + e);
        }
        throw new UserInputError("Failed to decode the token.");
    }

    public async find_or_store(user: User, ctx: Context): Promise<void> {
        const find = this.sessions.get(user.userName);
        if (find) {
            ctx.session = find;
        } else {
            ctx.session = new Session();
            ctx.session.user = user;
            this.sessions.set(user.userName, ctx.session);
        }
        return;
    }

    private async jwt_verify(token: string, ctx: Context): Promise<User> {
        return new Promise((resolve, reject) => {
            jwt.verify(token, ctx.config.secret, {maxAge: ctx.config.tokenExpires}, (err, decoded) => {
                if (decoded instanceof Object) {
                    const user = User.decode(decoded);
                    resolve(user);
                } else {
                    reject(err);
                }
            });
        });
    }
}
