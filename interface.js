const ko = require('kodbm')

ko.models({
	users: {
		//username: 
		//password: ,
		//email: /^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/,
		name: ko.String[50],
		username: ko.String[20].match(/^[a-zA-Z0-9_\-\.~[\]@!$'()\*+;,= ]{2,20}$/),
		password: ko.String[50], // this is the password before it's transformed
		email: ko.Email,
		searchname: ko.String[100],
	},
	hosts: {
		hostname: ko.String[100],
		module: ko.String[100],
		admins: [ko.models.users.key['username']]
	}
})

const newUser = ko.models.user.create({
	name: 'whatever',
	username: 'whatever',
	whatever: 'etc',
})

newUser.save()

ko.models.user.findOne({username: /username/i}).then(function (user) {
	user.password = newPassword
	return user.save()
})
// that's way better than doing it by hand
ko.models.user.update({username: /username/i}, {}, {password: {$set: newPassword}})










ko.feszbook.models({
	user,
	family: {
		name: ko.String[100],
		member: [ko.models.user]
	},
	post: {
		author: ko.models.user,
		family: ko.models.family,
		date: ko.Date.now,
		content: ko.contentblocks.models.content.embed
	},
	photo: {
		url: ko.Url,
		family: ko.models.family,
	},
})

ko.contentblocks.models({
	text: {
		type: 'text',
		text: ko.String,
	},
	title: {
		type: 'title',
		text: ko.String,
	},
	photo: {
		type: 'photo',
		url: ko.Url,
		caption: ko.models.text
	},
	album: {
		type: 'album',
		title: ko.models.title,
		caption: ko.models.text,
		photos: [ko.models.photo]
	},
	content: [[
		ko.contentblocks.models.text,
		ko.contentblocks.models.title,
		ko.contentblocks.models.photo,
		ko.contentblocks.models.album,
	]],
})















const db = require('diet-db')
const ko = db.ko

db.models({
	user: Users.schema({
		//facebook: ko.Url,
		//vk: ko.Url,
		admin: ko.Boolean
	}),
	youtube: {
		url: ko.String,
		caption: ko.String,
		category: ['whatever', 'idk', 'etc']
	},
	lit: {
		title: ko.String,
		filename: ko.String,
	},
	penpal: {
		message: ko.String,
		//user: ko.models.user
		name_en: [ko.String, null],
		name_rus: [ko.String, null],
		email: [ko.Email, null],
		facebook: [ko.Url, null],
		vk: [ko.Url, null],
	},
	news: {
		date: ko.Date.now,
		blurb: ko.String,
	}
})

app.route('/db/manage', auth.ensureLoggedIn, permissions.isAdmin, db.routes.manage)
app.route('/api/penpal', db.routes.penpal.post)

app.get('/vid', function ($) {
	db.models.youtube.find({}).then(function (videos) {
		$.data.videos = videos
		$.html()
		$.end()
	})
})
