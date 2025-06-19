import { Command } from 'commander';

const setCommand = new Command('set')
  .description('Set or update a Jetway configuration value')
  .argument('<key>', 'Configuration key')
  .argument('<value>', 'Configuration value')
  .action(async (key: string, value: string) => {
    console.log(`🚧 jetway config set ${key}=${value} - Coming soon!`);
    // TODO: Implement configuration management
  });

export const configCommand = new Command('config')
  .description('Jetway configuration management')
  .addCommand(setCommand); 