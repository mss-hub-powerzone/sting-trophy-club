import test from 'node:test';
import assert from 'node:assert/strict';
import {validateInterest,validatePreferences,interestLabel} from '../app/spring-2027/domain.mjs';
test('initial interest accepts Maybe without treating it or earlier Yes as a commitment',()=>{
 const answers=Object.fromEntries(eligibleEvents('u16').map(e=>[e.id,'maybe']));assert.deepEqual(validateInterest('u16',answers),answers);
 assert.throws(()=>validateInterest('u16',{...answers,disney:true}));assert.throws(()=>validateInterest('u16',{}));
 const p={local:'interested',drive:'maybe',fly:'unavailable',weekends:{'2027-05-29':'maybe'},notes:'Hotel costs matter.'};assert.deepEqual(validatePreferences(p),p);
 assert.throws(()=>validatePreferences({...p,fly:''}));assert.throws(()=>validatePreferences({...p,weekends:{'wrong':'maybe'}}));assert.match(interestLabel(true),/not a commitment/);
});
import {EVENTS,ALTERNATIVES,PHOTO_BUDGET,PAYING_PLAYERS,playerPrice,eligibleEvents,validateAnswers,validateGuest,deadlines,eventPrice,coachBudgetFor,gamesFor} from '../app/spring-2027/domain.mjs';
test('travel events include coach expenses and Houston is exactly $110',()=>{
 const houston=EVENTS.find(e=>e.id==='houston');assert.equal(eventPrice(houston),110);assert.equal(coachBudgetFor(houston),595);
 assert.equal(eventPrice(EVENTS.find(e=>e.id==='supercup')),100);
 assert.equal(coachBudgetFor(EVENTS.find(e=>e.id==='wsa')),595);
 assert.equal(eventPrice(EVENTS.find(e=>e.id==='disney'),{entry:1500}),230);
 assert.equal(eventPrice(EVENTS.find(e=>e.id==='disney'),{entry:1500,coachBudget:1700}),210);
 assert.equal(eventPrice(houston,{entry:950,coachBudget:0}),80);
});
test('family deadlines give a week for collection and another week before organizer cutoffs',()=>{
 const expected={disney:['2027-01-20','2027-01-27','2027-02-03'],supercup:['2027-03-05','2027-03-12','2027-03-19'],'dallas-open':['2027-04-11','2027-04-18','2027-04-25'],houston:['2027-04-18','2027-04-25','2027-05-02']};
 for(const [id,dates] of Object.entries(expected)){const d=deadlines(EVENTS.find(e=>e.id===id));assert.deepEqual([d.commit,d.payment,d.cutoff],dates);assert.equal(d.confirmed,true);assert.equal((Date.parse(d.payment)-Date.parse(d.invoice))/86400000,30);}
 for(const e of [...EVENTS,...ALTERNATIVES]){const d=deadlines(e);assert(d.commit&&d.payment&&d.cutoff);assert.equal((Date.parse(d.payment)-Date.parse(d.commit))/86400000,7);assert.equal((Date.parse(d.cutoff)-Date.parse(d.payment))/86400000,7);}
 assert.equal(deadlines(EVENTS.find(e=>e.id==='wsa')).confirmed,false);
 const custom=deadlines(EVENTS[0],{cutoff:'2027-03-01',cutoffConfirmed:true});assert.equal(custom.commit,'2027-02-15');assert.equal(custom.payment,'2027-02-22');assert.equal(custom.confirmed,true);
});
test('player fees include one photo package and always round up across 17 payers',()=>{
 assert.equal(PHOTO_BUDGET,250);assert.equal(PAYING_PLAYERS,17);
 assert.equal(playerPrice(1395),100);assert.equal(playerPrice(950),80);assert.equal(playerPrice(1050),80);assert.equal(playerPrice(825),80);assert.equal(playerPrice(null),null);
 assert.equal(playerPrice(1448),100);assert.equal(playerPrice(1450),100);assert.equal(playerPrice(1450.01),110);
});
test('each team gets four core events and Disney is a single combined U17 option',()=>{
 for(const t of ['u16','u17'])assert.equal(eligibleEvents(t).filter(e=>e.group==='core').length,4);
 const disney=EVENTS.filter(e=>e.id==='disney');assert.equal(disney.length,1);assert.equal(disney[0].combined,true);assert.deepEqual(disney[0].teams,['u16','u17']);
 assert(!eligibleEvents('u16').some(e=>e.id==='houston'));
});
test('responses require explicit booleans for every eligible event, including all No',()=>{
 for(const t of ['u16','u17']){const answers=Object.fromEntries(eligibleEvents(t).map(e=>[e.id,false]));assert.deepEqual(validateAnswers(t,answers),answers);assert.throws(()=>validateAnswers(t,{}));assert.throws(()=>validateAnswers(t,{...answers,unknown:true}));assert.throws(()=>validateAnswers(t,{...answers,disney:'yes'}));}
});
test('guest interest requires parent contact, eligibility details and consent',()=>{
 const body={name:' Guest Player ',parent:' Parent ',email:'PARENT@EXAMPLE.COM',birthDate:'2010-06-15',positions:'GK',club:'Example FC',team:'u17',consent:true,answers:Object.fromEntries(eligibleEvents('u17').map(e=>[e.id,true]))};
 const g=validateGuest(body);assert.equal(g.email,'parent@example.com');assert.equal(g.name,'Guest Player');assert.throws(()=>validateGuest({...body,consent:false}));assert.throws(()=>validateGuest({...body,email:'invalid'}));assert.throws(()=>validateGuest({...body,team:'u19'}));assert.throws(()=>validateGuest({...body,birthDate:'2027-01-01'}));
});

test('every proposal has a rounded placeholder budget and explicit game-count metadata',()=>{for(const e of [...EVENTS,...ALTERNATIVES]){const price=eventPrice(e);assert(price>=80&&price%10===0);const g=gamesFor(e);assert(g&&g.notes);if(g.min!==null&&g.max!==null)assert(g.max>=g.min);}assert.equal(eventPrice(EVENTS.find(e=>e.id==='houston'),{coachCount:2}),150);assert.deepEqual([gamesFor(EVENTS.find(e=>e.id==='houston')).min,gamesFor(EVENTS.find(e=>e.id==='houston')).max],[2,2]);assert.equal(gamesFor(ALTERNATIVES.find(e=>e.id==='classic-challenge')).min,null);});
