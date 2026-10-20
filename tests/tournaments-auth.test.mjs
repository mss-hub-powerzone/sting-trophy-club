import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {requestCode,verifyCode,session,sessionCookie,COOKIE,digest} from '../app/tournaments/auth-core.mjs';
import {EVENTS,totalFor,validateSelections,isClosed} from '../app/tournaments/domain.mjs';
function fixture(){
 const sqlite=new DatabaseSync(':memory:');sqlite.exec(readFileSync(new URL('../db/tournaments.sql',import.meta.url),'utf8'));
 const db={prepare(sql){let args=[];const stmt=sqlite.prepare(sql);return {bind(...values){args=values;return this;},async first(){return stmt.get(...args)||null;},async all(){return {results:stmt.all(...args)};},async run(){return {meta:{changes:stmt.run(...args).changes}};}};},async batch(statements){return Promise.all(statements.map(s=>s.run()));}};
 sqlite.prepare('INSERT INTO players VALUES(?,?,?,?,?)').run('one','Player One','u16','1',JSON.stringify(['family@example.com']));
 sqlite.prepare('INSERT INTO players VALUES(?,?,?,?,?)').run('two','Player Two','u17','2',JSON.stringify(['other@example.com']));
 sqlite.prepare('INSERT INTO staff VALUES(?,?)').run('staff@example.com','Manager');
 let sent=[];return {sqlite,db,secret:'test-secret-only-'.repeat(4),send:async(email,code)=>{sent.push({email,code});},sent,now:1000000,ip:'192.0.2.1'};
}
test('all event combinations and Central commitment deadline',()=>{
 for(const team of ['u16','u17']){const events=EVENTS.filter(e=>e.prices[team]!==undefined);assert.equal(events.length,3);for(let mask=0;mask<8;mask++){const selected=events.filter((_,i)=>mask&(1<<i));assert.equal(totalFor(team,selected.map(e=>e.id)),selected.reduce((sum,e)=>sum+e.prices[team],0));}}
 assert.equal(totalFor('u16',['premier','lonestar','snowball']),250);assert.equal(totalFor('u17',['premier','lonestar','jago']),260);
 assert.throws(()=>validateSelections('u16',['jago']));assert.throws(()=>validateSelections('u17',['snowball']));assert.throws(()=>validateSelections('u17',['jago','jago']));
 assert.equal(isClosed(Date.parse('2026-11-01T04:59:59Z')),false);assert.equal(isClosed(Date.parse('2026-11-01T05:00:00Z')),true);
});
test('only roster emails receive codes; response does not disclose membership',async()=>{
 const f=fixture();assert.deepEqual(await requestCode({...f,email:'FAMILY@example.com'}),{ok:true});assert.deepEqual(await requestCode({...f,email:'unknown@example.com'}),{ok:true});assert.equal(f.sent.length,1);
 assert.match(f.sent[0].code,/^\d{8}$/);const row=f.sqlite.prepare('SELECT * FROM auth_challenges').get();assert.notEqual(row.code_hash,f.sent[0].code);assert.equal(row.expires_at,f.now+600);
});
test('code creates isolated session, cannot replay, and logout revokes it',async()=>{
 const f=fixture();await requestCode({...f,email:'family@example.com'});const token=await verifyCode({...f,email:'family@example.com',code:f.sent[0].code});assert.match(token,/^[a-f0-9]{64}$/);
 assert.equal(await verifyCode({...f,email:'family@example.com',code:f.sent[0].code}),null);
 const a=await session(f.db,`${COOKIE}=${token}`,f.now);assert.equal(a.admin,false);assert.deepEqual(a.linked.map(p=>p.id),['one']);
 assert.equal(await session(f.db,`${COOKIE}=bogus`,f.now),null);assert.equal(await session(f.db,`${COOKIE}=${token}`,f.now+7*24*3600),null);
 f.sqlite.prepare('DELETE FROM auth_sessions WHERE hash=?').run(await digest(token));assert.equal(await session(f.db,`${COOKIE}=${token}`,f.now),null);
 assert.match(sessionCookie(token),/HttpOnly; Secure; SameSite=Lax/);assert.match(sessionCookie(token),/Path=\/tournaments;/);
});
test('five wrong guesses lock code; expiry and roster removal block access',async()=>{
 const f=fixture();await requestCode({...f,email:'family@example.com'});const wrong=f.sent[0].code==='00000000'?'11111111':'00000000';for(let i=0;i<5;i++)assert.equal(await verifyCode({...f,email:'family@example.com',code:wrong}),null);
 assert.equal(await verifyCode({...f,email:'family@example.com',code:f.sent[0].code}),null);
 await requestCode({...f,email:'family@example.com',now:f.now+61});assert.equal(await verifyCode({...f,email:'family@example.com',code:f.sent[1].code,now:f.now+662}),null);
 await requestCode({...f,email:'family@example.com',now:f.now+700});const value=await verifyCode({...f,email:'family@example.com',code:f.sent[2].code,now:f.now+700});f.sqlite.prepare('DELETE FROM players WHERE id=?').run('one');assert.equal(await session(f.db,`${COOKIE}=${value}`,f.now+701),null);
});
test('resend cooldown, mail failure cleanup, and staff sessions',async()=>{
 const f=fixture();await requestCode({...f,email:'staff@example.com'});await requestCode({...f,email:'staff@example.com',now:f.now+30});assert.equal(f.sent.length,1);await requestCode({...f,email:'staff@example.com',now:f.now+61});assert.equal(f.sent.length,2);
 const value=await verifyCode({...f,email:'staff@example.com',code:f.sent[1].code,now:f.now+62});assert.equal((await session(f.db,`${COOKIE}=${value}`,f.now+63)).admin,true);
 await assert.rejects(requestCode({...f,email:'other@example.com',send:async()=>{throw Error('mail');}}));assert.equal(f.sqlite.prepare('SELECT * FROM auth_challenges WHERE email=?').get('other@example.com'),undefined);
});
test('request and verification IP limits survive new email addresses',async()=>{
 const f=fixture();for(let i=0;i<20;i++)await requestCode({...f,email:`unknown${i}@example.com`});await requestCode({...f,email:'family@example.com'});assert.equal(f.sent.length,0);
 const g=fixture();await requestCode({...g,email:'family@example.com'});for(let i=0;i<50;i++)await verifyCode({...g,email:'unknown@example.com',code:'00000000'});assert.equal(await verifyCode({...g,email:'family@example.com',code:g.sent[0].code}),null);
});
