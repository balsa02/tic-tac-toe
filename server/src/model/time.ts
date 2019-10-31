import {PubSubEngine} from "apollo-server";
import {Session} from "../data";

export interface IContext {
    pubsub: PubSubEngine;
    session: Session;
}

export type Context = IContext;

export class Time {

    constructor(public date: Date) {
    }
    public local(_args: undefined, ctx: Context): string {
        return `${ctx.session.user ? ctx.session.user.userName : "unknown"}: ` + this.date.toTimeString();
    }
}

export class Timer {
    private timer?: NodeJS.Timeout;
    constructor(private topic: string, private ctx: Context) {
    }
    public publish(): void {
        const time = new Time(new Date());
        const _ = this.ctx.pubsub.publish(this.topic, {timer: time});
    }
    public stop(): void {
        if (this.timer) {
            clearTimeout(this.timer);
        }
    }
    public start(interval: number): AsyncIterator<Time> {
        this.timer = setInterval( () => {this.publish(); }, interval);
        return this.ctx.pubsub.asyncIterator(this.topic);
    }
}
