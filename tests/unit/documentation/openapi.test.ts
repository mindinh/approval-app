import { readFileSync } from 'node:fs';
import path from 'node:path';
import swaggerJsdoc from 'swagger-jsdoc';
import { describe, expect, it } from 'vitest';

const root = path.resolve(__dirname, '../../..');
const spec = () => swaggerJsdoc({
  failOnErrors: true,
  definition: { openapi: '3.0.0', info: { title: 'Route contract', version: '1' } },
  apis: ['srv/controllers/*.ts', 'srv/server.ts'].map(file => path.join(root, file).replace(/\\/g, '/')),
}) as any;

describe('OpenAPI route contract', () => {
  it('documents every mounted REST operation without phantom routes', () => {
    const source = readFileSync(path.join(root, 'srv/handlers/inbox-handler.ts'), 'utf8');
    const mounted = new Set<string>();
    for (const match of source.matchAll(/router\.(get|post|delete)\('([^']+)'/g)) {
      const route = '/tasks' + (match[2] === '/' ? '' : match[2]);
      const variants = route.endsWith('/:fileName?')
        ? [route.replace('/:fileName?', ''), route.replace('?', '')] : [route];
      for (const variant of variants) {
        mounted.add(`${match[1]} ${variant.replace(/:(\w+)/g, '{$1}')}`);
      }
    }
    const server = readFileSync(path.join(root, 'srv/server.ts'), 'utf8');
    for (const match of server.matchAll(/app\.get\('\/api\/cnma\/APPROVAL_SRV([^']+)'/g)) {
      mounted.add(`get ${match[1]}`);
    }
    const documented = Object.entries(spec().paths).flatMap(([url, item]: [string, any]) =>
      Object.keys(item).filter(method => ['get', 'post', 'delete'].includes(method))
        .map(method => `${method} ${url}`));
    expect(documented.sort()).toEqual([...mounted].sort());
  });

  it('declares every path variable as a required parameter', () => {
    for (const [url, item] of Object.entries(spec().paths) as [string, any][]) {
      for (const operation of Object.values(item) as any[]) {
        for (const match of url.matchAll(/\{(\w+)\}/g)) {
          expect(operation.parameters, url).toContainEqual(expect.objectContaining({
            in: 'path', name: match[1], required: true,
          }));
        }
        expect(operation.responses, url).toHaveProperty('200');
      }
    }
  });
});
