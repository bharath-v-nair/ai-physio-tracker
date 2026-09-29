import React from 'react';
import { Card, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { AlertCircle } from 'lucide-react';

interface ExerciseFeedbackProps {
    formScore: number;
    status: string;
    feedback: string;
}

export const ExerciseFeedback: React.FC<ExerciseFeedbackProps> = ({ formScore, status, feedback }) => {
    const getScoreColor = (score: number) => {
        if (score >= 90) return 'text-green-500';
        if (score >= 80) return 'text-blue-500';
        if (score >= 60) return 'text-yellow-500';
        return 'text-red-500';
    };

    const getScoreLabel = (score: number) => {
        if (score >= 90) return 'Excellent';
        if (score >= 80) return 'Good';
        if (score >= 60) return 'Fair';
        return 'Needs Improvement';
    };

    return (
        <>
            <Card className="bg-white border-0 shadow-lg rounded-2xl">
                <CardContent className="p-6">
                    <span className="uppercase text-xs font-semibold tracking-wider text-gray-500 block mb-2">Exercise Form Score</span>
                    <div className="flex items-center justify-between mb-1">
                        <span className={`text-4xl font-bold ${getScoreColor(formScore)}`}>{formScore}%</span>
                        <Badge variant="default" className={`border-0 ${getScoreColor(formScore)} bg-opacity-10`}>
                            {getScoreLabel(formScore)}
                        </Badge>
                    </div>
                    
                    <div className="w-full bg-gray-100 rounded-full h-2 mt-4">
                        <div 
                            className={`h-2 rounded-full transition-all duration-500 ease-out ${
                                formScore >= 90 ? 'bg-green-500' : formScore >= 80 ? 'bg-blue-500' : formScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                            }`} 
                            style={{ width: `${formScore}%` }}
                        ></div>
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-white border-0 shadow-lg rounded-2xl flex-1 flex flex-col">
                <CardContent className="p-6 flex flex-col h-full">
                    <span className="uppercase text-xs font-semibold tracking-wider text-gray-500 block mb-4">Live Feedback</span>
                    
                    <div className="mb-4">
                        <Badge variant={status === 'Good Form' ? 'success' : status === 'Not Supported' ? 'info' : 'warning'} className="mb-2">
                            {status}
                        </Badge>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-4 flex-1 border border-gray-100 flex items-center justify-center text-center relative overflow-hidden">
                        {status === 'Not Supported' && (
                            <AlertCircle className="absolute -right-4 -bottom-4 w-24 h-24 text-gray-200 opacity-50" />
                        )}
                        <p className="text-lg font-medium text-gray-800 z-10 leading-relaxed">
                            "{feedback}"
                        </p>
                    </div>
                </CardContent>
            </Card>
            
            <p className="text-xs text-center text-gray-400 px-4 mt-2">
                Exercise form feedback is AI-generated and is intended for educational purposes only. Stop if you experience pain or discomfort and consult a qualified physiotherapist when appropriate.
            </p>
        </>
    );
};
