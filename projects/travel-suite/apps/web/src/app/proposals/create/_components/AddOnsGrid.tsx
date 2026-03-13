'use client';

import Link from 'next/link';
import type { AddOn } from '../_types';

export type AddOnsGridProps = {
  addOns: AddOn[];
  selectedVehicleId: string;
  selectedAddOnIds: Set<string>;
  onSelectVehicle: (id: string) => void;
  onToggleAddOn: (id: string, checked: boolean) => void;
  estimatedTotal: number;
};

export function AddOnsGrid({
  addOns,
  selectedVehicleId,
  selectedAddOnIds,
  onSelectVehicle,
  onToggleAddOn,
  estimatedTotal,
}: AddOnsGridProps) {
  const vehicles = addOns.filter((a) => a.category === 'Transport');
  const optionalAddOns = addOns.filter((a) => a.category !== 'Transport');

  return (
    <div className="bg-white rounded-2xl border border-[#eadfcd] p-6">
      <h2 className="text-lg font-semibold text-[#1b140a] mb-2">Options & Add-ons</h2>
      <p className="text-sm text-[#6f5b3e] mb-4">
        Choose a vehicle type and optional add-ons. These will appear on the proposal and update pricing dynamically.
      </p>

      {addOns.length === 0 ? (
        <div className="text-sm text-[#6f5b3e]">
          No add-ons found. Create them in{' '}
          <Link href="/add-ons" target="_blank" className="text-[#9c7c46] hover:underline">
            Admin &rarr; Add-ons
          </Link>{' '}
          (opens new tab). Use category <span className="font-medium">Transport</span> for vehicle types.
        </div>
      ) : (
        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between gap-3 mb-2">
              <h3 className="text-sm font-semibold text-[#1b140a]">Vehicle Type</h3>
              {selectedVehicleId ? (
                <button
                  type="button"
                  onClick={() => onSelectVehicle('')}
                  className="text-xs text-[#6f5b3e] hover:underline"
                >
                  Clear
                </button>
              ) : null}
            </div>

            {vehicles.length === 0 ? (
              <div className="text-sm text-[#6f5b3e]">
                No Transport add-ons found. Add vehicle options under category <span className="font-medium">Transport</span>.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {vehicles.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => onSelectVehicle(v.id)}
                    className={`p-4 rounded-xl border text-left transition-colors ${selectedVehicleId === v.id
                      ? 'border-[#9c7c46] bg-[#f8f1e6]'
                      : 'border-[#eadfcd] hover:bg-gray-50'
                      }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-medium text-[#1b140a] truncate">{v.name}</div>
                        {v.description ? (
                          <div className="text-xs text-[#6f5b3e] mt-1">{v.description}</div>
                        ) : null}
                      </div>
                      <div className="text-sm font-semibold text-[#1b140a] whitespace-nowrap">
                        ${Number(v.price || 0).toFixed(2)}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <h3 className="text-sm font-semibold text-[#1b140a] mb-2">Optional Add-ons</h3>
            {optionalAddOns.length === 0 ? (
              <div className="text-sm text-[#6f5b3e]">No optional add-ons available.</div>
            ) : (
              <div className="space-y-2">
                {optionalAddOns.slice(0, 30).map((a) => {
                  const checked = selectedAddOnIds.has(a.id);
                  return (
                    <label
                      key={a.id}
                      className="flex items-start gap-3 p-3 rounded-xl border border-[#eadfcd] hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => onToggleAddOn(a.id, e.target.checked)}
                        className="mt-1 w-4 h-4 text-[#9c7c46] border-gray-300 rounded focus:ring-[#9c7c46]"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-3">
                          <div className="font-medium text-[#1b140a] truncate">{a.name}</div>
                          <div className="text-sm font-semibold text-[#1b140a] whitespace-nowrap">
                            ${Number(a.price || 0).toFixed(2)}
                          </div>
                        </div>
                        <div className="text-xs text-[#6f5b3e] mt-0.5 truncate">
                          {[a.category, a.duration].filter(Boolean).join(' . ')}
                        </div>
                        {a.description ? (
                          <div className="text-xs text-[#6f5b3e] mt-1">{a.description}</div>
                        ) : null}
                      </div>
                    </label>
                  );
                })}
                {optionalAddOns.length > 30 ? (
                  <div className="text-xs text-[#6f5b3e]">
                    Showing first 30 add-ons. Manage full list in{' '}
                    <Link href="/add-ons" target="_blank" className="text-[#9c7c46] hover:underline">
                      Add-ons
                    </Link>
                    .
                  </div>
                ) : null}
              </div>
            )}
          </div>

          <div className="p-4 rounded-xl border border-[#eadfcd] bg-[#fffdf8]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-[#1b140a]">Estimated Total</div>
                <div className="text-xs text-[#6f5b3e]">
                  Base template + selected options (final price also includes selected activities/hotels).
                </div>
              </div>
              <div className="text-xl font-semibold text-[#1b140a]">
                ${Number(estimatedTotal || 0).toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
