# Cloudflare Pages Functions API Naming Plan

Cloudflare Pages Functions require API endpoints to live at a single depth: `functions/api/<route>.js`. To represent existing nested routes without creating subfolders, use hyphenated file names in the format:

`<module>-<submodule>-<action>.js`

## Conversion rules
- Start from the current nested path under `functions/api/`.
- Replace each folder level with its name, separated by hyphens.
- Keep the original leaf file name (minus `.js`) as the final segment.
- Use all lowercase with existing words joined by hyphens; avoid additional separators.

## Examples
- `admin/content/categories/list.js` → `admin-content-categories-list.js`
- `admin/content/categories/create.js` → `admin-content-categories-create.js`
- `admin/content/categories/delete.js` → `admin-content-categories-delete.js`
- `admin/content/articles/list.js` → `admin-content-articles-list.js`
- `admin/content/articles/detail.js` → `admin-content-articles-detail.js`
- `admin/content/articles/update-status.js` → `admin-content-articles-update-status.js`
- `classroom/notice/create.js` → `classroom-notice-create.js`
- `classroom/notice/update.js` → `classroom-notice-update.js`
- `classroom/notice/delete.js` → `classroom-notice-delete.js`
- `classroom/video/upload.js` → `classroom-video-upload.js`
- `classroom/video/delete.js` → `classroom-video-delete.js`
- `classroom/video/list-by-classroom.js` → `classroom-video-list-by-classroom.js`
- `assignmentFeedback/list-by-assignment.js` → `assignmentfeedback-list-by-assignment.js`
- `material/create.js` → `material-create.js`
- `material/delete.js` → `material-delete.js`

Use this pattern for all future endpoint migrations so every nested route maps to a single hyphenated file within `functions/api/`.
