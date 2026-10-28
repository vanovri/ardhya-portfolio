# Ardhya Novri Ramadhan portfolio

Static source for [ardhyanovri.my.id](https://ardhyanovri.my.id), exported from the audited portfolio on 28 October 2026. The gallery contains 38 entries, including 28 projects with public source repositories. Historical assignments and proposals are labelled separately from software demonstrations.

The project pages describe contributions, evidence and limits. Development used AI coding assistance. Passing a project's included tests does not establish production suitability, scientific accuracy or physical hardware validation.

## Run locally

```sh
python tools/verify.py
python -m http.server 8080 --directory public
```

Open `http://localhost:8080`. There is no build step or runtime package dependency.

## Publication boundary

This repository contains the website's HTML, CSS, JavaScript, icons and licensed font files. CV documents, credential scans, photographs and project evidence images are not copied into Git history. Their existing links point to the production portfolio host, so those resources require an Internet connection. Search results and canonical URLs also point to the production portfolio.

The export contains no private context repository, conversation history, credentials, raw thesis files or project implementation code. Each eligible project's implementation remains in its own linked repository. Two local prototypes were removed from the public catalog at the owner's request.

Serve `public/` as the site root. GitHub Actions validates internal links and the catalog before publishing a static GitHub Pages preview. The primary domain continues to use its existing Vercel deployment.

Font license notices are included beside their font files in `public/fonts/`. Other content belongs to its respective authors. This source publication does not grant a new blanket license to personal documents or third-party evidence.
