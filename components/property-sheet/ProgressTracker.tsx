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
              <h3 className="text-lg font-semibold text-gray-900 dark:text-foreground">
                Overall Progress
              </h3>
              <div className="text-right">
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {completion.overallCompletion}%
                </span>
                <p className="text-xs text-gray-500 dark:text-muted-foreground">
                  {filledModules}/9 modules
                </p>
              </div>
            </div>
            <div className="w-full bg-gray-200 dark:bg-muted rounded-full h-3 overflow-hidden">
              <div
                className="bg-blue-600 dark:bg-blue-500 h-3 rounded-full transition-all min-w-0"
                style={{ width: `${completion.overallCompletion}%` }}
              />
            </div>
          </div>

          {/* AI Training Status */}
          <div className="p-4 bg-blue-50 dark:bg-blue-950/35 border border-blue-100/80 dark:border-blue-900/50 rounded-lg">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-blue-200/80">AI Training Status</p>
                <p className="font-semibold text-gray-900 dark:text-foreground">
                  {completion.aiTrainingStatus}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600 dark:text-blue-200/80">Validation</p>
                <p className="font-semibold text-gray-900 dark:text-foreground">
                  {completion.validationStatus}
                </p>
              </div>
            </div>
          </div>

          {/* Module Progress */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 dark:text-foreground mb-3">
              Module Completion
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {modules.map((module) => (
                <div
                  key={module.name}
                  className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-muted rounded-lg border border-gray-100/80 dark:border-border"
                >
                  {module.completion > 0 ? (
                    <CheckCircle2
                      className={`h-5 w-5 flex-shrink-0 ${
                        module.completion >= 80
                          ? 'text-green-600 dark:text-green-400'
                          : module.completion >= 40
                            ? 'text-yellow-500 dark:text-yellow-400'
                            : 'text-gray-400 dark:text-muted-foreground'
                      }`}
                    />
                  ) : (
                    <Circle className="h-5 w-5 text-gray-400 dark:text-muted-foreground flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-foreground truncate">
                      {module.name}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-muted-foreground">
                      {module.completion}%
                    </p>
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
