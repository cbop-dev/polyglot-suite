#!/usr/bin/env node
import { spawn } from 'node:child_process';
import appJsonObj from '../apps/portal/src/lib/portal.json' with { type: 'json' };
const startPort=parseInt(process.env.PORT || '5170', 10);
let currentAppPort=startPort+1;
const portalAppEntry={
  name: 'portal',
  command: 'npm',
  port: startPort,
  args: ['--workspace=portal', 'run', 'dev', '--', '--port', startPort],
  env: 'PUBLIC_SUITE_PORTAL_URL',
  url: `http://localhost:${startPort}`

}
const apps = [portalAppEntry, ...Object.entries(appJsonObj.appsInfo)
  .filter(([appName,appInfo])=>appJsonObj.appsEnabled.includes(appName))
  .map(([name,info])=>{
    const port = currentAppPort++;
    info.url = info.url ||`http://localhost:${port}`;
    const envVar= info.externalApp ? '' : `PUBLIC_SUITE_${info.slug.toLocaleUpperCase().replaceAll(/-/g, '_')}_APP_URL`;
    
    return {
      ...info,
      name: info.slug,
      port:port,
      command: 'npm',
      args: ['--workspace=apps/'+name, 'run', 'dev', '--', '--port', port],
      env: envVar,      
    }
  })];


  const appsRunningLocally = apps.filter(app=>!app.externalApp);
/*
const appsold = [
  { name: 'portal', command: 'npm', args: ['--workspace=portal', 'run', 'dev'], color: '\x1b[35m' },
  { name: 'bible', command: 'npm', args: ['--workspace=polyglot-bible-reader', 'run', 'dev'], color: '\x1b[34m' },
  { name: 'lexemes', command: 'npm', args: ['--workspace=biblical-lexeme-explorer', 'run', 'dev'], color: '\x1b[32m' },
  { name: 'corpora', command: 'npm', args: ['--workspace=ancient-corpora-reader', 'run', 'dev'], color: '\x1b[36m' }
];*/



console.log('\n  🚀 Launching Polyglot Suite Dev Servers:');
console.log(apps.map(app=>app.name).join(" | "));
apps.forEach((app)=>{
  if (!app.externalApp){
      console.log(`     ➜ ${app.name.padEnd(25)} http://localhost:${app.port}`); 
  }
  else if (app.url) {
     console.log(`     ➜ ${app.name.padEnd(25)} ${app.url}`); 
  }
  else{
    console.log("What we got here: "+app.name);
  }
});



const devEnv = {
  ...process.env,
  ...Object.assign({}, ...appsRunningLocally.map(app => ({ [app.env]: app.url })))
};


const procs = appsRunningLocally.map(app => {
  const p = spawn(app.command, app.args, {
    stdio: ['inherit', 'pipe', 'pipe'],
    env: devEnv
  });

  p.stdout.on('data', data => {
    process.stdout.write(`${app.color ?? ''}[${app.name}]\x1b[0m ${data}`);
  });

  p.stderr.on('data', data => {
    process.stderr.write(`${app.color ?? ''}[${app.name}]\x1b[0m ${data}`);
  });

  return p;
});

function cleanup() {
  procs.forEach(p => {
    try {
      p.kill();
    } catch {
      // Ignore
    }
  });
  process.exit();
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
