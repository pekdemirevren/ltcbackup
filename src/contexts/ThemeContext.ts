import { createContext } from 'react';

export interface ThemeContextType {
  colors: any; // You can define a more specific type for colors
  Icons: any; // Icons object
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);