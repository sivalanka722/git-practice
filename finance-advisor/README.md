# AI Personal Finance Advisor

A full-stack MERN application that helps users understand and manage their personal finances using AI-powered insights.

![Finance Advisor](https://img.shields.io/badge/MERN-Stack-green) ![OpenAI](https://img.shields.io/badge/OpenAI-Powered-blue) ![License](https://img.shields.io/badge/License-MIT-yellow)

## 🌟 Features

- **User Authentication**: Secure JWT-based registration and login
- **Transaction Management**: Add, edit, delete transactions manually
- **CSV Import**: Upload bank statements in CSV format
- **Visual Analytics**: Interactive charts using Chart.js
  - Spending by category (Doughnut chart)
  - Income vs Expenses (Bar chart)
  - Savings trend (Line chart)
- **AI-Powered Insights**: 
  - Financial health assessment
  - Personalized budget suggestions
  - Smart saving tips
- **Responsive Design**: Works on desktop and mobile devices

## 🛠️ Technologies

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **OpenAI API** - AI insights
- **Multer** - File uploads
- **csv-parser** - CSV parsing

### Frontend
- **React.js** - UI library
- **React Router** - Navigation
- **Chart.js** - Data visualization
- **Axios** - HTTP client
- **React Toastify** - Notifications
- **React Icons** - Icon library

## 📁 Project Structure

```
finance-advisor/
├── server/                 # Backend API
│   ├── config/            # Database configuration
│   ├── controllers/       # Route controllers
│   ├── middleware/        # Auth middleware
│   ├── models/            # Mongoose models
│   ├── routes/            # API routes
│   ├── utils/             # Utility functions
│   ├── uploads/           # CSV upload directory
│   ├── index.js           # Server entry point
│   ├── seed.js            # Database seeder
│   └── package.json
├── client/                 # Frontend React app
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── context/       # React context
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   ├── App.jsx        # Main app component
│   │   └── App.css        # Global styles
│   ├── index.html
│   └── package.json
├── sample_data/           # Sample CSV files
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- OpenAI API key (optional, for AI features)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd finance-advisor
   ```

2. **Set up the backend**
   ```bash
   cd server
   npm install
   
   # Create .env file
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Configure environment variables**
   ```env
   PORT=12000
   MONGODB_URI=mongodb://localhost:27017/finance-advisor
   JWT_SECRET=your-secret-key
   OPENAI_API_KEY=your-openai-api-key
   ```

4. **Set up the frontend**
   ```bash
   cd ../client
   npm install
   ```

5. **Seed the database (optional)**
   ```bash
   cd ../server
   npm run seed
   ```

### Running the Application

1. **Start MongoDB** (if running locally)
   ```bash
   mongod
   ```

2. **Start the backend server**
   ```bash
   cd server
   npm start
   ```

3. **Start the frontend** (in a new terminal)
   ```bash
   cd client
   npm run dev
   ```

4. **Access the application**
   - Frontend: http://localhost:12001
   - Backend API: http://localhost:12000

## 📊 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/profile` | Get user profile |
| PUT | `/api/auth/profile` | Update profile |

### Transactions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/transactions` | Get all transactions |
| GET | `/api/transactions/:id` | Get single transaction |
| POST | `/api/transactions` | Create transaction |
| PUT | `/api/transactions/:id` | Update transaction |
| DELETE | `/api/transactions/:id` | Delete transaction |
| POST | `/api/transactions/upload` | Upload CSV |
| GET | `/api/transactions/stats` | Get statistics |

### AI Insights
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/insights` | Get financial insights |
| POST | `/api/ai/budget-suggestions` | Get budget suggestions |
| POST | `/api/ai/saving-tips` | Get saving tips |

## 📝 CSV Format

The application accepts CSV files with the following columns:
- `date` - Transaction date (YYYY-MM-DD)
- `description` - Transaction description
- `amount` - Amount (negative for expenses)

Example:
```csv
date,description,amount
2024-01-15,Grocery Store,-85.50
2024-01-14,Monthly Salary,3500.00
```

## 🔐 Security Features

- Password hashing with bcrypt
- JWT token authentication
- Protected API routes
- Input validation and sanitization
- CORS configuration

## 🎨 Screenshots

### Dashboard
- Overview of income, expenses, and savings
- Interactive charts for spending analysis
- Recent transactions list

### Transactions
- Full transaction history with filters
- Add/Edit transaction modal
- CSV upload functionality

### AI Insights
- Financial health assessment
- Budget recommendations
- Personalized saving tips

## 🤝 Demo Credentials

After running the seed script:
- **Email**: demo@example.com
- **Password**: demo123

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- OpenAI for the GPT API
- Chart.js for beautiful charts
- React Icons for the icon library
