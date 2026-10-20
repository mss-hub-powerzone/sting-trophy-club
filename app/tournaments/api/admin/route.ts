import {access,database,getPlayers,sameOrigin,json} from '../../access.server';
import {totalFor,csvCell,validUrl,EVENTS} from '../../domain.mjs';
export async function POST(req:Request){
 const raw=await req.text();if(raw.length>16000)return json({error:'Request too large.'},413);
 if(!sameOrigin(req))return json({error:'Refresh before saving.'},403);const a=await access();if(!a?.admin)return json({error:'Staff access required.'},403);
 try{const b:any=JSON.parse(raw),db=database(),players=await getPlayers();if(!b||typeof b!=="object")return json({error:"Invalid request."},400);let action,detail;
 if(b.action==='hotel'){
 const h=b.hotel;if(!h||Object.values(h).some(v=>typeof v!=='string'||v.length>2000))return json({error:'Invalid hotel details.'},400);
 const hotel={name:h.name||'',address:h.address||'',rate:h.rate||'',nights:h.nights||'November 27–29, 2026',deadline:h.deadline||'',code:h.code||'',cancellation:h.cancellation||'',url:validUrl(h.url||''),notes:h.notes||''};
 await db.prepare("INSERT INTO settings (key,value) VALUES ('hotel',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").bind(JSON.stringify(hotel)).run();action='hotel';detail='Room block details updated';
 }else if(b.action==='payment'){
 if(!players.some(p=>p.id===b.playerId)||!Number.isSafeInteger(b.paidCents)||b.paidCents<0||b.paidCents>1000000||typeof b.note!=='string'||b.note.length>500)return json({error:'Enter a valid payment amount and note.'},400);
 const update=await db.prepare('UPDATE registrations SET paid_cents=?,payment_note=? WHERE player_id=?').bind(b.paidCents,b.note,b.playerId).run();
 if(!update.meta.changes)return json({error:'Save a commitment before recording payment.'},400);action='payment';detail=JSON.stringify({player:b.playerId,paidCents:b.paidCents,note:b.note});
 }else return json({error:'Unknown action.'},400);
 await db.prepare('INSERT INTO audit (id,actor,action,detail,at) VALUES (?,?,?,?,?)').bind(crypto.randomUUID(),a.user.userId,action,detail,new Date().toISOString()).run();return json({ok:true});
 }catch(e){console.error('admin update failed',e);return json({error:'Could not save. Check the details and try again.'},400);}
}
export async function GET(){const a=await access();if(!a?.admin)return json({error:'Staff access required.'},403);try{const players=await getPlayers();const rows=(await database().prepare('SELECT * FROM registrations').all()).results as any[];
 const data=[['Team','Player','Event','Registration price','Player total','Paid to date','Player balance','Updated (UTC)'],...players.flatMap(p=>{const r=rows.find(r=>r.player_id===p.id);if(!r)return [[p.team,p.name,'No response','','','','','']];const ids=JSON.parse(r.selections),total=totalFor(p.team,ids);return (ids.length?ids:['']).map((id:string,i:number)=>[p.team,p.name,id?EVENTS.find(e=>e.id===id)?.title:'Not attending',id?(EVENTS.find(e=>e.id===id)?.prices as any)[p.team]:'',i===0?total:'',i===0?r.paid_cents/100:'',i===0?total-r.paid_cents/100:'',r.updated_at]);})];
 return new Response('\uFEFF'+data.map(row=>row.map(csvCell).join(',')).join('\r\n'),{headers:{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename="sting-fall-2026-registrations.csv"','Cache-Control':'no-store'}});
 }catch{return json({error:'Export unavailable. Try again.'},503);}}


