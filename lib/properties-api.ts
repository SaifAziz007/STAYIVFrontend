import apiClient from './api-client';

export interface Property {
  id: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  propertySheet?: PropertySheet;
}

export interface PropertySheet {
  id: string;
  propertyId: string;
  identityData?: any;
  identityCompletion: number;
  overallCompletion: number;
  aiTrainingStatus: string;
  validationStatus: string;
}

export interface PropertyIdentityData {
  propertyName: string;
  propertyType: 'apartment' | 'house' | 'condo' | 'villa' | 'townhouse' | 'other';
  address: {
    street: string;
    unit?: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  coordinates?: {
    lat: number;
    lng: number;
  };
  specifications: {
    bedrooms: number;
    bathrooms: number;
    squareFeet?: number;
    maxGuests: number;
  };
  photos: PropertyPhoto[];
  description: string;
  listingUrls?: {
    airbnb?: string;
    bookingCom?: string;
    vrbo?: string;
  };
}

export interface PropertyPhoto {
  id: string;
  url: string;
  caption?: string;
  order: number;
}

export const propertiesApi = {
  async create(): Promise<Property> {
    const response = await apiClient.post('/properties');
    return response.data;
  },

  async getAll(): Promise<Property[]> {
    const response = await apiClient.get('/properties');
    return response.data;
  },

  async getOne(id: string): Promise<Property> {
    const response = await apiClient.get(`/properties/${id}`);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/properties/${id}`);
  },
};

export const propertySheetsApi = {
  async getByPropertyId(propertyId: string): Promise<PropertySheet> {
    const response = await apiClient.get(`/property-sheets/${propertyId}`);
    return response.data;
  },

  async updateIdentity(propertyId: string, data: PropertyIdentityData): Promise<PropertySheet> {
    const response = await apiClient.patch(`/property-sheets/${propertyId}/identity`, data);
    return response.data;
  },

  async getCompletion(propertyId: string) {
    const response = await apiClient.get(`/property-sheets/${propertyId}/completion`);
    return response.data;
  },
};








