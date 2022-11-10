---
title: "Accepting user input from forms"
thumbnail: "/posts/accepting-user-input-from-forms/REST.png"
discussionId: "/posts/accepting-user-input-from-forms/"
date: 2021-02-04
toc: true
draft: false
slug: "/posts/accepting-user-input-from-forms/"
categories: ["Javascript"]
tags: ["Node JS"]
description: "Web applications commonly gather user input through form submissions. Node
doesn’t handle the workload (like validation or file uploads) for you—Node just provides
you with the body data. Although this may seem inconvenient, it leaves opinions
to third-party frameworks in order to provide a simple and efficient low-level API."
---
In this section you’ll learn how to

- Handle submitted form fields
- Handle uploaded files using formidable
- Calculate upload progress in real time

---

**Handling submitted form fields**

Typically two Content-Type values are associated with form submission requests:

- application/x-www-form-urlencoded—The default for HTML forms
- multipart/form-data—Used when the form contains files, or non-ASCII or binary data

In this section, you’ll rewrite the to-do list application from the previous section to utilize
a form and a web browser. When you’re done, you’ll have a web-based to-do list.

In this to-do list application, a switch is used on the request method, req.method,
to form simple request routing. This is shown in listing 4.5. Any URL that’s not exactly
“/” is considered a 404 Not Found response. Any HTTP verb that is not GET or POST is 
a 400 Bad Request response. The handler functions show(), add(), badRequest(),
and notFound() will be implemented throughout the rest of this section.

```
var http = require('http');
var items = [];

var server = http.createServer(function(req, res){
  if ('/' == req.url) {
    switch (req.method) {
        case 'GET':
            show(res);
            break;
        case 'POST':
            add(req, res);
            break;
        default:
            badRequest(res);
        }
  } else {
    notFound(res);
    }
});

server.listen(3000);
```
Although markup is typically generated using template engines, the example in the
following listing uses string concatenation for simplicity. There’s no need to assign
res.statusCode because it defaults to 200 OK.

```
function show(res) {
    var html = '<html><head><title>Todo List</title></head><body>'
            + '<h1>Todo List</h1>'
            + '<ul>'
            + items.map(function(item){
                return '<li>' + item + '</li>'
              }).join('')
            + '</ul>'
            + '<form method="post" action="/">'
            + '<p><input type="text" name="item" /></p>'
            + '<p><input type="submit" value="Add Item" /></p>'
            + '</form></body></html>';
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Length', Buffer.byteLength(html));
    res.end(html);
}
```

The notFound() function accepts the response object, setting the status code to 404
and response body to Not Found:

```
function notFound(res) {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'text/plain');
    res.end('Not Found');
}
```

The implementation of the 400 Bad Request response is nearly identical to not-
Found(), indicating to the client that the request was invalid:

```
function badRequest(res) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'text/plain');
    res.end('Bad Request');
}
```

Finally, the application needs to implement the add() function, which will accept
both the req and res objects. This is shown in the following code:

```
var qs = require('querystring');

function add(req, res) {
    var body = '';
    req.setEncoding('utf8');
    req.on('data', function(chunk){ body += chunk });
    req.on('end', function(){
        var obj = qs.parse(body);
        items.push(obj.item);
        show(res);
    });
}
```

For simplicity, this example assumes that the Content-Type is application/x-wwwform-
urlencoded, which is the default for HTML forms. To parse this data, you simply
concatenate the data event chunks to form a complete body string. Because you’re
not dealing with binary data, you can set the request encoding type to utf8 with
res.setEncoding(). When the request emits the end event, all data events have completed,
and the body variable contains the entire body as a string.

---

**The Querystring module**

In the server’s add() function implementation, you utilized Node’s querystring module
to parse the body. Let’s take a look at a quick REPL session demonstrating how
Node’s querystring.parse() function works—this is the function used in the server.

Imagine the user submitted an HTML form to your to-do list with the text “take ferrets
to the vet”:

```
$ node
> var qs = require('querystring');
> var body = 'item=take+ferrets+to+the+vet';
> qs.parse(body);
{ item: 'take ferrets to the vet' }
```

After adding the item, the server returns the user back to the original form by calling
the same show() function previously implemented. This is only the route taken for
this example; other approaches could potentially display

**Handling uploaded files using formidable**

Handling uploads is another very common, and important, aspect of web development.
Imagine you’re trying to create an application where you upload your photo
collection and share it with others using a link on the web. You can do this using a web
browser through HTML form file uploads.

The following example shows a form that uploads a file with an associated name
field:

```
<form method="post" action="/" enctype="multipart/form-data">
<p><input type="text" name="name" /></p>
<p><input type="file" name="file" /></p>
<p><input type="submit" value="Upload" /></p>
</form>
```

To handle file uploads properly and accept the file’s content, you need to set the
enctype attribute to multipart/form-data, a MIME type suited for BLOBs (binary
large objects).

What makes formidable a great choice for handling file uploads is that it’s a
streaming parser, meaning it can accept chunks of data as they arrive, parse them, and
emit specific parts, such as the part headers and bodies previously mentioned. Not
only is this approach fast, but the lack of buffering prevents memory bloat, even for
very large files such as videos, which otherwise could overwhelm a process.

The first step to implementing the upload() function is to respond with 400 Bad
Request when the request doesn’t appear to contain the appropriate type of content:

```
function upload(req, res) {
    if (!isFormData(req)) {
        res.statusCode = 400;
        res.end('Bad Request: expecting multipart/form-data');
        return;
    }
}
function isFormData(req) {
    var type = req.headers['content-type'] || '';
    return 0 == type.indexOf('multipart/form-data');
}
```

The helper function isFormData() checks the Content-Type header field for
multipart/form-data by using the JavaScript String.indexOf() method to assert
that multipart/form-data is at the beginning of the field’s value.

Now that you know that it’s a multipart request, you need to initialize a new
formidable.IncomingForm form and then issue the form.parse(req) method call,
where req is the request object. This allows formidable to access the request’s data
events for parsing:

```
function upload(req, res) {
    if (!isFormData(req)) {
        res.statusCode = 400;
        res.end('Bad Request');
        return;
    }
    var form = new formidable.IncomingForm();
    form.parse(req);
}
```

The IncomingForm object emits many events itself, and by default it streams file
uploads to the /tmp directory. As shown in the following listing, formidable issues
events when form elements have been processed. For example, a file event is issued
when a file has been received and processed, and field is issued on the complete
receipt of a field.

```
var form = new formidable.IncomingForm();

form.on('field', function(field, value){
    console.log(field);
    console.log(value);
});
form.on('file', function(name, file){
    console.log(name);
    console.log(file);
});
form.on('end', function(){
    res.end('upload complete!');
});
form.parse(req);
```

By examining the first two console.log() calls in the field event handler, you can
see that “my clock” was entered in the name text field:

```
name
my clock
```

The file event is emitted when a file upload is complete. The file object provides
you with the file size, the path in the form.uploadDir directory (/tmp by default), the
original basename, and the MIME type. The file object looks like the following when
it’s passed to console.log():

```
{ size: 28638,
path: '/tmp/d870ede4d01507a68427a3364204cdf3',
name: 'clock.png',
type: 'image/png',
lastModifiedDate: Sun, 05 Jun 2011 02:32:10 GMT,
length: [Getter],
filename: [Getter],
mime: [Getter],
...
}
```

Formidable also provides a higher-level API, essentially wrapping the API we’ve already
looked at into a single callback. When a function is passed to form.parse(), an error
is passed as the first argument if something goes wrong. Otherwise, two objects are
passed: fields and files.

The fields object may look something like the following console.log() output:
`{ name: 'my clock' }` 
The files object provides the same File instances that the file event emits, keyed by
name like fields.

It’s important to note that you can listen for these events even while using the callback,
so functions like progress reporting aren’t hindered. The following code shows
how this more concise API can be used to produce the same results that we’ve already
discussed:

```
var form = new formidable.IncomingForm();
    form.parse(req, function(err, fields, files){
        console.log(fields);
        console.log(files);
        res.end('upload complete!');
});
```
---

**Calculating upload progress**

Formidable’s progress event emits the number of bytes received and bytes expected.
This allows you to implement a progress bar. In the following example, the percentage
is computed and logged by invoking console.log() each time the progress event is
fired:

```
form.on('progress', function(bytesReceived, bytesExpected){
    var percent = Math.floor(bytesReceived / bytesExpected * 100);
    console.log(percent);
});
```
});
This script will yield output similar to the following:

```
1
2
4
5
6
8
...
99
100
```

---