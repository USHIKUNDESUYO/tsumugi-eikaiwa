# Correction Card Component Specification

## Component Location
`/workspace/components/CorrectionCard.tsx`

## Visual Design

### Structure
```
┌─────────────────────────────────────────┐
│ [Icon] 小さなポイント              ▼    │  <- Header (clickable)
├─────────────────────────────────────────┤
│ ❌ "I want to talking about..."         │  <- What was said
│                                         │
│ ✅ "I want to talk about..."            │  <- Better alternative
│ ─────────────────────────────────────── │
│ 動詞の後は原形を使います。"want to"の │  <- Explanation (JP)
│ 後は動詞の原形 "talk" が正しいです。  │
└─────────────────────────────────────────┘
```

## Features

### 1. Collapsible Design
- **Default State**: Expanded (isExpanded = true)
- **Toggle**: Click anywhere on header to expand/collapse
- **Indicator**: ▼ arrow rotates 180° when expanded
- **Animation**: Smooth CSS transitions

### 2. Severity Levels

#### Minor (小さなポイント)
- **Color**: Blue (`bg-blue-50/80 border-blue-200/50`)
- **Icon**: 💡 (lightbulb)
- **Use**: Small corrections, minor improvements

#### Moderate (気をつけたいポイント)
- **Color**: Amber (`bg-amber-50/80 border-amber-200/50`)
- **Icon**: ⚠️ (warning)
- **Use**: Common mistakes, important to remember

#### Important (重要なポイント)
- **Color**: Rose (`bg-rose-50/80 border-rose-200/50`)
- **Icon**: ⭐ (star)
- **Use**: Critical grammar errors, essential corrections

### 3. Content Display

**Said (❌)**:
- Red X icon
- User's original incorrect phrase
- Gray text color

**Better (✅)**:
- Green checkmark icon
- Corrected version
- Bold, darker text for emphasis

**Explanation (Why)**:
- Separated by subtle border
- Japanese explanation
- Medium gray text

## Integration

### Data Format
The component expects a `CorrectionCard` object:
```typescript
interface CorrectionCard {
  said: string;        // What the user said (incorrect)
  better: string;      // Better/correct version
  why: string;         // Explanation in Japanese
  severity: 'minor' | 'moderate' | 'important';
}
```

### AI Response Format
The AI should include corrections in responses using special tags:
```
<correction>
{
  "said": "I want to talking",
  "better": "I want to talk",
  "why": "動詞の後は原形を使います。'want to'の後は動詞の原形が正しいです。",
  "severity": "moderate"
}
</correction>
```

### Inline Display
Correction cards appear directly in the chat flow:
1. User sends message
2. AI responds with conversation + correction tags
3. Correction is extracted and rendered as CorrectionCard component
4. Card appears below the AI's response message

## Design Principles

1. **Non-Intrusive**: Cards blend with chat but stand out enough to notice
2. **Informative**: All three pieces of info (said/better/why) visible when expanded
3. **Quick Reference**: Can collapse to save space in long conversations
4. **Color Coding**: Severity immediately visible through color
5. **Mobile Friendly**: Compact design works well on small screens

## Styling Details

- **Border Radius**: `rounded-xl` (large, friendly corners)
- **Backdrop**: Semi-transparent with blur effect
- **Padding**: 
  - Expanded: `p-3` (12px)
  - Collapsed: `p-2.5` (10px)
- **Typography**:
  - Header: `text-xs font-semibold`
  - Content: `text-xs leading-relaxed`
  - Better version: `font-semibold` for emphasis
- **Spacing**: `space-y-2` between sections (8px)
- **Transitions**: `transition-all` for smooth state changes

## Accessibility

- **Keyboard**: Header is a button, can be focused and activated with Enter/Space
- **Screen Readers**: Semantic structure with clear labels
- **Touch Targets**: Full-width clickable area for mobile
- **Color Contrast**: Text meets WCAG AA standards on colored backgrounds

## Usage Example

```tsx
import CorrectionCard from './CorrectionCard';

const correction = {
  said: "I likes reading books",
  better: "I like reading books",
  why: "主語が'I'の場合、動詞に's'は付けません。三人称単数（he/she/it）の時だけ's'を付けます。",
  severity: "important"
};

<CorrectionCard correction={correction} />
```

## Notes

- Corrections are also saved to the 補習 (Corrections) tab for later review
- Each correction becomes a `MistakeRecord` for spaced repetition practice
- The same correction appearing multiple times increments `timesSeen` counter
