import {gql} from "apollo-server";
import {AuthContext} from "../schema";
import {Auth} from "../services";

export interface IContext {
    auth: Auth;
}

export type Context = IContext & AuthContext;

export const typeDefs = gql`
    type Auth {
        login(userName: String!, password: String!): String!
        signin(token: String!): String!
        register(userName: String!, password1: String!, password2: String!): String!
        password(userName: String!, oldPassword: String!, password1: String!, password2: String!): String!
        authenticated: String!
    }

    type Query {
        auth: Auth!
    }
    type Mutation {
        auth: Auth!
    }
    type Subscription {
        authenticated(interval: Int!): String!
    }
`;

export const resolvers = (): any => {
    return {
        Query: {
            auth: (_: undefined, __: undefined, ctx: Context): Auth => {
                return ctx.auth;
            },
        },
        get Mutation() {
            return this.Query;
        },
        Subscription: {
            /* timer: {
                subscribe: () => new Timer('timer', 1000).iterator()
            }, */
            authenticated: {
                subscribe: (_: undefined, args: {interval: number}, ctx: Context) => {
                    return ctx.auth.authenticated_iterator(args, ctx);
                },
            },
        },
    };
};
