import {headers} from 'next/headers';
import {env} from 'cloudflare:workers';
import {session} from './auth-core.mjs';
export type Player={id:string;name:string;team:string;jersey:string;emails:string[]};
export function runtime(){return env as unknown as {TOURNAMENTS_DB?:D1Database;TOURNAMENTS_AUTH_SECRET?:string;TOURNAMENTS_EMAIL?:{send(message:unknown):Promise<unknown>};TOURNAMENTS_FROM_EMAIL?:string};}
export function database(){const db=runtime().TOURNAMENTS_DB;if(!db)throw new Error('Registration storage is not connected.');return db;}
export async function getPlayers():Promise<Player[]>{const rows=(await database().prepare('SELECT id,name,team,jersey,emails FROM players').all()).results;return rows.map((p:any)=>({...p,emails:JSON.parse(p.emails)}));}
export async function access():Promise<{admin:boolean;linked:Player[];user:{email:string;displayName:string;userId:string}}|null>{return session(database(),(await headers()).get('cookie'));}
export function cleanPlayer(p:Player){return {id:p.id,name:p.name,team:p.team,jersey:p.jersey};}
export function sameOrigin(req:Request){return req.headers.get('origin')===new URL(req.url).origin;}
export function json(data:unknown,status=200,extra:Record<string,string>={}){return Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...extra}});}
