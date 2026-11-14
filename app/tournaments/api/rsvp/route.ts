import {saveRsvp} from '../../rsvp-core.mjs';
import {database,sameOrigin,json} from '../../access.server';
import {isClosed,validateAnswers,currentRegistration} from '../../domain.mjs';
export const dynamic='force-dynamic';
export async function GET(req:Request){try{
 const db=database();
 const players=(await db.prepare('SELECT id,name,team FROM players ORDER BY team,name').all()).results;
 const id=new URL(req.url).searchParams.get('playerId');
 if(id&&!players.some(p=>p.id===id))return json({error:'Choose a player from the list.'},400);
 const record=id?await db.prepare('SELECT player_id,selections,revision,updated_at FROM registrations WHERE player_id=?').bind(id).first<any>():null;
 return json({players,record:record?currentRegistration(record):null,closed:isClosed()});
 }catch{return json({error:'Unable to load players. Please try again.'},503);}}
export async function POST(req:Request){
 const raw=await req.text();if(raw.length>4000)return json({error:'Request too large.'},413);
 if(!sameOrigin(req))return json({error:'Refresh this page before saving.'},403);
 if(isClosed())return json({error:'Registration is closed. Contact a team manager.'},403);
 try{
 const body=JSON.parse(raw),db=database();
 if(!body||typeof body.playerId!=='string'||!Number.isSafeInteger(body.revision)||body.revision<0)return json({error:'Choose a player and reload before saving.'},400);
 const player=await db.prepare('SELECT id,team FROM players WHERE id=?').bind(body.playerId).first<any>();
 if(!player)return json({error:'Choose a player from the list.'},400);
 const selections=validateAnswers(player.team,body.answers),at=new Date().toISOString();
 const changed=await saveRsvp(db,player.id,selections,body.revision,body.answers,at);
 if(!changed)return json({error:'This response changed. Select the player again to review the latest answers.'},409);
 return json({ok:true});
 }catch(e){if(e instanceof SyntaxError)return json({error:'Invalid response.'},400);if(e instanceof Error&&/Choose|unavailable/.test(e.message))return json({error:e.message},400);return json({error:'Unable to save. Reload the player to check your response before trying again.'},503);}
}
