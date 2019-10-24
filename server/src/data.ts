import { gql } from "apollo-server";

export const typeDefs = gql`
    type Ping {
        payload: String!
    }

    type User {
        userName: String!
    }
    enum ParticipantRole {
        Player
        Spectator
    }
    enum Sign {
        O
        X
    }
    type Participant {
        user: User!
        sign: Sign
        role: ParticipantRole!
    }
    type Invite {
        from: User!
        matchId: String!
        role: ParticipantRole!
        token: String!
    }
    type Reject {
        from: User!
        matchId: String!
        role: ParticipantRole!
    }
`;

export const resolvers = (): any => (
    {
        Sign: {
            O: Sign.O,
            X: Sign.X,
        },
        ParticipantRole: {
            Player: ParticipantRole.Player,
            Spectator: ParticipantRole.Spectator,
        },
    }
);

export class Ping {
    public payload!: string;
}

export class User {
    public static decode(obj: object): User {
        const user = obj as User;
        if (user.userName && typeof user.userName === "string") {
            return user;
        } else {
            throw new Error("Can't parse as User the object: " + JSON.stringify(obj));
        }
    }
    public userName!: string;
    constructor(userName: string) {
        this.userName = userName;
    }
}

export enum ParticipantRole {
    Player,
    Spectator,
}

export enum Sign {
    X = 1,
    O,
}

export class Participant {
    public user!: User;
    public sign!: Sign | null;
    public role!: ParticipantRole;
}

/** This will be send to the invited user, through his Inbox */
export class Invite {
    public from!: User;
    public matchId!: string;
    public role!: ParticipantRole;
    public token!: string;
}

/** This will be send to the match owner, through his Inbox */
export class Reject {
    public from!: User;
    public matchId!: string;
    public role!: ParticipantRole;
}

export class InviteData {
    public static decode(obj: object): InviteData {
        const data = obj as InviteData;
        if ((data.userName && typeof data.userName === "string") &&
            (data.matchId && typeof data.matchId === "string")
        ) {
            let role = ParticipantRole.Spectator;
            if (data.role === ParticipantRole.Player) {
                role = ParticipantRole.Player;
            }
            const ret: InviteData = {
                userName: data.userName,
                matchId: data.matchId,
                role,
            };
            return ret;
        } else {
            throw new Error("Can't parse the object as InviteData: " + JSON.stringify(obj));
        }
    }

    public userName!: string;
    public matchId!: string;
    public role!: ParticipantRole;
}

export class Session {
    public matchId: string | undefined;
    private _user: User;
    private _authenticated: boolean;

    constructor() {
        this._user = new User("");
        this._authenticated = false;
    }

    set user(user: User) {
        this._user = user;
        this._authenticated = true;
    }

    get user(): User {
        return this._user;
    }

    get authenticated(): boolean {
        return this._authenticated;
    }
}
