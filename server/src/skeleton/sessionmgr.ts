import {User} from "../data";
import {SessionMgrContext} from "../schema";

/**
 * This will be used for Mocking
 */
export class SessionMgr {
    public async find_or_store(user: User, ctx: SessionMgrContext) { return; }
    public async use_token(token: string, ctx: SessionMgrContext) { return new User(""); }
}
