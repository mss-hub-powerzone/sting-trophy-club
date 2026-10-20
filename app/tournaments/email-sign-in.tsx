'use client';
import {useState} from 'react';
export default function EmailSignIn({onSignedIn}:{onSignedIn:()=>Promise<unknown>}){
 const [email,setEmail]=useState(''),[code,setCode]=useState(''),[sent,setSent]=useState(false),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 async function submit(e:React.FormEvent){
  e.preventDefault();setBusy(true);setMessage('');
  try{const response=await fetch('/tournaments/api/auth/'+(sent?'verify':'request'),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,code})});
   const result=await response.json();if(!response.ok)throw new Error(result.error||'Please try again.');
   if(sent){await onSignedIn();}
   else{setSent(true);setMessage('If this email is on our roster, a code is on its way. Check your inbox and spam folder.');}
  }catch(e){setMessage(e instanceof Error?e.message:'Please try again.');}finally{setBusy(false);}
 }
 return <form className="email-signin" onSubmit={submit}><label>Roster email<input type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} maxLength={254} disabled={sent||busy} required/></label>{sent&&<label>8-digit sign-in code<input type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{8}" maxLength={8} value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,''))} required/></label>}<button disabled={busy}>{busy?'Please wait…':sent?'Verify & sign in':'Email me a sign-in code'}</button>{sent&&<button type="button" className="outline" disabled={busy} onClick={()=>{setSent(false);setCode('');setMessage('');}}>Change email / request another code</button>}{message&&<p role="status">{message}</p>}<p className="tiny muted">Codes expire after 10 minutes. Contact a team manager if your roster email needs to be updated.</p></form>;
}
