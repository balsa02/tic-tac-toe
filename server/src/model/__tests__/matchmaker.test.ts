import {Lobby} from "../../skeleton/lobby";
import { mocked, MaybeMockedDeep } from "ts-jest/dist/util/testing";
import { Session, User, ParticipantRole, Invite, Ping, Reject } from "../../data";
import * as global from "../../global";
import { PubSub } from "../pubsub";
import { MatchMaker, Context as MatchMakerContext } from "../matchmaker";
import faker from "faker";
import { Match } from "../match";
import { Match as IMatch} from "../../services";

jest.mock("../../skeleton/lobby");

interface IContext {
    lobby_mocked: MaybeMockedDeep<Lobby>;
}

type Context = IContext & MatchMakerContext;

class FakeUser {
    public username!: string;
    public user!: User;
    public role!: ParticipantRole;
}

const session_ctx_mocked = async (): Promise<Context> => {
    const lobby = mocked(new Lobby(), true);
    const ctx = {
        session: new Session(),
        lobby_mocked: lobby,
        lobby,
        config: global.config,
        pubsub: new PubSub(),
    };
    ctx.config.logger.level = "info";
    return ctx;
};

const fake_user = (role: ParticipantRole): FakeUser => {
    const username = faker.internet.userName();
    const user = new User(username);
    return {
        username,
        user,
        role,
    };
};

const inbox_watch_factory = async (user: User, ctx: Context) => {
    const iterator = ctx.pubsub.asyncIterator<{inbox: Invite|Ping|Reject}>("user." + user.userName);
    const asyncIterable = {
        [Symbol.asyncIterator]() { return iterator; },
    };

    return async () => {
        for await (const msg of asyncIterable) {
            return msg;
        }
    };
};

const inbox_watch = async (user: User, promise_factory: () => Promise <void>, ctx: Context) => {
    const watch = await inbox_watch_factory(user, ctx);
    const result = await Promise.all([
        watch(),
        promise_factory(),
    ]);
    if (!result[0]) {
        throw new Error("match event not received");
    }
    return result;
};

const invite = async (user1: FakeUser, user2: FakeUser, matchmaker: MatchMaker, ctx: Context): Promise<string> => {
    ctx.session.user = user1.user;
    let token: string = "";
    const result = await inbox_watch(
        user2.user,
        async () => {
            token = await matchmaker.invite({userName: user2.username, role: user2.role}, ctx);
        },
        ctx,
    );
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result[0]!.inbox).toHaveProperty("token");
    const inviteResult = result[0]!.inbox as Invite;
    expect(inviteResult.from).toEqual(user1.user);
    expect(inviteResult.role).toEqual(user2.role);
    expect(inviteResult.matchId).toEqual(ctx.session.matchId);
    return token;
};

const reject = async (token: string, user1: FakeUser, user2: FakeUser, match: IMatch, matchmaker: MatchMaker, ctx: Context): Promise<void> => {
    ctx.session.user = user2.user;
    const result = await inbox_watch(
        user1.user,
        async () => {
            await matchmaker.reject({token}, ctx);
        },
        ctx,
    );
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result[0]!.inbox).not.toHaveProperty("token");
    expect(result[0]!.inbox).toHaveProperty("matchId");
    const rejectResult = result[0]!.inbox as Reject;
    expect(rejectResult.from).toEqual(user2.user);
    expect(rejectResult.matchId).toEqual(match.id);
    expect(rejectResult.role).toEqual(user2.role);
};

const join = async (user: FakeUser, token: string,  matchmaker: MatchMaker, ctx: Context): Promise<void> => {
    ctx.session.user = user.user;
    await matchmaker.join({token}, ctx);
    const myMatch = await matchmaker.lease(ctx);
    expect(myMatch).toBeInstanceOf(Match);
    expect(myMatch!.id).toEqual(ctx.session.matchId);
};

describe("MatchMaker", () => {
    let ctx: Context;
    let token: string;
    let match: IMatch;
    const matchmaker = new MatchMaker(Match.create);
    const user1 = fake_user(ParticipantRole.Player);
    const user2 = fake_user(ParticipantRole.Player);
    const user3 = fake_user(ParticipantRole.Spectator);

    beforeAll(async () => {
        ctx = await session_ctx_mocked();
        ctx.session.user = user1.user;
    });

    test("create match", async () => {
        match = await matchmaker.create(undefined, ctx);
        expect(match).toBeInstanceOf(Match);
        expect(ctx.lobby_mocked.entry_user.mock.calls).toHaveLength(1);
        expect(ctx.session.matchId).toEqual(match.id);
    });
    test("lease match", async () => {
        const myMatch = await matchmaker.lease(ctx);
        expect(myMatch).toBeInstanceOf(Match);
        expect(match!.id).toEqual(match.id);
    });

    test("invite user to match as player", async () => {
        token = await invite(user1, user2, matchmaker, ctx);
    });

    test("reject invite to match  as player", async () => {
        await reject(token, user1, user2, match, matchmaker, ctx);
    });

    test("join user to match as player", async () => {
        await join(user2, token,  matchmaker, ctx);
    });

    test("invite user to match as spectator", async () => {
        token = await invite(user1, user3, matchmaker, ctx);
    });

    test("reject invite to match as spectator", async () => {
        await reject(token, user1, user3, match, matchmaker, ctx);
    });

    test("join user to match as spectator", async () => {
        await join(user3, token,  matchmaker, ctx);
    });
});
