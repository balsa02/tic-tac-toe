import {GraphQLSchema} from "graphql";
import gmr from "graphql-merge-resolvers";
import {IResolvers, makeExecutableSchema} from "graphql-tools";
import { mergeTypes } from "merge-graphql-schemas";
import * as controller from "./controller/controller";
import * as data from "./data";
import * as model from "./model/model";

export type Config  = model.Config;
export type Context = controller.Context & model.Context;

export const resolvers = (): IResolvers<any, any> => {
    return gmr.merge([
        controller.resolvers(),
        data.resolvers(),
    ]) as IResolvers<any, any>;
};

export const typeDefs = mergeTypes([
    controller.typeDefs,
    data.typeDefs,
]);

export const schema = (): GraphQLSchema => {
    return makeExecutableSchema({
        typeDefs,
        resolvers: resolvers(),
    });
};

export * from "./model/model";
