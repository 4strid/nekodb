# NekoDB
Tiny ODM for MongoDB. The Ne comes from NeDB, and ko refers to the Japanese diminuitive "ko"
(小) or little.

### Project goals
- To build the simplest, easiest to use ODM
- Stay as close to MongoDB syntax as possible
  * Provide model validation and model referencing
  * Beyond that, just provide a thin wrapper over the native functionality
- Support NeDB and MongoDB with an identical interface
- Promisify NeDB: no callback hell, only lovely Promises

### No database? No problem!
NekoDB comes with NeDB built in, so you can access a Mongo-like database, without actually
installing or running a database at all. NeDB is suitable for datasets in the range of tens of
thousands of documents. For larger datasets, it is recommended you upgrade to MongoDB.

Jump To
-------
#### [Quickstart guide](#quick-intro)
#### [Connecting to a backend](#connecting-to-a-backend-1)
- [NeDB](#nedb)
- [MongoDB](#mongodb)
#### [Creating Models](#creating-schemas)
- [Typeclasses](#typeclasses)
- [Array fields](#array-fields-and-multi-type-fields)
- [Multi-type fields](#array-fields-and-multi-type-fields)
- [Embedded documents](#embedded-documents)
- [Constants](#constants)
- [Length limited strings](#length-limited-strings)
- [Validators](#validators)
- [Default Values](#values)
- [References](#references)
  - [Embedding models](#embedding-models)
- [Utility Typeclasses](#utility-typeclasses)
#### [Creating models](#creating-models-2)
#### [Logging models](#instanceslice)
#### [Finding models](#finding-models-2)
- [Query syntax](#query-syntax)
  - [Basic queries](#basic-queries)
  - [Comparison and logical operators](#comparison-and-logical-operators)
- [Projections](#projections)
- [Cursor methods](#cursor-methods)
  - [Sorting](#sorting)
  - [Paginating](#paginating)
  - [Joining references](#joining-references)
#### [Updating models](#updating-models-1)
- [Array operator methods](#array-operator-methods)
  - [$push](#push)
  - [$pop](#pop)
  - [$addToSet](#addtoset)
  - [$pull](#pull)
- [Saving joined models](#saving-joined-models)
  - [Creating models with saveRefs() / saveAll()](#creating-models-with-saverefs--saveall)
- [Where is Model.update() ?](#where-is-modelupdate-)
#### [Counting models](#counting-models-1)
#### [Deleting models](#deleting-models-1)
#### [Hooks](#hooks-1)
- [oncreate](#oncreate)
- [prevalidate](#prevalidate)
- [postvalidate](#postvalidate)
- [presave](#presave)
- [postsave](#postsave)
- [predelete](#predelete)
- [postdelete](#postdelete)
#### [Indexing](#indexing-1)


#### [API Reference](#api-reference-1)
- [ko](#ko)
- [Validators](#typeclass)
  - [ko.Number](#konumber)
  - [ko.String](#kostring)
  - [ko.Boolean](#koboolean)
  - [ko.Date](#kodate)
  - [ko.null](#konull)
  - [ko.Array(type)](#koarraytype)
  - [ko.Option(Array types)](#kooptionarray-types)
  - [ko.Document(Object schema)](#kodocumentobject-schema)
- [Model](#model)
- [Instance](#instance)
- [Cursor](#cursor)
- [NeDBClient(Object config)](#nedbclientobject-config)
- [MongoClient(Object config)](#mongoclientobject-config)


#### [Changelog](#changelog-1)
#### [Testing](#testing-1)
#### [Contact](#contact-1)


#### Common Hiccups
  * [ko.Model is not a function](https://github.com/cutejs/nekodb#you-must-call-koconnect-before-creating-your-models)
  * [Program hangs on model.save()](#you-must-always-call-next)

Quick Intro
===========

### Connecting and creating schemas

```javascript
const ko = require('nekodb')

ko.connect({
    client: 'nedb',
    filepath: __dirname + '/db'
})

ko.models({
    Celebrity: {
        name: ko.String[50],
        age: ko.Number.integer(),
        birthday: ko.Date,
        instagram: ko.String[30],
        followers: ko.Number
    },
    Family: {
        name: ko.String,
        members: [ko.models.Celebrity],
        city: ko.String
    }
})
```
Connect to a backend, and then register your models by calling `ko.models` and passing an
object containing the schemas for each model.

### Creating a model

```javascript
const celebrity = ko.models.Celebrity.create({
    name: 'Kim Kardashian West',
    age: 37,
    birthday: new Date('1980-10-21'),
    instagram: '@kimkardashian',
    followers: 1080000
})

celebrity.save().then(instance => {
    console.log(instance)
    // instance will have been assigned an _id
})
```
Create a model instance with the `create` method. To save the instance to the database, call
`save`.

### Finding models

```javascript
ko.models.Celebrity.find({}).then(instances => {
    console.log(instances)
})

ko.models.Celebrity.findOne({name: 'Kanye West'}).then(instance => {
    console.log(instance)
})
```
Retrieve models from the database with `find`, `findOne`, and `findById` methods.

### Updating a model
```javascript
ko.models.Celebrity.findOne({name: 'Kim Kardashian'}).then(instance => {
    instance.name = 'Kim Kardashian West'
    return instance.save()
})
```
Retrieving a model or models returns model instances, so to update the model, update the fields
on the model and then call `save`.

### Deleting models
```javascript
ko.models.Celebrity.deleteOne({name: 'Johnny Depp'}).then(deletedCount => {
    console.log(deletedCount)
})
```
Delete models with the `deleteOne`, `deleteMany`, or `deleteById` methods.

### Populating references
```javascript
ko.models.Family.findOne({name: 'West'}).join().then(instances => {
    console.log(instances)
})
```

With each reference in the array replaced with the full instance of the referenced document,
the result might look something like this:
```
Instance {
    name: 'West',
    members: [ Instance {
        _id: 'ps30L4dHbv9rLTln',
        name: 'Kim Kardashian West',
        age: 37,
        birthday: 1980-10-21T00:00:00.000Z,
        instagram: '@kimkardashian',
        followers: 1080000 },

        Instance {_id: 'ps30L4dHbv9rLTlo',
        name: 'Kanye West',
        age: 40,
        birthday: 1977-06-08T00:00:00.000Z,
        instagram: '@privatekanye',
        followers: 406000 } ],
    city: 'Los Angeles, CA' }
```

Detailed Guide
==============


## Connecting to a backend

Before you can do anything else, you must connect to a backend. There are two options available:
NeDB and MongoDB. To connect, call `ko.connect` and supply a configuration.

### NeDB

Supply a file path where NeDB will store the database files. Alternatively, set 'inMemory' to
true to use the in-memory client, without persisting the database.

```javascript
ko.connect({
    client: 'nedb',
    filepath: __dirname + '/path/to/db'
})
```

or

```javascript
ko.connect({
    client: 'nedb',
    inMemory: true
})
```

### MongoDB

Supply the information necessary to connect to MongoDB, as well as the name of the database to use.

You can omit username and password if they're not needed to connect.

Note that to use the MongoDB client, you must also install the optional npm package `mongodb`.

```javascript
ko.connect({
    client: 'mongodb',
    username: 'root',
    password: 'mongopassword',
    address: 'localhost:27017',
    database: 'nekodb'
})
```

or

```javascript
ko.connect({
    client: 'mongodb',
    url: 'mongodb://username:password@localhost:27017/nekodb'
})
```

You don't need to supply a username or password if they are not required to connect.

Note that you don't have to wait for a callback after connecting. You can just start issuing
commands, which will be queued up and executed once the database connection has been established.

Though they are executed in order, there's no way to guarantee that they finish in order. If you
need the results of one call in a subsequent call you should still use a Promise chain to order
your calls.

### You must call ko.connect before creating your models
Before you can create a Model, you must call ko.connect or you will get the error "ko.models is
not a function" or "ko.Model is not a function"

## Creating schemas

To create a schema you can call `ko.models` as in the Quick Intro to create all your schemas at
once, or individually with `ko.Model`. Since typing `ko.models` every time you want to access a
model can quickly become tiresome, you can create them one at a time and assign them each to a
variable.

```javascript
const User = ko.Model('User', {
    username: ko.String,
    password: ko.String,
    email: ko.Email
})
```

The first argument to `ko.Model` is the name of the model, which is the name of the collection
and the property name with which it will be attached to `ko.models`.

In this example, we can access the newly created model either by its variable name `User`, or
at `ko.models.User`.

The second argument is the schema to use, which is supplied as an object. The object's keys are
the field names, and its values are Ko typeclasses. Typeclasses will check to ensure instance
values are of the correct type, and can also perform additional validation and set values, as we
will see shortly.

### \_id field
The `_id` field is automatically added to every model, expecting a type of ObjectID to be created
and saved by the database. If you intend to use a different type of \_id that you will supply
yourself, you must specify so explicitly.

```javascript
const Model = ko.Model('Model', {
    _id: ko.String,
    name: ko.String
})
```
In this example, we're going to set our own \_id fields and they are expected to be strings.

### Required by default
Fields specified in a schema are considered required by default. See [optional fields](#optional-fields)
for how to make a field optional.

### Built-in types

The supported JavaScript types are:

- `String`
- `Number`
- `Boolean`
- `Date`
- `Array`
- `Object`
- `null`

### Typeclasses
We refer to them by their Ko Typeclasses. The available typeclasses are:

- `ko.String`
- `ko.Number`
- `ko.Boolean`
- `ko.Date`
- `ko.Array`
- `ko.Option`
- `ko.Document`
- `ko.null`

```javascript
const AllTypesModel = ko.Model('AllTypesModel', {
    string: ko.String,
    number: ko.Number,
    boolean: ko.Boolean,
    date: ko.Date,
    array: ko.Array(ko.Number) // an array of numbers
    option: ko.Option([ko.Number, ko.String]) // either a string or a number
    embedded: ko.Document({
        subfield: ko.String
    }),
    null: ko.null // expected to be null or undefined
})
```

### Shorthands

Rather than using `ko.Array`, `ko.Option`, `ko.Document`, or `ko.null`, directly, there are
shorthands to create them.

To specify that a field should contain an array of a certain type, pass an array containing one
typeclass. To specify a field that can contain varying types, pass an array containing more
than one typeclass. These can be nested. To create an array whose elements can be of differing
types, supply an array containing the array of options.

#### Array fields and multi-type fields

```javascript
const Model = ko.Model('Model', {
    array: [ko.Number],              // field must be an array of numbers
    option: [ko.Number, ko.String]   // field must be a number or a string
    optArr: [[ko.Number, ko.String]] // field must be an array of strings or numbers
})
```

#### Optional fields

To specify that a field should be null, you can just use `null` in lieu of a typeclass. To make
a field optional, you can either pass an option array containing the desired type and null, or
using the typeclass method `optional`

```javascript
const Optional = ko.Model('Optional', {
    optionalString: [ko.String, null],
    altOptionalStr: ko.String.optional()
    // these accomplish the same thing
})
```

#### Embedded documents

To specify that a field should contain an embedded document, supply an object: this object will
look a lot like a schema, with specified field names and typeclasses. This is the type against
which values will be checked.

```javascript
const Embedded = ko.Model('Embedded', {
    document: {
        embeddedField: ko.String,
        embeddedNum: ko.Number
    }
})
```

In this example, any instance of the Embedded model must contain an object in the `document`
field and that object must contain the fields `embeddedField` and `embeddedNum`.

#### Constants

To specify that a field should contain a constant (and to assign it that value) you can supply
a number, string, boolean, or Date.

```javascript
const Constants = ko.Model('Constants', {
    string: 'always this string',
    number: 0,
    boolean: true,
    date: new Date('2018-02-25')
})
```

#### Length limited strings

To specify that a string should have a maximum length, you can use square brackets on ko.String
passing in the desired maximum length.

```javascript
const MaxLength = ko.Model('MaxLength', {
    string: ko.String[10]
})
```

### Validators

In addition to checking the type, each built-in typeclass contains a number of validator methods
that can perform more specific validation. Length limiting strings is one example. These are
called as methods on the typeclass, and return a new typeclass.

Since the returned result is a typeclass, you can continue to call methods on it in a chain.

You may find it more readable to define your extended typeclasses above your model rather than
putting the whole complicated thing into the schema.

```javascript
// contains only our desired characters
const Username = ko.String.match(/^[a-zA-Z0-9_\-\.~[\]@!$'()\*+;,= ]{2,30}$/)

// contains at least 1 lowercase, 1 uppercase, and one number
const Password = ko.String.minlength(8)
                          .match(/[a-z]/)
                          .match(/[A-Z]/)
                          .match(/\d/)

const User = ko.Model('User', {
    username: Username, 
    password: Password,
    email: ko.Email
})


// only integers from 1 through 10
const Rating = ko.Number.integer().range(1, 10)

const MovieReview = ko.Model('MovieReview', {
    author: User,
    movie: ko.String[100],
    rating: Rating
    body: ko.String,
})
```

The full list of validators available is found below in the [API reference](#typeclass).

### Values

A method can also cause the typeclass to set a value when the model is created. Any typeclass can
have a default value, set with the `default` method. You can set the value to the current time
and date with `ko.Date.now()`.

```javascript
const Member = ko.Model('Member', {
    name: ko.String,
    bio: ko.String.default('This user has not set a bio')
    joined: ko.Date.now()
})
```

### References

To specify that a field should contain a reference to a model, you can simply supply that Model.

```javascript
const Author = ko.Model('Author', {
    name: ko.String,
    email: ko.Email
})

const BlogPost = ko.Model('BlogPost', {
    title: ko.String,
    body: ko.String,
    author: Author,
    postDate: ko.Date.today()
})

Author.create({
    name: 'Darwood',
    email: 'dmarvin@nekodb.net'
}).save().then(author => {
	BlogPost.create({
        title: 'Why good documentation matters',
        body: 'If you forget to document certain features, users will have a hard time...',
        author: author._id
    })
})
```
When creating an instance of a Model containing a reference, pass in the \_id of the referenced
model. When you perform a find, the reference can be resolved using `join`. (See
[joining references](#joining-references))

To reference a Model that has not been created yet, or to reference it without access to 
the variable it was saved to (for instance, if requiring it would cause a circular dependency)
you can refer to the Model by its name on `ko.models`

```javascript
const Blog = ko.Model('Blog', {
    owner: ko.models.Author,
    posts: [ko.models.BlogPost],
})
```

#### Embedding models

In addition to referencing a model by its \_id, you can also embed a copy of it in another
document to avoid having to perform a join when you often or always need the data of the
reference. To do so, call the `embed` method on a Model.

```javascript
const Comment = ko.Model('Comment', {
    author: ko.models.Author,
    body: ko.String
    date: ko.Date.now()
})

const BlogPost2 = ko.Model('BlogPost2', {
    title: ko.String,
    body: ko.String,
    author: Author,
    postDate: ko.Date.today()
    comments: [Comment.embed()]
})
```

By default, embedding a document saves a copy of it in its collection. To avoid this, use
`embedOnly`. Currently, updating and saving an embedded model that is embedded will update it
in its collection, but saving an embedded model directly will not update the models it is
referenced in. This will change in a future version. For now, you can consider embedded models
you find on their own read-only.

### Utility Typeclasses

There some built-in utility typeclasses, which perform common validation. They are:

- `ko.Email` a String containing a valid email
- `ko.URL` a String containing a valid URL
- `ko.URL.Relative` a String containing a valid URI to a relative path on the same server

Open an issue if you can think of other utility typeclasses that should be built-in.

## Creating models

To create a new model, first create a model instance with `<Model>.create()`. Calling `create`
without an argument creates a blank model, with all its fields set to undefined. If you have all
the data handy when you're creating it, you can pass an object to `create` whose values will
be copied over.

Once created and populated, your instance is ready to be saved to the database. You do so by
calling `<instance>.save()` which returns a Promise. If all the fields were valid and the save
completed successfully, the promise will be fulfilled with the same instance you created before
but with an \_id assigned by the database. If an \_id is provided explicitly, it will use that
instead of one assigned by the database.

If the save was *not* successful, the promise will be rejected. If it simply failed validation,
the promise will be rejected with an object containing all the offending fields and their values.
If some other error occurred, the promise will be rejected with that error.

```javascript
const user1 = ko.models.User.create()

user1.username = 'nekodb'
user1.password = 'Password123'
user1.email = 'neko@nekodb.net'

// or

const user2 = ko.models.User.create({
    username: 'nekodb',
    password: undefined,
    email: 'neko@nekodb.net'
})

user1.save().then(user => {
    console.log(user._id)
    // generated _id from database
})

user2.save().catch(errors => {
    console.log(errors)
    // errors will contain the password field,
    // since it doesn't contain a String as was required
})
```

## instance.slice
Since every instance uses getters/setters to determine which fields have been updated, console.log-ing them
directly does not yield very interesting results. Every instance has a method called `slice` which converts
it into a basic object that you can log and JSON.stringify.

## Finding models

To retrieve models from the database use the Model `find`, `findOne`, or `findById` methods.
Each of these arguments takes a MongoDB query object as its first argument. This is a paper
thin wrapper over the client's own `find` methods, so the syntax is literally identical to that
of the client you are using.

`find` returns an array of models, `findOne` and `findById` return a single model. Every find
method returns a Promise that resolves to Instances like those returned by `create()`.

```javascript
const Celebrity = ko.models.Celebrity

Celebrity.find({age: 37}).then(celebs => {
    celebs.forEach(celeb => {
        console.log(celeb.slice())
    })
}).catch(err => {
    console.log(err)
})
// returns all celebrity models with age = 37

Celebrity.findOne({name: 'Kanye West'}).then(kanye => {
    console.log(kanye.slice())
}).catch(err => {
    console.log(err)
})
// finds one model whose name is 'Kanye West'

Celebrity.findById('ps30L4dHbv9rLTln').then(celeb => {
    console.log(celeb.slice())
}).catch(err => {
    console.log(err)
})
// finds the model with the given _id
```

### Query syntax

The basic structure of a query is an object with the fields to compare and either an expected
value or comparison operators (`$lt`, `$lte`, `$gt`, `$gte`, `$in`, `$nin`, `$ne`). These can
be combined with logical operators `$or`, `$and`, `$not` and `$nor`.

Regex matches can be performed using the `$regex` operator.

#### Basic queries
Basic queries look for documents whose fields match the values you specify. An example would be
`{firstname: 'John', lastname: 'Smith'}` which returns all models named "John Smith".


Using `{}` as a query returns all the documents.

#### Comparison and logical operators

```javascript
ko.models.Celebrity.find({age: {$gte: 40}}).then(celebs => {
    celebs.forEach(celeb => console.log(celeb.slice()))
}).catch(err => {
    console.log(err)
})
// logs all celebrities at least 40 years old

ko.models.BlogPost.find({
    $and: [
        {date: {$gte: '2017-01-01', $lt: '2018-01-01'}},
        {$or: [
            {title: {$regex: /JavaScript/i}},
            {title: {$regex: /MongoDB/i}}
        ]}
    ]
}).then(posts => {
    posts.forEach(post => console.log(post.slice()))
}).catch(err => {
    console.log(err)
})
// we specified two fields in this query: title and postDate
// logs all blog posts whose titles contain "JavaScript" or "MongoDB" posted in 2017
```

For a more in depth explanation of the syntax, please refer to the documentation of the client
you are using.

- [NeDB](https://github.com/louischatriot/nedb#finding-documents)
- [MongoDB](https://docs.mongodb.com/manual/reference/operator/query/)

Actually, if you're completely unfamiliar with MongoDB query syntax, I recommend looking at
NeDB's documentation first, even if you're using MongoDB, as it provides a gentler introduction
and makes notes of where the syntax differs from MongoDB's so you won't get mixed up.

### Projections

The second, optional argument to the `find` family of methods is the projections you want to
perform. It uses MongoDB's syntax for projections, that is, an object containing fields, and
values 0 or 1 to either exclude or include fields. So for instance `{a: 1, b: 1}` would include
only fields `a` and `b`, and `{c: 0}` would include all fields except for `c`. You can't mix
the two, except for \_id which is by default always returned but can be omitted, even when using 1s.

Since this results in an incomplete object that would no longer pass validation, projections are
a one way trip, and do not return a model instance, rather just returning a plain object.

```javascript
ko.models.BlogPost.find({}, {title: 1, _id: 0}).then(titles => {
    console.log(titles)
    // objects that only contain the title field
}).catch(err => {
    console.log(err)
})
```

### Cursor methods
Sorting and paginating is done the same way as it's done in MongoDB and NeDB, using a Cursor
object returned by `find`. The cursor has methods to alter the results it will return.

Once you've modified the query as needed, execute it by calling `then` on it like it's a Promise,
or `forEach` like it's an array.

#### Sorting
Sort the results you get back by calling the `sort` method on a cursor. Sort takes an object
as an argument which specifies the fields and which direction to sort them in. An example would be
`{name: 1}` which sorts by name in ascending order or `{name: 1, age: -1}` which would sort first
by name in ascending order, then by age in descending order.

#### Paginating
By combining the `skip` and `limit` cursor methods, you can accomplish pagination.

```javascript
ko.models.Comment.find({author: '3Pipc0uSq1cXqlgE'}).sort({postDate: 1}).skip(0).limit(5).then(comments => {
    console.log(comments)
    // first 5 comments
    return ko.models.Comment.find({author: '3Pipc0uSq1cXqlgE'}).sort({postDate: 1}).skip(5).limit(5)
}).then(comments => {
    console.log(comments)
    // next 5 comments
})
// etc.
```

#### Joining references

The cursor also has a method not found in MongoDB or NeDB called `join`. By calling join
with an array of field names, the references contained in those field names will be replaced
with the full models that they reference. Calling it without an argument joins all references
on the model.

Calls to `findOne` and `findById` can also be joined this way, calling `join` before `then`.

Model instances also have a `join` method which will perform the join on the instance, returning
a Promise that resolves to the instance with its references replaced.

```javascript
const Blog = ko.Model('Blog', {
    owner: ko.models.Author,
    posts: [ko.models.BlogPost],
})

Blog.find({}).join().then(blogs => {
    console.log(blogs)
    // every blog in the array contains a full Author model in the owner field,
    // and an array of full BlogPost models in the posts field
}).catch(err => {
    console.log(err)
})
```

`join` can also be called with an object whose fields are the fields on the model to be joined,
and whose values are projection queries specifying which fields of the reference to keep or
omit.

```javascript
Blog.find({}).join({posts: {_id: 0, title: 1}}).then(blogs => {
    console.log(blogs)
	// the posts field will contain an array of partial posts, with only the title field
	// the owner field will not be joined, only containing a reference
}).catch(err => {
	console.log(err)
})
```
In this case, the model will not be able to be saved again because we omitted the \_id field.
If we did not omit the \_id field, it could be coerced back into a reference and could be saved
after modifications.

You cannot call `saveRefs` after performing a partial join; in fact, an error will be thrown if
you attempt to do so.

## Updating models

Updating is performed by first finding the model(s) to modify and then, since the `find` methods
return Instances, editing the model(s) and then calling `save()`.

Only fields that have been updated will be revalidated and saved. Modifications to array and
document fields are also considered.

```javascript
BlogPost.findOne({title: 'Asynchronous JavaSrcipt'}).then(blogpost => {
    blogpost.title = 'Asynchronous JavaScript'
    return blogpost.save()
}).then(() => {
    // continue processing
})

const Player = ko.Model('Player', {
    username: ko.String,
    gold: ko.Number.default(0)
})

Player.find({}).then(allPlayers => {
    return Promise.all(allPlayers.map(player => {
        player.gold += 100
        return player.save()
    }))
}).then(() => {
    // continue processing
})
```

### Array operator methods
Using Array prototype methods (like `.push`, `.splice`, etc.) causes the whole array to be replaced
when saving to the database. Same goes for setting the field to a new array. To work more
efficiently with arrays, you can use MongoDB's array manipulation update operators `$push`,
`$pop`, `$addToSet`, and `$pull`, which are exposed as special methods on any array field.

`$push` and `$addToSet` can be called multiple times; `$pop` and `$pull` can be called only once.

MongoDB only allows one atomic operation per field for one update, so you can't mix more than one
at once.

#### $push
Adds element(s) to the array. You can pass in either a single element or an array of elements
as the first argument to `$push`.

You can use the modifiers `$slice` and `$position` to affect the outcome of the push. They are
supplied as properties on an object as the second argument to `$push`.

- `$slice` limits the length of the array to a certain number, cutting off the end of the array
if its length exceeds the amount in `$slice`
- `$position` specifies the position at which to insert the elements. 0 inserts at the beginning
of the array.

#### $pop
Removes the first or last element of an array. The argument passed is `1` or `-1` which removes
the last or first element respectively.

#### $addToSet
Adds element(s) to the array, but does not add duplicate values. You can pass in either a single
element or an array of elements. For objects, performs a deep-equal comparison when considering
whether an element is a duplicate.

#### $pull
Pulls value(s) from the array. You can pass in either a value to pull or an array of values to pull.

MongoDB (and NeDB) allow you to pass a query to `$pull` rather than a value. While this will
also work here, NekoDB does not yet contain a full-blown query processor, and as such your
instance will go out of sync, with those values apparently not pulled from the array, though
they will be when the instance is saved. If you specified that the array should not be empty,
using a query may result in the array being empty after all but validation will not catch it.
It's also not tested. Be careful when passing a query to `$pull`, and avoid it if possible.

```javascript
const Student = ko.Model('Person', {
    name: ko.String,
    classes: [ko.String]
})

Student.create({
    name: 'Joanne',
    classes: ['Calculus', 'Poetry', 'Databases']
}).save().then(student => {
    student.classes.$push('Biology')
    return student.save()
}).then(student => {
    student.classes.$push(['Greek Drama', 'Greek Comedy'], {
        $position: 0,
        $slice: 4,
    })
    // classes will now contain ['Greek Drama', 'Greek Comedy', 'Calculus', 'Poetry']
    return student.save()
}).then(student => {
    // 'Poetry' will not be added to the array as it already exists
    student.classes.$addToSet(['Poetry', 'Nuclear Physics'])
    return student.save()
}).then(student => {
    // removes the last element of the array. $pop(-1) removes the first.
    student.classes.$pop(1)
    return student.save()
}).then(student => {
    student.classes.$pull('Calculus')
    student.save()
}).catch(err => {
    console.log(err)
})
```

### Saving joined models

If you perform a join on a model, you may note that the model should no longer pass validation:
where it expects a reference, it now contains an object. However, you can still edit your model
and save it without any issues. References that have been joined will be coerced back into
references prior to saving.

You can also make changes to a reference while it is joined and have those changes be saved
using the `saveRefs()` method. To perform both `saveRefs()` and `save()` in one method call, you
can use `saveAll()`

#### Creating models with saveRefs() / saveAll()

As `saveRefs` just calls `save()` on the reference instances, `saveAll()` can also be used to
create an entirely new model to be saved to the database. This way you can create your models
and references together in one action.

```javascript
ko.models.Blog.create({
    owner: {
        name: 'Niko D.B.',
        email: 'niko@nekodb.net'
    },
    posts: []
}).saveAll().then(blog => {
    console.log(blog.owner)
    // this will be the _id of the newly created Author model
    
    blog.posts.$push({
        title: 'My first blog',
        body: 'The content of the blog post',
        author: blog.owner
    })

    return blog.saveAll()
}).then(blog => {
    console.log(blog.posts)
    // now contains the _id of the newly created BlogPost
}).catch(err => {
    console.log(err)
})
```

### Where is Model.update() ?

Currently you can't use either client's native `update` methods as they would bypass validation.
This will be supported in a later version.

## Counting models

To count the number of documents matching a query, use the Model `count` method, which takes
the same kind of query as the `find` methods. `count` returns a Promise that resolves to the
number of models that matched the query.

```javascript
ko.models.Author.count({}).then(count => {
    console.log(count)
    // logs the total number of Author models
}).catch(err => {
    console.log(err)
})
```

## Deleting models

You can delete a model two ways: using the Model methods `deleteOne`, `deleteMany`, or
`deleteById`, or by calling `delete()` on a model instance.

These all return a Promise that resolves to the number of documents deleted by the operation.

```javascript
ko.models.User.deleteOne({username: 'nekodb'}).then(deletedCount => {
    console.log(deletedCount)
    // this will be 1 if we succeeded
})

ko.models.User.findOne({username: 'milkperil'}).then(user => {
    return user.delete()
}).then(deletedCount => {
    console.log(deletedCount)
    // this will be 1 if we succeeded
}).catch(err => {
    console.log(err)
})
```

If `predelete` or `postdelete` hooks are specified, they will be run for each instance using
any of the methods to delete the model.

## Hooks

You can inject code to be run before and after certain steps of saving a model to the database.
Your hook will be called with two arguments: the instance and a `next()` function you call when
you're finished with your hook. You can also return a Promise rather than call `next()`.

### You must always call next()
You must always call `next()` or return a Promise or your program will hang on saving.

You can add hooks two ways. First is by including a $$hooks property on your schema when you
define your model, where the keys are the names of the hooks to be added and the values are the
hooks. Or, you can set a value on the Model object whose property name is one of the names of
the hooks.

To determine whether a hook should modify a certain field you can use the instance method
`isUpdated` which takes a field name.

#### oncreate
Runs immediately after a model is created. Used to asynchronously add default values to a model
as `Typeclass.default()` is limited to synchronous code only.
#### prevalidate
Runs before validation. Can be used to populate fields that are based on other fields.
#### postvalidate
Runs after validation.
#### presave
Runs before saving. If you need to modify a field before storing it in the database, you should do it here.
#### postsave
Runs after a model is saved.
#### predelete
Runs before a model is deleted.
#### postdelete
Runs after a model is deleted.

### Using presave to encrypt a password
```javascript
const bcrypt = require('bcrypt')
const saltRounds = process.env.SALTROUNDS

// contains at least 1 lowercase, 1 uppercase, and one number
const Password = ko.String.minlength(8)
                          .match(/[a-z]/)
                          .match(/[A-Z]/)
                          .match(/\d/)

const User = ko.Model('User', {
    username: ko.String.range(2, 30), 
    password: Password,
    $$hooks: {
        presave: (user, next) => {
            if (user.isUpdated('password')) {
                bcrypt.hash(user.password, saltRounds, function (err, hash) {
                    if (err) {
                        return next(err)
                    }
                    user.password = hash
                    next()
                })
            } else {
	        next()
	    }
        }
    }
})

User.create({
    username: 'amy',
    password: 'Here is a G00D password'
}).save().then(user => {
    console.log(user.password)
    // this will be encrypted now
    user.username = 'Amy'
    return user.save()
}).then(user => {
    // the save will succeed even though the password is encrypted and might otherwise fail validation
}).catch(err => {
    console.log(err)
})
```
Here we supply a named `presave` hook to be run any time the password is updated. Because
validation only occurs when a field is updated, even though the new password may or may not
pass validation, you can still modify the model and save it as needed.

We make sure not to double encrypt the password by specifying that it should only be updated if
the `password` field is updated.

To update the password, you need only set a new password on the model and the new password
will be validated and encrypted.

## Indexing

You can specify indexes on fields by adding an `$$index` field to a schema or by calling
`createIndex` on a Model. Indexes help speed up performance by reducing the amount of
elements the database must check, and can also be used to specify uniqueness constraints.

You should essentially have an index on any field you intend to search by or sort by, to avoid
having to scan all the elements in a collection.

See [Indexes in MongoDB](https://docs.mongodb.com/manual/indexes/) for more information on
what indexes are and why you might want to use them.

Creating an index directly calls the client's own index creation mechanism, so the full power
of MongoDB or NeDB indexes are at your disposal.

```javascript
const User = ko.Model('User', {
    username: ko.String,
    password: ko.String,
    $$indexes: {
        username: {
            unique: true
        }
    }
})
```

Now an error will be thrown if we attempt to create two users with the same username.

See [client index sections](#nedbclientobject-config) for what indexes are avaialable to each client.

API Reference
=============

### ko
- `connect(Object config)` Connects to a backend (either NeDB or MongoDB) using supplied *config*.
- `close()` Closes a MongoDB connection, and sets own properties to `null`.
- `Model(Object schema)` Registers a Model and creates a collection to store it in. Returns a `Model`. *schema* has form {fieldname: typeclass, ...}
- `models(Object schemas)` Registers multiple Models at once. *schemas* has form {modelname: {schema}, ...}
- `models` The Models registry. The properties of this object are a way to refer to each Model that has been registered.
- `client` The currently used backend. Either an instance of `MongoClient` (not MongoDB's MongoClient) or `NeDBClient`

### Typeclass
These methods are available on all Typeclasses.
- `default(value)` Sets a default value when a model is created
- `optional()` Makes a field accept null and undefined as well as the current type. This method
should be called last if calling multiple methods.
- `constant(value)` Sets a default value and ensures that the field actually contains that value.
- `validate(Function validator(value))` Adds a validator, which is a function that takes a value and returns true or false
- `extend(Function/Object extend)` If argument is a function, calls the function with the `this` context set to the Typeclass. In the function,
set `value`, `validator`, or for multiple validators, `validators`. If it is an object, those same
fields are copied over.

### ko.Number
Instance of `Typeclass` Specifies that a field must be a Number.
- `min(Number min)` Specifies a minimum value.
- `max(Number max)` Specifies a maximum value.
- `minx(Number min)` Specifies a minimum value, from but not including the minimum.
- `maxx(Number max)` Specifies a maximum value, up to but not including the maximum.
- `range(Number min, Number max)` Specifies a range of valid values from *min* to *max*.
- `naturalRange(Number min, Number max)` Specifies a range of values starting from *min* up to but not including *max*.
- `integer()` Specifies that a field should contain only integer values.

### ko.String
Instance of `Typeclass` Specifies that a field must be a String.
- `[Number maxlength]` Shorthand for specifying a maximum length.
- `minlength(Number length)` Specifies a minimum length for the value.
- `maxlength(Number length)` Specifies a maximum length for the value.
- `range(Number minlength, Number maxlength)` Specifies a range of valid lengths.
- `match(Regex pattern)` Tests the value against the supplied regular expression.

### ko.Boolean
Instance of `Typeclass` Specifies that a field must be a Boolean.

### ko.Date
Instance of `Typeclass` Specifies that a field must be a JavaScript Date object.
- `after(Date minDate)` Specifies that the value must occur after *minDate*
- `before(Date maxDate)` Specifies that the value must occur before *maxDate*
- `past()` Specifies that the value should be before Date.now()
- `future()` Specifies that the value should be after Date.now()
- `range(Date minDate, Date maxDate)` Specifies a range of valid dates, from *minDate* to *maxDate*
- `now()` Sets the value to the value of Date.now() at the time of model creation
- `today()` Sets the value to midnight of the current day when the model is created

### ko.null
Instance of `Typeclass` Specifies that a field should contain `null` or `undefined`.

### ko.Array(type)
Instance of `Typeclass` Specifies that a field should contain an Array of the supplied type.
- `notEmpty()` Specifies that the value array must contain at least one element.

### ko.Option(Array types)
Instance of `Typeclass` Specifies that a field should contain one of the supplied types.

### ko.Document(Object schema)
Instance of `Typeclass` Specifies that a field should contain an object matching the supplied
schema.

### Model
Created by `ko.Model()` or `ko.models()`. Represents a Model based on a supplied schema.
- `create([Object document])` Returns a model instance, optionally copying the values of the supplied *document*
- `count(Object query)` Returns a Promise that resolves to the number of models matching the
supplied MongoDB *query*.
- `deleteById(_id)` Deletes one model with the specified \_id. Returns a Promise that resolves to
the number of models deleted.
- `deleteMany(Object query)` Deletes all models matching the supplied MongoDB *query*. Returns
a Promise that resolves to the number of models deleted.
- `deleteOne(Object query)` Deletes the first model matching the supplied MongoDB *query*. Returns
a Promise that resolves to the number of models deleted.
- `find(Object query)` Finds all models matching the supplied MongoDB *query*. Returns a Cursor
object that can be used to sort, paginate, and join as an extension to the query.
- `findById(Object query)` Finds one model with the specified \_id. Returns a deferred Promise that
can be used to join as an extension to the *query*. Otherwise it behaves like a Promise.
- `findOne(Object query)` Finds the first model matching the supplied MongoDB query. Returns a deferred Promise that
can be used to join as an extension to the *query*. Otherwise it behaves like a Promise.

---
- `reference()` Returns a ModelReference object for use in other Models. Simple reference based
on \_id field. Typically called implicitly when passing a Model to a schema.
- `ref()` Shorthand for `reference()`
- `embed()` Returns a ModelReference object for use in other Models. A reference that includes
the reference as an embedded document, and also saves the embedded model to its own collection.
- `embedOnly()` Returns a ModelReference object for use in other Models. Same as `embed()` but
does not save a copy.

---
- `oncreate` The oncreate hook. Assign this to run a custom hook when a model is created.
- `prevalidate` The prevalidate hook. Assign this to run a custom hook before validation.
- `postvalidate` The postvalidate hook. Assign this to run a custom hook after validation.
- `presave` The presave hook. Assign this to run a custom hook before saving.
- `postsave` The postsave hook. Assign this to run a custom hook after saving.
- `predelete` The predelete hook. Assign this to run a custom hook.
- `postdelete` The postdelete hook. Assign this to run a custom hook.

---
- `createIndex(String field, Object options)` Creates an index on the collection that contains the
Model. See clients for available options.

### Instance
A model instance. An object whose keys are field names and whose values are the field values.
- `save()` Saves the model to the database, creating an \_id if it does not yet exist.
- `saveRefs()` Saves references that have been joined or embedded into Instances to the database.
- `saveAll()` Saves the model and its Instance members to the database.
- `delete()` Deletes the model from the database.
- `join([Array fields]|[Object fields])` Populates references on the specified fields to their full models. If
*fields* is not supplied, joins all references on the model. If *fields* is an object, performs
the join(s) with the specified projections, returning only partially joined references.
- `slice()` Returns a simple object (without prototype methods) that contains the data of the model.

### Cursor
A cursor object returned by `Model.find()`.
- `sort(Object params)` Sorts the results of the query by the supplied *params*. The object
contains field names, and a sort direction for each field name: 1 for ascending order, -1 for
descending.
- `skip(Number count)` Skips over the first *count* models when performing the query.
- `limit(Number count)` Limits the number of models returned by the query. When used together with
`skip` you can perform pagination.
- `join([Array fields])` Populates each model returned by the query, replacing references with the
full models they reference. Joins on specified *fields*. If fields is not supplied, joins all
references. If *fields* is an object, performs the join(s) with the specified projections,
returning only partially joined references.
- `then(Function callback)` Executes the query and returns a Promise that resolves to the found
models.
- `toArray(Function callback)` Alias for `then()`
- `forEach(Function callback)` Runs the *callback* for each model returned by the query, in order.

### NeDBClient(Object config)
The NeDBClient config looks like
```
{
    client: 'nedb',
    [filepath: '/path/to/db/directory'],
    [inMemory: true],
    [autocompactionInterval: Number interval]
}
```
where one of filepath or inMemory are supplied. Auto-compaction refers to NeDB's option to
periodically compact the database file to reduce size. This is measured in ms, and should be at least 5000.
- `close()` NeDB does not support close, so this method does nothing but issue a warning.
- `createIndex(String collection, String fieldName, Object options)` Creates an index on the
supplied collection and fieldName. Typically called implicitly by `Model.createIndex()`. The
available options are:
  * `unique` (optional, defaults to false) enforces uniqueness on the field.
  * `sparse` (optional, defaults to false) does not index documents on which the field is not
defined.
  * `expireAfterSeconds(Number seconds)` Removes documents from the database when the system time
exceeds the value of the field + *seconds*. Documents where the field is not defined or not a date
are ignored.

### MongoClient(Object config)
The MongoClient config looks like
```
{
    client: 'mongodb',
    [username: 'username'],
    [password: 'password'],
    [address: 'localhost:27017'],
    [database: 'the_db]',
    [url: 'mongodb://localhost:27017/the_db']
}
```
You can supply either the pieces of the connection string as properties (username, password, address, and database)
or a connection string (url)

- `close()` Closes the connection to the MongoDB server.
- `createIndex(String collection, String fieldName, Object options)` Creates an index on the
supplied collection and fieldName. Typically called implicitly by `Model.createIndex()`
As it calls createIndex directly on the underlying MongoClient, it supports
[the full gamut of MongoDB index options](https://docs.mongodb.com/manual/reference/method/db.collection.createIndex/#ensureindex-options).
- `client` The underlying MongoClient powering the backend. Could be useful for testing.
- `db` The underlying MongoDB database object. Could be useful for testing.

Changelog
---------
### 1.1
- Add `$push`, `$pop`, `$addToSet`, and `$pull` methods to array fields
- Work more efficiently with arrays and embedded documents
### 2.0 
- Coerce types when setting values on an instance and when performing queries
- Breaking: \_id field is of type ObjectID by default. To use another type you must specify it explicitly
- Breaking: Removed named hooks. Replaced with `isUpdated` instance method
### 2.1
- Add support for performing projections while joining, or "partial joins"
- Can join and project in the same query
- Certain conditions were preventing array operators from running correctly
- Use deepEqual comparison when determining which elements to $pull

Testing
-------
Although the project is still in its early stages, the code is reasonably well tested.
To run tests, run the command `npm test`. To test the MongoDB client, in the config.js
file in the test directory, change `testMongo` to true, and supply your MongoDB information.

Contact
-------
Bug reports, feature requests, and questions are all welcome: just open a Github issue
and I'll get back to you.
