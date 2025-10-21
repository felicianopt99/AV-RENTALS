# Contributing to AV-RENTALS

<div align="center">
  <img src="https://img.shields.io/badge/Contributions-Welcome-brightgreen?style=for-the-badge" alt="Contributions Welcome">
  <img src="https://img.shields.io/badge/Code%20Style-Prettier-ff69b4?style=for-the-badge" alt="Prettier">
  <img src="https://img.shields.io/badge/Commit-Conventional-orange?style=for-the-badge" alt="Conventional Commits">
  <img src="https://img.shields.io/badge/License-MIT-blue?style=for-the-badge" alt="License">
</div>

<br />

We welcome contributions from the community! This guide will help you get started with contributing to the AV-RENTALS project. Whether you're fixing bugs, adding features, improving documentation, or suggesting enhancements, your contributions are valuable to the project.

## 📋 Table of Contents

- [Code of Conduct](#-code-of-conduct)
- [Getting Started](#-getting-started)
- [Development Setup](#-development-setup)
- [Making Changes](#-making-changes)
- [Code Standards](#-code-standards)
- [Testing Guidelines](#-testing-guidelines)
- [Submitting Changes](#-submitting-changes)
- [Review Process](#-review-process)
- [Community](#-community)

## 📜 Code of Conduct

### Our Pledge

We pledge to make participation in our project a harassment-free experience for everyone, regardless of age, body size, disability, ethnicity, gender identity and expression, level of experience, nationality, personal appearance, race, religion, or sexual identity and orientation.

### Expected Behavior

- Use welcoming and inclusive language
- Be respectful of differing viewpoints and experiences
- Gracefully accept constructive criticism
- Focus on what is best for the community
- Show empathy towards other community members

### Unacceptable Behavior

- The use of sexualized language or imagery
- Trolling, insulting/derogatory comments, and personal attacks
- Public or private harassment
- Publishing others' private information without explicit permission
- Other conduct which could reasonably be considered inappropriate

## 🚀 Getting Started

### Ways to Contribute

- 🐛 **Bug Reports**: Help us identify and fix issues
- ✨ **Feature Requests**: Suggest new functionality
- 📖 **Documentation**: Improve guides, API docs, and examples
- 🧪 **Testing**: Add tests to improve code coverage
- 🔧 **Code**: Implement bug fixes and new features
- 🎨 **Design**: Improve UI/UX and user experience
- 🌐 **Translation**: Help localize the application

### Before You Start

1. **Check Existing Issues**: Search [existing issues](https://github.com/felicianopt99/AV-RENTALS/issues) to avoid duplicates
2. **Read Documentation**: Familiarize yourself with the project structure and API
3. **Join Discussions**: Participate in [GitHub Discussions](https://github.com/felicianopt99/AV-RENTALS/discussions)

## 💻 Development Setup

### Prerequisites

- **Node.js**: Version 18.0 or higher
- **npm**: Version 9.0 or higher
- **Git**: For version control
- **Code Editor**: VS Code recommended with the following extensions:
  - TypeScript and JavaScript Language Features
  - Prettier - Code formatter
  - ESLint
  - Prisma
  - Tailwind CSS IntelliSense

### Local Development Setup

1. **Fork the Repository**
   ```bash
   # Fork the repo on GitHub, then clone your fork
   git clone https://github.com/your-username/AV-RENTALS.git
   cd AV-RENTALS
   ```

2. **Set Up Upstream Remote**
   ```bash
   git remote add upstream https://github.com/felicianopt99/AV-RENTALS.git
   git remote -v
   ```

3. **Install Dependencies**
   ```bash
   npm install
   ```

4. **Environment Configuration**
   ```bash
   # Copy environment template
   cp .env.example .env
   
   # Edit with your local settings
   nano .env
   ```

   **Development Environment Variables:**
   ```env
   # Database
   DATABASE_URL="file:./dev.db"
   
   # Authentication
   JWT_SECRET="dev-secret-key-change-in-production"
   NEXTAUTH_SECRET="dev-nextauth-secret"
   
   # Application
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   NODE_ENV="development"
   
   # Optional: AI Features (for testing)
   GOOGLE_GENERATIVE_AI_API_KEY="your-dev-api-key"
   ```

5. **Database Setup**
   ```bash
   # Generate Prisma client
   npm run db:generate
   
   # Apply database schema
   npm run db:push
   
   # Seed with development data
   npm run db:seed
   ```

6. **Start Development Server**
   ```bash
   # Standard development mode
   npm run dev
   
   # Fast mode with Turbopack
   npm run dev:fast
   ```

7. **Verify Setup**
   - Open [http://localhost:3000](http://localhost:3000)
   - Login with: username `admin`, password `admin`
   - Explore the application features

### Development Tools

#### Database Management
```bash
# Open Prisma Studio for database visualization
npm run db:studio

# Reset database to clean state
npm run db:reset

# View current database schema
npm run db:generate
```

#### Code Quality
```bash
# Run TypeScript type checking
npm run typecheck

# Run ESLint
npm run lint

# Format code with Prettier
npm run format
```

## 🔄 Making Changes

### Branching Strategy

We use a Git flow branching model:

- **`master`**: Production-ready code
- **`develop`**: Integration branch for features
- **`feature/*`**: Feature development branches
- **`bugfix/*`**: Bug fix branches
- **`hotfix/*`**: Critical production fixes

### Creating a Branch

```bash
# Sync with upstream
git checkout master
git pull upstream master

# Create feature branch
git checkout -b feature/your-feature-name

# Or for bug fixes
git checkout -b bugfix/fix-description
```

### Branch Naming Conventions

- **Features**: `feature/add-equipment-filtering`
- **Bug Fixes**: `bugfix/fix-rental-conflicts`
- **Documentation**: `docs/update-api-documentation`
- **Performance**: `perf/optimize-database-queries`
- **Refactoring**: `refactor/component-structure`

### Making Commits

We follow [Conventional Commits](https://www.conventionalcommits.org/) specification:

```bash
# Feature
git commit -m "feat: add equipment filtering by category"

# Bug fix
git commit -m "fix: resolve rental conflict detection issue"

# Documentation
git commit -m "docs: update API documentation for equipment endpoints"

# Performance improvement
git commit -m "perf: optimize equipment list query with indexing"

# Refactoring
git commit -m "refactor: extract equipment form into reusable component"

# Breaking change
git commit -m "feat!: change API response format for equipment list"
```

#### Commit Types

- **`feat`**: New feature
- **`fix`**: Bug fix
- **`docs`**: Documentation changes
- **`style`**: Code style changes (formatting, etc.)
- **`refactor`**: Code refactoring
- **`perf`**: Performance improvements
- **`test`**: Adding or updating tests
- **`chore`**: Maintenance tasks

## 🎯 Code Standards

### TypeScript Guidelines

#### Strict Type Safety
```typescript
// ✅ Good: Proper typing
interface EquipmentFormData {
  name: string;
  description: string;
  categoryId: string;
  quantity: number;
  status: EquipmentStatus;
}

// ❌ Bad: Using any
function updateEquipment(data: any) { ... }
```

#### Interface and Type Definitions
```typescript
// ✅ Good: Clear interface definition
interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  profile?: UserProfile;
}

// ✅ Good: Union types for specific values
type EquipmentStatus = 'good' | 'damaged' | 'maintenance';
```

#### Error Handling
```typescript
// ✅ Good: Proper error handling with types
try {
  const result = await api.createEquipment(data);
  return { success: true, data: result };
} catch (error) {
  if (error instanceof APIError) {
    return { success: false, error: error.message };
  }
  return { success: false, error: 'Unknown error occurred' };
}
```

### React Component Guidelines

#### Functional Components
```typescript
// ✅ Good: Functional component with proper props
interface EquipmentCardProps {
  equipment: EquipmentItem;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function EquipmentCard({ equipment, onEdit, onDelete }: EquipmentCardProps) {
  const handleEdit = useCallback(() => {
    onEdit(equipment.id);
  }, [equipment.id, onEdit]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{equipment.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <p>{equipment.description}</p>
        <Button onClick={handleEdit}>Edit</Button>
      </CardContent>
    </Card>
  );
}
```

#### Custom Hooks
```typescript
// ✅ Good: Custom hook with proper return type
interface UseEquipmentReturn {
  equipment: EquipmentItem[];
  loading: boolean;
  error: string | null;
  createEquipment: (data: CreateEquipmentData) => Promise<void>;
  updateEquipment: (id: string, data: UpdateEquipmentData) => Promise<void>;
  deleteEquipment: (id: string) => Promise<void>;
}

export function useEquipment(): UseEquipmentReturn {
  // Implementation
}
```

### API Development Guidelines

#### Input Validation
```typescript
// ✅ Good: Zod schema validation
import { z } from 'zod';

const CreateEquipmentSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  categoryId: z.string().uuid(),
  quantity: z.number().int().min(0),
  status: z.enum(['good', 'damaged', 'maintenance']),
  dailyRate: z.number().positive(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = CreateEquipmentSchema.parse(body);
    // Process request
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
    }
  }
}
```

#### Error Responses
```typescript
// ✅ Good: Consistent error response format
interface APIError {
  error: string;
  code: string;
  details?: Record<string, any>;
  timestamp: string;
}

function createErrorResponse(message: string, code: string, status: number, details?: any) {
  return NextResponse.json({
    error: message,
    code,
    details,
    timestamp: new Date().toISOString(),
  }, { status });
}
```

### Styling Guidelines

#### Tailwind CSS Usage
```tsx
// ✅ Good: Semantic class organization
<div className="flex flex-col gap-4 p-6 bg-card rounded-lg border border-border">
  <h2 className="text-xl font-semibold text-foreground">Equipment Details</h2>
  <p className="text-sm text-muted-foreground">Manage your equipment inventory</p>
</div>

// ✅ Good: Responsive design
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {equipment.map(item => <EquipmentCard key={item.id} equipment={item} />)}
</div>
```

#### Custom Components
```tsx
// ✅ Good: Consistent component structure
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function Button({ 
  className, 
  variant = 'default', 
  size = 'default', 
  ...props 
}: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}
```

## 🧪 Testing Guidelines

### Manual Testing Checklist

Before submitting changes, please test the following:

#### Equipment Management
- [ ] Create new equipment item
- [ ] Edit existing equipment
- [ ] Delete equipment
- [ ] Filter equipment by category/status
- [ ] Search equipment by name
- [ ] Upload equipment images

#### Rental Operations
- [ ] Create new rental
- [ ] Edit rental details
- [ ] Delete rental
- [ ] Check rental conflicts
- [ ] Calendar view functionality
- [ ] Rental preparation workflow

#### User Interface
- [ ] Responsive design on mobile/tablet/desktop
- [ ] Dark mode functionality
- [ ] Navigation between pages
- [ ] Form validation
- [ ] Error message display
- [ ] Loading states

#### Real-time Features
- [ ] Live updates across multiple browsers
- [ ] Conflict resolution
- [ ] Socket.IO connectivity

### Testing Commands

```bash
# Type checking
npm run typecheck

# Linting
npm run lint

# Database operations
npm run db:reset
npm run db:studio

# Build testing
npm run build
npm run start
```

## 📝 Submitting Changes

### Pull Request Process

1. **Ensure Your Branch is Up to Date**
   ```bash
   git checkout master
   git pull upstream master
   git checkout your-feature-branch
   git rebase master
   ```

2. **Run Quality Checks**
   ```bash
   npm run typecheck
   npm run lint
   npm run build
   ```

3. **Push Your Changes**
   ```bash
   git push origin your-feature-branch
   ```

4. **Create Pull Request**
   - Go to [GitHub repository](https://github.com/felicianopt99/AV-RENTALS)
   - Click "New Pull Request"
   - Select your branch
   - Fill out the PR template

### Pull Request Template

```markdown
## Description
Brief description of the changes

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Testing
- [ ] I have tested my changes locally
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes

## Screenshots (if applicable)
Add screenshots to help explain your changes

## Checklist
- [ ] My code follows the style guidelines of this project
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
```

### Commit Message Guidelines

Follow these patterns for your commit messages:

```bash
# Format: type(scope): description

feat(equipment): add image upload functionality
fix(rental): resolve conflict detection algorithm
docs(api): update equipment endpoint documentation
style(ui): improve mobile responsiveness
refactor(auth): extract JWT handling to utility
perf(database): optimize equipment queries
test(rental): add unit tests for conflict detection
chore(deps): update dependencies to latest versions
```

## 🔍 Review Process

### What We Look For

1. **Code Quality**
   - TypeScript best practices
   - Proper error handling
   - Performance considerations
   - Security implications

2. **Design Consistency**
   - UI/UX alignment with existing design
   - Responsive design implementation
   - Accessibility considerations

3. **Testing**
   - Manual testing performed
   - Edge cases considered
   - Backward compatibility

4. **Documentation**
   - Code is well-documented
   - API changes documented
   - README updates if needed

### Review Timeline

- **Small fixes**: 1-2 days
- **New features**: 3-5 days
- **Major changes**: 1-2 weeks

### Addressing Feedback

1. **Make requested changes**
2. **Respond to comments**
3. **Re-request review**
4. **Be patient and collaborative**

## 👥 Community

### Getting Help

- **GitHub Issues**: For bug reports and feature requests
- **GitHub Discussions**: For questions and general discussion
- **Documentation**: Check the [README](README.md) and other docs

### Recognition

Contributors will be:
- Added to the contributors list
- Mentioned in release notes for significant contributions
- Invited to become maintainers for consistent valuable contributions

### Maintainer Responsibilities

Maintainers are responsible for:
- Reviewing and merging pull requests
- Responding to issues and discussions
- Maintaining code quality standards
- Managing releases
- Supporting the community

---

<div align="center">

### 🙏 Thank You

Thank you for contributing to AV-RENTALS! Your contributions make this project better for everyone in the AV rental industry.

[🐛 Report Bug](https://github.com/felicianopt99/AV-RENTALS/issues) | [💡 Request Feature](https://github.com/felicianopt99/AV-RENTALS/issues) | [💬 Join Discussion](https://github.com/felicianopt99/AV-RENTALS/discussions)

**Professional Contribution Guidelines** • **Quality Code Standards** • **Collaborative Development**

</div>