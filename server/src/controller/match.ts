import { gql, PubSubEngine, ApolloError } from "apollo-server";
import { Session } from "../data";
import {MatchMakerContext} from "../schema";
import {Match, MatchMaker} from "../services";

export interface IContext {
    session: Session;
    pubsub: PubSubEngine;
    match_maker: MatchMaker;
}

export type Context = IContext & MatchMakerContext;

export const typeDefs = gql`
    type Match {
        id: String!
        participants:[Participant!]!
        board:[Sign]!
        next: Participant!
        winner: Participant
        step(cell: Int!): Boolean!
    }

    type Query {
        match: Match
    }
    type Mutation {
        match: Match
    }
    type Subscription {
        match: Match!
    }
`;

export const resolvers = (): any => {
    return {
        Query: {
            match: (_: undefined, __: undefined, ctx: Context): Promise<Match|null> => {
                return ctx.match_maker.lease(ctx);
            },
        },
        get Mutation() {
            return this.Query;
        },
        Subscription: {
            match: {
                subscribe: (_: undefined, __: undefined, ctx: Context) => {
                    if (ctx.session.matchId) {
                        return ctx.pubsub.asyncIterator("match." + ctx.session.matchId);
                    }
                    throw new ApolloError("No match found");
                },
            },
        },
    };
};
