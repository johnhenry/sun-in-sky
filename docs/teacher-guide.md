# Teacher Guide: Sun in Sky

A comprehensive guide for educators using the Sun in Sky solar altitude visualization tool in the classroom.

## Table of Contents
1. [Overview](#overview)
2. [Educational Value](#educational-value)
3. [Quick Start Guide](#quick-start-guide)
4. [Feature Walkthrough](#feature-walkthrough)
5. [Teaching Tips](#teaching-tips)
6. [Common Student Questions](#common-student-questions)
7. [Classroom Management](#classroom-management)
8. [Structuring a Class Session](#structuring-a-class-session)
9. [Assessment Strategies](#assessment-strategies)
10. [Differentiation Strategies](#differentiation-strategies)
11. [Technical Support](#technical-support)

---

## Overview

### What is Sun in Sky?

Sun in Sky is an interactive web application that visualizes how the sun's altitude (angle above the horizon) changes throughout the day and year at different latitudes. It helps students understand:

- Why we have seasons
- How latitude affects daylight hours
- Phenomena like midnight sun and polar nights
- The relationship between Earth's axial tilt and seasonal changes
- How other planets with different tilts would experience seasons

### Key Features at a Glance

- **Two visualization modes:** 24-hour daily view and 365-day yearly view
- **Interactive controls:** Latitude slider, axial tilt adjustment, date/time selector
- **Astronomical accuracy:** Based on real solar position calculations
- **Planetary presets:** Compare Earth, Mars, and Uranus
- **Visual learning:** Color-coded graphs with clear markers

### Recommended Grade Levels

- **Primary audience:** Grades 6-12
- **Adaptable for:** Undergraduate astronomy/geography courses
- **Core subjects:** Earth Science, Astronomy, Geography, Physics

### Time Requirements

- **Quick demo:** 5-10 minutes
- **Guided exploration:** 15-20 minutes
- **Full lesson:** 45-60 minutes
- **Lab activity:** 60-90 minutes

---

## Educational Value

### Learning Objectives

Students using this tool can:

1. **Understand** the relationship between Earth's axial tilt and seasons
2. **Explain** why different latitudes experience different amounts of daylight
3. **Predict** sun altitude at different times and locations
4. **Analyze** how seasonal changes affect various latitudes differently
5. **Compare** Earth to other planets with different axial tilts
6. **Investigate** extreme phenomena (midnight sun, polar night)

### Standards Alignment

This tool supports learning standards including:

**Next Generation Science Standards (NGSS):**
- MS-ESS1-1: Develop and use a model of the Earth-sun system
- HS-ESS1-4: Use mathematical models to predict seasonal patterns

**Common Core Math:**
- Interpreting data from graphs
- Understanding trigonometric relationships (advanced)

### Key Concepts Covered

1. **Solar altitude:** Angle of sun above horizon
2. **Declination:** Sun's position relative to equator
3. **Axial tilt:** Earth's 23.45° tilt and its effects
4. **Solstices:** Maximum and minimum declination
5. **Equinoxes:** Equal day and night
6. **Arctic/Antarctic circles:** Regions experiencing extreme day/night
7. **Tropics of Cancer/Capricorn:** Northernmost/southernmost direct overhead sun

---

## Quick Start Guide

### First Time Setup (5 minutes)

1. **Access the application:**
   - Open in web browser (Chrome, Firefox, Safari, Edge)
   - If deployed, bookmark the URL
   - If running locally: `npm run dev` then open http://localhost:5173

2. **Test basic controls:**
   - Click the play button to animate sun movement
   - Drag the timeline slider
   - Toggle between "24 Hours" and "365 Days" views
   - Adjust latitude slider

3. **Familiarize yourself with the display:**
   - Orange dashed line = horizon (0°)
   - Yellow/orange curve = sun's path
   - Purple dot = current position
   - Stats bar shows key information

### Your First Demonstration (10 minutes)

**Goal:** Show students how seasons work

1. **Start with defaults:**
   - Latitude: 45° (mid-latitude)
   - Date: June Solstice
   - View: 24 Hours

2. **Demonstrate summer:**
   - "Notice the sun rises high in the sky (60°+)"
   - "Look at the daylight hours: about 15-16 hours"
   - Click the play button to show the sun's path

3. **Switch to winter:**
   - Click "Dec Solstice" preset
   - "Now the sun barely gets above 20°"
   - "Daylight: only about 8-9 hours"

4. **Show why this happens:**
   - Switch to "365 Days" view
   - "The sun's path changes throughout the year"
   - "This is caused by Earth's tilt" (show axial tilt slider)

5. **Compare to equator:**
   - Change latitude to 0°
   - "At the equator, daylight is always about 12 hours"
   - "The sun's path changes less dramatically"

**Student takeaway:** Earth's tilt + latitude = seasonal differences

---

## Feature Walkthrough

### 1. View Modes

#### 24 Hours View (Daily)
- **What it shows:** Sun's path across the sky during one day
- **X-axis:** Time of day (00:00 to 24:00)
- **Best for:** Understanding daily sun movement, sunrise/sunset times
- **Teaching tip:** Start here - it's more intuitive for students

**Key features in this view:**
- Sunrise marker (orange circle) where curve crosses horizon
- Sunset marker (red/pink circle)
- Equinox reference line (gray dashed) - shows difference from equal-day
- Daylight hours displayed in stats

#### 365 Days View (Yearly)
- **What it shows:** How sun's altitude at a specific time changes through the year
- **X-axis:** Months (Jan - Dec)
- **Best for:** Understanding seasonal patterns, annual cycles
- **Teaching tip:** Use after students understand daily view

**Key features in this view:**
- Season markers (Spring, Summer, Fall, Winter)
- Shows the "wave" pattern of seasonal change
- Demonstrates solstices (peaks/valleys) and equinoxes (crossings)

### 2. Primary Controls

#### Latitude Slider (-90° to +90°)
- **What it does:** Changes location from South Pole to North Pole
- **Visual markers:**
  - Yellow ticks: Tropics (±23.45°)
  - Blue ticks: Arctic Circles (±66.55°)
- **Quick presets:** Click labels for instant jumps

**Teaching progression:**
1. Start at 0° (Equator) - minimal seasonal variation
2. Move to 45° (mid-latitude) - moderate seasons
3. Try 70° (Arctic) - extreme seasonal variation
4. Compare 45° North vs -45° South - opposite seasons!

#### Axial Tilt Slider (0° to 90°)
- **What it does:** Changes Earth's tilt (or simulates other planets)
- **Earth's actual tilt:** 23.45°
- **Presets available:**
  - 0° - No tilt (no seasons!)
  - 23.4° - Earth
  - 25.2° - Mars
  - 82.2° - Uranus (extreme!)

**"What if?" scenarios:**
- 0° tilt: "What if Earth wasn't tilted?" (Always 12-hour days everywhere!)
- 45° tilt: "What if tilt was doubled?" (Arctic Circle at 45°!)
- 90° tilt: "Extreme example" (Entire hemispheres in darkness for 6 months!)

**Derived values to point out:**
- Tropics are located at ± tilt angle
- Arctic Circles at ± (90° - tilt)
- These update automatically as you adjust tilt!

#### Date/Time Control
- **Timeline slider:** Drag to change date and time
- **Play button:** Animate sun movement (auto-pause at end)
- **Date presets:** Quick jumps to key dates
  - Jan 1
  - Mar Equinox (~ Mar 20)
  - Jun Solstice (~ Jun 21)
  - Sep Equinox (~ Sep 22)
  - Dec Solstice (~ Dec 21)
- **Time presets:** Midnight, Dawn, Noon, Dusk

**Teaching tip:** Use presets for quick comparisons. Have students predict what they'll see before clicking!

### 3. Y-Axis Modes

Located in top-right controls:

#### Auto (Dynamic)
- **Default mode**
- Automatically zooms to show the sun's path clearly
- Best for: Most classroom uses
- Adjusts range based on current data

#### ±90° (Fixed)
- Shows full range from horizon to zenith
- Best for: Comparing very different scenarios
- Maintains consistent scale

#### ±135° (Wide)
- Shows "impossible" zones (sun can't go below -90° or above +90°)
- Red shaded areas = physically impossible
- Best for: Advanced discussions about coordinate systems

**When to use each:**
- Start with Auto for clarity
- Switch to ±90° when comparing summer vs winter
- Use ±135° for advanced students discussing limits

### 4. Information Display

#### Stats Bar
Shows real-time information:

- **Altitude:** Current sun angle (-90° to +90°)
  - Positive = above horizon (day)
  - Negative = below horizon (night)
- **Declination:** Sun's position (-23.45° to +23.45° for Earth)
  - 0° at equinoxes
  - +23.45° at June solstice
  - -23.45° at December solstice
- **Daylight:** Hours of sunlight (24-hour view only)
- **Sunrise/Sunset times:** When available (normal days only)
- **Special markers:**
  - "Midnight Sun" when sun never sets
  - "Polar Night" when sun never rises

#### Graph Elements

**Color coding:**
- Yellow/orange gradient = sun's path
- Purple dot = current time/position
- Orange dashed line = horizon (0°)
- Gray dashed line = equinox reference (daily view)
- Dark overlay = nighttime (below horizon)
- Orange circle = sunrise
- Red/pink circle = sunset

**Seasonal markers (yearly view):**
- Green line = Spring equinox
- Yellow line = Summer solstice
- Orange line = Fall equinox
- Blue line = Winter solstice

---

## Teaching Tips

### Starting Points by Topic

#### Teaching Seasons
1. Set latitude to 45° (student's local latitude even better!)
2. Start with June Solstice, 24-hour view
3. Show high sun path and long daylight
4. Jump to December Solstice
5. Discuss why the difference exists
6. Adjust axial tilt to 0° - "What if no tilt?"
7. Switch to 365-day view to see full cycle

#### Teaching Latitude Effects
1. Keep date constant (pick an equinox for simplicity)
2. Start at equator (0°)
3. Move gradually northward (0° → 30° → 60° → 90°)
4. Have students note changes in max altitude and daylight
5. Compare northern and southern hemisphere at same absolute latitude
6. Discuss why polar regions are cold

#### Teaching Equinoxes vs Solstices
1. Use 45° latitude for clear differences
2. 24-hour view
3. Set to March Equinox
4. Note: ~12 hours daylight, moderate maximum altitude
5. Jump to June Solstice
6. Note: More daylight, higher sun
7. Compare to December Solstice
8. Switch to yearly view to see the pattern

#### Teaching Extreme Phenomena
1. Set latitude to 70° (above Arctic Circle)
2. June Solstice
3. 24-hour view
4. Show midnight sun (sun never sets!)
5. Switch to December Solstice
6. Show polar night (sun never rises!)
7. Explain Arctic Circle definition: latitude where this starts
8. Show how tilt determines where Arctic Circle is located

### Inquiry-Based Learning Prompts

**Prediction questions:**
- "What do you think will happen if we increase the latitude to 80°?"
- "Before I click December Solstice, predict: will daylight be longer or shorter than June?"
- "If we reduce Earth's tilt to 10°, how will this affect the Arctic Circle?"

**Investigation questions:**
- "Find a latitude where the sun is directly overhead (90°) at noon on June Solstice"
- "Determine what time the sun rises on your birthday at your latitude"
- "Can you find a date and latitude where there's exactly 18 hours of daylight?"

**Analysis questions:**
- "Why does the equator always have about 12 hours of daylight?"
- "Explain why summer in the Northern Hemisphere is winter in the Southern Hemisphere"
- "How would life be different on a planet with 0° axial tilt?"

### Common Misconceptions to Address

**Misconception #1:** "Summer is when Earth is closer to the sun"
- **Reality:** Distance varies only 3%, tilt is the key factor
- **Demo:** Show how Northern and Southern hemispheres have opposite seasons at the same time
- **If distance mattered:** Both hemispheres would be hot/cold together!

**Misconception #2:** "The sun rises in the exact east every day"
- **Reality:** Only true at equinoxes
- **Demo:** Compare sunrise positions at summer vs winter solstice at mid-latitude
- **Show:** Sun rises northeast in summer, southeast in winter (Northern Hemisphere)

**Misconception #3:** "The equator is always hot because the sun is overhead"
- **Reality:** Sun is only directly overhead (90°) twice per year at equator
- **Demo:** Show equator on equinoxes (90° at noon) vs solstices (~67°)
- **Clarify:** Equator is warm because sun is always high (never winter-low angles)

**Misconception #4:** "Daylight hours change the same everywhere"
- **Reality:** Polar regions have extreme changes, equator has minimal
- **Demo:** Compare latitude 0° and 70° on yearly view
- **Visual:** Equator's line is nearly flat, polar line has huge amplitude

**Misconception #5:** "Arctic Circle is at a random latitude"
- **Reality:** It's mathematically determined by tilt (90° - tilt)
- **Demo:** Adjust tilt slider and watch Arctic Circle markers move!
- **Formula:** Arctic Circle = 90° - axial tilt

---

## Common Student Questions

### Basic Questions

**Q: "What is solar altitude?"**
**A:** It's the angle between the sun and the horizon. Think of it like looking up at the sun:
- 0° = sun right on the horizon (sunrise/sunset)
- 90° = sun directly overhead (zenith)
- Negative values = sun below horizon (nighttime)

**Q: "Why does the line curve?"**
**A:** It shows how the sun's height changes throughout the day/year. The curve shape comes from Earth's rotation and orbit.

**Q: "What's the orange dashed line?"**
**A:** That's the horizon - 0°. Above it is daytime (sun visible), below it is nighttime (sun below horizon).

**Q: "Why are there two views?"**
**A:**
- 24 Hours: See what happens during one day
- 365 Days: See what happens throughout a whole year

### Intermediate Questions

**Q: "Why does summer have more daylight hours?"**
**A:** When Earth's axis tilts toward the sun (summer), your hemisphere gets more direct sunlight and longer days. Show this by:
1. Set latitude to 45°
2. Compare Jun Solstice (16 hours) vs Dec Solstice (8 hours)
3. Explain: Same location, different tilt direction

**Q: "What's declination?"**
**A:** It's the sun's position north or south of the equator:
- 0° at equinoxes (sun crosses equator)
- +23.45° at June solstice (sun is north)
- -23.45° at December solstice (sun is south)
- This is what causes seasons!

**Q: "Why doesn't the equator have seasons?"**
**A:** It does, but they're very subtle! Show:
1. Set latitude to 0°
2. 365-day view
3. Note: Line is nearly flat
4. Explain: Sun is always high (67°-90°), always ~12-hour days

**Q: "What causes midnight sun?"**
**A:** When you're above the Arctic Circle (or below Antarctic) during summer solstice, Earth's tilt keeps the sun above the horizon all day. Demonstrate:
1. Latitude 70°
2. June Solstice
3. 24-hour view
4. Show: Sun dips low but never goes below horizon

### Advanced Questions

**Q: "Why is the Arctic Circle at 66.5° latitude?"**
**A:** It's mathematically related to Earth's tilt:
- Arctic Circle = 90° - 23.45° (tilt) = 66.55°
- This is the southernmost latitude that experiences midnight sun
- Try adjusting tilt - watch the Arctic Circle markers move!

**Q: "Would Mars have seasons like Earth?"**
**A:** Yes! Mars has 25.2° tilt (close to Earth's 23.45°). Try:
1. Set axial tilt to 25.19° (Mars preset)
2. Notice: Very similar to Earth!
3. Mars seasons are about twice as long (687-day year)

**Q: "What if Earth had no tilt?"**
**A:** No seasons! Demonstrate:
1. Set tilt to 0°
2. Notice educational note appears
3. Show: Every latitude has exactly 12 hours of daylight year-round
4. Sun's maximum altitude never changes

**Q: "Why is winter colder if the sun is above horizon for hours?"**
**A:** Altitude matters more than duration! Show:
1. 45° latitude, December Solstice
2. Sun reaches only ~20° maximum
3. Low angle = sunlight spread over larger area = less heating
4. Compare to June: 70° altitude = concentrated sunlight

**Q: "Can the sun ever be directly overhead where I live?"**
**A:** Only if you live between the Tropics! Try:
1. Set latitude to student's location
2. Try different dates
3. If max altitude never reaches 90°, explain:
   - Sun is only overhead between ±23.45° (the tropics)
   - This is the farthest north/south the sun's declination reaches

---

## Classroom Management

### Projector Setup

**Recommended approach:**
1. Use demo computer connected to projector
2. Keep student devices closed during introduction
3. Open students' devices for guided exploration
4. Use "I do, we do, you do" progression

**Display tips:**
- Application is responsive and works well on projectors
- Dark theme is easy on eyes in darkened room
- Increase browser zoom if needed (Ctrl/Cmd +)
- Full-screen mode (F11) removes browser UI

**Presentation mode workflow:**
1. Start with defaults visible
2. Make one change at a time
3. Pause and ask for predictions before changing variables
4. Use presets for quick, dramatic comparisons

### Student Device Setup

**Options:**

**Option 1: Web-based (Recommended)**
- Deploy to web (see Deployment Guide)
- Students access via URL
- No installation needed
- Works on any device with browser
- Easy to update for all students

**Option 2: Shared computer**
- One computer, students take turns
- Good for small groups or station rotation
- Requires less setup

**Option 3: Local installation**
- Each student computer runs local copy
- Requires Node.js installation
- More setup time but works offline
- Good for computer labs

**Recommended device configurations:**
- **Individual:** Each student on own laptop/tablet
- **Pairs:** Two students share one device (encourages discussion!)
- **Small groups:** 3-4 students, one device (good for guided inquiry)
- **Whole class:** Projector only (teacher-led demonstration)

### Managing Exploration Time

**Structured exploration (Recommended for first use):**
1. **Introduction (5 min):** Teacher demo of basic features
2. **Guided practice (10 min):** Specific tasks with checkpoints
3. **Free exploration (10 min):** Students investigate their own questions
4. **Share out (5 min):** Students present discoveries

**Free exploration (For experienced students):**
- Provide guiding questions or investigation worksheet
- Set specific goals (e.g., "Find 3 examples of midnight sun")
- Circulate and ask probing questions
- Have students document findings

**Preventing off-task behavior:**
- Clear expectations and time limits
- Specific tasks to complete
- Require documentation (screenshots, written observations)
- Accountability structure (partner check-ins, exit ticket)

### Group Work Strategies

**Think-Pair-Share:**
1. Individual prediction (30 sec)
2. Discuss with partner (1 min)
3. Test prediction using app (1 min)
4. Share with class (2 min)

**Jigsaw:**
1. Assign each group a latitude (0°, 30°, 60°, 90°)
2. Groups investigate their latitude at different seasons
3. Groups present findings
4. Class compares patterns

**Station rotation:**
- Station 1: Equator investigation
- Station 2: Mid-latitude seasons
- Station 3: Polar phenomena
- Station 4: Planetary comparisons
- Rotate every 10 minutes

---

## Structuring a Class Session

### 5-Minute Quick Demo

**Goal:** Hook students, introduce concept

1. **Opening question (1 min):**
   - "Why is it warmer in summer than winter?"
   - Take 2-3 student responses

2. **Demonstration (3 min):**
   - Open app, 45° latitude
   - Compare June vs December solstice
   - Show altitude and daylight differences

3. **Closing (1 min):**
   - "This tool shows why: Earth's tilt changes sun's angle"
   - Preview: "We'll explore this more next class"

### 15-Minute Guided Exploration

**Goal:** Students understand latitude and season relationship

**Introduction (3 min):**
- Demo basic controls
- Explain graph elements
- Show one comparison

**Guided activity (10 min):**
Give students specific tasks:
1. Set latitude to your city's latitude
2. Find sun's altitude on your birthday at noon
3. Compare to 6 months later
4. Change latitude to equator - what's different?

**Debrief (2 min):**
- What patterns did you notice?
- Share one surprising discovery

### 45-Minute Full Lesson

**Goal:** Deep understanding of seasons and latitude

**Engage (5 min):**
- Hook: "Has anyone experienced midnight sun or very long summer days?"
- Show dramatic example: 80° latitude, June solstice, 24-hour view

**Explore (15 min):**
- Student investigation worksheet (see Classroom Activities)
- Partners explore different latitudes
- Document patterns and observations

**Explain (10 min):**
- Teacher-led synthesis
- Connect observations to Earth's tilt
- Use app to demonstrate key concepts
- Address misconceptions

**Elaborate (10 min):**
- "What if" scenarios: different axial tilts
- Compare to other planets
- Predict and test

**Evaluate (5 min):**
- Exit ticket: Draw expected sun path for given scenario
- Quick quiz using app scenarios
- Share one new learning

### 90-Minute Lab Activity

**Goal:** Student-driven inquiry and data collection

**Introduction (10 min):**
- Review tool features
- Present inquiry question or lab objective
- Review data collection expectations

**Investigation (50 min):**
- Students work in pairs
- Systematic variation of one parameter
- Data collection in organized tables
- Create graphs or visualizations

**Analysis (20 min):**
- Identify patterns in data
- Answer analysis questions
- Connect to underlying principles

**Presentation (10 min):**
- Groups share findings (2-3 min each)
- Class discussion of patterns
- Teacher highlights key concepts

---

## Assessment Strategies

### Formative Assessment

**During-class checks:**

1. **Thumbs up/down predictions:**
   - "Will daylight be longer at 60° or 30° on June 21?"
   - Students predict, then verify with app

2. **Think-Pair-Share:**
   - Pose question
   - Students think individually
   - Discuss with partner
   - Share with class

3. **Whiteboard responses:**
   - Students sketch predicted sun path
   - Show on count of 3
   - Test prediction with app

4. **Exit tickets:**
   - Quick question at end of class
   - Can include screenshot from app
   - Check understanding before next lesson

**Observation checklist:**
While students work, observe:
- [ ] Can navigate between view modes
- [ ] Adjusts controls purposefully
- [ ] Recognizes patterns in data
- [ ] Makes connections to Earth science concepts
- [ ] Can explain observations to partner

### Summative Assessment

**Option 1: Interpretation assessment**
Provide screenshot from app with specific settings:
- Identify latitude
- Identify season/date
- Predict daylight hours
- Explain why pattern occurs
- Compare to different scenario

**Option 2: Prediction assessment**
Describe scenario in words:
- Student must predict what graph will look like
- Draw expected sun path
- Estimate key values (max altitude, daylight hours)
- Explain reasoning

**Option 3: Investigation report**
Student-designed investigation:
- Pose question
- Collect data using app
- Create graphs
- Draw conclusions
- Connect to course concepts

**Option 4: Comparison project**
Compare two scenarios:
- Different latitudes
- Different dates
- Different planets
- Present findings with screenshots and explanations

**Rubric categories:**
- Accurate data collection
- Clear visual representations
- Correct interpretation
- Connection to concepts (tilt, seasons, latitude)
- Communication of ideas

### Application Questions

**Understanding level:**
1. What is the sun's altitude at noon on March 20 at the equator?
2. At what time does the sun rise on December 21 at 45°N?
3. How many hours of daylight are there on June 21 at 60°N?

**Application level:**
1. Why does the Arctic Circle experience midnight sun?
2. Explain why Singapore (near equator) doesn't have seasons like New York.
3. How would doubling Earth's tilt affect your local climate?

**Analysis level:**
1. Compare sun paths at 30°N and 30°S on the same date. What do you notice?
2. Why is the Arctic Circle located at 66.55°N? How is this related to Earth's tilt?
3. Analyze how life would be different on a planet with 45° axial tilt.

**Synthesis level:**
1. Design a planet with specific seasonal characteristics. What tilt would it need?
2. Create a travel guide for tourists visiting northern Norway in summer. Use the app to provide specific sunrise/sunset data.
3. Evaluate the claim: "Seasons are caused by Earth's distance from the sun."

---

## Differentiation Strategies

### For Struggling Students

**Simplified approach:**
1. Focus on 24-hour view only
2. Use only preset buttons (avoid sliders initially)
3. Limit variables: keep tilt at Earth's 23.45°
4. Compare only two scenarios at a time
5. Provide step-by-step worksheets with screenshots

**Scaffolding strategies:**
- Pre-labeled screenshots
- Sentence frames for observations
- Word bank for scientific vocabulary
- Guided questions with hints
- Partner with stronger student (peer teaching)
- Reduced number of scenarios to investigate

**Vocabulary support:**
- Visual glossary with app screenshots
- Key terms highlighted in different colors
- Reference sheet always available
- Practice using terms in context

**Alternative assessments:**
- Verbal explanation instead of written
- Multiple choice interpretation questions
- Matching activity (scenario to graph)
- Guided completion rather than open-ended

### For Advanced Students

**Extended challenges:**
1. Use 365-day view extensively
2. Adjust axial tilt freely
3. Make mathematical predictions before testing
4. Investigate multiple variables simultaneously
5. Create complex "what if" scenarios

**Enrichment activities:**
- Calculate exact sunrise/sunset times using formulas
- Research how other factors affect seasons (elliptical orbit, precession)
- Compare app data to actual astronomical data for verification
- Create presentation explaining seasons to younger students
- Design extension features for the app

**Open-ended investigations:**
- "Design a planet with interesting seasonal characteristics"
- "Find the latitude with the most extreme seasonal variation"
- "Determine the relationship between tilt angle and Arctic Circle latitude"
- "Create a mathematical model for predicting daylight hours"

**Cross-curricular connections:**
- Math: Trigonometric calculations of sun position
- History: Historical navigation using sun position
- Literature: Authors' descriptions of seasons at different latitudes
- Art: How sun angle affects photography and shadows

### For English Language Learners

**Language support:**
- Translated vocabulary lists
- Visual instructions with minimal text
- Icons and symbols for key concepts
- Bilingual partner support
- Allow response in native language initially

**Reduced language load:**
- Use numbers and graphs primarily
- Point and click exploration
- Non-verbal response options (thumbs up/down)
- Drawing and labeling instead of writing
- Focus on "show me" rather than "tell me"

**Visual learning emphasis:**
- Color-coded annotations
- Arrows and labels on screenshots
- Graphic organizers for observations
- Charts and data tables
- Video demonstrations

### For Students with Special Needs

**Accessibility considerations:**
- App has good color contrast (dark theme)
- Increase zoom for vision support
- Simplify tasks to reduce cognitive load
- Allow extra time for processing
- Break activities into smaller steps

**Modifications:**
- Reduce number of parameters to investigate
- Provide pre-filled data tables
- Use larger displays (tablet vs phone)
- Allow verbal responses
- Provide templates for organizing information

**Sensory-friendly:**
- App has no flashing or rapid movement
- Optional play feature (students control pacing)
- Visual-only (no sound requirements)
- Works well in various lighting conditions

---

## Technical Support

### Browser Compatibility

**Fully supported:**
- Chrome/Chromium (version 90+)
- Firefox (version 88+)
- Safari (version 14+)
- Edge (version 90+)

**Mobile browsers:**
- iOS Safari (iOS 14+)
- Chrome Mobile (Android 8+)
- Samsung Internet

**Not supported:**
- Internet Explorer (use Edge instead)

### Device Requirements

**Minimum:**
- Screen: 320px width (small phone)
- RAM: 2GB
- Internet: Only needed for initial load (then works offline)
- JavaScript: Must be enabled

**Recommended:**
- Screen: 768px+ width (tablet or larger)
- RAM: 4GB+
- Modern browser (updated within last year)

### Common Issues & Solutions

**Issue: Graph doesn't display**
- Check browser compatibility
- Enable JavaScript
- Refresh page (Ctrl+R or Cmd+R)
- Clear browser cache
- Try different browser

**Issue: Controls not responding**
- Ensure page fully loaded
- Check for browser extensions blocking JavaScript
- Try in incognito/private mode
- Refresh page

**Issue: Layout looks wrong**
- Zoom reset: Ctrl+0 (Cmd+0 on Mac)
- Try different browser
- Update browser to latest version
- Check screen orientation (portrait vs landscape)

**Issue: Slow performance**
- Close other browser tabs
- Restart browser
- Update browser
- Try on different device
- Reduce browser zoom

**Issue: Can't access deployed site**
- Check URL spelling
- Try different network (school WiFi vs cellular)
- Contact IT if school firewall may be blocking
- Try alternative deployment URL
- Use local installation as backup

### Getting Help

**In-class support:**
1. Check this troubleshooting section
2. Ask tech-savvy student for help
3. Contact IT department
4. Use backup activity while resolving

**Pre-class testing:**
- Test on actual student devices
- Test on school network
- Have backup plan ready
- Bookmark reliable URL

**IT department information to provide:**
- App URL
- Purpose: Educational astronomy visualization
- Required: Web browser access to deployed site
- No installation needed
- Safe: Static educational content only

### Offline Backup

If internet access is unreliable:

**Option 1: Local installation**
```bash
npm install
npm run dev
```
Access at http://localhost:5173

**Option 2: Screenshots**
- Pre-capture key scenarios
- Use in presentation mode
- Less interactive but reliable

**Option 3: Video recording**
- Record screen while demonstrating app
- Play video if live app unavailable
- Still effective for demonstrations

---

## Additional Resources

### Supplementary Materials

**Astronomy resources:**
- NOAA Solar Calculator: https://www.esrl.noaa.gov/gmd/grad/solcalc/
- Stellarium (planetarium software): https://stellarium.org
- Time and Date sun position: https://www.timeanddate.com/sun/

**Standards alignment:**
- NGSS: https://www.nextgenscience.org
- State standards: Check your state education department

**Professional development:**
- NSTA (National Science Teaching Association): https://www.nsta.org
- NASA Education: https://www.nasa.gov/stem-ed-resources

### For Teachers New to This Concept

**Self-study resources:**
1. Start by exploring the app yourself (30 min)
2. Watch YouTube: "Why Earth has seasons"
3. Read about solar declination and altitude
4. Practice explaining concepts out loud
5. Try the classroom activities yourself

**Preparation checklist:**
- [ ] Explored all app features
- [ ] Tested on student devices
- [ ] Prepared guiding questions
- [ ] Created handouts/worksheets
- [ ] Identified learning objectives
- [ ] Planned formative assessments
- [ ] Prepared backup activity
- [ ] Tested projector setup

---

## Quick Tips Summary

### Top 10 Teaching Tips

1. **Start simple:** Use 24-hour view and presets before free exploration
2. **Predict first:** Always have students predict before revealing
3. **One change at a time:** Don't adjust multiple variables simultaneously
4. **Use local context:** Start with your city's latitude
5. **Compare extremes:** Show equator vs pole, summer vs winter
6. **Address misconceptions:** Explicitly discuss distance vs tilt
7. **Let them play:** Guided exploration is powerful
8. **Connect to experience:** Link to students' real observations
9. **Use visuals:** Screenshots in notes, on tests, in presentations
10. **Practice beforehand:** Be comfortable with all features

### Top 5 Classroom Management Tips

1. **Set clear expectations:** "You have 10 minutes to find X"
2. **Use accountability:** Exit tickets, partner checks
3. **Monitor actively:** Circulate and ask probing questions
4. **Provide structure:** Worksheets for guided exploration
5. **Share discoveries:** Create culture of sharing findings

### Top 3 Assessment Tips

1. **Mix formats:** Use prediction, interpretation, and explanation questions
2. **Include visuals:** Screenshots make questions more engaging
3. **Connect to standards:** Align with learning objectives

---

**You're ready to teach with Sun in Sky!**

For specific activities, see [Classroom Activities](classroom-activities.md)

For deployment help, see [Deployment Guide](deployment.md)

For quick reference, see [Quick Reference](quick-reference.md)
