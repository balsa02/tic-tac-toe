
import React, { SyntheticEvent, useState } from 'react';
import clsx from 'clsx';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import ErrorIcon from '@material-ui/icons/Error';
import InfoIcon from '@material-ui/icons/Info';
import CloseIcon from '@material-ui/icons/Close';
import { amber, green } from '@material-ui/core/colors';
import IconButton from '@material-ui/core/IconButton';
import Snackbar from '@material-ui/core/Snackbar';
import SnackbarContent from '@material-ui/core/SnackbarContent';
import WarningIcon from '@material-ui/icons/Warning';
import { makeStyles, Theme } from '@material-ui/core/styles';
import { useStateContext } from './ContextProvider';

const variantIcon = {
    success: CheckCircleIcon,
    warning: WarningIcon,
    error: ErrorIcon,
    info: InfoIcon,
};


export class NotifyMessage {
    message!: string;
    variant!: NotifyVariant;
}

export const NotifyCenter = () => {
    const [ctx, dispatch] = useStateContext();
    const [message, setMessage] = useState<NotifyMessage|null>(null);

    ctx.sendNotify = setMessage;

    const handleClose = (event?: SyntheticEvent, reason?: string) => {
        if (reason === 'clickaway') {
          return;
        }
        setMessage(null);
    };

    return (
        <Snackbar
            anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left',
            }}
            open={message !== null}
            autoHideDuration={6000}
            onClose={handleClose}
        >
            {message && 
            (<MySnackbarContentWrapper
                onClose={handleClose}
                variant={message.variant}
                message={message.message}
            />)}
        </Snackbar>
    );
}

export interface NotifyProps {
    open: boolean;
    onClose: () => void;
    message: string;
    variant: NotifyVariant;
}

export type NotifyVariant = "success" | "error" | "warning" | "info";

const useStyles1 = makeStyles((theme: Theme) => ({
    success: {
      backgroundColor: green[600],
    },
    error: {
      backgroundColor: theme.palette.error.dark,
    },
    info: {
      backgroundColor: theme.palette.primary.main,
    },
    warning: {
      backgroundColor: amber[700],
    },
    icon: {
      fontSize: 20,
    },
    iconVariant: {
      opacity: 0.9,
      marginRight: theme.spacing(1),
    },
    message: {
      display: 'flex',
      alignItems: 'center',
    },
}));

const useStyles2 = makeStyles((theme: Theme) => ({
    margin: {
      margin: theme.spacing(1),
    },
}));

export interface Props {
    className?: string;
    message?: string;
    onClose?: () => void;
    variant: keyof typeof variantIcon;
  }
  
export const MySnackbarContentWrapper = (props: Props) => {
    const classes = useStyles1();
    const { className, message, onClose, variant, ...other } = props;
    const Icon = variantIcon[variant];
  
    return (
      <SnackbarContent
        className={clsx(classes[variant], className)}
        aria-describedby="client-snackbar"
        message={
          <span id="client-snackbar" className={classes.message}>
            <Icon className={clsx(classes.icon, classes.iconVariant)} />
            {message}
          </span>
        }
        action={[
          <IconButton key="close" aria-label="close" color="inherit" onClick={onClose}>
            <CloseIcon className={classes.icon} />
          </IconButton>,
        ]}
        {...other}
      />
    );
  }