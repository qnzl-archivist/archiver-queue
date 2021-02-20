const mongoose = require(`mongoose`)

const {
  SchemaTypes: {
    ObjectId,
  }
} = mongoose

const BackupSchema = new mongoose.Schema({
  complete: Boolean,
  url: String,
  date: Date,
  adhoc: Boolean,
  service: {
    type: ObjectId,
    ref: `Token`,
  },
  user: {
    type: ObjectId,
    ref: `User`,
  },
})

const Backup = mongoose.model(`Backup`, BackupSchema)

module.exports = Backup
