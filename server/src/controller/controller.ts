import gmr from "graphql-merge-resolvers";
import {IResolvers} from "graphql-tools";
import { mergeTypes } from "merge-graphql-schemas";
import * as auth from "./auth";
import * as inbox from "./inbox";
import * as lobby from "./lobby";
import * as match from "./match";
import * as matchmaker from "./matchmaker";
import * as time from "./time";

export type Context =   auth.IContext &
                        inbox.IContext &
                        lobby.IContext &
                        match.IContext &
                        matchmaker.IContext &
                        time.IContext;

export const resolvers = (): IResolvers<any, any> => {
    return gmr.merge([
        auth.resolvers(),
        inbox.resolvers(),
        lobby.resolvers(),
        match.resolvers(),
        matchmaker.resolvers(),
        time.resolvers(),
    ]) as IResolvers<any, any>;
};

export const typeDefs = mergeTypes([
    auth.typeDefs,
    inbox.typeDefs,
    lobby.typeDefs,
    match.typeDefs,
    matchmaker.typeDefs,
    time.typeDefs,
]);
