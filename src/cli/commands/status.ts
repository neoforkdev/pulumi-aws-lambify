import { Command } from 'commander';

export const statusCommand = new Command('status')
  .description('Display the deployment status and endpoint information')
  .action(async () => {
    console.log('🚧 jetway status - Coming soon!');
    // TODO: Implement status check logic
  }); 