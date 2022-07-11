import { BadRequest } from '@tsed/exceptions';
import Ajv from 'ajv';
import ajvFormats from 'ajv-formats';
import ajvErrors from 'ajv-errors';
import betterAjvErrors from 'better-ajv-errors';
import { NextFunction, Request, RequestHandler, Response } from 'express';

const ajv = new Ajv({ allErrors: true });
ajvFormats(ajv);
ajvErrors(ajv);

ajv.addFormat('currency', /^(0x)[\da-fA-F]{40}|NATIVE$/);
ajv.addFormat('address', /^(0x)[\da-fA-F]{40}$/);
ajv.addFormat('amount', /^\d+$/);
ajv.addFormat('slippage', /^0.\d+$/);
ajv.addFormat('hex', /^0x[\dA-Fa-f]*$/);

export function validatorMiddlewareFactory(schema: any, placement: 'body' | 'query'): RequestHandler {
  const validate = ajv.compile(schema);

  return (req: Request, res: Response, next: NextFunction): void => {
    const valid = validate(req[placement]);
    if (!valid) {
      const output = betterAjvErrors(schema, req.body, validate.errors, { format: 'js' });
      next(new BadRequest('Validation error', output.map(e => {
        return {
          field: (e as any).path.replace('/', ''),
          message: e.error.replace('/', ''),
        };
      })));
    } else {
      next();
    }
  }
}
