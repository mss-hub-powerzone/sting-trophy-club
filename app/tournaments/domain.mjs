export const EVENTS = [
 {id:'premier',title:'Fall Premier Cup & Showcase',short:'Fall Premier',dates:'November 13–15',month:'NOV',day:'13–15',start:'2026-11-13',end:'2026-11-15',location:'Dallas area, Texas',venue:'Multiple Dallas-area complexes; team field assignments to follow.',type:'Cup + showcase',prices:{u16:80,u17:80},url:'https://tigertournaments.com/tournaments/fall-premier-cup',notes:'Local event. Allow for possible Friday games. Organizer registration closes November 2.',travel:'Family transportation. Final arrival times follow the match schedule.'},
 {id:'lonestar',title:'Lonestar Boys College Showcase',short:'Lonestar / Round Rock',dates:'November 28–29',month:'NOV',day:'28–29',start:'2026-11-28',end:'2026-11-29',location:'Round Rock, Texas',venue:'Round Rock Multipurpose Complex',type:'College showcase',prices:{u16:110,u17:110},url:'https://lonestar-sc.com/tournaments/boys-college-showcase/',notes:'Two games. Thanksgiving weekend. Organizer registration closes November 2; player-profile roster freeze November 18.',travel:'Plan for a two-night stay; exact arrival and departure are pending match times. Family hotel, transportation and meals are additional.'},
 {id:'jago',title:'Gordon Jago Classic Showcase',short:'Jago Showcase',dates:'December 4–6',month:'DEC',day:'4–6',start:'2026-12-04',end:'2026-12-06',location:'North Texas • venue to confirm',venue:'Venue and field assignments to be confirmed.',type:'College showcase',prices:{u17:70},url:'https://jagoshowcase.com/tournament/',notes:'Proposed for U17. Final team entry and acceptance are pending.',travel:'Travel details will follow confirmed venue and schedule.'},
 {id:'snowball',title:'NTX Celtic Snowball Cup',short:'Snowball Cup',dates:'December 11–13',month:'DEC',day:'11–13',start:'2026-12-11',end:'2026-12-13',location:'North Texas • fields to confirm',venue:'Complex and team field assignments to be confirmed.',type:'Tournament',prices:{u16:60},url:'https://www.ntxceltictournaments.com/',notes:'Proposed for U16. Final team entry and acceptance are pending.',travel:'Travel details will follow confirmed venue and schedule.'},
];
const DETAILS = {
 premier:{
  venue:'Dallas-area venues · see the full list below.',
  venues:['University of Texas Dallas','Railroad Park','Lake Park','Chinn Chapel Soccer Complex','Bakersfield Soccer Complex','The Athletic Club'],
  recruiting:'U15–U19 showcase play is advertised for college exposure. A specific 2026 attending-college list has not been verified; the organizer also offers a separate Friday ID camp.',
  recruitingUrl:'https://tigertournaments.com/id-camps',recruitingLink:'College exposure & ID camp information',
  clinic:{title:'Fall Showcase ID Camp',date:'Friday, November 13, 2026',details:'UTD Soccer Complex, Richardson · Check-in 5:30 p.m.; camp 6–9 p.m. Central. Attending schools and price are announced through camp registration.',fee:'Separate player registration; camp fee is additional.',url:'https://tigertournaments.leagueapps.com/camps/5082404-2026-fall-showcase-id-camp',link:'ID camp details & registration'},
 },
 lonestar:{
  venue:'Round Rock Multipurpose Complex',venues:['Round Rock Multipurpose Complex'],
  recruiting:'College-coach recruiting showcase with player-profile books. The organizer’s linked attending-college list is from 2025; it is historical, not a confirmed 2026 attendance list.',
  recruitingUrl:'https://lonestar-sc.com/tournaments/boys-college-showcase/',recruitingLink:'Organizer’s college-coach information',
  clinic:{title:'Boys College ID Clinic',date:'Friday, November 27, 2026',details:'The organizer lists a boys ID clinic, including a goalkeeping session. Final times, location, fees and registration details are to be confirmed.',fee:'Optional individual add-on; any clinic fee is additional.',url:'https://lonestar-sc.com/programs/college-id/',link:'College ID clinic announcements'},
  travel:'Plan for two nights; exact arrival and departure depend on match times. This is a stay-to-play event: teams traveling more than 80 miles must arrange hotels through the organizer’s Anthony Travel / On Location program. Family hotel, transportation and meals are additional.',
 },
 jago:{
  dates:'December 5–6',day:'5–6',start:'2026-12-05',location:'Dallas / Richardson, Texas',
  venue:'Richland College & UT Dallas · team field assignments pending.',venues:['Richland College / Dallas College Richland Campus','University of Texas Dallas (UTD), Richardson'],
  notes:'Proposed for U17. Organizer lists tournament play December 5–6, with an optional college ID clinic Friday, December 4. Team entry and acceptance remain pending.',
  travel:'Local venues at Richland and UTD. Final match times and team field assignments will follow the organizer’s schedule.',
  recruiting:'College showcase with a separate Friday ID clinic led by college recruiting coaches. Specific participating schools should be checked against the organizer’s current announcements.',
  recruitingUrl:'https://www.ccsai.org/page/show/8047761-gordon-jago-classic-showcase',recruitingLink:'Classic League showcase & recruiting information',
  clinic:{title:'Jago College ID Clinic',date:'Friday, December 4, 2026',details:'College recruiting coaches lead the clinic. The Classic League organizer lists U15–U19 eligibility and a $175 individual registration fee; confirm session times and clinic venue with the organizer.',fee:'$175 per player, paid separately to the organizer. Not included in the $70 team registration.',url:'https://jagoshowcase.com/id-clinic/',link:'Clinic details & registration'},
 },
 snowball:{
  location:'North Texas · multiple venues',venue:'Nine North Texas venues · see the full list below.',
  venues:['Meadowmere Park','Oak Grove Park','PIT+ Plano','Southwood Sports Complex','Corinth Community Park','Bob Jones Soccer Fields','The Athletic Club','Fairview Soccer Park','Cotton Bowl Stadium'],
  travel:'North Texas event across multiple complexes. Team field assignments and match times are pending; use the final schedule to plan travel.',
  recruiting:'Competition-focused tournament. No college-coach attendance list or event-linked college ID clinic was found in the organizer’s published information checked for this plan.',
  recruitingUrl:'https://www.ntxceltictournaments.com/Default.aspx?tabid=992699',recruitingLink:'Official tournament information',clinic:null,
 },
};
// Content updates do not alter event IDs or per-player team registration prices.
for (const event of EVENTS) Object.assign(event, DETAILS[event.id]);
export const TEAM_NAMES={u16:'11 Brave Barber · U16',u17:'10 Barber · U17'};
export const COMMIT_CLOSE='2026-11-01T05:00:00.000Z';
export function isClosed(now=Date.now()){return now>=Date.parse(COMMIT_CLOSE);}
export function validateSelections(team,ids){
 if(!Array.isArray(ids)||ids.length>3||ids.some(id=>typeof id!=='string')||new Set(ids).size!==ids.length)throw new Error('Choose each event only once.');
 if(ids.some(id=>!EVENTS.some(e=>e.id===id&&e.prices[team]!==undefined)))throw new Error('One or more events are unavailable for this team.');
 return EVENTS.filter(e=>ids.includes(e.id)).map(e=>e.id);
}
export function totalFor(team,ids){return validateSelections(team,ids).reduce((sum,id)=>sum+EVENTS.find(e=>e.id===id).prices[team],0);}
export function csvCell(value){let s=String(value??'');if(/^[\s]*[=+@-]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';}
export function validUrl(value){if(!value)return ''; const u=new URL(value);if(u.protocol!=='https:')throw new Error('Use an https booking link.');return u.href;}
