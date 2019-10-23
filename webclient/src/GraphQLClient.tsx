import { WebSocketLink } from 'apollo-link-ws';
import { InMemoryCache, NormalizedCacheObject } from 'apollo-cache-inmemory';
import { ApolloClient } from 'apollo-client';
import { SubscriptionClient } from 'subscriptions-transport-ws';
import React from 'react';
import { ApolloProvider } from '@apollo/react-hooks';
import { useStateContext, contextInstance } from './ContextProvider';

export class GraphQLClientData {
    public cache!: InMemoryCache;
    public wsClient!: SubscriptionClient;
    public wsLink!: WebSocketLink;
    public client!: ApolloClient<NormalizedCacheObject>;
}

interface GraphQLClientProps {
    children?: React.ReactNode;
}

export const GraphQLClient = (props: GraphQLClientProps) => {
    const [ctx, _dispatch] = useStateContext();
    console.log("GraphQLClient rerun");

    ctx.client = new GraphQLClientData();
    ctx.client.cache = new InMemoryCache();

    ctx.client.wsClient = new SubscriptionClient(
    `ws://${window.location.host}/graphql`,
    {
        reconnect: true,
        connectionParams: () => {
            console.log("connectionParams setup: " + contextInstance.token);
            console.log("connectionParams setup userName: " + contextInstance.userName);
            return ({
                "token": contextInstance.token,
            })
        },
    }
    );
    // Create a WebSocket link:
    ctx.client.wsLink = new WebSocketLink(ctx.client.wsClient);

    ctx.client.client = new ApolloClient({
        cache: ctx.client.cache,
        link: ctx.client.wsLink
    })

    return (
        <ApolloProvider client={ctx.client.client}>
            {props.children ? props.children : null}
        </ApolloProvider>
    );
}