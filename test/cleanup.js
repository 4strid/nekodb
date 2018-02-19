const path = require('path')
const fs = require('fs')
const promisify = require('util').promisify
const unlink = promisify(fs.unlink)

const test = require('tape')

function deleteTestFiles (cb) {
	fs.readdir(path.join(__dirname, '../db'), (err, files) => {
		const deleteFiles = files
								.filter(file => file.startsWith('ko_db_test'))
								.map(file => unlink(path.join(__dirname, '../db', file)))

		return Promise.all(deleteFiles).then(() => {
			if (cb) {
				cb()
			}
		}).catch(err => {
			console.error(err)
			if (cb) {
				cb()
			}
		})
	})
}

module.exports = {
	deleteTestFiles,
}

test.onFinish(deleteTestFiles)
