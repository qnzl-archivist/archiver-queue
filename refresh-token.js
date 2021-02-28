const child_process = require(`child_process`)
const { promisify } = require(`util`)
const mongoose = require(`mongoose`)
const moment = require(`moment`)
const debug = require(`debug`)(`qnzl:archivist:refresh-token`)
const fetch = require(`node-fetch`)
const uuid = require(`uuid/v4`)
const fs = require(`fs`)

const Token = require(`./models/Token`)
const User = require(`./models/User`)

mongoose.connect(process.env.MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})

const SERVICE_MAP = {
  twitter: `https://amos-twitter.vercel.app`,
  youtube: `https://amos-youtube.vercel.app`,
  todoist: `https://todoist.now.sh`,
}

;(async () => {
  try {
    debug(`refresh tokens`)
    const tokens = await Token.find({
      expiresAt: {
        $lte: new Date(),
      },
    })

    debug(`got ${tokens.length} tokens`)
    const tokenPromises = tokens.map(async (token) => {
      const {
        serviceName,
        accessToken,
        refreshToken,
      } = token

      debug(`get token refreshed for ${serviceName}`)
      const serviceUrl = SERVICE_MAP[serviceName]

      const authorization = Buffer.from(`${accessToken}:${refreshToken}`, `utf8`).toString(`base64`)

      const refreshResp = await fetch(`${serviceUrl}/api/refresh-token`, {
        headers: {
          [`Authorization`]: `Bearer ${authorization}`
        },
      })

      debug(`refresh request is ok?: `, refreshResp.ok, refreshResp)

      if (refreshResp.ok) {
        const refreshedTokens = await backupResp.json()

        // TODO WIP
     //   token.accessToken = ``
      //  token.refreshToken = ``

        //await token.save()

      }
    })

    const allSettled = tokenPromises.map((backup) => {
      return backup
        .then((res) => Promise.resolve({ message: 'resolved', value: res }))
        .catch((err) => Promise.resolve({ message: err, value: null }))
    })

    await Promise.all(allSettled)

    process.exit(0)
  } catch (e) {
    console.error(`Error occurred refreshing tokens:`, e)

    process.exit(1)
  }
})()

