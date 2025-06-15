import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import * as path from 'path';
import * as os from 'os';

import { discoverApiRoutes } from '../../../../src/core/parser/tree/discovery';

describe('Directory Discovery - Route Parameter Conversion', () => {
  let tempDir: string;

  beforeEach(async () => {
    // Create a temporary directory for testing
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'jetway-test-'));
  });

  afterEach(async () => {
    // Clean up the temporary directory
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('Square Bracket to Curly Brace Conversion', () => {
    it('should convert single square bracket parameter to curly braces', async () => {
      // Create directory structure: /users/[id]/get/handler.py
      const routeDir = path.join(tempDir, 'users', '[id]', 'get');
      await fs.mkdir(routeDir, { recursive: true });
      await fs.writeFile(path.join(routeDir, 'handler.py'), 'def handler(): pass');

      const routes = await discoverApiRoutes(tempDir);

      expect(routes).toHaveLength(1);
      expect(routes[0].route).toBe('/users/{id}');
      expect(routes[0].methodDirectories).toHaveLength(1);
      expect(routes[0].methodDirectories[0].method).toBe('get');
    });

    it('should convert multiple square bracket parameters to curly braces', async () => {
      // Create directory structure: /users/[userId]/orders/[orderId]/get/handler.py
      const routeDir = path.join(tempDir, 'users', '[userId]', 'orders', '[orderId]', 'get');
      await fs.mkdir(routeDir, { recursive: true });
      await fs.writeFile(path.join(routeDir, 'handler.py'), 'def handler(): pass');

      const routes = await discoverApiRoutes(tempDir);

      expect(routes).toHaveLength(1);
      expect(routes[0].route).toBe('/users/{userId}/orders/{orderId}');
      expect(routes[0].methodDirectories).toHaveLength(1);
    });

    it('should handle consecutive square bracket parameters', async () => {
      // Create directory structure: /add/[a]/[b]/get/handler.py (like the example)
      const routeDir = path.join(tempDir, 'add', '[a]', '[b]', 'get');
      await fs.mkdir(routeDir, { recursive: true });
      await fs.writeFile(path.join(routeDir, 'handler.py'), 'def handler(): pass');

      const routes = await discoverApiRoutes(tempDir);

      expect(routes).toHaveLength(1);
      expect(routes[0].route).toBe('/add/{a}/{b}');
      expect(routes[0].methodDirectories).toHaveLength(1);
      expect(routes[0].methodDirectories[0].method).toBe('get');
    });

    it('should handle mixed static and parameter segments', async () => {
      // Create directory structure: /api/v1/users/[id]/profile/settings/[key]/get/handler.py
      const routeDir = path.join(tempDir, 'api', 'v1', 'users', '[id]', 'profile', 'settings', '[key]', 'get');
      await fs.mkdir(routeDir, { recursive: true });
      await fs.writeFile(path.join(routeDir, 'handler.py'), 'def handler(): pass');

      const routes = await discoverApiRoutes(tempDir);

      expect(routes).toHaveLength(1);
      expect(routes[0].route).toBe('/api/v1/users/{id}/profile/settings/{key}');
    });

    it('should handle complex parameter names with underscores and numbers', async () => {
      // Create directory structure: /users/[user_id_123]/posts/[post_id_456]/get/handler.py
      const routeDir = path.join(tempDir, 'users', '[user_id_123]', 'posts', '[post_id_456]', 'get');
      await fs.mkdir(routeDir, { recursive: true });
      await fs.writeFile(path.join(routeDir, 'handler.py'), 'def handler(): pass');

      const routes = await discoverApiRoutes(tempDir);

      expect(routes).toHaveLength(1);
      expect(routes[0].route).toBe('/users/{user_id_123}/posts/{post_id_456}');
    });

    it('should handle multiple routes with different parameter patterns', async () => {
      // Create multiple routes with different parameter patterns
      const routes = [
        { path: ['users', '[id]', 'get'], expected: '/users/{id}' },
        { path: ['posts', '[postId]', 'comments', '[commentId]', 'post'], expected: '/posts/{postId}/comments/{commentId}' },
        { path: ['simple', 'get'], expected: '/simple' },
        { path: ['complex', '[a]', '[b]', '[c]', 'put'], expected: '/complex/{a}/{b}/{c}' }
      ];

      for (const route of routes) {
        const routeDir = path.join(tempDir, ...route.path);
        await fs.mkdir(routeDir, { recursive: true });
        await fs.writeFile(path.join(routeDir, 'handler.py'), 'def handler(): pass');
      }

      const discoveredRoutes = await discoverApiRoutes(tempDir);

      expect(discoveredRoutes).toHaveLength(4);
      
      const routePaths = discoveredRoutes.map(r => r.route).sort();
      const expectedPaths = routes.map(r => r.expected).sort();
      
      expect(routePaths).toEqual(expectedPaths);
    });

    it('should preserve regular directory names that look like parameters but are not bracketed', async () => {
      // Create directory structure: /users/id/get/handler.py (no brackets)
      const routeDir = path.join(tempDir, 'users', 'id', 'get');
      await fs.mkdir(routeDir, { recursive: true });
      await fs.writeFile(path.join(routeDir, 'handler.py'), 'def handler(): pass');

      const routes = await discoverApiRoutes(tempDir);

      expect(routes).toHaveLength(1);
      expect(routes[0].route).toBe('/users/id'); // Should NOT be converted
    });

    it('should handle root level parameters', async () => {
      // Create directory structure: /[tenant]/api/users/get/handler.py
      const routeDir = path.join(tempDir, '[tenant]', 'api', 'users', 'get');
      await fs.mkdir(routeDir, { recursive: true });
      await fs.writeFile(path.join(routeDir, 'handler.py'), 'def handler(): pass');

      const routes = await discoverApiRoutes(tempDir);

      expect(routes).toHaveLength(1);
      expect(routes[0].route).toBe('/{tenant}/api/users');
    });

    it('should handle edge case with empty brackets', async () => {
      // Create directory structure: /users/[]/get/handler.py
      const routeDir = path.join(tempDir, 'users', '[]', 'get');
      await fs.mkdir(routeDir, { recursive: true });
      await fs.writeFile(path.join(routeDir, 'handler.py'), 'def handler(): pass');

      const routes = await discoverApiRoutes(tempDir);

      expect(routes).toHaveLength(1);
      expect(routes[0].route).toBe('/users/[]'); // Empty brackets don't match the regex pattern
    });

    it('should handle multiple HTTP methods for parameterized routes', async () => {
      // Create directory structure with multiple methods
      const baseDir = path.join(tempDir, 'users', '[id]');
      
      const methods = ['get', 'post', 'put', 'delete'];
      for (const method of methods) {
        const methodDir = path.join(baseDir, method);
        await fs.mkdir(methodDir, { recursive: true });
        await fs.writeFile(path.join(methodDir, 'handler.py'), 'def handler(): pass');
      }

      const routes = await discoverApiRoutes(tempDir);

      expect(routes).toHaveLength(1);
      expect(routes[0].route).toBe('/users/{id}');
      expect(routes[0].methodDirectories).toHaveLength(4);
      
      const discoveredMethods = routes[0].methodDirectories.map(m => m.method).sort();
      expect(discoveredMethods).toEqual(['delete', 'get', 'post', 'put']);
    });
  });

  describe('Integration with Real Examples', () => {
    it('should correctly process the add/[a]/[b] example structure', async () => {
      // Recreate the structure from examples/basic/api/add/[a]/[b]/get/
      const routeDir = path.join(tempDir, 'add', '[a]', '[b]', 'get');
      await fs.mkdir(routeDir, { recursive: true });
      await fs.writeFile(path.join(routeDir, 'handler.py'), `
def lambda_handler(event, context):
    path_params = event.get('pathParameters', {})
    a = float(path_params.get('a', 0))
    b = float(path_params.get('b', 0))
    return {'statusCode': 200, 'body': str(a + b)}
      `);

      const routes = await discoverApiRoutes(tempDir);

      expect(routes).toHaveLength(1);
      expect(routes[0].route).toBe('/add/{a}/{b}');
      expect(routes[0].methodDirectories).toHaveLength(1);
      expect(routes[0].methodDirectories[0].method).toBe('get');
    });

    it('should correctly process the hello/{user} example structure', async () => {
      // Recreate structures that would result in hello/{user}
      const getDir = path.join(tempDir, 'hello', '[user]', 'get');
      const postDir = path.join(tempDir, 'hello', '[user]', 'post');
      
      await fs.mkdir(getDir, { recursive: true });
      await fs.mkdir(postDir, { recursive: true });
      
      await fs.writeFile(path.join(getDir, 'handler.py'), 'def handler(): pass');
      await fs.writeFile(path.join(postDir, 'handler.py'), 'def handler(): pass');

      const routes = await discoverApiRoutes(tempDir);

      expect(routes).toHaveLength(1);
      expect(routes[0].route).toBe('/hello/{user}');
      expect(routes[0].methodDirectories).toHaveLength(2);
      
      const methods = routes[0].methodDirectories.map(m => m.method).sort();
      expect(methods).toEqual(['get', 'post']);
    });
  });

  describe('Error Cases and Edge Conditions', () => {
    it('should handle malformed bracket syntax gracefully', async () => {
      // Create directory with unclosed bracket
      const routeDir = path.join(tempDir, 'users', '[id', 'get'); // Missing closing bracket
      await fs.mkdir(routeDir, { recursive: true });
      await fs.writeFile(path.join(routeDir, 'handler.py'), 'def handler(): pass');

      const routes = await discoverApiRoutes(tempDir);

      expect(routes).toHaveLength(1);
      expect(routes[0].route).toBe('/users/[id'); // Should remain unchanged
    });

    it('should handle nested brackets', async () => {
      // Create directory with nested brackets (edge case)
      const routeDir = path.join(tempDir, 'users', '[user[id]]', 'get');
      await fs.mkdir(routeDir, { recursive: true });
      await fs.writeFile(path.join(routeDir, 'handler.py'), 'def handler(): pass');

      const routes = await discoverApiRoutes(tempDir);

      expect(routes).toHaveLength(1);
      // The regex matches from the first [ to the first ], so it produces {user[id}]
      expect(routes[0].route).toBe('/users/{user[id}]');
    });
  });
}); 