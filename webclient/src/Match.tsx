import { useEffect, useState } from 'react';
import { useQuery, useMutation } from '@apollo/react-hooks';
import gql from 'graphql-tag';
import * as data from './data';
import { useStateContext } from './ContextProvider';
import ListItem from '@material-ui/core/ListItem';
import React from 'react';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import PlayArrowIcon from '@material-ui/icons/PlayArrow';
import VisibilityIcon from '@material-ui/icons/Visibility';
import InsertEmoticonIcon from '@material-ui/icons/InsertEmoticon';
import { SignIcon } from './Sign';
import { Board } from './Board';
import { Match, SignType } from './data';
import { Inbox } from './Inbox';
import Box from '@material-ui/core/Box';

export const fragments = {
    match: gql`
        fragment MatchFullData on match {
            id
            participants {
                user {
                    userName
                }
                sign
                role
            }
            board
            next {
                user {
                    userName
                }
                sign            
            }
            
            winner {
                user {
                    userName
                }            
            }
        }
        `
}

const MATCH_SUBSCRIPTION = gql`subscription {
    match {
        id
        participants {
            user {
                userName
            }
            sign
            role
        }
        board
        next {
            user {
                userName
            }
            sign            
        }
        winner {
            user {
                userName
            }            
        }
    }
}`;
//    ${fragments.match}

const MATCH_QUERY = gql`{
    match {
        id
        participants {
            user {
                userName
            }
            sign
            role
        }
        board
        next {
            user {
                userName
            }
            sign            
        }
        winner {
            user {
                userName
            }            
        }
    }
}`;

export const useMatch = () => {
    const [ctx, dispatch] = useStateContext();
    const [authenticated, setAuthenticated] = useState(false);
    const [newMatch, setNewMatch] = useState(false);
    // const {subscribeToMore, loading, data, error, refetch}
    const matchResult = useQuery<{match: Match}>(
        MATCH_QUERY,
        {
            notifyOnNetworkStatusChange: true,
            onError: (error) => {
                ctx.sendNotify({message: error.toString(), variant: "error"});
            },
        });
    if (matchResult.error) {
        console.log("useMatch error: " + matchResult.error);
    }
    useEffect(() => {
        console.log("useEffect MATCH_SUBSCRIPTION subscribeToMore called");
        console.log("useEffect has error from useMatch:" + matchResult.error);
        matchResult.subscribeToMore({
            document: MATCH_SUBSCRIPTION,
            updateQuery: (prev, { subscriptionData}) => {
                if (subscriptionData.data) {
                    console.log("MATCH_SUBSCRIPTION");
                    console.log(subscriptionData.data);
                    return subscriptionData.data;
                } else {
                    return prev;
                }
            }
        });
    }, [newMatch, matchResult.error]);

    if (newMatch) {
        setNewMatch(false);
        matchResult.refetch();
    }
    return {...matchResult, setNewMatch};
}

const CREATE_MATCH_MUTATION = gql`
    mutation {
        match_maker {
        create {
            id
        }
    }
}`;

export const useCreateNewMatch = (onNewMatch: () => void) => {
    const [ctx, dispatch] = useStateContext();
    const result = useMutation(
        CREATE_MATCH_MUTATION,
          {
              onCompleted: ({ match_maker }) => {
                  console.log(`match created ${match_maker.create.id}`);
                  onNewMatch();
                  console.log(match_maker);
              },
              onError: (error) => {
                ctx.sendNotify({message: error.toString(), variant: "error"});
              },
              fetchPolicy: "no-cache",
          }
    );
    return result;
}

const MATCH_STEP_MUTATION = gql`
    mutation Step($cell: Int!){
        match {
            step(cell: $cell)
    }
}`;

export const useMatchStep = () => {
    const [ctx, dispatch] = useStateContext();
    const result = useMutation(
        MATCH_STEP_MUTATION,
          {
              onCompleted: ({ match }) => {
                  console.log(`useMatchStep ${match.step}`);
                  console.log(match);
              },
              onError: (error) => {
                ctx.sendNotify({message: error.toString(), variant: "error"});
              },
              fetchPolicy: "no-cache",
          }
    );
    return result;
}

export const MatchBoard = () => {
    const [ctx, dispatch] = useStateContext();
    const [matchStep, matchStepResult] = useMatchStep();
    const matchResult = useMatch();

    const onNewMatch = () => {
        matchResult.setNewMatch(true)
    }
    const [createMatch, createMatchResult] = useCreateNewMatch(onNewMatch);
    const [matchCreated, setMatchCreated] = useState(false);
    const [data, setData] = useState(new Array<SignType>());

    const onCreateMatch = () => {
        createMatch();
        setMatchCreated(true);
    }

    let haveMatch = false;

    if (!matchResult.error && !matchResult.loading && matchResult.data) {
        console.log(matchResult.data);
        if (matchResult.data.match && matchResult.data.match.board) {
            haveMatch = true;
            if (data !== matchResult.data.match.board) {
                setData(matchResult.data.match.board);
            }
        }
    }
    // create a match if we dont have one
    if (!matchResult.error && !matchResult.loading && !haveMatch && !matchCreated) {
        onCreateMatch();
    }

    const onStep = (event: React.MouseEvent<HTMLElement>) => {
        if (event.currentTarget.id) {
            const cell = parseInt(event.currentTarget.id);
            console.log("onStep cell:"+ cell);
            matchStep({variables:{cell}});
            matchResult.refetch();
        }
    };

    return (
        <Box>
        {ctx.authenticated ? <Inbox onJoin={onNewMatch}/> : null}
        <Board onNewGame={onCreateMatch} onClick={onStep} data={data} />
        </Box>
    )
}



export const MatchList = () => {
    const [ctx, dispatch] = useStateContext();
    const matchResult = useMatch();
    const [match, setMatch] = useState<data.Match|null>(null);

    if (!matchResult.error && !matchResult.loading && matchResult.data) {
        if (matchResult.data.match && matchResult.data.match.participants) {
            if (match !== matchResult.data.match) {
                setMatch(matchResult.data.match);
            }
        }
    }

    return (
        <React.Fragment>
        {match &&
            <ListItem key="next">
                    <ListItemIcon>{match.winner ? <InsertEmoticonIcon/> : <PlayArrowIcon/>}</ListItemIcon>
                    <ListItemText primary={match.winner ? match.winner.user.userName :match.next.user.userName} />
            </ListItem>
        }  
        {match && match.participants.map( (participant) => {
            return(
            <ListItem key={"match" + participant.user.userName}>
                <ListItemIcon>{participant.sign ? <SignIcon player={participant.sign}/> : <VisibilityIcon/>}</ListItemIcon>
                <ListItemText primary={participant.user.userName} />
            </ListItem>
            )
        })}
        </React.Fragment>
    )
}