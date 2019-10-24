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

const PASSWORD_MUTATION = gql`
    mutation Password($userName: String! $oldPassword: String! $password1: String! $password2: String!){
    auth {
        password(userName: $userName oldPassword: $oldPassword password1: $password1 password2: $password2)
    }
}`;

export interface PasswordProps {
    open: boolean;
    onClose: () => void;
}

export const Password = (props: PasswordProps) => {
    const [ctx, dispatch] = useStateContext();
    const [userName, setUserName] = useState('');
    const [oldPassword, setOldPassword] = useState('');
    const [password1, setPassword1] = useState('');
    const [password2, setPassword2] = useState('');

    const [register, { error }] = useMutation(
      PASSWORD_MUTATION,
        {
            onCompleted({ auth }) {
                console.log("Token received");
                console.log(auth);
                const token = auth.password;
                localStorage.setItem('token', token);
                dispatch({reauthenticate: {userName, token}});
                onClose();
            },
            fetchPolicy: "no-cache",
        }
    );
    
    const [storedError, setStoredError] = useState<ApolloError | undefined>(undefined);
    if (error && error !== storedError) {
        console.log("Password Error: " + error);
        ctx.sendNotify({message: "Password failed: " + error, variant: "error"});
        setStoredError(error);
    }

    const onClose = () => {
        setPassword1('');
        setPassword2('');
        setOldPassword('');
        props.onClose();
    }

    const onChangeUserName = (event: React.ChangeEvent<HTMLInputElement>) => {
        setUserName(event.target.value);
    };
    const onChangeOldPassword = (event: React.ChangeEvent<HTMLInputElement>) => {
      setOldPassword(event.target.value)
  };
    const onChangePassword1 = (event: React.ChangeEvent<HTMLInputElement>) => {
        setPassword1(event.target.value)
    };
    const onChangePassword2 = (event: React.ChangeEvent<HTMLInputElement>) => {
      setPassword2(event.target.value)
    };

    const onSubbmit = () => {
        register({ variables: {userName, oldPassword, password1, password2}});
    };

    return (
        <Dialog open={props.open} onClose={props.onClose} aria-labelledby="form-dialog-title">
        <DialogTitle id="form-dialog-title">Register</DialogTitle>
        <DialogContent>
          <DialogContentText>
            To change your password, please enter your user name and password's here.
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
            id="oldPassword"
            label="Old Password"
            type="password"
            value={oldPassword}
            onChange={onChangeOldPassword}
            fullWidth
          />
          <TextField
            margin="dense"
            id="password1"
            label="Password"
            type="password"
            value={password1}
            onChange={onChangePassword1}
            fullWidth
          />
          <TextField
            margin="dense"
            id="password2"
            label="Repeat your Password"
            type="password"
            value={password2}
            onChange={onChangePassword2}
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="primary">
            Cancel
          </Button>
          <Button onClick={onSubbmit} color="primary">
            Change Password
          </Button>
        </DialogActions>
      </Dialog>
    )

}