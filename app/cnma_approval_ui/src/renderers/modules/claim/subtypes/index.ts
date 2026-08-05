import { buildClaimModel } from '../claim.builder';

export interface ClaimSubtypeConfig {
    code: string;
    description: string;
}

export const CLAIM_SUBTYPE_CONFIGS: Record<string, ClaimSubtypeConfig> = {
    CLAIM: {
        code: 'CLAIM',
        description: 'Claim Form',
    },
};

export { buildClaimModel };
