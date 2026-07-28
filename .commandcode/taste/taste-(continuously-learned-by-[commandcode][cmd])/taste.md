# Taste (Continuously Learned by [CommandCode][cmd])
- Data integrity over completeness: when source data is unreliable (e.g., broken links, wrong coordinates in the upstream site), prefers to exclude those entries rather than insert potentially false data. Willing to defer until the source fixes itself. Confidence: 0.9
- Communicates primarily in French for project discussions. Confidence: 0.9
- Prefers incremental, iterative approach: rather than blocking on edge cases or imperfect data, prefers to fix what can be fixed now and revisit the rest later ("ce n'est pas grave, on les rattrapera une autre fois"). Confidence: 0.7
- Prefers manual, verified GPS coordinate extraction from Google Maps over automated geocoding: systematically extracts coordinates, checks link validity, and excludes entries with broken/wrong upstream links. Provides both decimal degrees and DMS format for verification. Confidence: 0.8
- Mobile-first UX priority: design decisions should prioritize mobile experience ("surtout sur mobile") while maintaining good UI/UX on all devices. Confidence: 0.6
- Wants a modern, contemporary design aesthetic for the app rather than a utilitarian/functional-only look. Confidence: 0.5
- Wants a light/dark theme system that automatically adapts to the user's system preference (prefers-color-scheme), not a manual toggle. Confidence: 0.9
- Design system consistency: insists all UI icons come from the project's icon library (Lucide) — no emoji or non-system icons in the interface. PWA/branding assets (favicon, manifest icons) must also match the app's visual identity and color palette. Confidence: 0.8
