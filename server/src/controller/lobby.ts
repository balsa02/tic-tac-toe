import { gql, AuthenticationError} from "apollo-server";
import {Session} from "../data";
import {Context} from "../schema";
import {Lobby} from "../services";

export interface IContext {
    session: Session;
    lobby: Lobby;
}

export const typeDefs = gql`
    type Lobby {
        list: [User!]!
    }

    type Query {
        lobby: Lobby!
    }

    type Subscription {
        lobby: Lobby!
    }
`;

export const resolvers = (): any => {
    return {
        Query: {
            lobby: (_: undefined, __: undefined, ctx: Context): Lobby => {
                return ctx.lobby;
            },
        },
        Subscription: {
            lobby: {
                subscribe: async (_: undefined, __: undefined, ctx: Context) => {
                    if (ctx.session.authenticated) {
                        return await ctx.lobby.iterator(ctx);
                    }
                    throw new AuthenticationError("Please Login first");
                },
            },
        },
    };
};
