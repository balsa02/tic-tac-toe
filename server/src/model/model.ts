import * as authprovider from "./authprovider";
import * as match from "./match";
import * as matchmaker from "./matchmaker";
import * as sessionmgr from "./sessionmgr";
import * as time from "./time";
import * as lobby from "./lobby";

export type Config =    authprovider.IConfig &
                        matchmaker.IConfig &
                        sessionmgr.IConfig;

export type Context =   authprovider.IContext &
                        lobby.IContext  &
                        match.IContext &
                        matchmaker.IContext &
                        sessionmgr.IContext &
                        time.IContext;

export {IContext as AuthContext} from "./authprovider";
export {IContext as LobbyContext} from "./lobby";
export {IContext as MatchContext} from "./match";
export {IContext as MatchMakerContext} from "./matchmaker";
export {IContext as SessionMgrContext} from "./sessionmgr";
export {IContext as TimeContext} from "./time";
