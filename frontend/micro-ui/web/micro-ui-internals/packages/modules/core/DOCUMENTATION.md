# Core Module Documentation

## Overview
The Core module serves as the foundation of the Dristi Solutions frontend application. It provides the essential infrastructure, components, and utilities that other modules depend on to function correctly. This module is responsible for application initialization, routing, user authentication, and rendering the base UI layout.

## Directory Structure

```
core/
├── README.md             # Installation and usage instructions
├── dist/                 # Compiled output
├── package.json          # Dependencies and module information
└── src/                  # Source code
    ├── App.js            # Main application component with routing
    ├── Module.js         # Module initialization and configuration
    ├── Utils/            # Utility functions
    ├── components/       # Reusable UI components
    ├── config/           # Configuration settings
    ├── context/          # React contexts for state management
    ├── hooks/            # Custom React hooks
    ├── lib/              # Library functions (e.g., analytics)
    ├── pages/            # Page components for citizen and employee views
    └── redux/            # State management with Redux
```

## Key Components

### DigitApp (App.js)
The main application component that handles:
- Route configuration for citizen and employee interfaces
- Responsive design and mobile view detection
- Performance metrics tracking using web-vitals
- User session management
- Navigation and history handling

### Pages
- **Citizen Interface**: User-facing interface for citizens to interact with government services
- **Employee Interface**: Administrative interface for government employees to manage operations

### Components
The module includes reusable UI components such as:
- TopBarSideBar: Navigation component for both interfaces
- Various form components and UI elements

## Features
- **Dual Interface**: Separate interfaces for citizens and employees
- **Responsive Design**: Handles different screen sizes with appropriate UI adjustments
- **Performance Monitoring**: Tracks web vitals metrics for performance optimization
- **User Authentication**: Manages user sessions and permissions
- **Multi-language Support**: Internationalization through i18n

## Usage
The Core module is essential for the application and must be included in the main application bundle. It's typically imported and initialized in the main `App.js` file of the frontend application.

```jsx
import { DigitUI } from "@egovernments/digit-ui-module-core";

ReactDOM.render(
  <DigitUI 
    stateCode={stateCode} 
    enabledModules={enabledModules} 
    moduleReducers={moduleReducers} 
  />, 
  document.getElementById("root")
);
```

## Dependencies
- React Router DOM: For application routing
- i18next: For internationalization
- web-vitals: For performance metrics

## Integration with Other Modules
The Core module serves as the foundation for other modules like:
- Cases
- Dristi
- Hearings
- Home
- Orders
- Submissions

Other modules are loaded dynamically and integrated into the application flow through the Core module's routing and state management system.

## Maintainers
See [README.md](./README.md) for a list of current maintainers and contributors.
