const ko = require('kodbm')

ko.models({
	users: {
		//username: /^[a-zA-Z0-9_\-\.~[\]@!$'()\*+;,= ]{2,20}$/,
		//password: ,
		//email: /^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/,
		//name: /.{2-30}/,
		username: ko.String[25],
		password: ko.String[100],
		email: ko.Email,
		searchname: ko.String[100],
		$$validate: {
			username: {
				rule: /^[a-zA-Z0-9_\-\.~[\]@!$'()\*+;,= ]{2,20}$/,
				message: 'Try a different username'
			},
			password: {
				rule: /.{8,}/,
				message: 'Must be at least 8 characters long'
			}
		}
	},
	hosts: {
		hostname: ko.String[100],
		module: ko.String[100],
		admins: [ko.models.users.key['username']]
	}
})

ko.feszbook.models({
	user,
	family: {
		name: ko.String[100],
		member: [ko.models.user]
	},
	post: {
		author: ko.models.user,
		family: ko.models.family,
		date: ko.Date.now
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
	db.models.youtube.find({}, function (err, docs) {
		$.data.videos = docs
		$.html()
		$.end()
	})
})
