'use client';

import React, { useState } from 'react';
import { useSession, signIn } from 'next-auth/react';
import Image from 'next/image';
import logo from '@/app/icon.png';

// Stripe Test Mode Links >> DO NOT USE IN PRODUCTION
export const plans = [
    {
        name: 'Basic',
        price: 0,
        duration: '',
        features: [
            '20 tokens to start',
            '2 tokens per scan',
            '2 tokens per AI analysis',
            'Basic professor stats',
            'Basic tag filtering'
        ],
        description: 'Perfect for trying out our extension'
    },
    {
        name: '30 Tokens',
        price: 0.99,
        duration: '/One Time Payment',
        // TEST MODE LINK - 30 Tokens
        link: 'https://buy.stripe.com/test_00gg2J68n3lX29q4gj',
        features: [
            '30 additional tokens',
            'Never expires',
            'Basic professor stats',
            'Basic tag filtering'
        ],
        description: 'Great for occasional use'
    },
    {
        name: '90 Tokens',
        price: 1.99,
        duration: '/One Time Payment',
        // TEST MODE LINK - 90 Tokens
        link: 'https://buy.stripe.com/test_00gg2JfIXe0B5lC8wx',
        features: [
            '90 additional tokens',
            'Never expires',
            'Basic professor stats',
            'Basic tag filtering'
        ],
        description: 'Best value for regular users'
    },
    {
        name: 'Unlimited Pro',
        price: 10,
        duration: '/One Time Payment',
        // TEST MODE LINK - Unlimited Pro
        link: 'https://buy.stripe.com/test_aEU5o5aoD8GhaFWaEG',
        features: [
            'Unlimited tokens',
            'Unlimited scans',
            'Unlimited AI analysis',
            'Grade predictions',
            'Workload analysis',
            'Course planning tools',
            'Priority support'
        ],
        description: 'For power users who need it all',
        popular: true
    }
];

// Stripe Test Mode Links Object
const STRIPE_LINKS = {
    TOKENS_30: 'https://buy.stripe.com/test_00gg2J68n3lX29q4gj',  // Test mode - 30 tokens
    TOKENS_90: 'https://buy.stripe.com/test_00gg2JfIXe0B5lC8wx',  // Test mode - 90 tokens
    PRO: 'https://buy.stripe.com/test_aEU5o5aoD8GhaFWaEG'        // Test mode - Unlimited Pro
};

const Pricing = () => {
    const { data: session } = useSession();
    const [plan, setPlan] = useState(plans[0]);
    const [showEmailPopup, setShowEmailPopup] = useState(false);
    const [showFollowUpMessage, setShowFollowUpMessage] = useState(false);
    const [email, setEmail] = useState('');

    const handleBasicPlan = async (e) => {
        e.preventDefault();
        if (!email) {
            return;
        }

        try {
            const response = await fetch('/api/tokens', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    email,
                    action: 'register'
                }),
            });

            if (response.ok) {
                setShowEmailPopup(false);
                setShowFollowUpMessage(true);
                setEmail('');
            } else {
                throw new Error('Failed to register');
            }
        } catch (error) {
            console.error('Registration error:', error);
            alert('Error registering. Please try again.');
        }
    };

    const handleTokenPurchase = async (email) => {
        try {
            // Store the email in localStorage before redirecting to Stripe
            localStorage.setItem('pendingTokenPurchaseEmail', email);
            
            // Get the current user's email from the extension if available
            const extensionEmail = localStorage.getItem('userEmail');
            
            // Use either the provided email or the extension email
            const purchaseEmail = email || extensionEmail;
            
            if (!purchaseEmail) {
                alert('Please enter your email address');
                return;
            }

            // Redirect to Stripe test payment link with email parameter
            window.open(`${STRIPE_LINKS.TOKENS_30}?prefilled_email=${encodeURIComponent(purchaseEmail)}`, '_blank');
        } catch (error) {
            console.error('Error handling token purchase:', error);
            alert('There was an error processing your request. Please try again.');
        }
    };

    return (
        <div className="py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center">
                    <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
                        Choose Your Plan
                    </h2>
                    <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-300 sm:mt-4">
                        Get instant access to professor ratings, grade distributions, and AI-powered insights
                    </p>
                </div>

                <div className="mt-12 space-y-4 sm:mt-16 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-6 lg:max-w-4xl lg:mx-auto xl:max-w-none xl:mx-0 xl:grid-cols-4">
                    {plans.map((p) => (
                        <div
                            key={p.name}
                            className={`relative rounded-2xl p-8 ${
                                p.popular
                                    ? 'bg-gradient-to-b from-blue-600 to-blue-800 border-2 border-blue-400'
                                    : 'bg-gray-800'
                            } hover:scale-105 transition-transform duration-300`}
                        >
                            {p.popular && (
                                <div className="absolute top-0 right-0 bg-blue-500 text-white px-4 py-1 rounded-bl-lg rounded-tr-lg text-sm font-semibold">
                                    Most Popular
                                </div>
                            )}
                            <div className="mb-8">
                                <h3 className="text-2xl font-bold mb-2">{p.name}</h3>
                                <p className="text-gray-400 h-12">{p.description}</p>
                            </div>

                            <div className="flex items-baseline mb-8">
                                <span className="text-4xl font-bold">${p.price}</span>
                                <span className="text-gray-400 ml-1">{p.duration}</span>
                            </div>

                            <ul className="space-y-4 mb-8">
                                {p.features.map((feature, i) => (
                                    <li key={i} className="flex items-center gap-3">
                                        <svg
                                            className="w-5 h-5 text-blue-400 shrink-0"
                                            viewBox="0 0 20 20"
                                            fill="currentColor"
                                        >
                                            <path
                                                fillRule="evenodd"
                                                d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                        <span className="text-gray-300">{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            {p.name === 'Basic' ? (
                                <button
                                    onClick={() => setShowEmailPopup(true)}
                                    className="w-full py-3 px-4 rounded-lg text-center font-semibold bg-blue-600 text-white hover:bg-blue-700"
                                >
                                    Get Started
                                </button>
                            ) : (
                                <a
                                    href={p.link || STRIPE_LINKS[p.name.replace(' ', '_').toUpperCase()]}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full py-3 px-4 rounded-lg text-center font-semibold bg-blue-600 text-white hover:bg-blue-700"
                                >
                                    Buy Now
                                </a>
                            )}
                        </div>
                    ))}
                </div>

                {/* Email Popup */}
                {showEmailPopup && (
                    <div className="fixed top-0 left-0 w-full bg-indigo-600 text-white py-4 px-6 flex justify-between items-center z-50">
                        <form onSubmit={handleBasicPlan} className="flex-1 flex justify-center items-center gap-4">
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your email"
                                className="px-4 py-2 rounded text-black w-64"
                                required
                            />
                            <button
                                type="submit"
                                className="bg-white text-indigo-600 px-4 py-2 rounded hover:bg-indigo-50"
                            >
                                Start Free
                            </button>
                        </form>
                        <button
                            onClick={() => setShowEmailPopup(false)}
                            className="ml-4 text-white hover:text-indigo-200"
                        >
                            ✕
                        </button>
                    </div>
                )}

                {/* Follow-up Message */}
                {showFollowUpMessage && (
                    <div className="fixed top-0 left-0 w-full bg-green-600 text-white py-4 px-6 flex justify-between items-center z-50">
                        <div className="flex-1 text-center">
                            <p className="font-semibold">🎉 Almost there! Complete your setup:</p>
                            <p>1. Open the Professor Rater Pro extension</p>
                            <p>2. Enter this same email: {email}</p>
                            <p>3. Click verify to start using your free tokens</p>
                        </div>
                        <button
                            onClick={() => setShowFollowUpMessage(false)}
                            className="ml-4 text-white hover:text-green-200"
                        >
                            ✕
                        </button>
                    </div>
                )}

                {/* Footer Links */}
                <div className="mt-8 text-center text-sm text-gray-400">
                    <a href="/privacy" className="hover:text-white mx-4">Privacy Policy</a>
                    <span>•</span>
                    <a href="/terms" className="hover:text-white mx-4">Terms of Service</a>
                </div>
            </div>
        </div>
    );
};

export default Pricing;
