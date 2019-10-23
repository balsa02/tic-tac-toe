import { UserInputError } from "apollo-server";
import {User} from "../../data";
import * as global from "../../global";
import { AuthProvider } from "../authprovider";

test("AuthProvider register new user, then login with it with a session", async () => {
    const ctx = await global.session_ctx();
    const userName = "test01";
    const password = "qqqqq";

    await ctx.auth.register({userName, password1: password, password2: password}, ctx);
    await ctx.auth.login({userName, password}, ctx);
    expect(ctx.session.user).toEqual(new User(userName));
});

test("AuthProvider register new user, with the same name", async () => {
    const ctx = await global.session_ctx();
    const userName = "test01";
    const password = "qqqqq";
    try {
        await ctx.auth.register({userName, password1: password, password2: password}, ctx);
    } catch (e) {
        expect(e).toEqual(new UserInputError("User already registered"));
    }
});

test("AuthProvider register new user, then login with a wrong password", async () => {
    const ctx = await global.session_ctx();
    ctx.auth = new AuthProvider();
    const userName = "test01";
    const password = "qqqqq";

    await ctx.auth.register({userName, password1: password, password2: password}, ctx);
    try {
        const result = await ctx.auth.login({userName, password: "password"}, ctx);
    } catch (e) {
        expect(e).toEqual(new UserInputError("Unknown user or wrong password"));
    }
});
