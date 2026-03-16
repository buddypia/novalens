# CLAUDE.md - NovaLens

## Project Overview

| Item | Value |
|------|-------|
| Project | NovaLens - AI Visual Code Review Agent |
| Platform | Web SPA (React 19 + Vite 6) + AWS Lambda Backend |
| Language | TypeScript (Frontend + Backend + IaC) |
| AI Core | Amazon Bedrock (Nova 2 Lite) + Bedrock Agent |
| Architecture | Serverless (9 AWS Services) |
| Budget | ~$12/month (MVP) |

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + Vite 6 + TypeScript |
| Styling | Tailwind CSS 4 + shadcn/ui |
| State | Zustand |
| Backend | AWS Lambda (Node.js 22) + API Gateway |
| Database | Amazon DynamoDB (on-demand) |
| Storage | Amazon S3 |
| Auth | Amazon Cognito |
| AI | Amazon Bedrock (Nova 2 Lite + Agent) |
| CDN | Amazon CloudFront |
| IaC | AWS CDK v2 (TypeScript) |
| CI/CD | GitHub Actions (OIDC) |
| Test | Vitest + Playwright |
| Lint | ESLint + Prettier |

## Project Structure

```
novalens/
├── frontend/               # React 19 + Vite 6 SPA
│   ├── src/
│   │   ├── features/       # Feature-First architecture
│   │   ├── shared/         # Shared components, hooks, utils
│   │   └── config/         # App configuration
│   └── tests/
├── backend/                # Lambda handlers
│   └── src/
│       ├── handlers/       # API Gateway Lambda handlers
│       ├── services/       # DynamoDB, S3, Bedrock clients
│       └── types/          # Shared TypeScript types
├── infra/                  # CDK v2 infrastructure
│   ├── bin/                # CDK app entry
│   └── lib/                # Stack definitions
├── docs/
│   ├── features/           # Feature documentation (SSOT)
│   └── brief2dev/          # Pipeline artifacts
└── .claude/                # AI development infrastructure
```

## Development Commands

```bash
# Frontend
cd frontend && npm run dev          # Dev server (localhost:3001)
cd frontend && npm run build        # Production build
cd frontend && npm run test         # Unit tests
cd frontend && npm run test:e2e     # E2E tests
cd frontend && npm run lint         # Lint
cd frontend && npm run typecheck    # Type check

# Backend
cd backend && npm run build         # Build Lambda bundles
cd backend && npm run test          # Unit tests
cd backend && npm run typecheck     # Type check

# Infrastructure
cd infra && npx cdk synth           # Synthesize CloudFormation
cd infra && npx cdk diff            # Show changes
cd infra && npx cdk deploy          # Deploy to AWS

# Quality Gate (from root)
make q.check                        # Run all quality checks
```

## Architecture Decisions

- **Feature-First**: `src/features/` organizes code by business domain, not technical layer
- **Import Rule**: Features must NOT import from other features directly. Use `shared/` for cross-feature code
- **Contract-First API**: Define Zod schemas before implementing API endpoints
- **TDD**: Write tests before implementation (Red-Green-Refactor)
- **CONTEXT.json is SSOT**: Each feature's state tracked in `docs/features/{name}/CONTEXT.json`

## Path Resolution

All development skills resolve paths from `project-config.json`:
- Features: `frontend/src/features`
- Shared: `frontend/src/shared`
- Tests: `frontend/tests`
- Backend: `backend/src`

## AWS Services (9)

| Service | Role |
|---------|------|
| Amazon Bedrock | Nova 2 Lite + Agent (AI core) |
| AWS Lambda | Backend API + Agent Controller |
| Amazon API Gateway | REST API + Cognito Auth + Rate Limiting |
| Amazon S3 | Frontend hosting + Screenshot/Report storage |
| Amazon CloudFront | CDN |
| Amazon DynamoDB | Analysis history, user data |
| Amazon Cognito | Authentication (User Pool + OAuth) |
| AWS CDK v2 | Infrastructure as Code |
| Amazon CloudWatch | Logging, monitoring, alarms |

## Quality Rules

- Coverage threshold: 80% statements, 70% branches (ratchet: up-only)
- All code changes require corresponding CONTEXT.json
- Conventional Commits for commit messages
- No secrets in code (secret-leak-guard enforced)
- No destructive git commands without confirmation
