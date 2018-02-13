function ModelReference (model, stub, type) {
	if (model) {
		this.model = model
	} else if (stub) {
		this.stub = stub
	}
	this.type = type
}

ModelReference.prototype.validate = function (value) {
	if (!this.model) {
		this.model = this.stub.models[this.stub.name]
	}
	return this[this.type](value)
}

ModelReference.prototype.reference = function (value) {
	return this.model.count({_id: value})
	.then(count => count === 1)
}

ModelReference.prototype.embed = function (value) {
	return new Promise((resolve, reject) => {
		this.model.validate(value).then(() => {
			resolve(true)
		})
		.catch(errors => {
			resolve(errors)
		})
	})
}

ModelReference.prototype.embedOnly = ModelReference.prototype.embed

module.exports = ModelReference

// todo: refBackref, backref, embedOnly, embedBackref, embedPartial
// pushBackref, refPushBackref, embedPushBackref
// yikes?
// 
// actually, ideally, ModelReferences can call additional methods on themselves
// to add additional functionality
//
// e.g.
// ko.models({
//     host: {
//     		admin: ko.models.user.ref().pushBackRef()
//     }
// })
//
// that might be too verbose though
