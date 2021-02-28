const child_process = require(`child_process`)
const { promisify } = require(`util`)
const debug = require(`debug`)(`qnzl:archivist:backup-script`)
const fetch = require(`node-fetch`)
const uuid = require(`uuid/v4`)
const fs = require(`fs`)

const SERVICE_MAP = {
  service: {
    url: `https://service.vercel.app`,
    // Can also be the API key
    accessToken: ``,
    // Can also be a secondary secret key or not assigned.
    refreshToken: ``,
    scopes: [
      `posts`,
    ],
  }
}

const BLOCK_STORAGE_PATH = `/mnt/blockstorage`

;(async () => {
  try {
    debug(`get backups`)
    const servicesToBackup = Object.keys(SERVICE_MAP)

    debug(`got ${backups.length} backups`)
    const backupPromises = servicesToBackup.map(async (serviceName) => {
      const {
        url,
        accessToken
      } = SERVICE_MAP[serviceName]

      debug(`get backup for ${serviceName}`)
      const authorization = Buffer.from(`${accessToken}:${refreshToken}`, `utf8`).toString(`base64`)

      const backupResp = await fetch(`${url}/api/pull?scope=${scopes.join(`,`)}`, {
        headers: {
          [`Authorization`]: `Bearer ${authorization}`
        },
      })

      debug(`backup: `, backupResp.ok)
      const buffer = await backupResp.buffer()

      const archivePath = `${BLOCK_STORAGE_PATH}/${uuid()}`

      debug(`write to ${archivePath}`)
      await promisify(fs.writeFile)(archivePath, buffer)
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
