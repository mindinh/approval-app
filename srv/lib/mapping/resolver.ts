import { ObjectConfig } from './config-registry';

export interface FieldRequirementPlan {
  profile: string;
  canonicalPaths: string[];
  sourcePaths: string[];
}

export class FieldRequirementResolver {
  private static instance: FieldRequirementResolver | null = null;

  private constructor() {}

  public static getInstance(): FieldRequirementResolver {
    if (!FieldRequirementResolver.instance) {
      FieldRequirementResolver.instance = new FieldRequirementResolver();
    }
    return FieldRequirementResolver.instance;
  }

  /**
   * Resolves the required canonical and source paths for a given profile and configuration.
   */
  public resolve(profileName: string, config: ObjectConfig): FieldRequirementPlan {
    const profile = config.profiles[profileName] || config.profiles[config.object.defaultProfile || 'detail'];
    if (!profile) {
      throw new Error(`Profile ${profileName} not found in configuration for ${config.object.objectType}`);
    }

    const canonicalPaths = new Set<string>();

    // 1. Add paths from uiSchema if includeUiFields is true
    if (profile.includeUiFields !== false && config.uiSchema?.sections) {
      for (const section of config.uiSchema.sections) {
        // CARD sections list fields by ID. In this case, we look up the mapping that matches the field ID.
        if (section.fields) {
          for (const fieldId of section.fields) {
            // Find mapping in root where sourcePath or targetPath contains fieldId, or assume targetPath is header.fieldId
            const mappedPath = `header.${fieldId}`;
            canonicalPaths.add(mappedPath);
          }
        }
        // TABLE sections have dataPath (e.g. $.items) and columns list
        if (section.dataPath && section.columns) {
          const cleanDataPath = section.dataPath.replace(/^\$\./, '').replace(/^\$/, '');
          for (const col of section.columns) {
            const mappedPath = cleanDataPath ? `${cleanDataPath}.${col}` : col;
            canonicalPaths.add(mappedPath);
          }
        }
      }
    }

    // 2. Add requiredCanonicalPaths directly
    if (profile.requiredCanonicalPaths) {
      for (const path of profile.requiredCanonicalPaths) {
        canonicalPaths.add(path);
      }
    }

    // 3. Add paths based on usage tags if applicable
    if (profile.usageTags && config.mappings) {
      const tags = profile.usageTags;
      for (const m of config.mappings.root) {
        // Note: For simplicity, if we don't have explicit usage tags in config.json mappings, we map all root elements.
      }
    }

    // 4. Resolve OData source paths corresponding to the required canonical paths
    const sourcePaths = new Set<string>();
    const canonicalPathsArray = Array.from(canonicalPaths);

    for (const path of canonicalPathsArray) {
      // Find matching root mapping
      const rootMatch = config.mappings.root.find(m => m.targetPath === path);
      if (rootMatch) {
        sourcePaths.add(rootMatch.sourcePath);
        if (rootMatch.dependencies) {
          for (const dep of rootMatch.dependencies) {
            sourcePaths.add(dep);
          }
        }
      }

      // Find matching collection mappings
      for (const colKey of Object.keys(config.mappings.collections)) {
        const col = config.mappings.collections[colKey];
        if (path.startsWith(col.targetPath + '.')) {
          const subPath = path.substring(col.targetPath.length + 1);
          const colMatch = col.fields.find(f => f.targetPath === subPath);
          if (colMatch) {
            sourcePaths.add(`${col.navigationKey}/${colMatch.sourcePath}`);
            if (colMatch.dependencies) {
              for (const dep of colMatch.dependencies) {
                sourcePaths.add(`${col.navigationKey}/${dep}`);
              }
            }
          }
        }
      }
    }

    return {
      profile: profileName,
      canonicalPaths: canonicalPathsArray,
      sourcePaths: Array.from(sourcePaths)
    };
  }
}
