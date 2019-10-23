import net from "net";
import {GraphQLTcpServer} from "../tcp_server";
import {config, logger, schema, session_ctx} from "./common_server";

test("GraphQL TCP server with client/server chat", async () => {
    const tcpSrv = new GraphQLTcpServer(config, schema, session_ctx);
    const client = new net.Socket();

    await tcpSrv.start();

    await new Promise((resolve, reject) => {
            client.connect(config.tcp.port, config.tcp.host, () => {
                logger.info("Client connected");
                resolve();
            });
    });

    const result = await new Promise((resolve, reject) => {
        let answer = "";
        client.on("data", (data) => {
            logger.info(`Client received msg:${data.toString()}`);
            answer += data.toString();
        })
        .on("end", () => {
            resolve(answer);
        })
        .write(`{greatings{hello(name: "Test")}}\n.\n`, () => {
            client.end();
        });
    });

    client.destroy();
    await tcpSrv.stop();
    expect(result).toBe(`{"data":{"greatings":{"hello":"hello Test"}}}\r\n`);
});
