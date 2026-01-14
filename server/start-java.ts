import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function startJavaBackend(): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log('[java] Starting Java Spring Boot backend on port 5001...');
    
    const backendDir = path.join(__dirname, '..', 'backend');
    
    const mvn = spawn('mvn', ['spring-boot:run'], {
      cwd: backendDir,
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: false,
    });
    
    let started = false;
    
    mvn.stdout?.on('data', (data: Buffer) => {
      const output = data.toString();
      if (output.includes('Started RentFlowApplication')) {
        console.log('[java] Spring Boot backend started successfully!');
        started = true;
        resolve();
      }
    });
    
    mvn.stderr?.on('data', (data: Buffer) => {
      const error = data.toString();
      if (error.includes('ERROR')) {
        console.error('[java]', error);
      }
    });
    
    mvn.on('error', (err) => {
      console.error('[java] Failed to start Java backend:', err.message);
      reject(err);
    });
    
    mvn.on('close', (code) => {
      if (!started && code !== 0) {
        console.error(`[java] Java backend exited with code ${code}`);
      }
    });
    
    // Timeout after 60 seconds
    setTimeout(() => {
      if (!started) {
        console.log('[java] Timeout waiting for backend, but continuing anyway...');
        resolve();
      }
    }, 60000);
  });
}
