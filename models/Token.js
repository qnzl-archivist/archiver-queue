const mongoose = require(`mongoose`)

const {
  SchemaTypes: {
    ObjectId,
  }
} = mongoose

const TokenSchema = new mongoose.Schema({
  serviceName: String,
  accessToken: String,
  refreshToken: String,
  expiresAt: Date,
  scopes: [String],
  user: {
    type: ObjectId,
    ref: `User`,
  },
})

const Token = mongoose.model(`Token`, TokenSchema)

module.exports = Token
