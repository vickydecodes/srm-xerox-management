"use client";

import { useState } from "react";
import { useFieldArray } from "react-hook-form";
import { Plus, Trash2, X } from "lucide-react";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

export default function ProductForm({ form }) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "variants",
  });

  return (
    <>
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Name</FormLabel>
            <FormControl>
              <Input placeholder="Enter name" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Description</FormLabel>
            <FormControl>
              <Textarea placeholder="Enter description" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <Separator className="my-2" />

      <div className="flex items-center justify-between">
        <FormLabel>Variants</FormLabel>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => append({ key: "", values: "" })}
        >
          <Plus className="size-4" />
          Add Variant
        </Button>
      </div>

      {fields.map((item, index) => (
        <div key={item.id} className="flex items-start gap-2">
          <FormField
            control={form.control}
            name={`variants.${index}.key`}
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormControl>
                  <Input placeholder="e.g. color" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name={`variants.${index}.values`}
            render={({ field }) => (
              <FormItem className="flex-[2]">
                <FormControl>
                  <VariantValuesBadgeInput
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Type variant values (e.g. S) and press Enter"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="mt-0.5"
            onClick={() => remove(index)}
          >
            <Trash2 className="size-4 text-destructive" />
          </Button>
        </div>
      ))}
    </>
  );
}

function VariantValuesBadgeInput({ value = '', onChange, placeholder = 'Type and press Enter...' }) {
  const [inputValue, setInputValue] = useState('');

  const valuesArray = value
    ? value.split(',').map((v) => v.trim()).filter(Boolean)
    : [];

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const trimmed = inputValue.trim();
      if (trimmed) {
        if (!valuesArray.includes(trimmed)) {
          const updated = [...valuesArray, trimmed].join(', ');
          onChange(updated);
        }
        setInputValue('');
      }
    }
  };

  const handleBlur = () => {
    const trimmed = inputValue.trim();
    if (trimmed) {
      if (!valuesArray.includes(trimmed)) {
        const updated = [...valuesArray, trimmed].join(', ');
        onChange(updated);
      }
      setInputValue('');
    }
  };

  const removeValue = (valToRemove) => {
    const updated = valuesArray.filter((v) => v !== valToRemove).join(', ');
    onChange(updated);
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      {valuesArray.length > 0 && (
        <div className="flex flex-wrap gap-1.5 p-2 border border-dashed border-border/80 rounded-md bg-muted/40 min-h-9 items-center">
          {valuesArray.map((val) => (
            <Badge key={val} variant="secondary" className="flex items-center gap-1 py-0.5 pl-2 pr-1 text-xs">
              {val}
              <button
                type="button"
                onClick={() => removeValue(val)}
                className="text-muted-foreground hover:text-foreground rounded-full hover:bg-muted p-0.5"
              >
                <X className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
      <Input
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        placeholder={placeholder}
        className="bg-background h-9"
      />
    </div>
  );
}