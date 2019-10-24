import { gql, PubSubEngine } from "apollo-server";
import { Session } from "../data";
import {Context} from "../schema";
import {MatchMaker} from "../services";

export interface IContext {
    session: Session;
    pubsub: PubSubEngine;
    match_maker: MatchMaker;
}

export const typeDefs = gql`
    type MatchMaker {
        create: Match!
        invite(userName: String!, role: ParticipantRole!): String!
        join(token: String!): Boolean!
        reject(token: String!): Boolean!
        leave: Boolean!
    }

    type Query {
        match_maker: MatchMaker!
    }
    type Mutation {
        match_maker: MatchMaker!
    }
`;

export const resolvers = (): any => {
    return {
        Query: {
            match_maker: (_: undefined, __: undefined, ctx: Context): MatchMaker => {
                return ctx.match_maker;
            },
        },
        get Mutation() {
            return this.Query;
        },
    };
};
