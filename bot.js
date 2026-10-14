const http=require('http');
const QR=require('qrcode');
let qrImage=null;
let statusMsg="STARTING...";
const server=http.createServer(async(req,res)=>{
  res.writeHead(200,{'Content-Type':'text/html'});
  res.end(`<body style="background:#000;color:#fff;text-align:center;padding:20px;font-family:sans-serif"><h1>${statusMsg}</h1>${qrImage?`<div style="background:#fff;padding:20px;border-radius:20px;display:inline-block"><img src="${qrImage}" style="width:300px;height:300px"><p style="color:#000">Scan with WhatsApp:<br>Linked Devices > Link a device</p></div>`:`<h3>Generating QR... Refresh in 5 sec</h3>`}<br><br><button onclick="location.reload()" style="padding:15px 30px;font-size:20px;border-radius:10px">REFRESH QR</button><script>setTimeout(()=>location.reload(),15000)</script></body>`);
});
server.listen(process.env.PORT||3000,()=>console.log("Web ON"));

async function start(){
  const {default:makeWASocket,useMultiFileAuthState,fetchLatestBaileysVersion,DisconnectReason}=require('@whiskeysockets/baileys');
  const pino=require('pino');
  const {version}=await fetchLatestBaileysVersion();
  const {state,saveCreds}=await useMultiFileAuthState('auth');
  const sock=makeWASocket({version,auth:state,logger:pino({level:'silent'}),browser:["Ubuntu","Chrome","22.04"]});
  sock.ev.on('creds.update',saveCreds);
  sock.ev.on('connection.update',async(u)=>{
    const {connection,lastDisconnect,qr}=u;
    if(qr){
      statusMsg="✅ QR READY - SCAN NOW!";
      qrImage=await QR.toDataURL(qr);
      console.log("QR generated");
    }
    if(connection==='open'){statusMsg="✅ BOT ONLINE 24/7! CONNECTED!";qrImage=null;console.log("CONNECTED!");}
    if(connection==='close'){
      const c=lastDisconnect?.error?.output?.statusCode;
      console.log("Closed: "+c);
      if(c!==DisconnectReason.loggedOut){statusMsg="Reconnecting...";setTimeout(start,3000);}
      else statusMsg="Logged out";
    }
  });
  sock.ev.on('messages.upsert',async(m)=>{
    const msg=m.messages[0];
    if(!msg.message||msg.key.fromMe)return;
    const from=msg.key.remoteJid;
    const text=msg.message.conversation||msg.message.extendedTextMessage?.text||"";
    if(!text)return;
    if(text.toLowerCase()=='.ping')await sock.sendMessage(from,{text:"🏓 PONG! Swiss V5 QR Online ✅"});
    if(text.toLowerCase()=='.alive')await sock.sendMessage(from,{text:"✅ BOT ONLINE 24/7 on Render"});
  });
}
start();
