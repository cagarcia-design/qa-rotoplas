const http=require('http'),fs=require('fs'),path=require('path');
const ROOT=__dirname;
http.createServer((req,res)=>{
  let f=decodeURIComponent(req.url.split('?')[0]); if(f==='/')f='/index.html';
  const p=path.join(ROOT,f);
  fs.readFile(p,(e,d)=>{ if(e){res.writeHead(404);res.end('nf');return;}
    res.writeHead(200,{'Content-Type':f.endsWith('.html')?'text/html; charset=utf-8':'text/plain'});res.end(d);});
}).listen(4700,'127.0.0.1',()=>console.log('mockups en http://127.0.0.1:4700'));
