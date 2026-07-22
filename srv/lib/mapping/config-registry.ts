import * as fs from 'fs';
import * as path from 'path';
import { getTransform } from './transforms';

export interface ObjectConfig {
  object: {
    objectType: string;
    displayName: string;
    version: number;
    adapter: string;
    aliases: string[];
    enabledSections: Record<string, boolean>;
    defaultProfile?: string;
  };
  source: {
    service: string;
    rootEntity: string;
    key: Array<{ name: string; value?: string; fromContext?: string }>;
    navigations: Record<string, string>;
  };
  mappings: {
    root: Array<{ sourcePath: string; targetPath: string; type?: string; required?: boolean; transform?: string; dependencies?: string[] }>;
    collections: Record<string, {
      navigationKey: string;
      targetPath: string;
      fields: Array<{ sourcePath: string; targetPath: string; type?: string; required?: boolean; transform?: string; dependencies?: string[] }>;
    }>;
  };
  uiSchema: {
    title?: string;
    subtitle?: string;
    sections: Array<{
      id: string;
      type: string;
      title: string;
      fields?: string[];
      dataPath?: string;
      columns?: string[];
    }>;
  };
  actions: Array<{
    key: string;
    label: string;
    variant: string;
    requiresComment: boolean;
    sapDecisionKey?: string;
  }>;
  cardChips?: Array<{
    label?: string;
    dataPath: string;
    dataType: string;
    formatter?: string;
    isPrimary?: boolean;
  }>;
  profiles: Record<string, {
    includeUiFields?: boolean;
    requiredCanonicalPaths?: string[];
    usageTags?: string[];
  }>;
  documentTypes?: Record<string, {
    name: string;
    budgetMode?: string;
    uiSchema?: any;
    cardChips?: any[];
  }>;
}

export class ConfigRegistry {
  private static instance: ConfigRegistry | null = null;
  private readonly configs = new Map<string, ObjectConfig>();
  private readonly aliasMap = new Map<string, string>();

  private constructor() {
    this.loadConfigurations();
    this.setupFileWatcher();
  }

  public static getInstance(): ConfigRegistry {
    if (!ConfigRegistry.instance) {
      ConfigRegistry.instance = new ConfigRegistry();
    }
    return ConfigRegistry.instance;
  }

  private setupFileWatcher() {
    if (process.env.NODE_ENV !== 'production') {
      const rootConfigDir = path.join(__dirname, '..', '..', 'configuration', 'object-types');
      if (fs.existsSync(rootConfigDir)) {
        try {
          fs.watch(rootConfigDir, { recursive: true }, (eventType, filename) => {
            if (filename && filename.endsWith('config.json')) {
              try {
                this.loadConfigurations();
              } catch (e: any) {
                console.error(`[ConfigRegistry] Hot-reload ignored due to error: ${e.message}`);
              }
            }
          });
        } catch (e: any) {
          console.warn(`[ConfigRegistry] fs.watch initialization warning: ${e.message}`);
        }
      }
    }
  }

  private loadConfigurations() {
    const rootConfigDir = path.join(__dirname, '..', '..', 'configuration', 'object-types');
    if (!fs.existsSync(rootConfigDir)) {
      console.warn(`[ConfigRegistry] Warning: Configuration directory does not exist at ${rootConfigDir}`);
      return;
    }

    const tempConfigs = new Map<string, ObjectConfig>();
    const tempAliasMap = new Map<string, string>();

    const folders = fs.readdirSync(rootConfigDir);
    for (const folder of folders) {
      const folderPath = path.join(rootConfigDir, folder);
      if (fs.statSync(folderPath).isDirectory()) {
        const configPath = path.join(folderPath, 'config.json');
        if (fs.existsSync(configPath)) {
          try {
            const rawContent = fs.readFileSync(configPath, 'utf8');
            const parsed = JSON.parse(rawContent) as ObjectConfig;
            this.validateConfig(parsed);
            
            const objectType = parsed.object.objectType.toUpperCase();
            tempConfigs.set(objectType, parsed);

            // Map aliases
            if (parsed.object.aliases) {
              for (const alias of parsed.object.aliases) {
                tempAliasMap.set(alias.toUpperCase(), objectType);
              }
            }
          } catch (err: any) {
            console.error(`[ConfigRegistry] Failed to load config at ${configPath}: ${err.message}`);
            throw err;
          }
        }
      }
    }

    // Atomic swap to prevent incomplete states upon validation failures
    this.configs.clear();
    this.aliasMap.clear();
    for (const [key, value] of tempConfigs.entries()) {
      this.configs.set(key, value);
    }
    for (const [key, value] of tempAliasMap.entries()) {
      this.aliasMap.set(key, value);
    }
  }

  private validateConfig(config: ObjectConfig) {
    if (!config.object || !config.object.objectType || !config.object.adapter) {
      throw new Error("Invalid configuration structure: object config requires objectType and adapter");
    }
    if (!config.mappings || !config.mappings.root || !config.mappings.collections) {
      throw new Error(`Invalid mappings structure for objectType ${config.object.objectType}`);
    }

    // Verify all transforms specified in root mappings actually exist
    for (const m of config.mappings.root) {
      if (m.transform) {
        getTransform(m.transform); // Will fall back or log if doesn't exist
      }
    }

    // Verify transforms in collection mappings
    for (const key of Object.keys(config.mappings.collections)) {
      const col = config.mappings.collections[key];
      for (const f of col.fields) {
        if (f.transform) {
          getTransform(f.transform);
        }
      }
    }
  }

  public get(objectType: string): ObjectConfig | undefined {
    return this.configs.get(objectType.toUpperCase());
  }

  public getByAlias(alias: string): ObjectConfig | undefined {
    const objectType = this.aliasMap.get(alias.toUpperCase());
    if (!objectType) return undefined;
    return this.configs.get(objectType);
  }

  public list(): ObjectConfig[] {
    return Array.from(this.configs.values());
  }

  public has(objectType: string): boolean {
    return this.configs.has(objectType.toUpperCase());
  }
}
