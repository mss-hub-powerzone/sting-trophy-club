// Run only against the dedicated local QA database seeded by setup-qa.mjs.
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import path from 'node:path';
const base='http://127.0.0.1:8791',prefix='/tournaments/api';let checks=0;
function ok(value,message){assert.ok(value,message);checks++;}
async function request(route,{cookie='',method='GET',body,origin=base,headers={}}={}){const r=await fetch(base+prefix+route,{method,headers:{...headers,cookie,...(method==='POST'?{'Content-Type':'application/json',origin}:{})},body:body===undefined?undefined:JSON.stringify(body)});const text=await r.text();let data;try{data=JSON.parse(text);}catch{data=text;}return {status:r.status,data,text,cookie:r.headers.get('set-cookie')};}
ok((await request('/hub')).data.signedIn===false,'anonymous private data hidden');
ok((await request('/hub',{headers:{'oai-authenticated-user-email':'staff@example.com','cf-access-authenticated-user-email':'staff@example.com'}})).data.signedIn===false,'claimed identity headers ignored');
ok((await request('/admin')).status===403,'anonymous CSV denied');
ok((await request('/auth/verify',{method:'POST',origin:'https://evil.example',body:{email:'family@example.com',code:'12345678'}})).status===403,'cross-origin login blocked');
let r=await request('/auth/verify',{method:'POST',body:{email:'family@example.com',code:'12345678'}});ok(r.status===200,'email code verification succeeds');const family=r.cookie.split(';')[0];ok(/HttpOnly; Secure; SameSite=Lax/.test(r.cookie),'secure session cookie');
ok((await request('/auth/verify',{method:'POST',body:{email:'family@example.com',code:'12345678'}})).status===401,'code replay blocked');
r=await request('/hub',{cookie:family});ok(r.data.allowed&&!r.data.admin,'family allowed');ok(r.data.players.length===1&&r.data.players[0].id==='qa-u16','family sees only linked player');ok(!r.text.includes('other@example.com')&&!r.text.includes('QA Player Two')&&!r.data.players[0].emails,'no roster directory leak');ok(r.data.albums.length===2,'protected albums returned');
ok((await request('/admin',{cookie:family})).status===403,'family export denied');
ok((await request('/commit',{cookie:family,method:'POST',body:{playerId:'qa-u17',selections:['premier'],revision:0}})).status===403,'other player write blocked');
ok((await request('/commit',{cookie:family,method:'POST',origin:'https://evil.example',body:{playerId:'qa-u16',selections:['premier'],revision:0}})).status===403,'cross-origin registration blocked');
ok((await request('/commit',{cookie:family,method:'POST',body:{playerId:'qa-u16',selections:['jago'],revision:0}})).status===400,'wrong-team event rejected');
ok((await request('/commit',{cookie:family,method:'POST',body:{playerId:'qa-u16',selections:['premier','lonestar'],revision:0}})).status===200,'registration saved');
ok((await request('/commit',{cookie:family,method:'POST',body:{playerId:'qa-u16',selections:['premier'],revision:0}})).status===409,'duplicate and stale saves blocked');
r=await request('/hub',{cookie:family});ok(r.data.records[0].revision===1&&r.data.counts['u16-premier']===1,'saved values and counts persist');
ok((await request('/admin',{cookie:family,method:'POST',body:{action:'payment',playerId:'qa-u16',paidCents:19000,note:'Private staff note'}})).status===403,'family cannot change payments');
r=await request('/auth/verify',{method:'POST',body:{email:'staff@example.com',code:'12345678'}});ok(r.status===200,'manager login');const manager=r.cookie.split(';')[0];
ok((await request('/admin',{cookie:manager,method:'POST',body:{action:'payment',playerId:'qa-u16',paidCents:19000,note:'Private staff note'}})).status===200,'manager records payment');
ok((await request('/admin',{cookie:manager,method:'POST',body:{action:'hotel',hotel:{name:'QA Hotel',url:'javascript:alert(1)'}}})).status===400,'unsafe hotel link blocked');
ok((await request('/admin',{cookie:manager,method:'POST',body:{action:'hotel',hotel:{name:'QA Hotel',url:'https://example.com/rooms'}}})).status===200,'manager saves hotel block');
r=await request('/hub',{cookie:family});ok(r.data.hotel.name==='QA Hotel'&&r.data.records[0].paid_cents===19000&&!r.text.includes('Private staff note'),'family sees payment and hotel but no internal notes');
r=await request('/admin',{cookie:manager});ok(r.status===200&&r.text.includes('Player balance'),'manager CSV export works');
ok((await request('/auth/logout',{cookie:family,method:'POST'})).status===200,'logout succeeds');ok((await request('/hub',{cookie:family})).data.signedIn===false,'logged-out session revoked');
function files(dir){return readdirSync(dir,{withFileTypes:true}).flatMap(d=>d.isDirectory()?files(path.join(dir,d.name)):[path.join(dir,d.name)]);}
const client=files('dist/client').filter(f=>/\.(js|json|html|map)$/.test(f)).map(f=>readFileSync(f,'utf8')).join('');
ok(!/photos\.app\.goo\.gl|family@example\.com|staff@example\.com|TOURNAMENTS_AUTH_SECRET/.test(client),'no private album links, fixture emails, or auth secret in client');
console.log(`${checks} local registration and privacy checks passed.`);
