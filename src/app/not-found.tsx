import Link from 'next/link';
export default function NotFound(){return <main className="error-page"><div className="error-card"><h1>Record not found</h1><p>The item may have been archived, removed, or you may not have access to it.</p><Link className="btn btn-primary" href="/dashboard">Return to dashboard</Link></div></main>}
