import {PubSubEngine, UserInputError} from "apollo-server";
import { Participant, ParticipantRole, Session, User, Sign } from "../data";
import {Context} from "../schema";
import { globalCtx } from "src/global";

export interface IContext {
    pubsub: PubSubEngine;
    session: Session;
}

export class Match {

    get participants(): Participant[] {
        const participants: Participant[] = new Array();
        this.participantsMap.forEach((participant) => {
            participants.push(participant);
        });
        return participants;
    }

    public static async create(id: string, user: User): Promise<Match> {
        return new Match(id, user);
    }
    public board: Array<Sign|null> =
        [   null, null, null,
            null, null, null,
            null, null, null,
        ];
    public next: Participant;
    public winner?: Participant;
    public ended: boolean;
    private participantsMap: Map<string, Participant>;

    constructor(public id: string, user: User) {
        this.participantsMap = new Map();
        this.next = {user, sign: Sign.X, role: ParticipantRole.Player};
        this.participantsMap.set(user.userName, this.next);
        this.ended = false;
    }

    /**
     * Join a user to the match as [[ParticipantRole]]
     * this intended to be called by [[MatchMaker]], do not expose this to the user
     */
    public async join(user: User, role: ParticipantRole, ctx: Context): Promise<boolean> {
        const participant: Participant = { user, sign: null, role };
        if (this.ended) {
            throw new UserInputError("The match ended.");
        }
        if (role === ParticipantRole.Player) {
            participant.sign = Sign.O;
            let playerCount = 0;
            this.participantsMap.forEach((value) => {
                if (value.role === ParticipantRole.Player) {
                    playerCount++;
                }
            });
            if (playerCount > 1) {
                throw new UserInputError("The match has already 2 player.");
            }
            if (this.next.sign === participant.sign ) {
                this.next = participant;
            }
        }
        if (!this.participantsMap.get(user.userName)) {
              this.participantsMap.set(user.userName, participant);
        }
        await this.users_exit_lobby(ctx);
        const topic = "match." + this.id;
        await ctx.pubsub.publish(topic, {match: this});
        return true;
    }

    public async leave(ctx: Context): Promise<boolean> {
        return this.participantsMap.delete(ctx.session.user.userName);
    }

    // public entry point
    public async step(args: {cell: number}, ctx: Context): Promise<boolean> {
        if (this.winner) {
            ctx.config.logger.debug("The game ended");
            throw new UserInputError(`The game ended`);
        }

        if (ctx.session.user.userName !== this.next.user.userName) {
            const msg = `The next user is ${this.next.user.userName}`;
            ctx.config.logger.debug(msg);
            throw new UserInputError(msg);
        }

        const participant = this.participantsMap.get(ctx.session.user.userName);
        if (!participant) {
            const msg = `Unknown user ${ctx.session.user.userName}`;
            ctx.config.logger.debug(msg);
            throw new UserInputError(msg);
        }

        if (args.cell >= this.board.length || args.cell < 0) {
            const msg = `The cell ${args.cell} position is out of table`;
            ctx.config.logger.debug(msg);
            throw new UserInputError(msg);
        }
        if (this.board[args.cell]) {
            const msg = `The table cell ${args.cell} is already used`;
            ctx.config.logger.debug(msg);
            throw new UserInputError(msg);
        }
        // set the next user
        this.next = this.next_player(participant);

        this.board[args.cell] = participant.sign;
        // check fow winner
        const winner = this.search_winner();
        if (winner) {
            this.winner = this.participant_by_sign(winner);
            await this.end(ctx);
        }
        if (this.no_step_left()) {
            await this.end(ctx);
        }
        // event the standing
        const topic = "match." + this.id;
        ctx.config.logger.debug("Publish match to pubsub topic:" + topic);
        await ctx.pubsub.publish(topic, {match: this});
        return true;
    }
    private async users_exit_lobby(ctx: Context) {
        for (const participant of this.participantsMap.values()) {
            await ctx.lobby.exit_user(participant.user, ctx, true);
        }
    }

    // let the users to enter the lobby
    private async end(ctx: Context): Promise<void> {
        this.ended = true;
        for (const participant of this.participantsMap.values()) {
            await ctx.lobby.entry_user(participant.user, ctx);
        }
    }

    /** Stolen from https://reactjs.org/tutorial/tutorial.html */
    private search_winner(): Sign|null {
        const lines = [
          [0, 1, 2],
          [3, 4, 5],
          [6, 7, 8],
          [0, 3, 6],
          [1, 4, 7],
          [2, 5, 8],
          [0, 4, 8],
          [2, 4, 6],
        ];

        for (const [a, b, c] of lines) {
            if (this.board[a] && this.board[a] === this.board[b] && this.board[a] === this.board[c]) {
                return this.board[a];
            }
        }
        return null;
    }
    private participant_by_sign(sign: Sign): Participant {
        for (const [_key, value] of this.participantsMap) {
            if (value.role === ParticipantRole.Player && value.sign === sign) {
                return value;
            }
        }
        throw new UserInputError("Can't find player by sign");
    }

    private next_player(current: Participant): Participant {
        for (const [_key, value] of this.participantsMap) {
            if (value.role === ParticipantRole.Player && value !== current) {
                return value;
            }
        }
        throw new UserInputError("Can't find the next player");
    }

    private no_step_left(): boolean {
        for (const cell of this.board) {
            if (!cell) {
                return false;
            }
        }
        return true;
    }
}
