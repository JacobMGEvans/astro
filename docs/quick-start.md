---
layout: ~/layouts/Main.astro
title: Quick Start
---

```shell
# prerequisite: check that Node.js is 12.20.0+, 14.13.1+, or 16+
node --version

# create a new project directory, and `cd` into it
mkdir mkdirtest && cd "$_"

# prepare for liftoff...
npm init astro

# install dependencies
npm install

# start developing!
npm run start

# when you're ready: build your static site to `dist/`
npm run build
```

To deploy your Astro site to production, upload the contents of the `/dist` folder (generated by running `npm run build`) to your favorite hosting provider.

## Start your project

Go back to your command-line terminal, and run the following command in your project directory:

```bash
npm start
```

Your application is now running on [http://localhost:3000](http://localhost:3000). Open this URL in your browser and you should see the text "Hello, World" that we copied in the previous step.

Astro will listen for file changes in your `src/` directory, so you do not need to restart the application as you make changes during development.

## Build your project

Go back to your command-line terminal, and run the following command in your project directory:

```bash
npm run build
```

This will build your site and write it to disk in the `dist/` directory. Astro sites are static, so they can be deployed to your favorite host (Vercel, Netlify, an S3 bucket, etc.).