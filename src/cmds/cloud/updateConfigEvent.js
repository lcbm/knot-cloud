/* eslint-disable no-console */
import yargs from 'yargs';
import fs from 'fs';
import chalk from 'chalk';
import { Client } from '@cesarbr/knot-cloud-sdk-js';
import options from './utils/options';
import getFileCredentials from './utils/getFileCredentials';

const getFileConfig = (filePath) => {
  const rawData = fs.readFileSync(filePath);
  const config = JSON.parse(rawData);
  return {
    'sensor-id': config.sensorId,
    change: config.change,
    'time-sec': config.timeSec,
    'lower-threshold': config.lowerThreshold,
    'upper-threshold': config.upperThreshold,
  };
};

const updateConfigEvent = async (args) => {
  const client = new Client({
    hostname: args.server,
    port: args.port,
    protocol: args.protocol,
    username: args.username,
    password: args.password,
    token: args.token,
  });

  const config = {
    sensorId: args.sensorId,
    event: {
      change: (args.change === 'true'),
      timeSec: args.timeSec,
      lowerThreshold: args.lowerThreshold,
      upperThreshold: args.upperThreshold,
    },
  };

  await client.connect();
  const response = await client.updateConfig(args.thingId, [config]);
  console.log(response);
  await client.close();
};

yargs
  .config('credentials-file', path => getFileCredentials(path))
  .config('event-file', path => getFileConfig(path))
  .command({
    command: 'update-config-event <thing-id> <sensor-id> [change] [timeSec] [lowerThreshold] [upperThreshold]',
    desc: 'Update a thing schema',
    builder: (_yargs) => {
      _yargs
        .options(options)
        .positional('sensor-id', {
          describe: 'Sensor ID',
          demandOption: true,
          default: 0,
        })
        .positional('change', {
          describe: 'enable sending sensor data when its value changes',
          demandOption: false,
          default: true,
        })
        .positional('time-sec', {
          describe: 'time interval in seconds that indicates when data must be sent to the cloud',
          demandOption: false,
          default: 10,
        })
        .positional('lower-threshold', {
          describe: 'send data to the cloud if it is lower than this threshold',
          demandOption: false,
          default: 1000,
        })
        .positional('upper-threshold', {
          describe: 'send data to the cloud if it is upper than this threshold',
          demandOption: false,
          default: 3000,
        });
    },
    handler: async (args) => {
      try {
        await updateConfigEvent(args);
        console.log(chalk.green(`thing ${args.thingId} config updated`));
      } catch (err) {
        console.log(chalk.red('it was not possible to update the thing\'s config :('));
        console.log(chalk.red(err));
      }
    },
  });
