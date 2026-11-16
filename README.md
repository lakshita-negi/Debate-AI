# DebateAI – AI-Powered Debate Platform

DebateAI is an interactive web application designed to help users develop critical thinking, argumentation, and communication skills through AI-powered debates.

The platform allows users to participate in structured debates, interact with an AI opponent, and receive AI-assisted evaluations of their debating performance.

## Features

- **User Authentication:** Secure registration and login using JWT authentication.
- **AI-Powered Debates:** Engage in interactive debates with an AI opponent powered by Google Gemini.
- **Debate Positions:** Explore topics from FOR and AGAINST perspectives.
- **Difficulty Levels:** Choose between Beginner, Intermediate, and Advanced debate levels.
- **AI Responses:** Receive context-aware arguments and rebuttals during debates.
- **Performance Evaluation:** Get structured feedback and scores based on debate performance.
- **Debate History:** Access previously completed debates.
- **User Profile:** View and manage personal account information.

## Tech Stack

### Frontend
- React 19
- Vite
- React Router
- Lucide React
- CSS

### Backend
- Node.js
- Express.js
- MongoDB
- Mongoose
- JSON Web Tokens (JWT)
- bcryptjs
- Google Gemini API

### AI Integration
- Google Gemini 3.5 Flash Lite
- Gemini Interactions API

## Project Structure

```text
DebateAI/
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   └── services/
│   ├── server.js
│   ├── package.json
│   └── package-lock.json
│
├── public/
│
├── src/
│   ├── pages/
│   ├── components/
│   └── ...
│
├── index.html
├── package.json
├── package-lock.json
├── vite.config.js
├── eslint.config.js
├── .gitignore
└── README.md
```

## Getting Started

### Prerequisites

Make sure you have the following installed:

- Node.js
- npm
- MongoDB Atlas account
- Google Gemini API key

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR-USERNAME/DebateAI.git
cd DebateAI
```

### 2. Install Frontend Dependencies

```bash
npm install
```

### 3. Install Backend Dependencies

```bash
cd backend
npm install
```

### 4. Configure Environment Variables

Create a `.env` file inside the `backend` directory.

Add the following variables:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
GEMINI_API_KEY=your_gemini_api_key
```

Replace the placeholder values with your own credentials.

**Important:** Never upload your `.env` file or expose your API keys and database credentials publicly.

### 5. Start the Backend

From the `backend` directory, run:

```bash
npm run dev
```

The backend will run at:

`http://localhost:5000`

### 6. Start the Frontend

Open another terminal in the root project directory and run:

```bash
npm run dev
```

Vite will provide the local development URL, usually:

`http://localhost:5173`

## Environment Configuration

| Variable | Description |
|---|---|
| PORT | Backend server port |
| MONGO_URI | MongoDB Atlas connection string |
| GEMINI_API_KEY | Google Gemini API key |

## Future Enhancements

- Advanced debate analytics and progress tracking
- More debate topics and categories
- Improved personalized feedback
- Enhanced debate performance insights

## Author

**Lakshita Negi**

GitHub: [lakshita-negi](https://github.com/lakshita-negi)

---

*DebateAI – Think Critically. Argue Confidently. Learn Continuously.*