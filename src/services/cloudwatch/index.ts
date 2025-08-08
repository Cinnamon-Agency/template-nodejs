import {
  CloudWatchLogsClient,
  CreateLogGroupCommand,
  PutLogEventsCommand,
  DescribeLogStreamsCommand,
  CreateLogStreamCommand,
} from '@aws-sdk/client-cloudwatch-logs'
import config from '@core/config'
import { logger } from '@core/logger'

const logGroupName = `${config.NODE_ENV}-api`
const logStreamName = `${config.NODE_ENV}-api`

const cloudwatchConfog =
  config.NODE_ENV === 'dev'
    ? {
        credentials: {
          secretAccessKey: config.AWS_SECRET,
          accessKeyId: config.AWS_ACCESS_KEY,
        },
        region: config.AWS_REGION,
      }
    : {
        region: config.AWS_REGION,
      }

const client = new CloudWatchLogsClient(cloudwatchConfog)

const createLogGroupAndStream = async () => {
  try {
    await client.send(new CreateLogGroupCommand({ logGroupName }))
    logger.info(`Log group ${logGroupName} created.`)
  } catch (err: any) {
    if (err.name !== 'ResourceAlreadyExistsException') {
      logger.error(`Error creating log group: ${err}`)
      return
    }
  }

  try {
    await client.send(
      new CreateLogStreamCommand({ logGroupName, logStreamName })
    )
    logger.info(`Log stream ${logStreamName} created.`)
  } catch (err: any) {
    if (err.name !== 'ResourceAlreadyExistsException') {
      logger.error(`Error creating log stream: ${err}`)
    }
  }
}

export const sendLogEvents = async (message: string) => {
  try {
    await createLogGroupAndStream()
    const describeLogStreamsResponse: any = await client.send(
      new DescribeLogStreamsCommand({
        logGroupName,
        logStreamNamePrefix: logStreamName,
      })
    )

    const logStream = describeLogStreamsResponse.logStreams.find(
      (stream: any) => stream.logStreamName === logStreamName
    )
    const sequenceToken = logStream.uploadSequenceToken

    const logEvents = [
      {
        message,
        timestamp: Date.now(),
      },
    ]

    const putLogEventsCommand = new PutLogEventsCommand({
      logGroupName,
      logStreamName,
      logEvents,
      sequenceToken,
    })

    await client.send(putLogEventsCommand)
  } catch (err) {
    logger.error(`Error sending log events: ${err}`)
  }
}
