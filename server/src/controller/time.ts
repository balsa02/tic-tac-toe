import { gql} from "apollo-server";
import * as time from "../model/time";
import {Context} from "../schema";
import {withCancel} from "../subscription";
import uuidv4 from "uuid/v4";

export interface IContext {
}

export const typeDefs = gql`
    type Time {
        local: String!
    }
    type Query {
        time: Time!
    }
    type Subscription {
        timer(interval: Int!): Time!
    }
`;
//         local(timezone: String): String!

export const resolvers = (): any => {
    return {
        Query: {
            time: () => new time.Time(new Date()),
        },
        Subscription: {
            /* timer: {
                subscribe: () => new Timer('timer', 1000).iterator()
            }, */
            timer: {
                subscribe: (_: undefined, args: {interval: number}, ctx: Context) => {
                    const timer = new time.Timer("timer" + uuidv4(), ctx);
                    return withCancel(
                        timer.start(args.interval),
                        async () => {
                            timer.stop();
                        },
                    );
                },
            },
        },
    };
};
