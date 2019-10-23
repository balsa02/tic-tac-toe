
import { useStateContext } from './ContextProvider';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import TextField from '@material-ui/core/TextField';
import DialogActions from '@material-ui/core/DialogActions';
import Button from '@material-ui/core/Button';
import React from 'react';

export interface TokenProps {
    open: boolean;
    onClose: () => void;
}

export const Token = (props: TokenProps) => {
    const [ctx, dispatch] = useStateContext();

    const onClose = () => {
        props.onClose();
    }

    return (
        <Dialog open={props.open} onClose={props.onClose} aria-labelledby="form-dialog-title">
        <DialogTitle id="form-dialog-title">Token</DialogTitle>
        <DialogContent>
          <DialogContentText>
            You can use this Token to login again without username and password.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            id="token"
            label="Token"
            type="text"
            value={ctx.token}
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="primary">
            Ok
          </Button>
        </DialogActions>
      </Dialog>
    )

}