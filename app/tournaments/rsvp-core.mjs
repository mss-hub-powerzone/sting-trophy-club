export async function saveRsvp(db,playerId,selections,revision,answers,at=new Date().toISOString()){
 let changes=0;
 if(revision===0){const result=await db.prepare("INSERT INTO registrations (player_id,selections,updated_by,updated_at,revision,paid_cents,payment_note) VALUES (?,?,?,?,1,0,'') ON CONFLICT(player_id) DO NOTHING").bind(playerId,JSON.stringify(selections),'public-rsvp',at).run();changes=result.meta.changes;}
 else {const result=await db.prepare('UPDATE registrations SET selections=?,updated_by=?,updated_at=?,revision=revision+1 WHERE player_id=? AND revision=?').bind(JSON.stringify(selections),'public-rsvp',at,playerId,revision).run();changes=result.meta.changes;}
 if(!changes)return false;
 await db.prepare('INSERT INTO audit (id,actor,action,detail,at) VALUES (?,?,?,?,?)').bind(crypto.randomUUID(),'public-rsvp','commit',JSON.stringify({player:playerId,answers,selections}),at).run();
 return true;
}
