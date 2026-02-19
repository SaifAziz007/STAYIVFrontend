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
  accessData?: any;
  connectivityData?: any;
  amenitiesData?: any;
  detailedAmenitiesData?: any;
  rulesData?: any;
  localAreaData?: any;
  operationsData?: any;
  faqsData?: any;
  identityCompletion: number;
  accessCompletion: number;
  connectivityCompletion: number;
  amenitiesCompletion: number;
  detailedAmenitiesCompletion: number;
  rulesCompletion: number;
  localAreaCompletion: number;
  operationsCompletion: number;
  faqsCompletion: number;
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

export const aiApi = {
  async indexProperty(propertyId: string) {
    const response = await apiClient.post(`/ai/properties/${propertyId}/index`);
    return response.data;
  },

  async queryProperty(propertyId: string, question: string) {
    const response = await apiClient.post(`/ai/properties/${propertyId}/query`, { question });
    return response.data;
  },

  async analyzeConversations() {
    const response = await apiClient.get('/ai/analyze-conversations');
    return response.data;
  },

  async seedFaqs(propertyId: string) {
    const response = await apiClient.post(`/ai/properties/${propertyId}/seed-faqs`);
    return response.data;
  },

  async generateFaqAnswers(propertyId: string, questions: string[]) {
    const response = await apiClient.post(`/ai/properties/${propertyId}/generate-faq-answers`, { questions });
    return response.data;
  },
};
