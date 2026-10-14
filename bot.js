const OWNER_NUMBER="256705991442";
const http=require('http');
let pairCode=null;
let statusMsg="STARTING...";
const server=http.createServer((req,res)=>{
  res.writeHead(200,{'Content-Type':'text/html'});
  res.end(`<body style="background:#111;color:#0f0;text-align:center;padding:20px;font-family:sans-serif"><h1 style="color:#fff">${statusMsg}</h1>${pairCode?`<div style="background:#fff;color:#000;padding:30px;border-radius:20px;display:inline-block;margin-top:20px"><h2>YOUR CODE</h2><h1 style="font-size:65px;letter-spacing:10px;margin:10px">${pairCode}</h1><p><b>Step:</b> WhatsApp > 3 dots > Linked Devices > Link a device<br><b>Link with phone number instead</b><br>Type this code FAST!</p><p style="background:yellow;padding:10px">Code refreshes every 60 seconds</p></div>`:`<h2>Generating...</h2><p>Wait 10 sec and refresh</p>`}<p>Number: ${OWNER_NUMBER}</p><p>Swiss V5</p><script>setTimeout(()=>location.reload(),8000)</script></body>`);
});
server.listen(process.env.PORT||3000,()=>console.log("Web ON"));

async function start(){
  const {default:makeWASocket,useMultiFileAuthState,fetchLatestBaileysVersion,DisconnectReason}=require('@whiskeysockets/baileys');
  const pino=require('pino');
  const {version}=await fetchLatestBaileysVersion();
  const {state,saveCreds}=await useMultiFileAuthState('auth');
  const sock=makeWASocket({version,auth:state,logger:pino({level:'silent'}),browser:["Chrome","Chrome","1"]});
  sock.ev.on('creds.update',saveCreds);
  if(!sock.authState.creds.registered){
    statusMsg="Generating Pairing Code for "+OWNER_NUMBER;
    const gen=async()=>{
      if(sock.authState.creds.registered)return;
      try{
        pairCode=await sock.requestPairingCode(OWNER_NUMBER);
        statusMsg="✅ CODE READY - TYPE NOW!";
        console.log("CODE: "+pairCode);
        await new Promise(r=>setTimeout(r,55000));
        gen();
      }catch(e){console.log("Err: "+e.message);statusMsg="Error: "+e.message+" - retrying...";setTimeout(gen,5000);}
    };
    setTimeout(gen,3000);
  }else{statusMsg="✅ ONLINE 24/7 - Connected!";pairCode=null;}
  sock.ev.on('connection.update',(u)=>{
    const {connection,lastDisconnect}=u;
    if(connection==='open'){statusMsg="✅ BOT ONLINE 24/7!";pairCode=null;console.log("CONNECTED");}
    if(connection==='close'){
      const c=lastDisconnect?.error?.output?.statusCode;
      console.log("Closed: "+c);
      if(c!==DisconnectReason.loggedOut)setTimeout(start,3000);
      else{statusMsg="Logged out - need new code";}
    }
  });
  sock.ev.on('messages.upsert',async(m)=>{
    const msg=m.messages[0];
    if(!msg.message||msg.key.fromMe)return;
    const from=msg.key.remoteJid;
    const text=msg.message.conversation||msg.message.extendedTextMessage?.text||"";
    if(!text)return;
    console.log("Msg: "+text);
    if(text.toLowerCase()=='.ping')await sock.sendMessage(from,{text:"🏓 PONG! Swiss V5 Online 24/7 ✅"});
    if(text.toLowerCase()=='.alive')await sock.sendMessage(from,{text:"🤖 ALIVE! Bot running on Render"});
  });
}
start();
