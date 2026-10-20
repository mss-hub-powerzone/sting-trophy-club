import {database,runtime,sameOrigin,json} from '../../../access.server';
import {verifyCode,sessionCookie} from '../../../auth-core.mjs';
export async function POST(req:Request){
 const raw=await req.text();if(raw.length>2048)return json({error:'Request too large.'},413);
 if(!sameOrigin(req))return json({error:'Refresh the page before signing in.'},403);
 try{const b=JSON.parse(raw),secret=runtime().TOURNAMENTS_AUTH_SECRET;
  if(!secret)return json({error:'Email sign-in is being configured.'},503);
  const value=await verifyCode({db:database(),secret,email:b?.email,code:b?.code,ip:req.headers.get('cf-connecting-ip')||'local'});
  if(!value)return json({error:'That code is invalid or expired. Request a new code and try again.'},401);
  return json({ok:true},200,{'Set-Cookie':sessionCookie(value)});
 }catch{return json({error:'Unable to sign in right now. Please try again later.'},503);}
}
