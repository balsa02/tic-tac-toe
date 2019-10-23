import { useSubscription, useMutation } from "@apollo/react-hooks";
import gql from "graphql-tag";
import { useStateContext } from "./ContextProvider";
import { useState } from "react";
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogActions from '@material-ui/core/DialogActions';
import Button from '@material-ui/core/Button';
import React from 'react';
import { Invite, Ping, Reject } from "./data";

const INBOX_SUBSCRIPTION = gql `
subscription {
    inbox {
        ... on Invite {
            from {userName}
            matchId 
            token
            role
        }
        ... on Ping {
            payload
        }
        ... on Reject {
            from {userName}
            matchId
            role
        }
    }
}`;

export interface InboxProps {
    onJoin: () => void;
}

export const Inbox = (props: InboxProps) => {
    const [ctx, dispatch] = useStateContext();
    const [inviteMsg, setInviteMsg] = useState<Invite|null>(null);
    const joinOpen = Boolean(inviteMsg);

    const subscriptionResult = useSubscription(
        INBOX_SUBSCRIPTION,
        {
            onSubscriptionData: ({subscriptionData}) => {
                if (subscriptionData.data && ! joinOpen) {
                    switch(subscriptionData.data.inbox.__typename) {
                        case "Invite":
                            const invite = subscriptionData.data.inbox as Invite;
                                setInviteMsg(invite);
                            console.log();
                            break;
                        case "Ping":
                            const ping = subscriptionData.data as Ping;
                            console.log("Ping received: " + ping.payload);
                            break;
                        case "Reject":
                                const reject = subscriptionData.data.inbox as Reject;
                                ctx.sendNotify({message: `User: "${reject.from.userName}" rejected your Invite as ${reject.role}`, variant: "info"});
                            break;
                    }
                }                
            }
        }
    );

    if (subscriptionResult.loading) {
        console.log("Inbox loading");
    }
    if (subscriptionResult.error) {
        console.log("Inbox error");
        console.log(subscriptionResult.error);
    }
    console.log("Inbox message accept");
    console.log(subscriptionResult.data);

    const onJoinClose = () => {
        console.log("onJoinClose called");
        setInviteMsg(null);
    }

    return (
        <JoinDialog message={inviteMsg} open={joinOpen} onClose={onJoinClose} onJoin={props.onJoin}/>
    );
}

export const JOIN_MUTATION = gql`
mutation Join($token: String!) {
    match_maker{
        join(token: $token)
    }
}`

export const REJECT_MUTATION = gql`
mutation Reject($token: String!) {
    match_maker{
        reject(token: $token)
    }
}`

export interface RegisterProps {
    open: boolean;
    onClose: () => void;
    onJoin: () => void;
    message: Invite | null;
}

export const JoinDialog = (props: RegisterProps) => {
    const [join, joinResult] = useMutation(
        JOIN_MUTATION,
        {
            onCompleted({ match_maker }) {
                console.log(match_maker);
                const ok = match_maker.join;
                console.log("Join result: " + ok);
                onJoin();
                onClose();
            },
            fetchPolicy: "no-cache",
        }
    );

    const [reject, rejectResult] = useMutation(
        REJECT_MUTATION,
        {
            onCompleted({ match_maker }) {
                console.log(match_maker);
                const ok = match_maker.reject;
                console.log("Reject result: " + ok);
                onClose();
            },
            fetchPolicy: "no-cache",
        }
    );

    const onSubbmit = () => {
        if (props.message) {
            join({ variables: {token: props.message.token}});
        }
    };

    const onCancel = () => {
        if (props.message) {
            reject({ variables: {token: props.message.token}});
        }
    };

    const onClose = () => {
        props.onClose();
    }

    const onJoin = () => {
        props.onJoin();
    }


    return (
        <Dialog open={props.open} onClose={props.onClose} aria-labelledby="form-dialog-title">
        <DialogTitle id="form-dialog-title">Invite</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {props.message && 
            `Accept an Invite from ${props.message.from.userName} to a Match as a ${props.message.role.toString()}?`
            }
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={onCancel} color="primary">
            Cancel
          </Button>
          <Button onClick={onSubbmit} color="primary">
            Ok
          </Button>
        </DialogActions>
      </Dialog>
    )
}