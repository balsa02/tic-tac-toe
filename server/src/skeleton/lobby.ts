import {LobbyContext} from "../schema";
import { User } from "../data";

export class Lobby {
    public async list(_args: undefined, ctx: LobbyContext): Promise<User[]> {
        const users: User[] = new Array();
        users.push(new User(""));
        return users;
    }
    public async entry_user(user: User, ctx: LobbyContext): Promise<void> { return; }
    public async exit_user(user: User, ctx: LobbyContext, force: boolean): Promise<void> { return; }
    public async iterator(ctx: LobbyContext): Promise<AsyncIterator<{lobby: Lobby}>> {
        return ctx.pubsub.asyncIterator("lobby");
    }
}
