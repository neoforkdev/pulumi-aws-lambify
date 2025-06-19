import { Command } from 'commander';

export const initCommand = new Command('init')
  .description('Initialize a new Jetway project in the current directory')
  .action(async () => {
    console.log('🚧 jetway init - Coming soon!');
    // TODO: Implement project initialization
  }); 