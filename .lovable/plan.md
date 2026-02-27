

# Shift — AI-Powered Perimenopause Companion

A mobile-first web app with 4 screens, warm muted-purple design, and affirming tone throughout.

## Design System
- Color palette: Muted purples (lavender, soft plum), warm neutrals (cream, taupe, soft gray)
- Rounded corners, generous spacing, soft shadows
- Typography: Clean, humanizing, generous line-height
- Mobile-first layout (max-width ~430px centered)

## Screen 1: Onboarding / Symptom Check-In
- Warm welcome header: "What have you been experiencing?"
- Symptom chips grouped into 4 categories (Mood & Mind, Sleep, Body, Cycle) with multi-select
- After selecting symptoms, show an affirming AI-generated response card at the bottom
- "Continue" button to proceed to Home

## Screen 2: Home / Daily Log
- Streak counter at top ("5-day streak 🔥")
- Mood slider (1–10) with label "How are you feeling today?"
- Sleep quality (1–5 stars)
- Symptom quick-tag row (from onboarding selections)
- Cycle status selector (Period / Spotting / None)
- Open text field ("Anything else to note?")
- "Log Today" button
- Data persisted in local storage

## Screen 3: Pattern Insights
- Note at top: "Insights appear after 7 days of logging"
- 2–3 AI-generated insight cards with soft icons showing correlations between logged symptoms
- Cards use affirming, plain-language tone
- Mock insights shown initially, with structure ready for real AI analysis

## Screen 4: Doctor Report
- Symptom frequency table (symptom, days logged, severity)
- "Key Patterns" section with bullet points
- Plain-language summary paragraph
- Toggle for "Clinical language" that switches summary to medical terminology
- "Download PDF" button and "Copy Summary" button

## Navigation
- Bottom tab bar with icons for all 4 screens (Check-In, Log, Insights, Report)
- Onboarding only shows on first visit, then defaults to Daily Log as home

## Data & State
- All data stored in localStorage (no backend needed initially)
- Symptom selections, daily logs, and streak tracking
- AI insights and report content generated from mock data patterns

