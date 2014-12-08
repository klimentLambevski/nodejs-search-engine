var fs = require('fs');
var request = require('request');
for(var i=11000; i < 40000 ; i++){
    url = 'http://arhiva.plusinfo.mk/vest/'+i+'/';
    request.get(url, function (error, response, html) {
        console.log(this.url,this.i);
        if(error){
            return console.log(error);
        }
        fs.writeFile('downloaded-files/'+this.i+'.html', html, function (err) {
            if (err) return console.log(err);
        });
    }.bind({i:i,url:url}));

}