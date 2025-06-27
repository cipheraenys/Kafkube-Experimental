# Contributing

Contributions to Kafkube Experimental are welcome! Whether improving Kafka event
handling, refining Kubernetes manifests, or writing tests, your help is appreciated.

## Ways to contribute

- **Bug reports**: use the bug report template with Kubernetes version, Node.js version,
  and steps to reproduce.
- **Kafka and streaming enhancements**: optimizing producer batching or consumer latency.
- **Kubernetes manifests**: keeping deployment manifests aligned with current k8s standards.
- **Code and docs**: pull requests welcome.

## Workflow

1. Branch from `main` using `feat/`, `fix/`, or `docs/` prefixes.
2. Keep commits in [Conventional Commits](https://www.conventionalcommits.org)
   style (`feat:`, `fix:`, `docs:`, `chore:`).
3. Fill in the pull request template.
4. Run tests before submitting:
   ```bash
   cd api-service && npm test
   cd ../consumer-service && npm test
   ```
5. CI runs on every push and pull request, so keep it green.
