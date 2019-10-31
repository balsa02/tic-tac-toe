import { Participant, ParticipantRole, User, Sign } from "./data";
import {AuthContext, LobbyContext, MatchContext, MatchMakerContext, SessionMgrContext} from "./schema";

export interface Match {
    id: string;
    participants: Participant[];
    board: Array<Sign|null>;
    next: Participant;
    ended: boolean;
    winner?: Participant;
    step(args: {cell: number}, ctx: MatchContext): Promise<boolean>;
    join(user: User, role: ParticipantRole, ctx: MatchContext): Promise<boolean>;
    leave(ctx: MatchContext): Promise<boolean>;
}

export interface Auth {
    login(args: {userName: string, password: string}, ctx: AuthContext): Promise<string>;
    signin(args: {token: string}, ctx: AuthContext): Promise<string>;
    register(args: {userName: string, password1: string, password2: string}, ctx: AuthContext): Promise<string>;
    password(args: {userName: string, oldPassword: string, password1: string, password2: string}, ctx: AuthContext): Promise<string>;
    authenticated(_args: undefined, ctx: AuthContext): Promise<string>;
    authenticated_iterator(args: {interval: number}, ctx: AuthContext): AsyncIterator<string>;
}

export interface MatchMaker {
    create(_args: undefined, ctx: MatchMakerContext): Promise<Match>;
    invite(args: {userName: string, role: ParticipantRole}, ctx: MatchMakerContext): Promise<string>;
    join(args: {token: string}, ctx: MatchMakerContext): Promise<boolean>;
    reject(args: {token: string}, ctx: MatchMakerContext): Promise<boolean>;
    lease(ctx: MatchMakerContext): Promise<Match|null>;
}

export interface SessionMgr {
    find_or_store(user: User, ctx: SessionMgrContext): Promise<void>;
    use_token(token: string, ctx: SessionMgrContext): Promise<User>;
}

export interface Lobby {
    list(_args: undefined, ctx: LobbyContext): Promise<User[]>;
    entry(ctx: LobbyContext): Promise<void>;
    entry_user(user: User, ctx: LobbyContext): Promise<void>;
    exit(ctx: LobbyContext): Promise<void>;
    exit_user(user: User, ctx: LobbyContext, force: boolean): Promise<void>;
    iterator(ctx: LobbyContext): Promise<AsyncIterator<Lobby>>;
}
