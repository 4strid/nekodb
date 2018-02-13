# kodm
Tiny ODM for MongoDB

```javascript
ko.models({
	user: {
		name: ko.String[50],
		age: ko.Number
	}
})

var instance = ko.models.user.create()

instance.name = 'Joe'
instance.age = 100

instance.save()

// alternately

ko.models.user.create({
	name: 'Bob',
	age: 32
}).save()
.then(user => {
	console.log(user._id) // created by database
})

ko.models.user.find({}).then(function (users) {
	// do whatever you want with the docs
	// each element of the array is a ko model instance
	users[0].email = 'foo@email.com'
	users[0].save()
})

```



Consider this fairly early alpha quality code, suitable only for use in personal projects.

I'm just getting started!
