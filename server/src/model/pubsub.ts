import * as apollo from "apollo-server";

export class PubSub extends apollo.PubSub {
    constructor(options: apollo.PubSubOptions = {}) {
        super(options);
      }
    public async publish_with_result(triggerName: string, payload: any): Promise<boolean> {
        return this.ee.emit(triggerName, payload);
    }
}
