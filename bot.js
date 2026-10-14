const OWNER_NUMBER="256705991442";
const http=require('http');
let pairCode=null;
let statusMsg="STARTING...";

const server=http.createServer((req,res)=>{
  res.writeHead(200,{'Content-Type':'text/html'});
  res.end(`<body style="background:#000;color:#0f0;text-align:center;padding:30px;font-family:sans-serif"><h1>${statusMsg}</h1>${pairCode?`<div style="background:#fff;color:#000;padding:25px;border-radius:20px;display:inline-block"><h2>YOUR CODE:</h2><h1 style="font-size:60px;letter-spacing:8px">${pairCode}</h1><p>WhatsApp > Settings > Linked Devices<br>Link a device > Link with phone number instead</p><p style="color:red">Enter FAST! Code expires in 20sec</p></div>`:`<h3>Waiting for code...</h3>`}<p>Number: ${OWNER_NUMBER}</p><script>setTimeout(()=>location.reload(),12000)</script></body>`);
});
server.listen(process.env.PORT||3000,()=>console.log("Web ON"));

async function start(){
  const {default:makeWASocket,useMultiFileAuthState,fetchLatestBaileysVersion,DisconnectReason}=require('@whiskeysockets/baileys');
  const pino=require('pino');
  const {version}=await fetchLatestBaileysVersion();
  const {state,saveCreds}=await useMultiFileAuthState('auth');
  const sock=makeWASocket({version,auth:state,logger:pino({level:'silent'}),browser:["Ubuntu","Chrome","22.04"]});
  sock.ev.on('creds.update',saveCreds);
  if(!sock.authState.creds.registered){
    const gen=async()=>{
      if(sock.authState.creds.registered)return;
      try{
        pairCode=await sock.requestPairingCode(OWNER_NUMBER);
        statusMsg="✅ CODE READY: "+pairCode;
        console.log("PAIR CODE: "+pairCode);
        setTimeout(gen,35000);
      }catch(e){
        statusMsg=e.message;
        setTimeout(gen,5000);
      }
    };
    setTimeout(gen,4000);
  } else {
    statusMsg="✅ ONLINE 24/7 - Muwa6566";
    pairCode=null;
  }
  sock.ev.on('connection.update',(u)=>{
    const {connection,lastDisconnect}=u;
    if(connection==='open'){statusMsg="✅ ONLINE 24/7 - Muwa6566 Connected!";pairCode=null;}
    if(connection==='close'){
      const c=lastDisconnect?.error?.output?.statusCode;
      if(c!==DisconnectReason.loggedOut)setTimeout(start,3000);
    }
  });
  sock.ev.on('messages.upsert',async(m)=>{
    const msg=m.messages[0];
    if(!msg.message||msg.key.fromMe)return;
    const from=msg.key.remoteJid;
    const text=msg.message.conversation||msg.message.extendedTextMessage?.text||"";
    if(!text)return;
    if(text.toLowerCase()=='.ping')await sock.sendMessage(from,{text:"🏓 PONG! Swiss V5 Online ✅"});
    if(text.toLowerCase()=='.menu')await sock.sendMessage(from,{text:"🤖 SWISS V5\n.ping\n.alive\n.owner\nSend TikTok link to download"});
  });
}
start();
