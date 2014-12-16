var fs=require('fs');
var cheerio=require('cheerio');
var async=require('async');
var Db = require('mongodb').Db,
    MongoClient = require('mongodb').MongoClient;
var _ = require('lodash');
var documentIndex=[];
console.time('indexing');
function readFilesSync(files,bulk,db){
    _(files).each(function(val){
        var contents=fs.readFileSync("downloaded-files/html/"+val,'utf-8');
        addToArray(contents,val);
    });

    var resultArray=restructureObject();
    var collection=db.collection('indexes2');
    console.log(resultArray.length);
    collection.insert(resultArray,function(err,result){
        if(!err){

        }
        else console.log(err,'sdfdsf');
        db.close();
        console.timeEnd('indexing')
    });

}
function readFiles(files,bulk,currentFileBlock,fileBlocks,db){

    async.each(files.slice(currentFileBlock*1000,currentFileBlock*1000+1000),function(file,callback){
        fs.readFile('downloaded-files/html/'+file, 'utf-8', function(err, contents) {
            if(!err){
                addToArray(contents,this.fileName);
                callback();
            } else{
                console.log(err);
            }
        }.bind({fileName:file}));
    },function(err){
        if( err ) { return console.log(err); }
        var collection=db.collection('indexes2');
        collection.ensureIndex({key:'text'},function(err,val){
            console.log(err,val);
        });
        if(currentFileBlock<fileBlocks){

            readFiles(files,bulk,currentFileBlock+1,fileBlocks,db);
        }
        else {
            var resultArray=restructureObject();
            collection.insert(resultArray,function(err,result){
                if(!err){
                    //resultArray=[];
                    console.log(currentFileBlock,fileBlocks);


                }
                else console.log(err,'sdfdsf')
                db.close();
                console.timeEnd('indexing');
            });
        }
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
        fs.readdir('downloaded-files/html', function(err, files) {
            var fileBlocks = files.length/1000;
            readFiles(files,null,0,fileBlocks,db);
            //readFilesSync(files,null,db);
        });
    } else {
        console.log("fail");
    }
});
function restructureObject(){
    var tempDoc=[];
    for(var key in documentIndex){
        var index = _.transform(documentIndex[key],function(result,obj){
            result.push(obj.file);
            result.push(obj.count);
        },[]);
        tempDoc.push({key:key,files:index.join(',')});
    }
    return tempDoc;
}
function addToArray(content,filename){
    var allWords=_.transform(content.split(/[\.,\s!\?"':\(\)]+/),function(result,word){
        result.push(word.toLowerCase());
    },[]).sort();
    var numOccurencies = 0;
    var currentWord = null;
    var documentLength = allWords.length;
    var lastIndex = 0;
    for(var i=0;i<allWords.length;i++){
        if(allWords[i].length<4) continue;
        if (allWords[i] != allWords[i - 1]) {
            if (currentWord) {
                if(!documentIndex[currentWord]) documentIndex[currentWord]=[];
                try{
                    documentIndex[currentWord].push({file: filename, count: numOccurencies});
                } catch (ex){
                    console.log(currentWord);
                }
            }
            currentWord = allWords[i];
            numOccurencies = 0;
            lastIndex = 0
        } else {
            numOccurencies += (1/i)*(documentLength/2);
        }
    }

}
