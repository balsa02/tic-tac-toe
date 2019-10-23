import * as apollo from "apollo-server";

export class PubSub extends apollo.PubSub {
    constructor(options: apollo.PubSubOptions = {}) {
        super(options);
      }
    public publish_with_result(triggerName: string, payload: any): Promise<boolean> {
        return Promise.resolve(this.ee.emit(triggerName, payload));
    }
}
