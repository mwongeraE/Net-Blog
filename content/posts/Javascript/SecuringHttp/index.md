---
title: "Securing your application with HTTPS"
thumbnail: "images/lock.png"
discussionId: "/posts/securing-app-with-https/"
date: 2021-02-04
toc: true
draft: false
slug: "/posts/securing-app-with-https/"
categories: ["Javascript"]
tags: ["Node JS"]
description: "A frequent requirement for e-commerce sites, and sites dealing with sensitive data, is
to keep traffic to and from the server private. Standard HTTP sessions involve the client
and server exchanging information using unencrypted text. This makes HTTP
traffic fairly trivial to eavesdrop on."
---
In this section you’ll learn how to secure you application with https

---

If you’d like to take advantage of HTTPS in your Node application, the first step is
getting a private key and a certificate. The private key is, essentially, a “secret” needed
to decrypt data sent between the server and client. The private key is kept in a file on
the server in a place where it can’t be easily accessed by untrusted users. In this section,
you’ll generate what’s called a self-signed certificate. These kinds of SSL certificates
can’t be used in production websites because browsers will display a warning message
when a page is accessed with an untrusted certificate, but it’s useful for development
and testing encrypted traffic.

To generate a private key, you’ll need OpenSSL, which will already be installed on
your system if you installed Node. To generate a private key, which we’ll call key.pem,
open up a command-line prompt and enter the following:

`openssl genrsa 1024 > key.pem`

In addition to a private key, you’ll need a certificate. Unlike a private key, a certificate
can be shared with the world; it contains a public key and information about the certificate
holder. The public key is used to encrypt traffic sent from the client to the
server.

The private key is used to create the certificate. Enter the following to generate a
certificate called key-cert.pem:

`openssl req -x509 -new -key key.pem > key-cert.pem`

Now that you’ve generated your keys, put them in a safe place. In the HTTPS server in
the following listing we reference keys stored in the same directory as our server
script, but keys are more often kept elsewhere, typically ~/.ssh. The following code
will create a simple HTTPS server using your keys.

```
var https = require('https');
var fs = require('fs');

var options = {
    key: fs.readFileSync('./key.pem'),
    cert: fs.readFileSync('./key-cert.pem')
};

https.createServer(options, function (req, res) {
    res.writeHead(200);
    res.end("hello world\n");
}).listen(3000);
```

Once the HTTPS server code is running, you can connect to it securely using a web
browser. To do so, navigate to https://localhost:3000/ in your web browser. Because
the certificate used in our example isn’t backed by a Certificate Authority, a warning
will be displayed. You can ignore this warning here, but if you’re deploying a public
site, you should always properly register with a Certificate Authority (CA) and get a
real, trusted certificate for use with your server.


---