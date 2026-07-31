"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import ServiceForm from "./service.form";
import { serviceCreateSchema } from "./service.schema";

export const Create = ({ submitFn, exported, data }) => {
  const form = useForm({
    resolver: zodResolver(serviceCreateSchema),
    defaultValues: data ?? {
      name: "",
      description: "",
      unit: "",
      price: 0,
      active: true,
      materials: [],
    },
  });

  const onSubmit = (values) => {
    submitFn(values);
    exported?.closeModal?.();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <ServiceForm form={form} />
        <Button type="submit">Save Service</Button>
      </form>
    </Form>
  );
};