module.exports = `
CREATE TABLE categories (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  short_description TEXT,
  description TEXT,
  icon_key TEXT,
  accent_colour TEXT,
  cover_image_url TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  featured INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('draft', 'published', 'archived')),
  seo_title TEXT,
  seo_description TEXT,
  source TEXT NOT NULL DEFAULT 'admin' CHECK (source IN ('admin', 'sample')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  created_by TEXT,
  updated_by TEXT
);

CREATE TABLE courses (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category_id TEXT NOT NULL REFERENCES categories(id),
  short_description TEXT,
  description TEXT,
  level_label TEXT,
  applicable_for TEXT,
  subjects TEXT NOT NULL DEFAULT '[]',
  learning_objectives TEXT NOT NULL DEFAULT '[]',
  prerequisites TEXT NOT NULL DEFAULT '[]',
  target_audience TEXT,
  learning_modes TEXT NOT NULL DEFAULT '[]',
  cover_image_url TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  featured INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('draft', 'published', 'archived')),
  seo_title TEXT,
  seo_description TEXT,
  source TEXT NOT NULL DEFAULT 'admin' CHECK (source IN ('admin', 'sample')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  created_by TEXT,
  updated_by TEXT
);

CREATE INDEX idx_categories_status ON categories(status, display_order);
CREATE INDEX idx_courses_category ON courses(category_id);
CREATE INDEX idx_courses_status ON courses(status, display_order);
`
