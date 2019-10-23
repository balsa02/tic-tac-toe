export class Ping {
    public payload!: string;
}

export class User {
    public userName!: string;

}

export enum ParticipantRole {
    Player = "Player",
    Spectator = "Spectator",
}

export class Participant {
    public user!: User;
    public sign!: Sign | null;
    public role!: ParticipantRole;
}

export enum Sign {
    X = "X",
    O = "O",
}

export type SignType = Sign | null;

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

export class Lobby {
    public list!: User[];
}

export class Match {
    public id!: string;
    public participants!:Participant[];
    //public board!: SignType[];
    public board!: SignType[];
    public next!: Participant;
    public winner!: Participant;
}
