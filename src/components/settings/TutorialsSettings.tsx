import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface TutorialsSettingsProps {
  onStartDashboardTutorial?: () => void;
}

const TutorialsSettings: React.FC<TutorialsSettingsProps> = ({ onStartDashboardTutorial }) => {
  const navigate = useNavigate();

  const handleStartDashboardTutorial = () => {
    // Navigate to dashboard and trigger tutorial
    navigate('/app/dashboard');
    // We'll use localStorage to signal that tutorial should start
    localStorage.setItem('startDashboardTutorial', 'true');
    if (onStartDashboardTutorial) {
      onStartDashboardTutorial();
    }
  };

  return (
    <Card className="bg-card rounded-3xl border border-border shadow-sm hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="p-6 pb-4">
        <CardTitle className="text-2xl font-semibold text-card-foreground mb-2">
          Tutorials
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          Learn how to use different features of the app with guided walkthroughs
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 pt-0">
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl border border-border">
            <div>
              <h3 className="font-medium text-foreground">Dashboard Tutorial</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Learn how to navigate and use the main dashboard features
              </p>
            </div>
            <Button 
              onClick={handleStartDashboardTutorial}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Play className="h-4 w-4" />
              Start
            </Button>
          </div>
          
          {/* Placeholder for future tutorials */}
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-dashed border-border opacity-50">
            <div>
              <h3 className="font-medium text-foreground">Sales Tutorial</h3>
              <p className="text-sm text-muted-foreground mt-1">
              Learn how to record sales and manage transactions
              </p>
            </div>
            <Button variant="outline" disabled>
              Coming Soon
            </Button>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-dashed border-border opacity-50">
            <div>
              <h3 className="font-medium text-foreground">Inventory Tutorial</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Learn how to manage products and track inventory
              </p>
            </div>
            <Button variant="outline" disabled>
              Coming Soon
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TutorialsSettings;
