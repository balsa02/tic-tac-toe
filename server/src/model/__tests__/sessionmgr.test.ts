import jwt from "jsonwebtoken";
import { User, Session } from "../../data";
import * as global from "../../global";
import {Context as SessionMgrContext} from "../sessionmgr";
import { SessionMgr } from "../sessionmgr";
import faker from "faker";

const jwt_sign = async (user: User, ctx: SessionMgrContext): Promise<string> => {
    return new Promise((resolve, reject) => {
        jwt.sign(Object.assign({}, user), ctx.config.secret, {expiresIn: ctx.config.tokenExpires}, (err, token) => {
            if (err) {
                reject(err);
            } else {
                resolve(token);
            }
        });
    });
};

const session_ctx = async (): Promise<SessionMgrContext> => {
    const ctx = {
        session: new Session(),
        config: global.config,
    };
    ctx.config.logger.level = "info";
    return ctx;
};

describe("SessionMgr", () => {
    let ctx: SessionMgrContext;
    const userName = faker.internet.userName();
    const user: User = new User(userName);
    const session_mgr = new SessionMgr();
    const matchId = faker.random.uuid();

    beforeAll( async () => {
        ctx = await session_ctx();
    });

    test("store new user", async () => {
        await session_mgr.find_or_store(user, ctx);
        expect(ctx.session.user).toBe(user);
    });

    test("find user", async () => {
        ctx.session.matchId = matchId;
        ctx.session = new Session();
        await session_mgr.find_or_store(user, ctx);
        expect(ctx.session.user).toEqual(user);
        expect(ctx.session.matchId).toEqual(matchId);
    });

    test("use_token", async () => {
        ctx.session = new Session();
        const token = await jwt_sign(user, ctx);
        const newUser = await session_mgr.use_token(token, ctx);
        expect(ctx.session.user).toEqual(user);
        expect(ctx.session.matchId).toEqual(matchId);
    });
});
