# MBA Activities Hub

Three independent web apps in one repository. Each folder is a complete Vite + React project with its own
`package.json`, `vercel.json`, login screen and code, so each deploys to its own URL.

| Folder      | Who uses it | Login                                                        |
|-------------|-------------|--------------------------------------------------------------|
| `student/`  | Students    | Roll number 25MBA001 - 25MBA175 created by the Head Admin    |
| `faculty/`  | Faculty     | Faculty ID created by the Head Admin                         |
| `admin/`    | Head Admin  | Head Admin credentials                                       |

## Deploy on Vercel (3 projects from this one repo)

Create three Vercel projects, all importing `jeyaprakash27052005-jp/MBA-Activities-Hub`, and set **Root Directory**:

1. `student`  -> student URL
2. `faculty`  -> faculty URL
3. `admin`    -> head admin URL

Framework preset: Vite (auto-detected). Build/install settings come from each folder's `vercel.json`.

## Local run

```
cd student   # or faculty / admin
npm install
npm run dev
```

`firestore.rules` and `firebase-blueprint.json` at the repo root are shared by all three apps.
