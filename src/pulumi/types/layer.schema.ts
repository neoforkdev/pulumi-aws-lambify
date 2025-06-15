import { z } from 'zod';
import { ParsedLayerSchema } from '../../core/parser/layer/schema';
import { baseProjectSchema } from './shared.schema';

export const JetwayLayerResourceArgsSchema = z.object({
  layer: ParsedLayerSchema,
  ...baseProjectSchema,
});

export const JetwayLayerArgsSchema = z.object({
  layers: z.array(ParsedLayerSchema),
  ...baseProjectSchema,
}); 