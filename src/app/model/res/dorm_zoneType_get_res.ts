export interface DormZoneTypeGetRes {
    success: boolean;
    data:    Datum[];
}

export interface Datum {
    ZONE_ID:   number;
    ZONE_NAME: string;
}
