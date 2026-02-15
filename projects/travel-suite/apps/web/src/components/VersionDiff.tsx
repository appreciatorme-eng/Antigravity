/**
 * Version Diff Component
 *
 * Shows side-by-side comparison of proposal versions
 * Highlights changes in activities, pricing, and itinerary
 */

'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Plus, Minus, Edit } from 'lucide-react';

interface VersionDiffProps {
  currentVersion: {
    version: number;
    data: any;
    created_at: string;
  };
  previousVersion: {
    version: number;
    data: any;
    created_at: string;
  };
}

interface Change {
  type: 'added' | 'removed' | 'modified';
  field: string;
  oldValue?: any;
  newValue?: any;
  path: string;
}

function detectChanges(oldData: any, newData: any, path: string = ''): Change[] {
  const changes: Change[] = [];

  // Simple comparison for primitive values
  if (typeof oldData !== 'object' || oldData === null) {
    if (oldData !== newData) {
      changes.push({
        type: 'modified',
        field: path,
        oldValue: oldData,
        newValue: newData,
        path,
      });
    }
    return changes;
  }

  // Compare objects/arrays
  const allKeys = new Set([...Object.keys(oldData || {}), ...Object.keys(newData || {})]);

  allKeys.forEach((key) => {
    const oldValue = oldData?.[key];
    const newValue = newData?.[key];
    const newPath = path ? `${path}.${key}` : key;

    if (oldValue === undefined && newValue !== undefined) {
      changes.push({
        type: 'added',
        field: key,
        newValue,
        path: newPath,
      });
    } else if (oldValue !== undefined && newValue === undefined) {
      changes.push({
        type: 'removed',
        field: key,
        oldValue,
        path: newPath,
      });
    } else if (typeof oldValue === 'object' && typeof newValue === 'object') {
      changes.push(...detectChanges(oldValue, newValue, newPath));
    } else if (oldValue !== newValue) {
      changes.push({
        type: 'modified',
        field: key,
        oldValue,
        newValue,
        path: newPath,
      });
    }
  });

  return changes;
}

export default function VersionDiff({ currentVersion, previousVersion }: VersionDiffProps) {
  const [expanded, setExpanded] = useState(true);

  const changes = detectChanges(previousVersion.data, currentVersion.data);

  // Filter out system fields
  const meaningfulChanges = changes.filter(
    (c) =>
      !c.path.includes('created_at') &&
      !c.path.includes('updated_at') &&
      !c.path.includes('id') &&
      !c.path.includes('version')
  );

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'number') return value.toString();
    return value;
  };

  const getChangeIcon = (type: Change['type']) => {
    switch (type) {
      case 'added':
        return <Plus className="w-4 h-4 text-green-600" />;
      case 'removed':
        return <Minus className="w-4 h-4 text-red-600" />;
      case 'modified':
        return <Edit className="w-4 h-4 text-blue-600" />;
    }
  };

  const getChangeBadgeColor = (type: Change['type']) => {
    switch (type) {
      case 'added':
        return 'bg-green-100 text-green-800';
      case 'removed':
        return 'bg-red-100 text-red-800';
      case 'modified':
        return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg">
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
        onClick={() => setExpanded(!expanded)}
      >
        <div>
          <h3 className="text-lg font-bold text-gray-900">
            Version Comparison: v{previousVersion.version} → v{currentVersion.version}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {meaningfulChanges.length} change{meaningfulChanges.length !== 1 ? 's' : ''} detected
          </p>
        </div>
        <button className="p-2 hover:bg-gray-100 rounded-lg">
          {expanded ? (
            <ChevronUp className="w-5 h-5 text-gray-600" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-600" />
          )}
        </button>
      </div>

      {/* Changes List */}
      {expanded && (
        <div className="border-t border-gray-200">
          {meaningfulChanges.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>No changes detected between these versions</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {meaningfulChanges.map((change, index) => (
                <div key={index} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start gap-3">
                    <div className="mt-1">{getChangeIcon(change.type)}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${getChangeBadgeColor(change.type)}`}
                        >
                          {change.type}
                        </span>
                        <span className="text-sm font-medium text-gray-700">
                          {change.field.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                        </span>
                      </div>

                      {/* Show old and new values */}
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        {change.type !== 'added' && (
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Previous (v{previousVersion.version})</p>
                            <div className="p-2 bg-red-50 border border-red-200 rounded">
                              <code className="text-xs text-red-900">
                                {formatValue(change.oldValue)}
                              </code>
                            </div>
                          </div>
                        )}
                        {change.type !== 'removed' && (
                          <div className={change.type === 'added' ? 'col-span-2' : ''}>
                            <p className="text-xs text-gray-500 mb-1">Current (v{currentVersion.version})</p>
                            <div className="p-2 bg-green-50 border border-green-200 rounded">
                              <code className="text-xs text-green-900">
                                {formatValue(change.newValue)}
                              </code>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Version Info Footer */}
      <div className="border-t border-gray-200 p-4 bg-gray-50 text-xs text-gray-600">
        <div className="flex justify-between">
          <span>
            Previous: v{previousVersion.version} •{' '}
            {new Date(previousVersion.created_at).toLocaleString()}
          </span>
          <span>
            Current: v{currentVersion.version} •{' '}
            {new Date(currentVersion.created_at).toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}
