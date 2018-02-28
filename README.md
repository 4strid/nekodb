# NeKoDB
Tiny ODM for MongoDB. The Ne comes from NeDB, and Ko refers to the Japanese diminuitive "ko" (小) or little.

Quick Intro
------------

#### Connecting and creating schemas

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


#### Creating a model
```javascript```
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

#### Finding models
```javascript
ko.models.Celebrity.find({}).then(instances => {
	console.log(instances)
})
```

#### Updating a model
```javascript
ko.models.Celebrity.findOne({name: 'Kim Kardashian'}).then(instance => {
	instance.name = 'Kim Kardashian West'
	return instance.save()
})
```

#### Deleting models
```javascript
ko.models.Celebrity.deleteOne({name: 'Johnny Depp'})
```

#### Populating references
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
--------------

### Connecting to a backend

Before you can do anything else, you must connect to a backend. There are two options available: NeDB and MongoDB. To connect, call `ko.connect` and supply a configuration.

##### NeDB

Supply a file path where NeDB will store the database files. Alternatively, set 'inMemory' to true to use the in-memory client, without persisting the database.

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

##### MongoDB

Supply the information necessary to connect to MongoDB, as well as the name of the database to use.

You can omit username and password if they're not needed to connect.

```javascript
ko.connect({
	client: 'mongodb',
	username: 'root',
	password: 'mongopassword',
	address: 'localhost:27017',
	database: 'nekodb',
})
```

Note that you don't have to wait for a callback after connecting. You can just start issuing commands, which will be queued up and executed once
the database connection has been established. Though they are executed in order, if you need the results of one call in a subsequent call you
should still use a Promise chain to order your calls.

### Creating Schemas

To create a schema you can call `ko.models` as in the Quick Intro to create all your schemas at once, or individually with `ko.Model`. Since
typing ko.models every time you want to access a model can quickly become tiresome, you can create them one at a time and assign them each to a
variable.

```javascript
const User = ko.Model('User', {
	username: ko.String,
	password: ko.String,
	email: ko.Email
})
```

The first argument to `ko.Model` is the name of the model, which is the name of the collection and the property name with which it will be
attached to `ko.models`.

In this example, we can access the newly created model either by its variable name User, or at `ko.models.User`

The second argument is the schema to use, which is supplied as an object. The object's keys are the field names, and its values are typeclasses.
typeclasses will check to ensure instance values are of the correct type, and can also perform additional validation and set values, as we will
see shortly.

#### Builtin Types

The supported JavaScript types are:

- `String`
- `Number`
- `Boolean`
- `Date`
- `Array`
- `Object`
- `null`

We refer to them by their Ko Typeclasses. The available typeclasses are:

- `ko.String`
- `ko.Number`
- `ko.Boolean`
- `ko.Date`
- `ko.Array`
- `ko.Option`
- `ko.Document`
- `ko.null`

#### Shorthands

Rather than using `ko.Array`, `ko.Option`, `ko.Document`, or `ko.null`, directly, there are
shorthand methods to create them.

To specify that a field should contain an array of a certain type, pass an array containing one
typeclass. To specify a field that can contain varying types, pass an array containing more
than one typeclass. These can be nested. To create an array whose elements can be of differing
types, supply an array containing the array of options.

```javascript
const Model = ko.Model('Model', {
	array: [ko.Number],              // field must be an array of numbers
	option: [ko.Number, ko.String]   // field must be a number or a string
	optArr: [[ko.Number, ko.String]] // field must be an array of strings or numbers
})
```

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

##### Embedded documents

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

In this example, any instance of the Embedded model must contain an object in the `document` field
and that document must contain the fields embeddedField and embeddedNum.

##### Constants

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

##### Length limited strings

To specify that a string should have a maximum length, you can use square brackets on ko.String
passing in the desired maximum length.

```javascript
const MaxLength = ko.Model('MaxLength', {
	string: ko.String[10]
})
```

#### Validators

In addition to checking the type, each builtin typeclass contains a number of validator methods
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

The full list of validators available is found below in the API reference.

#### Values

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

#### References

To specify that a field should contain a reference to a model, you can simply supply that model.

```javascript
const Author = ko.Model('Author', {
	name: ko.String,
	email: ko.Email
})

const BlogPost = ko.Model('BlogPost', {
	title: ko.String,
	body: ko.String,
	author: Author
})
```

To reference a Model that has not been created yet, or to reference it without access to 
the variable it was saved to (for instance, if requiring it would cause a circular dependency)
you can refer to the Model by its name on `ko.models`

```javascript
const Blog = ko.Model('Blog', {
	owner: ko.models.Author,
	posts: [ko.models.BlogPost],
})
```

##### Embedding models

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
	comments: [Comment.embed()]
})
```

By default, embedding a document saves a copy of it in its collection. To avoid this, use
`embedOnly`. Currently, updating and saving an embedded model that is embedded will update it
in its collection, but saving an embedded model directly will not update the models it is
referenced in. This will change in a future version. For now, you can consider embedded models
you find on their own read-only.

### Creating Models

#### Saving

### Finding Models

#### Query Syntax

#### Projections

#### Sorting and Paginating

### Counting Models

### Updating Models

Currently you can't use either client's native update methods as they would bypass validation.
I plan to support this in a later version.

### Deleting Models

If `predelete` or `postdelete` hooks are specified, they will be run for each instance using
any method to delete the model.

### Model References

#### Joining an instance

#### Joining as part of find and findOne

### Hooks

##### oncreate
##### prevalidate
##### postvalidate
##### presave
##### postsave
##### predelete
##### postdelete

### Indexing

API Reference
-------------

Testing
-------
Although the project is still in its early stages, the code is reasonably well tested. To run tests, run the command `npm test`. To test the MongoDB client, in the config.js file in the test directory, change testMongo to true, and supply your MongoDB information.

Contact
-------

Bug reports, feature requests, and questions are all welcome: just open a Github issue and I'll get back to you.


