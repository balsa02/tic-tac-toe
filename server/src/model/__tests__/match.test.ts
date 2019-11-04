import {Lobby} from "../../skeleton/lobby";
import { mocked, MaybeMockedDeep } from "ts-jest/dist/util/testing";
import { Session, User, ParticipantRole, Participant, Sign } from "../../data";
import * as global from "../../global";
import { PubSub } from "../pubsub";
import uuidv4 from "uuid/v4";
import { Match, Context as MatchContext } from "../match";
import faker from "faker";
import { UserInputError } from "apollo-server";

jest.mock("../../skeleton/lobby");

interface IContext {
    lobby_mocked: MaybeMockedDeep<Lobby>;
}

type Context = IContext & MatchContext;

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

const match_watch_factory = async (match: Match, ctx: Context) => {
    if (!ctx.session.matchId) {
        throw new Error("Missing match id");
    }
    const iterator: AsyncIterator<{ match: Match }> = ctx.pubsub.asyncIterator("match." + ctx.session.matchId);
    const asyncIterable = {
        [Symbol.asyncIterator]() { return iterator; },
    };

    return async () => {
        for await (const msg of asyncIterable) {
            return msg;
        }
    };
};

const call_with_watch = async (match: Match, promise_factory: () => Promise <void>, ctx: Context) => {
    const watch = await match_watch_factory(match, ctx);
    const result = await Promise.all([
        watch(),
        promise_factory(),
    ]);
    if (!result[0]) {
        throw new Error("match event not received");
    }
    const participants = await match.participants;
    expect(await result[0].match.participants).toEqual(participants);
};

const fake_user = (sign: Sign|null, role: ParticipantRole) => {
    const username = faker.internet.userName();
    const user = new User(username);
    return {
        username,
        user,
        participant: {
            user,
            sign,
            role,
            } as Participant,
    };
};

describe("Match", () => {
    let match: Match;
    let ctx: Context;
    const id = uuidv4();
    const user1 = fake_user(Sign.X, ParticipantRole.Player);
    const user2 = fake_user(Sign.O, ParticipantRole.Player);
    const user3 = fake_user(null, ParticipantRole.Spectator);

    describe("Basic join process", () => {

        beforeAll(async () => {
            ctx = await session_ctx_mocked();
            match = await Match.create(id, user1.user);
            ctx.session.matchId = match.id;
        });

        test("create a new match", async () => {
            match = await Match.create(id, user1.user);
            expect(match).toBeInstanceOf(Match);
            expect(match.participants).toEqual(expect.arrayContaining([user1.participant]));
        });

        test("join user as player", async () => {
            ctx.lobby_mocked.exit_user.mockClear();
            await call_with_watch(
                match,
                async () => {
                    const result = await match.join(user2.user, ParticipantRole.Player, ctx);
                    expect(result).toBe(true);
                },
                ctx,
            );
            expect(match.participants).toEqual(expect.arrayContaining([user1.participant, user2.participant]));
            const exited_users: User[] = new Array();
            for (const params of ctx.lobby_mocked.exit_user.mock.calls) {
                exited_users.push(params[0]);
            }
            expect(exited_users).toEqual(expect.arrayContaining([user1.user, user2.user]));
        });

        test("join a 2. user as player should fail", async () => {
            await expect(match.join(user2.user, ParticipantRole.Player, ctx)).rejects.toThrow(UserInputError);
        });

        test("join user as spectator", async () => {
            ctx.lobby_mocked.exit_user.mockClear();
            await call_with_watch(
                match,
                async () => {
                    const result = await match.join(user3.user, ParticipantRole.Spectator, ctx);
                    expect(result).toBe(true);
                },
                ctx,
            );
            expect(match.participants).toEqual(expect.arrayContaining([user1.participant, user2.participant, user3.participant]));
            const exited_users: User[] = new Array();
            for (const params of ctx.lobby_mocked.exit_user.mock.calls) {
                exited_users.push(params[0]);
            }
            expect(exited_users).toEqual(expect.arrayContaining([user3.user]));
        });

        test("exit user as player", async () => {
            ctx.session.user = user2.user;
            const result = await match.leave(ctx);
            expect(result).toBe(true);
            expect(match.participants).toEqual(expect.arrayContaining([user1.participant, user3.participant]));
        });

        test("rejoin user as player", async () => {
            ctx.lobby_mocked.exit_user.mockClear();
            await call_with_watch(
                match,
                async () => {
                    const result = await match.join(user2.user, ParticipantRole.Player, ctx);
                    expect(result).toBe(true);
                },
                ctx,
            );
            expect(match.participants).toEqual(expect.arrayContaining([user1.participant, user2.participant, user3.participant]));
            const exited_users: User[] = new Array();
            for (const params of ctx.lobby_mocked.exit_user.mock.calls) {
                exited_users.push(params[0]);
            }
            expect(exited_users).toEqual(expect.arrayContaining([user1.user, user2.user, user3.user]));
        });
    });

    describe("Basic gameplay", () => {

        beforeEach(async () => {
            ctx = await session_ctx_mocked();
            match = await Match.create(id, user1.user);
            ctx.session.matchId = match.id;
            await match.join(user2.user, user2.participant.role, ctx);
            await match.join(user3.user, user3.participant.role, ctx);
        });

        test("User steps", async () => {
            ctx.lobby_mocked.exit_user.mockClear();
            let next_user = user1;
            let next_cell = 0;
            while (!match.ended && next_cell < 9) {
                ctx.session.user = next_user.user;
                await call_with_watch(
                    match,
                    async () => {
                        await match.step({ cell: next_cell}, ctx);
                        expect(match.board[next_cell]).toEqual(next_user.participant.sign);
                    },
                    ctx,
                );
                /** Wrong step order should fail */
                await expect(match.step({ cell: next_cell}, ctx)).rejects.toThrow(UserInputError);

                next_cell++;
                if (next_user === user1) {
                    next_user = user2;
                } else {
                    next_user = user1;
                }
            }
            expect(match.ended).toEqual(true);
            expect(match.winner).toEqual(user1.participant);

            const entry_users: User[] = new Array();
            for (const params of ctx.lobby_mocked.entry_user.mock.calls) {
                entry_users.push(params[0]);
            }
            expect(entry_users).toEqual(expect.arrayContaining([user1.user, user2.user, user3.user]));
        });
    });
});
