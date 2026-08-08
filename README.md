💎 Sapphire
===========

A full-stack fitness social platform. The React Native mobile app lets users share workout
posts, chat with an AI fitness assistant, and shop for equipment, all backed by an
Express/PostgreSQL API and a React admin console.

[![CI](https://github.com/fadyabirached/sapphire/actions/workflows/ci.yml/badge.svg)](https://github.com/fadyabirached/sapphire/actions/workflows/ci.yml)
[![Node](https://img.shields.io/badge/node-%3E%3D18-339933?logo=node.js&logoColor=white)](Backend/package.json)
[![React Native](https://img.shields.io/badge/React%20Native-Expo-61DAFB?logo=react&logoColor=white)](Frontend/package.json)
[![License](https://img.shields.io/badge/license-ISC-blue)](Backend/package.json)

🎓 **Bachelor's final year project, graded 97/100 (highest grade of the semester).**

---

## 📸 Screenshots

**Auth & navigation**

<table>
  <tr>
    <td align="center"><img src="screenshots/mobile-signin.png" width="180" alt="Sign in"/><br/>Sign in</td>
    <td align="center"><img src="screenshots/mobile-signup.png" width="180" alt="Sign up"/><br/>Sign up</td>
    <td align="center"><img src="screenshots/mobile-drawer.png" width="180" alt="Drawer navigation"/><br/>Drawer navigation</td>
  </tr>
</table>

**Social feed & profile**

<table>
  <tr>
    <td align="center"><img src="screenshots/mobile-home.png" width="180" alt="Home feed"/><br/>Home feed</td>
    <td align="center"><img src="screenshots/mobile-user-profile-modal.png" width="180" alt="Tap a poster's name for their profile"/><br/>Tap a name for their profile</td>
    <td align="center"><img src="screenshots/mobile-upload.png" width="180" alt="New post"/><br/>New post</td>
    <td align="center"><img src="screenshots/mobile-profile.png" width="180" alt="Profile"/><br/>Profile</td>
    <td align="center"><img src="screenshots/mobile-settings.png" width="180" alt="Settings"/><br/>Settings</td>
  </tr>
</table>

**AI moderation in action**

<table>
  <tr>
    <td align="center"><img src="screenshots/mobile-upload-rejected.png" width="220" alt="Upload rejected by AI moderation"/><br/>Upload blocked by the moderation gate (simulated flag for demo purposes)</td>
  </tr>
</table>

**AI chatbot**

<table>
  <tr>
    <td align="center"><img src="screenshots/mobile-chatbot.png" width="180" alt="AI fitness chatbot"/><br/>AI fitness chatbot</td>
  </tr>
</table>

**Marketplace**

<table>
  <tr>
    <td align="center"><img src="screenshots/mobile-marketplace.png" width="180" alt="Marketplace"/><br/>Product catalog</td>
    <td align="center"><img src="screenshots/mobile-product-modal.png" width="180" alt="Product detail"/><br/>Product detail</td>
    <td align="center"><img src="screenshots/mobile-cart.png" width="180" alt="Cart & checkout"/><br/>Cart & checkout</td>
  </tr>
</table>

**Admin console**

<table>
  <tr>
    <td align="center"><img src="screenshots/admin-login.png" width="380" alt="Admin login"/><br/>Admin login</td>
    <td align="center"><img src="screenshots/admin-dashboard.png" width="380" alt="Admin dashboard"/><br/>Admin dashboard</td>
  </tr>
</table>

## ✨ Features

- 🔐 **Auth**: bcrypt-hashed passwords, JWT sessions, a separate admin-scoped token for
  the moderation console.
- 📸 **Social feed**: post text + images, like/unlike, per-user profiles with avatars and bios.
- 🤖 **AI fitness chatbot**: an in-app assistant (Cohere `command-xlarge`) that answers
  workout, calisthenics, and nutrition questions, proxied through the backend so the API
  key never ships inside the mobile bundle.
- 🛡️ **AI image moderation**: every uploaded post image is classified by a Hugging Face
  vision model before it's stored. Flagged images are rejected server-side, and the check
  fails closed if the model is unreachable.
- 🛒 **Marketplace**: product catalog, cart, and a transactional checkout that verifies
  stock and updates inventory atomically.
- 📊 **Admin console**: platform stats and post moderation, gated behind a dedicated
  admin login.

## 🏗️ Architecture

<img src="screenshots/architecture-diagram.png" alt="Architecture diagram" width="800"/>

<details>
<summary>Mermaid source (renders on GitHub web, but not in the GitHub mobile app, so the PNG above is the portable version)</summary>

```mermaid
flowchart LR
    subgraph Clients["📲 Clients"]
        RN["📱 React Native App<br/>Frontend/"]
        AD["🖥️ Admin Console<br/>Admin/"]
    end

    subgraph Backend["⚙️ Backend/ — Express API"]
        AUTH["🔑 Auth routes<br/>signup · signin"]
        PROF["👤 Profile routes"]
        POST["📸 Posts routes"]
        MKT["🛒 Marketplace routes<br/>cart · checkout · purchases"]
        ADM["📊 Admin routes<br/>stats · moderation"]
        CHAT["💬 Chatbot route"]
        MW["🔒 JWT middleware<br/>user · admin guard"]
        SPAM["🛡️ AI moderation<br/>middleware"]
    end

    DB[("🗄️ PostgreSQL")]
    HF[["🤗 Hugging Face<br/>NSFW/spam image model"]]
    CO[["🧠 Cohere<br/>fitness chatbot"]]

    RN -->|"HTTPS + JWT"| AUTH & PROF & POST & MKT & CHAT
    AD -->|"HTTPS + admin JWT"| ADM
    AUTH & PROF & POST & MKT & ADM & CHAT --> MW
    MW --> DB
    POST --> SPAM --> HF
    CHAT --> CO

    classDef client fill:#DCEEFB,stroke:#2C4F83,stroke-width:1.5px,color:#0B2545;
    classDef route fill:#FFF3D6,stroke:#C68A1A,stroke-width:1.5px,color:#5A3E00;
    classDef guard fill:#EFE3FB,stroke:#7B4FA6,stroke-width:1.5px,color:#3B1E5E;
    classDef store fill:#DFF5E1,stroke:#2E7D4F,stroke-width:1.5px,color:#0F3D22;
    classDef ai fill:#FCE0E4,stroke:#C23B5A,stroke-width:1.5px,color:#5E1425;

    class RN,AD client;
    class AUTH,PROF,POST,MKT,ADM,CHAT route;
    class MW,SPAM guard;
    class DB store;
    class HF,CO ai;

    style Clients fill:#F7FAFC,stroke:#A0AEC0,stroke-width:1.5px;
    style Backend fill:#FCFCF9,stroke:#A0AEC0,stroke-width:1.5px;
```

</details>

## 🧰 Tech stack

| Layer | Stack |
|---|---|
| 📱 Mobile | React Native, Expo, React Navigation, React Native Paper |
| 🖥️ Admin | React 19, Vite, Tailwind CSS, React Router |
| ⚙️ Backend | Node.js, Express, PostgreSQL (`pg`), JWT, bcrypt, Multer |
| 🧠 AI/ML | Cohere (chatbot) · Hugging Face Inference API (image moderation) |
| ✅ CI | GitHub Actions: lint + build on every push and pull request |

## 📁 Project structure

```
Backend/
  config/         # DB pool, JWT config
  middleware/      # auth guards, upload handling, AI moderation
  routes/          # auth, profile, posts, marketplace, admin, chatbot
  server.js        # app wiring only
Admin/
  src/pages/       # Login, Dashboard, NotFound
Frontend/
  screens/         # SignIn, SignUp, Home, Upload, Chatbot, Profile, Settings, Marketplace
```

## 🚀 Getting started

### Backend

```bash
cd Backend
cp .env.example .env   # fill in DB, JWT, admin, Hugging Face, and Cohere credentials
npm install
npm run lint
npm start                # http://localhost:3000
```

### Admin console

```bash
cd Admin
npm install
npm run dev               # http://localhost:5173
```

### Mobile app

```bash
cd Frontend
npm install
npm start                 # opens Expo dev tools
```

## 🔒 Security

- All secrets (DB credentials, JWT secret, admin credentials, Hugging Face token, Cohere
  API key) are read from environment variables only, never committed or shipped in a
  client bundle.
- Admin credentials are verified server-side (`ADMIN_EMAIL` / `ADMIN_PASSWORD_HASH`); the
  admin app never has direct access to them.
- The chatbot's Cohere API key lives only on the backend; the mobile app calls `/chatbot`
  with its own JWT instead of talking to Cohere directly.
- Uploaded post images are rejected server-side if the AI moderation check flags them or
  if the moderation service is unreachable (fail-closed).
