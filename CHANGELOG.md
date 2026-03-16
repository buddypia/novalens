# Changelog

## [0.1.0] - 2026-03-17

### Added
- Bedrock Agent integration with Nova 2 Lite (us.amazon.nova-2-lite-v1:0)
- Agent Action Group with 3 analysis tools: analyzeCodeQuality, checkAccessibility, generateReport
- Async Lambda architecture: apiFunction → agentFunction (Agent orchestration)
- PR diff analysis support (diff, prUrl, prTitle, files fields)
- DynamoDB analysis history with GSI for user queries
- Cognito User Pool (auth prepared, not enforced for MVP)
- API Gateway with rate limiting and CORS
- CloudFront CDN with S3 frontend hosting
- S3 storage bucket for screenshots and reports
- Frontend: React 19 + Vite 6 SPA with Tailwind CSS 4 + shadcn/ui
