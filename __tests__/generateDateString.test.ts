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
    const date = new Date(dateString);
    
    expect(date.getFullYear()).toBe(new Date().getFullYear());
    expect(date.getMonth() + 1).toBe(new Date().getMonth() + 1);
    expect(date.getDate()).toBe(new Date().getDate());
  });
});
