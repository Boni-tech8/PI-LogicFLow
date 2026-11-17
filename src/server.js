import fs from 'node:fs';
import { env } from './config/env.js';
import app from './app.js';
import { startDeadlineReminders } from './jobs/deadlineReminders.js';

fs.mkdirSync('uploads', { recursive: true });
app.listen(env.PORT, () => {
  console.log(`Logicflow API em http://localhost:${env.PORT}`);
  startDeadlineReminders();
});
