import { Link } from 'react-router-dom';
import { FiTrendingUp, FiPieChart, FiUpload, FiShield, FiDollarSign, FiTarget } from 'react-icons/fi';

const Home = () => {
  return (
    <div className="home-page">
      <section className="hero">
        <div className="hero-content">
          <h1>Take Control of Your <span className="highlight">Finances</span></h1>
          <p>
            AI-powered personal finance advisor that helps you understand spending patterns, 
            create budgets, and achieve your financial goals.
          </p>
          <div className="hero-buttons">
            <Link to="/register" className="btn btn-primary btn-lg">
              Get Started Free
            </Link>
            <Link to="/login" className="btn btn-outline btn-lg">
              Sign In
            </Link>
          </div>
        </div>
        <div className="hero-visual">
          <div className="dashboard-preview">
            <div className="preview-card">
              <FiTrendingUp className="preview-icon income" />
              <span>Income</span>
              <strong>$5,240</strong>
            </div>
            <div className="preview-card">
              <FiPieChart className="preview-icon expense" />
              <span>Expenses</span>
              <strong>$3,180</strong>
            </div>
            <div className="preview-card">
              <FiDollarSign className="preview-icon savings" />
              <span>Savings</span>
              <strong>$2,060</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="features">
        <h2>Smart Features for Smart Finances</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">
              <FiUpload />
            </div>
            <h3>Easy Import</h3>
            <p>Upload CSV bank statements or manually enter transactions. We support multiple formats.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <FiPieChart />
            </div>
            <h3>Visual Analytics</h3>
            <p>Beautiful charts and graphs to visualize your spending patterns and trends over time.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <FiTrendingUp />
            </div>
            <h3>AI Insights</h3>
            <p>Get personalized financial advice powered by AI. Understand where your money goes.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <FiTarget />
            </div>
            <h3>Budget Planning</h3>
            <p>Set budgets and savings goals. Track your progress and stay on target.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <FiDollarSign />
            </div>
            <h3>Saving Tips</h3>
            <p>Receive customized tips to reduce spending and increase your savings rate.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <FiShield />
            </div>
            <h3>Secure & Private</h3>
            <p>Your financial data is encrypted and secure. We never share your information.</p>
          </div>
        </div>
      </section>

      <section className="cta">
        <h2>Ready to Transform Your Finances?</h2>
        <p>Join thousands of users who have taken control of their financial future.</p>
        <Link to="/register" className="btn btn-primary btn-lg">
          Start Your Journey
        </Link>
      </section>

      <footer className="home-footer">
        <p>© 2024 FinanceAI. Built with MERN Stack & OpenAI.</p>
      </footer>
    </div>
  );
};

export default Home;
