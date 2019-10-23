import jwt from "jsonwebtoken";
import winston from "winston";
import {Session, User} from "../../data";
import * as global from "../../global";
import {Config, Context} from "../../schema";
import * as sessionmgr from "../sessionmgr";

const jwt_sign = async (user: User, ctx: Context): Promise<string> => {
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

test("SessionMgr store use on session", async () => {
    const ctx = await global.session_ctx();
    const user: User = new User("gal_b");
    await ctx.session_manager.find_or_store(user, ctx);
    expect(ctx.session.user).toBe(user);
});

test("SessionMgr store use on session store", async () => {
    const ctx = await global.session_ctx();
    const user: User = new User("gal_b");
    await ctx.session_manager.find_or_store(user, ctx);
    const sessionMgr = ctx.session_manager as sessionmgr.SessionMgr;
    expect(sessionMgr.sessions.get(user.userName)).toBe(ctx.session);
});

test("SessionMgr store use token", async () => {
    const ctx = await global.session_ctx();
    const user: User = new User("gal_b");
    const token = await jwt_sign(user, ctx);
    const sessionMgr = ctx.session_manager as sessionmgr.SessionMgr;
    await sessionMgr.use_token(token, ctx);
    expect(sessionMgr.sessions.get(user.userName)).toBe(ctx.session);
});
