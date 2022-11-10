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

**Creating resources with POST requests**

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
 
`npm init -y`

`npm install @babel/core @babel/node @babel/preset-env nodemon --save-dev`

**Setting Up the Express server**

First thing to do is install express and make an *index.js* file

`npm install express`

This server will be using the Hello World! example from express documentation but with some small changes to incorporate import.

```
import express from 'express'
const app = express()
const port = 3000app.get('/', (req, res) => {
  res.send('Hello World!')
})app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})
```

The simple server is up and running here and needs sequelize models.

---

**Setting up models with sequelize**

Create a postgreSQL database using the below command, this server's database will be called *devtest*

`createdb devtest`

Install sequelize and its drivers. Sequelize will convert the javascript code into SQL but pg and pg-hstore communicate with postgreSQL and make the actual changes.

`npm install sequelize pg pg-hstore.`

Create a new folder called database and a models folder inside that and a models.js file in that. Here the actual models will be made. Import sequelize and create a new instance of Sequelize passing in a string with the name of the database “postgres://localhost:5432/devtest”

`import Sequelize from 'sequelize'`
`const sequelize = new Sequelize(`postgres://localhost:5432/devtest`)`

On this same file create a model. In this example, a user model is created with only a firstName property that must be set to valid because allowNull is set to false. Each property must have a Sequelize type. More Seqeulize types can be found in the Sequelize documentation. These datatypes ensure the information stored is of the same type.

```
const User = sequelize.define('user', {
  // attributes
  firstName: {
    type: Sequelize.STRING,
    allowNull: false
  }
})
```

Put some example data to have a better look at whats going on.

```
sequelize.sync({ force: true }).then(() => {
  return User.create({
    firstName: 'Dons'
  })
})
```

Export this database so it can be used for the graphQL schemas.

`export default sequelize;`

**Setting up GraphQL Schema**
Inside the *database* folder create a *schema* folder and in there create a *schema.js* file. Import the sequelize file.

`import db from '../models/models'`

There are special graphQL datatypes that will be needed. This example will use the ones below.

`import {GraphQLObjectType, GraphQLString, GraphQLInt, GraphQLSchema, GraphQLList, GraphQLNonNull } from 'graphql'`

Since graphQL is a middleware, special graphQL objects are needed in order for graphQL to know what to do. For this example,

```
const User = new GraphQLObjectType({
  name: 'User',
  description: 'this represents a user',
  fields: () => {
    return {
      id: {
        type: GraphQLInt,
        resolve(user) {
          return user.id
        }
      },
      firstName: {
        type: GraphQLString,
        resolve(user) {
          return user.firstName
        }
      }
    }
  }
})
```
The GraphQLObjectType that was created above is a graphQL schema for the Sequelize model that was made for the Users model above. Each field corresponds to a field in the Sequelize model and has a graphql type that dictates what the datatype should be. GraphQL handles the promise received from Sequelize when requests are made through the resolve function.

That is just the Schema for a user, to make a query a whole new GraphQLObjectType needs to be made. This one has some extra fields and the GraphQL datatype is GraphQLList(User) which refers to the schema that was made above. The resolve function also works a bit differently from the User Schema as it as a 2nd parameter, “args”. “args” is the data that will be passed in.

```
const Query = new GraphQLObjectType({
  name: 'Query',
  description: 'this is a root query',
  fields: () => {
    return {
      users: {
        type: new GraphQLList(User),
        args: {
          id: {
            type: GraphQLInt
          },
          firstName: {
            type: GraphQLString
          }
        },
        //validations can go here
        resolve(root, args) {
          return db.models.user.findAll({ where: args })
        }
      }
    }
  }
})
```

That is just for making a query. In order to make post requests a GraphQLObjectType called mutation needs to be made. This is similar to the query GraphQLObjectType but in it, changes to the database will be made.

```
const Mutation = new GraphQLObjectType({
  name: 'Mutation',
  description: 'Functions to create things',
  fields: () => {
    return {
      addUser: {
        type: User,
        args: {
          firstName: {
            type: new GraphQLNonNull(GraphQLString)
          }
        },
        resolve(_, args) {
          return UserModel.create({
            firstName: args.firstName
          })
        }
      }
    }
  }
})
```

Finally to connect it all together GraphQLSchema must be called and initialized with the Query and Mutation objects that were made. This Schema has to be exported to be connected in the *index.js* file.

```
const Schema = new GraphQLSchema({
  query: Query,
  mutation: Mutation
})
```

`export default Schema`

With all the schemas and models set up, the server is finally ready to use the middleware.

`import { graphqlHTTP } from 'express-graphql'`
`import Schema from './database/schema/schema'`

Create a new express route passing the graphqlHTTP middleware. In this server, it will be ‘graphql’ route.

```
import express from 'express'
import { graphqlHTTP } from 'express-graphql'
import Schema from './database/schema/schema'

const app = express()
const port = 3000

app.use('/graphql', graphqlHTTP({ schema: Schema, graphiql: true }))

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})
```

As mentioned earlier, graphQL and RESTful API’s can work concurrently so that the ‘/’ route still works.

To test the ‘/graphql’ route npm install graphiql, an easy to use GUI to test queries then go to ‘http://localhost:3000/graphql’

`npm install graphiql`

![graphql](express-test1.png)
