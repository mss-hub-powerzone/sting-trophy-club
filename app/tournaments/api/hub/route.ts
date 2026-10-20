import {access,database,getPlayers,cleanPlayer,json} from '../../access.server';
import {EVENTS,isClosed} from '../../domain.mjs';
export const dynamic='force-dynamic';
export async function GET(){
 try{
 const a=await access();if(!a)return json({signedIn:false});
 if(!a.admin&&!a.linked.length)return json({signedIn:true,allowed:false,email:a.user.email});
 const db=database(),players=await getPlayers();
 const all=await db.prepare('SELECT player_id, selections FROM registrations').all<{player_id:string,selections:string}>();
 const counts:Record<string,number>={};for(const e of EVENTS)for(const team of Object.keys(e.prices))counts[team+'-'+e.id]=0;
 for(const r of all.results){const p=players.find(p=>p.id===r.player_id);if(p)for(const id of JSON.parse(r.selections))if(counts[p.team+'-'+id]!==undefined)counts[p.team+'-'+id]++;}
 const visible=a.admin?players:a.linked;
 const records=visible.length?(await db.prepare(`SELECT * FROM registrations WHERE player_id IN (${visible.map(()=>'?').join(',')})`).bind(...visible.map(p=>p.id)).all()).results:[];
 const hotel=(await db.prepare("SELECT value FROM settings WHERE key='hotel'").first<{value:string}>())?.value;
 const albums=(await db.prepare("SELECT value FROM settings WHERE key='albums'").first<{value:string}>())?.value;
 return json({signedIn:true,allowed:true,admin:a.admin,email:a.user.email,name:a.user.displayName,players:visible.map(cleanPlayer),linkedIds:a.linked.map(p=>p.id),records:records.map((r:any)=>({...r,selections:JSON.parse(r.selections),updated_by:undefined,payment_note:a.admin?r.payment_note:undefined})),counts,albums:albums?JSON.parse(albums):[],closed:isClosed(),hotel:hotel?JSON.parse(hotel):null});
 }catch(e){console.error('hub read failed',e);return json({error:'Unable to load registrations. Please try again.'},503);}
}
