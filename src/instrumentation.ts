'use server'

import InfluxWriter from './server/influxdb'

const settingsFile = './config/settings.yml'

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Settings
    const { YamlSettings } = await import('./server/settings')
    const settings = new YamlSettings(settingsFile)
    settings.initWithEnvVars()

    // Influx data writer
    const { getDevices } = await import('./app/actions')
    const influxHost = settings.get('INFLUX_HOST')
    const influxToken = settings.get('INFLUX_TOKEN')
    const influxOrg = settings.get('INFLUX_ORG')
    const influxBucket = settings.get('INFLUX_BUCKET')
    const influxInterval = settings.get('INFLUX_INTERVAL')

    let interval
    if (influxHost && influxToken && influxOrg && influxBucket) {
      interval = setInterval(async () => {
        const { devices } = await getDevices()
        const influxdata = new InfluxWriter(influxHost, influxToken, influxOrg, influxBucket)
        const writePromises = (devices || []).map((device) => influxdata.writePoint(device, new Date()))
        await Promise.all(writePromises)
        await influxdata.close()
      }, influxInterval * 1000)
    } else {
      clearInterval(interval)
    }
  }
}
