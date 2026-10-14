'use client';
export default function GlobalError({error,reset}:{error:Error&{digest?:string};reset:()=>void}){
  return <main className="error-page"><div className="error-card"><div className="brand-mark">!</div><h1>Something went wrong</h1><p>We could not complete that request. Your data was not intentionally changed. Try again, and if it continues, check the setup or server logs.</p><div className="row-actions"><button className="btn btn-primary" onClick={reset}>Try again</button><a className="btn btn-secondary" href="/dashboard">Back to dashboard</a></div>{process.env.NODE_ENV==='development'&&<details><summary>Developer details</summary><pre>{error.message}</pre></details>}</div></main>;
}
