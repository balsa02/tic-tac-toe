import React from "react";
import RadioButtonUncheckedIcon from '@material-ui/icons/RadioButtonUnchecked';
import ClearIcon from '@material-ui/icons/Clear';
import { Sign, SignType } from "./data";

export interface SignProps {
    player: SignType;
}

export const SignIcon = (props: SignProps) => {

    switch (props.player) {
        case Sign.X:
          return <ClearIcon width="100%" height="100%"/>; // X
        case Sign.O:
          return <RadioButtonUncheckedIcon width="100%" height="100%"/>; // O
        default:
          return null;
    }
}
