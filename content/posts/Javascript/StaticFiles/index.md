---
title: "Serving static files"
thumbnail: "/posts/serving-static-files/REST.png"
discussionId: "/posts/serving-static-files/"
date: 2021-02-04
toc: true
draft: false
slug: "/posts/serving-static-files/"
categories: ["Javascript"]
tags: ["Node JS"]
description: "Many web applications share similar, if not identical, needs, and serving static files
(CSS, JavaScript, images) is certainly one of these. Although writing a robust and efficient
static file server is nontrivial, and robust implementations already exist within
Node’s community, implementing your own static file server in this section will illustrate
Node’s low-level filesystem API. "
---
In this section you’ll learn how to

- Create a simple static file server
- Optimize the data transfer with pipe()
- Handle user and filesystem errors by setting the status code.

Let’s start by creating a basic HTTP server for serving static assets.

---

**Creating a static server**

Traditional HTTP servers like Apache and IIS are first and foremost file servers. You
might currently have one of these file servers running on an old website, and moving
it over to Node, replicating this basic functionality, is an excellent exercise to help you
better understand the HTTP servers you’ve probably used in the past.

Each static file server has a root directory, which is the base directory files are
served from. In the server you’ll create, you’ll define a root variable, which will act as
the static file server’s root directory:

```
var http = require('http');
var parse = require('url').parse;
var join = require('path').join;
var fs = require('fs');
var root = __dirname;
```
__dirname is a magic variable provided by Node that’s assigned the directory path to
the file. It’s magic because it could be assigned different values in the same program if
you have files spread about in different directories. In this case, the server will be serving
static files relative to the same directory as this script, but you could configure
root to specify any directory path.

The next step is accessing the pathname of the URL in order to determine the
requested file’s path. If a URL’s pathname is /index.html, and your root file directory
is /var/www/example.com/public, you can simply join these using the path module’s
.join() method to form the absolute path /var/www/example.com/public/
index.html. The following code shows how this could be done:

```
var http = require('http');
var parse = require('url').parse;
var join = require('path').join;
var fs = require('fs');

var root = __dirname;

var server = http.createServer(function(req, res){
    var url = parse(req.url);
    var path = join(root, url.pathname);
});

server.listen(3000);
```

Now that you have the path, the contents of the file need to be transferred. This can
be done using high-level streaming disk access with fs.ReadStream, one of Node’s
Stream classes. This class emits data events as it incrementally reads the file from disk.
The next listing implements a simple but fully functional file server.

```
var http = require('http');
var parse = require('url').parse;
var join = require('path').join;
var fs = require('fs');

var root = __dirname;

var server = http.createServer(function(req, res){
    var url = parse(req.url);
    var path = join(root, url.pathname);
    var stream = fs.createReadStream(path);
    stream.on('data', function(chunk){
        res.write(chunk);
    });
    stream.on('end', function(){
        res.end();
    });
});
server.listen(3000);
```

---

**Optimizing Data transfer with Stream.pipe()**

Although it’s important to know how the fs.ReadStream works and what flexibility its
events provide, Node also provides a higher-level mechanism for performing the same
task: Stream#pipe(). This method allows you to greatly simplify your server code.

```
var server = http.createServer(function(req, res){
    var url = parse(req.url);
    var path = join(root, url.pathname);
    var stream = fs.createReadStream(path);
    stream.pipe(res);
});
```

At this point, you can test to confirm that the static file server is functioning by executing
the following curl command. The -i, or --include flag, instructs cURL to
output the response header:

```
$ curl http://localhost:3000/static.js -i
HTTP/1.1 200 OK
Connection: keep-alive
Transfer-Encoding: chunked
var http = require('http');
var parse = require('url').parse;
var join = require('path').join;
```

As previously mentioned, the root directory used is the directory that the static file
server script is in, so the preceding curl command requests the server’s script itself,
which is sent back as the response body.

This static file server isn’t complete yet, though—it’s still prone to errors. A single
unhandled exception, such as a user requesting a file that doesn’t exist, will bring
down your entire server. In the next section, you’ll add error handling to the file
server.

---

**Handling server errors**

Our static file server is not yet handling errors that could occur as a result of using
fs.ReadStream. Errors will be thrown in the current server if you access a file that
doesn’t exist, access a forbidden file, or run into any other file I/O–related problem.
In this section, we’ll touch on how you can make the file server, or any Node server,
more robust.

In Node, anything that inherits from EventEmitter has the potential of emitting
an error event. A stream, like fs.ReadStream, is simply a specialized EventEmitter
that contains predefined events such as data and end, which we’ve already looked at.
By default, error events will be thrown when no listeners are present. This means that
if you don’t listen for these errors, they’ll crash your server.

To prevent errors from killing the server, you need to listen for errors by registering
an error event handler on the fs.ReadStream (something like the following snippet),
which responds with the 500 response status indicating an internal server error:

```
stream.on('error', function(err){
    res.statusCode = 500;
    res.end('Internal Server Error');
});
```
Registering an error event helps you catch any foreseen or unforeseen errors and
enables you to respond more gracefully to the client.

---

**Preemptive error handling with fs.stat**

The files transferred are static, so the stat() system call can be utilized to request
information about the files, such as the modification time, byte size, and more. This
information is especially important when providing conditional GET support, where a
browser may issue a request to check if its cache is stale.

The refactored file server shown in listing 4.4 makes a call to fs.stat() and
retrieves information about a file, such as its size, or an error code. If the named file
doesn’t exist, fs.stat() will respond with a value of ENOENT in the err.code field, and
you can return the error code 404, indicating that the file is not found. If you receive
other errors from fs.stat(), you can return a generic 500 error code.

```
var server = http.createServer(function(req, res){
    var url = parse(req.url);
    var path = join(root, url.pathname);
    fs.stat(path, function(err, stat){
        if (err) {
            if ('ENOENT' == err.code) {
                res.statusCode = 404;
                res.end('Not Found');
            } else {
                res.statusCode = 500;
                res.end('Internal Server Error');
            }
        } else {
            res.setHeader('Content-Length', stat.size);
            var stream = fs.createReadStream(path);
            stream.pipe(res);
            stream.on('error', function(err){
                res.statusCode = 500;
                res.end('Internal Server Error');
            });
        }
    });
});
```

---