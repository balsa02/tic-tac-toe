import { useStateContext } from "./ContextProvider";
import gql from "graphql-tag";
import { useSubscription, useQuery } from "@apollo/react-hooks";
import React, { useEffect, useState } from "react";

const AUTHENTICATED_SUBSCRIPTION = gql `
subscription authenticated($interval: Int!){
    authenticated(interval: $interval)
}`;

export const AuthCheckerSubscription: React.FC = () => {
    const [ctx, dispatch] = useStateContext();
    
    const { data, loading, error } = useSubscription<{authenticated: string}>(
        AUTHENTICATED_SUBSCRIPTION,
        { variables: {interval: ctx.authCheckInterval} }
    );
    console.log("AuthChecker");
    console.log(data);
    console.log(loading);
    console.log("AuthChecker error: " + error);

    if (!loading && data) {
        if (ctx.userName === data.authenticated) {
            console.log("AuthChecker username equal");
            dispatch({authenticated: data.authenticated});
        } else {
            if (!ctx.reconnecting) {
                console.log("AuthChecker reconnecting");
                dispatch({reconnecting: true});
            }
        }
    }
    return null;
}

const AUTHENTICATED_QUERY = gql `{
    auth {
        authenticated
    }
}`;

export const AuthCheckerQuery: React.FC = () => {
    const [ctx, dispatch] = useStateContext();
    
    const matchResult = useQuery<{auth: {authenticated: string}}>(
        AUTHENTICATED_QUERY,
        {
            notifyOnNetworkStatusChange: true,
    });

    useEffect(() => {
        const timer = window.setInterval(() => {
            matchResult.refetch()
        }, 1000);
        return () => window.clearInterval(timer);
    },[]);

    console.log("AuthChecker");
    console.log(matchResult.data);
    console.log(matchResult.loading);
    console.log("AuthChecker error: " + matchResult.error);

    if (matchResult.error) {
        console.log("AuthChecker error: " + matchResult.error);
        console.log(matchResult.error);
    }
    if (matchResult.error && !ctx.reconnecting) {
        console.log("AuthChecker reconnecting");
        dispatch({reconnecting: true});
    }

    if (!matchResult.loading && matchResult.data) {
        if (ctx.userName === matchResult.data.auth.authenticated) {
            console.log("AuthChecker username equal");
            dispatch({authenticated: matchResult.data.auth.authenticated});
        }
    }
    return null;
}

export const AuthChecker = AuthCheckerSubscription;
