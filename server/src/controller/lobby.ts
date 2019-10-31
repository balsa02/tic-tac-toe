import { gql, AuthenticationError} from "apollo-server";
import {Session} from "../data";
import {LobbyContext} from "../schema";
import {Lobby} from "../services";

export interface IContext {
    session: Session;
    lobby: Lobby;
}

export type Context = IContext & LobbyContext;

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
