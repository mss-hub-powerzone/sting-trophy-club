"use client";
import { useMemo, useState } from "react";

type Event={start:string;end:string;title:string;location:string;team:"U17"|"U16"|"Both";kind:"Game"|"Training"};
type FilterKey="games"|"training"|"n1"|"ecnl"|"classic"|"u17"|"u16";
const marks={n1:"/n1-league.png",ecnl:"/ecnl-rl.png",classic:"/classic-league.png"};
function league(e:Event){if(e.kind==="Training")return "training";if(/Classic/i.test(e.title))return "classic";if(/N1 League/i.test(e.title))return "n1";if(/ECNL|Solar|Nido|Celtic|Vaqueros|DKSC|Spurs/i.test(e.title))return "ecnl";return "friendly"}
function date(raw:string){return new Date(Date.UTC(+raw.slice(0,4),+raw.slice(4,6)-1,+raw.slice(6,8)))}
function time(raw:string){return new Intl.DateTimeFormat("en-US",{hour:"numeric",minute:"2-digit",timeZone:"UTC"}).format(new Date(Date.UTC(+raw.slice(0,4),+raw.slice(4,6)-1,+raw.slice(6,8),+raw.slice(9,11),+raw.slice(11,13))))}

export default function TeamCalendar({events,feeds}:{events:Event[];feeds:readonly (readonly [string,string])[]}){
  const first=events[0]?date(events[0].start):new Date();
  const [month,setMonth]=useState(new Date(Date.UTC(first.getUTCFullYear(),first.getUTCMonth(),1)));
  const [view,setView]=useState<"grid"|"list">("grid");
  const [filters,setFilters]=useState<Record<FilterKey,boolean>>({games:true,training:true,n1:true,ecnl:true,classic:true,u17:true,u16:true});
  const toggle=(key:FilterKey)=>setFilters(x=>({...x,[key]:!x[key]}));
  const filtered=useMemo(()=>events.filter(e=>{
    if(e.kind==="Game"&&!filters.games)return false;if(e.kind==="Training"&&!filters.training)return false;
    const l=league(e);if(l==="n1"&&!filters.n1)return false;if(l==="ecnl"&&!filters.ecnl)return false;if(l==="classic"&&!filters.classic)return false;
    if(e.team==="U17"&&!filters.u17)return false;if(e.team==="U16"&&!filters.u16)return false;if(e.team==="Both"&&!(filters.u17||filters.u16))return false;
    return true;
  }),[events,filters]);
  const monthEvents=filtered.filter(e=>{const d=date(e.start);return d.getUTCMonth()===month.getUTCMonth()&&d.getUTCFullYear()===month.getUTCFullYear()});
  const days=new Date(Date.UTC(month.getUTCFullYear(),month.getUTCMonth()+1,0)).getUTCDate(), offset=month.getUTCDay();
  const move=(n:number)=>setMonth(new Date(Date.UTC(month.getUTCFullYear(),month.getUTCMonth()+n,1)));
  return <div className="calendarApp">
    <div className="filterBar">
      <div className="filterGroup"><small>EVENTS</small><Toggle label="Games" active={filters.games} onClick={()=>toggle("games")}/><Toggle label="Training" active={filters.training} onClick={()=>toggle("training")}/></div>
      <div className="filterGroup leagueFilters"><small>LEAGUES</small><Toggle label="N1" active={filters.n1} onClick={()=>toggle("n1")} img={marks.n1}/><Toggle label="ECNL RL NTX" active={filters.ecnl} onClick={()=>toggle("ecnl")} img={marks.ecnl}/><Toggle label="Classic" active={filters.classic} onClick={()=>toggle("classic")} img={marks.classic}/></div>
      <div className="filterGroup"><small>TEAMS</small><Toggle label="U17" active={filters.u17} onClick={()=>toggle("u17")}/><Toggle label="U16" active={filters.u16} onClick={()=>toggle("u16")}/></div>
    </div>
    <div className="calendarToolbar"><div><button onClick={()=>move(-1)} aria-label="Previous month">←</button><h3>{month.toLocaleDateString("en-US",{month:"long",year:"numeric",timeZone:"UTC"})}</h3><button onClick={()=>move(1)} aria-label="Next month">→</button></div><div className="viewToggle"><button className={view==="grid"?"active":""} onClick={()=>setView("grid")}>Grid</button><button className={view==="list"?"active":""} onClick={()=>setView("list")}>List</button></div></div>
    {view==="grid"?<div className="monthGrid">
      {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d=><div className="dayName" key={d}>{d}</div>)}
      {Array.from({length:offset}).map((_,i)=><div className="dayCell empty" key={"e"+i}/>)}
      {Array.from({length:days}).map((_,i)=>{const day=i+1, evs=monthEvents.filter(e=>date(e.start).getUTCDate()===day);return <div className="dayCell" key={day}><b>{day}</b><div>{evs.map((e,j)=><EventPill event={e} key={e.start+j}/>)}</div></div>})}
    </div>:<div className="compactList">{filtered.map((e,i)=><article key={e.start+i}><div className="compactDate"><b>{date(e.start).toLocaleDateString("en-US",{month:"short",day:"numeric",timeZone:"UTC"})}</b><span>{time(e.start)}</span></div><EventPill event={e} full/></article>)}</div>}
    {!filtered.length&&<p className="calendarEmpty">No events match these filters.</p>}
    <div className="subscribe"><div><b>Keep it on your calendar</b><small>Subscribe to either live TeamSnap feed for automatic updates.</small></div><div className="actions"><a className="btn blue" href={feeds[0][1]}>Subscribe U17</a><a className="btn dark" href={feeds[1][1]}>Subscribe U16</a></div></div>
  </div>
}
function Toggle({label,active,onClick,img}:{label:string;active:boolean;onClick:()=>void;img?:string}){return <button className={"filterToggle "+(active?"active":"")} aria-pressed={active} onClick={onClick}>{img&&<img src={img} alt=""/>}<span>{label}</span><i/></button>}
function EventPill({event,full=false}:{event:Event;full?:boolean}){const l=league(event);return <div className={"eventPill "+l+" "+(full?"full":"")} title={event.location}><span>{event.kind==="Training"?"TRAIN":time(event.start)}</span>{l in marks&&<img src={marks[l as keyof typeof marks]} alt=""/>}<b>{event.title}</b><small>{event.team}{full&&event.location?" • "+event.location:""}</small></div>}
