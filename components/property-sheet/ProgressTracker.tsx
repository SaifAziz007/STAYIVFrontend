'use client';

import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, Circle } from 'lucide-react';

interface ProgressTrackerProps {
  completion: {
    identityCompletion: number;
    accessCompletion: number;
    connectivityCompletion: number;
    amenitiesCompletion: number;
    detailedAmenitiesCompletion: number;
    rulesCompletion: number;
    localAreaCompletion: number;
    operationsCompletion: number;
    faqsCompletion: number;
    overallCompletion: number;
    aiTrainingStatus: string;
    validationStatus: string;
  };
}

export default function ProgressTracker({ completion }: ProgressTrackerProps) {
  const modules = [
    { name: 'Property Identity', completion: completion.identityCompletion },
    { name: 'Access & Security', completion: completion.accessCompletion },
    { name: 'Connectivity', completion: completion.connectivityCompletion },
    { name: 'Basic Amenities', completion: completion.amenitiesCompletion },
    { name: 'Detailed Amenities', completion: completion.detailedAmenitiesCompletion },
    { name: 'House Rules', completion: completion.rulesCompletion },
    { name: 'Local Area', completion: completion.localAreaCompletion },
    { name: 'Operations', completion: completion.operationsCompletion },
    { name: 'FAQs & Knowledge', completion: completion.faqsCompletion },
  ];

  const filledModules = modules.filter(m => m.completion > 0).length;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-6">
          {/* Overall Progress */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold">Overall Progress</h3>
              <div className="text-right">
                <span className="text-2xl font-bold text-blue-600">
                  {completion.overallCompletion}%
                </span>
                <p className="text-xs text-gray-500">{filledModules}/9 modules</p>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all"
                style={{ width: `${completion.overallCompletion}%` }}
              />
            </div>
          </div>

          {/* AI Training Status */}
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">AI Training Status</p>
                <p className="font-semibold text-gray-900">
                  {completion.aiTrainingStatus}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Validation</p>
                <p className="font-semibold text-gray-900">
                  {completion.validationStatus}
                </p>
              </div>
            </div>
          </div>

          {/* Module Progress */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">
              Module Completion
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {modules.map((module) => (
                <div
                  key={module.name}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  {module.completion > 0 ? (
                    <CheckCircle2 className={`h-5 w-5 flex-shrink-0 ${module.completion >= 80 ? 'text-green-600' : module.completion >= 40 ? 'text-yellow-500' : 'text-gray-400'}`} />
                  ) : (
                    <Circle className="h-5 w-5 text-gray-400 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {module.name}
                    </p>
                    <p className="text-xs text-gray-600">{module.completion}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
