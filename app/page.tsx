const leagues = [
  [
    "U17",
    "N1 National League",
    "https://system.gotsport.com/org_event/events/54028/schedules?team=4051549",
    "/n1-league.png",
  ],
  [
    "U17 + U16",
    "Classic League D2",
    "https://system.gotsport.com/org_event/events/55473/schedules?team=4248184",
    "/classic-league.png",
  ],
  [
    "U16",
    "ECNL RL North Texas",
    "https://app.athleteone.com/public/event/4352/schedules-standings/team/134535/41524",
    "/ecnl-rl.png",
  ],
];
type Team = "U17" | "U16" | "Both";
type CalEvent = { start: string; end: string; title: string; location: string; team: Team; kind: "Game" | "Training" };
const feeds = [
  ["U17" as const, "https://ical-cdn.teamsnap.com/team_schedule/b166e5d6-8fc7-4dee-be9a-57bc0de9f2ce.ics"],
  ["U16" as const, "https://ical-cdn.teamsnap.com/team_schedule/caff0e39-1b73-4578-97b0-356e66824af4.ics"],
];
const classicFallback:CalEvent[] = [
  {start:"20260912T080000",end:"20260912T100000",title:"Classic League • vs NTX Celtic FC South 2009/10B Epps",location:"Richland College",team:"U17",kind:"Game"},
  {start:"20260914T201500",end:"20260914T221500",title:"Classic League • vs Aztecas Elite SC 2009/10B Tavera",location:"JJ Pearce High School",team:"U17",kind:"Game"},
  {start:"20260930T201500",end:"20260930T221500",title:"Classic League • vs Atletico Dallas Youth DFW-C 2009/10B Challinor",location:"Richland College",team:"U17",kind:"Game"},
  {start:"20261004T080000",end:"20261004T100000",title:"Classic League • vs Dallas Roma FC 2009/10B Beta D. Schell",location:"Richland College",team:"U17",kind:"Game"},
  {start:"20261011T100000",end:"20261011T120000",title:"Classic League • vs Coppell FC 2010/11B Stricker Red",location:"Richland College",team:"U17",kind:"Game"},
];
function field(block:string,key:string){const line=block.split("\n").find(x=>x.startsWith(key));return line?.slice(line.indexOf(":")+1).replace(/\\,/g,",").replace(/\\n/g,", ")||""}
function shortTitle(s:string){
  return s.replace(/^Sting N1 B2009\/10 Barber \(U17\)\s*/,"").replace(/^Sting ECNL RL NTX B2010\/11 Brave Barber \(U16\)\s*/,"").replace(/^[- ]+/,"").replace(/Classic League\s*/,"Classic League • ");
}
function parseIcs(raw:string,team:Team):CalEvent[]{
  const text=raw.replace(/\r?\n[ \t]/g,"");
  return [...text.matchAll(/BEGIN:VEVENT([\s\S]*?)END:VEVENT/g)].map(m=>{
    const title=field(m[1],"SUMMARY");
    return {start:field(m[1],"DTSTART"),end:field(m[1],"DTEND"),title:shortTitle(title),location:field(m[1],"LOCATION"),team,kind:/Training/i.test(title)?"Training":"Game"};
  }).filter(e=>e.start && !/CANCELED/i.test(e.title));
}
function opponentWords(title:string){const stop=new Set(["sting","classic","league","ecnl","ntx","boys","barber","friendly","team","game","red","blue","white","youth"]);return new Set(title.toLowerCase().match(/[a-z]{4,}/g)?.filter(x=>!stop.has(x))||[])}
function mergeEvents(events:CalEvent[]){
  const sorted=events.sort((a,b)=>a.start.localeCompare(b.start)), out:CalEvent[]=[];
  for(const e of sorted){
    if(e.kind==="Game"){const words=opponentWords(e.title);const match=out.find(x=>x.kind==="Game"&&x.team!==e.team&&x.start.slice(0,8)===e.start.slice(0,8)&&[...words].some(w=>opponentWords(x.title).has(w)));if(match){match.team="Both";continue}}
    out.push(e);
  }
  return out;
}
async function getCalendar(){
  const results=await Promise.all(feeds.map(async([team,url])=>{try{return parseIcs(await (await fetch(url,{cache:"no-store",signal:AbortSignal.timeout(5000)})).text(),team)}catch{return []}}));
  const today=new Date().toISOString().slice(0,10).replaceAll("-","");
  const live=results.flat();
  const saved:CalEvent[]=[...calendarData.map(([start,end,title,location,team,kind])=>({start,end,title,location,team,kind})),...classicFallback];
  return (live.length?mergeEvents(live):saved).filter(e=>e.start.slice(0,8)>=today);
}
function dateParts(raw:string){const y=+raw.slice(0,4),m=+raw.slice(4,6),d=+raw.slice(6,8);const date=new Date(Date.UTC(y,m-1,d));const time=raw.length>8?new Intl.DateTimeFormat("en-US",{hour:"numeric",minute:"2-digit",timeZone:"UTC"}).format(new Date(Date.UTC(y,m-1,d,+raw.slice(9,11),+raw.slice(11,13)))):"All day";return {month:new Intl.DateTimeFormat("en-US",{month:"short",timeZone:"UTC"}).format(date),day:d,weekday:new Intl.DateTimeFormat("en-US",{weekday:"short",timeZone:"UTC"}).format(date),time}}
const Arrow = () => <span aria-hidden>↗</span>;
export default async function Home() {
  const calendar=await getCalendar();
  return (
    <main>
      <header>
        <nav className="shell">
          <a className="brand" href="#top">
            <img src="/sting-full-color.png" alt="Sting Soccer shield" />
            <span>
              <b>STING</b>
              <small>TROPHY CLUB BOYS</small>
            </span>
          </a>
          <div className="navlinks">
            <a href="#teams">Teams</a>
            <a href="#identity">Our Club</a>
            <a href="#calendar">Calendar</a><a href="#media">Media</a>
            <a href="#location">Home Field</a>
          </div>
          <div className="navActions">
            <a className="playerLogin" href="https://stingsoccer.fctrclubmgmt.com/" target="_blank" rel="noreferrer">Player login</a>
            <a className="navcta" href="#schedule">Find a match</a>
          </div>
        </nav>
      </header>
      <section className="hero" id="top">
        <div className="shell heroStack">
          <div className="heroPhoto">
            <img
              className="heroTeamPhoto"
              src="/msu-preseason-camp-team.webp"
              alt="Sting Trophy Club U17 and U16 boys with Coach Meachum at Midwestern State University preseason camp"
            />
            <div className="heroPhotoShade" />
            <img className="heroCornerShield" src="/sting-full-color.png" alt="" />
            <div className="tag">
              <span>THE BOYS • COACH MEACHUM • MSU PRESEASON CAMP</span>
              <b>#VAMOS</b>
            </div>
          </div>
          <div className="heroIntro">
            <div>
            <p className="eyebrow">TROPHY CLUB, TEXAS • 2026/27</p>
            <h1>
              PRIDE.
              <br />
              TRADITION.
              <br />
              <em>THE STING WAY.</em>
            </h1>
            </div>
            <div className="heroCopy">
            <p className="lede">
              Sting Trophy Club U17 & U16 boys—one player pool carrying a proud
              North Texas tradition forward through work, trust and football
              played the right way.
            </p>
            <div className="actions">
              <a className="btn blue" href="#schedule">
                View schedules <Arrow />
              </a>
              <a className="btn outline" href="#media">
                See the team
              </a>
            </div>
          </div>
          </div>
        </div>
      </section>
      <div className="ticker">
        BUILD FROM THE BACK　◆　PLAY FOR EACH OTHER　◆　90 MINUTES　◆　TROPHY
        CLUB　◆　#VAMOS
      </div>
      <section className="section shell" id="teams">
        <Title
          kicker="OUR PROGRAM"
          title="Two teams. One identity."
          copy="Competitive pathways connected by one player pool and one clear style of play."
        />
        <div className="teams">
          <Team
            number="17"
            title="U17 Boys"
            items={["N1 National League", "Classic League D2"]}
          />
          <Team
            number="16"
            title="U16 Boys"
            items={["ECNL RL North Texas", "Classic League player pool"]}
            alt
          />
        </div>
      </section>
      <section className="identity" id="identity">
        <div className="shell identityGrid">
          <div className="clubGraphic">
            <img src="/sting-north-texas-club.webp" alt="Sting North Texas home, away and goalkeeper kits" />
            <b>PRIDE & TRADITION • SINCE 1973</b>
          </div>
          <div>
            <p className="eyebrow">OUR STING DNA</p>
            <h2>
              Born in North Texas.
              <br />
              Built to keep improving.
            </h2>
            <p>
              North Texas is where Sting began and where the club’s philosophy
              was born. In Trophy Club, we carry that tradition forward with a
              developmental mindset, competitive pursuit and the expectation
              that every player and every team keeps improving.
            </p>
            <div className="interestActions">
              <a className="btn blue" href="https://tinyurl.com/StingTrophyClub" target="_blank" rel="noreferrer">
                U16/U17 Player Interest <Arrow />
              </a>
              <a className="btn dark" href="https://stingsoccer.jotform.com/253006701955858" target="_blank" rel="noreferrer">
                Clubwide Player Interest <Arrow />
              </a>
            </div>
            <a className="textLink" href="https://northtexas.stingsoccer.com/" target="_blank" rel="noreferrer">
              Explore Sting North Texas <Arrow />
            </a>
          </div>
        </div>
      </section>
  <section className="schedule" id="schedule">
        <div className="shell">
          <Title
            kicker="MATCH CENTER"
            title="Find our next match."
            copy="Schedules, venues, scores and standings are maintained by each league."
            light
          />
          <div className="leagues">
            {leagues.map(([age, name, url, logo]) => (
              <a href={url} target="_blank" rel="noreferrer" key={name}>
                <span>{age}</span>
                <img className="leagueLogo" src={logo} alt="" />
                <div>
                  <b>{name}</b>
                  <small>Official schedule, results & standings</small>
                </div>
                <i>
                  <Arrow />
                </i>
              </a>
            ))}
          </div>
        </div>
  </section>
      <section className="calendarSection" id="calendar">
        <div className="shell">
          <Title kicker="TEAM CALENDAR" title="What’s ahead." copy="Turn categories on or off, combine filters, and switch between a month grid and full list."/>
          <TeamCalendar events={calendar} feeds={feeds} />
        </div>
      </section>
      <section className="section shell" id="media">
        <Title
          kicker="LATEST FROM THE BOYS"
          title="Matchdays. Moments. Memories."
          copy="Follow along for team news, scores, photos and video."
        />
        <div className="socials">
          <a
            href="https://www.instagram.com/stingsoccer_trophy_club_u17b"
            target="_blank"
            rel="noreferrer"
          >
            Instagram <Arrow />
          </a>
          <a
            href="https://www.facebook.com/stingsoccertrophyclubu17boys"
            target="_blank"
            rel="noreferrer"
          >
            Facebook <Arrow />
          </a>
        </div>
        <div className="socialPreview">
          <article><div className="socialLabel"><span>U17 • CLASSIC LEAGUE</span><b>3–2 COMEBACK • #VAMOS</b></div><iframe title="U17 3-2 comeback on Instagram" src="https://www.instagram.com/p/DcELok8uBE8/embed/captioned/" loading="lazy"/></article>
          <article><div className="socialLabel"><span>U16 • TEAM UPDATES</span><b>STING TROPHY CLUB</b></div><iframe title="Latest Sting Trophy Club Facebook posts" src="https://www.facebook.com/plugins/page.php?href=https%3A%2F%2Fwww.facebook.com%2Fstingsoccertrophyclubu17boys&tabs=timeline&width=500&height=600&small_header=true&adapt_container_width=true&hide_cover=false&show_facepile=false" loading="lazy"/></article>
        </div>
      </section>
      <section className="watch" id="watch">
        <div className="shell watchGrid">
          <div>
            <img className="reeWordmark" src="/reeplayer-wordmark.png" alt="Reeplayer" />
            <p className="eyebrow">WATCH THE BOYS</p>
            <h2>Every match. Every moment.</h2>
            <p>
              Reeplayer’s AI soccer camera records and processes our matches for
              full-match video, live broadcasts, instant playback, highlights and
              player clips—giving families and players another way to follow the boys.
            </p>
            <div className="actions">
              <a className="btn reeRed" href="https://link.reeplayer.com/8EOFB5GhG5b" target="_blank" rel="noreferrer">Watch U17 <Arrow/></a>
              <a className="btn outline" href="https://link.reeplayer.com/hjjQHK7vG5b" target="_blank" rel="noreferrer">Watch U16 <Arrow/></a>
              <a className="btn outline" href="https://www.reeplayer.com/" target="_blank" rel="noreferrer">About Reeplayer <Arrow/></a>
            </div>
          </div>
          <div className="reeVisual">
            <img className="reeMark" src="/reeplayer-mark.png" alt="" />
            <img className="reeCamera" src="/reeplayer-camera.webp" alt="Red Reeplayer AI soccer camera" />
            <span>AI-POWERED MATCH VIDEO</span>
          </div>
        </div>
      </section>
      <section className="location" id="location">
        <div className="shell locationGrid">
          <div>
            <p className="eyebrow">OUR HOME GROUND</p>
            <h2>Trophy Club.</h2>
            <p>
              301 Trophy Lake Drive
              <br />
              Trophy Club, TX
            </p>
            <small>Fields located behind Starbucks</small>
            <div className="trainingDetails">
              <span><b>FIELDS</b> 1 & 2</span>
              <span><b>TRAINING</b> Tuesday & Thursday</span>
              <span><b>TIME</b> 7:30–9:00 PM</span>
            </div>
            <a
              className="btn blue"
              href="https://www.google.com/maps/search/?api=1&query=301+Trophy+Lake+Dr+Trophy+Club+TX"
              target="_blank"
              rel="noreferrer"
            >
              Get directions <Arrow />
            </a>
          </div>
          <a className="fieldMap" href="/trophy-club-field-map.webp" target="_blank" rel="noreferrer">
            <img src="/trophy-club-field-map.webp" alt="Trophy Club field map and facility rules, with Sting Trophy Club training on Fields 1 and 2"/>
            <span>Open full field map <Arrow /></span>
          </a>
        </div>
      </section>
      <section className="leadership section shell" id="leadership">
        <Title kicker="TEAM LEADERSHIP" title="The people behind the teams." copy="A home for coach bios, team-manager contacts and the volunteers who keep both teams moving." />
        <div className="coachGrid">
          <article className="coachCard hasPhoto jonPhoto"><img src="/coach-jon-barber.png" alt="Coach Jon Barber"/><div><small>U17 HEAD COACH • U16 ASSISTANT</small><h3>Coach Jon Barber</h3><p>Coach bio, playing philosophy and contact details coming soon.</p></div></article>
          <article className="coachCard alt hasPhoto"><img src="/coach-wayne-smith.webp" alt="Coach Wayne Smith"/><div><small>U16 HEAD COACH</small><h3>Coach Wayne Smith</h3><p>Coach bio, playing philosophy and contact details coming soon.</p></div></article>
        </div>
        <div className="teamSupport">
          <article><b>TEAM MANAGERS</b><p>Manager names, responsibilities and best contact routes can live here.</p><span>SECTION RESERVED</span></article>
          <article><b>FUNDRAISING</b><p>Current campaigns, deadlines, progress and supporter links can live here.</p><span>SECTION RESERVED</span></article>
        </div>
      </section>
      <section className="equipmentPartner">
        <div className="shell partnerGrid">
          <div className="partnerLogo"><img src="/soccer-innovations.png" alt="Soccer Innovations, 20 years in business" /></div>
          <div>
            <p className="eyebrow">OFFICIAL EQUIPMENT SUPPORTER</p>
            <h2>Equipping Sting to train the right way.</h2>
            <p>Soccer Innovations supports Sting Soccer Club with the everyday equipment that keeps sessions moving—from soccer balls and goals to pinnies, cones and other essential training gear.</p>
            <a className="btn blue" href="https://soccerinnovations.com/" target="_blank" rel="noreferrer">Visit Soccer Innovations <Arrow/></a>
          </div>
        </div>
      </section>
      <section className="resourceHub">
        <div className="shell">
          <Title kicker="TEAM RESOURCES" title="Your Sting one-stop shop." copy="The most-used club, team and player links in one dependable place." light />
          <div className="resourceGrid">
            <a href="https://stingsoccer.fctrclubmgmt.com/" target="_blank" rel="noreferrer"><span>01</span><b>Player Account</b><small>Registration, club information and player access</small><i><Arrow/></i></a>
            <a href="https://apps.apple.com/us/app/sting-sc/id6787877255" target="_blank" rel="noreferrer"><span>02</span><b>Sting SC App</b><small>Download for iPhone and iPad on the App Store</small><i><Arrow/></i></a>
            <a href="https://tinyurl.com/StingTrophyClub" target="_blank" rel="noreferrer"><span>03</span><b>Join U16/U17</b><small>Interest form for the Trophy Club boys teams</small><i><Arrow/></i></a>
            <a href="https://stingsoccer.jotform.com/253006701955858" target="_blank" rel="noreferrer"><span>04</span><b>Join Sting</b><small>Clubwide new-player interest form</small><i><Arrow/></i></a>
          </div>
        </div>
      </section>
      <footer>
        <div className="shell foot">
          <a className="brand" href="#top">
            <img src="/sting-full-color.png" alt="Sting Soccer shield" />
            <span>
              <b>STING</b>
              <small>TROPHY CLUB BOYS</small>
            </span>
          </a>
          <p>
            U17 & U16 Boys • Trophy Club, Texas
            <br />
            Coach Jon Barber • Coach Wayne Smith
          </p>
          <div>
            <a href="https://stingsoccer.fctrclubmgmt.com/">Player Login</a>
            　
            <a href="https://apps.apple.com/us/app/sting-sc/id6787877255">Sting SC App</a>
            <br />
            <a href="https://www.instagram.com/stingsoccer_trophy_club_u17b">
              Instagram
            </a>
            　
            <a href="https://www.facebook.com/stingsoccertrophyclubu17boys">
              Facebook
            </a>
          </div>
        </div>
        <div className="shell last">
          <span>© 2026 Sting Trophy Club Boys</span>
          <b>#VAMOS</b>
        </div>
      </footer>
    </main>
  );
}
function Title({
  kicker,
  title,
  copy,
  light = false,
}: {
  kicker: string;
  title: string;
  copy: string;
  light?: boolean;
}) {
  return (
    <div className={"title " + (light ? "light" : "")}>
      <div>
        <p className="eyebrow">{kicker}</p>
        <h2>{title}</h2>
      </div>
      <p>{copy}</p>
    </div>
  );
}
function Team({
  number,
  title,
  items,
  alt = false,
}: {
  number: string;
  title: string;
  items: string[];
  alt?: boolean;
}) {
  return (
    <article className={"team " + (alt ? "alt" : "")}>
      <span>{number}</span>
      <div>
        <p>STING TROPHY CLUB</p>
        <h3>{title}</h3>
        {items.map((x) => (
          <small key={x}>• {x}</small>
        ))}
      </div>
    </article>
  );
}
import { calendarData } from "./calendar-data";
import TeamCalendar from "./team-calendar";
