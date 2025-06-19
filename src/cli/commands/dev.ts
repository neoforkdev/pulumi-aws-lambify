import { Command } from 'commander';

export const devCommand = new Command('dev')
  .description('Run a local development server with routing and hot reload')
  .action(async () => {
    console.log('🚧 jetway dev - Coming soon!');
    // TODO: Implement development server
  }); 