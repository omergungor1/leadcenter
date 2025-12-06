'use client';

import { useState, useEffect } from 'react';
import { CreditCard, Package, Check, Loader2, Calendar } from 'lucide-react';
import { useAuth } from '@/lib/supabase/hooks';
import { fetchAll, fetchById } from '@/lib/supabase/database';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { formatDate } from '../../utils/formatDate';

export default function AccountPage() {
    const { user, loading: authLoading } = useAuth();
    const [userId, setUserId] = useState(null);
    const [userData, setUserData] = useState(null);
    const [currentPlan, setCurrentPlan] = useState(null);
    const [plans, setPlans] = useState([]);
    const [creditPackages, setCreditPackages] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch user ID
    useEffect(() => {
        const fetchUserId = async () => {
            if (!user) return;

            try {
                const { data, error } = await supabase
                    .from('users')
                    .select('id')
                    .eq('auth_id', user.id)
                    .single();

                if (error) {
                    console.error('Error fetching user:', error);
                    return;
                }

                if (data) {
                    setUserId(data.id);
                }
            } catch (error) {
                console.error('Error:', error);
            }
        };

        fetchUserId();
    }, [user]);

    // Fetch user data, plans, and credit packages
    useEffect(() => {
        const fetchData = async () => {
            if (!userId) return;

            setIsLoading(true);
            try {
                // Fetch user data
                const { data: userDataResult, error: userError } = await fetchById('users', userId);

                if (userError) {
                    toast.error('Error loading user data: ' + userError.message);
                    return;
                }

                setUserData(userDataResult);

                // Fetch current plan if user has one
                if (userDataResult?.plan_id) {
                    const { data: planData, error: planError } = await fetchById(
                        'plans',
                        userDataResult.plan_id
                    );

                    if (planError) {
                        console.error('Error fetching plan:', planError);
                    } else {
                        setCurrentPlan(planData);
                    }
                } else {
                    setCurrentPlan(null);
                }

                // Fetch all active plans
                const { data: plansData, error: plansError } = await fetchAll('plans', '*', {
                    is_active: true,
                });

                if (plansError) {
                    console.error('Error fetching plans:', plansError);
                } else {
                    // Sort plans by price (ascending - from smallest to largest)
                    const sortedPlans = (plansData || []).sort((a, b) => {
                        const priceA = parseFloat(a.price) || 0;
                        const priceB = parseFloat(b.price) || 0;
                        return priceA - priceB;
                    });
                    setPlans(sortedPlans);
                }

                // Fetch all active credit packages
                const { data: packagesData, error: packagesError } = await fetchAll(
                    'credit_packages',
                    '*',
                    {
                        is_active: true,
                    }
                );

                if (packagesError) {
                    console.error('Error fetching credit packages:', packagesError);
                } else {
                    setCreditPackages(packagesData || []);
                }
            } catch (error) {
                console.error('Error:', error);
                toast.error('An error occurred while loading data');
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [userId]);

    const remainingCredits = userData
        ? (userData.monthly_credit_limit || 0) - (userData.monthly_credits_used || 0)
        : 0;

    if (authLoading || isLoading) {
        return (
            <div className="p-6 flex items-center justify-center h-full">
                <div className="flex items-center gap-2 text-slate-500">
                    <Loader2 size={20} className="animate-spin" />
                    <span>Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-3xl font-bold text-slate-800">Account</h1>

            {/* Current Plan & Credits Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Current Plan Card */}
                <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-blue-100 rounded-xl">
                            <CreditCard size={24} className="text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-slate-800">Current Plan</h2>
                            <p className="text-sm text-slate-500">Your active subscription</p>
                        </div>
                    </div>

                    {currentPlan ? (
                        <div className="space-y-3">
                            <div>
                                <p className="text-2xl font-bold text-slate-800">{currentPlan.name}</p>
                                <p className="text-sm text-slate-500 mt-1">
                                    {currentPlan.monthly_credits} credits/month
                                </p>
                            </div>
                            <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                                <span className="text-sm text-slate-600">Price</span>
                                <span className="text-lg font-semibold text-slate-800">
                                    ₺{currentPlan.price.toFixed(0)}/month
                                </span>
                            </div>
                            {userData?.subscription_end && (
                                <div className="flex items-center gap-2 text-sm text-slate-500">
                                    <Calendar size={16} />
                                    <span>
                                        Expires: {formatDate(userData.subscription_end)}
                                    </span>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="py-4">
                            <p className="text-slate-500">No active plan</p>
                            <p className="text-sm text-slate-400 mt-1">
                                Select a plan below to get started
                            </p>
                        </div>
                    )}
                </div>

                {/* Credits Summary Card */}
                <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-green-100 rounded-xl">
                            <Package size={24} className="text-green-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-slate-800">Credits</h2>
                            <p className="text-sm text-slate-500">Your credit balance</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div>
                            <p className="text-3xl font-bold text-slate-800">{remainingCredits}</p>
                            <p className="text-sm text-slate-500 mt-1">Remaining credits</p>
                        </div>
                        <div className="pt-3 border-t border-slate-200 space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-600">Monthly Limit</span>
                                <span className="font-medium text-slate-800">
                                    {userData?.monthly_credit_limit || 0}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-600">Used This Month</span>
                                <span className="font-medium text-slate-800">
                                    {userData?.monthly_credits_used || 0}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Subscription Plans */}
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                    <CreditCard size={24} className="text-slate-700" />
                    <h2 className="text-xl font-semibold text-slate-800">Subscription Plans</h2>
                </div>

                {plans.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {plans.map((plan) => {
                            const isCurrentPlan = currentPlan?.id === plan.id;
                            return (
                                <div
                                    key={plan.id}
                                    className={`relative p-6 rounded-xl border-2 transition-all ${isCurrentPlan
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-slate-200 hover:border-blue-300 hover:shadow-md'
                                        }`}
                                >
                                    {isCurrentPlan && (
                                        <div className="absolute top-4 right-4">
                                            <div className="px-2 py-1 bg-blue-500 text-white rounded-lg text-xs font-medium flex items-center gap-1">
                                                <Check size={14} />
                                                Current
                                            </div>
                                        </div>
                                    )}
                                    <div className="mb-4">
                                        <h3 className="text-xl font-bold text-slate-800 mb-2">
                                            {plan.name}
                                        </h3>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-3xl font-bold text-slate-800">
                                                ₺{plan.price.toFixed(0)}
                                            </span>
                                            <span className="text-slate-500">/month</span>
                                        </div>
                                    </div>
                                    <div className="space-y-3 mb-6">
                                        <div className="flex items-center gap-2">
                                            <Package size={18} className="text-slate-400" />
                                            <span className="text-sm text-slate-600">
                                                {plan.monthly_credits} credits/month
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        className={`w-full py-2.5 rounded-xl font-medium transition-colors ${isCurrentPlan
                                            ? 'bg-blue-500 text-white cursor-default'
                                            : 'bg-blue-500 text-white hover:bg-blue-600'
                                            }`}
                                        disabled={isCurrentPlan}
                                    >
                                        {isCurrentPlan ? 'Current Plan' : 'Select Plan'}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <p className="text-slate-500 text-center py-8">No plans available</p>
                )}
            </div>

            {/* Credit Packages */}
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                    <Package size={24} className="text-slate-700" />
                    <h2 className="text-xl font-semibold text-slate-800">Credit Packages</h2>
                </div>

                {creditPackages.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {creditPackages.map((pkg) => (
                            <div
                                key={pkg.id}
                                className="p-6 rounded-xl border-2 border-slate-200 hover:border-blue-300 hover:shadow-md transition-all"
                            >
                                <div className="mb-4">
                                    <h3 className="text-lg font-bold text-slate-800 mb-2">
                                        {pkg.name}
                                    </h3>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-2xl font-bold text-slate-800">
                                            ₺{pkg.price.toFixed(0)}
                                        </span>
                                    </div>
                                </div>
                                <div className="space-y-3 mb-6">
                                    <div className="flex items-center gap-2">
                                        <Package size={18} className="text-slate-400" />
                                        <span className="text-sm text-slate-600">
                                            {pkg.credits} credits
                                        </span>
                                    </div>
                                    <div className="text-xs text-slate-500">
                                        ₺{(pkg.price / pkg.credits).toFixed(3)} per credit
                                    </div>
                                </div>
                                <button className="w-full py-2.5 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors">
                                    Purchase
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-slate-500 text-center py-8">No credit packages available</p>
                )}
            </div>
        </div>
    );
}

