export function useSubmit({ run, form, transform, onSuccess }) {
  return async (values) => {
    const payload = transform ? transform(values) : values;
    const res = await run(payload);
    form?.reset?.();
    onSuccess?.(res);
    return res;
  };
}