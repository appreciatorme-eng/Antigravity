"use client"

import { useState } from 'react';
import { Database, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface SampleDataLoaderProps {
  onDataLoaded?: () => void;
}

export function SampleDataLoader({ onDataLoaded }: SampleDataLoaderProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleLoadSampleData = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/onboarding/load-sample-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to load sample data');
        return;
      }

      setSuccess(true);

      // Close dialog after a brief delay to show success message
      setTimeout(() => {
        setOpen(false);
        setSuccess(false);
        onDataLoaded?.();
      }, 1500);
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    // Reset states when dialog is closed
    if (!newOpen) {
      setError(null);
      setSuccess(false);
    }
    setOpen(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="border-[#dcc9aa] text-[#9c7c46] hover:bg-[#f8f1e6] hover:text-[#7c6032]"
        >
          <Database />
          Load Sample Data
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-[#1b140a]">Load Sample Data</DialogTitle>
          <DialogDescription className="text-[#6f5b3e]">
            This will populate your account with realistic demo trips, drivers, and expenses.
            You can explore the platform with real data before adding your own.
          </DialogDescription>
        </DialogHeader>

        {error ? (
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}

        {success ? (
          <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>Sample data loaded successfully!</span>
          </div>
        ) : null}

        {!success && !error ? (
          <div className="rounded-lg border border-[#eadfcd] bg-[#fcf8f1] p-4">
            <p className="text-sm font-semibold text-[#1b140a]">What will be added:</p>
            <ul className="mt-2 space-y-1 text-sm text-[#6f5b3e]">
              <li>• 10 sample trips across popular Indian destinations</li>
              <li>• 4 external drivers with vehicle details</li>
              <li>• 28 trip service costs (hotels, flights, vehicles)</li>
              <li>• 12 monthly overhead expense entries</li>
            </ul>
            <p className="mt-3 text-xs text-[#9c7c46]">
              Note: Sample data can only be loaded once per organization
            </p>
          </div>
        ) : null}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleLoadSampleData}
            disabled={loading || success}
            className="bg-[#9c7c46] text-white hover:bg-[#8a6d3e]"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : success ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Loaded
              </>
            ) : (
              'Load Sample Data'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
