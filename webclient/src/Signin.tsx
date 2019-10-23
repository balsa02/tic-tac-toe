
import { useState } from 'react';
import { useMutation } from '@apollo/react-hooks';
import gql from 'graphql-tag';
import { useStateContext } from './ContextProvider';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import TextField from '@material-ui/core/TextField';
import DialogActions from '@material-ui/core/DialogActions';
import Button from '@material-ui/core/Button';
import React from 'react';
import { ApolloError } from 'apollo-client/errors/ApolloError';

const SIGNIN_MUTATION = gql`
    mutation Signin($token: String!){
    auth {
        signin(token: $token)
    }
}`;

export interface SigninProps {
    open: boolean;
    onClose: () => void;
}

export const Signin = (props: SigninProps) => {
    const [ctx, dispatch] = useStateContext();
    const [token, setToken] = useState('');
    const [tryToken, setTryToken] = useState(true);
    const [callOnSubbmit, setCallOnSubbmit] = useState(false);

    const [signin, { loading, error }] = useMutation(
      SIGNIN_MUTATION,
        {
            onCompleted({ auth }) {
                console.log("user received");
                console.log(auth);
                const userName = auth.signin;
                localStorage.setItem('token', token);
                dispatch({reauthenticate: {userName, token}});
                onClose();
            },
            fetchPolicy: "no-cache",
        }
    );

    const [storedError, setStoredError] = useState<ApolloError | undefined>(undefined);
    if (error && error !== storedError) {
        console.log("Signin Error: " + error);
        ctx.sendNotify({message: "Signin failed: " + error, variant: "error"});
        setStoredError(error);
    }

    const onClose = () => {
      setToken('');
        props.onClose();
    }

    const onChangeToken = (event: React.ChangeEvent<HTMLInputElement>) => {
      setToken(event.target.value);
    };

    const onSubbmit = () => {
      signin({ variables: {token}});
    };

    if (tryToken) {
      const tokenFromBrowser = localStorage.getItem('token');
      if (tokenFromBrowser) {
        console.log("token from browser: " + tokenFromBrowser);
        setToken(tokenFromBrowser);
        setCallOnSubbmit(true);
      }
      setTryToken(false);
    }
    if (callOnSubbmit) {
      setCallOnSubbmit(false);
      onSubbmit();
    }
    return (
        <Dialog open={props.open} onClose={props.onClose} aria-labelledby="form-dialog-title">
        <DialogTitle id="form-dialog-title">Signin</DialogTitle>
        <DialogContent>
          <DialogContentText>
            To login, please enter your Token here.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            id="token"
            label="Token"
            type="text"
            value={token}
            onChange={onChangeToken}
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="primary">
            Cancel
          </Button>
          <Button onClick={onSubbmit} color="primary">
            Signin
          </Button>
        </DialogActions>
      </Dialog>
    )

}