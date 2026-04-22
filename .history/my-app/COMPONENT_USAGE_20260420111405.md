# Component Usage Examples

## PortalGateway Component

### Props
```javascript
interface PortalGatewayProps {
  onSelectPortal: (portal: 'student' | 'admin') => void
}
```

### Usage
```javascript
<PortalGateway 
  onSelectPortal={(portal) => setSelectedPortal(portal)}
/>
```

### Features
- Two portal options (Student/Admin)
- Hover effects on cards
- Feature badges
- Responsive design
- Icon indicators

---

## StudentLogin Component

### Props
```javascript
interface StudentLoginProps {
  onStudentLogin: (credentials) => Promise<{success, message}>
  onRegister: (userData) => Promise<{success, message}>
  onBack: () => void                    // Go back to portal gateway
  registeredUsersCount: number          // Display student count
  isSyncing: boolean                    // Loading state
}
```

### Usage
```javascript
<StudentLogin
  onStudentLogin={handleStudentLogin}
  onRegister={handleRegister}
  onBack={handleBackFromPortal}
  registeredUsersCount={users.length}
  isSyncing={isSyncing}
/>
```

### Login Tab - Form Fields
```javascript
{
  email: string,
  password: string,
  regNumber: string,
  campus: 'UR' | 'RP',
  gender: 'M' | 'F'
}
```

### Register Tab - Form Fields
```javascript
{
  name: string,
  email: string,
  password: string,
  confirmPassword: string,
  regNumber: string,
  campus: 'UR' | 'RP',
  gender: 'M' | 'F',
  allowAdminUpdates: boolean
}
```

### Features
- Tab-based interface (Login/Register)
- Password visibility toggle
- Form validation
- Success/error messages
- Student counter display
- Back button to portal gateway
- Loading states

---

## Updated Settings Component

### Props (Unchanged)
```javascript
interface SettingsProps {
  user: UserData
  onUpdateProfile: (data) => Promise<{success, message}>
  onUpdateTheme: (theme) => Promise<void>
  userType: 'student' | 'admin'
}
```

### New Features
```javascript
// Appearance Tab now includes:
// Theme selection (Light/Dark)
// Color picker (5 options)
// Visual color indicators
// Real-time preview
```

### Color Options
```javascript
['blue', 'purple', 'green', 'red', 'orange']
```

---

## Updated Theme Context

### Usage
```javascript
import { useTheme } from './contexts/ThemeContext';

function MyComponent() {
  const { 
    theme,          // 'light' or 'dark'
    color,          // 'blue', 'purple', etc
    colors,         // Current active colors
    changeTheme,    // (newTheme) => void
    changeColor,    // (newColor) => void
  } = useTheme();

  return (
    <button onClick={() => changeTheme('dark')}>
      Dark Mode
    </button>
  );
}
```

### Theme Structure
```javascript
{
  theme: 'light',
  color: 'blue',
  colors: {
    primary: '#3b82f6',
    secondary: '#1e40af',
    accent: '#f59e0b',
    success: '#10b981',
    danger: '#ef4444',
    warning: '#f59e0b',
    info: '#06b6d4',
    background: '#f8fafc',
    surface: '#ffffff',
    text: '#0f172a',
    textSecondary: '#64748b',
  }
}
```

---

## Updated App.jsx - New Routing

### Portal Selection State
```javascript
const [selectedPortal, setSelectedPortal] = useState(null);

// Handles
handlePortalSelect(portal)      // Set selected portal
handleBackFromPortal()          // Clear selection & session
```

### New Render Logic
```javascript
{!selectedPortal ? (
  // Show Portal Gateway
  <PortalGateway onSelectPortal={handlePortalSelect} />
  
) : selectedPortal === 'student' ? (
  // Student Path
  !session ? (
    <StudentLogin 
      onStudentLogin={handleStudentLogin}
      onRegister={handleRegister}
      onBack={handleBackFromPortal}
      registeredUsersCount={users.length}
      isSyncing={isSyncing}
    />
  ) : (
    <Dashboard {...dashboardProps} />
  )
  
) : selectedPortal === 'admin' ? (
  // Admin Path
  !session ? (
    <Login 
      {...loginProps}
      isAdminMode={true}
      onBack={handleBackFromPortal}
    />
  ) : (
    <AdminPortal {...adminPortalProps} />
  )
)}
```

---

## Responsive Design Implementation

### Media Query Breakpoints (in each component)

```scss
// Desktop (1024px and above)
// Default styles apply

// Tablet (769px - 1024px)
@media (max-width: 1024px) {
  // Adjusted spacing, smaller fonts
}

// Landscape Mobile (481px - 768px)
@media (max-width: 768px) {
  // Single column layouts, stacked forms
}

// Mobile Portrait (320px - 480px)
@media (max-width: 480px) {
  // Ultra-compact, minimal padding
  // Touch-first design
}

// Extra Small (< 320px, rare)
@media (max-width: 320px) {
  // Extreme fallbacks
}
```

### Responsive Helper Classes (in index.css)

```scss
.responsive-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  
  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  }
  
  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
  
  @media (max-width: 480px) {
    padding: 0 0.5rem;
  }
}
```

---

## Local Storage Integration

### Stored Keys
```javascript
// Theme preference
localStorage.getItem('app-theme')     // Gets 'light' or 'dark'
localStorage.setItem('app-theme', 'dark')

// Color preference
localStorage.getItem('app-color')     // Gets color name
localStorage.setItem('app-color', 'purple')

// Portal selection
localStorage.getItem('selected-portal')     // Gets portal name
localStorage.setItem('selected-portal', 'student')

// Session (existing)
localStorage.getItem(STORAGE_KEYS.session)  // User session
```

### Initialization Example
```javascript
// In ThemeContext
const [theme, setTheme] = useState(() => {
  const saved = localStorage.getItem('app-theme');
  return saved || 'light';  // Default to light
});

useEffect(() => {
  localStorage.setItem('app-theme', theme);
}, [theme]);
```

---

## Form Validation Examples

### Student Login Validation
```javascript
const handleLogin = async () => {
  // Validate all fields
  if (!formData.email) setMessage('Email required');
  if (!formData.password) setMessage('Password required');
  if (!formData.regNumber) setMessage('Reg number required');
  if (!formData.campus) setMessage('Campus required');
  
  // Call login handler
  const result = await onStudentLogin(formData);
  if (result.success) {
    // Redirect to dashboard
  } else {
    setMessage(result.message);
  }
};
```

### Student Registration Validation
```javascript
const handleRegister = async () => {
  // Password matching
  if (formData.password !== formData.confirmPassword) {
    setMessage('Passwords do not match');
    return;
  }
  
  // Password strength
  if (formData.password.length < 8) {
    setMessage('Password must be at least 8 characters');
    return;
  }
  
  // Call register handler
  const result = await onRegister(formData);
};
```

---

## Styling Examples

### Color System (SCSS)
```scss
// Using theme colors
.button-primary {
  background: var(--primary-color);
  color: var(--text-color);
  transition: all 0.3s ease;
  
  &:hover {
    background: var(--primary-dark);
  }
}

// Mobile-first
.card {
  padding: 1rem;
  
  @media (min-width: 768px) {
    padding: 1.5rem;
  }
  
  @media (min-width: 1024px) {
    padding: 2rem;
  }
}
```

### Touch-Friendly Elements
```scss
// Ensure large touch targets
button, a, input {
  min-height: 44px;
  min-width: 44px;
  padding: 0.75rem;
}

// Prevent iOS zoom
input {
  font-size: 16px;  // Exactly 16px prevents zoom
}
```

---

## Integration Checklist

- [x] PortalGateway imports and renders
- [x] StudentLogin passes all props
- [x] Settings receives color options
- [x] ThemeContext provides color methods
- [x] App.jsx routing works correctly
- [x] API handlers called appropriately
- [x] localStorage persists correctly
- [x] Responsive styles applied
- [x] No console errors
- [x] Components animate smoothly

---

## Common Issues & Solutions

### Theme not persisting?
```javascript
// Check localStorage is saving
localStorage.setItem('app-theme', theme);

// Check useEffect dependency
useEffect(() => {
  localStorage.setItem('app-theme', theme);
}, [theme]);  //← Include theme in dependencies
```

### Color not changing?
```javascript
// Ensure changeColor is being called
const { changeColor } = useTheme();
<button onClick={() => changeColor('blue')}>Blue</button>

// Verify color is in colorOptions
colorOptions = ['blue', 'purple', 'green', 'red', 'orange']
```

### Responsive not working?
```scss
// Check breakpoint order (large to small)
@media (max-width: 1024px) { }
@media (max-width: 768px) { }  // More specific first
@media (max-width: 480px) { }

// Use min-width for mobile-first
@media (min-width: 768px) { }  // Apply to tablet and up
```

### Portal not navigating?
```javascript
// Check handlePortalSelect is called
<PortalGateway onSelectPortal={handlePortalSelect} />

// Verify selectedPortal state updates
const [selectedPortal, setSelectedPortal] = useState(null);

// Check render logic uses selectedPortal
{!selectedPortal ? <PortalGateway /> : ...}
```

---

## Performance Optimization Tips

1. **Memoize components that rarely change**
   ```javascript
   const PortalGateway = React.memo(({ onSelectPortal }) => {...});
   ```

2. **Use CSS for animations instead of JS**
   ```scss
   transition: all 0.3s ease;  // Better than JS animation
   ```

3. **Lazy load images**
   ```javascript
   <img loading="lazy" src="..." />
   ```

4. **Use CSS Grid instead of flexbox when possible**
   ```scss
   display: grid;  // Better performance for complex layouts
   ```

5. **Minimize bundle size**
   - Only import needed icons from react-icons
   - Use const imports, not default imports

---

**You now have everything you need to use and extend the new features!** 🚀
