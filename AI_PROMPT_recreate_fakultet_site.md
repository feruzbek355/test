# Prompt: Recreate "Fakultet News" website

Quyidagi topshiriqni to'liq bajar: ushbu Git repodagi `public/` papkasidagi saytni xuddi shunday — funksionallik, fayl tuzilishi, uslublar va server APIlari — qayta yaratuvchi yangi loyiha sifatida ishlab chiq. Loyihaning chiqishi to'liq ishlaydigan Node.js + Express serveri bo'lib, MySQL ma'lumotlar bazasi bilan integratsiyalangan bo'lishi kerak.

---

Umumiy talablar:
- Til: loyihani Node.js (LTS), Express, `mysql2/promise`, `express-session` bilan yoz.
- Frontend: statik HTML fayllar `public/` papkasida, bir CSS fayl `style.css` va bitta `app.js` bilan. Lokalda fayllar to'g'ri yuklanishi uchun HTML ichidagi asset yo'llari nisbiy bo'lishi kerak (masalan `style.css`, `app.js`).
- Autentifikatsiya: session-based auth (cookie), parollar `bcryptjs` bilan hash qilinsin.
- APIlar: quyidagi endpointlar bo'lishi kerak:
  - `POST /api/auth/signup` — `fullName,email,password` qabul qilib yangi foydalanuvchi yaratadi va sessiyani o'rnatadi.
  - `POST /api/auth/login` — `email,password` bilan login va sessiya o'rnatish.
  - `POST /api/auth/logout` — sessiyani yo'q qilish.
  - `GET /api/auth/me` — joriy sessiyadagi foydalanuvchi ma'lumotini qaytaradi.
  - `GET /api/news` — `news` jadvalidan yangiliklarni qaytaradi (id,title,content,created_at).
  - `POST /api/messages` — autentifikatsiyalangan foydalanuvchilarga o'zlarining xabarlarini saqlash imkoniyati (user_id va message_text).
  - `GET /api/messages` — autentifikatsiyalangan foydalanuvchilarga barcha xabarlarni (user full name bilan) qaytaradi.

Ma'lumotlar bazasi (MySQL): quyidagi schema bo'lishi kerak (SQL fayldagi kabi):
- `users(id, full_name, email UNIQUE, password_hash, created_at)`
- `news(id, title, content, created_at)`
- `messages(id, user_id, message_text, created_at)` (user_id ga FK users(id) ON DELETE CASCADE)

Server ishga tushishi bilan `news` jadvaliga ba'zi namunaviy postlar kiritilsin (agar jadval bo'sh bo'lsa) — mahalliy `ensureSampleNews()` kabi.

Frontend talablari:
- Fayl tuzilishi: `public/index.html`, `public/news.html`, `public/about.html`, `public/contact.html`, `public/login.html`, `public/style.css`, `public/app.js`.
- Dizayn va uslublar: `public/style.css` ichidagi quyidagi elementlar va ranglar saqlansin (o'xshash yoki bir xil):
  - CSS o'zgaruvchilari: `--bg-top: #f4fbf8`, `--bg-bottom: #f7f8ff`, `--card: #ffffff`, `--text: #14222d`, `--muted: #526371`, `--accent: #0f8a7b`, `--accent-2: #f28c28`, `--accent-dark: #0b695d`, `--border: #d6e4ec`.
  - Google Fonts: `Manrope` va `IBM Plex Serif` ishlatiladi.
  - Layout: `.container` max-width: 980px; `.nav` header sticky; `.card` kartalar, `.news-item` va `.message-item` uchun quti styli; responsive breakpoint `@media (max-width:760px)`.
  - Stil effektlari: yengil gradient fon, diffuz blur circles, kartalarda subtle shadow va border-radius 14-18px, nav linklar oval button uslubida.

JS funksionallik (klient): `public/app.js` tarkibini quyidagi xatti-harakatlarni aniq taqlid qilsin:
- Global `api(path, options)` yordamchi fetch funksiyasi `credentials: 'include'` bilan.
- `loadAuthState()` — `/api/auth/me` chaqiradi, agar user bo'lsa `#userBox` ga salom yozadi va `#logoutBtn` ni ko'rsatadi; bo'lmasa mehmon deb yozadi.
- `setupLoginForm()` va `setupSignupForm()` — form submit eventlarini ushlab, `/api/auth/login` va `/api/auth/signup` ga POST yuboradi; muvaffaqiyatda `/contact.html` ga yo'naltiradi va sahifadagi `#loginMsg`/`#signupMsg` ga xabar chiqaradi.
- `loadNews()` — `/api/news` ni chaqiradi va `#newsList` ga `news-item` elementlarini joylaydi.
- `setupContact()` — agar foydalanuvchi login qilgan bo'lmasa forma yashirin bo'ladi va `#contactMsg` da `login qiling` xabari chiqadi; agar login bo'lsa forma ko'rinadi, `/api/messages` ni oladi va `#messageList` ga `message-item` larni joylaydi; form submitida `/api/messages` ga POST yuboradi va keyin ro'yxatni yangilaydi.
- `setupYear()` — `#year` elementini joriy yil bilan to'ldiradi.
- DOMContentLoaded eventida yuqoridagi funksiyalar chaqiriladi.

Accessibility & usability:
- Barcha tugmalarda va linklarda aniq matn bo'lsin.
- Form maydonlariga `required` atributlari qo'yilsin.
- Responsive: mobil qurilmalarda nav vertical bo'lsin, kartalar kichikroq padding bilan.

Nusxa ko'chirish / fayl tarkiblari:
- HTML fayllar ichidagi kontent aynan shu repoda mavjud bo'lgani kabi bo'lsin (o'zbekcha matn bilan). Nav linklari nisbiy bo'lsin: `index.html`, `news.html`, `about.html`, `contact.html`, `login.html`.
- CSS fayli sahifadagi dizayn elementlarini (o'zgaruvchilar, gradientlar, shadow, font family) o'z ichiga olsin; agar xohlasangiz original fayldagi aniq CSS kodini ishlatishingiz mumkin — lekin sahifa ko'rinishi iloji boricha hozirgi screenshot va `style.css` ga mos bo'lsin.

Devops / run instructions (deliverable README ichida bo'lsin):
- `npm install` (dependencies: express, mysql2, express-session, bcryptjs, dotenv)
- `.env` namunasi (`DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME, SESSION_SECRET, PORT`)
- DB bootstrap: `mysql -u root < sql/schema.sql` yoki Node server boshlaganda schema kerak bo'lsa avtomatik yaratish bo'lsin (ammo SQL faylni repo ichida qoldiring).
- Ishga tushirish: `node server.js` yoki `npm start` (agar package.json skript bo'lsa). Server http://localhost:3000 da ishlashi kerak.

Qo'shimcha tekshiruvlar (QA):
- Ro'yxatdan o'tgach, server sessiyani o'rnatadi va `/contact.html` sahifasida xabar qoldirish mumkin bo'ladi.
- Login noto'g'ri bo'lsa to'g'ri xabarni qaytarsin.
- Ma'lumotlar DB ga yozilsin va `/api/messages` va `/api/news` orqali qaytarilsin.

Vakolat va fayl yetkazib berish:
- Repo ichida `public/`, `server.js`, `sql/schema.sql`, `package.json` (yoki `npm init` bilan to'ldirilgan), va `README.md` bo'lsin.
- README ichida ishga tushirish qadamlari va `.env` formatini kiriting.

Oxirgi eslatma: agar loyihani to'liq avtomatik qayta yaratish so'ralsa, UI/UX aniq mos kelishi uchun CSS ning ranglari, shriftlari, radius va padding kabi qiymatlarni aynan ko'chirib oling. API va DB ishlashi bilan bog'liq testlar uchun lokal MySQL kerak bo'ladi — shuning uchun README'da minimal DB bootstrap qadamlarini qo'shing.

---

Ishlangan fayl: `AI_PROMPT_recreate_fakultet_site.md` — bu faylni boshqa AI ga berib, yuqoridagi talablar asosida to'liq ishlaydigan loyiha olishingiz mumkin.
