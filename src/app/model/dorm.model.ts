export interface FacilityItem {
    FAC_TYPE_ID: number;
    FAC_TYPE_NAME: string;
    FAC_TYPE_ICON?: string;
    STATUS?: number;
    id?: number;
    name?: string;
    icon?: string;
}

export interface MasterType {
    id?: number;
    name?: string;
    [key: string]: any;
}

export interface DormZone {
    id?: number;
    name?: string;
    lat?: number;
    lng?: number;
    [key: string]: any;
}
