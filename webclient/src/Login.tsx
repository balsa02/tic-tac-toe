
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

const LOGIN_MUTATION = gql`
    mutation Login($userName: String! $password: String! ){
    auth {
        login(userName: $userName password: $password)
    }
}`;

export interface LoginProps {
    open: boolean;
    onClose: () => void;
}

export const Login = (props: LoginProps) => {
    const [ctx, dispatch] = useStateContext();
    const [userName, setUserName] = useState('');
    const [password, setPassword] = useState('');

    const [login, { loading, error }] = useMutation(
        LOGIN_MUTATION,
        {
            onCompleted({ auth }) {
                console.log("Token received");
                console.log(auth);
                const token = auth.login;
                localStorage.setItem('token', token);
                dispatch({reauthenticate: {userName, token}});
                onClose();
            },
            fetchPolicy: "no-cache",
        }
    );

    const [storedError, setStoredError] = useState<ApolloError | undefined>(undefined);
    if (error && error !== storedError) {
        console.log("Login Error: " + error);
        ctx.sendNotify({message: "Login failed: " + error, variant: "error"});
        setStoredError(error);
    }

    const onClose = () => {
        setPassword('');
        props.onClose();
    }

    const onChangeUserName = (event: React.ChangeEvent<HTMLInputElement>) => {
        setUserName(event.target.value);
    };

    const onChangePassword = (event: React.ChangeEvent<HTMLInputElement>) => {
        setPassword(event.target.value)
    };

    const onSubbmit = () => {
        login({ variables: {userName, password}});
    };

    return (
        <Dialog open={props.open} onClose={props.onClose} aria-labelledby="form-dialog-title">
        <DialogTitle id="form-dialog-title">Login</DialogTitle>
        <DialogContent>
          <DialogContentText>
            To login, please enter your user name and password here.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            id="username"
            label="User Name"
            type="text"
            value={userName}
            onChange={onChangeUserName}
            fullWidth
          />
          <TextField
            margin="dense"
            id="password"
            label="Password"
            type="password"
            value={password}
            onChange={onChangePassword}
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="primary">
            Cancel
          </Button>
          <Button onClick={onSubbmit} color="primary">
            Login
          </Button>
        </DialogActions>
      </Dialog>
    )

}