import { buildReservationModel } from '../reservation.builder';

export interface ReservationSubtypeConfig {
    code: string;
    description: string;
}

export const RESERVATION_SUBTYPE_CONFIGS: Record<string, ReservationSubtypeConfig> = {
    RE: {
        code: 'RE',
        description: 'Reservation',
    },
    RESERVATION: {
        code: 'RESERVATION',
        description: 'Reservation',
    },
};

export { buildReservationModel };
