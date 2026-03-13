"use client";

import { useState } from "react";
import { GlassButton } from "@/components/glass/GlassButton";
import { GlassInput } from "@/components/glass/GlassInput";
import { GlassModal } from "@/components/glass/GlassModal";
import { GlassTextarea, GlassSelect } from "@/components/glass/GlassInput";
import type { AddOn, AddOnFormData } from "./types";

interface AddOnFormModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onSave: (formData: AddOnFormData) => Promise<void>;
  readonly editingAddOn: AddOn | null;
  readonly initialFormData: AddOnFormData;
  readonly categories: readonly string[];
}

function validateFormData(
  formData: AddOnFormData,
): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!formData.name.trim()) {
    errors.name = "Name is required";
  }

  if (!formData.price.trim()) {
    errors.price = "Price is required";
  } else if (
    isNaN(parseFloat(formData.price)) ||
    parseFloat(formData.price) <= 0
  ) {
    errors.price = "Price must be a positive number";
  }

  if (!formData.category) {
    errors.category = "Category is required";
  }

  return errors;
}

export function AddOnFormModal({
  isOpen,
  onClose,
  onSave,
  editingAddOn,
  initialFormData,
  categories,
}: AddOnFormModalProps) {
  const [formData, setFormData] = useState<AddOnFormData>(initialFormData);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const defaultCats = ["Activities", "Dining", "Transport", "Upgrades"];
  const [isCustomCategory, setIsCustomCategory] = useState(
    editingAddOn ? !defaultCats.includes(editingAddOn.category) : false,
  );

  // Reset form when initialFormData changes (modal opens with new data)
  const [prevInitial, setPrevInitial] = useState(initialFormData);
  if (prevInitial !== initialFormData) {
    setPrevInitial(initialFormData);
    setFormData(initialFormData);
    setFormErrors({});
    setIsCustomCategory(
      editingAddOn ? !defaultCats.includes(editingAddOn.category) : false,
    );
  }

  async function handleSave() {
    const errors = validateFormData(formData);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }

    setSaving(true);
    try {
      await onSave(formData);
    } finally {
      setSaving(false);
    }
  }

  return (
    <GlassModal
      isOpen={isOpen}
      onClose={onClose}
      title={editingAddOn ? "Edit Add-on" : "Create New Add-on"}
      size="lg"
    >
      <div className="space-y-4">
        <GlassInput
          label="Name"
          required
          value={formData.name}
          onChange={(e) =>
            setFormData({ ...formData, name: e.target.value })
          }
          error={formErrors.name}
          placeholder="e.g., Wine Tasting Tour"
        />

        <GlassTextarea
          label="Description"
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          placeholder="Describe the add-on..."
          rows={3}
        />

        <div className="grid grid-cols-2 gap-4">
          <GlassInput
            label="Price"
            type="number"
            required
            value={formData.price}
            onChange={(e) =>
              setFormData({ ...formData, price: e.target.value })
            }
            error={formErrors.price}
            placeholder="0.00"
          />

          {!isCustomCategory ? (
            <GlassSelect
              label="Category"
              required
              options={[
                ...categories
                  .filter((c) => c !== "All")
                  .map((c) => ({ value: c, label: c })),
                { value: "custom", label: "Other..." },
              ]}
              value={formData.category}
              onChange={(e) => {
                if (e.target.value === "custom") {
                  setIsCustomCategory(true);
                  setFormData({ ...formData, category: "" });
                } else {
                  setFormData({ ...formData, category: e.target.value });
                }
              }}
            />
          ) : (
            <div className="space-y-1">
              <GlassInput
                label="Custom Category"
                required
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                placeholder="e.g. VIP Service"
              />
              <button
                type="button"
                onClick={() => {
                  setIsCustomCategory(false);
                  setFormData({ ...formData, category: "Activities" });
                }}
                className="text-xs text-primary hover:underline"
              >
                Back to list
              </button>
            </div>
          )}
        </div>

        <GlassInput
          label="Duration"
          value={formData.duration}
          onChange={(e) =>
            setFormData({ ...formData, duration: e.target.value })
          }
          placeholder="e.g., 2 hours"
          helperText="Optional - How long is this experience?"
        />

        <GlassInput
          label="Image URL"
          value={formData.image_url}
          onChange={(e) =>
            setFormData({ ...formData, image_url: e.target.value })
          }
          placeholder="https://example.com/image.jpg"
          helperText="Optional - Provide a URL to an image"
        />

        <div className="flex gap-3 pt-4">
          <GlassButton variant="ghost" onClick={onClose} fullWidth>
            Cancel
          </GlassButton>
          <GlassButton
            variant="primary"
            onClick={handleSave}
            loading={saving}
            fullWidth
          >
            {editingAddOn ? "Update Add-on" : "Create Add-on"}
          </GlassButton>
        </div>
      </div>
    </GlassModal>
  );
}
