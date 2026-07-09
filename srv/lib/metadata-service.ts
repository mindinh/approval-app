import { SapClient } from './integrations/sap-client';
import { parseStringPromise } from 'xml2js';

/**
 * Service that fetches OData service metadata ($metadata) and provides a simple
 * normalizer that copies primitive properties from raw OData payloads. The
 * normalizer is intentionally lightweight – it does not perform type conversion
 * or deep object mapping; those can be added later if needed.
 */
export class MetadataService {
  private cache: Map<string, any> = new Map();

  constructor(private readonly sapClient: SapClient) { }

  /**
   * Retrieve and cache the EDMX ($metadata) document for a given service path.
   * Returns the parsed JSON representation. Subsequent calls for the same
   * servicePath reuse the cached version.
   */
  async getMetadata(servicePath: string, sapUser: string, userJwt?: string): Promise<any> {
    if (this.cache.has(servicePath)) {
      return this.cache.get(servicePath);
    }
    // Use the generic GET method of SapClient to fetch the XML metadata.
    const { data } = await this.sapClient.get<any>(servicePath, '/$metadata', {}, sapUser, userJwt);
    const parsed = await parseStringPromise(data);
    this.cache.set(servicePath, parsed);
    return parsed;
  }

  async normalizeDetail(raw: any, _servicePath: string, _sapUser: string, _userJwt?: string): Promise<any> {
    if (raw === null || typeof raw !== 'object') {
      return raw;
    }
    if (Array.isArray(raw)) {
      return Promise.all(raw.map(item => this.normalizeDetail(item, _servicePath, _sapUser, _userJwt)));
    }
    const result: any = {};
    for (const key of Object.keys(raw)) {
      if (key === '__metadata' || key === '__deferred') {
        continue;
      }
      const value = raw[key];
      
      // Convert ABAP Booleans ('X' / '') for indicators and flags
      const isBooleanField = key.startsWith('Is') || key.endsWith('Indicator') || key.endsWith('Flag') || key === 'IsPurReqnOvrlRel';
      if (isBooleanField && (value === 'X' || value === '')) {
        result[key] = value === 'X';
        continue;
      }

      // Convert OData Date format "/Date(xxxxxxxxxxxx)/" to ISO Date
      if (typeof value === 'string' && value.startsWith('/Date(')) {
        const match = value.match(/\/Date\((\d+)\)\//);
        if (match) {
          result[key] = new Date(parseInt(match[1], 10)).toISOString();
          continue;
        }
      }

      if (typeof value === 'object' && value !== null) {
        result[key] = await this.normalizeDetail(value, _servicePath, _sapUser, _userJwt);
      } else {
        result[key] = value;
      }
    }
    return result;
  }
}
