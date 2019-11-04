import { UserInputError, AuthenticationError } from "apollo-server";
import {User, Session} from "../../data";
import { AuthProvider, Context as AuthContext} from "../authprovider";
import {SessionMgr } from "../../skeleton/sessionmgr";
import {SessionMgrContext} from "../../schema";
import { mocked, MaybeMockedDeep } from "ts-jest/dist/util/testing";
import { PubSub } from "../pubsub";
import * as global from "../../global";
import jwt from "jsonwebtoken";
import faker from "faker";

jest.mock("../../skeleton/sessionmgr");

interface IContext {
    session_manager_mocked: MaybeMockedDeep<SessionMgr>;
}

type Context = IContext & AuthContext;

const session_ctx_mocked = async (): Promise<Context> => {
    const session_mgr = mocked(new SessionMgr(), true);
    const ctx = {
        session: new Session(),
        session_manager_mocked: session_mgr,
        session_manager: session_mgr,
        config: global.config,
        pubsub: new PubSub(),
    };
    ctx.config.logger.level = "info";
    return ctx;
};

const jwt_verify = async (token: string, ctx: AuthContext): Promise<User> => {
    return new Promise((resolve, reject) => {
        jwt.verify(token, ctx.config.secret, {maxAge: ctx.config.tokenExpires}, (err, decoded) => {
            if (decoded instanceof Object) {
                const user = User.decode(decoded);
                resolve(user);
            } else {
                reject(err);
            }
        });
    });
};

describe("AuthProvider", () => {
    let ctx: Context;
    const userName = faker.internet.userName();
    const password = faker.internet.password();
    const newPassword = faker.internet.password();
    const auth = new AuthProvider();

    beforeAll( async () => {
        ctx = await session_ctx_mocked();
    });

    test("register new user", async () => {
        const token = await auth.register({userName, password1: password, password2: password}, ctx);
        const user = await jwt_verify(token, ctx);
        expect(ctx.session_manager_mocked.find_or_store.mock.calls[0][0]).toEqual(new User(userName));
        expect(user.userName).toEqual(userName);
    });

    test("reregister user, with the same name", async () => {
        await expect(auth.register({userName, password1: password, password2: password}, ctx))
        .rejects
        .toThrow(UserInputError);
    });

    test("login with new user", async () => {
        const token = await auth.login({userName, password}, ctx);
        const user = await jwt_verify(token, ctx);
        expect(ctx.session_manager_mocked.find_or_store.mock.calls[0][0]).toEqual(new User(userName));
        expect(user.userName).toEqual(userName);
    });

    test("signin", async () => {
        const token = await auth.login({userName, password}, ctx);
        const user = await jwt_verify(token, ctx);
        expect(ctx.session_manager_mocked.find_or_store.mock.calls[0][0]).toEqual(new User(userName));

        ctx.session_manager_mocked.use_token.mockImplementation(async (_token: string, _ctx: SessionMgrContext) => user);
        const userName2 = await auth.signin({token}, ctx);
        expect(userName2).toEqual(userName);
    });

    test("login with a wrong password", async () => {
        await expect(auth.login({userName, password: "password"}, ctx))
        .rejects
        .toThrow(UserInputError);
    });

    test("change password", async () => {
        const token = await auth.password({userName, oldPassword: password, password1: newPassword, password2: newPassword}, ctx);
        const user = await jwt_verify(token, ctx);
        expect(user.userName).toEqual(userName);
        expect(ctx.session_manager_mocked.find_or_store.mock.calls[0][0]).toEqual(new User(userName));
        await expect(auth.login({userName, password: newPassword}, ctx)).resolves;
    });

    test("user is authenticated?", async () => {
        await expect(auth.authenticated(undefined, ctx)).rejects.toThrow(AuthenticationError);
        ctx.session.user = new User(userName);
        expect(await auth.authenticated(undefined, ctx)).toEqual(userName);
    });

});
