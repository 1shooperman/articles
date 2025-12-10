import { generateDateString } from '../create-article';

describe('generateDateString', () => {
  it('should generate date in YYYY-MM-DD format', () => {
    const dateString = generateDateString();
    expect(dateString).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('should generate valid date format', () => {
    const dateString = generateDateString();
    const [year, month, day] = dateString.split('-').map(Number);
    
    expect(year).toBeGreaterThanOrEqual(2020);
    expect(year).toBeLessThanOrEqual(2100);
    expect(month).toBeGreaterThanOrEqual(1);
    expect(month).toBeLessThanOrEqual(12);
    expect(day).toBeGreaterThanOrEqual(1);
    expect(day).toBeLessThanOrEqual(31);
  });

  it('should pad month and day with zeros', () => {
    const dateString = generateDateString();
    const parts = dateString.split('-');
    
    expect(parts[1].length).toBe(2);
    expect(parts[2].length).toBe(2);
  });

  it('should generate current date', () => {
    const dateString = generateDateString();
    const date = new Date(dateString + 'T00:00:00');
    const now = new Date();
    
    expect(date.getFullYear()).toBe(now.getFullYear());
    expect(date.getMonth() + 1).toBe(now.getMonth() + 1);
    // Allow for timezone differences - check within 1 day
    const dayDiff = Math.abs(date.getDate() - now.getDate());
    expect(dayDiff).toBeLessThanOrEqual(1);
  });
});
