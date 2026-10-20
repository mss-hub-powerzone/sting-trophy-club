// Runtime-independent email authentication. No client identity headers are trusted.
export const COOKIE='__Secure-sting_tourney_session';
export const SESSION_SECONDS=7*24*60*60;
const enc=new TextEncoder();
const hex=b=>Array.from(new Uint8Array(b),n=>n.toString(16).padStart(2,'0')).join('');
export async function digest(value){return hex(await crypto.subtle.digest('SHA-256',enc.encode(value)));}
export async function keyed(secret,value){
 if(!secret||secret.length<32)throw new Error('Authentication secret is not configured.');
 const key=await crypto.subtle.importKey('raw',enc.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
 return hex(await crypto.subtle.sign('HMAC',key,enc.encode(value)));
}
export function normalizeEmail(value){return typeof value==='string'&&value.length<=254&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())?value.trim().toLowerCase():null;}
export function token(){return hex(crypto.getRandomValues(new Uint8Array(32)));}
export async function directory(db,email){
 const staff=await db.prepare('SELECT name FROM staff WHERE email=?').bind(email).first();
 const rows=(await db.prepare('SELECT id,name,team,jersey,emails FROM players').all()).results;
 const linked=rows.filter(p=>JSON.parse(p.emails).includes(email));
 return {admin:!!staff,linked,name:staff?.name||'Sting family'};
}
async function limit(db,key,max,now){
 const window=Math.floor(now/3600);
 const row=await db.prepare('INSERT INTO auth_rate(key,window,count) VALUES(?,?,1) ON CONFLICT(key) DO UPDATE SET window=excluded.window,count=CASE WHEN auth_rate.window=excluded.window THEN auth_rate.count+1 ELSE 1 END RETURNING count').bind(key,window).first();
 return row.count<=max;
}
export async function requestCode({db,secret,email,ip,send,now=Math.floor(Date.now()/1000)}){
 const normalized=normalizeEmail(email);
 if(!normalized)return {error:'Enter a valid roster email address.',status:400};
 const ipKey=await keyed(secret,'ip:'+ip),emailKey=await keyed(secret,'email:'+normalized);
 if(!await limit(db,'request:'+ipKey,20,now)||!await limit(db,'email:'+emailKey,5,now))return {ok:true};
 const allowed=await directory(db,normalized);
 if(!allowed.admin&&!allowed.linked.length)return {ok:true};
 const random=crypto.getRandomValues(new Uint32Array(1))[0];
 const code=String(random%100000000).padStart(8,'0');
 const codeHash=await keyed(secret,normalized+':'+code);
 const result=await db.prepare('INSERT INTO auth_challenges(email,code_hash,expires_at,attempts,sent_at) VALUES(?,?,?,0,?) ON CONFLICT(email) DO UPDATE SET code_hash=excluded.code_hash,expires_at=excluded.expires_at,attempts=0,sent_at=excluded.sent_at WHERE auth_challenges.sent_at<=?').bind(normalized,codeHash,now+600,now,now-60).run();
 if(!result.meta.changes)return {ok:true};
 try{await send(normalized,code);}catch{
  await db.prepare('DELETE FROM auth_challenges WHERE email=? AND code_hash=?').bind(normalized,codeHash).run();
  throw new Error('Email delivery is temporarily unavailable.');
 }
 return {ok:true};
}
export async function verifyCode({db,secret,email,code,ip,now=Math.floor(Date.now()/1000)}){
 const normalized=normalizeEmail(email);
 if(!normalized||typeof code!=='string'||!/^\d{8}$/.test(code))return null;
 if(!await limit(db,'verify:'+await keyed(secret,'ip:'+ip),50,now))return null;
 // Increment before comparison, atomically, so concurrent guesses cannot bypass the limit.
 const challenge=await db.prepare('UPDATE auth_challenges SET attempts=attempts+1 WHERE email=? AND expires_at>? AND attempts<5 RETURNING code_hash').bind(normalized,now).first();
 if(!challenge||challenge.code_hash!==await keyed(secret,normalized+':'+code))return null;
 const removed=await db.prepare('DELETE FROM auth_challenges WHERE email=? AND code_hash=?').bind(normalized,challenge.code_hash).run();
 if(!removed.meta.changes)return null;
 const allowed=await directory(db,normalized);if(!allowed.admin&&!allowed.linked.length)return null;
 const value=token();
 await db.prepare('INSERT INTO auth_sessions(hash,email,expires_at) VALUES(?,?,?)').bind(await digest(value),normalized,now+SESSION_SECONDS).run();
 // Retain no expired authentication material.
 await db.batch([
  db.prepare('DELETE FROM auth_sessions WHERE expires_at<=?').bind(now),
  db.prepare('DELETE FROM auth_challenges WHERE expires_at<=?').bind(now),
  db.prepare('DELETE FROM auth_rate WHERE window<?').bind(Math.floor(now/3600)-24),
 ]);
 return value;
}
export function cookieValue(header){
 const value=(header||'').split(';').map(p=>p.trim()).find(p=>p.startsWith(COOKIE+'='))?.slice(COOKIE.length+1);
 return value&&/^[a-f0-9]{64}$/.test(value)?value:null;
}
export async function session(db,cookie,now=Math.floor(Date.now()/1000)){
 const value=cookieValue(cookie);if(!value)return null;
 const row=await db.prepare('SELECT email FROM auth_sessions WHERE hash=? AND expires_at>?').bind(await digest(value),now).first();
 if(!row)return null;
 const allowed=await directory(db,row.email);
 if(!allowed.admin&&!allowed.linked.length)return null;
 return {...allowed,user:{email:row.email,displayName:allowed.name,userId:'email:'+await digest(row.email)}};
}
export function sessionCookie(value,maxAge=SESSION_SECONDS){return `${COOKIE}=${value}; Path=/tournaments; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Lax`;}
