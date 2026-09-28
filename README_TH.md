# Jeerawud Resume + Google Sheets + Portfolio Website

ชุดนี้ทำให้ Google Sheets เป็นข้อมูลกลาง (CMS) และเว็บไซต์อ่านข้อมูลจาก Sheet ได้

## ไฟล์หลัก
- `index.html` — หน้าเว็บไซต์
- `style.css` — ดีไซน์ Responsive
- `app.js` — แสดงข้อมูลบนเว็บไซต์
- `config.js` — ใส่ URL ของ Google Apps Script
- `data.js` — ข้อมูล Resume สำรอง กรณียังไม่ต่อ Google Sheets
- `profile.png` — รูปโปรไฟล์พื้นหลังโปร่งใส
- `Resume_Jeerawud.pdf` — Resume PDF
- `google_apps_script/Code.gs` — API สำหรับอ่านข้อมูลจาก Google Sheets

## 1) นำ Excel เข้า Google Sheets
1. Upload `Jeerawud_Resume_Portfolio_GoogleSheets.xlsx` ไป Google Drive
2. คลิกขวา > Open with > Google Sheets
3. ตรวจสอบ tabs: Profile, Experience, Education, Skills, Certificates, Portfolio, Website Settings

## 2) ทำให้เว็บไซต์อ่านข้อมูลจาก Google Sheets
1. ใน Google Sheets ไปที่ Extensions > Apps Script
2. ลบโค้ดเดิม แล้ววางโค้ดจาก `google_apps_script/Code.gs`
3. กด Deploy > New deployment
4. Type = Web app
5. Execute as = Me
6. Who has access = Anyone (ถ้าต้องการเว็บสาธารณะ)
7. กด Deploy และคัดลอก Web app URL
8. เปิด `config.js` แล้วใส่ URL:
   `GOOGLE_APPS_SCRIPT_URL: "https://script.google.com/macros/s/.../exec"`

จากนั้นการแก้ Profile / Skills / Experience / Portfolio ใน Google Sheets จะถูกโหลดขึ้นเว็บเมื่อ refresh หน้าเว็บ

## 3) เพิ่ม Portfolio ผลงานจริง
ไปที่ tab `Portfolio` แล้วเพิ่ม 1 แถวต่อ 1 Project:
- Project Title
- Category
- Short Description
- Technologies
- Year / Period
- Company / Context
- Project Image URL
- Project Link
- Featured

แนะนำใช้ภาพจาก Google Drive / GitHub / Cloud storage ที่เปิด public และใช้ direct/public image URL

## 4) Publish Website
ตัวเลือกง่าย:
- GitHub Pages
- Netlify
- Cloudflare Pages

Upload ไฟล์ทั้งหมดในโฟลเดอร์เว็บไซต์ แล้วตั้ง `index.html` เป็นหน้าแรก

## Privacy
ใน tab `Website Settings`
- `ShowPhone = No` เพื่อซ่อนเบอร์
- `ShowFullAddress = No` ถูกตั้งเป็นค่าเริ่มต้นสำหรับเว็บ public

หมายเหตุ: Resume ต้นฉบับไม่ได้ระบุชื่อ project รายชิ้น ดังนั้น Portfolio 3 card แรกเป็น summary จากประสบการณ์/skill ใน Resume ควรเปลี่ยนเป็นผลงานจริง พร้อมภาพ ผลลัพธ์ และ link เมื่อพร้อม


## Smart Scroll UI
เวอร์ชันนี้เพิ่มการเลื่อนแบบ Modern Portfolio:
- ใช้ mouse wheel บน Desktop เพื่อเลื่อนไป section ถัดไป/ก่อนหน้าแบบ smooth
- Trackpad ที่เลื่อนละเอียดจะยัง scroll แบบปกติ เพื่อลดอาการเว็บแย่งการควบคุม
- มี Side Section Navigator ด้านขวา + progress bar
- Nav ด้านบน highlight section ปัจจุบัน
- Content cards มี reveal animation เมื่อเลื่อนมาถึง
- มี Scroll indicator ใต้ Hero
- Mobile จะกลับไปใช้ native scrolling เพื่อให้ใช้งานง่าย

ถ้า Browser หรือ OS เปิด Reduce Motion ระบบจะลด animation อัตโนมัติ 
