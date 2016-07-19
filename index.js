const BUCKET_NAME = 'your-bucket-name';
const BUCKET_URL = 'https://s3-ap-northeast-1.amazonaws.com/' + BUCKET_NAME;

var Base64Stream = require('base64-stream');
var PdfPrinter = require('pdfmake');
var AWS = require('aws-sdk');
var s3 = new AWS.S3({apiVersion: '2006-03-01'});

var fonts = {
  GenShinGothicP: {
    normal: 'fonts/GenShinGothic/GenShinGothic-P-Regular.ttf',
    bold: 'fonts/GenShinGothic/GenShinGothic-P-Bold.ttf',
    italics: 'fonts/GenShinGothic/GenShinGothic-P-Regular.ttf',
    bolditalics: 'fonts/GenShinGothic/GenShinGothic-P-Bold.ttf'
  }
};

var printer = new PdfPrinter(fonts);

var docDefinition = {
  background: [
    {
      image: 'images/confidential.png',
      width: 150,
      height: 100
    }
  ],
  defaultStyle: {
    font: 'GenShinGothicP'
  },
  content: [
    'First paragraph',
    'Another paragraph, this time a little bit longer to make sure, this line will be divided into at least two lines',
    {
      table: {
        // headers are automatically repeated if the table spans over multiple pages
        // you can declare how many rows should be treated as headers
        headerRows: 1,
        widths: ['*', 'auto', 100, '*'],

        body: [
          ['First', 'Second', 'Third', 'The last one'],
          ['Value 1', 'Value 2', 'Value 3', 'Value 4'],
          [{text: 'Bold value', bold: true}, 'Val 2', 'Val 3', 'Val 4']
        ]
      }
    }
  ]
};

exports.handler = function(event, context) {
  //create base64 encoded pdf stream
  var pdf = printer.createPdfKitDocument(docDefinition);
  var base64Stream = pdf.pipe(Base64Stream.encode());
  pdf.end();

  //fetch base64 encoded pdf
  var tempFileBase64 = '';
  base64Stream.on('data', function(buffer) {
    tempFileBase64 += buffer.toString();
  });
  base64Stream.on('end', function() {
    s3.putObject({
      Bucket: BUCKET_NAME,
      Key: 'example.pdf',
      Body: new Buffer(tempFileBase64, 'base64'),
      ContentType: 'application/pdf',
      ACL: 'public-read'
    }, function(err, data) {
      context.succeed({location: BUCKET_URL + '/example.pdf'});
    });
  });
};
//
// var context = function() {
// };
// var fs = require('fs');
// context.done = function(a, obj) {
//   console.log(obj);
//   // fs.writeFileSync('dest/example.pdf', new Buffer(obj.body, 'base64'));
// };
// context.succeed = function(a){
//   context.done(null, a);
// };
// exports.handler(null, context);
