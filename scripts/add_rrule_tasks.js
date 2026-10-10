const fs = require('fs');
const path = require('path');

const files = [
  path.join(__dirname, '..', 'src', 'app', 'module', 'task', 'new_task.json'),
  path.join(__dirname, '..', 'src', 'app', 'module', 'task', 'household_tasks.json'),
];

function mapRecurrenceToRRule(recurrence) {
  if (!recurrence || typeof recurrence !== 'string') return '';
  let s = recurrence.toLowerCase().trim();

  // If there is a slash like "Daily/As needed", prefer the first part
  if (s.includes('/')) s = s.split('/')[0].trim();

  // direct mapping
  if (s.includes('daily')) return 'FREQ=DAILY';
  if (s.includes('weekly')) {
    // check for specific intervals like "every 2 weeks"
    const m = s.match(/every\s+(\d+)\s+weeks?/);
    if (m) return `FREQ=WEEKLY;INTERVAL=${m[1]}`;
    return 'FREQ=WEEKLY';
  }
  if (s.includes('every') && s.includes('week')) {
    const m = s.match(/every\s+(\d+)\s+week/);
    if (m) return `FREQ=WEEKLY;INTERVAL=${m[1]}`;
  }
  if (s.includes('monthly')) return 'FREQ=MONTHLY';
  if (s.includes('every') && s.includes('month')) {
    const m = s.match(/every\s+(\d+)\s+months?/);
    if (m) return `FREQ=MONTHLY;INTERVAL=${m[1]}`;
    if (s.includes('every 3 months') || s.includes('quarterly')) return 'FREQ=MONTHLY;INTERVAL=3';
  }
  if (s.includes('every 3 months') || s.includes('quarterly')) return 'FREQ=MONTHLY;INTERVAL=3';
  if (s.includes('every 6 months')) return 'FREQ=MONTHLY;INTERVAL=6';
  if (s.includes('every 12 months') || s.includes('year') || s.includes('yearly')) return 'FREQ=YEARLY';
  if (s.includes('season') || s.includes('seasonally')) return 'FREQ=MONTHLY;INTERVAL=3';
  if (s.includes('after each use') || s.includes('as needed') || s.includes('asneeded')) return '';
  if (s.includes('every 2 weeks') || s.includes('every 2 week') || s.includes('2 weeks')) return 'FREQ=WEEKLY;INTERVAL=2';

  // generic match: every N (day|week|month|year)
  const generic = s.match(/every\s+(\d+)\s+(day|week|month|year)s?/);
  if (generic) {
    const n = generic[1];
    const unit = generic[2];
    const freqMap = { day: 'DAILY', week: 'WEEKLY', month: 'MONTHLY', year: 'YEARLY' };
    return `FREQ=${freqMap[unit]};INTERVAL=${n}`;
  }

  // fallback: return empty string for ambiguous recurrence
  return '';
}

function processFile(filePath) {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(raw);

    let updated = false;

    Object.keys(data).forEach((section) => {
      const items = data[section];
      if (Array.isArray(items)) {
        items.forEach((it) => {
          if (it && typeof it === 'object') {
            const existing = it.rrule;
            const rrule = mapRecurrenceToRRule(it.recurrence);
            // only set if different or missing
            if (existing !== rrule) {
              it.rrule = rrule;
              updated = true;
            }
          }
        });
      }
    });

    if (updated) {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
      console.log(`Updated ${filePath}`);
    } else {
      console.log(`No changes for ${filePath}`);
    }
  } catch (err) {
    console.error(`Error processing ${filePath}:`, err);
    process.exitCode = 2;
  }
}

files.forEach(processFile);

console.log('Done.');
