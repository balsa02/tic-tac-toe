import Box from "@material-ui/core/Box";
import React, { useState } from "react";
import Menu from "@material-ui/core/Menu";
import MenuItem from "@material-ui/core/MenuItem";
import { useStateContext } from "./ContextProvider";
import gql from "graphql-tag";
import { useMutation } from "@apollo/react-hooks";
import { ApolloError } from "apollo-client/errors/ApolloError";

const INVITE_MUTATION = gql`
    mutation Invite($userName: String! $role: ParticipantRole! ){
    match_maker {
        invite(userName: $userName role: $role)
    }
}`;

export interface InviteProps {
    open: boolean;
    userName: string;
    onClose: () => void;
    anchorEl: HTMLElement | null;
}

export const Invite = (props: InviteProps) => {
    const [ctx, dispatch] = useStateContext();
    const [storedError, setStoredError] = useState<ApolloError | undefined>(undefined);

    const [invite, { loading, error }] = useMutation(
        INVITE_MUTATION,
        {
            onCompleted({ match_maker }) {
                console.log("Token received");
                console.log(match_maker);
                const token = match_maker.invite;
                ctx.sendNotify({message: "Invite sent", variant: "success"});
                // props.onClose();
            },
            fetchPolicy: "no-cache",
        }
    );

    if (error && error !== storedError) {
        console.log("Invite Error: " + error);
        ctx.sendNotify({message: "Invite failed: " + error, variant: "error"});
        setStoredError(error);
    }

    const handleAsPlayer = () => {
        invite({ variables: {userName: props.userName, role: "Player"}});
    }
    const handleAsSpectator = () => {
        invite({ variables: {userName: props.userName, role: "Spectator"}});
    }

    return (
        <Box position="absolute" right='20px'>
            <Menu
                id={"menu-appbar-"+props.userName}
                anchorEl={props.anchorEl}
                anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
                }}
                open={props.open}
                onClose={props.onClose}
            >
                <MenuItem onClick={handleAsPlayer}>... as Player</MenuItem>
                <MenuItem onClick={handleAsSpectator}>... as Spectator</MenuItem>
            </Menu>
        </Box>
    )
}