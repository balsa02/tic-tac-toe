import {Ping, Session, User} from "../data";
import { PubSub } from "./pubsub";
import { AuthenticationError } from "apollo-server";
import winston from "winston";

export interface IConfig {
    logger: winston.Logger;
}

export interface IContext {
    pubsub: PubSub;
    session: Session;
    config: IConfig;
}

export type Context = IContext;

export class Lobby {
    private users: Map<string, User>;
    private timer?: NodeJS.Timeout;

    constructor() {
        this.users = new Map();
    }

    public async list(_args: undefined, ctx: Context): Promise<User[]> {
        this.authenticated(ctx);
        return this.users_array;
    }

    private get users_array(): User[] {
        return Array.from<User>(this.users.values());
    }

    public async iterator(ctx: Context): Promise<AsyncIterator<{lobby: Lobby}>> {
        return ctx.pubsub.asyncIterator("lobby");
    }

    public async entry_user(user: User, ctx: Context): Promise<void> {
        ctx.config.logger.debug("Lobby entry_user called for user: " + user.userName);
        // start the sweeper task at the first user entry
        if (!this.timer) {
            ctx.config.logger.debug("Lobby entry start sweeper task");
            this.timer = setInterval( () => {const _ = this.sweeper(ctx); }, 10000);
        }

        if (!this.users.get(user.userName)) {
            ctx.config.logger.debug("Lobby entry_user add user to users: " + user.userName);
            this.users.set(user.userName, user);
            await this.notify(ctx);
        }
    }

    public async exit_user(user: User, ctx: Context, force: boolean): Promise<void> {
        ctx.config.logger.debug("Lobby exit_user called for user: " + user.userName);
        if (this.users.get(user.userName) &&
            (force || !await this.ping(user, ctx))
        ) {
            ctx.config.logger.debug("Lobby exit_user delete user from users: " + user.userName);
            this.users.delete(user.userName);
            await this.notify(ctx);
        }
    }

    private authenticated(ctx: Context): boolean {
        if (!ctx.session.authenticated) {
            throw new AuthenticationError("Please login first");
        }
        return true;
    }

    private async notify(ctx: Context): Promise<void> {
        await ctx.pubsub.publish("lobby", {lobby: this});
    }

    private async sweeper(ctx: Context): Promise<void> {
        try {
            ctx.config.logger.debug("Lobby sweeper task called");
            for (const user of this.users.values()) {
                if (! await this.ping(user, ctx)) {
                    ctx.config.logger.debug("Lobby sweeper delete user: " + user.userName);
                    this.users.delete(user.userName);
                    await this.notify(ctx);
                }
            }
        } catch (e) {
            ctx.config.logger.warn("Lobby sweeper task error: " + e);
        }
    }

    private async ping(user: User, ctx: Context): Promise<boolean> {
        return await ctx.pubsub.publish_with_result("user." + user.userName, {inbox: {payload: "hello"} as Ping});
    }
}
