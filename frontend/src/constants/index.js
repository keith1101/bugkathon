// Canvas dimensions
export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 500;

// Default template variables
export const DEFAULT_TEMPLATE_VARIABLES = ['name', 'date', 'role', 'event_name'];

// LocalStorage keys
export const STORAGE_KEYS = {
  TEMPLATES: 'bugkathon_templates',
};

// Validation constants
export const VALIDATION = {
  MIN_PASSWORD_LENGTH: 6,
  MIN_NAME_LENGTH: 2,
  EMAIL_REGEX: /\S+@\S+\.\S+/,
};

// Default element properties
export const DEFAULT_ELEMENT_PROPS = {
  FONT_SIZE: 28,
  FONT_FAMILY: 'sans-serif',
  TEXT_ALIGN: 'left',
  OPACITY: 1,
  STROKE_WIDTH: 2,
};

// Export file names
export const EXPORT_FORMATS = {
  SVG: 'svg',
  PNG: 'png',
};
