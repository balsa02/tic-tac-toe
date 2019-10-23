import { useEffect, useState } from 'react';
import { useQuery } from '@apollo/react-hooks';
import gql from 'graphql-tag';
import * as data from './data';
import { useStateContext } from './ContextProvider';
import List from '@material-ui/core/List';
import CircularProgress from '@material-ui/core/CircularProgress';
import ListItem from '@material-ui/core/ListItem';
import React from 'react';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import MailIcon from '@material-ui/icons/Mail';
import {Invite} from './Invite';
import ClickAwayListener from '@material-ui/core/ClickAwayListener';

const LOBBY_SUBSCRIPTION = gql`subscription {
    lobby {
        list {
            userName
        }
    }
}`;

const LOBBY_QUERY = gql`{
    lobby {
        list {
            userName
        }
    }
}`;


export const Lobby: React.FC = () => {
    const [ctx, dispatch] = useStateContext();
    const [firstRun, setFirstRun] = useState(true);
    const {subscribeToMore, loading, data, error, refetch} = useQuery<{lobby: data.Lobby}>(
        LOBBY_QUERY,
        {
            notifyOnNetworkStatusChange: true,
            onError: (error) => {
                ctx.sendNotify({message: error.toString(), variant: "error"});
            },
        });

    if (error) {
        console.log("useLobby error: " + error);
    }

    useEffect(() => {
        subscribeToMore({
            document: LOBBY_SUBSCRIPTION,
            updateQuery: (prev, { subscriptionData}) => {
                if (subscriptionData.data) {
                    return subscriptionData.data;
                } else {
                    return prev;
                }
            }
        });
    }, [error]);

    if (!loading && !error && firstRun) {
        refetch();
        setFirstRun(false);
    }
    console.log("useLobby called");

    return (
        <List>
        {(loading || !data) ?  <CircularProgress/> : data.lobby.list.map((user, index) => (
          <LobbyItem key={user.userName} userName={user.userName} />
        ))}
      </List>
    )
}

export interface LobbyItemProps {
    key: string;
    userName: string;
}

export const LobbyItem = (props: LobbyItemProps) => {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    const onClose = () => {
        setAnchorEl(null);
    }

    const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    return (
        <ClickAwayListener onClickAway={onClose}>
            <ListItem button key={props.userName}
                onClick={handleMenu}
                aria-controls={"menu-appbar-"+props.userName}
                aria-haspopup="true"
            >
                <Invite open={open} anchorEl={anchorEl} userName={props.userName} onClose={onClose}/>
                <ListItemIcon><MailIcon /></ListItemIcon>
                <ListItemText primary={props.userName} />
            </ListItem>
        </ClickAwayListener>
    );
} 