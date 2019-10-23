import * as authprovider from "./authprovider";
import * as match from "./match";
import * as matchmaker from "./matchmaker";
import * as sessionmgr from "./sessionmgr";
import * as time from "./time";

export type Config =    authprovider.IConfig &
                        matchmaker.IConfig &
                        sessionmgr.IConfig;

export type Context =   authprovider.IContext &
                        match.IContext &
                        matchmaker.IContext &
                        sessionmgr.IContext &
                        time.IContext;
