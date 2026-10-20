import {database,sameOrigin,json} from '../../../access.server';
import {cookieValue,digest,sessionCookie} from '../../../auth-core.mjs';
export async function POST(req:Request){
 await req.text();if(!sameOrigin(req))return json({error:'Refresh the page before signing out.'},403);
 try{const value=cookieValue(req.headers.get('cookie'));if(value)await database().prepare('DELETE FROM auth_sessions WHERE hash=?').bind(await digest(value)).run();return json({ok:true},200,{'Set-Cookie':sessionCookie('',0)});}catch{return json({error:'Unable to sign out. Please try again.'},503);}
}
