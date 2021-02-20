const mongoose = require(`mongoose`)

const UserSchema = new mongoose.Schema({
  email: String,
  issuer: String,
  lastLoginAt: Date,
  profile: {
    isActive: Boolean,
    subscriptionId: String,
    plan: String,
    customerId: String,
  }
}, { skipVersioning: { profile: true } })

const User = mongoose.model(`User`, UserSchema)

module.exports = User
