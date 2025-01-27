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
        ]
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
        ]
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
        ]
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
        ]
    }
];

const Pricing = () => {
    const { data: session } = useSession();
    const [plan, setPlan] = useState(plans[0]);

    return (
        <>
            <section id="pricing">
                <div className="py-24 px-8 max-w-5xl mx-auto">
                    <div className="flex flex-col text-center w-full mb-20">
                        <p className="font-medium text-primary mb-5">Pricing</p>
                        <h2 className="font-bold text-3xl lg:text-5xl tracking-tight">
                            Hello YouTube
                        </h2>
                    </div>

                    <div className="relative flex justify-center flex-col lg:flex-row items-center lg:items-stretch gap-8">
                        <div className=" w-full max-w-lg">
                            <div className="relative flex flex-col h-full gap-5 lg:gap-8 z-10 bg-base-100 p-8 rounded-xl">
                                <div className="flex items-center gap-8">
                                    {plans.map((p) => (
                                        <div
                                            key={p.name}
                                            className="flex items-center gap-2 cursor-pointer"
                                            onClick={() => setPlan(p)}
                                        >
                                            <input
                                                type="radio"
                                                name="plan"
                                                className="radio"
                                                checked={plan.name === p.name}
                                                onChange={() => setPlan(p)}
                                            />
                                            <span>{p.name}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex gap-2">
                                    <p
                                        className={`text-5xl tracking-tight font-extrabold`}
                                    >
                                        ${plan.price}
                                    </p>
                                    <div className="flex flex-col justify-end mb-[4px]">
                                        <p className="text-sm tracking-wide text-base-content/80 uppercase font-semibold">
                                            {plan.duration}
                                        </p>
                                    </div>
                                </div>

                                <ul className="space-y-2.5 leading-relaxed text-base flex-1">
                                    {plan.features.map((feature, i) => (
                                        <li
                                            key={i}
                                            className="flex items-center gap-2"
                                        >
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                viewBox="0 0 20 20"
                                                fill="currentColor"
                                                className="w-[18px] h-[18px] opacity-80 shrink-0"
                                            >
                                                <path
                                                    fillRule="evenodd"
                                                    d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                                                    clipRule="evenodd"
                                                />
                                            </svg>

                                            <span>{feature} </span>
                                        </li>
                                    ))}
                                </ul>
                                <div className="space-y-2">
                                    <a
                                        className="btn btn-primary btn-block"
                                        target="_blank"
                                        href={plan.link}
                                    >
                                        {plan.price === 0 ? 'Get Started' : 'Subscribe'}
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="fixed right-8 bottom-8">
                <a
                    href="https://shipfa.st?ref=stripe_pricing_viodeo"
                    className="bg-white font-medium inline-block text-sm border border-base-content/20 hover:border-base-content/40 hover:text-base-content/90 hover:scale-105 duration-200 cursor-pointer rounded text-base-content/80 px-2 py-1"
                >
                    <div className="flex gap-1 items-center">
                        <span>Built with</span>
                        <span className="font-bold text-base-content flex gap-0.5 items-center tracking-tight">
                            <Image
                                src={logo}
                                alt="ShipFast logo"
                                priority={true}
                                className="w-5 h-5"
                                width={20}
                                height={20}
                            />
                            ShipFast
                        </span>
                    </div>
                </a>
            </section>
        </>
    );
};

export default Pricing;
