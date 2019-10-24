import { UserInputError, AuthenticationError } from "apollo-server";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import {Session} from "../data";
import {User} from "../data";
import {Config, Context} from "../schema";
import { SessionMgr } from "../services";
import uuidv4 from "uuid/v4";
import { withCancel } from "../subscription";

export interface IConfig {
    secret: string;
    tokenExpires: string;
}

export interface IContext {
    session: Session;
    session_manager: SessionMgr;
    config: Config;
}

/** TODO Whoami, change password */
export class AuthProvider {
    private passwords: Map<string, string>;
    private users: Map<string, User>;
    constructor() {
        this.passwords = new Map();
        this.users = new Map();
    }

    public async register(args: {userName: string, password1: string, password2: string}, ctx: Context): Promise<string> {
        if (this.users.get(args.userName)) {
            throw new UserInputError("User already registered");
        }
        if (args.password1 !== args.password2) {
            throw new UserInputError("Passwords didn't match");
        }
        if (args.userName.length < 3) {
            throw new UserInputError("Short username");
        }
        if (args.password1.length < 3) {
            throw new UserInputError("Short password");
        }
        const user: User = {userName: args.userName};
        const hash = await bcrypt.hash(args.password1, 10);
        this.passwords.set(args.userName, hash);
        this.users.set(args.userName, user);
        return await this.jwt_sign(user, ctx);
    }

    public async login(args: {userName: string, password: string}, ctx: Context): Promise<string> {
        const user = this.users.get(args.userName);
        const hash = this.passwords.get(args.userName);
        if (user && hash && await bcrypt.compare(args.password, hash)) {
            await ctx.session_manager.find_or_store(user, ctx);
            const token = await this.jwt_sign(user, ctx);
            ctx.config.logger.debug(`Token send ${token} for user ${user.userName}`);
            return token;
        } else {
            throw new UserInputError("Unknown user or wrong password");
        }
    }

    public async password(args: {userName: string, oldPassword: string, password1: string, password2: string}, ctx: Context): Promise<string> {
        const user = this.users.get(args.userName);
        const hash = this.passwords.get(args.userName);
        if (user && hash && await bcrypt.compare(args.oldPassword, hash)) {
            if (args.password1 !== args.password2) {
                throw new UserInputError("New Password mismatch");
            }
            if (args.password1.length < 3) {
                throw new UserInputError("Short password");
            }
            const newHash = await bcrypt.hash(args.password1, 10);
            this.passwords.set(args.userName, newHash);
            await ctx.session_manager.find_or_store(user, ctx);
            const token = await this.jwt_sign(user, ctx);
            ctx.config.logger.debug(`Token send ${token} for user ${user.userName}`);
            return token;
        } else {
            throw new UserInputError("Unknown user or wrong password");
        }
    }

    public async signin(args: {token: string}, ctx: Context): Promise<string> {
        return (await ctx.session_manager.use_token(args.token, ctx)).userName;
    }

    public async authenticated(_args: undefined, ctx: Context): Promise<string> {
        if (!ctx.session.authenticated) {
            throw new AuthenticationError("Please login first");
        }
        return ctx.session.user.userName;
    }

    public authenticated_iterator(args: {interval: number}, ctx: Context): AsyncIterator<string> {
        return new Timer(args.interval, ctx).iterator();
    }

    private async jwt_sign(user: User, ctx: Context): Promise<string> {
        return new Promise((resolve, reject) => {
            jwt.sign(Object.assign({}, user), ctx.config.secret, {expiresIn: ctx.config.tokenExpires}, (err, token) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(token);
                }
            });
        });
    }
}

export class Timer {
    private timer?: NodeJS.Timeout;
    private topic: string;
    constructor(private interval: number, private ctx: Context) {
        this.topic = uuidv4();
        if (interval < 10) {
            throw new UserInputError("invalid interval");
        }
    }
    public publish(): void {
        const userName = this.ctx.session.user.userName;
        const _ = this.ctx.pubsub.publish(this.topic, {authenticated: userName});
    }
    public stop(): void {
        if (this.timer) {
            clearTimeout(this.timer);
        }
    }
    public iterator(): AsyncIterator<string> {
        if (!this.timer) {
            this.timer = setInterval( () => {this.publish(); }, this.interval);
        }
        return withCancel(
            this.ctx.pubsub.asyncIterator(this.topic),
            async () => {
                this.stop();
            },
        );
    }
}
