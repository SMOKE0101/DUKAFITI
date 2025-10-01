import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useCustomersTutorial } from '@/hooks/useCustomersTutorial';

const CustomersTutorialTest = () => {
  const { 
    addCustomerCompleted, 
    customerCardCompleted, 
    resetAddCustomerTutorial, 
    resetCustomerCardTutorial,
    resetAllTutorials
  } = useCustomersTutorial();

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-card rounded-3xl shadow-sm p-6 border border-border">
          <h1 className="text-3xl font-bold text-card-foreground">Customers Tutorial Test</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Test the customers tutorial functionality
          </p>
        </div>

        <Card className="bg-card rounded-3xl border border-border shadow-sm">
          <CardHeader className="p-6 pb-4">
            <CardTitle className="text-2xl font-semibold text-card-foreground">
              Tutorial Status
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Current completion status of customers tutorials
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl border border-border">
                <div>
                  <h3 className="font-medium text-foreground">Add Customer Tutorial</h3>
                  <p className="text-sm text-muted-foreground">
                    {addCustomerCompleted ? 'Completed' : 'Not completed'}
                  </p>
                </div>
                <Button 
                  onClick={resetAddCustomerTutorial}
                  variant="outline"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  Reset
                </Button>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl border border-border">
                <div>
                  <h3 className="font-medium text-foreground">Customer Card Tutorial</h3>
                  <p className="text-sm text-muted-foreground">
                    {customerCardCompleted ? 'Completed' : 'Not completed'}
                  </p>
                </div>
                <Button 
                  onClick={resetCustomerCardTutorial}
                  variant="outline"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
