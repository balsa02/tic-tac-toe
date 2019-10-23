import React, {createContext, useContext, useReducer} from 'react';
import { GraphQLClientData } from './GraphQLClient';
import { NotifyMessage } from './Notify';

export class ContextData {
    public authenticated!: boolean;
    public token!: string;
    public userName!: string;
    public client?: GraphQLClientData;
    public authCheckInterval!: number;
    public authChech!: boolean;
    public reconnecting!: boolean;
    public sendNotify!: (msg: NotifyMessage) => void;
}

export class Action {
    authenticated?: string;
    reauthenticate?: {userName: string, token: string};
    reconnecting?: boolean;
}

export const reducer = (ctx: ContextData, action: Action): ContextData => {
    console.log("reducer called");
    console.log(action);
    if (action.reauthenticate) {
        console.log("reducer: reauthenticate");
        ctx.token = action.reauthenticate.token;
        ctx.userName = action.reauthenticate.userName;
        ctx.authChech = true;
        ctx.authenticated = false;
        ctx.reconnecting = false;
    }
    if (action.reconnecting) {
        if (ctx.client) {
            console.log("reducer: reconnecting");
            ctx.reconnecting = true;
            ctx.client.wsClient.close(false);
            // don't event the StateContext hooks
            return ctx;
        }
    }
    if (action.authenticated) {
        ctx.userName = action.authenticated;
        ctx.authenticated = true;
        ctx.authChech = false;
        ctx.reconnecting = false;
    }
    // now let fire the hooks
    contextInstance= Object.assign({}, ctx);
    return contextInstance;
}

export let contextInstance: ContextData = {
    authenticated: false,
    token: "",
    userName: "",
    authCheckInterval: 500,
    reconnecting: false,
    authChech: false,
    sendNotify: (msg: NotifyMessage) => {},
}

export const Context = createContext<[ContextData, React.Dispatch<Action>]>([contextInstance, (action: any) => action]);

interface ContextProviderProps {
    children?: React.ReactNode;
}

export const ContextProvider = (props: ContextProviderProps) => {
    let [state, dispatch] = useReducer(reducer, contextInstance);
    console.log("ContextProvider rerender");
    return (
    <Context.Provider value={[state, dispatch]}>
      {props.children ? props.children : null}
    </Context.Provider>
    );
}

export const useStateContext = () => useContext(Context);