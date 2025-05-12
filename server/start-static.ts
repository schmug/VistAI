import dotenv from 'dotenv';
import { startStaticServer } from './api-server';

// Load environment variables
dotenv.config();

// Start the standalone static server
console.log('Starting static AI Search Engine server...');
startStaticServer()
  .then(() => {
    console.log('Server ready - visit http://localhost:5000/simple/ in your browser');
  })
  .catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });