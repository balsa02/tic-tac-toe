import * as global from "./global";
import * as schema from "./schema";

import {GraphQLHttpServer} from "./http_server";
import {GraphQLTcpServer} from "./tcp_server";

const gql_schema = schema.schema();

const http_srv = new GraphQLHttpServer(global.config, gql_schema, global.session_ctx);
const tcp_srv = new GraphQLTcpServer(global.config, gql_schema, global.session_ctx);

Promise.all([
    tcp_srv.start(),
    http_srv.start(),
])
.catch((error: Error) => global.logger.info(error));

const stop = () => {
    const ret = Promise.all([
        tcp_srv.stop(),
        http_srv.stop(),
    ])
    .then(() => {
        process.exit(1);
    });
};

process.on("exit", (err) => {
    global.logger.info("exit");
    stop();
});
process.on("unhandledRejection", (err) => {
    global.logger.info("unhandledRejection");
    stop();
});

process.on("SIGINT", (err) => {
    global.logger.info("SIGINT");
    stop();
});
