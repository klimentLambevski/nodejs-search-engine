var fs=require('fs');
var cheerio=require('cheerio');
var async=require('async');
var Db = require('mongodb').Db,
    MongoClient = require('mongodb').MongoClient;

var document=[];
var calls=[];
console.time('indexing');
function readFielesSync(files,bulk,db){
    files.forEach(function(val){
       var contents=fs.readFileSync(val,'utf-8');
        addToArray(contents,val);
    });

}
function readFiles(files,bulk,currentFileBlock,fileBlocks,db){
    async.each(files.slice(currentFileBlock*1000,currentFileBlock*1000+1000),function(file,callback){
        fs.readFile('downloaded-files/'+file, 'utf-8', function(err, contents) {
            if(!err){
                console.log(this.fileName);
                addToArray(contents,this.file);
                //bulk.insert(indexFiles(contents));
                callback();
            }
        }.bind({fileName:file}));
    },function(err){
        if( err ) { return console.log(err); }
        //bulk.execute(function(err,result){
        //    if(err){
        //        console.log(err);
        //    }else{
        //        console.log('uspesno');
        //        console.log(currentFileBlock,fileBlocks);
        //        if(currentFileBlock<fileBlocks)
        //          readFiles(files,bulk,currentFileBlock+1,fileBlocks,db);
        //        else{
        //            db.close();
        //        }
        //    }
        //
        //});
        var resultArray=restructureObject();
        var collection=db.collection('indexes2');
        collection.insert(resultArray,function(err,result){
           if(!err){
            db.close();

           }
            else console.log(err);
        });
        console.timeEnd('indexing');
    });
}
MongoClient.connect("mongodb://localhost:27017/searchdb", function(err, db) {
    if(!err) {
        var collection=db.collection('indexes');
        collection.ensureIndex( { title: "text",content:"text" },function(err,result){
            if(err){
                console.log(err);
            }
        });
        var bulk=collection.initializeUnorderedBulkOp();
        fs.readdir('downloaded-files', function(err, files) {
            var htmlpages=files.filter(function(file) { return file.substr(-5) === '.html'; });
            var fileBlocks=htmlpages.length/1000;
            readFiles(htmlpages.slice(0,1),bulk,0,1,db);
        });
    } else {
        console.log("fail");
    }
});
function restructureObject(){
    var tempDoc=[];
    for(key in document){
        tempDoc.push({key:key,files:document[key].join(',')});
    }
    return tempDoc;
}
function addToArray(content,filename){
    var keywords=content.split(/(\.|,|\s+|!|\?)/);
    console.log(keywords);
    keywords.forEach(function(val){
       if(!document[val]) {
           document[val]=[];
       }
        document[val].push(filename);
    });

}

function indexFiles(contents){
    var $=cheerio.load(contents);
    var title=$('.vestgoretext h1').text();
    var content=$('.glavenText').text();
    return {title:title,content:content};
}