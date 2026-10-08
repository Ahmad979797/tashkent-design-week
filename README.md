# Tashkent Design Week — editable landing + CMS

## Run
```bash
npm install
npm start
```
Open http://localhost:3000

Admin: http://localhost:3000/admin
Login: admin
Password: admin123

## Features
- Editorial landing page inspired by the supplied design mockup.
- CMS blocks: logos, hero, program/text, events, speakers, special projects, city activations, map, registration, footer.
- Add/reorder/hide/delete blocks with drag & drop.
- Every visible text field is editable.
- Text style controls: font family, size, color, weight, alignment, line-height.
- Upload images to local media folder.
- Event/speaker/project/activation/location CRUD.
- Registration form saved to SQLite and export to CSV.
- Site settings for fonts/colors and navigation.
- Mobile responsive.

For production, change the admin credentials and add HTTPS, CSRF protection, rate limiting, external storage and transactional email/Telegram notifications.
