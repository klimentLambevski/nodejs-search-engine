var fs=require('fs');
var cheerio=require('cheerio');
var async=require('async');
var Db = require('mongodb').Db,
    MongoClient = require('mongodb').MongoClient;

var document=[];
var calls=[];
console.time('indexing');
function readFiles(files,bulk,currentFileBlock,fileBlocks,db){
    async.each(files.slice(currentFileBlock*1000,currentFileBlock*1000+1000),function(file,callback){
        fs.readFile('downloaded-files/'+file, 'utf-8', function(err, contents) {
            if(!err){
                console.log(this.fileName);
                bulk.insert(indexFiles(contents));
                callback();
            }
        }.bind({fileName:file}));
    },function(err){
        if( err ) { return console.log(err); }
        bulk.execute(function(err,result){
            if(err){
                console.log(err);
            }else{
                console.log('uspesno');
                console.log(currentFileBlock,fileBlocks);
                if(currentFileBlock<fileBlocks)
                  readFiles(files,bulk,currentFileBlock+1,fileBlocks,db);
                else{
                    db.close();
                }
            }

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
            readFiles(htmlpages,bulk,0,fileBlocks,db);
        });
    } else {
        console.log("fail");
    }
});


function indexFiles(contents){
    var $=cheerio.load(contents);
    var title=$('.vestgoretext h1').text();
    var content=$('.glavenText').text();
    return {title:title,content:content};
}