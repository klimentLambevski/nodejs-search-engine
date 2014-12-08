var fs=require('fs');
var cheerio=require('cheerio');
var async=require('async');
var Db = require('mongodb').Db,
    MongoClient = require('mongodb').MongoClient;

var document=[];
var calls=[];
console.time('indexing');
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
            async.each(htmlpages.slice(0,10000),function(file,callback){
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
                    }
                    db.close();
                });
                console.timeEnd('indexing');
            });
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