import { describe, it, expect, beforeEach } from 'vitest';
import * as path from 'path';
import { 
  ConfigParser, 
  ConfigFileNotFoundError, 
  ConfigParseError, 
  ConfigValidationError 
} from '../../../../src/core/parser/config';
import { FileError } from '../../../../src/core/model/type/core/errors';

describe('ConfigParser', () => {
  let parser: ConfigParser;
  const configFixturesDir = path.resolve(__dirname, '../../../fixtures/parser/config');

  beforeEach(() => {
    parser = new ConfigParser();
  });

  describe('Successful Parsing', () => {
    it('should parse basic valid config with only runtime', async () => {
      const configPath = path.join(configFixturesDir, 'valid-basic.yaml');
      const config = await parser.parse(configPath);

      expect(config).toEqual({
        runtime: 'python3.11',
        memory: 128,
        timeout: 3,
        entry: 'handler.lambda_handler'
      });
    });

    it('should parse complete config with all fields', async () => {
      const configPath = path.join(configFixturesDir, 'valid-complete.yaml');
      const config = await parser.parse(configPath);

      expect(config).toEqual({
        runtime: 'python3.11',
        entry: 'handler.lambda_handler',
        memory: 512,
        timeout: 10,
        env: ['DATABASE_URL', 'JWT_SECRET'],
        layers: ['shared-lib', 'jwt-utils'],
        permissions: ['dynamodb:GetItem', 's3:PutObject'],
        tags: {
          project: 'jetway',
          environment: 'dev'
        },
        name: 'get-user',
        vpc: {
          securityGroupIds: ['sg-0123456789abcdef0'],
          subnetIds: ['subnet-abcdef0123456789']
        }
      });
    });

    it('should infer Node.js entry point from runtime', async () => {
      const configPath = path.join(configFixturesDir, 'nodejs-runtime.yaml');
      const config = await parser.parse(configPath);

      expect(config.runtime).toBe('nodejs18.x');
      expect(config.entry).toBe('handler.handler');
      expect(config.memory).toBe(256);
      expect(config.timeout).toBe(5);
    });
  });

  describe('Smart Defaults', () => {
    it('should apply default memory and timeout values', async () => {
      const configPath = path.join(configFixturesDir, 'valid-basic.yaml');
      const config = await parser.parse(configPath);

      expect(config.memory).toBe(128);
      expect(config.timeout).toBe(3);
    });

    it('should infer Python entry point for python runtimes', async () => {
      const configPath = path.join(configFixturesDir, 'valid-basic.yaml');
      const config = await parser.parse(configPath);

      expect(config.runtime).toBe('python3.11');
      expect(config.entry).toBe('handler.lambda_handler');
    });

    it('should infer Node.js entry point for nodejs runtimes', async () => {
      const configPath = path.join(configFixturesDir, 'nodejs-runtime.yaml');
      const config = await parser.parse(configPath);

      expect(config.runtime).toBe('nodejs18.x');
      expect(config.entry).toBe('handler.handler');
    });
  });

  describe('Error Handling', () => {
    it('should throw ConfigFileNotFoundError for non-existent file', async () => {
      const configPath = path.join(configFixturesDir, 'non-existent.yaml');
      
      await expect(parser.parse(configPath)).rejects.toThrow(ConfigFileNotFoundError);
    });

    it('should throw ConfigParseError for invalid YAML syntax', async () => {
      const configPath = path.join(configFixturesDir, 'invalid-syntax.yaml');
      
      await expect(parser.parse(configPath)).rejects.toThrow(ConfigParseError);
    });

    it('should throw ConfigValidationError for missing required fields', async () => {
      const configPath = path.join(configFixturesDir, 'invalid-missing-runtime.yaml');
      
      await expect(parser.parse(configPath)).rejects.toThrow(ConfigValidationError);
    });
  });

  describe('Type Safety and Validation', () => {
    it('should validate VPC config structure', async () => {
      const configPath = path.join(configFixturesDir, 'valid-complete.yaml');
      const config = await parser.parse(configPath);

      expect(config.vpc).toBeDefined();
      expect(config.vpc!.securityGroupIds).toEqual(['sg-0123456789abcdef0']);
      expect(config.vpc!.subnetIds).toEqual(['subnet-abcdef0123456789']);
    });
  });
}); 