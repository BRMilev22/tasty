import 'react-native';
import React from 'react';

declare module 'react-native' {
  export interface TouchableOpacityProps {
    children?: React.ReactNode;
  }
  
  export interface ViewProps {
    children?: React.ReactNode;
  }
  
  export interface TextProps {
    children?: React.ReactNode;
  }
  
  export namespace Animated {
    export interface ViewProps {
      children?: React.ReactNode;
    }
  }
} 