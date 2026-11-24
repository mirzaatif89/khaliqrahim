# khaliqrahim — Khaliq Homeopathic Care

## Run locally with MySQL

Use Node.js 22.12+ and MySQL 8.0.16+ (MySQL Workbench is the database client).

```sh
npm install
# Copy .env.example to .env and set your local database/admin credentials.
npm start
```

Open **http://127.0.0.1:3000**. Sign in at **/auth** with `ADMIN_USERNAME` and
`ADMIN_PASSWORD` from `.env`; the admin portal is at **/admin**.

Create the database named by `DB_NAME` in Workbench first. `AUTO_CREATE_DB=false`
keeps database creation manual. On startup, the app creates missing local MySQL
tables, installs its versioned procedure, and seeds missing content, categories,
and 14 products from the existing project. Existing content is preserved.
The MySQL user needs table and routine creation privileges for this initial setup.
Orders, appointments, inquiries, reviews, and tracking use a database procedure;
prices, stock changes, and fees are computed in MySQL. The current storefront
uses clinic pickup, with zero delivery fee by default.

Leave `DB_HOST` blank for a preview with default content and an empty catalog.
Saving forms requires MySQL. Local authentication uses an HttpOnly session cookie;
sessions expire after 8 hours and reset when the server restarts. Local mode uses
only the configured admin account; Google login and public signup require the
original Lovable/Supabase setup. Uploaded local images are in `.local-media/`.

`.env` and uploaded media are excluded from Git. Set credentials locally after
cloning. `npm start` runs the local Vite server on loopback; the existing
`npm run dev` / `npm run build` remain available for the Lovable cloud setup.

Checks: `npm test`, `npx tsc --noEmit`, and `npm run build`.
With `npm start` running and MySQL enabled, `node scripts/check-local.mjs` also
checks authentication, authorization, forms, pricing, and public pages; it removes
its temporary records and restores stock afterwards.

TikTok



https://www.tiktok.com/@krhomeo?_r=1&_t=ZS-9Bda8K6GDh8



Insta 



https://www.instagram.com/krhomeomedical?cnvx=aHgzand1eXlvbW5j



Facebook 



https://www.facebook.com/share/1FBG3Zmdbm/     Aapki requirements ko dekhte hue, hum aapke liye ek complete e-commerce website with Admin Portal develop kar sakte hain.







Is complete solution mein:







• Full Product Listing – Products ko proper categories aur details ke saath showcase karna



• Complete Website Pages – Home/Landing Page, About, Services, Products aur other required pages



• Product Detail Pages – Har product ki complete information aur presentation



• Order Management System – Orders ko manage aur track karne ka proper system



• CMS (Content Management System) – Aap khud website ka content, products aur required information easily manage kar sakenge



• Customer Management – Customers ki details aur activity ko manage karna



• Lead & Customer Insights – Kis customer ne kis product mein interest show kiya, is tarah ki useful information



• Review System – Customers ke reviews aur feedback manage karne ka system



• Admin Portal – Website, products, orders, customers aur content ko ek central dashboard se manage karna



• Payment Gateway Integration – Online payments ke liye proper payment gateway integration



• Responsive Design – Website mobile, tablet aur desktop par properly optimized hogi.....,..... Refrence website link   https://www.qasimhomeopathic.com/      # Khaliq Rahim Medical Center — Website Required Data







 1. Doctor Profile



- Doctor Name : Dr Khaliq Rahim 



- Qualifications / Degrees



 Ph.D, (I.Land) Doctorate of Medicine(U.K)



D.I HOM (UK) B.H.M.S, (University of Peshawar)



DHMS (PAK), EX. Medical Officer IHMC (IBD)



Physician & Consultant



- Specialization ,,, Homeopathic specialist 



- Medical experience (kitne saal): 30+ years



- Doctor ka short introduction: 



- Professional photo:







2. Clinic Details



- Clinic ka exact name: Khaliq Rahim Medical Center



- Complete address: Kiyani Raod , Near Athal Chowk , BharaKahu , Islamabad



- City: Bharakahu , Islamabad



- Clinic ka logo:



- Clinic ki building aur indoor pictures:







Services



* In-Clinic Homeopathic Consultation



* Patient Assessment and Case Taking



* Appointment Booking



* Online Homeopathic Consultation



* Online Patient Registration and Ticket Generation



* Individualized Homeopathic Treatment



* Homeopathic Medicine Dispensing



* Home Delivery of Medicines



* Cash on Delivery (COD)



* Follow-Up Consultation



* WhatsApp Patient Support



* Patient Record Management







4. Clinic Timings



- Monday To Saturday ...  9.00 Am to 8.00 Pm



-  holiday: Sunday 











5. Contact Information



- Clinic phone number: 0333-0501084



- WhatsApp number: 0333-0501084



- Email address (: khaliqrahimmedicalcenter@gmail.com







6. Clinic Location



- Google Maps location link: https://maps.app.goo.gl/M8nBCR6EZgvxMCYk6



- Google Maps par clinic ka naam registered hai? Yes 







7. Appointment Booking



- Phone call se appointment: Yes / No



- WhatsApp se appointment: Yes / No



- Website booking form: Yes / No



- Walk-in patients allowed hain? Yes / No







8. Reception Details



- Receptionist ka naam (optional): 



- Reception contact number: 0333-0501084



- Appointment booking ke liye preferred contact method: Whatsapp 0333-0501084







9. Fees



- Consultation fee: 1000



- Follow-up fee: 500



- Online consultation fee (agar available ho): Depend on case



 



10. Social Media



- Facebook: https://www.facebook.com/share/1EfhEUrQiC/?mibextid=wwXIfr



- TikTok: https://www.tiktok.com/@krhomeo?_r=1&_t=ZS-99wffVvwbBt



- Instagram: https://www.instagram.com/krhomeomedical?stkn=MWdjdG0zejhtMmY4ZQ==



- YouTube:







11. Website Preferences



- Language: English / Urdu / Both mostly english 



- Website style: Professional modren 



- Website par online appointment booking chahiye? Yes 



- Website domain ka naam (agar khareeda hua hai): krhomeo.com



- Existing website (agar hai): no







12. Additional Information



- Clinic ka mission ya vision: 



- Doctor ki achievements, awards ya certificates:



- Patient testimonials (permission ke saath):



- Website par koi additional information jo aap dikhana chahte hain: medines listing    .......   Yeh chez aya animation m jesa in ki atti.......... https://share.google/7oIUq52v7V0buOdUq    Is ma jesa animtions h



In k mixture ho    ....... Ye sari details hain client ki or website mobile or desktops dono k liye responsive ho   me ne ak website bnwai thi zip attach hy passed ni aii make sure pyari pyari images add kro achi si mza ana chahye ak image 2 bar repeat na hoo

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://khaliq-homeopathic-care.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/3dc0827a-d665-4c26-968c-79fbcc6d0b89).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
