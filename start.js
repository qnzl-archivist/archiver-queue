const child_process = require(`child_process`)
const { promisify } = require(`util`)
const mongoose = require(`mongoose`)
const moment = require(`moment`)
const debug = require(`debug`)(`qnzl:archivist:backup-script`)
const fetch = require(`node-fetch`)
const uuid = require(`uuid/v4`)
const fs = require(`fs`)

const Backup = require(`./models/Backup`)
const Token = require(`./models/Token`)
const User = require(`./models/User`)

mongoose.connect(process.env.MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})

const SERVICE_MAP = {
  twitter: `https://amos-twitter.vercel.app`,
  todoist: `https://todoist.now.sh`,
  trello: `https://trello-taupe-beta.now.sh`,
  youtube: `https://amos-youtube.vercel.app`,
}

//const BLOCK_STORAGE_PATH = `/home/maddie/test-archivist`
const BLOCK_STORAGE_PATH = `/mnt/blockstorage`

;(async () => {
  try {
    debug(`get backups`)
    const backups = await Backup.find({
      complete: false,
      date: {
        $lte: new Date(),
      },
    }).populate(`service`).populate(`user`)

    debug(`got ${backups.length} backups`)
    const backupPromises = backups.map(async (backup) => {
      if (!backup.service) {
        // Ignore + complete backups that have missing tokens.
        // This can happen due to unlinked services.
        backup.complete = true

        await backup.save()

        return Promise.resolve()
      }

      const {
        service: {
          _id: tokenId,
          serviceName,
          accessToken,
          refreshToken,
          scopes,
        },
        user: {
          _id: userId,
        },
      } = backup

      debug(`get backup for ${serviceName}`)
      const serviceUrl = SERVICE_MAP[serviceName]

      const authorization = Buffer.from(`${accessToken}:${refreshToken}`, `utf8`).toString(`base64`)

      const backupResp = await fetch(`${serviceUrl}/api/pull?scope=${scopes.join(`,`)}`, {
        headers: {
          [`Authorization`]: `Bearer ${authorization}`
        },
      })

      debug(`backup: `, backupResp.ok)
      const buffer = await backupResp.buffer()

      const archivePath = `${BLOCK_STORAGE_PATH}/${uuid()}`

/*      if (serviceName === `youtube`) {
        const stringifiedResp = buffer.toString(`utf8`)

        const resp = JSON.parse(stringifiedResp)
      }*/

      debug(`write to ${archivePath}`)
      await promisify(fs.writeFile)(archivePath, buffer)

      backup.url = archivePath
      backup.complete = true

      await backup.save()

      if (!backup.adhoc) {
        await Backup.create({
          user: userId,
          service: tokenId,
          date: moment().add(1, `month`).toDate(),
        })
      }
    })

    const allSettled = backupPromises.map((backup) => {
      return backup
        .then((res) => Promise.resolve({ message: 'resolved', value: res }))
        .catch((err) => Promise.resolve({ message: err, value: null }))
    })

    await Promise.all(allSettled)

    process.exit(0)
  } catch (e) {
    console.error(`Error occurred retrieving backups:`, e)

    process.exit(1)
  }
})()
