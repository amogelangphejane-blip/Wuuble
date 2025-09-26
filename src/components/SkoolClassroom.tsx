import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BookOpen, PlayCircle, FileText, Lock, CheckCircle2, Clock } from 'lucide-react';

interface SkoolClassroomProps {
  communityId: string;
}

export const SkoolClassroom: React.FC<SkoolClassroomProps> = ({ communityId }) => {
  const courses = [
    {
      id: '1',
      title: 'Growth Hacking Fundamentals',
      description: 'Learn the core principles of growth hacking',
      modules: 8,
      completedModules: 3,
      duration: '4 hours',
      locked: false
    },
    {
      id: '2',
      title: 'Advanced Marketing Strategies',
      description: 'Deep dive into advanced marketing techniques',
      modules: 12,
      completedModules: 0,
      duration: '6 hours',
      locked: false
    },
    {
      id: '3',
      title: 'Scaling Your SaaS',
      description: 'Complete guide to scaling your SaaS business',
      modules: 10,
      completedModules: 0,
      duration: '5 hours',
      locked: true
    }
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Classroom</h1>
        <p className="text-gray-500 text-sm mt-1">Access exclusive courses and learning materials</p>
      </div>

      <div className="space-y-4">
        {courses.map((course) => (
          <Card key={course.id} className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4 flex-1">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                  {course.locked ? (
                    <Lock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  ) : (
                    <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  )}
                </div>
                
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">{course.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {course.description}
                  </p>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                    <span className="flex items-center gap-1">
                      <FileText className="w-4 h-4" />
                      {course.modules} modules
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {course.duration}
                    </span>
                  </div>
                  
                  {!course.locked && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Progress</span>
                        <span className="font-medium">
                          {course.completedModules}/{course.modules} modules
                        </span>
                      </div>
                      <Progress 
                        value={(course.completedModules / course.modules) * 100} 
                        className="h-2"
                      />
                    </div>
                  )}
                </div>
              </div>
              
              <Button 
                variant={course.locked ? "outline" : "default"}
                className={!course.locked ? "bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 dark:text-black text-white" : ""}
              >
                {course.locked ? (
                  <>
                    <Lock className="w-4 h-4 mr-2" />
                    Unlock
                  </>
                ) : course.completedModules > 0 ? (
                  <>
                    Continue
                  </>
                ) : (
                  <>
                    <PlayCircle className="w-4 h-4 mr-2" />
                    Start
                  </>
                )}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};