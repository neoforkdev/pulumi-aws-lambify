import { Command } from 'commander';
import { createRequire } from 'module';
import { initCommand } from './cli/commands/init';
import { deployCommand } from './cli/commands/deploy';
import { destroyCommand } from './cli/commands/destroy';
import { statusCommand } from './cli/commands/status';
import { devCommand } from './cli/commands/dev';
import { mockCommand } from './cli/commands/mock';
import { openapiCommand } from './cli/commands/openapi';
import { configCommand } from './cli/commands/config';
import { envCommand } from './cli/commands/env';
import { EmojiUtils } from './core/logger/utils';
import { Logger } from './core/logger';

const require = createRequire(import.meta.url);
const packageJson = require('../package.json');

const logger = new Logger("CLI");
const program = new Command();

program
  .name('jetway')
  .description(EmojiUtils.emoji`✈️  Jetway - Your API just boarded first class`)
  .version(packageJson.version);

// Register commands
program.addCommand(initCommand);
program.addCommand(deployCommand);
program.addCommand(destroyCommand);
program.addCommand(statusCommand);
program.addCommand(devCommand);
program.addCommand(mockCommand);
program.addCommand(openapiCommand);
program.addCommand(configCommand);
program.addCommand(envCommand);

// Parse arguments
program.parse(); 