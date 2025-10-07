# Contributing to EPLQ

Thank you for your interest in contributing to EPLQ (Efficient Privacy-Preserving Location-Based Query)! This document provides guidelines for contributing to the project.

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct:
- Be respectful and inclusive
- Focus on constructive feedback
- Respect privacy and security considerations
- Follow the project's coding standards

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Git
- Firebase account for testing

### Development Setup
1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/EPLQ-Privacy-Preserving-Location-Based-Queries.git`
3. Install dependencies: `npm install`
4. Set up environment variables (see README.md)
5. Start development server: `npm run dev`

## Contribution Guidelines

### Code Style
- Use TypeScript for all new code
- Follow ESLint rules (`npm run lint`)
- Use Prettier for code formatting
- Write meaningful commit messages
- Include JSDoc comments for functions and classes

### Security Guidelines
- **Never commit sensitive data** (API keys, passwords, etc.)
- Use environment variables for configuration
- Implement proper input validation
- Follow encryption best practices
- Test security features thoroughly

### Testing Requirements
- Write unit tests for new components
- Include integration tests for user workflows
- Add performance tests for critical paths
- Maintain >80% test coverage
- Run full test suite before submitting: `npm run test`

### Privacy Considerations
- Minimize data collection
- Implement privacy by design
- Document data flow and encryption
- Consider differential privacy techniques
- Respect user consent and preferences

## Types of Contributions

### Bug Reports
Use the bug report template and include:
- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Browser/environment details
- Screenshots if applicable

### Feature Requests
Use the feature request template and include:
- Clear use case description
- Privacy implications
- Performance considerations
- Implementation suggestions

### Code Contributions
1. Create a feature branch: `git checkout -b feature/your-feature-name`
2. Make your changes following our guidelines
3. Add/update tests as needed
4. Update documentation if necessary
5. Commit with descriptive messages
6. Push to your fork
7. Create a Pull Request

### Documentation Improvements
- Fix typos and grammar
- Add missing documentation
- Improve code examples
- Update setup instructions
- Translate documentation (future)

## Pull Request Process

1. **Pre-submission Checklist:**
   - [ ] Tests pass (`npm run test`)
   - [ ] Linting passes (`npm run lint`)
   - [ ] Build succeeds (`npm run build`)
   - [ ] Documentation updated
   - [ ] Security considerations addressed

2. **Pull Request Description:**
   - Clear title and description
   - Reference related issues
   - Explain the changes made
   - Highlight security/privacy implications
   - Include screenshots for UI changes

3. **Review Process:**
   - Maintainers will review within 48-72 hours
   - Address feedback constructively
   - Be patient with the review process
   - Make requested changes promptly

## Development Workflow

### Branch Naming
- `feature/feature-name` for new features
- `bugfix/issue-description` for bug fixes
- `docs/documentation-update` for documentation
- `security/security-improvement` for security fixes

### Commit Messages
Follow conventional commit format:
```
type(scope): description

body (optional)

footer (optional)
```

Examples:
- `feat(auth): add two-factor authentication`
- `fix(encryption): resolve key derivation issue`
- `docs(readme): update installation instructions`
- `security(query): implement rate limiting`

### Development Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run test` - Run all tests
- `npm run test:watch` - Run tests in watch mode
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript checks

## Security Vulnerability Reporting

**Do NOT create public issues for security vulnerabilities.**

Instead:
1. Email security concerns to: [security@eplq-project.com]
2. Include detailed description
3. Provide steps to reproduce
4. Suggest potential fixes if known
5. Allow reasonable time for response

We will:
- Acknowledge receipt within 24 hours
- Investigate and validate the issue
- Develop and test a fix
- Release a security update
- Credit the reporter (if desired)

## Performance Optimization

When contributing performance improvements:
- Benchmark before and after changes
- Use the performance utilities in `/src/utils/performance.ts`
- Target the project requirements:
  - Query generation: <0.9 seconds
  - POI search: <3 seconds
- Document performance implications
- Consider memory usage and battery impact

## Privacy-Preserving Features

When implementing privacy features:
- Research current best practices
- Implement proper encryption
- Consider metadata leakage
- Add privacy controls for users
- Document privacy implications
- Test with various threat models

## Community

### Communication Channels
- GitHub Issues for bug reports and feature requests
- GitHub Discussions for general questions
- Pull Request comments for code review

### Getting Help
- Check existing issues and documentation first
- Use appropriate issue templates
- Provide detailed information
- Be patient and respectful

## Recognition

Contributors will be recognized in:
- CONTRIBUTORS.md file
- Release notes for significant contributions
- Documentation for major features
- Security hall of fame for security contributions

## License

By contributing to EPLQ, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to EPLQ! Your efforts help make privacy-preserving location services accessible to everyone.