const CLASS_MAPPINGS = [
  { slug: 'earlchal', name: '이얼챌' },
  { slug: 'candyma', name: '캔디마' },
  { slug: 'mitemna', name: '미템나' },
  { slug: 'eggjak', name: '에그작' },
  { slug: 'nacoljak', name: '나컬작' },
  { slug: 'eggjakchal', name: '에그작챌' },
  { slug: 'nacoljakchal', name: '나컬작챌' },
] as const;

type ClassMapping = (typeof CLASS_MAPPINGS)[number];

type MappingBySlug = Record<ClassMapping['slug'], ClassMapping>;

type MappingByName = Record<string, ClassMapping>;

const normaliseName = (value: string) => value.replace(/\s+/g, '').toLowerCase();

const mappingBySlug = CLASS_MAPPINGS.reduce((acc, mapping) => {
  acc[mapping.slug] = mapping;
  return acc;
}, {} as MappingBySlug);

const mappingByName = CLASS_MAPPINGS.reduce((acc, mapping) => {
  acc[normaliseName(mapping.name)] = mapping;
  return acc;
}, {} as MappingByName);

export const getClassNameBySlug = (slug: string): string | null => {
  const target = mappingBySlug[slug as ClassMapping['slug']];
  return target ? target.name : null;
};

export const getSlugByClassName = (className: string): string | null => {
  const target = mappingByName[normaliseName(className)];
  return target ? target.slug : null;
};

export const getRouteByClassName = (className: string): string | null => {
  const slug = getSlugByClassName(className);
  return slug ? `/courses/${slug}` : null;
};

export const normaliseClassName = normaliseName;
