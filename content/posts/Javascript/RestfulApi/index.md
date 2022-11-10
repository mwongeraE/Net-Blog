---
title: "Building a RESTful web service"
thumbnail: "/posts/rest-api/REST.png"
discussionId: "/posts/express-js-intro/"
date: 2021-02-04
toc: true
draft: false
slug: "/posts/rest-api/"
categories: ["Javascript"]
tags: ["Express JS", "Graphql", PostgreSQL]
description: "Suppose you want to create a to-do list web service with Node, involving thhe typical create, read, update and delete(CRUD) actions. These actions can be implemented in many ways, but in this article we'll focus on  creating a RESTful web service "
---
By convention, HTTP verbs, such as GET, POST, PUT, and DELETE, are mapped to retrieving, creating, updating, and removing the resources specified by the URL. RESTful web services have gained in popularity because they’re simple to utilize and implement in comparison to protocols such as the Simple Object Access Protocol (SOAP).

We'll use cURL (http://curl.haxx.se/download.html) in place of a web browser to interact with our web service.

To create a compliant REST server, you need to implement the 4 HTTP verbs. Each verb will cover a different task for the to-do list:

- POST - Add items to the to-do list
- GET - Display a listing of current items, or display a single item
- DELETE - Remove items from the to-do list
- PUT - Should modify existing items.

To illustrate the end result, here's an example of creating a new item in the to-do list using `curl` command:

`curl -d 'Practice node js'`

And for viewing items in the to-do list:

`curl http://localhost:3000`

---

**Creating resources with POST requests**

In RESTful terminology, the creation of a resource is typically mapped to the POST
verb. Therefore, POST will create an entry in the to-do list.

In Node, you can check which HTTP method (verb) is being used by checking the
req.method property  . When you know which method the
request is using, your server will know which task to perform.

When Node’s HTTP parser reads in and parses request data, it makes that data
available in the form of data events that contain chunks of parsed data ready to be
handled by the program:

By default, the data events provide `Buffer` objects, which are Node’s version of byte
arrays. In the case of textual to-do items, you don’t need binary data, so setting the
stream encoding to `ascii` or `utf8` is ideal; the data events will instead emit strings.
This can be set by invoking the `req.setEncoding(encoding)` method:

In the case of a to-do list item, you need to have the entire string before it can be
added to the array. One way to get the whole string is to concatenate all of the chunks
of data until the `end` event is emitted, indicating that the request is complete. After the
`end` event has occurred, the item string will be populated with the entire contents of
the request body, which can then be pushed to the `items` array. When the item has
been added, you can end the request with the string `OK` and Node’s default status code
of 200. The following listing shows this in the todo.js file.

```
var http = require('http')
var url = require('url')
var items = []

var server = http.createServer(function(req, res) {
  switch (req.method)
    case 'POST':
      var item = ''; // Set up string buffer for the incoming item
      req.setEncoding('utf8') // a chunk is now utf8 instead of a buffer
      req.on('data', function(chunk){ // a chunk is by default a buffer object
        item += chunk; // Concatenate data chunk onto the buffer
      })

      req.on('end', function() {  //'end' event is fired when everything has been read
        items.push(item) // Push complete new item onto the items array
        res.end('OK\n')
      })
      break;
})
```

---

**Fetching resources with GET requests.**

To handle the GET verb, add it to the same switch statement as before, followed by the logic for listing the to-do items. In the following example, the first call to res.write() will write the header with the default fields, as well as the data passed to it:

```
case 'GET':
items.forEach(function(item, i) {
  res.write(i + ') ' + item + '\n')
})
res.end();
break;
```
Now that the app can display the items, it’s time to give it a try! Fire up a terminal,
start the server, and POST some items using curl. The -d flag automatically sets the
request method to POST and passes in the value as POST data:

`curl -d 'buy groceries' http://localhost:3000`
`curl -d 'buy node in action' http://localhost:3000`

Next, to GET the list of to-do list items, you can execute curl without any flags, as GET is
the default verb:

```
$ curl http://localhost:3000
0) buy groceries
1) buy node in action

```
---

**Setting the content-length header.**

To speed up responses, the Content-Length field should be sent with your response
when possible. In the case of the item list, the body can easily be constructed ahead of
time in memory, allowing you to access the string length and flush the entire list in
one shot. Setting the Content-Length header implicitly disables Node’s chunked
encoding, providing a performance boost because less data needs to be transferred.

An optimized version of the GET handler could look something like this:

```
var body = items.map(function(item, i){
return i + ') ' + item;
}).join('\n');
res.setHeader('Content-Length', Buffer.byteLength(body));
res.setHeader('Content-Type', 'text/plain; charset="utf-8"');
res.end(body);
```
You may be tempted to use the body.length value for the Content-Length, but the
Content-Length value should represent the byte length, not character length, and the
two will be different if the string contains multibyte characters. To avoid this problem,
Node provides the Buffer.byteLength() method.

The following Node REPL session illustrates the difference by using the string
length directly, as the five-character string is comprised of seven bytes:

```
$ node
> 'etc …'.length
5
> Buffer.byteLength('etc …')
7
```
---

**Removing resources with DELETE requests.**

Finally, the `DELETE` verb will be used to remove an item. To accomplish this, the app
will need to check the requested URL, which is how the HTTP client will specify which
item to remove. In this case, the identifier will be the array index in the items array;
for example, `DELETE /1` or `DELETE /5`.

The requested URL can be accessed with the req.url property, which may contain
several components depending on the request. For example, if the request was `DELETE
/1?api-key=foobar`, this property would contain both the pathname and query string
`/1?api-key=foobar`.

To parse these sections, Node provides the url module, and specifically the
`.parse()` function. The following node REPL session illustrates the use of this function,
parsing the URL into an object, including the `pathname` property you’ll use in the
DELETE handler:

```
$ node
> require('url').parse('http://localhost:3000/1?api-key=foobar')
{ protocol: 'http:',
slashes: true,
host: 'localhost:3000',
port: '3000',
hostname: 'localhost',
href: 'http://localhost:3000/1?api-key=foobar',
search: '?api-key=foobar',
query: 'api-key=foobar',
pathname: '/1',
path: '/1?api-key=foobar' }

```

`url.parse()` parses out only the pathname for you, but the item ID is still a string. In
order to work with the ID within the application, it should be converted to a number.
A simple solution is to use the `String.slice()` method, which returns a portion of
the string between two indexes. In this case, it can be used to skip the first character,
giving you just the number portion, still as a string. To convert this string to a number,
it can be passed to the JavaScript global function `parseInt()`, which returns a Number.

The code below first does a couple of checks on the input value, because you can never
trust user input to be valid, and then it responds to the request. If the number is “not
a number” (the JavaScript value NaN), the status code is set to 400 indicating a Bad
Request. Following that, the code checks if the item exists, responding with a 404 Not
Found error if it doesn’t. After the input has been validated, the item can be removed
from the items array, and then the app will respond with 200, OK.

```
case 'DELETE': // Add DELETE case to switch statement
  var path = url.parse(req.url).pathname;
  var i = parseInt(path.slice(1), 10);
  if (isNaN(i)) { // Check if number is valid
    res.statusCode = 400;
    res.end('Invalid item id');
  } else if (!items[i]) { // Ensure requested index exists
    res.statusCode = 404;
    res.end('Item not found');
  } else {
    items.splice(i, 1); // Delete requested item
    res.end('OK\n');
  }
  break;
```

A complete RESTful service would also implement the PUT HTTP verb, which
should modify an existing item in the to-do list. We encourage you to try implementing
this final handler yourself, using the techniques used in this REST server so far.

---

