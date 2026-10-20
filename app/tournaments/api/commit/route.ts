import {access,database,getPlayers,sameOrigin,json} from '../../access.server';
import {isClosed,validateSelections} from '../../domain.mjs';
export async function POST(req:Request){
 const raw=await req.text();if(raw.length>16000)return json({error:'Request too large.'},413);
 if(!sameOrigin(req))return json({error:'Refresh this page before saving.'},403);
 const a=await access();if(!a)return json({error:'Sign in to save.'},401);
 if(!a.admin&&isClosed())return json({error:'The commitment deadline has passed. Contact a team manager for changes.'},403);
 try{
 const b:any=JSON.parse(raw);if(!b||typeof b!=="object")return json({error:"Invalid request."},400);const players=await getPlayers();const p=players.find(p=>p.id===b.playerId);
 if(!p||(!a.admin&&!a.linked.some(x=>x.id===p.id)))return json({error:'You do not have access to this player.'},403);
 const selections=validateSelections(p.team,b.selections);
 if(!Number.isInteger(b.revision)||b.revision<0)return json({error:'Refresh this page and try again.'},400);
 const db=database(),at=new Date().toISOString();let changed=0;
 if(b.revision===0){const result=await db.prepare("INSERT INTO registrations (player_id,selections,updated_by,updated_at,revision,paid_cents,payment_note) VALUES (?,?,?,?,1,0,'') ON CONFLICT(player_id) DO NOTHING").bind(p.id,JSON.stringify(selections),a.user.userId,at).run();changed=result.meta.changes;}
 else {const result=await db.prepare('UPDATE registrations SET selections=?,updated_by=?,updated_at=?,revision=revision+1 WHERE player_id=? AND revision=?').bind(JSON.stringify(selections),a.user.userId,at,p.id,b.revision).run();changed=result.meta.changes;}
 if(!changed)return json({error:'This commitment changed in another session. Reload to review the latest selections.'},409);
 await db.prepare('INSERT INTO audit (id,actor,action,detail,at) VALUES (?,?,?,?,?)').bind(crypto.randomUUID(),a.user.userId,'commit',JSON.stringify({player:p.id,selections}),at).run();
 return json({ok:true});
 }catch(e){if(e instanceof SyntaxError)return json({error:'Invalid registration.'},400);if(e instanceof Error&&/Choose|unavailable/.test(e.message))return json({error:e.message},400);console.error('commit failed',e);return json({error:'Unable to save. Refresh to check your saved commitment before trying again.'},503);}
}


