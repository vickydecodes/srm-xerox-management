
import { Schema } from "mongoose";

export const analyzeSchemaPaths = (schema: Schema, prefix = "") => {
  const populatePaths: string[] = [];
  const refIdPaths: string[] = [];
  const dynamicRefPaths: { path: string; refPath: string }[] = [];

  schema.eachPath((pathName: string, schemaType: any) => {
    const fullPath = prefix ? `${prefix}.${pathName}` : pathName;

    const opts = schemaType?.options || {};

    if (opts.ref) {
      populatePaths.push(fullPath);
      refIdPaths.push(fullPath);
    }

    if (opts.refPath) {
      populatePaths.push(fullPath);
      refIdPaths.push(fullPath);
      dynamicRefPaths.push({ path: fullPath, refPath: opts.refPath });
    }

    if (
      schemaType.instance === "Array" &&
      schemaType.caster?.options?.ref
    ) {
      populatePaths.push(fullPath);
      refIdPaths.push(fullPath);
    }

    if (
      schemaType.instance === "Array" &&
      schemaType.caster?.options?.refPath
    ) {
      populatePaths.push(fullPath);
      refIdPaths.push(fullPath);
      dynamicRefPaths.push({ path: fullPath, refPath: schemaType.caster.options.refPath });
    }

    if (schemaType.schema instanceof Schema) {
      const nested = analyzeSchemaPaths(schemaType.schema, fullPath);
      populatePaths.push(...nested.populatePaths);
      refIdPaths.push(...nested.refIdPaths);
      if (nested.dynamicRefPaths) {
        dynamicRefPaths.push(...nested.dynamicRefPaths);
      }
    }
  });

  return { populatePaths, refIdPaths, dynamicRefPaths };
};
