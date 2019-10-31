import * as authprovider from "./authprovider";
import * as lobby from "./lobby";
import * as match from "./match";
import * as matchmaker from "./matchmaker";
import * as sessionmgr from "./sessionmgr";
import * as time from "./time";

export type Config =    authprovider.IConfig &
                        lobby.IConfig &
                        match.IConfig &
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
