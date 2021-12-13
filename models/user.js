const mongoose = require('mongoose');
const { Schema } = mongoose;
const passportLocalMongoose = require('passport-local-mongoose');

const userSchame = new Schema(
	{
		email: {
			type: String,
			required: [ true, 'please provide your email' ],
			unique: true,
			lowercase: true
		},
		name: {
			type: String,
			required: true,
			default: 'Anonymous'
		},
		active: {
			type: Boolean,
			default: false
		}
	},
	{
		timestamps: true
	}
);

userSchame.plugin(passportLocalMongoose);

const User = mongoose.model('User', userSchame);

module.exports = User;
