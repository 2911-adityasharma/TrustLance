import React, { useState } from 'react';

function App() {
  const [isLogin, setIsLogin] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    role: 'freelancer',
    address: '',
    password: '',
    confirmPassword: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle authentication logic here
    console.log(isLogin ? "Logging in..." : "Signing up...");
    console.log(formData);
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>{isLogin ? 'Welcome Back' : 'Welcome'}</h1>
          <p>{isLogin ? 'Please enter your details to log in.' : 'Please enter your details to sign up.'}</p>
        </div>
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input 
              type="email" 
              id="email" 
              name="email" 
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required 
            />
          </div>

          {!isLogin && (
            <>
              <div className="form-group">
                <label>Role</label>
                <div className="role-selector">
                  <label className={`role-option ${formData.role === 'freelancer' ? 'active' : ''}`}>
                    <input 
                      type="radio" 
                      name="role" 
                      value="freelancer" 
                      checked={formData.role === 'freelancer'}
                      onChange={handleChange}
                    />
                    Freelancer
                  </label>
                  <label className={`role-option ${formData.role === 'client' ? 'active' : ''}`}>
                    <input 
                      type="radio" 
                      name="role" 
                      value="client" 
                      checked={formData.role === 'client'}
                      onChange={handleChange}
                    />
                    Client
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="address">Address</label>
                <input 
                  type="text" 
                  id="address" 
                  name="address" 
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Enter your address"
                  required 
                />
              </div>
            </>
          )}

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input 
              type="password" 
              id="password" 
              name="password" 
              value={formData.password}
              onChange={handleChange}
              placeholder={isLogin ? "Enter your password" : "Create a password"}
              required 
            />
          </div>

          {!isLogin && (
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input 
                type="password" 
                id="confirmPassword" 
                name="confirmPassword" 
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your password"
                required 
              />
            </div>
          )}

          <button type="submit" className="submit-btn">{isLogin ? 'Log In' : 'Sign Up'}</button>
        </form>

        <div className="auth-footer">
          <p>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button type="button" onClick={toggleMode} className="toggle-btn">
              {isLogin ? 'Sign Up' : 'Log In'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
