import puppeteer from "puppeteer-core";
const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
const b=await puppeteer.launch({executablePath:"C:/Program Files/Google/Chrome/Application/chrome.exe",headless:"new",args:["--no-sandbox"]});
const p=await b.newPage();
await p.setViewport({width:390,height:844,isMobile:true,hasTouch:true});
await p.goto("http://localhost:3000/nope",{waitUntil:"load"});await sleep(2500);
await p.screenshot({path:process.argv[2]+"/a-404.png"});
await b.close();
