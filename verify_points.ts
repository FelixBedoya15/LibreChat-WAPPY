
import { ARTICLE_16_STANDARDS, getTotalPoints } from './client/src/components/SGSST/checklistData';

console.log('Total Items:', ARTICLE_16_STANDARDS.length);
console.log('Total Points:', getTotalPoints(ARTICLE_16_STANDARDS));

// Group by category to find discrepancies
const groups: Record<string, number> = {};
ARTICLE_16_STANDARDS.forEach(item => {
    const key = item.category; // or subcategory
    groups[key] = (groups[key] || 0) + item.points;
});
console.log('Points by Category:', groups);

const subGroups: Record<string, number> = {};
ARTICLE_16_STANDARDS.forEach(item => {
    const key = item.subcategory;
    subGroups[key] = (subGroups[key] || 0) + item.points;
});
console.log('Points by Subcategory:', subGroups);
