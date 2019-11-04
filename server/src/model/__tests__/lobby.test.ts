import {Context, Lobby} from "../lobby";
import { PubSub } from "../pubsub";
import { Session, User } from "../../data";
import * as global from "../../global";
import faker from "faker";

const session_ctx = async (): Promise<Context> => {
    const ctx = {
        session: new Session(),
        config: global.config,
        pubsub: new PubSub(),
    };
    ctx.config.logger.level = "info";
    return ctx;
};

const lobby_watch_factory = async (lobby: Lobby, ctx: Context) => {
    const iterator = await lobby.iterator(ctx);
    const asyncIterable = {
        [Symbol.asyncIterator]() { return iterator; },
    };

    return async () => {
        for await (const lobbyMsg of asyncIterable) {
            return lobbyMsg;
        }
    };
};

const call_with_watch = async (lobby: Lobby, promise_factory: () => Promise <void>, ctx: Context) => {
    const lobby_watch = await lobby_watch_factory(lobby, ctx);
    const result = await Promise.all([
        lobby_watch(),
        promise_factory(),
    ]);
    if (!result[0]) {
        throw new Error("lobby event not received");
    }
    const users = await lobby.list(undefined, ctx);
    expect(await result[0].lobby.list(undefined, ctx)).toEqual(users);
};

describe("Lobby", () => {
    let ctx: Context;
    let lobby: Lobby;
    const userName = faker.internet.userName();
    const user = new User(userName);
    let inboxSubId: number;

    describe("input based tests", () => {

        beforeAll( async () => {
            ctx = await session_ctx();
            lobby = new Lobby();
            ctx.session.user = user;
        });

        test("entry_user with user", async () => {
            await call_with_watch(
                lobby,
                async () => {
                    await lobby.entry_user(user, ctx);
                    const users = await lobby.list(undefined, ctx);
                    expect(users[0]).toEqual(user);
                },
                ctx,
            );
        });

        test("exit_user with user", async () => {
            await call_with_watch(
                lobby,
                async () => {
                    await lobby.exit_user(user, ctx, false);
                    const users = await lobby.list(undefined, ctx);
                    expect(users.length).toEqual(0);
                },
                ctx,
            );
        });
    });

    describe("input based tests with inbox subscription", () => {

        beforeAll( async () => {
            ctx = await session_ctx();
            lobby = new Lobby();
            ctx.session.user = user;
            inboxSubId = await ctx.pubsub.subscribe("user." + user.userName, () => { return; });
        });

        test("entry_user with user", async () => {
            await call_with_watch(
                lobby,
                async () => {
                    await lobby.entry_user(user, ctx);
                    const users = await lobby.list(undefined, ctx);
                    expect(users[0]).toEqual(user);
                },
                ctx,
            );
        });

        test("exit_user with user", async () => {
            await lobby.exit_user(user, ctx, false);
            const users = await lobby.list(undefined, ctx);
            expect(users[0]).toEqual(user);
        });

        test("exit_user with user forced", async () => {
            await call_with_watch(
                lobby,
                async () => {
                    await lobby.exit_user(user, ctx, true);
                    const users = await lobby.list(undefined, ctx);
                    expect(users.length).toEqual(0);
                },
                ctx,
            );
        });

        afterAll(async () => {
            ctx.pubsub.unsubscribe(inboxSubId);
        });
    });
});
