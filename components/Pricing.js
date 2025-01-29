'use client';

import React, { useState } from 'react';
import { useSession, signIn } from 'next-auth/react';
import Image from 'next/image';
import logo from '@/app/icon.png';

// Stripe Plans >> fill in your own priceId & link
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
        duration: '',
        link: 'https://buy.stripe.com/4gwfZF3PHaUKeJyfYZ',
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
        duration: '',
        link: 'https://buy.stripe.com/6oEaFlcmd9QG30Q28b',
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
        duration: '/month',
        link: 'https://buy.stripe.com/3cs3cTbi9fb0fNC002',
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
//this is the old url link for the 30 tokens  TOKENS_30: 'https://buy.stripe.com/4gwfZF3PHaUKeJyfYZ'
const STRIPE_LINKS = {
    TOKENS_30: 'https://buy.stripe.com/aEU4gXeul2oefNC148',
    TOKENS_90: 'https://buy.stripe.com/6oEaFlcmd9QG30Q28b',
    PRO: 'https://buy.stripe.com/3cs3cTbi9fb0fNC002'
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
            const response = await fetch('/api/tokens', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    action: 'purchase',
                    stripeSessionId: 'manual_purchase' // You can implement proper Stripe session handling later
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to process purchase');
            }

            const data = await response.json();
            alert('Purchase successful! Check your email for confirmation.');
        } catch (error) {
            console.error('Purchase error:', error);
            alert('Error processing purchase. Please try again.');
        }
    };

    return (
        <section className="bg-gray-900 text-white">
            <div className="py-24 px-8 max-w-7xl mx-auto">
                <div className="flex flex-col text-center w-full mb-20">
                    <h1 className="text-5xl font-bold mb-8 bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                        Choose Your Plan
                    </h1>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                        Get instant access to professor ratings, grade distributions, and AI-powered insights
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
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

                <div className="mt-8 text-center">
                    <h3 className="text-lg font-semibold mb-4">Need more tokens?</h3>
                    <a
                        href={STRIPE_LINKS.TOKENS_30}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
                        onClick={() => {
                            const email = prompt('Please enter your email to confirm purchase:');
                            if (email) {
                                handleTokenPurchase(email);
                            }
                        }}
                    >
                        Buy 30 Tokens
                    </a>
                    <p className="mt-2 text-sm text-gray-600">
                        Tokens will be added to your existing account
                    </p>
                </div>

            </div>
        </section>
    );
};

export default Pricing;
