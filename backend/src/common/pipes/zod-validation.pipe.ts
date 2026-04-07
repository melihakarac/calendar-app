import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { z } from 'zod';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: z.ZodType) {}

  transform(value: unknown) {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      const errors = this.formatErrors(result.error);
      throw new BadRequestException({
        statusCode: 400,
        message: 'Validation failed',
        errors,
      });
    }
    return result.data;
  }

  private formatErrors(error: z.ZodError): Record<string, string[]> {
    const formatted: Record<string, string[]> = {};
    for (const issue of error.issues) {
      const path = issue.path.join('.') || '_root';
      if (!formatted[path]) {
        formatted[path] = [];
      }
      formatted[path].push(issue.message);
    }
    return formatted;
  }
}
