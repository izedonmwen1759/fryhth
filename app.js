const express = require('express')
const app = express()
const PORT = process.env.PORT ||  7776
const server = app.listen(PORT, () => console.log('server running on '+PORT))
const io = require('socket.io')(server, {
    cors:{
        origin:'*'      
    }
})   
const ffmpeg = require('fluent-ffmpeg')
const fs = require('fs') 
const HLSServer = require('hls-server') 
const cors = require('cors')
const findRemoveSync = require('find-remove')
app.use(cors());

app.use(express.static('/'))
app.get("/", (req, res) => { 
    res.sendFile(__dirname + "/index/index.html");  
}); 
let child 

let intervs
let socketConnected = new Set() 
var users = []
app.param('aljazeera', function(req, res, next, aljazeera) {
    const modified = aljazeera
   
    req.aljazeera = modified;
    next();
  });
  app.param('image', function(req, res, next, image) {
    const modified = image
  
    req.image = modified;
    next();
  });

app.get("/media/:aljazeera", (req,res)=>{
    
    fs.readFile('./media/aljazeera.m3u8', function(err,data){
        res.writeHead(200, {"Access-Control-Allow-Origin":'*'})
        if(err){
                console.log(err.message)
        }else{
            //console.log(data)
            res.end(data)
        }
         
        
    })
})
app.get("/index/:image",(req,res)=>{
    fs.readFile('./index/c.jpg', function(err,data){
        if(err) throw err
        res.writeHead(200, {'Content-Type': 'image/jpeg'})
       
        res.end(data) 
    })
})

try {
        var ccomand = ffmpeg('http://iptvcliques.ottct.pro:80/GVVNXL8CQW/NV3YGNYFIC/445127') 
    .outputOptions([
        '-crf 36', 
        '-hls_time 5',   
        '-hls_list_size 3'
    ]).audioBitrate(128).videoBitrate('1000k')
    .videoFilters("scale=trunc(iw/4)*2:trunc(ih/4)*2")
    .videoCodec('libx264').audioCodec('libmp3lame') 
    ccomand.save('./media/aljazeera.m3u8') 
} catch (error) {
    console.log(error.message)
}  


new HLSServer(server,{ 
    provider:{ 
        exists:(req,cb)=>{
            const ext = req.url.split('.').pop()
            if(ext !== 'm3u8' && ext !== 'ts'){ 
                    return cb(null, true) 
                    
            }
            fs.access(__dirname + req.url, fs.constants.F_OK,(err)=>{
                if(err){
                    return cb(null, false)
                }
                cb(null, true)
            })
        }, 
        getManifestStream: (req,cb)=>{
            const stream = fs.createReadStream(__dirname + req.url)
            cb(null,stream)
        },
        getSegmentStream:(req,cb)=>{
            const stream = fs.createReadStream(__dirname + req.url)
            cb(null,stream) 
        } 
    }  
})
/*
setInterval(()=>{
    var result = findRemoveSync('./media/',{age:{seconds:30}, extensions:'.ts'})
    console.log(result)
},20000)*/