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
  Layers, 
  CheckCircle2, 
  GraduationCap, 
  Building 
} from 'lucide-react';
import firebaseConfig from '../../firebase-applet-config.json';

export const VercelHostGuide: React.FC = () => {
  const [selectedApp, setSelectedApp] = useState<'student' | 'faculty' | 'admin'>('student');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const studentVercelJson = `{
  "version": 2,
  "name": "mba-student-portal",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html?portal=student"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" }
      ]
    }
  ]
}`;

  const facultyVercelJson = `{
  "version": 2,
  "name": "mba-faculty-portal",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html?portal=faculty"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" }
      ]
    }
  ]
}`;

  const adminVercelJson = `{
  "version": 2,
  "name": "mba-head-admin-portal",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html?portal=admin"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" }
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

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const getActiveJson = () => {
    if (selectedApp === 'student') return studentVercelJson;
    if (selectedApp === 'faculty') return facultyVercelJson;
    return adminVercelJson;
  };

  const getActiveFilePath = () => {
    if (selectedApp === 'student') return '/student/vercel.json';
    if (selectedApp === 'faculty') return '/faculty/vercel.json';
    return '/admin/vercel.json';
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 text-slate-900 font-sans">
      
      {/* Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 shadow-md border border-slate-800">
        <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-lg text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 mb-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Multi-Link Vercel Hosting Architecture</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-white">
          Separate Vercel Web App Deployments
        </h2>
        <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
          Deploy 3 completely distinct links on Vercel: one for MBA Students, one for Faculty Coordinators, and one for Head Administration. Each has its own dedicated folder, login, and configuration.
        </p>
      </div>

      {/* App Selector Tabs */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Select Web App to Configure & Deploy:
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedApp('student')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                selectedApp === 'student'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>Student App (/student)</span>
            </button>

            <button
              onClick={() => setSelectedApp('faculty')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                selectedApp === 'faculty'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <Building className="w-4 h-4" />
              <span>Faculty App (/faculty)</span>
            </button>

            <button
              onClick={() => setSelectedApp('admin')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                selectedApp === 'admin'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Head Admin App (/admin)</span>
            </button>
          </div>
        </div>

        {/* Selected App Configuration Display */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                {getActiveFilePath()}
              </span>
              <span className="text-xs text-slate-500">
                Dedicated Vercel configuration for {selectedApp.toUpperCase()} web app
              </span>
            </div>

            <button
              onClick={() => copyText(getActiveJson(), `vercel_json_${selectedApp}`)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors shadow-2xs"
            >
              {copiedCode === `vercel_json_${selectedApp}` ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Copy Configuration</span>
                </>
              )}
            </button>
          </div>

          <pre className="p-3.5 rounded-xl bg-slate-900 text-emerald-400 font-mono text-xs overflow-x-auto max-h-56">
            {getActiveJson()}
          </pre>
        </div>
      </div>

      {/* Deployment Steps */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Step-by-step Guide */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Terminal className="w-4 h-4 text-indigo-600" />
            <span>How to Create 3 Vercel Links in Vercel Dashboard</span>
          </h3>

          <ol className="text-xs text-slate-600 space-y-2 list-decimal list-inside leading-relaxed">
            <li>
              <strong>Create Project 1:</strong> In Vercel, click <em>Add New &gt; Project</em> and connect this repository. Set the project name to <code>mba-student-app</code> and use <code>student/vercel.json</code>.
            </li>
            <li>
              <strong>Create Project 2:</strong> Add another project from the same repo. Name it <code>mba-faculty-app</code> and use <code>faculty/vercel.json</code>.
            </li>
            <li>
              <strong>Create Project 3:</strong> Add another project from the same repo. Name it <code>mba-admin-app</code> and use <code>admin/vercel.json</code>.
            </li>
            <li>
              Add the Firebase Environment Variables below to each Vercel project under <em>Settings &gt; Environment Variables</em>.
            </li>
          </ol>
        </div>

        {/* Environment Variables */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-600" />
              <span>Firebase Client Environment Variables</span>
            </h3>

            <button
              onClick={() => copyText(envConfigCode, 'env_config')}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            >
              {copiedCode === 'env_config' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Env</span>
                </>
              )}
            </button>
          </div>

          <pre className="p-3.5 rounded-xl bg-slate-900 text-sky-300 font-mono text-[11px] overflow-x-auto max-h-48">
            {envConfigCode}
          </pre>
        </div>

      </div>

    </div>
  );
};
