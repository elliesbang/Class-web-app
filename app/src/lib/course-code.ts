const RANDOM_CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const RANDOM_LENGTH = 5;
const PREFIX_LENGTH = 7;

const buildRandomSegment = () =>
  Array.from({ length: RANDOM_LENGTH }, () => {
    const index = Math.floor(Math.random() * RANDOM_CHARSET.length);
    return RANDOM_CHARSET[index];
  }).join('');

const normaliseCourseName = (courseName: string) => {
  const upper = courseName.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (upper.length === 0) {
    return 'COURSE'.slice(0, PREFIX_LENGTH);
  }
  return upper.slice(0, PREFIX_LENGTH);
};

const normaliseGeneration = (generation: string) => {
  const trimmed = generation.trim();
  if (trimmed.length === 0) {
    return '00';
  }
  if (/^\d+$/.test(trimmed)) {
    return trimmed.padStart(2, '0');
  }
  return trimmed.toUpperCase();
};

export const generateCourseCode = (courseName: string, generation: string) => {
  const prefix = normaliseCourseName(courseName);
  const generationSegment = normaliseGeneration(generation);
  const randomSegment = buildRandomSegment();

  return `${prefix}-${generationSegment}-${randomSegment}`;
};

export default generateCourseCode;
