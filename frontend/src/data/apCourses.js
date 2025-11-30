const courseGroups = [
  {
    subject: "AP Capstone Diploma Program",
    courses: [
      { id: "ap-research", name: "AP Research", submissionMode: "essay" },
      { id: "ap-seminar", name: "AP Seminar", submissionMode: "essay" },
    ],
  },
  {
    subject: "Arts",
    courses: [
      {
        id: "ap-studio-art-2d",
        name: "AP 2-D Art and Design",
        submissionMode: "upload",
        aliases: ["AP Studio Art: 2D Design"],
      },
      {
        id: "ap-studio-art-3d",
        name: "AP 3-D Art and Design",
        submissionMode: "upload",
        aliases: ["AP Studio Art: 3D Design"],
      },
      { id: "ap-drawing", name: "AP Drawing", submissionMode: "upload" },
      { id: "ap-art-history", name: "AP Art History", submissionMode: "essay" },
      { id: "ap-music-theory", name: "AP Music Theory", submissionMode: "upload" },
    ],
  },
  {
    subject: "English",
    courses: [
      {
        id: "ap-english-language",
        name: "AP English Language and Composition",
        submissionMode: "essay",
        aliases: ["AP English Language & Composition"],
      },
      {
        id: "ap-english-literature",
        name: "AP English Literature and Composition",
        submissionMode: "essay",
        aliases: ["AP English Literature & Composition"],
      },
    ],
  },
  {
    subject: "History and Social Sciences",
    courses: [
      { id: "ap-african-american-studies", name: "AP African American Studies", submissionMode: "essay" },
      {
        id: "ap-comparative-government-and-politics",
        name: "AP Comparative Government and Politics",
        submissionMode: "essay",
      },
      { id: "ap-european-history", name: "AP European History", submissionMode: "essay" },
      { id: "ap-human-geography", name: "AP Human Geography", submissionMode: "essay" },
      { id: "ap-macroeconomics", name: "AP Macroeconomics", submissionMode: "essay" },
      { id: "ap-microeconomics", name: "AP Microeconomics", submissionMode: "essay" },
      { id: "ap-psychology", name: "AP Psychology", submissionMode: "essay" },
      {
        id: "ap-government-politics-us",
        name: "AP United States Government and Politics",
        submissionMode: "essay",
        aliases: ["AP U.S. Government & Politics"],
      },
      { id: "ap-united-states-history", name: "AP United States History", submissionMode: "essay" },
      {
        id: "ap-world-history",
        name: "AP World History: Modern",
        submissionMode: "essay",
        aliases: ["AP World History"],
      },
    ],
  },
  {
    subject: "Math and Computer Science",
    courses: [
      { id: "ap-calculus-ab", name: "AP Calculus AB", submissionMode: "upload" },
      { id: "ap-calculus-bc", name: "AP Calculus BC", submissionMode: "upload" },
      { id: "ap-computer-science-a", name: "AP Computer Science A", submissionMode: "upload" },
      {
        id: "ap-computer-science-principles",
        name: "AP Computer Science Principles",
        submissionMode: "upload",
      },
      { id: "ap-precalculus", name: "AP Precalculus", submissionMode: "upload" },
      { id: "ap-statistics", name: "AP Statistics", submissionMode: "upload" },
    ],
  },
  {
    subject: "Sciences",
    courses: [
      { id: "ap-biology", name: "AP Biology", submissionMode: "essay" },
      { id: "ap-chemistry", name: "AP Chemistry", submissionMode: "essay" },
      { id: "ap-environmental-science", name: "AP Environmental Science", submissionMode: "essay" },
      {
        id: "ap-physics-1",
        name: "AP Physics 1: Algebra-Based",
        submissionMode: "upload",
      },
      {
        id: "ap-physics-2",
        name: "AP Physics 2: Algebra-Based",
        submissionMode: "upload",
      },
      {
        id: "ap-physics-c-electricity",
        name: "AP Physics C: Electricity and Magnetism",
        submissionMode: "upload",
        aliases: ["AP Physics C: Electricity & Magnetism"],
      },
      {
        id: "ap-physics-c-mechanics",
        name: "AP Physics C: Mechanics",
        submissionMode: "upload",
      },
    ],
  },
  {
    subject: "World Languages and Cultures",
    courses: [
      { id: "ap-chinese-language", name: "AP Chinese Language and Culture", submissionMode: "essay" },
      { id: "ap-french-language", name: "AP French Language and Culture", submissionMode: "essay" },
      { id: "ap-german-language", name: "AP German Language and Culture", submissionMode: "essay" },
      { id: "ap-italian-language", name: "AP Italian Language and Culture", submissionMode: "essay" },
      { id: "ap-japanese-language", name: "AP Japanese Language and Culture", submissionMode: "essay" },
      { id: "ap-latin", name: "AP Latin", submissionMode: "essay" },
      { id: "ap-spanish-language", name: "AP Spanish Language and Culture", submissionMode: "essay" },
      { id: "ap-spanish-literature", name: "AP Spanish Literature and Culture", submissionMode: "essay" },
    ],
  },
];

export const apCourses = courseGroups.flatMap(({ subject, courses }) =>
  courses.map((course) => ({
    ...course,
    subject,
  }))
);

export const apCourseMap = Object.fromEntries(apCourses.map((course) => [course.id, course]));

export function getCourseById(courseId) {
  return apCourseMap[courseId] ?? null;
}

export function findCourseByName(name) {
  const lower = name?.toLowerCase?.();
  if (!lower) return null;

  for (const course of apCourses) {
    if (course.name.toLowerCase() === lower) return course;
    if (course.aliases?.some?.((alias) => alias.toLowerCase() === lower)) {
      return course;
    }
  }

  return null;
}

export function sanitizeFavoriteCourseIds(values) {
  if (!Array.isArray(values)) return [];
  const orderedIds = [];
  const seen = new Set();

  values.forEach((value) => {
    const candidateId =
      typeof value === "string" ? value : value?.id ?? value?.courseId;
    if (!candidateId) return;

    const course = getCourseById(candidateId);
    if (course && !seen.has(course.id)) {
      seen.add(course.id);
      orderedIds.push(course.id);
    }
  });

  return orderedIds;
}
