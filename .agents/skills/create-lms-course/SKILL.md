---
name: create-lms-course
description: >-
  Design, structure, generate rich lessons, quizzes, and database seeding scripts for WAPPY LMS courses.
---

# WAPPY LMS Course Creation Skill

This skill guides the creation of full interactive courses for the WAPPY LMS (SST, Tech, IA, or Regulatory).

---

## 1. Course Specification & Structure

Each course in WAPPY follows the MongoDB `Course` model schema:
- **`title`**: Clear, professional course title.
- **`description`**: Summary highlighting target audience and learning objectives.
- **`thumbnail`**: Unsplash / hosted image URL or asset reference from `Agentes/Miniaturas/Cursos/`.
- **`tags`**: Category tags (e.g., `['SST', 'Alturas', 'Formativo']`, `['IA', 'Gemini', 'Productividad']`).
- **`isPublished`**: Boolean flag (`true` or `false`).
- **`lessons`**: Array of lessons, each containing:
  - `title`: e.g., `"1. Introducción al SG-SST"`
  - `content`: Rich Markdown content with headings, bullet points, key takeaways, and callout alerts.
  - `videoUrl`: (Optional) YouTube / Loom / MP4 URL.
  - `order`: Numeric ascending order index (`1`, `2`, `3`...).
- **`quiz`** (Optional / Evaluation): Array of questions with options, correct answers, and feedback.

---

## 2. Step-by-Step Generation Workflow

### Step 1: Curriculum & Instructional Design
1. Define 3 to 6 logical learning modules/lessons.
2. Outline specific practical takeaways per lesson.

### Step 2: Content Writing
- Format all lesson content in clean Markdown (`### Subheadings`, `**bold terms**`, `- lists`).
- Include real-world case studies, regulatory references (e.g., Resolution 0312, GTC-45, ISO standards if SST).

### Step 3: Seeding Script Generation
Generate or update a standalone seed script (or append to `seed-lms.js` / custom seeder):
```javascript
const sampleCourse = new Course({
  title: '...',
  description: '...',
  thumbnail: '...',
  tags: ['...'],
  isPublished: true,
  lessons: [
    { title: '...', content: '...', order: 1 }
  ]
});
```

### Step 4: Verification
Run syntax check and execute seeder:
```bash
node seed-lms.js
```
