# Final Report Observations

## Top 5 Candidates and Why We Picked Them

Our top 5 candidates were **20, 10, 14, 17, and 26**.

We chose these because:

- **Candidate 26** had a different UI look compared to the rest, with lighter colors.
- **Candidate 17** had more features than most of the other candidates.
- **Candidate 14** had a live commentary feed.
- **Candidate 10** had a lever and generally nice animation with sound.
- **Candidate 20** made fun of AI the best.

Overall, we thought these five candidates followed our rubric better than the others. They had decent animations, followed the prompt most accurately, and included extra features that matched the theme of making fun/poking at AI.

## Other Notes

We noticed that many of the candidates had very similar layouts and color schemes, even though they were generated independently.

Some repeated patterns we observed were:

- AI often reused **white/gold** and **blue/purple** color schemes in the UI.
- Many candidates linked the JavaScript file at the bottom of the HTML file in similar ways.
- Indentation patterns were often very similar across different candidates.

---

## 1st Refinement

### Candidates Continued
10, 14, 17, 20, 26

### Reasoning
For the first refinement, we gave the context of the original prompt and specified features that we liked from existing slot machine versions. We asked the AI to add code comments and spinning animation for the slot reels.

### Actual Prompt
> This is the previous prompt as context: "Create a slot machine app that uses vanilla web technology like HTML, CSS, JavaScript, and platform APIs. The slot machine should make fun of AI, as if you are winning tokens and spending tokens." Just add comments to the code, and the spinning animation rolls.

### Result
Not all files got the spinning animation. Some of the features we liked from earlier versions were removed during refinement. In addition, when we asked for comments, the AI mostly added comments only for the new features instead of documenting the whole file as we expected.

This showed a flaw in our prompt. We should have asked for documentation more explicitly instead of just asking for comments.

### Observations
- Some candidates lost features.
- Some candidates failed to implement spinning animation correctly.

### Going Forward
We decided to continue with **Candidates 14, 17, and 20** because they had correct slot spin animations and good overall functionality.

### Average Token Usage
The Average token usage across the three candidates is 21,000

---

## 2nd Refinement

### Reasoning
For the second refinement, we again included the original prompt as context and corrected our earlier mistake. Instead of asking for comments, we asked for file headers and documentation. We also told the AI not to remove existing functionality, to add back game history, and to keep everything consistent throughout all files.

### Actual Prompt
> This is the previous prompt as context: "Create a slot machine app that uses vanilla web technology like HTML, CSS, JavaScript, and platform APIs. The slot machine should make fun of AI, as in you are winning tokens and spending tokens." Include file headers that describe the file's purpose and include documentation in each file. Don't remove existing functionality, just add onto based on our requests. Add a section with slot game history onto the UI. Make sure everything is consistent throughout all files.

### Result
A few of the files interpreted "game history" as the history of slot machines rather than the history of game results. The files now included header information, and comments appeared throughout the tops of functions, but the AI still did not add proper JSDoc documentation.

### Going Forward
We decided to continue with **Candidates 14 and 20**, since they had good UI and features. We felt that **Candidate 17** became overcomplicated.

### Average Token Usage 
The Average token usage across the two candidates is 5,000 tokens

---

## 3rd Refinement

### Reasoning
For the third refinement, we continued including the original prompt so the AI would keep the full project context. This time, we wanted stronger code documentation for functions rather than just sparse comments and headers. We also asked for sound effects and a proper live game activity feed. Finally, we added the phrase **"code like a senior engineer"** in hopes that it would improve code quality.

### Actual Prompt
> "Create a slot machine app that uses vanilla web technology like HTML, CSS, JavaScript, and platform APIs. The slot machine should make fun of AI, as in you are winning tokens and spending tokens." Make sure you include code documentation in each file with JSDocs commenting for each JS function. Make sure you include functionality for sound effects. Remove the section about game history and add a live game activity feed. Code like a senior engineer.

### Result
- **Candidate 20** now had sound, comments for every function, and an accurate live activity feed. Overall, it looked very solid.
- **Candidate 14** also had sound, comments for every function, and brought back the live activity feed it originally had.

It seemed that asking it to "code like a senior engineer" may have helped, because the implementations ran more smoothly.

### Going Forward
We chose to move forward with **Candidate 20** because **Candidate 14** did not include an option to restart or a way to get more tokens once the user ran out.

### Token Usage
Used 13,954 tokens

---

## 4th Refinement

### Reasoning
For the fourth refinement, we focused on only one candidate so we could be more specific. We asked the AI to add a visual slot machine lever and redo the UI with our team color palette: **red, gold, and black**. We also included the phrases **"think like a product manager"** and **"code like a senior engineer"** while telling it to maintain current functionality and avoid mistakes.

### Actual Prompt
> This is the previous prompt as context: "Create a slot machine app that uses vanilla web technology like HTML, CSS, JavaScript, and platform APIs. The slot machine should make fun of AI, as in you are winning tokens and spending tokens." Add a visual slot machine pulling lever instead of the button with text. Redo the entire UI color theme to red, gold, and black. Think like a product manager and code like a senior engineer. Ensure you maintain current functionality. Make no mistakes.

### Result
The results were successful. We got:

- A functioning lever in the UI
- An accurate live code/activity feed
- The red, gold, and black color scheme we wanted

Everything looked good and included the functionality we wanted.

### Token Usage
Used 6,527 tokens

---

## Final Outcome

After multiple rounds of refinement, we selected **Candidate 20** as the strongest final version. It best balanced UI quality, AI-themed humor, documentation, sound effects, live activity feed functionality, and overall completeness. 

## Token Usage

We used codex two diffrent ways (The application and cli). We noticed when we used the app, it took a longer time which also used
more tokens in result. But when we used the codex via cli, it used less tokens and yielded us a shorter time. 