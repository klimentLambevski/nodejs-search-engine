var Db = require('mongodb').Db,
    MongoClient = require('mongodb').MongoClient;
MongoClient.connect("mongodb://localhost:27017/searchdb", function(err, db) {
    if(!err) {
        var collection=db.collection('indexes2');
        console.time('search');
        collection.find({$text:{$search:'Станија гола'.toLowerCase()}}).toArray(function(err,result){
            console.log(err,result);
            console.timeEnd('search');
           db.close();
        });

        //collection.count(function(err, count) {
        //    collection.indexInformation(function(err,result){
        //        console.log(err,result);
        //        db.close();
        //    });
        //    console.log(err);
        //    console.log("There are " + count + " records.");
        //});
    } else {
        console.log("fail");
    }

});