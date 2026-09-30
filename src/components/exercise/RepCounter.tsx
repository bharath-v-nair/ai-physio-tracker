import React from 'react';
import { Card } from '../ui/Card';
import { Clock } from 'lucide-react';

interface RepCounterProps {
    reps: number;
    targetReps: number;
}

export const RepCounter: React.FC<RepCounterProps> = ({ reps, targetReps }) => {
    return (
        <Card className="bg-white border-0 shadow-lg rounded-2xl overflow-hidden">
            <div className="p-6 bg-gradient-to-br from-[#00806E] to-blue-600 text-white">
                <div className="flex items-center justify-between mb-4">
                    <span className="uppercase text-sm font-semibold tracking-wider text-blue-100">Rep Count</span>
                    <Clock className="w-5 h-5 text-blue-200" />
                </div>
                <div className="flex items-baseline">
                    <span className="text-6xl font-black">{reps}</span>
                    <span className="text-2xl text-blue-200 ml-2">/ {targetReps}</span>
                </div>
            </div>
        </Card>
    );
};
