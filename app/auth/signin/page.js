'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';

export default function SignIn() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        
        try {
            await signIn('email', {
                email,
                callbackUrl: '/',
                redirect: true,
            });
        } catch (error) {
            console.error('Sign in error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-base-200">
            <div className="max-w-md w-full space-y-8 p-8 bg-base-100 rounded-xl shadow-lg">
                <div className="text-center">
                    <h2 className="text-3xl font-bold">Sign In</h2>
                    <p className="mt-2 text-base-content/60">
                        Use your email to sign in or create an account
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                    <div>
                        <label htmlFor="email" className="sr-only">
                            Email address
                        </label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            required
                            className="input input-bordered w-full"
                            placeholder="Email address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    {/* TODO: Add a checkbox for terms and conditions */}

                    <button
                        type="submit"
                        className={`btn btn-primary w-full ${
                            loading ? 'loading' : ''
                        }`}
                        disabled={loading}
                    >
                        {loading ? 'Sending link...' : 'Sign in with Email'}
                    </button>
                </form>
            </div>
        </div>
    );
} 