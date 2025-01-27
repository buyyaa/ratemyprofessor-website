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

const Pricing = () => {
    const { data: session } = useSession();
    const [plan, setPlan] = useState(plans[0]);

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

                            <a
                                href={p.link}
                                target="_blank"
                                className={`w-full py-3 px-4 rounded-lg text-center font-semibold transition-colors duration-200 ${
                                    p.popular
                                        ? 'bg-white text-blue-600 hover:bg-gray-100'
                                        : 'bg-blue-600 text-white hover:bg-blue-700'
                                }`}
                            >
                                {p.price === 0 ? 'Get Started' : 'Subscribe Now'}
                            </a>
                        </div>
                    ))}
                </div>

            </div>
        </section>
    );
};

export default Pricing;
