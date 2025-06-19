import { Command } from 'commander';

export const envCommand = new Command('env')
  .description('View the current environment variables for your project')
  .action(async () => {
    console.log('🚧 jetway env - Coming soon!');
    // TODO: Implement environment variable display
  }); 