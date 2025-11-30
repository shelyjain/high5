# High5 - AP Study Platform

**High5** is a comprehensive AP (Advanced Placement) study platform that leverages AI to provide personalized learning experiences for high school students preparing for AP exams. Built for the Congressional App Challenge, High5 combines official AP Course and Exam Description (CED) content with intelligent AI-powered features to help students excel in their AP courses.

<img src="frontend/public/logo.png" alt="High5 Logo" width="150" height="150">

## Features

### AI-Powered Learning
- **CED-Based Practice Tests**: Multiple choice questions generated from official AP Course and Exam Descriptions
- **Intelligent FRQ Grading**: Upload text responses or images for Free Response Questions and receive detailed AI feedback
- **Adaptive Learning**: AI adapts to your strengths and weaknesses to focus on areas needing improvement
- **Smart Study Plans**: AI-generated personalized study schedules based on your course selection and timeline

### Comprehensive Course Coverage
- **40+ AP Courses**: Support for all major AP subjects including:
  - STEM: AP Calculus AB/BC, AP Chemistry, AP Biology, AP Physics, AP Computer Science
  - Humanities: AP English Language/Literature, AP History courses, AP Psychology
  - Languages: AP Spanish, AP French, AP Chinese, AP Japanese, and more
  - Arts: AP Art History, AP Music Theory, AP Studio Art
- **Official Content**: Questions generated from authentic AP Course and Exam Descriptions

### Study Tools
- **Interactive Flashcards**: Create and study personalized flashcards with spaced repetition
- **Study Calendar**: Plan and track your study sessions with visual calendar interface
- **Progress Tracking**: Monitor your performance with detailed statistics and streaks
- **Community Q&A**: Ask questions and help other students in the community forum

### Modern User Experience
- **Dark/Light Theme**: Beautiful theme system with system preference detection
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Guest Mode**: Try the platform without creating an account
- **Onboarding Tutorial**: Interactive guide to help new users get started

## Technology Stack

### Frontend
- **React 19** - Modern React with latest features
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Smooth animations and transitions
- **React Router** - Client-side routing
- **Firebase** - Authentication and database
- **Context API** - State management for themes and user data

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **LangChain** - AI/LLM integration framework
- **OpenAI GPT-4** - AI model for question generation and grading
- **PDF-Parse** - Extract content from AP Course and Exam Description PDFs
- **CORS** - Cross-origin resource sharing
- **Zod** - Schema validation

### AI & Machine Learning
- **OpenAI GPT-4o-mini** - Primary AI model for content generation
- **LangChain** - Framework for building AI applications
- **Structured Output Parsing** - Ensures consistent AI response formats
- **Custom Prompts** - Tailored prompts for AP-specific content generation

### Database & Storage
- **Firebase Firestore** - NoSQL database for user data and progress
- **Firebase Authentication** - User authentication and management
- **Firebase Storage** - File storage for FRQ image uploads
- **Local Storage** - Client-side caching and preferences

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- OpenAI API key
- Firebase project setup

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/High5.git
   cd High5
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   
   # Create environment file
   cp .env.example .env
   # Edit .env with your configuration:
   # PORT=5001
   # OPENAI_API_KEY=your_openai_api_key_here
   
   npm start
   ```

3. **Frontend Setup**
   ```bash
   cd ../frontend
   npm install
   
   # Update Firebase configuration in src/firebase.js
   # Replace with your Firebase project credentials
   
   npm run dev
   ```

4. **Access the Application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5001

### Firebase Configuration

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication (Email/Password)
3. Create a Firestore database
4. Update `frontend/src/firebase.js` with your project credentials:

```javascript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};
```

### AP Course Content Setup

1. Place AP Course and Exam Description (CED) PDF files in `backend/ceds/`
2. Name files according to course IDs (e.g., `ap-chemistry.pdf`, `ap-biology.pdf`)
3. The system will automatically parse these files on server startup

## Project Structure

```
High5/
├── backend/
│   ├── controllers/          # API route handlers
│   ├── services/              # AI and business logic
│   │   ├── mcqGenerator.js   # MCQ question generation
│   │   ├── frqGrader.js      # FRQ grading service
│   │   ├── cedParser.js      # PDF parsing service
│   │   └── openaiService.js  # OpenAI integration
│   ├── routes/               # Express route definitions
│   ├── middleware/           # Authentication middleware
│   ├── data/                 # Static data and uploads
│   ├── ceds/                 # AP Course and Exam Description PDFs
│   └── server.js            # Main server file
├── frontend/
│   ├── src/
│   │   ├── components/       # Reusable React components
│   │   ├── pages/           # Page components
│   │   ├── context/         # React Context providers
│   │   ├── data/           # Static course data
│   │   ├── utils/          # Utility functions
│   │   └── firebase.js     # Firebase configuration
│   └── public/             # Static assets
└── README.md
```

## API Endpoints

### Questions & Practice
- `GET /api/questions/generate` - Generate MCQ questions
- `POST /api/frq/grade` - Grade Free Response Questions
- `GET /api/questions/cache` - Get cached questions

### Study Planning
- `POST /api/study-plan/generate` - Generate AI study plan
- `POST /api/study-plan/adaptive` - Create adaptive study plan

### Community
- `GET /api/community/questions` - Get community questions
- `POST /api/community/questions` - Submit new question
- `POST /api/community/answers` - Submit answer

### Flashcards
- `GET /api/flashcards` - Get user flashcards
- `POST /api/flashcards` - Create new flashcard
- `PUT /api/flashcards/:id` - Update flashcard
- `DELETE /api/flashcards/:id` - Delete flashcard

## Theme System

High5 features a sophisticated theme system with:
- **System Preference Detection**: Automatically detects your OS theme
- **Three Modes**: System, Light, and Dark themes
- **Persistent Storage**: Remembers your preference across sessions
- **Smooth Transitions**: Beautiful animations between themes
- **Accessibility**: WCAG compliant with proper contrast ratios

## Key Features Explained

### AI Question Generation
- Uses official AP Course and Exam Description content
- Generates contextually relevant multiple choice questions
- Includes detailed explanations for each answer
- Adapts difficulty based on user performance

### FRQ Grading System
- Supports both text and image uploads
- Uses official AP rubrics for grading
- Provides detailed feedback on strengths and areas for improvement
- Aligns responses with specific rubric criteria

### Study Calendar
- Visual calendar interface for planning study sessions
- AI-generated study plans based on course content
- Progress tracking and streak monitoring
- Adaptive scheduling based on performance data

## Contributing

We welcome contributions! Please see our contributing guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- **College Board** - For AP Course and Exam Description content
- **OpenAI** - For GPT-4 AI capabilities
- **Firebase** - For authentication and database services
- **React Community** - For the amazing React ecosystem

## Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/yourusername/High5/issues) page
2. Create a new issue with detailed information
3. Contact the development team

## Congressional App Challenge

This project was created for the Congressional App Challenge, demonstrating how technology can enhance education and help students succeed in their academic pursuits.

---

**Built with ❤️ for students, by students**

Sanjana Gowda, Vaidehi Akbari, and Shely Jain
