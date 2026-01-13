import { useState, useMemo } from 'react';
import api from '../../api';
import './auth.css';

interface RegisterProps {
    onRegisterSuccess: () => void;
    onSwitchToLogin: () => void;
}

const Register = ({ onRegisterSuccess, onSwitchToLogin }: RegisterProps) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const passwordStrength = useMemo(() => {
        if (!password) return { level: '', text: '' };
        if (password.length < 6) return { level: 'weak', text: 'Weak' };
        if (password.length < 10) return { level: 'medium', text: 'Medium' };
        return { level: 'strong', text: 'Strong' };
    }, [password]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await api.post('/auth/register', { username, password });
            onRegisterSuccess();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Registration failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <h1 className="auth-title">Create Account</h1>
                    <p className="auth-subtitle">Sign up to start using Excalidraw</p>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    {error && (
                        <div className="auth-error">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                <path d="M8 0C3.6 0 0 3.6 0 8s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8zm1 12H7V7h2v5zm0-6H7V4h2v2z" />
                            </svg>
                            {error}
                        </div>
                    )}

                    <div className="form-group">
                        <label htmlFor="username" className="form-label">Username</label>
                        <input
                            id="username"
                            type="text"
                            placeholder="Choose a username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="form-input"
                            required
                            autoComplete="username"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password" className="form-label">Password</label>
                        <input
                            id="password"
                            type="password"
                            placeholder="Create a password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="form-input"
                            required
                            autoComplete="new-password"
                            minLength={6}
                        />
                        {password && (
                            <>
                                <div className="password-strength">
                                    <div className={`password-strength-bar ${passwordStrength.level}`}></div>
                                </div>
                                <span className="password-strength-text">
                                    Password strength: {passwordStrength.text}
                                </span>
                            </>
                        )}
                    </div>

                    <button
                        type="submit"
                        className="auth-button"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Creating account...' : 'Create Account'}
                    </button>
                </form>

                <div className="auth-footer">
                    <span className="auth-footer-text">Already have an account?</span>
                    <button onClick={onSwitchToLogin} className="auth-link">
                        Sign in
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Register;
