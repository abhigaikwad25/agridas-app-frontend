export interface MachineLocation {
  _id: string;
  latitude: number;
  longitude: number;
}

export interface Machine {
  _id: string;
  machineType: string;
  taluka: string;
  district: string;
  state: string;
  pricePerDay: number;
  deliveryChargePerKm: number;
  images: string[];
  machinelocation: MachineLocation[];
}
