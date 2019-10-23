import Box from "@material-ui/core/Box";
import IconButton from "@material-ui/core/IconButton";
import AccountCircle from '@material-ui/icons/AccountCircle';
import React, { useState } from "react";
import Menu from "@material-ui/core/Menu";
import MenuItem from "@material-ui/core/MenuItem";
import { Login } from "./Login";
import { useStateContext } from "./ContextProvider";
import { AuthChecker } from "./AuthChecker";
import { Register } from "./Register";
import { Signin } from "./Signin";
import { Token } from "./Token";
import { Password } from "./Password";

export const Auth = () => {
    const [ctx, dispatch] = useStateContext();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    const [registerOpen, setRegisterOpen]   = useState(false);
    const [loginOpen, setLoginOpen]         = useState(false);
    const [passwordOpen, setPasswordOpen]   = useState(false);
    const [signinOpen, setSigninOpen]       = useState(false);
    const [tokenOpen, setTokenOpen]         = useState(false);

    const handleClose = () => {
        setAnchorEl(null);
    };
    const handleLogin = () => {
        setLoginOpen(true);
        handleClose();
    }
    const handleRegister = () => {
        setRegisterOpen(true);
        handleClose();
    }
    const handlePassword = () => {
        setPasswordOpen(true);
        handleClose();
    }
    const handleSignin = () => {
        setSigninOpen(true);
        handleClose();
    }
    const handleToken = () => {
        setTokenOpen(true);
        handleClose();
    }
    const handleLoginClose = () => {
        setLoginOpen(false);
    }
    const handleRegisterClose = () => {
        setRegisterOpen(false);
    }
    const handlePasswordClose = () => {
        setPasswordOpen(false);
    }
    const handleSigninClose = () => {
        setSigninOpen(false);
    }
    const handleTokenClose = () => {
        setTokenOpen(false);
    }
    const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
    };

    return (
        <Box position="absolute" right='20px'>
            { ctx.authChech ? <AuthChecker/> : null }
            {ctx.authenticated ? `Hello ${ctx.userName}!` : "Please Login!"}
            <IconButton
                aria-label="account of current user"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleMenu}
                color="inherit"
            >
                <AccountCircle />
            </IconButton>
            <Menu
                id="menu-appbar"
                anchorEl={anchorEl}
                anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
                }}
                open={open}
                onClose={handleClose}
            >
                <MenuItem onClick={handleLogin}>Login</MenuItem>
                <MenuItem onClick={handleRegister}>Register</MenuItem>
                <MenuItem onClick={handlePassword}>Password</MenuItem>
                <MenuItem onClick={handleSignin}>Signin</MenuItem>
                <MenuItem onClick={handleToken}>Token</MenuItem>
            </Menu>
            <Login open={loginOpen} onClose={handleLoginClose}/>
            <Register open={registerOpen} onClose={handleRegisterClose}/>
            <Password open={passwordOpen} onClose={handlePasswordClose}/>
            <Signin open={signinOpen} onClose={handleSigninClose}/>
            <Token open={tokenOpen} onClose={handleTokenClose}/>
        </Box>
    )
}