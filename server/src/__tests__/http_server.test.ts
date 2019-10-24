import { InMemoryCache } from "apollo-cache-inmemory";
import {ApolloClient} from "apollo-client";
import { WebSocketLink } from "apollo-link-ws";
import gql from "graphql-tag";
import {GraphQLHttpServer} from "../http_server";
import {config, schema, session_ctx} from "./common_server";

test("GraphQL HTTP server with client/server chat over ws", async () => {
    const httpSrv = new GraphQLHttpServer(config, schema, session_ctx);

    const cache = new InMemoryCache();

    // Create a WebSocket link:
    const wsLink = new WebSocketLink({
      uri: `ws://localhost:${config.http.port}/graphql`,
      options: {
        reconnect: true,
      },
    });

    const client = new ApolloClient({
      cache,
      link: wsLink,
    });

    await httpSrv.start();

    const result = await client.query({
        query: gql`{greatings{hello(name: "Test")}}`,
        },
    );
    await httpSrv.stop();
    expect(JSON.stringify(result.data)).toBe(`{"greatings":{"hello":"hello Test","__typename":"Greetings"}}`);
}, 10000);
