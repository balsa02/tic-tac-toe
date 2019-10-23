import {AuthenticationError, PubSubEngine, UserInputError} from "apollo-server";
import jwt from "jsonwebtoken";
import uuidv4 from "uuid/v4";
import { Invite, InviteData, ParticipantRole, Session, User, Reject } from "../data";
import {Config, Context} from "../schema";
import {Match, Lobby} from "../services";

export interface IConfig {
    secret: string;
    tokenExpires: string;
}

export interface IContext {
    pubsub: PubSub;
    session: Session;
    config: Config;
    lobby: Lobby;
}

interface PubSub extends PubSubEngine {
    publish_with_result(triggerName: string, payload: any): Promise<boolean>;
}

export class MatchMaker {
    private matches: Map<string, Match>;

    constructor(private match_factory: <Ctx>(id: string, user: User) => Promise<Match>) {
        this.matches = new Map();
    }

    /** Create a new [[Match]] on the user context. Exit from the lobby. */
    public async create(_args: undefined, ctx: Context): Promise<Match> {
        this.authenticated(ctx);

        const uuid = uuidv4();
        const match = await this.match_factory(uuid, ctx.session.user);
        this.matches.set(uuid, match);
        await this.leave_match(ctx);
        await ctx.lobby.entry(ctx);
        ctx.config.logger.debug("set match id to user session" + match.id);
        ctx.session.matchId = match.id;
        return match;
    }

    /** Leave a [[Match]] and join the lobby. */
    public async leave(_args: undefined, ctx: Context): Promise<boolean> {
        await this.leave_match(ctx);
        await ctx.lobby.entry(ctx);
        return true;
    }

    public async leave_match(ctx: Context): Promise<boolean> {
        this.authenticated(ctx);
        const match = await this.lease(ctx);
        if (match) {
            await match.leave(ctx);
        }
        ctx.session.matchId = undefined;
        return true;
    }

    public async lease(ctx: Context): Promise<Match|null> {
        this.authenticated(ctx);
        if (ctx.session.matchId) {
            const match = this.matches.get(ctx.session.matchId);
            if (match) {
                return match;
            }
        }
        return null;
    }

    /** User can invite an other player to his own running [[Match]] */
    public async invite(args: {userName: string, role: ParticipantRole}, ctx: Context): Promise<string> {
        // check for user exists
        this.authenticated(ctx);
        if (ctx.session.user.userName === args.userName) {
            throw new UserInputError("You can't invite yourself");
        }

        if (ctx.session.matchId) {
            const invite: Invite = {
                from: ctx.session.user,
                matchId: ctx.session.matchId,
                role: args.role,
                token: await this.jwt_sign({
                    userName: args.userName,
                    role: args.role,
                    matchId: ctx.session.matchId,
                }, ctx),
            };

            const topic = "user." + args.userName;
            const success = await ctx.pubsub.publish_with_result(topic, {inbox: invite});
            if (!success) {
                throw new UserInputError("Can't find the invited user");
            }
            return invite.token;
        } else {
            throw new UserInputError("You didn't started a match jet");
        }
    }

    public async join(args: {token: string}, ctx: Context): Promise<boolean> {
        this.authenticated(ctx);
        const inviteData = await this.jwt_verify(args.token, ctx);
        const match = this.matches.get(inviteData.matchId);
        if (inviteData.userName === ctx.session.user.userName && match) {
            await this.leave_match(ctx);
            await match.join(ctx.session.user, inviteData.role, ctx);
            ctx.session.matchId = match.id;
        }
        return true;
    }

    public async reject(args: {token: string}, ctx: Context): Promise<boolean> {
        this.authenticated(ctx);
        const inviteData = await this.jwt_verify(args.token, ctx);
        const match = this.matches.get(inviteData.matchId);
        if (inviteData.userName === ctx.session.user.userName && match) {
            for (const participant of match.participants) {
                if (participant.role === ParticipantRole.Player) {
                    const topic = "user." + participant.user.userName;
                    const reject: Reject = {
                        from: ctx.session.user,
                        matchId: match.id,
                        role: inviteData.role,
                    };
                    const _ = await ctx.pubsub.publish_with_result(topic, {inbox: reject});
                }
            }
        }
        return true;
    }

    /** Check, that the session is authenticated */
    private authenticated(ctx: Context): boolean {
        if (!ctx.session.authenticated) {
            throw new AuthenticationError("Please login first");
        }
        return true;
    }

    private async jwt_sign(data: InviteData, ctx: Context): Promise<string> {
        return new Promise((resolve, reject) => {
            jwt.sign(Object.assign({}, data), ctx.config.secret, {expiresIn: ctx.config.tokenExpires}, (err, token) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(token);
                }
            });
        });
    }

    private async jwt_verify(token: string, ctx: Context): Promise<InviteData> {
        return new Promise((resolve, reject) => {
            jwt.verify(token, ctx.config.secret, {maxAge: ctx.config.tokenExpires}, (err, decoded) => {
                if (decoded instanceof Object) {
                    const data = InviteData.decode(decoded);
                    resolve(data);
                } else {
                    reject(err);
                }
            });
        });
    }
}
