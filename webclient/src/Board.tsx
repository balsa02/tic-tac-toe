import Container from "@material-ui/core/Container";
import React from "react";
import Paper from "@material-ui/core/Paper";
import Grid from "@material-ui/core/Grid";
import { Theme, createStyles, makeStyles } from "@material-ui/core/styles";
import Box from "@material-ui/core/Box";
import { SignIcon } from "./Sign";
import Button from "@material-ui/core/Button";
import { SignType } from "./data";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    button: {
        margin: theme.spacing(1),
      },
    input: {
        display: 'none',
    },
    root: {
      flexGrow: 1,
    },
    arc: {
        padding: theme.spacing(1),
        textAlign: 'center',
        color: theme.palette.text.secondary,
        display: 'grid',
        '& > *': {
            gridArea: '1 / 1 / 2 / 2',
        }
    },
  }),
);

export interface BoardProps {
    onNewGame: () => void;
    onClick: (event: React.MouseEvent<HTMLElement>) => void;
    data: SignType[];
}

export const Board = (props: BoardProps) => {
    const classes = useStyles();

    let myData: SignType[];
    
    if (props.data.length < 9) {
        myData = [
            null,   null,   null,
            null,   null,   null,
            null,   null,   null,
        ];
    } else {
        myData = props.data;
    }
    
    return (
        <Container maxWidth="xs" className={classes.root}>
            <Paper>
                <Grid container spacing={0}>
                    {[0,3,6].map((index) => (
                        <Grid container key={index} item xs={12} spacing={0}>
                        {myData.slice(index,index+3).map((sign) => (
                                <Grid item key={index} xs={4}>
                                    <Box id={`${index++}`} border={1} onClick={props.onClick} className={classes.arc}><svg viewBox="0 0 1 1"><SignIcon player={sign}/></svg></Box>
                                </Grid>
                        ))}
                        </Grid>
                    ))}
                </Grid>
            </Paper>
            <Button onClick={props.onNewGame} variant="contained" color="primary" className={classes.button}>
                New Match
            </Button>
        </Container>
    );
}