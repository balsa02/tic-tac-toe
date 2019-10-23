import { string } from "@hapi/joi";
import { Participant, ParticipantRole, User, Sign } from "./data";
import {Context} from "./schema";

export interface Match {
    id: string;
    participants: Participant[];
    board: Array<Sign|null>;
    next: Participant;
    winner?: Participant;
    step(args: {cell: number}, ctx: Context): Promise<boolean>;
    join(user: User, role: ParticipantRole, ctx: Context): Promise<boolean>;
    leave(ctx: Context): Promise<boolean>;
}

export interface Auth {
    login(args: {userName: string, password: string}, ctx: Context): Promise<string>;
    signin(args: {token: string}, ctx: Context): Promise<string>;
    register(args: {userName: string, password1: string, password2: string}, ctx: Context): Promise<string>;
    password(args: {userName: string, oldPassword: string, password1: string, password2: string}, ctx: Context): Promise<string>;
    authenticated(_args: undefined, ctx: Context): Promise<string>;
    authenticated_iterator(args: {interval: number}, ctx: Context): AsyncIterator<string>;
}

export interface MatchMaker {
    create(_args: undefined, ctx: Context): Promise<Match>;
    invite(args: {userName: string, role: ParticipantRole}, ctx: Context): Promise<string>;
    join(args: {token: string}, ctx: Context): Promise<boolean>;
    reject(args: {token: string}, ctx: Context): Promise<boolean>;
    lease(ctx: Context): Promise<Match|null>;
}

export interface SessionMgr {
    find_or_store(user: User, ctx: Context): Promise<void>;
    use_token(token: string, ctx: Context): Promise<User>;
}

export interface Lobby {
    list(_args: undefined, ctx: Context): Promise<User[]>;
    entry(ctx: Context): Promise<void>;
    entry_user(user: User, ctx: Context): Promise<void>;
    exit(ctx: Context): Promise<void>;
    exit_user(user: User, ctx: Context, force: boolean): Promise<void>;
    iterator(ctx: Context): Promise<AsyncIterator<Lobby>>;
}
