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
    ZBUS2093: {
        code: 'ZBUS2093',
        description: 'Reservation (ZBUS2093)',
    },
    BUS2093: {
        code: 'BUS2093',
        description: 'Reservation (BUS2093)',
    },
};

export { buildReservationModel };

