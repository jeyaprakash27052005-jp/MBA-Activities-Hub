import React, { useState } from 'react';
import { 
  Globe, 
  Terminal, 
  Copy, 
  Check, 
  ShieldCheck, 
  Database, 
  Server, 
  ArrowRight, 
  Sparkles, 
  GitBranch,
  Layers,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import firebaseConfig from '../../firebase-applet-config.json';

export const VercelHostGuide: React.FC = () => {
  const [copiedVercelJson, setCopiedVercelJson] = useState(false);
  const [copiedEnv, setCopiedEnv] = useState(false);
  const [copiedCli, setCopiedCli] = useState(false);

  const vercelJsonCode = `{
  "version": 2,
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}`;

  const envConfigCode = `VITE_FIREBASE_API_KEY="${firebaseConfig.apiKey}"
VITE_FIREBASE_AUTH_DOMAIN="${firebaseConfig.authDomain}"
VITE_FIREBASE_PROJECT_ID="${firebaseConfig.projectId}"
VITE_FIREBASE_STORAGE_BUCKET="${firebaseConfig.storageBucket}"
VITE_FIREBASE_MESSAGING_SENDER_ID="${firebaseConfig.messagingSenderId}"
VITE_FIREBASE_APP_ID="${firebaseConfig.appId}"
VITE_FIREBASE_DATABASE_ID="${firebaseConfig.firestoreDatabaseId}"`;

  const cliCommands = `# 1. Install Vercel CLI (optional)
npm i -g vercel

# 2. Build the production client
npm run build

# 3. Deploy instantly to Vercel
vercel --prod`;

  const copyToClipboard = (text: string, setter: (val: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setter(true);
    setTimeout(() => setter(false), 2500);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Hero */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 shadow-xl border border-slate-800">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 mb-3">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Migration Complete: SQL & Java Replaced with Firestore</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
          Vercel Production Deployment & Architecture
        </h1>
        <p className="text-sm text-slate-300 mt-2 max-w-2xl leading-relaxed">
          Your application no longer requires a backend server or relational SQL database. All state, events, and dynamic registrations run directly on Google Cloud Firestore, ready to deploy to Vercel in 1 click.
        </p>
      </div>

      {/* Migration Comparison Matrix */}
      <div className="rounded-2xl bg-white dark:bg-slate-800 p-6 border border-slate-200 dark:border-slate-700 shadow-xs">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <span>Before vs. After Architecture</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Legacy System */}
          <div className="p-4 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/60 space-y-2">
            <div className="flex items-center justify-between text-rose-700 dark:text-rose-400 font-bold uppercase tracking-wider text-[11px]">
              <span>Previous Stack</span>
              <span className="px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-900 text-rose-800 dark:text-rose-200">REMOVED</span>
            </div>
            <ul className="space-y-1.5 text-slate-700 dark:text-slate-300 list-disc list-inside">
              <li><strong>Java / Node backend:</strong> required persistent VM or container</li>
              <li><strong>SQL Database:</strong> required connection pools, migrations, schema locks</li>
              <li><strong>Cold starts & downtime:</strong> maintenance when server crashes</li>
              <li><strong>Complex hosting:</strong> needs multi-tier hosting for web + API + DB</li>
            </ul>
          </div>

          {/* New Modern System */}
          <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/60 space-y-2">
            <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400 font-bold uppercase tracking-wider text-[11px]">
              <span>Current Cloud Stack</span>
              <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200">ACTIVE</span>
            </div>
            <ul className="space-y-1.5 text-slate-700 dark:text-slate-300 list-disc list-inside">
              <li><strong>Firebase Firestore:</strong> Real-time NoSQL database with auto-scaling</li>
              <li><strong>Firebase Auth:</strong> Secure Google and email authentication</li>
              <li><strong>Vercel Edge Host:</strong> Global CDN static SPA with instant loading</li>
              <li><strong>Zero Server Costs:</strong> Free tier database & global serverless hosting</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Vercel Configuration Files */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* vercel.json File */}
        <div className="rounded-2xl bg-white dark:bg-slate-800 p-6 border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-black text-white flex items-center justify-center font-bold text-[10px]">
                ▲
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                vercel.json (Included in Project)
              </h3>
            </div>
            <button
              onClick={() => copyToClipboard(vercelJsonCode, setCopiedVercelJson)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200"
            >
              {copiedVercelJson ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedVercelJson ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Enables client-side routing rewrites so deep links and refreshes on Vercel resolve properly.
          </p>
          <pre className="p-4 rounded-xl bg-slate-900 text-slate-200 text-[11px] font-mono overflow-x-auto">
            {vercelJsonCode}
          </pre>
        </div>

        {/* Deploy Commands */}
        <div className="rounded-2xl bg-white dark:bg-slate-800 p-6 border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Vercel Deploy Terminal Commands
              </h3>
            </div>
            <button
              onClick={() => copyToClipboard(cliCommands, setCopiedCli)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200"
            >
              {copiedCli ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCli ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Run these commands in your project directory to deploy to production.
          </p>
          <pre className="p-4 rounded-xl bg-slate-900 text-slate-200 text-[11px] font-mono overflow-x-auto">
            {cliCommands}
          </pre>

          <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 text-xs text-indigo-900 dark:text-indigo-300">
            <div className="font-bold flex items-center gap-1.5 mb-1">
              <GitBranch className="w-3.5 h-3.5" />
              <span>Or Deploy with GitHub + Vercel Dashboard:</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Push this repository to GitHub, go to <strong>vercel.com/new</strong>, select this repo, leave build command as <code className="font-mono bg-white dark:bg-slate-900 px-1 py-0.5 rounded">npm run build</code> and output as <code className="font-mono bg-white dark:bg-slate-900 px-1 py-0.5 rounded">dist</code>.
            </p>
          </div>
        </div>

      </div>

      {/* Online Firebase Parameters */}
      <div className="rounded-2xl bg-white dark:bg-slate-800 p-6 border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Online Firebase Database Credentials (Configured & Live)</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Stored in <code className="font-mono text-indigo-600 dark:text-indigo-400">firebase-applet-config.json</code> and deployed live.
            </p>
          </div>

          <button
            onClick={() => copyToClipboard(envConfigCode, setCopiedEnv)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200"
          >
            {copiedEnv ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>Copy .env Format</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Project ID</span>
            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{firebaseConfig.projectId}</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Firestore Database ID</span>
            <span className="font-mono font-bold text-slate-800 dark:text-slate-200 truncate block" title={firebaseConfig.firestoreDatabaseId}>
              {firebaseConfig.firestoreDatabaseId}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Auth Domain</span>
            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{firebaseConfig.authDomain}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
