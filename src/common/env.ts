import { ValidationError, validateSync } from 'class-validator';
import { Logger } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';

export function validate<T extends object>(
  Schema: new () => T,
  variables: Record<string, unknown>,
) {
  const validatedConfig = plainToInstance(Schema, lowerize(variables), {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
    stopAtFirstError: false,
  });

  if (errors.length > 0) {
    Logger.error(parseError(errors), 'Bootstrap Error');
    process.exit(1);
  }
  return validatedConfig;
}

/**
 * converts all keys of an object to lowercase and returns the new object
 * input: {FOO: 'bar'}
 * output: {foo: 'bar'}
 * @param map
 */
function lowerize(map: Record<string, any>): Record<string, any> {
  return Object.keys(map).reduce((acc, k) => {
    acc[k.toLowerCase()] = map[k];
    return acc;
  }, {});
}

function parseError(errors: ValidationError[]) {
  const map: Record<string, string[]> = {};
  for (const e of errors) {
    Object.values(e.constraints).forEach((e) => {
      const [key, ...others] = e.split(' ');
      const message = others.join(' ');
      if (map[key]) map[key].push(message);
      else map[key] = [message];
    });
  }
  return map;
}
