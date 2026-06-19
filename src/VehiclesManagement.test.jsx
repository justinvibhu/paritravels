import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import VehiclesManagement from './VehiclesManagement';
import { useFirestore } from '../contexts/useFirestore';

// Mock the useFirestore hook
jest.mock('../contexts/useFirestore');

describe('VehiclesManagement Component', () => {
  const mockAddDocument = jest.fn();
  const mockUpdateDocument = jest.fn();
  const mockDeleteDocument = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('displays a loading state initially', () => {
    useFirestore.mockReturnValue({
      docs: [],
      loading: true,
      error: null,
    });

    render(<VehiclesManagement />);
    expect(screen.getByText(/Loading vehicles.../i)).toBeInDocument();
  });

  it('renders an empty list of vehicles and allows opening the add form', () => {
    useFirestore.mockReturnValue({
      docs: [],
      loading: false,
      error: null,
      addDocument: mockAddDocument,
      deleteDocument: mockDeleteDocument,
    });

    render(<VehiclesManagement />);
    
    // Check if empty vehicle data message is rendered
    expect(screen.getByText('No vehicles found. Add one to get started.')).toBeInDocument();
    
    // Check if clicking "Add Vehicle" opens the form
    fireEvent.click(screen.getByText('+ Add Vehicle'));
    expect(screen.getByText('Add New Vehicle')).toBeInDocument();
  });
});