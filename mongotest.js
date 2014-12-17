var Db = require('mongodb').Db,
    MongoClient = require('mongodb').MongoClient;
var _ = require('lodash');
var fs = require('fs');
MongoClient.connect("mongodb://localhost:27017/searchdb", function(err, db) {
    if(!err) {
        var collection=db.collection('indexes2');
        console.time('search');
        var searchText='Станија гола'.toLowerCase();
        collection.find({$text:{$search:searchText}}).toArray(function(err,result){
            console.log(result);
            var files=getRankedScore(result);
            console.log(files);
            _(files).each(function(obj){
                 console.log(fs.readFileSync('downloaded-files/'+obj.file,'utf-8'));
            });
            console.timeEnd('search')
            db.close();
        });

    } else {
        console.log("fail");
    }

});

function getRankedScore(result){
    var restructuredObject={};
    var wordStats={};
    _(result).each(function(val){
        var files=val.files.split(',');
        wordStats[val.key] = {count:files.length/2};
        for(var i=0;i<files.length;i+=2){
            var resultObj={};
            if(!restructuredObject[files[i]]) restructuredObject[files[i]]={};
            restructuredObject[files[i]][val.key]=files[i+1];
        }
        restructuredObject[val.key]=resultObj;
    });
    var fileArray = [];
    _(restructuredObject).each(function(file,key){
        var fileScore = 0;
        _(file).each(function(val,key){
            fileScore += (1 + Math.log(val)) * (30000/wordStats[key].count);
        });
        file.rankedScore = fileScore;

        fileArray.push({file:key,score:fileScore});
    });

    fileArray.sort(function(a,b){
        if(a.score < b.score) return 1;
        if(a.score > b.score) return -1;
        return 0;
    });
    return fileArray.splice(0,10);
}