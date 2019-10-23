import { gql, PubSubEngine, AuthenticationError} from "apollo-server";
import {Invite, Ping, Session, Reject} from "../data";
import {Context} from "../schema";
import { withCancel } from "../subscription";

export interface IContext {
    session: Session;
    pubsub: PubSubEngine;
}

export const typeDefs = gql`
    union Message = Invite | Ping | Reject

    type Subscription {
        inbox: Message!
    }
`;

export const resolvers = (): any => {
    return {
        Message: {
            __resolveType(obj: any, _context: any, _info: any) {
                if (obj.token) {
                    return "Invite";
                }
                if (obj.from) {
                    return "Reject";
                }
                return "Ping";
            },
        },
        Subscription: {
            inbox: {
                subscribe: async (_: undefined, __: undefined, ctx: Context) => {
                    if (ctx.session.authenticated) {
                        let inMatch = false;
                        if (ctx.session.matchId) {
                            const match = await ctx.match_maker.lease(ctx);
                            if (match && !match.ended && match.participants.length > 1) {
                                inMatch = true;
                            }
                        }
                        if (!inMatch) {
                            await ctx.lobby.entry(ctx);
                        }
                        return withCancel(
                            ctx.pubsub.asyncIterator<Invite|Ping|Reject>("user." + ctx.session.user.userName),
                            async () => {
                                await ctx.lobby.exit(ctx);
                            },
                        );
                    }
                    throw new AuthenticationError("Please Login first");
                },
            },
        },
    };
};
