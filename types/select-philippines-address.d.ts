declare module "select-philippines-address" {
  // Region interface based on the package's structure
  interface Region {
    id: string;
    psgc_code: string;
    region_name: string;
    region_code: string;
  }

  // Province interface
  interface Province {
    psgc_code: string;
    province_name: string;
    province_code: string;
    region_code: string;
  }

  // City interface
  interface City {
    city_name: string;
    city_code: string;
    province_code: string;
    region_desc: string;
  }

  // Barangay interface
  interface Barangay {
    brgy_name: string;
    brgy_code: string;
    province_code: string;
    region_code: string;
  }

  // Exported functions
  export function regions(): Promise<Region[]>;
  export function regionByCode(code: string): Promise<Region | string>;
  export function provinces(code: string): Promise<Province[]>;
  export function provincesByCode(code: string): Promise<Province[]>;
  export function provinceByName(name: string): Promise<Province | string>;
  export function cities(code: string): Promise<City[]>;
  export function barangays(code: string): Promise<Barangay[]>;
}
